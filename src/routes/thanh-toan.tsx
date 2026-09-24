import { createFileRoute } from "@tanstack/react-router";
import { PaymentPolicy } from "../components/policies/PolicyPages";

export const Route = createFileRoute("/thanh-toan")({
  component: PaymentPolicy,
});
