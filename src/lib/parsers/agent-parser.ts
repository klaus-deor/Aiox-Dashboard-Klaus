import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { AGENTS_DIR } from "../constants";
import {
  extractYamlFromMd,
  extractAllYamlBlocks,
  extractCommands,
} from "./command-parser";
import type { Agent } from "../types";

/** Map text icon names and broken formats to actual emoji */
const ICON_MAP: Record<string, string> = {
  light_bulb: "💡",
  sunglasses: "😎",
  handshake: "🤝",
  gear: "⚙️",
  brain: "🧠",
  rocket: "🚀",
  fire: "🔥",
  star: "⭐",
  target: "🎯",
  paint: "🎨",
  book: "📖",
  pen: "✍️",
  chart: "📊",
  tools: "🛠️",
  shield: "🛡️",
  globe: "🌐",
  megaphone: "📢",
  microscope: "🔬",
  lightning: "⚡",
  crown: "👑",
};

export function normalizeIcon(raw: unknown): string {
  if (!raw) return "🤖";
  let icon = String(raw).trim();

  // Strip surrounding quotes: "icon" or 'icon'
  icon = icon.replace(/^["']|["']$/g, "");

  // HTML entities: &#x2699; → ⚙
  icon = icon.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) =>
    String.fromCodePoint(parseInt(hex, 16))
  );

  // Unicode escapes: \U0001F4D6 → 📖
  icon = icon.replace(/\\U([0-9A-Fa-f]+)/gi, (_, hex) =>
    String.fromCodePoint(parseInt(hex, 16))
  );

  // Strip quotes again (in case they were inside escapes)
  icon = icon.replace(/^["']|["']$/g, "").trim();

  // Text names: "light_bulb" → 💡
  const lower = icon.toLowerCase().replace(/[^a-z_]/g, "");
  if (ICON_MAP[lower]) return ICON_MAP[lower];

  // If only ASCII letters (like "SA"), it's not a real emoji
  if (/^[a-zA-Z]{1,4}$/.test(icon)) return "🤖";

  // If result is empty or too long (broken), use default
  if (!icon || [...icon].length > 2) return "🤖";

  return icon;
}

export async function parseAllAgents(): Promise<Agent[]> {
  try {
    const files = await fs.readdir(AGENTS_DIR);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    const agents = await Promise.all(
      mdFiles.map((file) =>
        parseSingleAgent(path.join(AGENTS_DIR, file), "core")
      )
    );

    return agents.filter(Boolean) as Agent[];
  } catch {
    return [];
  }
}

/**
 * Try to parse a YAML block. If full parse fails, try extracting
 * individual sections (agent:, commands:, persona:) via regex + YAML.
 * If that also fails, extract commands via pure regex.
 */
function safeParseYaml(yamlBlock: string): Record<string, unknown> | null {
  // First try: parse the whole YAML block
  try {
    const data = yaml.load(yamlBlock) as Record<string, unknown>;
    if (data && typeof data === "object") return data;
  } catch {
    // Fall through
  }

  const result: Record<string, unknown> = {};

  // Extract agent: section
  const agentMatch = yamlBlock.match(/^agent:\s*\n((?:[ \t]+.*\n)*)/m);
  if (agentMatch) {
    try {
      const parsed = yaml.load("agent:\n" + agentMatch[1]) as Record<
        string,
        unknown
      >;
      if (parsed?.agent) result.agent = parsed.agent;
    } catch {
      /* skip */
    }
  }

  // Extract persona: or persona_profile: section
  const personaMatch = yamlBlock.match(
    /^(persona(?:_profile)?):[ \t]*\n((?:[ \t]+.*\n)*)/m
  );
  if (personaMatch) {
    try {
      const parsed = yaml.load(
        personaMatch[1] + ":\n" + personaMatch[2]
      ) as Record<string, unknown>;
      if (parsed) {
        result.persona = parsed[personaMatch[1] as string] ?? undefined;
      }
    } catch {
      /* skip */
    }
  }

  // Extract commands: via YAML parse
  const commandsMatch = yamlBlock.match(
    /^commands:\s*\n((?:[ \t]+.*\n|[ \t]*#.*\n|[ \t]*\n)*)/m
  );
  if (commandsMatch) {
    try {
      const parsed = yaml.load(
        "commands:\n" + commandsMatch[1]
      ) as Record<string, unknown>;
      if (parsed?.commands) {
        result.commands = parsed.commands;
        return Object.keys(result).length > 0 ? result : null;
      }
    } catch {
      /* try regex fallback below */
    }
  }

  // Last resort: extract commands via pure regex (no YAML parsing)
  if (!result.commands) {
    const regexCommands = extractCommandsViaRegex(yamlBlock);
    if (regexCommands.length > 0) {
      result.commands = regexCommands;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Extract commands from YAML text using pure regex when YAML parsing fails.
 * Handles formats like:
 *   - '*help' - description
 *   - "*help - description"
 *   - name: description (key-value)
 *   - name: "description" (quoted key-value)
 */
function extractCommandsViaRegex(yamlBlock: string): string[] {
  // Find the commands: section — everything from "commands:" until next
  // top-level YAML key (line starting with letter/underscore, no indent)
  // or end of string
  let cmdSection = yamlBlock.match(
    /^commands:\s*\n([\s\S]*?)(?=\n[a-zA-Z_])/m
  );
  if (!cmdSection) {
    // commands: might be the last section — grab to end
    cmdSection = yamlBlock.match(/^commands:\s*\n([\s\S]*)$/m);
  }
  if (!cmdSection) return [];

  const lines = cmdSection[1].split("\n");
  const commands: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Format: - '*command' - description  OR  - "*command - description"
    const stringMatch = trimmed.match(
      /^-\s+['"]?\*?([^'"]+?)['"]?\s+[-–—]\s+(.+?)['"]?$/
    );
    if (stringMatch) {
      commands.push(`*${stringMatch[1].trim()} - ${stringMatch[2].trim()}`);
      continue;
    }

    // Format: - '*raw-string'  OR  - "raw string"
    const rawString = trimmed.match(/^-\s+['"](.+?)['"]$/);
    if (rawString) {
      commands.push(rawString[1]);
      continue;
    }

    // Format: command-name: "description" (key-value in commands section)
    const kvMatch = trimmed.match(
      /^(\S+(?:\s+\{[^}]+\})?)\s*:\s*['"]?(.+?)['"]?$/
    );
    if (kvMatch && !trimmed.startsWith("-")) {
      commands.push(`*${kvMatch[1]} - ${kvMatch[2]}`);
      continue;
    }
  }

  return commands;
}

export async function parseSingleAgent(
  filePath: string,
  source: "core" | "squad",
  squadId?: string
): Promise<Agent | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const yamlBlock = extractYamlFromMd(content);
    if (!yamlBlock) return null;

    const data = safeParseYaml(yamlBlock);
    if (!data) return null;

    const agent = (data.agent || {}) as Record<string, unknown>;
    const persona = (data.persona ||
      data.persona_profile ||
      {}) as Record<string, unknown>;

    let commands = extractCommands(data.commands);

    // If no commands found in first YAML block, check additional blocks
    if (commands.length === 0) {
      const allBlocks = extractAllYamlBlocks(content);
      for (let i = 1; i < allBlocks.length; i++) {
        const extraData = safeParseYaml(allBlocks[i]);
        if (extraData?.commands) {
          commands = extractCommands(extraData.commands);
          if (commands.length > 0) break;
        }
      }
    }

    return {
      id: String(agent.id || path.basename(filePath, ".md")),
      name: String(agent.name || agent.id || path.basename(filePath, ".md")),
      title: String(agent.title || persona.role || ""),
      icon: normalizeIcon(agent.icon),
      role: String(persona.role || agent.title || ""),
      commands,
      commandCount: commands.length,
      source,
      squadId,
      parseError: false,
    };
  } catch {
    return {
      id: path.basename(filePath, ".md"),
      name: path.basename(filePath, ".md"),
      title: "Parse Error",
      icon: "⚠️",
      role: "",
      commands: [],
      commandCount: 0,
      source,
      squadId,
      parseError: true,
    };
  }
}
