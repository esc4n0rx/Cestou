"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/clients/supabase-browser"
import { defaultCategories } from "@/lib/market/categories"

export interface ShoppingCategory {
  id: string
  name: string
  emoji: string
  position: number
  is_active: boolean
}

type CategoryInput = Omit<ShoppingCategory, "id"> & { id?: string }

function mapCategory(row: any): ShoppingCategory {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji ?? "🛒",
    position: row.position ?? 0,
    is_active: row.is_active ?? true,
  }
}

export function useCategories() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [categories, setCategories] = useState<ShoppingCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError(null)

    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) {
      setError("Usuario nao autenticado.")
      setLoading(false)
      return
    }

    const { data, error: queryError } = await supabase
      .from("shopping_categories")
      .select("id,name,emoji,position,is_active")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true })

    if (queryError) {
      setError(queryError.message)
      setLoading(false)
      return
    }

    if ((data ?? []).length === 0) {
      const payload = defaultCategories.map((category) => ({
        user_id: userId,
        name: category.name,
        emoji: category.emoji,
        position: category.position,
        is_active: category.is_active,
      }))

      const { error: seedError } = await supabase
        .from("shopping_categories")
        .insert(payload)

      if (seedError) {
        setError(seedError.message)
        setLoading(false)
        return
      }

      const { data: seededData, error: seededError } = await supabase
        .from("shopping_categories")
        .select("id,name,emoji,position,is_active")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true })

      if (seededError) {
        setError(seededError.message)
        setLoading(false)
        return
      }

      setCategories((seededData ?? []).map(mapCategory))
      setLoading(false)
      return
    }

    setCategories((data ?? []).map(mapCategory))
    setLoading(false)
  }, [supabase])

  const saveCategories = useCallback(
    async (nextCategories: CategoryInput[]) => {
      setError(null)

      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) {
        return { error: "Usuario nao autenticado." }
      }

      const payload = nextCategories.map((category, index) => ({
        id: category.id,
        user_id: userId,
        name: category.name.trim(),
        emoji: category.emoji.trim() || "🛒",
        position: index,
        is_active: category.is_active,
      }))

      const existingIds = categories.map((category) => category.id)
      const nextIds = payload
        .map((category) => category.id)
        .filter(Boolean) as string[]
      const idsToDelete = existingIds.filter((id) => !nextIds.includes(id))

      const { error: upsertError } = await supabase
        .from("shopping_categories")
        .upsert(payload, { onConflict: "id" })

      if (upsertError) {
        setError(upsertError.message)
        return { error: upsertError.message }
      }

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("shopping_categories")
          .delete()
          .in("id", idsToDelete)

        if (deleteError) {
          setError(deleteError.message)
          return { error: deleteError.message }
        }
      }

      await loadCategories()
      return { error: null }
    },
    [categories, loadCategories, supabase]
  )

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  return {
    categories,
    loading,
    error,
    loadCategories,
    saveCategories,
  }
}
