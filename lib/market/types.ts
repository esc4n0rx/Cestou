import type { ListStatus } from "@/lib/market/constants"

export interface ShoppingListItem {
  id: string
  list_id: string
  name: string
  category: string
  unit: string
  planned_quantity: number
  purchased_quantity: number | null
  unit_price: number | null
  is_purchased: boolean
  is_urgent: boolean
  position: number
  created_at: string
}

export interface ShoppingList {
  id: string
  name: string
  status: ListStatus
  created_at: string
  started_at: string | null
  completed_at: string | null
  shopping_list_items: ShoppingListItem[]
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  quantity: number
  low_threshold: number
  updated_at: string
}

export interface DashboardStats {
  currentMonthTotal: number
  previousMonthTotal: number | null
  currentMonthCompletedLists: number
  lowStockItems: InventoryItem[]
  nextList: ShoppingList | null
}
