"use client";

import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
      <AlertCircle className="size-12 text-destructive/60" />
      <h2 className="text-lg font-medium">Algo deu errado</h2>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        {error.message || "Ocorreu um erro inesperado"}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
      >
        Recarregar
      </button>
    </div>
  );
}
