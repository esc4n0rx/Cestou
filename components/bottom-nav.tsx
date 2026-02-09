"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ShoppingCart, Package, UserCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/lista", label: "Lista", icon: ShoppingCart },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/perfil", label: "Perfil", icon: UserCircle },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/80 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                  isActive && "bg-primary/10"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all",
                    isActive && "scale-110"
                  )}
                />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
