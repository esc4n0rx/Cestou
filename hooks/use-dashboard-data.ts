"use client"

import { useCallback, useMemo, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/clients/supabase-browser"
import { toNumber } from "@/lib/market/constants"
import type { DashboardStats, InventoryItem, ShoppingList } from "@/lib/market/types"

function getMonthWindow(year: number, monthIndex: number) {
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0)
  const end = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0)
  return { start: start.toISOString(), end: end.toISOString() }
}

function mapInventoryItem(row: any): InventoryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? "Outros",
    unit: row.unit ?? "un",
    quantity: toNumber(row.quantity),
    low_threshold: toNumber(row.low_threshold),
    updated_at: row.updated_at,
  }
}

function mapNextList(row: any): ShoppingList {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    created_at: row.created_at,
    started_at: row.started_at,
    completed_at: row.completed_at,
    shopping_list_items: (row.shopping_list_items ?? []).map((item: any) => ({
      id: item.id,
      list_id: item.list_id,
      name: item.name,
      category: item.category ?? "Outros",
      unit: item.unit ?? "un",
      planned_quantity: toNumber(item.planned_quantity),
      purchased_quantity:
        item.purchased_quantity == null ? null : toNumber(item.purchased_quantity),
      unit_price: item.unit_price == null ? null : toNumber(item.unit_price),
      is_purchased: Boolean(item.is_purchased),
      is_urgent: Boolean(item.is_urgent),
      position: item.position ?? 0,
      created_at: item.created_at,
    })),
  }
}

export function useDashboardData() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)

    const now = new Date()
    const currentWindow = getMonthWindow(now.getFullYear(), now.getMonth())
    const previousWindow = getMonthWindow(now.getFullYear(), now.getMonth() - 1)

    const [completedResponse, lowStockResponse, nextListResponse] = await Promise.all([
      supabase
        .from("shopping_lists")
        .select(
          "id,completed_at,shopping_list_items(unit_price,purchased_quantity,is_purchased)"
        )
        .eq("status", "completed")
        .gte("completed_at", previousWindow.start)
        .lt("completed_at", currentWindow.end),
      supabase
        .from("inventory_items")
        .select("id,name,category,unit,quantity,low_threshold,updated_at")
        .order("quantity", { ascending: true })
        .limit(20),
      supabase
        .from("shopping_lists")
        .select(
          "id,name,status,created_at,started_at,completed_at,shopping_list_items(id,list_id,name,category,unit,planned_quantity,purchased_quantity,unit_price,is_purchased,is_urgent,position,created_at)"
        )
        .in("status", ["draft", "shopping"])
        .order("created_at", { ascending: false })
        .order("position", { foreignTable: "shopping_list_items", ascending: true })
        .limit(1),
    ])

    if (completedResponse.error) {
      setError(completedResponse.error.message)
      setLoading(false)
      return
    }

    if (lowStockResponse.error) {
      setError(lowStockResponse.error.message)
      setLoading(false)
      return
    }

    if (nextListResponse.error) {
      setError(nextListResponse.error.message)
      setLoading(false)
      return
    }

    let currentMonthTotal = 0
    let previousMonthTotal = 0
    let currentMonthCompletedLists = 0

    for (const list of completedResponse.data ?? []) {
      if (!list.completed_at) {
        continue
      }

      const completedAt = new Date(list.completed_at)
      const inCurrent =
        completedAt.toISOString() >= currentWindow.start &&
        completedAt.toISOString() < currentWindow.end
      const inPrevious =
        completedAt.toISOString() >= previousWindow.start &&
        completedAt.toISOString() < previousWindow.end

      let listTotal = 0
      for (const item of list.shopping_list_items ?? []) {
        if (!item.is_purchased) {
          continue
        }

        const qty = toNumber(item.purchased_quantity)
        const unitPrice = toNumber(item.unit_price)
        listTotal += qty * unitPrice
      }

      if (inCurrent) {
        currentMonthTotal += listTotal
        currentMonthCompletedLists += 1
      }

      if (inPrevious) {
        previousMonthTotal += listTotal
      }
    }

    const lowStockItems = (lowStockResponse.data ?? [])
      .map(mapInventoryItem)
      .filter((item) => item.quantity <= item.low_threshold)
      .slice(0, 5)

    const nextListRow = (nextListResponse.data ?? [])[0] ?? null
    const nextList = nextListRow ? mapNextList(nextListRow) : null

    setStats({
      currentMonthTotal,
      previousMonthTotal: previousMonthTotal > 0 ? previousMonthTotal : null,
      currentMonthCompletedLists,
      lowStockItems,
      nextList,
    })
    setLoading(false)
  }, [supabase])

  return {
    stats,
    loading,
    error,
    loadDashboard,
  }
}
