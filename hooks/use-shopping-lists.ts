"use client"

import { useCallback, useMemo, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/clients/supabase-browser"
import { categories, toNumber } from "@/lib/market/constants"
import type { ShoppingList, ShoppingListItem } from "@/lib/market/types"

interface CreateItemInput {
  name: string
  category?: string
  unit?: string
  plannedQuantity?: number
}

function mapListItem(item: any): ShoppingListItem {
  return {
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
  }
}

function mapList(row: any): ShoppingList {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    created_at: row.created_at,
    started_at: row.started_at,
    completed_at: row.completed_at,
    shopping_list_items: (row.shopping_list_items ?? []).map(mapListItem),
  }
}

export function useShoppingLists() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadLists = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from("shopping_lists")
      .select(
        "id,name,status,created_at,started_at,completed_at,shopping_list_items(id,list_id,name,category,unit,planned_quantity,purchased_quantity,unit_price,is_purchased,is_urgent,position,created_at)"
      )
      .order("created_at", { ascending: false })
      .order("position", { foreignTable: "shopping_list_items", ascending: true })
      .order("created_at", { foreignTable: "shopping_list_items", ascending: true })

    if (queryError) {
      setError(queryError.message)
      setLoading(false)
      return
    }

    setLists((data ?? []).map(mapList))
    setLoading(false)
  }, [supabase])

  const createList = useCallback(
    async (name: string) => {
      const { data, error: insertError } = await supabase
        .from("shopping_lists")
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          name: name.trim(),
        })
        .select("id")
        .single()

      if (insertError) {
        return { error: insertError.message, listId: null as string | null }
      }

      await loadLists()
      return { error: null, listId: data.id as string }
    },
    [loadLists, supabase]
  )

  const copyList = useCallback(
    async (sourceListId: string, newListName: string) => {
      const source = lists.find((list) => list.id === sourceListId)
      if (!source) {
        return { error: "Lista de origem nao encontrada." }
      }

      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) {
        return { error: "Usuario nao autenticado." }
      }

      const { data: listData, error: listError } = await supabase
        .from("shopping_lists")
        .insert({
          user_id: userId,
          name: newListName.trim(),
          status: "draft",
          source_list_id: source.id,
        })
        .select("id")
        .single()

      if (listError) {
        return { error: listError.message }
      }

      if (source.shopping_list_items.length > 0) {
        const payload = source.shopping_list_items.map((item, index) => ({
          user_id: userId,
          list_id: listData.id,
          name: item.name,
          category: item.category,
          unit: item.unit,
          planned_quantity: item.planned_quantity,
          is_urgent: item.is_urgent,
          is_purchased: false,
          position: index,
        }))

        const { error: itemError } = await supabase
          .from("shopping_list_items")
          .insert(payload)

        if (itemError) {
          return { error: itemError.message }
        }
      }

      await loadLists()
      return { error: null }
    },
    [lists, loadLists, supabase]
  )

  const addItemToList = useCallback(
    async (listId: string, input: CreateItemInput) => {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) {
        return { error: "Usuario nao autenticado." }
      }

      const sourceList = lists.find((list) => list.id === listId)
      const nextPosition = sourceList?.shopping_list_items.length ?? 0

      const { error: insertError } = await supabase
        .from("shopping_list_items")
        .insert({
          user_id: userId,
          list_id: listId,
          name: input.name.trim(),
          category: input.category ?? "Outros",
          unit: input.unit ?? "un",
          planned_quantity: input.plannedQuantity ?? 1,
          position: nextPosition,
        })

      if (insertError) {
        return { error: insertError.message }
      }

      await loadLists()
      return { error: null }
    },
    [lists, loadLists, supabase]
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      const { error: removeError } = await supabase
        .from("shopping_list_items")
        .delete()
        .eq("id", itemId)

      if (removeError) {
        return { error: removeError.message }
      }

      await loadLists()
      return { error: null }
    },
    [loadLists, supabase]
  )

  const toggleUrgent = useCallback(
    async (itemId: string, nextUrgent: boolean) => {
      const { error: updateError } = await supabase
        .from("shopping_list_items")
        .update({ is_urgent: nextUrgent })
        .eq("id", itemId)

      if (updateError) {
        return { error: updateError.message }
      }

      await loadLists()
      return { error: null }
    },
    [loadLists, supabase]
  )

  const startList = useCallback(
    async (listId: string) => {
      const { error: updateError } = await supabase
        .from("shopping_lists")
        .update({ status: "shopping", started_at: new Date().toISOString() })
        .eq("id", listId)

      if (updateError) {
        return { error: updateError.message }
      }

      await loadLists()
      return { error: null }
    },
    [loadLists, supabase]
  )

  const markItemPurchased = useCallback(
    async (itemId: string, purchasedQuantity: number, unitPrice: number) => {
      const { error: updateError } = await supabase
        .from("shopping_list_items")
        .update({
          is_purchased: true,
          purchased_quantity: purchasedQuantity,
          unit_price: unitPrice,
        })
        .eq("id", itemId)

      if (updateError) {
        return { error: updateError.message }
      }

      await loadLists()
      return { error: null }
    },
    [loadLists, supabase]
  )

  const returnPurchasedItem = useCallback(
    async (itemId: string) => {
      const { error: updateError } = await supabase
        .from("shopping_list_items")
        .update({
          is_purchased: false,
          purchased_quantity: null,
          unit_price: null,
        })
        .eq("id", itemId)

      if (updateError) {
        return { error: updateError.message }
      }

      await loadLists()
      return { error: null }
    },
    [loadLists, supabase]
  )

  const finishList = useCallback(
    async (listId: string) => {
      const { error: finalizeError } = await supabase.rpc(
        "finalize_shopping_list",
        { p_list_id: listId }
      )

      if (finalizeError) {
        return { error: finalizeError.message }
      }

      await loadLists()
      return { error: null }
    },
    [loadLists, supabase]
  )

  return {
    lists,
    loading,
    error,
    categories,
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
  }
}
