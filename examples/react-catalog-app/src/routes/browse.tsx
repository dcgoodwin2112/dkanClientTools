import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/browse')({
  component: Browse,
})

function Browse() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Browse Datasets</h1>
      <p>Coming soon...</p>
    </div>
  )
}
