"use client";

import { Terminal, AlertCircle, Radio } from "lucide-react";
import { usePolling } from "@/hooks/use-polling";
import { SessionCard } from "./session-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { SessionsResponse } from "@/lib/types";

const POLL_INTERVAL = 5_000;

export function SessionList() {
  const { data, error, isLoading, lastUpdated, refetch } =
    usePolling<SessionsResponse>("/api/sessions", POLL_INTERVAL);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald/30 border-t-emerald animate-spin" />
        <span className="text-sm text-muted-foreground">
          Carregando sessoes...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/15">
          <AlertCircle className="size-7 text-destructive/70" />
        </div>
        <p className="text-sm text-muted-foreground">
          Erro ao carregar sessoes: {error}
        </p>
        <button
          onClick={refetch}
          className="text-xs text-emerald hover:text-emerald/80 font-medium transition-colors cursor-pointer"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const sessions = data?.sessions ?? [];

  return (
    <div>
      {/* Page header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Active Sessions
            </h1>
            {sessions.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-emerald font-medium">
                <Radio className="size-3 animate-pulse-dot" />
                Live
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.totalActive ?? 0} sessoes ativas no momento
          </p>
        </div>
        {lastUpdated && (
          <span className="text-[11px] text-muted-foreground/50 font-mono">
            Atualizado {lastUpdated}
          </span>
        )}
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={Terminal}
          title="Nenhuma sessao CLI ativa"
          description="Abra um terminal com Claude Code para ver sessoes aqui"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <SessionCard key={session.pid} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
