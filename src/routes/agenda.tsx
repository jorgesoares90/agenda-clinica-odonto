import { createFileRoute } from "@tanstack/react-router";
import { AgendaPage } from "@/components/AgendaPage";

export const Route = createFileRoute("/agenda")({
  component: AgendaPage,
});
