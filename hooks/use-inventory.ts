"use client"

import { useCallback, useMemo, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/clients/supabase-browser"
import { categories, toNumber } from "@/lib/market/constants"
import type { InventoryItem } from "@/lib/market/types"

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

export function useInventory() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadInventory = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from("inventory_items")
      .select("id,name,category,unit,quantity,low_threshold,updated_at")
      .order("updated_at", { ascending: false })

    if (queryError) {
      setError(queryError.message)
      setLoading(false)
      return
    }

    setItems((data ?? []).map(mapInventoryItem))
    setLoading(false)
  }, [supabase])

  const decrementItem = useCallback(
    async (itemId: string, amount = 1) => {
      const { error: rpcError } = await supabase.rpc("decrement_inventory_item", {
        p_item_id: itemId,
        p_amount: amount,
      })

      if (rpcError) {
        return { error: rpcError.message }
      }

      await loadInventory()
      return { error: null }
    },
    [loadInventory, supabase]
  )

  return {
    items,
    loading,
    error,
    categories,
    loadInventory,
    decrementItem,
  }
}
