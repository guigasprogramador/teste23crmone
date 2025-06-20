"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, FileText, Settings, LogOut, HelpCircle, DollarSign } from "lucide-react"
import { Logo } from "@/components/ui/logo"

export function MobileMenuToggle() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const routes = [
    { path: "/", label: "Home", icon: Home },
    { path: "/comercial", label: "Comercial", icon: DollarSign },
    { path: "/licitacoes", label: "Licitações", icon: FileText },
    { path: "/documentos", label: "Documentos", icon: FileText },
  ]

  const bottomRoutes = [
    { path: "/configuracoes", label: "Configurações", icon: Settings },
    { path: "/suporte", label: "Suporte", icon: HelpCircle },
    { path: "/sair", label: "Sair da conta", icon: LogOut },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 bg-sidebar text-white">
        <SheetHeader className="border-b border-white/10 p-4">
          <SheetTitle className="text-white flex items-center gap-2">
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full py-4">
          <div className="flex-1 overflow-auto">
            <nav className="grid gap-1 px-2">
              {routes.map((route) => (
                <Link key={route.path} href={route.path} onClick={() => setOpen(false)}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-white hover:bg-white/10",
                      pathname === route.path && "bg-white/10",
                    )}
                  >
                    <route.icon className="mr-3 h-5 w-5" />
                    {route.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          <div className="border-t border-white/10 pt-4 mt-auto">
            <nav className="grid gap-1 px-2">
              {bottomRoutes.map((route) => (
                <Link key={route.path} href={route.path} onClick={() => setOpen(false)}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-white hover:bg-white/10",
                      pathname === route.path && "bg-white/10",
                    )}
                  >
                    <route.icon className="mr-3 h-5 w-5" />
                    {route.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

