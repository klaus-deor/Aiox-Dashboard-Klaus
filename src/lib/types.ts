export interface AgentCommand {
  name: string;
  description: string;
  args?: string;
  visibility?: string[];
  tier?: string;
}

export interface Agent {
  id: string;
  name: string;
  title: string;
  icon: string;
  role: string;
  commands: AgentCommand[];
  commandCount: number;
  source: "core" | "squad";
  squadId?: string;
  parseError?: boolean;
}

export interface Squad {
  name: string;
  title: string;
  version: string;
  description: string;
  icon: string;
  type: string;
  entryAgent: string;
  score: number | null;
  agents: Agent[];
  agentCount: number;
  taskCount: number;
  workflowCount: number;
  parseError?: boolean;
}

export interface ActiveSession {
  pid: number;
  sessionId: string;
  cwd: string;
  cwdShort: string;
  startedAt: number;
  uptime: string;
  kind: string;
  entrypoint: string;
  agent: string | null;
  isAlive: boolean;
}

export interface SessionsResponse {
  sessions: ActiveSession[];
  totalActive: number;
  lastUpdated: string;
}
