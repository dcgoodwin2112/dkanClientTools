import { DkanClient, DkanClientProvider, QueryClient } from '@dkan-client-tools/react'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

// Create DkanClient instance
// Use empty baseUrl - Vite proxy forwards /api requests to DKAN
const dkanClient = new DkanClient({
  queryClient,
  baseUrl: '',
})

// Create router instance
const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
})

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  return (
    <DkanClientProvider client={dkanClient}>
      <RouterProvider router={router} />
    </DkanClientProvider>
  )
}

export default App
