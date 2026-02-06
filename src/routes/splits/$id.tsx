import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/splits/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/splits/$id"!</div>;
}
