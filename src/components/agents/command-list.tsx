"use client";

import { useState, useCallback, useMemo } from "react";
import { Star, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentCommand } from "@/lib/types";

interface CommandListProps {
  commands: AgentCommand[];
  agentId: string;
  searchTerm?: string;
  /** If true, render commands directly without a toggle button */
  inline?: boolean;
  favorites: Set<string>;
  onToggleFavorite: (agentId: string, cmdName: string) => void;
}

export function CommandList({
  commands,
  agentId,
  searchTerm,
  inline,
  favorites,
  onToggleFavorite,
}: CommandListProps) {
  const [expanded, setExpanded] = useState(false);

  // Sort: favorites first, then the rest in original order
  const sortedCommands = useMemo(() => {
    const favs = commands.filter((c) => favorites.has(c.name));
    const rest = commands.filter((c) => !favorites.has(c.name));
    return [...favs, ...rest];
  }, [commands, favorites]);

  if (commands.length === 0) {
    return (
      <p className="text-xs text-muted-foreground/60 px-5 pb-4 italic">
        Nenhum comando encontrado
      </p>
    );
  }

  const showCommands = inline || expanded;

  return (
    <div>
      {/* Toggle button — only if NOT inline */}
      {!inline && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "w-full flex items-center gap-2 px-5 py-3 text-xs transition-colors cursor-pointer",
            "border-t border-border-subtle",
            "hover:bg-accent/50",
            expanded
              ? "text-emerald"
              : "text-muted-foreground hover:text-emerald/80"
          )}
        >
          <svg
            className={cn(
              "size-3.5 transition-transform duration-200",
              expanded && "rotate-180"
            )}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          <span className="font-medium">
            {expanded ? "Ocultar" : "Ver"} {commands.length} comandos
          </span>
        </button>
      )}

      {showCommands && (
        <div
          className={cn(
            "space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200",
            inline ? "px-4 py-3" : "px-4 pb-4"
          )}
        >
          {sortedCommands.map((cmd, i) => (
            <CommandItem
              key={`${cmd.name}-${i}`}
              cmd={cmd}
              agentId={agentId}
              searchTerm={searchTerm}
              isFavorite={favorites.has(cmd.name)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommandItem({
  cmd,
  agentId,
  searchTerm,
  isFavorite,
  onToggleFavorite,
}: {
  cmd: AgentCommand;
  agentId: string;
  searchTerm?: string;
  isFavorite: boolean;
  onToggleFavorite: (agentId: string, cmdName: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const fullCommand = cmd.args ? `*${cmd.name} ${cmd.args}` : `*${cmd.name}`;

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(fullCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    },
    [fullCommand]
  );

  const handleToggleFav = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFavorite(agentId, cmd.name);
    },
    [agentId, cmd.name, onToggleFavorite]
  );

  return (
    <div
      className={cn(
        "group/cmd rounded-lg px-3 py-2.5 transition-colors",
        isFavorite
          ? "bg-gold/[0.04] border border-gold/10"
          : "hover:bg-accent/40 border border-transparent"
      )}
    >
      {/* Row 1: fav star + command name + copy button */}
      <div className="flex items-center gap-2">
        {/* Favorite toggle */}
        <button
          onClick={handleToggleFav}
          title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          className={cn(
            "shrink-0 p-0.5 rounded transition-colors cursor-pointer",
            isFavorite
              ? "text-gold"
              : "text-muted-foreground/25 hover:text-gold/60"
          )}
        >
          <Star
            className={cn("size-3", isFavorite && "fill-gold/50")}
          />
        </button>

        <span className="font-mono text-[12.5px] text-emerald font-medium">
          <Highlight text={`*${cmd.name}`} term={searchTerm} />
        </span>
        {cmd.args && (
          <span className="font-mono text-[11.5px] text-muted-foreground/50">
            {cmd.args}
          </span>
        )}

        {/* Copy button */}
        <button
          onClick={handleCopy}
          title="Copiar comando"
          className={cn(
            "ml-auto shrink-0 p-1 rounded-md transition-all cursor-pointer",
            "opacity-0 group-hover/cmd:opacity-100",
            copied
              ? "text-emerald bg-emerald/10"
              : "text-muted-foreground/40 hover:text-foreground hover:bg-accent"
          )}
        >
          {copied ? (
            <Check className="size-3" />
          ) : (
            <Copy className="size-3" />
          )}
        </button>
      </div>

      {/* Row 2: description */}
      {cmd.description && (
        <p className="text-[12px] text-card-foreground/60 leading-relaxed mt-1 pl-5">
          <Highlight text={cmd.description} term={searchTerm} />
        </p>
      )}
    </div>
  );
}

function Highlight({ text, term }: { text: string; term?: string }) {
  if (!term || !term.trim()) return <>{text}</>;

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const normalizedText = normalize(text);
  const normalizedTerm = normalize(term);

  const idx = normalizedText.indexOf(normalizedTerm);
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-gold/20 text-gold rounded px-0.5">
        {text.slice(idx, idx + term.length)}
      </mark>
      {text.slice(idx + term.length)}
    </>
  );
}
