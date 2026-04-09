import path from "node:path";
import fs from "node:fs";
import os from "node:os";

/** Detect workspace root: env var (Electron) → cwd walk → fallback */
function detectWorkspaceRoot(): string {
  // Electron passes this via environment
  if (process.env.AIOX_WORKSPACE_ROOT) {
    return process.env.AIOX_WORKSPACE_ROOT;
  }

  // Walk up from cwd looking for .aiox-core
  let current = process.cwd();
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(current, ".aiox-core"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  // Fallback: assume app is at apps/aiox-dashboard
  return path.resolve(process.cwd(), "../..");
}

export const WORKSPACE_ROOT = detectWorkspaceRoot();

export const AGENTS_DIR = path.join(
  WORKSPACE_ROOT,
  ".aiox-core",
  "development",
  "agents"
);

export const SQUADS_DIR = path.join(WORKSPACE_ROOT, "squads");

export const SESSIONS_DIR = path.join(os.homedir(), ".claude", "sessions");

export const SESSION_CACHE_DIR = path.join(
  os.homedir(),
  ".claude",
  "session-cache"
);

export const POLL_SESSIONS = 5_000;

export const REVALIDATE_CATALOG = 10;
