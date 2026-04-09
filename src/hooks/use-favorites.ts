"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "aiox-cmd-favorites";

function loadFavorites(): Record<string, Set<string>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: Record<string, string[]> = JSON.parse(raw);
    const result: Record<string, Set<string>> = {};
    for (const [agentId, cmds] of Object.entries(parsed)) {
      result[agentId] = new Set(cmds);
    }
    return result;
  } catch {
    return {};
  }
}

function saveFavorites(favs: Record<string, Set<string>>) {
  const serializable: Record<string, string[]> = {};
  for (const [agentId, cmds] of Object.entries(favs)) {
    if (cmds.size > 0) {
      serializable[agentId] = Array.from(cmds);
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const toggleFavorite = useCallback((agentId: string, cmdName: string) => {
    setFavorites((prev) => {
      const next = { ...prev };
      const agentFavs = new Set(prev[agentId] ?? []);
      if (agentFavs.has(cmdName)) {
        agentFavs.delete(cmdName);
      } else {
        agentFavs.add(cmdName);
      }
      next[agentId] = agentFavs;
      saveFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (agentId: string, cmdName: string) => {
      return favorites[agentId]?.has(cmdName) ?? false;
    },
    [favorites]
  );

  return { toggleFavorite, isFavorite };
}
