"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CommandList } from "./command-list";
import { cn } from "@/lib/utils";
import type { Agent } from "@/lib/types";

interface AgentCardProps {
  agent: Agent;
  searchTerm?: string;
  favorites: Set<string>;
  onToggleFavorite: (agentId: string, cmdName: string) => void;
}

function getSlashCommand(agent: Agent): string {
  if (agent.source === "squad" && agent.squadId) {
    return `/${agent.squadId}:${agent.id}`;
  }
  return `/${agent.id}`;
}

export function AgentCard({ agent, searchTerm, favorites, onToggleFavorite }: AgentCardProps) {
  const slash = getSlashCommand(agent);
  const [copied, setCopied] = useState(false);

  const handleCopySlash = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(slash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    },
    [slash]
  );

  return (
    <div className="group flex flex-col rounded-xl border border-border hover:border-gold-border bg-card hover:bg-card-hover transition-all duration-300 hover:shadow-[0_0_20px_rgba(221,187,86,0.05)]">
      <div className="flex-1 p-5">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-gold/[0.06] border border-gold-border group-hover:border-gold/30 transition-colors shrink-0">
            <span className="text-xl" role="img">
              {agent.icon}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm text-foreground">
                {agent.name}
              </h3>
              {agent.parseError && (
                <Badge variant="warning">parse error</Badge>
              )}
            </div>

            <button
              onClick={handleCopySlash}
              title="Copiar slash command"
              className={cn(
                "flex items-center gap-1.5 mt-0.5 group/slash cursor-pointer transition-colors",
                copied ? "text-emerald" : "text-gold hover:text-gold-bright"
              )}
            >
              <span className="font-mono text-[11px]">{slash}</span>
              {copied ? (
                <Check className="size-3" />
              ) : (
                <Copy className="size-2.5 opacity-0 group-hover/slash:opacity-100 transition-opacity" />
              )}
            </button>
          </div>

          <Badge variant="gold" className="shrink-0">
            {agent.commandCount}
          </Badge>
        </div>

        <p className="text-xs text-foreground/60 mt-3 leading-relaxed">
          {agent.role || agent.title}
        </p>
      </div>

      <CommandList
        commands={agent.commands}
        agentId={agent.id}
        searchTerm={searchTerm}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
      />
    </div>
  );
}
