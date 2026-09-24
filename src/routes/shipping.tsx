import { createFileRoute } from "@tanstack/react-router";
import { ShippingPolicy } from "../components/policies/PolicyPages";

export const Route = createFileRoute("/shipping")({
  component: ShippingPolicy,
});
