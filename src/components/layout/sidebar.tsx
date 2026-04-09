"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Layers, Activity, Hexagon, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePolling } from "@/hooks/use-polling";
import { useTheme } from "@/hooks/use-theme";
import type { SessionsResponse } from "@/lib/types";

interface SidebarProps {
  agentCount: number;
  squadCount: number;
}

const navItems = [
  {
    href: "/agents",
    label: "Agents",
    icon: Users,
    countKey: "agents" as const,
  },
  {
    href: "/squads",
    label: "Squads",
    icon: Layers,
    countKey: "squads" as const,
  },
  {
    href: "/active",
    label: "Active",
    icon: Activity,
    countKey: "active" as const,
  },
];

export function Sidebar({ agentCount, squadCount }: SidebarProps) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { data: sessionsData } = usePolling<SessionsResponse>("/api/sessions", 5_000);

  const counts = {
    agents: agentCount,
    squads: squadCount,
    active: sessionsData?.totalActive ?? null,
  };

  return (
    <aside className="w-60 bg-sidebar flex flex-col shrink-0 border-r border-sidebar-border relative">
      {/* Gold accent line on left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-gold via-gold/30 to-emerald/20" />

      {/* Logo area */}
      <div className="px-5 py-5 border-b border-gold/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gold/[0.08] border border-gold-border">
            <Hexagon className="size-5 text-gold" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight text-foreground">
              AIOX
            </h1>
            <p className="text-[10px] text-gold/60 font-mono tracking-wider uppercase">
              Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-[10px] font-medium text-gold/30 uppercase tracking-widest px-3 mb-3">
          Menu
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const count = counts[item.countKey];

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 relative",
                isActive
                  ? "bg-gold/[0.08] text-foreground border border-gold/12"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
              )}
            >
              {/* Gold active indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gold" />
              )}

              <item.icon
                className={cn(
                  "size-[18px] shrink-0 transition-colors",
                  isActive ? "text-gold" : "group-hover:text-gold-dim"
                )}
              />

              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    "block text-[13px]",
                    isActive && "font-medium text-foreground"
                  )}
                >
                  {item.label}
                </span>
              </div>

              {count != null && (
                <span
                  className={cn(
                    "text-[11px] font-mono px-2 py-0.5 rounded-full transition-colors",
                    isActive
                      ? "bg-gold/15 text-gold"
                      : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gold/8 space-y-3">
        <button
          onClick={toggle}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
            "border border-gold/15 hover:border-gold/30",
            "bg-accent/50 hover:bg-accent text-foreground/80 hover:text-foreground"
          )}
        >
          {theme === "dark" ? (
            <>
              <Sun className="size-3.5 text-gold" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="size-3.5 text-gold" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse-dot" />
          <span className="text-[10px] text-muted-foreground/50 font-mono">
            Synkra AIOS v4.31.0
          </span>
        </div>
      </div>
    </aside>
  );
}
