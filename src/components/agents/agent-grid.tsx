"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import { AgentCard } from "./agent-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Agent } from "@/lib/types";

interface AgentGridProps {
  agents: Agent[];
  searchTerm?: string;
  favorites: Record<string, Set<string>>;
  onToggleFavorite: (agentId: string, cmdName: string) => void;
}

export function AgentGrid({ agents, searchTerm, favorites, onToggleFavorite }: AgentGridProps) {
  const filtered = useMemo(() => {
    if (!searchTerm?.trim()) return agents;
    return agents.filter((a) => matchesAgent(a, searchTerm));
  }, [agents, searchTerm]);

  if (filtered.length === 0 && searchTerm) {
    return (
      <EmptyState
        icon={Users}
        title={`Nenhum resultado para "${searchTerm}"`}
        description="Tente buscar por outro termo"
      />
    );
  }

  if (agents.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum agente encontrado"
        description="Verifique se .aiox-core/development/agents/ existe"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
      {filtered.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          searchTerm={searchTerm}
          favorites={favorites[agent.id] ?? new Set<string>()}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesAgent(agent: Agent, term: string): boolean {
  const t = normalize(term);
  return (
    normalize(agent.name).includes(t) ||
    normalize(agent.id).includes(t) ||
    normalize(agent.title).includes(t) ||
    normalize(agent.role).includes(t) ||
    agent.commands.some(
      (c) =>
        normalize(c.name).includes(t) ||
        normalize(c.description).includes(t)
    )
  );
}
