"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  
  useEffect(() => {
    // Solo verificar después de que el contexto de autenticación haya terminado de cargar
    if (!loading) {
      // Si no está autenticado, redirigir al login
      if (!isAuthenticated) {
        console.log("Usuario no autenticado. Redirigiendo a /login")
        router.replace("/login")
        return
      }
      
      // Si se requiere rol admin, verificar que el usuario tenga ese rol
      if (requireAdmin && user?.role !== 'admin') {
        console.log("Usuario no es admin. Redirigiendo a /")
        router.replace("/")
        return
      }
      
      setIsCheckingAuth(false)
    }
  }, [isAuthenticated, loading, router, requireAdmin, user])
  
  // Mientras se verifica la autenticación o se está cargando, mostrar pantalla de carga
  if (loading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }
  
  // Si ha pasado todas las verificaciones, mostrar el contenido protegido
  return <>{children}</>
}
