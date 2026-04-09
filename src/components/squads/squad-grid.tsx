"use client";

import { useMemo } from "react";
import { Layers } from "lucide-react";
import { SquadCard } from "./squad-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Squad } from "@/lib/types";

interface SquadGridProps {
  squads: Squad[];
  searchTerm?: string;
  favorites: Record<string, Set<string>>;
  onToggleFavorite: (agentId: string, cmdName: string) => void;
}

export function SquadGrid({ squads, searchTerm, favorites, onToggleFavorite }: SquadGridProps) {
  const filtered = useMemo(() => {
    if (!searchTerm?.trim()) return squads;
    return squads.filter((s) => matchesSquad(s, searchTerm));
  }, [squads, searchTerm]);

  if (filtered.length === 0 && searchTerm) {
    return (
      <EmptyState
        icon={Layers}
        title={`Nenhum resultado para "${searchTerm}"`}
        description="Tente buscar por outro termo"
      />
    );
  }

  if (squads.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="Nenhum squad instalado"
        description="Verifique se squads/ existe no workspace"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
      {filtered.map((squad) => (
        <SquadCard
          key={squad.name}
          squad={squad}
          searchTerm={searchTerm}
          favorites={favorites}
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

function matchesSquad(squad: Squad, term: string): boolean {
  const t = normalize(term);
  return (
    normalize(squad.name).includes(t) ||
    normalize(squad.title).includes(t) ||
    normalize(squad.description).includes(t) ||
    squad.agents.some(
      (a) =>
        normalize(a.name).includes(t) ||
        normalize(a.id).includes(t) ||
        a.commands.some(
          (c) =>
            normalize(c.name).includes(t) ||
            normalize(c.description).includes(t)
        )
    )
  );
}
