import { createFileRoute } from "@tanstack/react-router";
import { LeadsPage } from "@/components/LeadsPage";

export const Route = createFileRoute("/leads")({
  component: LeadsPage,
});
