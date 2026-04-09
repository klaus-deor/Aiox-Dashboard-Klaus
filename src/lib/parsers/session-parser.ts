import fs from "node:fs/promises";
import path from "node:path";
import { SESSIONS_DIR, SESSION_CACHE_DIR } from "../constants";
import type { ActiveSession } from "../types";

export async function parseActiveSessions(): Promise<ActiveSession[]> {
  let files: string[];
  try {
    files = (await fs.readdir(SESSIONS_DIR)).filter((f) =>
      f.endsWith(".json")
    );
  } catch {
    return [];
  }

  const sessions = await Promise.all(files.map(parseSessionFile));
  return sessions.filter(
    (s): s is ActiveSession => s !== null && s.isAlive
  );
}

async function parseSessionFile(
  file: string
): Promise<ActiveSession | null> {
  try {
    const content = await fs.readFile(
      path.join(SESSIONS_DIR, file),
      "utf-8"
    );
    const data = JSON.parse(content) as Record<string, unknown>;
    const pid = (data.pid as number) || parseInt(file.replace(".json", ""));

    const isAlive = await checkPidAlive(pid);
    if (!isAlive) return null;

    const agent = await findActiveAgent();
    const startedAt = (data.startedAt as number) || Date.now();

    return {
      pid,
      sessionId: String(data.sessionId || ""),
      cwd: String(data.cwd || ""),
      cwdShort: shortenPath(String(data.cwd || "")),
      startedAt,
      uptime: humanizeUptime(Date.now() - startedAt),
      kind: String(data.kind || "unknown"),
      entrypoint: String(data.entrypoint || "cli"),
      agent,
      isAlive,
    };
  } catch {
    return null;
  }
}

async function checkPidAlive(pid: number): Promise<boolean> {
  try {
    await fs.access(`/proc/${pid}`);
    return true;
  } catch {
    return false;
  }
}

async function findActiveAgent(): Promise<string | null> {
  try {
    const files = await fs.readdir(SESSION_CACHE_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    for (const file of jsonFiles) {
      try {
        const content = await fs.readFile(
          path.join(SESSION_CACHE_DIR, file),
          "utf-8"
        );
        const data = JSON.parse(content) as Record<string, unknown>;
        if (data.status === "active" && data.agent) {
          return String(data.agent);
        }
      } catch {
        continue;
      }
    }
  } catch {
    // no cache dir
  }
  return null;
}

function shortenPath(fullPath: string): string {
  if (!fullPath) return "";
  const parts = fullPath.split("/").filter(Boolean);
  return parts.slice(-2).join("/");
}

function humanizeUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}
