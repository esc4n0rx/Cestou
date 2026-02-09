"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  LogOut,
  Edit3,
  Moon,
  Sun,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Bell,
  Shield,
  HelpCircle,
  Info,
  ListOrdered,
  Plus,
  Trash2,
} from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useCategories } from "@/hooks/use-categories"

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function SimpleModal({
  title,
  children,
  onCancel,
}: {
  title: string
  children: ReactNode
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-xl mx-4 mb-4 sm:mb-0 rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">{title}</h3>
        {children}
      </div>
    </div>
  )
}

export default function PerfilPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user, profile, signOut, updateProfileName, loading } = useAuth()
  const { categories, loading: categoriesLoading, saveCategories } = useCategories()

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [feedback, setFeedback] = useState("")
  const [saving, setSaving] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [categoryDrafts, setCategoryDrafts] = useState<
    Array<{ id?: string; name: string; emoji: string; is_active: boolean }>
  >([])
  const [savingCategories, setSavingCategories] = useState(false)
  const [categoryFeedback, setCategoryFeedback] = useState("")

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

  useEffect(() => {
    if (showCategories) {
      setCategoryDrafts(
        categories.map((category) => ({
          id: category.id,
          name: category.name,
          emoji: category.emoji,
          is_active: category.is_active,
        }))
      )
    }
  }, [categories, showCategories])

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

  const moveCategory = (index: number, direction: "up" | "down") => {
    setCategoryDrafts((prev) => {
      const next = [...prev]
      const targetIndex = direction === "up" ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      const [moved] = next.splice(index, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  const removeCategory = (index: number) => {
    setCategoryDrafts((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleSaveCategories = async () => {
    setCategoryFeedback("")
    setSavingCategories(true)

    const sanitized = categoryDrafts
      .map((category) => ({
        ...category,
        name: category.name.trim(),
        emoji: category.emoji.trim() || "🛒",
      }))
      .filter((category) => category.name)

    if (sanitized.length === 0) {
      setCategoryFeedback("Inclua pelo menos uma categoria.")
      setSavingCategories(false)
      return
    }

    const result = await saveCategories(sanitized)
    setSavingCategories(false)
    if (result.error) {
      setCategoryFeedback(result.error)
      return
    }

    setCategoryFeedback("Categorias atualizadas.")
    setShowCategories(false)
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
            onClick={() => setShowCategories(true)}
            className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                <ListOrdered className="h-4 w-4 text-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Ajustar categorias</p>
                <p className="text-xs text-muted-foreground">Ordem, emoji e visibilidade</p>
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

      {showCategories && (
        <SimpleModal title="Ajustar categorias" onCancel={() => setShowCategories(false)}>
          <p className="text-xs text-muted-foreground mb-4">
            Reordene as categorias da lista e defina os emojis que aparecem na compra.
          </p>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {categoryDrafts.map((category, index) => (
              <div key={category.id ?? `${category.name}-${index}`} className="rounded-xl border border-border p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={category.emoji}
                    onChange={(e) =>
                      setCategoryDrafts((prev) =>
                        prev.map((item, idx) =>
                          idx === index ? { ...item, emoji: e.target.value } : item
                        )
                      )
                    }
                    className="w-14 rounded-lg border border-input bg-background px-2 py-1.5 text-center text-sm"
                    maxLength={2}
                  />
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) =>
                      setCategoryDrafts((prev) =>
                        prev.map((item, idx) =>
                          idx === index ? { ...item, name: e.target.value } : item
                        )
                      )
                    }
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
                    placeholder="Nome da categoria"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setCategoryDrafts((prev) =>
                        prev.map((item, idx) =>
                          idx === index
                            ? { ...item, is_active: !item.is_active }
                            : item
                        )
                      )
                    }
                    className={cn(
                      "rounded-lg px-2 py-1 text-xs font-medium",
                      category.is_active
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {category.is_active ? "Ativo" : "Oculto"}
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveCategory(index, "up")}
                      className="rounded-lg border border-input p-1 text-muted-foreground"
                      aria-label="Mover para cima"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCategory(index, "down")}
                      className="rounded-lg border border-input p-1 text-muted-foreground"
                      aria-label="Mover para baixo"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCategory(index)}
                    className="rounded-lg border border-destructive/30 p-1 text-destructive"
                    aria-label="Remover categoria"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setCategoryDrafts((prev) => [
                ...prev,
                { name: "", emoji: "🛒", is_active: true },
              ])
            }
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-background py-2.5 text-sm"
          >
            <Plus className="h-4 w-4" />
            Adicionar categoria
          </button>

          {categoryFeedback && (
            <p className="mt-3 text-sm text-muted-foreground">{categoryFeedback}</p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setShowCategories(false)}
              className="flex-1 rounded-xl border border-input py-2.5 text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveCategories}
              disabled={savingCategories || categoriesLoading}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm text-primary-foreground disabled:opacity-40"
            >
              {savingCategories ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </SimpleModal>
      )}
    </AppLayout>
  )
}
