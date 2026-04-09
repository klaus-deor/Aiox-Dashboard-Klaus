"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UsePollingResult<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  lastUpdated: string | null;
  refetch: () => void;
}

export function usePolling<T>(
  url: string,
  intervalMs: number
): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as T;
      setData(json);
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString("pt-BR"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData, intervalMs]);

  return { data, error, isLoading, lastUpdated, refetch: fetchData };
}
