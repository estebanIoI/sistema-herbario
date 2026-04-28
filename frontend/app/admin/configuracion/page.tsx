"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Settings } from "lucide-react"
import { apiService } from "@/lib/api"

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiService.getPublicSettings()
      .then((res) => {
        if (res.success && res.data) {
          setSettings(res.data as any)
        } else {
          setError(res.error ?? "No se pudo cargar la configuración.")
        }
      })
      .catch(() => setError("Error de conexión con el servidor."))
      .finally(() => setLoading(false))
  }, [])

  const labels: Record<string, string> = {
    siteName: "Nombre del sitio",
    siteDescription: "Descripción del sitio",
    institutionName: "Institución",
    contactEmail: "Email de contacto",
    institutionAddress: "Dirección",
    institutionPhone: "Teléfono",
    herbariumCode: "Código del herbario",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Parámetros generales del sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Información del herbario
          </CardTitle>
          <CardDescription>Configuración institucional pública</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(settings).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1 border-b pb-3 last:border-0">
                  <span className="text-xs font-medium text-muted-foreground">
                    {labels[key] ?? key}
                  </span>
                  <span className="text-sm">{value || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
