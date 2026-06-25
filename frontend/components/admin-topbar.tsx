"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Bell, Search, LogOut, User as UserIcon, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { apiService } from "@/lib/api"

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador", investigador: "Investigador", collector: "Colector", user: "Usuario",
}

export default function AdminTopbar() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [query, setQuery] = useState("")
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        if (!apiService.isAuthenticated()) return
        const r = await apiService.countUnreadSuggestions()
        if (r.success && r.data) setUnread(r.data.count)
      } catch { /* silencioso */ }
    }
    fetchUnread()
    const t = setInterval(fetchUnread, 60000)
    return () => clearInterval(t)
  }, [])

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/admin/plantas?search=${encodeURIComponent(q)}`)
  }

  const initials = (user?.name ?? "Admin")
    .split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()

  return (
    <header className="sticky top-0 z-10 hidden px-4 pt-4 md:block md:px-7">
      <div className="glass-panel flex h-16 items-center gap-3 rounded-[24px] px-3 md:px-5">
        {/* Búsqueda global */}
        <form onSubmit={onSearch} className="relative flex-1 max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--bot-ink-soft)" }}
          />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar especímenes, familias, colectores…"
            className="h-10 w-full rounded-2xl border border-transparent pl-9 pr-4 text-sm outline-none transition-colors focus:border-[color:var(--bot-green-2)]"
            style={{ color: "var(--bot-ink)" }}
          />
        </form>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Notificaciones */}
          <Link href="/admin/sugerencias" className="relative">
            <Button variant="ghost" size="icon" className="rounded-2xl">
              <Bell className="h-5 w-5" />
            </Button>
            {unread > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 flex items-center justify-center text-[9px]"
              >
                {unread > 9 ? "9+" : unread}
              </Badge>
            )}
          </Link>

          {/* Tema */}
          <ThemeToggle />

          {/* Perfil */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 flex items-center gap-2 rounded-2xl py-1 pl-1 pr-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                <Avatar className="h-9 w-9">
                  <AvatarFallback
                    className="text-white text-xs font-semibold"
                    style={{ background: "linear-gradient(135deg, var(--bot-green), var(--bot-green-2))" }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left leading-tight md:block">
                  <span className="block max-w-[140px] truncate text-xs font-semibold" style={{ color: "var(--bot-ink)" }}>
                    {user?.name ?? "Administrador"}
                  </span>
                  <span className="block text-[11px]" style={{ color: "var(--bot-ink-soft)" }}>
                    {ROLE_LABEL[user?.role ?? "admin"] ?? "Administrador"}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl">
              <DropdownMenuLabel>
                <div className="leading-tight">
                  <p className="text-sm font-medium">{user?.name ?? "Administrador"}</p>
                  <p className="text-xs font-normal text-muted-foreground truncate">{user?.email ?? ""}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/usuarios"><UserIcon className="mr-2 h-4 w-4" /> Usuarios</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/configuracion"><Settings className="mr-2 h-4 w-4" /> Configuración</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => { await logout(); router.push("/") }}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
