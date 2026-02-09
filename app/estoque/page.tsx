"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Minus, Package, Search, ChevronDown, LayoutGrid, List } from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { cn } from "@/lib/utils"
import { useInventory } from "@/hooks/use-inventory"
import type { InventoryItem } from "@/lib/store"

function getStockLevel(item: InventoryItem) {
  if (item.quantity <= 0) return "empty"
  if (item.quantity <= item.low_threshold) return "low"
  return "ok"
}

function getStockLabel(level: string) {
  if (level === "empty") return "Sem estoque"
  if (level === "low") return "Baixo"
  return "Ok"
}

export default function EstoquePage() {
  const { items, loading, error, categories, loadInventory, decrementItem } = useInventory()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    loadInventory()
  }, [loadInventory])

  useEffect(() => {
    if (
      selectedCategory !== "Todos" &&
      categories.length > 0 &&
      !categories.some((category) => category.name === selectedCategory)
    ) {
      setSelectedCategory("Todos")
    }
  }, [categories, selectedCategory])

  const categoryLabel = useCallback(
    (name: string) => {
      const match = categories.find((category) => category.name === name)
      if (!match) return name
      return `${match.emoji} ${match.name}`
    },
    [categories]
  )

  const activeCategories = categories.filter((category) => category.is_active)

  const filteredStock = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === "Todos" || item.category === selectedCategory
        return matchesSearch && matchesCategory
      }),
    [items, searchQuery, selectedCategory]
  )

  const lowStockCount = items.filter((item) => item.quantity <= item.low_threshold).length

  const onDecrease = async (itemId: string) => {
    setBusyId(itemId)
    const result = await decrementItem(itemId, 1)
    setBusyId(null)
    if (result.error) {
      setFeedback(result.error)
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Estoque</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} produtos no estoque
            {lowStockCount > 0 && <span className="text-destructive"> · {lowStockCount} em baixa</span>}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Entrada de estoque acontece ao finalizar listas de compra.</p>
        </div>

        {feedback && <p className="mb-3 text-sm text-destructive">{feedback}</p>}
        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-input bg-card py-2.5 pl-9 pr-4 text-sm"
            />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCategoryFilter(!showCategoryFilter)}
              className="flex h-full items-center gap-1.5 rounded-xl border border-input bg-card px-3 text-sm"
            >
              <span className="hidden sm:inline">{selectedCategory === "Todos" ? "Todos" : categoryLabel(selectedCategory)}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {showCategoryFilter && (
              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-border bg-card p-1 shadow-lg">
                <button type="button" onClick={() => {
                  setSelectedCategory("Todos")
                  setShowCategoryFilter(false)
                }} className={cn("w-full rounded-lg px-3 py-2 text-left text-sm", selectedCategory === "Todos" ? "bg-primary/10 text-primary" : "hover:bg-muted")}>Todos</button>
                {activeCategories.map((cat) => (
                  <button key={cat.name} type="button" onClick={() => {
                    setSelectedCategory(cat.name)
                    setShowCategoryFilter(false)
                  }} className={cn("w-full rounded-lg px-3 py-2 text-left text-sm", selectedCategory === cat.name ? "bg-primary/10 text-primary" : "hover:bg-muted")}>{cat.emoji} {cat.name}</button>
                ))}
              </div>
            )}
          </div>

          <div className="flex rounded-xl border border-input bg-card overflow-hidden">
            <button type="button" onClick={() => setViewMode("grid")} className={cn("px-2.5", viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground")}><LayoutGrid className="h-4 w-4" /></button>
            <button type="button" onClick={() => setViewMode("list")} className={cn("px-2.5", viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground")}><List className="h-4 w-4" /></button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando estoque...</p>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredStock.map((item) => {
              const level = getStockLevel(item)
              return (
                <div key={item.id} className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">{categoryLabel(item.category)}</p>
                    </div>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", level === "empty" ? "bg-destructive/10 text-destructive" : level === "low" ? "bg-warning/20 text-warning-foreground" : "bg-primary/10 text-primary")}>{getStockLabel(level)}</span>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">{item.quantity} {item.unit}</p>

                  <button
                    type="button"
                    onClick={() => onDecrease(item.id)}
                    disabled={item.quantity <= 0 || busyId === item.id}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-background py-2.5 text-sm text-foreground disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                    Dar baixa
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredStock.map((item) => {
              const level = getStockLevel(item)
              return (
                <div key={item.id} className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">{item.name}</h3>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", level === "empty" ? "bg-destructive/10 text-destructive" : level === "low" ? "bg-warning/20 text-warning-foreground" : "bg-primary/10 text-primary")}>{getStockLabel(level)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{categoryLabel(item.category)} · {item.quantity} {item.unit}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDecrease(item.id)}
                    disabled={item.quantity <= 0 || busyId === item.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-background text-foreground disabled:opacity-40"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {filteredStock.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Nenhum produto encontrado</p>
            <p className="mt-1 text-xs text-muted-foreground">Finalize listas de compra para abastecer o estoque</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
