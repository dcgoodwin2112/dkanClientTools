import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div>
      <h1>Open Data Catalog</h1>
      <p>Coming soon...</p>
    </div>
  )
}
