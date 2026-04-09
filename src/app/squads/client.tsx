"use client";

import { useState, useCallback } from "react";
import { SearchBar } from "@/components/layout/search-bar";
import { SquadGrid } from "@/components/squads/squad-grid";
import { useFavorites } from "@/hooks/use-favorites";
import type { Squad } from "@/lib/types";

interface SquadsPageClientProps {
  squads: Squad[];
}

export function SquadsPageClient({ squads }: SquadsPageClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toggleFavorite, isFavorite } = useFavorites();

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const totalAgents = squads.reduce((sum, s) => sum + s.agentCount, 0);
  const totalTasks = squads.reduce((sum, s) => sum + s.taskCount, 0);

  // Build favorites map for all squad agents
  const favoritesMap: Record<string, Set<string>> = {};
  for (const squad of squads) {
    for (const agent of squad.agents) {
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
  }

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-8 gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Squads
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-gold font-medium">{squads.length}</span> squads · <span className="text-foreground/70 font-medium">{totalAgents}</span> agentes · <span className="text-foreground/70 font-medium">{totalTasks}</span> tasks
          </p>
        </div>
        <div className="w-80">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Buscar squads ou agentes..."
          />
        </div>
      </div>

      <SquadGrid
        squads={squads}
        searchTerm={searchTerm}
        favorites={favoritesMap}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}
