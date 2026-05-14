"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Leaf, BarChart, Users, Settings, LogOut, Menu, MessageSquare, Monitor, Newspaper } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { apiService } from "@/lib/api"

export default function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [nuevasSugerencias, setNuevasSugerencias] = useState(0)
  
  // Obtener conteo real de sugerencias no leídas
  useEffect(() => {
    // Usar la instancia exportada de ApiService
    
    const fetchUnreadCount = async () => {
      try {
        // Verificar si hay un token disponible para hacer la petición
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
    
    // Ejecutar inmediatamente si está autenticado
    fetchUnreadCount()
    
    // Actualizar el contador cada minuto
    const interval = setInterval(fetchUnreadCount, 60000)
    
    // Escuchar eventos de autenticación
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && e.newValue) {
        console.log("Token detectado, actualizando contador de sugerencias")
        fetchUnreadCount()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Crear un evento personalizado para notificar cuando se procesa una sugerencia
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

  const routes = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: "/admin/plantas",
      label: "Plantas",
      icon: <Leaf className="h-5 w-5" />,
    },
    {
      href: "/admin/sugerencias",
      label: "Sugerencias",
      icon: <MessageSquare className="h-5 w-5" />,
      badge: nuevasSugerencias > 0 ? nuevasSugerencias : undefined,
    },
    {
      href: "/admin/publicaciones",
      label: "Publicaciones",
      icon: <Newspaper className="h-5 w-5" />,
    },
    {
      href: "/admin/pagina",
      label: "Página",
      icon: <Monitor className="h-5 w-5" />,
    },
    {
      href: "/admin/estadisticas",
      label: "Estadísticas",
      icon: <BarChart className="h-5 w-5" />,
    },
    {
      href: "/admin/usuarios",
      label: "Usuarios",
      icon: <Users className="h-5 w-5" />,
    },
    {
      href: "/admin/configuracion",
      label: "Configuración",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  const NavItems = () => (
    <>
      <div className="flex items-center gap-2 px-2 py-4">
        <Leaf className="h-6 w-6 text-green-600" />
        <span className="text-xl font-bold">Admin</span>
      </div>
      <div className="space-y-1 px-2 py-2">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === route.href
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <div className="flex items-center gap-3">
              {route.icon}
              {route.label}
            </div>
            {route.badge && (
              <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                {route.badge}
              </Badge>
            )}
          </Link>
        ))}
      </div>
      <div className="mt-auto px-2 py-4">
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon">
            <Link href="/">
              <LogOut className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Sidebar para escritorio */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r z-10 bg-background">
        <div className="flex h-full flex-col justify-between overflow-y-auto">
          <NavItems />
        </div>
      </aside>

      {/* Sidebar para móvil */}
      <div className="flex items-center border-b p-4 md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Menú de administración</SheetTitle>
            <div className="flex h-full flex-col justify-between overflow-y-auto">
              <NavItems />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-green-600" />
          <span className="font-bold">Herbario Digital - Admin</span>
        </div>
      </div>
    </>
  )
}
