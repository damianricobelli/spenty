import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/expenses/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/expenses/"!</div>
}
