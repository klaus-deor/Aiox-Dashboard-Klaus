import type { AgentCommand } from "../types";

export function extractYamlFromMd(content: string): string | null {
  // Try fenced code block first: ```yaml ... ```
  // The closing ``` must be at the start of a line (no indentation)
  // to avoid matching ``` inside YAML content (e.g., code examples)
  const fenced = content.match(/```yaml\n([\s\S]*?)^```$/m);
  if (fenced) return fenced[1];

  // Fallback: YAML frontmatter (--- ... ---)
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
  return frontmatter ? frontmatter[1] : null;
}

export function extractAllYamlBlocks(content: string): string[] {
  const blocks: string[] = [];

  // Frontmatter block (--- ... ---)
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatter) blocks.push(frontmatter[1]);

  // Fenced code blocks (```yaml ... ```)
  const regex = /```yaml\n([\s\S]*?)^```$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

function parseNameArgs(str: string): { name: string; args?: string } {
  const trimmed = str.trim();
  // Match: "command {arg1} {arg2}" or "command"
  const match = trimmed.match(/^(\S+)\s+(.+)$/);
  if (!match) return { name: trimmed };
  return {
    name: match[1],
    args: match[2].trim(),
  };
}

/**
 * Extracts commands from data.commands which can be:
 * - Array of objects (standard): [{name: "help", description: "...", visibility: [...]}]
 * - Array of shorthand objects: [{help: "Show all..."}, {guide: "Show..."}]
 * - Array of strings: ["*help", "*triage {req} - desc"]
 * - Plain object / key-value map: {research: "Conduct...", wireframe: "Create..."}
 */
export function extractCommands(rawCommands: unknown): AgentCommand[] {
  if (!rawCommands) return [];

  // Case: plain object (key-value map) like ux-design-expert
  // { research: 'Conduct...', 'wireframe {fidelity}': 'Create...' }
  if (typeof rawCommands === "object" && !Array.isArray(rawCommands)) {
    const obj = rawCommands as Record<string, unknown>;
    // Check if it looks like a key-value map (no 'name' key = it's a map)
    if (!("name" in obj)) {
      return Object.entries(obj).map(([key, value]) => {
        const { name, args } = parseNameArgs(key.replace(/^\*/, ""));
        return {
          name,
          description: typeof value === "string" ? value : "",
          args,
        };
      });
    }
  }

  // Case: array
  if (Array.isArray(rawCommands)) {
    return rawCommands.map(normalizeCommand).filter((c) => c.name && c.name !== "unknown");
  }

  return [];
}

export function normalizeCommand(raw: unknown): AgentCommand {
  // Format 1: Standard object { name: "help", description: "...", visibility: [...] }
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;

    // Standard format: has explicit "name" field
    if ("name" in obj) {
      const rawName = String(obj.name || "").replace(/^\*/, "");
      return {
        name: rawName,
        description: String(obj.description || ""),
        args: obj.args ? String(obj.args) : undefined,
        visibility: Array.isArray(obj.visibility)
          ? obj.visibility.map(String)
          : undefined,
        tier: obj.tier ? String(obj.tier) : undefined,
      };
    }

    // Shorthand object: { help: "Show all commands" } or { "create-schema": "Design schema" }
    // Single key where key=command name, value=description
    const keys = Object.keys(obj);
    if (keys.length === 1) {
      const key = keys[0];
      const value = obj[key];
      const { name, args } = parseNameArgs(key.replace(/^\*/, ""));
      return {
        name,
        description: typeof value === "string" ? value : "",
        args,
      };
    }

    // Multi-key object without "name" — might be a malformed entry, try first key
    if (keys.length > 1 && !("name" in obj)) {
      const key = keys[0];
      const value = obj[key];
      const { name, args } = parseNameArgs(key.replace(/^\*/, ""));
      return {
        name,
        description: typeof value === "string" ? value : "",
        args,
      };
    }

    return { name: "unknown", description: "" };
  }

  // Format 2 & 3: String
  if (typeof raw === "string") {
    const cleaned = raw.replace(/^\*/, "").trim();

    // Format 3: "*command {args} - description" or "*command - description"
    const dashMatch = cleaned.match(
      /^(\S+(?:\s+\{[^}]+\})?)\s*[-–—]\s*(.+)$/
    );
    if (dashMatch) {
      const { name, args } = parseNameArgs(dashMatch[1]);
      return { name, description: dashMatch[2].trim(), args };
    }

    // Format 2: "*command {args}"
    const { name, args } = parseNameArgs(cleaned);
    return { name, description: "", args };
  }

  return { name: "unknown", description: "" };
}
