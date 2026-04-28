"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart, Users, Leaf, TrendingUp, Clock, Loader2 } from "lucide-react"
import VisitorsChart from "@/components/visitors-chart"
import StatsCard from "@/components/stats-card"
import { apiService } from "@/lib/api"

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [chartData, setChartData] = useState<Array<{ name: string; users: number; visits: number }>>([])
  const [topPlants, setTopPlants] = useState<Array<{ id: number; scientific_name: string; views: number }>>([])
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await apiService.getDashboardStats()
        if (result.success && result.data) {
          setStats(result.data)
        }
      } catch (e) {
        console.error("Error al cargar estadísticas:", e)
      } finally {
        setLoading(false)
      }
    }

    const fetchChart = async () => {
      try {
        const result = await apiService.getVisitorStats("30d")
        if (result.success && result.data) {
          setChartData(result.data.chartData || [])
        }
      } catch (e) {
        console.error("Error al cargar gráfico:", e)
      } finally {
        setChartLoading(false)
      }
    }

    const fetchTopPlants = async () => {
      try {
        const result = await apiService.getMostViewedPlants(5)
        if (result.success && result.data) {
          setTopPlants(Array.isArray(result.data) ? result.data : [])
        }
      } catch (e) {
        console.error("Error al cargar plantas más vistas:", e)
      }
    }

    fetchStats()
    fetchChart()
    fetchTopPlants()
  }, [])

  const overview = stats?.overview ?? {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido al panel de administración del herbario digital</p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Plantas en Catálogo"
          value={loading ? "—" : (overview.totalPlants ?? 0).toLocaleString()}
          description={loading ? "Cargando..." : `+${overview.plantsThisMonth ?? 0} nuevas este mes`}
          icon={<Leaf className="h-4 w-4" />}
          trend={!loading && (overview.plantsThisMonth ?? 0) > 0 ? "up" : "neutral"}
        />
        <StatsCard
          title="Usuarios Registrados"
          value={loading ? "—" : (overview.totalUsers ?? 0).toLocaleString()}
          description={loading ? "Cargando..." : `${overview.usersGrowth >= 0 ? "+" : ""}${overview.usersGrowth ?? 0}% desde el mes pasado`}
          icon={<Users className="h-4 w-4" />}
          trend={!loading ? (overview.usersGrowth > 0 ? "up" : overview.usersGrowth < 0 ? "down" : "neutral") : "neutral"}
        />
        <StatsCard
          title="Visitas al catálogo"
          value={loading ? "—" : (overview.totalViews ?? 0).toLocaleString()}
          description={loading ? "Cargando..." : `${overview.visitsGrowth >= 0 ? "+" : ""}${overview.visitsGrowth ?? 0}% vs mes anterior`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={!loading ? (overview.visitsGrowth > 0 ? "up" : overview.visitsGrowth < 0 ? "down" : "neutral") : "neutral"}
        />
        <StatsCard
          title="Tiempo Promedio"
          value={loading ? "—" : (overview.avgSessionTime ?? "Sin datos")}
          description="Minutos por sesión (últimos 30 días)"
          icon={<Clock className="h-4 w-4" />}
          trend="neutral"
        />
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="visitors">
        <TabsList>
          <TabsTrigger value="visitors" className="flex items-center">
            <LineChart className="mr-2 h-4 w-4" />
            Visitantes
          </TabsTrigger>
          <TabsTrigger value="pageviews" className="flex items-center">
            <BarChart className="mr-2 h-4 w-4" />
            Registros por mes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="visitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visitantes por día</CardTitle>
              <CardDescription>Número de visitantes únicos en los últimos 30 días</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <VisitorsChart chartData={chartData} isLoading={chartLoading} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pageviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plantas agregadas por mes</CardTitle>
              <CardDescription>Registro de nuevas especies en los últimos 12 meses</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <VisitorsChart
                  chartData={(stats?.trends?.monthlyStats ?? []).map((m: any) => ({
                    name: m.month_name?.substring(0, 3) ?? "",
                    users: m.count,
                    visits: m.count,
                  }))}
                  isLoading={false}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plantas más vistas / actividad reciente */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plantas más vistas</CardTitle>
            <CardDescription>Las especies con más visitas registradas</CardDescription>
          </CardHeader>
          <CardContent>
            {topPlants.length > 0 ? (
              <div className="space-y-4">
                {topPlants.map((plant, i) => (
                  <div key={plant.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-4 text-muted-foreground">{i + 1}</div>
                      <div className="text-sm italic">{plant.scientific_name}</div>
                    </div>
                    <div className="font-medium text-sm">{(plant.views ?? 0).toLocaleString()} vistas</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {loading ? "Cargando..." : "No hay datos de vistas disponibles."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>Últimas plantas registradas en el herbario</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (stats?.recentActivity ?? []).length > 0 ? (
              <div className="space-y-3">
                {(stats.recentActivity as any[]).slice(0, 5).map((item: any) => (
                  <div key={item.id} className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium italic">{item.scientific_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.family} · {item.created_by_name ?? "Sistema"} · {new Date(item.created_at).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay actividad reciente.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
