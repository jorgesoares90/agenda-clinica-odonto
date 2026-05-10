import { createFileRoute } from "@tanstack/react-router";
import { Home } from "@/components/Home";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <Home />;
}
