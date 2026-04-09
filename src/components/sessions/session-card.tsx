import { Badge } from "@/components/ui/badge";
import { Clock, FolderOpen } from "lucide-react";
import type { ActiveSession } from "@/lib/types";

interface SessionCardProps {
  session: ActiveSession;
}

export function SessionCard({ session }: SessionCardProps) {
  return (
    <div className="group rounded-xl border border-border hover:border-gold-border bg-card p-5 hover:bg-card-hover transition-all duration-300 hover:shadow-[0_0_20px_rgba(221,187,86,0.05)]">
      {/* Header: status + PID */}
      <div className="flex items-center gap-3">
        {/* Pulse dot with glow */}
        <span className="relative flex size-2.5 shrink-0">
          <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald opacity-60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
        </span>

        <span className="font-mono text-sm font-medium text-foreground">
          PID {session.pid}
        </span>

        <span className="ml-auto flex items-center gap-1.5 text-xs text-gold/80">
          <Clock className="size-3" />
          {session.uptime}
        </span>
      </div>

      {/* Details */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-foreground/60">
          <FolderOpen className="size-3 text-gold/40 shrink-0" />
          <span className="font-mono truncate">{session.cwdShort}</span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {session.agent ? (
            <Badge variant="gold">{session.agent}</Badge>
          ) : (
            <Badge variant="muted" className="border border-dashed border-border">
              Sem agente
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
