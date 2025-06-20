"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, FileText, Bell, Settings, LayoutDashboard, DollarSign } from "lucide-react"

export function MobileNav() {
  const pathname = usePathname()

  const routes = [
    { path: "/", label: "Home", icon: Home },
    { path: "/comercial", label: "Comercial", icon: DollarSign },
    { path: "/licitacoes", label: "Licitações", icon: LayoutDashboard },
    { path: "/documentos", label: "Documentos", icon: FileText },
    { path: "/notificacoes", label: "Notificações", icon: Bell },
    { path: "/configuracoes", label: "Config", icon: Settings },
  ]

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t flex items-center justify-around md:hidden">
      {routes.map((route) => (
        <Link key={route.path} href={route.path}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex flex-col h-14 w-14 items-center justify-center rounded-none",
              pathname === route.path ? "text-primary" : "text-muted-foreground",
            )}
          >
            <route.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{route.label}</span>
          </Button>
        </Link>
      ))}
    </div>
  )
}

