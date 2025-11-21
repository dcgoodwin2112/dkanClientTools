import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

export const Route = createRootRoute({
  component: RootLayout,
})

const mainStyle = { flex: 1 } as const

function RootLayout() {
  return (
    <>
      <Header />
      <main style={mainStyle}>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
