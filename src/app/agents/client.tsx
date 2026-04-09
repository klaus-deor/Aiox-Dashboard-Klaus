"use client";

import { useState, useCallback } from "react";
import { SearchBar } from "@/components/layout/search-bar";
import { AgentGrid } from "@/components/agents/agent-grid";
import { useFavorites } from "@/hooks/use-favorites";
import type { Agent } from "@/lib/types";

interface AgentsPageClientProps {
  agents: Agent[];
}

export function AgentsPageClient({ agents }: AgentsPageClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toggleFavorite, isFavorite } = useFavorites();

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const totalCommands = agents.reduce((sum, a) => sum + a.commandCount, 0);

  // Build favorites map for all agents
  const favoritesMap: Record<string, Set<string>> = {};
  for (const agent of agents) {
    const agentFavs = new Set<string>();
    for (const cmd of agent.commands) {
      if (isFavorite(agent.id, cmd.name)) {
        agentFavs.add(cmd.name);
      }
    }
    if (agentFavs.size > 0) {
      favoritesMap[agent.id] = agentFavs;
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-8 gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Core Agents
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-gold font-medium">{agents.length}</span> agentes · <span className="text-foreground/70 font-medium">{totalCommands}</span> comandos
          </p>
        </div>
        <div className="w-80">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Buscar agentes ou comandos..."
          />
        </div>
      </div>

      <AgentGrid
        agents={agents}
        searchTerm={searchTerm}
        favorites={favoritesMap}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}
