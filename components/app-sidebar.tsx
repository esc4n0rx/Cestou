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

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex h-svh w-64 flex-col border-r border-sidebar-border bg-sidebar fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShoppingCart className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">
          MercadoApp
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-primary font-semibold"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70"
                )}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground">MercadoApp v1.0</p>
      </div>
    </aside>
  )
}
