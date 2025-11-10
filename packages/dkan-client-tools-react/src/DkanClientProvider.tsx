/**
 * DkanClientProvider - React Context Provider for DkanClient
 * Wraps TanStack Query's QueryClientProvider
 */

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { DkanClient } from '@dkan-client-tools/core'

const DkanClientContext = createContext<DkanClient | undefined>(undefined)

export interface DkanClientProviderProps {
  client: DkanClient
  children: ReactNode
}

/**
 * Provider component that makes DkanClient and TanStack Query available to all child components
 */
export function DkanClientProvider({ client, children }: DkanClientProviderProps) {
  useEffect(() => {
    client.mount()
    return () => {
      client.unmount()
    }
  }, [client])

  return (
    <QueryClientProvider client={client.getQueryClient()}>
      <DkanClientContext.Provider value={client}>{children}</DkanClientContext.Provider>
    </QueryClientProvider>
  )
}

/**
 * Hook to access the DkanClient from context
 */
export function useDkanClient(): DkanClient {
  const client = useContext(DkanClientContext)

  if (!client) {
    throw new Error('useDkanClient must be used within a DkanClientProvider')
  }

  return client
}
