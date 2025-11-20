import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dataset/$identifier')({
  component: DatasetDetail,
})

function DatasetDetail() {
  const { identifier } = Route.useParams()

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Dataset Detail</h1>
      <p>Dataset ID: {identifier}</p>
      <p>Coming soon in Phase 6...</p>
    </div>
  )
}
