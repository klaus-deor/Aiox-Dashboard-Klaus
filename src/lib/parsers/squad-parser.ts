import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { SQUADS_DIR } from "../constants";
import { parseSingleAgent, normalizeIcon } from "./agent-parser";
import type { Agent, Squad } from "../types";

/** Count files in a directory, return 0 if dir doesn't exist */
async function countFiles(dir: string, ext?: string): Promise<number> {
  try {
    const files = await fs.readdir(dir);
    return ext ? files.filter((f) => f.endsWith(ext)).length : files.length;
  } catch {
    return 0;
  }
}

export async function parseAllSquads(): Promise<Squad[]> {
  try {
    const entries = await fs.readdir(SQUADS_DIR, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory());

    const squads = await Promise.all(
      dirs.map((dir) => parseSingleSquad(path.join(SQUADS_DIR, dir.name)))
    );

    return squads.filter(Boolean) as Squad[];
  } catch {
    return [];
  }
}

async function parseSingleSquad(squadDir: string): Promise<Squad | null> {
  const configPath = path.join(squadDir, "config.yaml");
  const squadYamlPath = path.join(squadDir, "squad.yaml");

  try {
    let configContent: string;
    try {
      configContent = await fs.readFile(configPath, "utf-8");
    } catch {
      configContent = await fs.readFile(squadYamlPath, "utf-8");
    }
    const config = yaml.load(configContent) as Record<string, unknown>;
    if (!config || typeof config !== "object") return null;

    const pack = (config.pack || {}) as Record<string, unknown>;
    const metadata = (config.metadata || {}) as Record<string, unknown>;
    const aios = (config.aios || {}) as Record<string, unknown>;
    const squadName = String(
      config.name || pack.name || path.basename(squadDir)
    );

    // Parse squad agents from their .md files
    const agentsDir = path.join(squadDir, "agents");
    let agents: Agent[] = [];

    try {
      const agentFiles = await fs.readdir(agentsDir);
      const mdFiles = agentFiles.filter(
        (f) => f.endsWith(".md") && f !== "CLAUDE.md"
      );
      const parsed = await Promise.all(
        mdFiles.map((f) =>
          parseSingleAgent(path.join(agentsDir, f), "squad", squadName)
        )
      );
      agents = parsed.filter(Boolean) as Agent[];
    } catch {
      // No agents directory
    }

    const components = (config.components || {}) as Record<string, unknown>;
    const configAgents = (config.agents || components.agents) as unknown[] | undefined;
    const configTasks = (config.tasks || components.tasks) as unknown[] | undefined;
    const configWorkflows = (config.workflows || components.workflows) as unknown[] | undefined;

    // Count from config arrays, fallback to counting files in directories
    const taskCount =
      configTasks?.length ??
      (await countFiles(path.join(squadDir, "tasks"), ".md"));
    const workflowCount =
      configWorkflows?.length ??
      (await countFiles(path.join(squadDir, "workflows"), ".yaml"));

    // Score: check top-level, then metadata
    const rawScore = config.score ?? metadata?.score;
    const score = rawScore != null ? Number(rawScore) : null;

    return {
      name: squadName,
      title: String(
        config.title || config["short-title"] || pack.title || squadName
      ),
      version: String(config.version || pack.version || "—"),
      description: String(config.description || pack.description || ""),
      icon: normalizeIcon(config.icon || pack.icon || "📦"),
      type: String(config.type || metadata?.type || aios?.type || "unknown"),
      entryAgent: String(config.entry_agent || ""),
      score,
      agents,
      agentCount: agents.length || (configAgents?.length ?? 0),
      taskCount,
      workflowCount,
      parseError: false,
    };
  } catch {
    return {
      name: path.basename(squadDir),
      title: path.basename(squadDir),
      version: "—",
      description: "Parse Error",
      icon: "⚠️",
      type: "unknown",
      entryAgent: "",
      score: null,
      agents: [],
      agentCount: 0,
      taskCount: 0,
      workflowCount: 0,
      parseError: true,
    };
  }
}
