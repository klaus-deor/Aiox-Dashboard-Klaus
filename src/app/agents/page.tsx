import { parseAllAgents } from "@/lib/parsers/agent-parser";
import { AgentsPageClient } from "./client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AIOX Dashboard — Agents",
};

export default async function AgentsPage() {
  const agents = await parseAllAgents();

  return <AgentsPageClient agents={agents} />;
}
