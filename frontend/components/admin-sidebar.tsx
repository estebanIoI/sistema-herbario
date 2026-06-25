"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Leaf, Users, Settings, LogOut, Menu, MessageSquare, Monitor, Newspaper, FileText } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { apiService } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { ROLE_LABEL, type Role } from "@/lib/permissions"

export default function AdminSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const role = (user?.role ?? "user") as Role
  const [isOpen, setIsOpen] = useState(false)
  const [nuevasSugerencias, setNuevasSugerencias] = useState(0)

  // Obtener conteo real de sugerencias no leídas
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        if (!apiService.isAuthenticated()) {
          console.log("No hay token de autenticación disponible, omitiendo consulta de sugerencias")
          return
        }

        const result = await apiService.countUnreadSuggestions()

        if (result.success && result.data) {
          console.log(`Sugerencias no leídas: ${result.data.count}`)
          setNuevasSugerencias(result.data.count)
        } else if (!result.success) {
          console.warn("Error al obtener sugerencias no leídas:", result.error)
        }
      } catch (error) {
        console.error("Error al obtener conteo de sugerencias no leídas:", error)
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 60000)

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && e.newValue) {
        console.log("Token detectado, actualizando contador de sugerencias")
        fetchUnreadCount()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    const handleSuggestionProcessed = () => {
      console.log("Sugerencia procesada, actualizando contador")
      fetchUnreadCount()
    }
    window.addEventListener('suggestionProcessed', handleSuggestionProcessed)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('suggestionProcessed', handleSuggestionProcessed)
    }
  }, [])

  // Cada ruta declara qué roles la ven. El sidebar se filtra por el rol actual.
  const allRoutes: {
    href: string; label: string; icon: React.ReactNode
    roles: Role[]; badge?: number
  }[] = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, roles: ["admin"] },
    { href: "/admin/plantas", label: "Plantas", icon: <Leaf className="h-5 w-5" />, roles: ["admin", "investigador", "collector"] },
    {
      href: "/admin/sugerencias", label: "Sugerencias", icon: <MessageSquare className="h-5 w-5" />, roles: ["admin"],
      badge: nuevasSugerencias > 0 ? nuevasSugerencias : undefined,
    },
    { href: "/admin/pqrsdf", label: "PQRSDF", icon: <FileText className="h-5 w-5" />, roles: ["admin"] },
    { href: "/admin/publicaciones", label: "Publicaciones", icon: <Newspaper className="h-5 w-5" />, roles: ["admin"] },
    { href: "/admin/pagina", label: "Página", icon: <Monitor className="h-5 w-5" />, roles: ["admin"] },
    { href: "/admin/usuarios", label: "Usuarios", icon: <Users className="h-5 w-5" />, roles: ["admin"] },
    { href: "/admin/configuracion", label: "Configuración", icon: <Settings className="h-5 w-5" />, roles: ["admin"] },
  ]
  const routes = allRoutes.filter(r => r.roles.includes(role))

  const NavItems = () => (
    <>
      {/* Marca */}
      <div className="flex items-center gap-3 px-3 pt-2 pb-6">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-sm"
          style={{ background: "linear-gradient(135deg, var(--bot-green), var(--bot-green-2))" }}
        >
          <Leaf className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <span className="block text-sm font-bold" style={{ color: "var(--bot-ink)" }}>Herbario</span>
          <span className="block text-xs" style={{ color: "var(--bot-ink-soft)" }}>{ROLE_LABEL[role] ?? "Panel HEAA"}</span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 px-2">
        {routes.map((route) => {
          const active = pathname === route.href
          return (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setIsOpen(false)}
              data-active={active}
              className="glass-nav-item flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium"
            >
              <div className="flex items-center gap-3">
                {route.icon}
                {route.label}
              </div>
              {route.badge && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1 flex items-center justify-center text-[10px]">
                  {route.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Pie */}
      <div className="mt-auto px-2 pt-4">
        <Link
          href="/"
          className="glass-nav-item flex items-center gap-3 px-3 py-2.5 text-sm font-medium"
        >
          <LogOut className="h-5 w-5" />
          Salir al sitio
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* Sidebar escritorio — panel cristal flotante */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-20 md:w-[248px] md:p-3">
        <div className="glass-panel flex h-full w-full flex-col overflow-y-auto rounded-[24px] p-3">
          <NavItems />
        </div>
      </aside>

      {/* Barra superior móvil con disparador del menú */}
      <div className="glass-panel sticky top-0 z-20 flex items-center gap-2 px-4 py-3 md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[248px] glass-panel-strong p-3 border-0">
            <SheetTitle className="sr-only">Menú de administración</SheetTitle>
            <div className="flex h-full flex-col overflow-y-auto">
              <NavItems />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
            style={{ background: "linear-gradient(135deg, var(--bot-green), var(--bot-green-2))" }}
          >
            <Leaf className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm">Herbario · Admin</span>
        </div>
      </div>
    </>
  )
}
