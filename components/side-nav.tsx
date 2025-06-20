"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Home,
  FileText,
  Settings,
  LogOut,
  HelpCircle,
  DollarSign,
  FileSpreadsheet,
  Briefcase,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  Bell,
} from "lucide-react"
import { Logo } from "@/components/ui/logo"
import Image from "next/image"
import { useState, useEffect } from "react"

export function SideNav() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Detectar tamanho da tela para colapsar automaticamente em telas menores
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true)
      } else {
        setCollapsed(false)
      }
    }

    // Inicializar
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const routes = [
    { path: "/", label: "Home", icon: Home },
    { path: "/comercial", label: "Comercial", icon: DollarSign },
    { path: "/licitacoes", label: "Licitações", icon: FileText },
    { path: "/documentos", label: "Documentos", icon: FileSpreadsheet },
    { path: "/propostas", label: "Propostas", icon: Briefcase },
    { path: "/projetos", label: "Projetos", icon: FolderKanban },
  ]

  const bottomRoutes = [
    { path: "/configuracoes", label: "Configurações", icon: Settings },
    { path: "/suporte", label: "Suporte", icon: HelpCircle },
    { path: "/sair", label: "Sair da conta", icon: LogOut },
  ]

  return (
    <div
      className={cn(
        "flex h-screen flex-col bg-sidebar text-white sticky top-0 z-40 transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center px-4 border-b border-white/10 justify-between">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo />
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto">
            <Image
              src="/logo-menu-recuado.png"
              alt="Logo Menu Recuado"
              width={48}
              height={48}
              className="w-8 h-8 object-contain"
              priority
            />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 ml-auto"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {routes.map((route) => (
            <Link key={route.path} href={route.path}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-white hover:bg-white/10 transition-colors relative",
                  pathname === route.path && "bg-white/10",
                  collapsed ? "px-2" : "",
                )}
              >
                <route.icon className={cn("h-5 w-5", collapsed ? "mx-auto" : "mr-3")} />
                {!collapsed && route.label}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10 py-4 mt-auto">
        <nav className="grid gap-1 px-2">
          {bottomRoutes.map((route) => (
            <Link key={route.path} href={route.path}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-white hover:bg-white/10",
                  pathname === route.path && "bg-white/10",
                  collapsed ? "px-2" : "",
                )}
              >
                <route.icon className={cn("h-5 w-5", collapsed ? "mx-auto" : "mr-3")} />
                {!collapsed && route.label}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
