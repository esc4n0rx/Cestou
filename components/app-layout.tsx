"use client"

import React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { BottomNav } from "@/components/bottom-nav"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <AppSidebar />
      <main className="lg:pl-64 pb-20 lg:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
