
import { createFileRoute } from "@tanstack/react-router";
import MysteryJackpotManagement from "@/components/admin/MysteryJackpotManagement";

export const Route = createFileRoute(
  "/_authenticated/admin/mystery-jackpot"
)({
  component: MysteryJackpotPage,
});

function MysteryJackpotPage() {
  return <MysteryJackpotManagement />;
}
