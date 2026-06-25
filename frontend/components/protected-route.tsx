"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { canAccessRoute, roleHome, PANEL_ROLES, type Role } from "@/lib/permissions"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  // Si se pasa, se exige que el rol del usuario esté en la lista. Además, si
  // useRouteGuard es true (por defecto), se aplica el guard por ruta definido
  // en lib/permissions para cada sección del panel.
  allowedRoles?: Role[]
  useRouteGuard?: boolean
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  allowedRoles,
  useRouteGuard = true,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    if (loading) return

    // 1) No autenticado → login
    if (!isAuthenticated) {
      console.log("Usuario no autenticado. Redirigiendo a /login")
      router.replace("/login")
      return
    }

    const role = (user?.role ?? "user") as Role

    // 2) Compatibilidad: requireAdmin
    if (requireAdmin && role !== "admin") {
      router.replace(roleHome(role))
      return
    }

    // 3) Acceso al panel: el rol debe estar permitido
    if (allowedRoles && !allowedRoles.includes(role)) {
      router.replace(roleHome(role))
      return
    }

    // 4) Guard por ruta (sección concreta del panel)
    if (useRouteGuard && pathname?.startsWith("/admin")) {
      if (!PANEL_ROLES.includes(role) || !canAccessRoute(role, pathname)) {
        router.replace(roleHome(role))
        return
      }
    }

    setIsCheckingAuth(false)
  }, [isAuthenticated, loading, router, requireAdmin, allowedRoles, useRouteGuard, pathname, user])

  if (loading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return <>{children}</>
}
