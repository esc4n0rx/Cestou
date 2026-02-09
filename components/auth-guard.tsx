"use client"

import { useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

const publicRoutes = new Set(["/", "/auth/callback"])

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()

  const isPublicRoute = useMemo(
    () => publicRoutes.has(pathname),
    [pathname]
  )

  useEffect(() => {
    if (loading) {
      return
    }

    if (!user && !isPublicRoute) {
      router.replace("/")
      return
    }

    if (user && pathname === "/") {
      router.replace("/inicio")
    }
  }, [isPublicRoute, loading, pathname, router, user])

  if (loading && !isPublicRoute) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background px-4">
        <div className="text-sm text-muted-foreground">Carregando sessao...</div>
      </main>
    )
  }

  if (!loading && !user && !isPublicRoute) {
    return null
  }

  return <>{children}</>
}
