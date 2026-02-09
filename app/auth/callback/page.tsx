"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function AuthCallbackPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) {
      return
    }

    if (user) {
      router.replace("/inicio")
      return
    }

    router.replace("/")
  }, [loading, router, user])

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="text-sm text-muted-foreground">Validando login...</div>
    </main>
  )
}
