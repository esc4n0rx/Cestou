"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, Mail, Lock, User, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const router = useRouter()
  const { signInWithEmail, signInWithGoogle, signUpWithEmail } = useAuth()

  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Preencha email e senha.")
      return
    }

    if (!isLogin && !name.trim()) {
      setError("Preencha o nome para registrar.")
      return
    }

    setLoading(true)

    const result = isLogin
      ? await signInWithEmail(email, password)
      : await signUpWithEmail(name, email, password)

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    router.replace("/inicio")
  }

  const handleGoogleLogin = async () => {
    setError("")
    setGoogleLoading(true)

    const result = await signInWithGoogle()

    if (result.error) {
      setError(result.error)
      setGoogleLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ShoppingCart className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isLogin ? "Bem-vindo" : "Criar conta"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLogin
              ? "Entre para gerenciar suas compras"
              : "Registre-se para comecar"}
          </p>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/50">
          <div className="mb-6 flex rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true)
                setError("")
              }}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
                isLogin
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false)
                setError("")
              }}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
                !isLogin
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Registrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div
              className={cn(
                "grid transition-all duration-300",
                !isLogin
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Nome
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    tabIndex={isLogin ? -1 : 0}
                    className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Carregando...
                </span>
              ) : isLogin ? (
                "Entrar"
              ) : (
                "Criar conta"
              )}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-background py-3 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-60"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {googleLoading ? "Conectando..." : "Entrar com Google"}
          </button>
        </div>
      </div>
    </main>
  )
}
