"use client"

import { useEffect, useMemo, useState } from "react"
import {
  DollarSign,
  TrendingDown,
  AlertTriangle,
  CalendarClock,
  Plus,
  ShoppingCart,
  Package,
  X,
} from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/store"
import { useAuth } from "@/hooks/use-auth"
import { useDashboardData } from "@/hooks/use-dashboard-data"

function getFirstName(fullName: string) {
  const clean = fullName.trim()
  if (!clean) return "Usuario"
  return clean.split(" ")[0]
}

export default function InicioPage() {
  const [showFab, setShowFab] = useState(false)
  const { profile, user } = useAuth()
  const { stats, loading, error, loadDashboard } = useDashboardData()

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const fallbackName = user?.email?.split("@")[0] ?? "Usuario"
  const displayName = getFirstName(
    profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? fallbackName
  )

  const previousMonthText = useMemo(() => {
    if (!stats) return "Sem dados"
    if (stats.previousMonthTotal == null) return "Sem historico no mes anterior"

    const delta = stats.previousMonthTotal - stats.currentMonthTotal
    if (delta >= 0) {
      return `${formatCurrency(delta)} de economia`
    }

    return `${formatCurrency(Math.abs(delta))} acima do mes anterior`
  }, [stats])

  const nextItems = (stats?.nextList?.shopping_list_items ?? [])
    .filter((item) => !item.is_purchased)
    .slice(0, 4)

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Ola, {displayName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Aqui esta o resumo das suas compras</p>
        </div>

        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Total do Mes</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {loading || !stats ? "..." : formatCurrency(stats.currentMonthTotal)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats?.currentMonthCompletedLists ?? 0} compras realizadas
            </p>
          </div>

          <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <TrendingDown className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Comparativo</span>
            </div>
            <p className={cn("text-2xl font-semibold", stats?.previousMonthTotal != null && stats.previousMonthTotal < stats.currentMonthTotal ? "text-destructive" : "text-primary")}>
              {stats?.previousMonthTotal == null || !stats ? "-" : formatCurrency(Math.abs(stats.previousMonthTotal - stats.currentMonthTotal))}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{previousMonthText}</p>
          </div>
        </div>

        <div className="mb-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">Itens em falta</h2>
            </div>
            <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
              {(stats?.lowStockItems.length ?? 0)} itens
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {(stats?.lowStockItems ?? []).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-background p-3">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{item.quantity} {item.unit}</span>
              </div>
            ))}

            {!loading && (stats?.lowStockItems.length ?? 0) === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum item em falta no momento.</p>
            )}
          </div>
        </div>

        <div className="mb-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <CalendarClock className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">Proxima compra</h2>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {nextItems.length} itens
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {nextItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-background p-3">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{item.planned_quantity} {item.unit}</span>
                  {item.is_urgent && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-medium text-warning-foreground">Urgente</span>}
                </div>
              </div>
            ))}

            {!loading && nextItems.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma lista pendente para compra.</p>
            )}
          </div>
        </div>

        <div className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-20">
          {showFab && (
            <div className="mb-3 flex flex-col gap-2 items-end animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button type="button" onClick={() => setShowFab(false)} className="flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-lg ring-1 ring-border/50 hover:bg-muted">
                <ShoppingCart className="h-4 w-4" />Novo item na lista
              </button>
              <button type="button" onClick={() => setShowFab(false)} className="flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-lg ring-1 ring-border/50 hover:bg-muted">
                <Package className="h-4 w-4" />Atualizar estoque
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowFab(!showFab)}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95",
              showFab && "rotate-45"
            )}
            aria-label="Adicionar item"
          >
            {showFab ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
