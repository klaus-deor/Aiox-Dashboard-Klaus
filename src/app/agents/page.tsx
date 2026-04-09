import { parseAllAgents } from "@/lib/parsers/agent-parser";
import { AgentsPageClient } from "./client";

export const revalidate = 10;

export const metadata = {
  title: "AIOX Dashboard — Agents",
};

export default async function AgentsPage() {
  const agents = await parseAllAgents();

  return <AgentsPageClient agents={agents} />;
}
