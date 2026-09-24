import { createFileRoute } from "@tanstack/react-router";
import { ExchangePolicy } from "../components/policies/PolicyPages";

export const Route = createFileRoute("/chinh-sach-doi-hang")({
  component: ExchangePolicy,
});
