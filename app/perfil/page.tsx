"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  LogOut,
  Edit3,
  Moon,
  Sun,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  Info,
} from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export default function PerfilPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user, profile, signOut, updateProfileName, loading } = useAuth()

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [feedback, setFeedback] = useState("")
  const [saving, setSaving] = useState(false)

  const isDark = theme === "dark"

  const email = user?.email ?? ""
  const baseName = useMemo(() => {
    const byProfile = profile?.full_name?.trim()
    if (byProfile) {
      return byProfile
    }

    const byMetadata = (user?.user_metadata?.full_name as string | undefined)?.trim()
    if (byMetadata) {
      return byMetadata
    }

    return email.split("@")[0] || "Usuario"
  }, [email, profile?.full_name, user?.user_metadata])

  useEffect(() => {
    setName(baseName)
  }, [baseName])

  const handleSave = async () => {
    setFeedback("")
    setSaving(true)

    const result = await updateProfileName(name)

    setSaving(false)

    if (result.error) {
      setFeedback(result.error)
      return
    }

    setFeedback("Perfil atualizado.")
    setIsEditing(false)
  }

  const handleLogout = async () => {
    const result = await signOut()

    if (result.error) {
      setFeedback(result.error)
      return
    }

    router.replace("/")
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-2xl px-4 py-6 lg:px-8 lg:py-8">
          <p className="text-sm text-muted-foreground">Carregando perfil...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Perfil</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie sua conta e preferencias
          </p>
        </div>

        <div className="mb-4 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/50">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold">
              {getInitials(name || baseName)}
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full rounded-lg border border-input bg-muted px-3 py-1.5 text-sm text-muted-foreground"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-foreground truncate">
                    {baseName}
                  </h2>
                  <p className="text-sm text-muted-foreground truncate">
                    {email}
                  </p>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            disabled={saving}
            className={cn(
              "mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-60",
              isEditing
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "border border-input bg-background text-foreground hover:bg-muted"
            )}
          >
            <Edit3 className="h-4 w-4" />
            {saving
              ? "Salvando..."
              : isEditing
              ? "Salvar alteracoes"
              : "Editar perfil"}
          </button>

          {feedback && (
            <p className="mt-3 text-sm text-muted-foreground">{feedback}</p>
          )}
        </div>

        <div className="mb-4 rounded-2xl bg-card shadow-sm ring-1 ring-border/50 overflow-hidden">
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                {isDark ? (
                  <Moon className="h-4 w-4 text-foreground" />
                ) : (
                  <Sun className="h-4 w-4 text-foreground" />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Modo escuro</p>
                <p className="text-xs text-muted-foreground">
                  {isDark ? "Ativado" : "Desativado"}
                </p>
              </div>
            </div>
            <div
              className={cn(
                "relative h-7 w-12 rounded-full transition-colors duration-200",
                isDark ? "bg-primary" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 h-6 w-6 rounded-full bg-card shadow-sm transition-all duration-200",
                  isDark ? "left-[calc(100%-1.625rem)]" : "left-0.5"
                )}
              />
            </div>
          </button>

          <div className="mx-4 h-px bg-border" />

          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                <Bell className="h-4 w-4 text-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Notificacoes</p>
                <p className="text-xs text-muted-foreground">Lembretes e alertas</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="mx-4 h-px bg-border" />

          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                <Shield className="h-4 w-4 text-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Privacidade</p>
                <p className="text-xs text-muted-foreground">Dados e seguranca</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="mx-4 h-px bg-border" />

          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                <HelpCircle className="h-4 w-4 text-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Ajuda</p>
                <p className="text-xs text-muted-foreground">FAQ e suporte</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="mb-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
              <Info className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">MercadoApp</p>
              <p className="text-xs text-muted-foreground">Versao 1.0.0</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/10 py-3.5 text-sm font-medium text-destructive transition-all hover:bg-destructive/20 active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4" />
          Sair da conta
        </button>
      </div>
    </AppLayout>
  )
}
