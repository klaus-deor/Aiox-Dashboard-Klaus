"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (term: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  disabled,
  placeholder = "Buscar agentes, squads, comandos...",
}: SearchBarProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, 300);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  const clear = useCallback(() => {
    setValue("");
    onSearch("");
  }, [onSearch]);

  return (
    <div className="relative group">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 group-focus-within:text-gold/70 transition-colors" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && clear()}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "w-full pl-10 pr-9 py-2.5 text-sm rounded-lg",
          "bg-card border border-border",
          "text-foreground placeholder:text-muted-foreground/35",
          "focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/15",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all duration-200"
        )}
      />
      {value && (
        <button
          onClick={clear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
        >
          <X className="size-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      )}
    </div>
  );
}
