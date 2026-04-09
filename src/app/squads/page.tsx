import { parseAllSquads } from "@/lib/parsers/squad-parser";
import { SquadsPageClient } from "./client";

export const revalidate = 10;

export const metadata = {
  title: "AIOX Dashboard — Squads",
};

export default async function SquadsPage() {
  const squads = await parseAllSquads();

  return <SquadsPageClient squads={squads} />;
}
