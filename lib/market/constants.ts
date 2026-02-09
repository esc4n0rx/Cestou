import { defaultCategoryNames } from "@/lib/market/categories"

export const categories = defaultCategoryNames

export type ListStatus = "draft" | "shopping" | "completed"

export function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  return 0
}
