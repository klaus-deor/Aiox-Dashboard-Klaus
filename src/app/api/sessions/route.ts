import { NextResponse } from "next/server";
import { parseActiveSessions } from "@/lib/parsers/session-parser";
import type { SessionsResponse } from "@/lib/types";

export async function GET() {
  try {
    const sessions = await parseActiveSessions();

    const response: SessionsResponse = {
      sessions,
      totalActive: sessions.length,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    const response: SessionsResponse = {
      sessions: [],
      totalActive: 0,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}
