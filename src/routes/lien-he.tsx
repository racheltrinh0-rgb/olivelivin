import { createFileRoute } from "@tanstack/react-router";
import { ContactPolicy } from "../components/policies/PolicyPages";

export const Route = createFileRoute("/lien-he")({
  component: ContactPolicy,
});
