"use client";

import { useState } from "react";
import { ChevronDown, Boxes, ListTodo, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, ScoreBadge } from "@/components/ui/badge";
import { CommandList } from "@/components/agents/command-list";
import type { Squad } from "@/lib/types";

interface SquadCardProps {
  squad: Squad;
  searchTerm?: string;
  favorites: Record<string, Set<string>>;
  onToggleFavorite: (agentId: string, cmdName: string) => void;
}

export function SquadCard({ squad, searchTerm, favorites, onToggleFavorite }: SquadCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

  const toggleAgent = (id: string) => {
    setExpandedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const desc =
    squad.description.length > 120
      ? squad.description.slice(0, 120) + "..."
      : squad.description;

  return (
    <div className="flex flex-col rounded-xl border border-border hover:border-gold-border bg-card hover:bg-card-hover transition-all duration-300 hover:shadow-[0_0_24px_rgba(221,187,86,0.05)]">
      {/* Content area */}
      <div className="flex-1 p-5">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gold/[0.06] border border-gold-border shrink-0">
            <span className="text-2xl" role="img">
              {squad.icon}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <h3 className="font-semibold text-base text-foreground truncate" title={squad.title}>
                {squad.title}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant="muted" className="text-[10px] font-mono">
                  v{squad.version}
                </Badge>
                <ScoreBadge score={squad.score} />
              </div>
            </div>
            {squad.parseError && (
              <Badge variant="warning" className="mt-1">parse error</Badge>
            )}
            <p className="text-[11px] text-gold font-mono mt-1 uppercase tracking-wide">
              {squad.type}
            </p>
          </div>
        </div>

        {desc && (
          <p className="text-xs text-muted-foreground/80 mt-3 leading-relaxed line-clamp-3">
            {desc}
          </p>
        )}

        <div className="flex items-center gap-5 mt-4 pt-3 border-t border-gold/10">
          <span className="flex items-center gap-1.5 text-xs text-foreground/70">
            <Boxes className="size-3.5 text-gold" /> <strong className="text-foreground/90">{squad.agentCount}</strong> agents
          </span>
          <span className="flex items-center gap-1.5 text-xs text-foreground/70">
            <ListTodo className="size-3.5 text-emerald" /> <strong className="text-foreground/90">{squad.taskCount}</strong> tasks
          </span>
          <span className="flex items-center gap-1.5 text-xs text-foreground/70">
            <GitBranch className="size-3.5 text-muted-foreground/50" /> <strong className="text-foreground/90">{squad.workflowCount}</strong> wf
          </span>
        </div>
      </div>

      {/* Agents toggle — pinned at bottom */}
      {squad.agents.length > 0 && (
        <div className="mt-auto">
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "w-full flex items-center gap-2 px-5 py-3 text-xs transition-colors cursor-pointer",
              "border-t border-gold/15",
              "hover:bg-gold/[0.04]",
              expanded
                ? "text-gold"
                : "text-muted-foreground hover:text-gold"
            )}
          >
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
            <span className="font-medium">
              {expanded ? "Ocultar" : "Ver"} {squad.agents.length} agentes
            </span>
          </button>

          {expanded && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              {squad.agents.map((agent) => {
                const isOpen = expandedAgents.has(agent.id);
                const agentFavs = favorites[agent.id] ?? new Set<string>();
                return (
                  <div key={agent.id} className="border-t border-border-subtle">
                    {/* Click agent → shows commands directly */}
                    <button
                      onClick={() => toggleAgent(agent.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-5 py-3.5 text-xs transition-colors cursor-pointer",
                        "hover:bg-card-hover",
                        isOpen && "bg-accent/30"
                      )}
                    >
                      <ChevronDown
                        className={cn(
                          "size-3 transition-transform duration-200 text-muted-foreground shrink-0",
                          isOpen && "rotate-180 text-emerald"
                        )}
                      />
                      <span className="text-lg shrink-0" role="img">
                        {agent.icon}
                      </span>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{agent.name}</span>
                          <span className="font-mono text-[10px] text-gold/60">
                            /{agent.id}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-[11px] mt-0.5 truncate">
                          {agent.role || agent.title}
                        </p>
                      </div>
                      <Badge variant="emerald" className="shrink-0">
                        {agent.commandCount}
                      </Badge>
                    </button>

                    {/* Commands appear directly — no second click needed */}
                    {isOpen && (
                      <div className="pl-6 bg-background/30">
                        <CommandList
                          commands={agent.commands}
                          agentId={agent.id}
                          searchTerm={searchTerm}
                          inline
                          favorites={agentFavs}
                          onToggleFavorite={onToggleFavorite}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
