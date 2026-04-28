"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { apiService } from "@/lib/api"

export default function EstadisticasPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiService.getDashboardStats()
      .then((res) => {
        if (res.success && res.data) setStats(res.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const dist = stats?.distributions ?? {}
  const trends = stats?.trends ?? {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
        <p className="text-muted-foreground">Análisis detallado de la colección del herbario</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Top Familias */}
          <Card>
            <CardHeader>
              <CardTitle>Familias más representadas</CardTitle>
              <CardDescription>Top 5 familias por número de especímenes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(dist.topFamilies ?? []).map((f: any, i: number) => (
                  <div key={f.family ?? i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">{i + 1}</span>
                      <span className="text-sm font-medium">{f.family ?? "Sin familia"}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{f.count} especímenes</span>
                  </div>
                ))}
                {(dist.topFamilies ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin datos disponibles.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Departamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Departamentos con más registros</CardTitle>
              <CardDescription>Top 5 departamentos de recolección</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(dist.topDepartments ?? []).map((d: any, i: number) => (
                  <div key={d.department ?? i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">{i + 1}</span>
                      <span className="text-sm font-medium">{d.department ?? "Sin departamento"}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{d.count} registros</span>
                  </div>
                ))}
                {(dist.topDepartments ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin datos disponibles.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Colectores */}
          <Card>
            <CardHeader>
              <CardTitle>Colectores más activos</CardTitle>
              <CardDescription>Top 5 colectores por número de especímenes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(dist.topCollectors ?? []).map((c: any, i: number) => (
                  <div key={c.collector ?? i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">{i + 1}</span>
                      <span className="text-sm font-medium">{c.collector ?? "Desconocido"}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{c.count} especímenes</span>
                  </div>
                ))}
                {(dist.topCollectors ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin datos disponibles.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tendencia anual */}
          <Card>
            <CardHeader>
              <CardTitle>Crecimiento anual</CardTitle>
              <CardDescription>Especímenes registrados por año (últimos 5 años)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(trends.yearlyStats ?? []).map((y: any) => (
                  <div key={y.year} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{y.year}</span>
                    <span className="text-sm text-muted-foreground">{y.count} especímenes</span>
                  </div>
                ))}
                {(trends.yearlyStats ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin datos disponibles.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
