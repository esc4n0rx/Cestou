export interface CategoryDefinition {
  name: string
  emoji: string
  position: number
  is_active: boolean
}

export const defaultCategories: CategoryDefinition[] = [
  { name: "Hortifruti", emoji: "🥬", position: 0, is_active: true },
  { name: "Padaria", emoji: "🥖", position: 1, is_active: true },
  { name: "Açougue", emoji: "🥩", position: 2, is_active: true },
  { name: "Peixaria", emoji: "🐟", position: 3, is_active: true },
  { name: "Laticínios", emoji: "🧀", position: 4, is_active: true },
  { name: "Frios", emoji: "🥓", position: 5, is_active: true },
  { name: "Ovos", emoji: "🥚", position: 6, is_active: true },
  { name: "Congelados", emoji: "🧊", position: 7, is_active: true },
  { name: "Mercearia", emoji: "🧺", position: 8, is_active: true },
  { name: "Enlatados e Conservas", emoji: "🥫", position: 9, is_active: true },
  { name: "Temperos e Condimentos", emoji: "🧂", position: 10, is_active: true },
  { name: "Bebidas", emoji: "🥤", position: 11, is_active: true },
  { name: "Snacks", emoji: "🍫", position: 12, is_active: true },
  { name: "Produtos Naturais / Saudáveis", emoji: "🌿", position: 13, is_active: true },
  { name: "Limpeza", emoji: "🧼", position: 14, is_active: true },
  { name: "Higiene Pessoal", emoji: "🧴", position: 15, is_active: true },
  { name: "Papelaria / Utilidades", emoji: "🧻", position: 16, is_active: true },
  { name: "Pet Shop", emoji: "🐾", position: 17, is_active: true },
]

export const defaultCategoryNames = defaultCategories.map(
  (category) => category.name,
)
