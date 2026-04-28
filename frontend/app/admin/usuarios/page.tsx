"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users } from "lucide-react"
import { apiService } from "@/lib/api"

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = apiService.getToken()
    if (!token) {
      setError("Se requiere autenticación de administrador.")
      setLoading(false)
      return
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/service`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service: "users.getAll", token, data: { limit: 50 } }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setUsers(Array.isArray(res.data) ? res.data : res.data.users ?? [])
        } else {
          setError(res.error ?? "Error al cargar usuarios.")
        }
      })
      .catch(() => setError("Error de conexión con el servidor."))
      .finally(() => setLoading(false))
  }, [])

  const roleLabel = (role: string) => {
    const map: Record<string, string> = { admin: "Admin", user: "Usuario", collector: "Colector" }
    return map[role] ?? role
  }

  const statusVariant = (status: string): "default" | "secondary" | "destructive" => {
    if (status === "active") return "default"
    if (status === "inactive") return "secondary"
    return "destructive"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground">Gestión de cuentas de usuario registradas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de usuarios
          </CardTitle>
          <CardDescription>Todos los usuarios registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay usuarios registrados.</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground pb-2 border-b">
                <span>Nombre</span>
                <span>Email</span>
                <span>Rol</span>
                <span>Estado</span>
              </div>
              {users.map((u: any) => (
                <div key={u.id} className="grid grid-cols-4 text-sm py-2 border-b last:border-0 items-center">
                  <span className="font-medium">{u.name}</span>
                  <span className="text-muted-foreground truncate">{u.email}</span>
                  <span>{roleLabel(u.role)}</span>
                  <Badge variant={statusVariant(u.status)} className="w-fit text-xs">
                    {u.status === "active" ? "Activo" : u.status === "inactive" ? "Inactivo" : u.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
