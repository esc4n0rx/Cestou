"use client"

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Play,
  Plus,
  Search,
  ShoppingCart,
  X,
} from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/store"
import type { ShoppingList, ShoppingListItem } from "@/lib/store"
import { useShoppingLists } from "@/hooks/use-shopping-lists"

type View = "all" | "detail"

function fmtDate(value: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
}

function listTotal(list: ShoppingList) {
  return list.shopping_list_items.reduce((sum, item) => {
    if (!item.is_purchased || item.unit_price == null || item.purchased_quantity == null) {
      return sum
    }
    return sum + item.unit_price * item.purchased_quantity
  }, 0)
}

function vibrateLight() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(15)
  }
}

function PurchaseModal({
  item,
  onCancel,
  onConfirm,
}: {
  item: ShoppingListItem
  onCancel: () => void
  onConfirm: (qty: number, price: number) => void
}) {
  const [qty, setQty] = useState(String(item.planned_quantity))
  const [price, setPrice] = useState("")

  const q = Number.parseFloat(qty.replace(",", "."))
  const p = Number.parseFloat(price.replace(",", "."))
  const valid = !Number.isNaN(q) && q >= 0 && !Number.isNaN(p) && p >= 0

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border/50">
        <h3 className="text-base font-semibold text-foreground">Finalizar item</h3>
        <p className="text-sm text-muted-foreground mb-4">{item.name}</p>

        <div className="space-y-3">
          <input
            type="text"
            inputMode="decimal"
            value={qty}
            onChange={(e) => setQty(e.target.value.replace(/[^0-9,\.]/g, ""))}
            placeholder="Quantidade comprada"
            className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm"
          />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9,\.]/g, ""))}
              placeholder="Preco por unidade"
              className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-input py-2.5 text-sm">Cancelar</button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onConfirm(q, p)}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm text-primary-foreground disabled:opacity-40"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
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
      <div className="relative z-10 w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">{title}</h3>
        {children}
      </div>
    </div>
  )
}

