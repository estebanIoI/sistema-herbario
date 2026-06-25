"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Leaf, FlaskConical, Sprout, Trees, Search, Download, ArrowRight } from "lucide-react"
import { apiService } from "@/lib/api"

const fmt = (n?: number) => (n ?? 0).toLocaleString("es-CO")

export default function EstadisticasPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const r = await apiService.getPublicStats()
      if (r.success && r.data) setStats(r.data)
      setLoading(false)
    })()
  }, [])

  const kpis = [
    { label: "Especímenes",  value: stats?.totalPlants,   icon: <Leaf className="h-5 w-5" />,         accent: "#2E5E38" },
    { label: "Familias",     value: stats?.totalFamilies, icon: <FlaskConical className="h-5 w-5" />, accent: "#3b7ea1" },
    { label: "Géneros",      value: stats?.totalGenera,   icon: <Sprout className="h-5 w-5" />,        accent: "#7BA66C" },
    { label: "Especies",     value: stats?.totalSpecies,  icon: <Trees className="h-5 w-5" />,         accent: "#c98a2e" },
  ]

  return (
    <div className="space-y-6 pb-10 pt-6">
      <div>
        <h1 className="text-[32px] font-bold tracking-tight flex items-center gap-2" style={{ color: "var(--bot-ink)" }}>
          <BarChart3 className="h-7 w-7" style={{ color: "var(--bot-green)" }} />
          Estadísticas
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--bot-ink-soft)" }}>
          Resumen de la colección · búsqueda avanzada y exportación de datos
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(k => (
          <Card key={k.label} className="relative overflow-hidden">
            <span className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${k.accent}, transparent)` }} />
            <CardContent className="p-5">
              <div className="p-2.5 rounded-2xl w-fit" style={{ background: `${k.accent}1f`, color: k.accent }}>{k.icon}</div>
              <p className="text-[11px] font-medium uppercase tracking-wider mt-4" style={{ color: "var(--bot-ink-soft)" }}>{k.label}</p>
              {loading
                ? <div className="h-8 w-20 bg-muted animate-pulse rounded mt-1" />
                : <p className="text-3xl font-bold mt-0.5 tabular-nums" style={{ color: "var(--bot-ink)" }}>{fmt(k.value)}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" style={{ color: "var(--bot-green)" }} />
            Búsqueda avanzada y exportación
          </CardTitle>
          <CardDescription>
            Filtra el catálogo por familia, género, departamento, colector y más, y exporta los resultados a CSV.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin/plantas">
              <Search className="h-4 w-4 mr-1.5" /> Ir al catálogo y filtrar
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/plantas">
              <Download className="h-4 w-4 mr-1.5" /> Exportar datos
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
