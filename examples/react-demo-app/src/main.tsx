import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { DkanClientProvider, DkanClientClass, QueryClient } from '@dkan-client-tools/react'

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
    },
  },
})

// Create DKAN Client
// Use empty baseUrl in development - Vite proxy will forward /api requests to local DDEV DKAN site
const dkanClient = new DkanClientClass({
  queryClient,
  baseUrl: '', // Proxy handles this in development (https://dkan.ddev.site)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DkanClientProvider client={dkanClient}>
      <App />
    </DkanClientProvider>
  </React.StrictMode>
)