export default function ListaPage() {
  const {
    lists,
    loading,
    error,
    categories,
    categoriesLoading,
    categoriesError,
    loadLists,
    createList,
    copyList,
    addItemToList,
    removeItem,
    toggleUrgent,
    startList,
    markItemPurchased,
    returnPurchasedItem,
    finishList,
  } = useShoppingLists()

  const [view, setView] = useState<View>("all")
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [showNew, setShowNew] = useState(false)
  const [showCopy, setShowCopy] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [copySourceId, setCopySourceId] = useState("")
  const [copyName, setCopyName] = useState("")

  const [purchaseItem, setPurchaseItem] = useState<ShoppingListItem | null>(null)

  const [newItemName, setNewItemName] = useState("")
  const [newItemQty, setNewItemQty] = useState("1")
  const [newItemCategory, setNewItemCategory] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeList = useMemo(
    () => lists.find((list) => list.id === activeListId) ?? null,
    [activeListId, lists]
  )

  useEffect(() => {
    loadLists()
  }, [loadLists])

  useEffect(() => {
    if (!newItemCategory && categories.length > 0) {
      setNewItemCategory(categories[0].name)
    }
  }, [categories, newItemCategory])

  useEffect(() => {
    if (
      selectedCategory !== "Todos" &&
      categories.length > 0 &&
      !categories.some((category) => category.name === selectedCategory)
    ) {
      setSelectedCategory("Todos")
    }
  }, [categories, selectedCategory])

  const openList = (id: string) => {
    setActiveListId(id)
    setView("detail")
    setFeedback(null)
  }

  const onCreateList = async () => {
    if (!newListName.trim()) return
    setBusy(true)
    const result = await createList(newListName.trim())
    setBusy(false)
    if (result.error || !result.listId) {
      setFeedback(result.error ?? "Erro ao criar lista")
      return
    }
    setShowNew(false)
    setNewListName("")
    openList(result.listId)
  }

  const onCopyList = async () => {
    if (!copySourceId || !copyName.trim()) return
    setBusy(true)
    const result = await copyList(copySourceId, copyName.trim())
    setBusy(false)
    if (result.error) {
      setFeedback(result.error)
      return
    }
    setShowCopy(false)
  }
  if (view === "all") {
    const activeLists = lists.filter((list) => list.status !== "completed")
    const completedLists = lists.filter((list) => list.status === "completed")

    return (
      <AppLayout>
        <div className="mx-auto max-w-2xl px-4 py-6 lg:px-8 lg:py-8">
          <div className="flex items-center justify-between mb-6 gap-2">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Minhas listas</h1>
              <p className="mt-1 text-sm text-muted-foreground">{lists.length} listas no total</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const first = lists[0]
                  setCopySourceId(first?.id ?? "")
                  setCopyName(first ? `Copia de ${first.name}` : "")
                  setShowCopy(true)
                }}
                disabled={lists.length === 0}
                className="flex items-center gap-1 rounded-xl border border-input bg-card px-3 py-2.5 text-sm"
              >
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Copiar</span>
              </button>
              <button
                type="button"
                onClick={() => setShowNew(true)}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova lista</span>
              </button>
            </div>
          </div>

          {feedback && <p className="mb-4 text-sm text-destructive">{feedback}</p>}
          {loading && <p className="text-sm text-muted-foreground">Carregando listas...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-2">
            {activeLists.map((list) => {
              const bought = list.shopping_list_items.filter((item) => item.is_purchased).length
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => openList(list.id)}
                  className="w-full text-left rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{list.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {bought}/{list.shopping_list_items.length} itens · {fmtDate(list.created_at)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              )
            })}
          </div>

          {completedLists.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Finalizadas</p>
              <div className="space-y-2">
                {completedLists.map((list) => (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => openList(list.id)}
                    className="w-full text-left rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{list.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fmtDate(list.completed_at)} · {formatCurrency(listTotal(list))}
                        </p>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showNew && (
            <SimpleModal title="Nova lista" onCancel={() => setShowNew(false)}>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full rounded-xl border border-input bg-background py-3 px-4 text-sm mb-4"
                placeholder="Nome da lista"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 rounded-xl border border-input py-2.5 text-sm">Cancelar</button>
                <button type="button" onClick={onCreateList} disabled={busy || !newListName.trim()} className="flex-1 rounded-xl bg-primary py-2.5 text-sm text-primary-foreground disabled:opacity-40">Criar</button>
              </div>
            </SimpleModal>
          )}

          {showCopy && (
            <SimpleModal title="Copiar lista" onCancel={() => setShowCopy(false)}>
              <select
                value={copySourceId}
                onChange={(e) => {
                  const id = e.target.value
                  setCopySourceId(id)
                  const source = lists.find((list) => list.id === id)
                  setCopyName(source ? `Copia de ${source.name}` : "")
                }}
                className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm mb-3"
              >
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>{list.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={copyName}
                onChange={(e) => setCopyName(e.target.value)}
                className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm mb-4"
                placeholder="Nome da nova lista"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCopy(false)} className="flex-1 rounded-xl border border-input py-2.5 text-sm">Cancelar</button>
                <button type="button" onClick={onCopyList} disabled={busy || !copySourceId || !copyName.trim()} className="flex-1 rounded-xl bg-primary py-2.5 text-sm text-primary-foreground disabled:opacity-40">Copiar</button>
              </div>
            </SimpleModal>
          )}
        </div>
      </AppLayout>
    )
  }

  if (!activeList) return null

  const isDraft = activeList.status === "draft"
  const isShopping = activeList.status === "shopping"
  const isCompleted = activeList.status === "completed"

  const filtered = activeList.shopping_list_items.filter((item) => {
    const byName = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const byCat = selectedCategory === "Todos" || item.category === selectedCategory
    return byName && byCat
  })
  const categoryOrder = useMemo(
    () =>
      new Map(
        categories.map((category, index) => [
          category.name,
          category.position ?? index,
        ])
      ),
    [categories]
  )
  const categoryLabel = useCallback(
    (name: string) => {
      const match = categories.find((category) => category.name === name)
      if (!match) return name
      return `${match.emoji} ${match.name}`
    },
    [categories]
  )
  const sortByCategory = useCallback(
    (items: ShoppingListItem[]) =>
      [...items].sort((a, b) => {
        const orderA = categoryOrder.get(a.category) ?? Number.MAX_SAFE_INTEGER
        const orderB = categoryOrder.get(b.category) ?? Number.MAX_SAFE_INTEGER
        if (orderA !== orderB) return orderA - orderB
        return a.name.localeCompare(b.name)
      }),
    [categoryOrder]
  )
  const pending = isShopping
    ? sortByCategory(filtered.filter((item) => !item.is_purchased))
    : filtered.filter((item) => !item.is_purchased)
  const bought = isShopping
    ? sortByCategory(filtered.filter((item) => item.is_purchased))
    : filtered.filter((item) => item.is_purchased)
  const boughtCount = activeList.shopping_list_items.filter((item) => item.is_purchased).length
  const activeCategories = categories.filter((category) => category.is_active)

  const addItem = async () => {
    if (!newItemName.trim()) return
    const qty = Number.parseFloat(newItemQty.replace(",", "."))
    const planned = Number.isNaN(qty) || qty <= 0 ? 1 : qty
    setBusy(true)
    const result = await addItemToList(activeList.id, {
      name: newItemName.trim(),
      plannedQuantity: planned,
      category: newItemCategory || "Outros",
    })
    setBusy(false)
    if (result.error) return setFeedback(result.error)
    setNewItemName("")
    setNewItemQty("1")
    setNewItemCategory(activeCategories[0]?.name ?? "")
    inputRef.current?.focus()
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-4 py-6 lg:px-8 lg:py-8">
        <button type="button" onClick={() => setView("all")} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3"><ArrowLeft className="h-4 w-4" />Voltar</button>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{activeList.name}</h1>
            <p className="text-sm text-muted-foreground">{boughtCount}/{activeList.shopping_list_items.length} itens</p>
          </div>
          {isDraft && activeList.shopping_list_items.length > 0 && (
            <button type="button" onClick={async () => {
              setBusy(true)
              const result = await startList(activeList.id)
              setBusy(false)
              if (result.error) setFeedback(result.error)
            }} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              <Play className="h-4 w-4" />Iniciar
            </button>
          )}
          {isShopping && (
            <button type="button" disabled={busy || boughtCount === 0} onClick={async () => {
              setBusy(true)
              const result = await finishList(activeList.id)
              setBusy(false)
              if (result.error) return setFeedback(result.error)
              setView("all")
              setActiveListId(null)
            }} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm text-primary-foreground disabled:opacity-40">
              <CheckCircle2 className="h-4 w-4" />Finalizar
            </button>
          )}
        </div>

        {feedback && <p className="mb-3 text-sm text-destructive">{feedback}</p>}
        {categoriesError && (
          <p className="mb-3 text-sm text-destructive">{categoriesError}</p>
        )}

        {!isCompleted && (
          <div className="mb-3 space-y-2">
            <input
              ref={inputRef}
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="Adicionar item..."
              className="w-full rounded-xl border border-input bg-card py-3 px-4 text-sm"
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_auto]">
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                disabled={categoriesLoading}
                className="min-w-0 rounded-xl border border-input bg-card py-3 px-3 text-sm"
              >
                {activeCategories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.emoji} {category.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newItemQty}
                onChange={(e) =>
                  setNewItemQty(e.target.value.replace(/[^0-9,\.]/g, ""))
                }
                placeholder="Quantidade"
                className="min-w-0 rounded-xl border border-input bg-card py-3 px-3 text-sm"
              />
              <button
                type="button"
                onClick={addItem}
                className="flex h-12 min-w-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-primary-foreground sm:min-w-28"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline text-sm font-medium">Adicionar</span>
              </button>
            </div>
          </div>
        )}

        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar item..." className="w-full rounded-xl border border-input bg-card py-2.5 pl-9 pr-4 text-sm" />
          </div>
          <div className="relative">
            <button type="button" onClick={() => setShowCategoryFilter(!showCategoryFilter)} className="flex h-full items-center gap-1.5 rounded-xl border border-input bg-card px-3 text-sm">
              <span className="hidden sm:inline">{selectedCategory === "Todos" ? "Todos" : categoryLabel(selectedCategory)}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {showCategoryFilter && (
              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-border bg-card p-1 shadow-lg">
                <button type="button" onClick={() => {
                  setSelectedCategory("Todos")
                  setShowCategoryFilter(false)
                }} className={cn("w-full rounded-lg px-3 py-2 text-left text-sm", selectedCategory === "Todos" ? "bg-primary/10 text-primary" : "hover:bg-muted")}>Todos</button>
                {activeCategories.map((category) => (
                  <button key={category.name} type="button" onClick={() => {
                    setSelectedCategory(category.name)
                    setShowCategoryFilter(false)
                  }} className={cn("w-full rounded-lg px-3 py-2 text-left text-sm", selectedCategory === category.name ? "bg-primary/10 text-primary" : "hover:bg-muted")}>{category.emoji} {category.name}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {pending.map((item) => (
            <div key={item.id} className="group flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50">
              <button type="button" onClick={() => {
                if (!isShopping) return setFeedback("Inicie a lista para marcar compras")
                setPurchaseItem(item)
              }} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/5"><Check className="h-3 w-3 text-transparent" /></button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="text-sm font-medium text-foreground truncate">{item.name}</span>{item.is_urgent && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px]">Urgente</span>}</div>
                <p className="text-xs text-muted-foreground">{item.planned_quantity} {item.unit} · {categoryLabel(item.category)}</p>
              </div>
              {!isCompleted && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  <button type="button" onClick={async () => {
                    const result = await toggleUrgent(item.id, !item.is_urgent)
                    if (result.error) setFeedback(result.error)
                  }} className="rounded-lg p-1.5 text-xs">!</button>
                  <button type="button" onClick={async () => {
                    const result = await removeItem(item.id)
                    if (result.error) setFeedback(result.error)
                  }} className="rounded-lg p-1.5 text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </div>
          ))}
        </div>

        {bought.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-sm text-muted-foreground">Comprados ({bought.length})</p>
            {bought.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-card/60 p-4 ring-1 ring-border/30">
                <button type="button" onClick={async () => {
                  if (isCompleted) return
                  const result = await returnPurchasedItem(item.id)
                  if (result.error) setFeedback(result.error)
                }} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary"><Check className="h-3 w-3 text-primary-foreground" /></button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground line-through truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.purchased_quantity ?? 0} {item.unit} · {item.unit_price != null ? formatCurrency(item.unit_price) : "R$ 0,00"}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {purchaseItem && (
          <PurchaseModal
            item={purchaseItem}
            onCancel={() => setPurchaseItem(null)}
            onConfirm={async (qty, price) => {
              setBusy(true)
              const result = await markItemPurchased(purchaseItem.id, qty, price)
              setBusy(false)
              if (result.error) {
                setFeedback(result.error)
                return
              }
              vibrateLight()
              setPurchaseItem(null)
            }}
          />
        )}
      </div>
    </AppLayout>
  )
}
