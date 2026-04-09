import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Sidebar } from "@/components/layout/sidebar";
import { parseAllAgents } from "@/lib/parsers/agent-parser";
import { parseAllSquads } from "@/lib/parsers/squad-parser";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIOX Dashboard",
  description: "Agent & Squad ecosystem monitor",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [agents, squads] = await Promise.all([
    parseAllAgents(),
    parseAllSquads(),
  ]);

  return (
    <html
      lang="pt-BR"
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
      data-default-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('aiox-theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
          <Sidebar
            agentCount={agents.length}
            squadCount={squads.length}
          />
          <main className="flex-1 overflow-auto scroll-smooth">{children}</main>
        </div>
      </body>
    </html>
  );
}
