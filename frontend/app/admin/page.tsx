"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  Leaf, Users, MessageSquare, FileText, AlertCircle,
  Loader2, RefreshCw, ExternalLink, Download, X, ChevronLeft,
  ChevronRight, TrendingUp, TrendingDown, Minus, ArrowRight,
  BarChart3, Activity, MapPin, TreePine, FlaskConical
} from "lucide-react"
import { apiService } from "@/lib/api"
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine
} from "recharts"

// ── Traducciones ────────────────────────────────────────────────────────────
const T_SUGG_STATUS: Record<string, string> = {
  pending: "Pendiente", in_review: "En revisión",
  approved: "Aprobado", rejected: "Rechazado", implemented: "Implementado",
}
const T_PQRS_STATUS: Record<string, string> = {
  pendiente: "Pendiente", en_revision: "En revisión", respondido: "Respondido",
}
const T_PQRS_TIPO: Record<string, string> = {
  peticion: "Petición", queja: "Queja", reclamo: "Reclamo",
  sugerencia: "Sugerencia", denuncia: "Denuncia", felicitacion: "Felicitación",
}
const T_PLANT_STATUS: Record<string, string> = {
  active: "Activa", draft: "Borrador", archived: "Archivada", rejected: "Rechazada",
}

// ── Colores ────────────────────────────────────────────────────────────────
const C_GREEN  = ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"]
const C_BLUE   = ["#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"]
const C_SUGG: Record<string, string> = {
  pending: "#f59e0b", in_review: "#3b82f6", approved: "#16a34a",
  rejected: "#ef4444", implemented: "#8b5cf6",
}
const C_PQRS: Record<string, string> = {
  pendiente: "#f59e0b", en_revision: "#3b82f6", respondido: "#16a34a",
}
const C_TIPO: Record<string, string> = {
  peticion: "#3b82f6", queja: "#ef4444", reclamo: "#f97316",
  sugerencia: "#8b5cf6", denuncia: "#dc2626", felicitacion: "#16a34a",
}

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

// ── Tipos ──────────────────────────────────────────────────────────────────
interface ActiveFilter {
  type: "family" | "department" | "collector" | "status" | "month"
  value: string
  label: string
  urlParam?: string
  navUrl?: string // si se debe navegar directo en vez de abrir panel
}

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number | undefined) => (n ?? 0).toLocaleString("es-CO")

function exportCsv(rows: any[], filename: string) {
  if (!rows.length) return
  const cols = ["id", "scientific_name", "family", "state_province", "recorded_by", "status", "created_at"]
  const header = ["ID", "Nombre científico", "Familia", "Departamento", "Colector", "Estado", "Fecha"]
  const lines = [
    header.join(","),
    ...rows.map(r => cols.map(c => `"${(r[c] ?? "").toString().replace(/"/g, '""')}"`).join(","))
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Subcomponentes ─────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-[160px]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function Empty({ text = "Sin datos" }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[140px] gap-2 text-muted-foreground">
      <BarChart3 className="h-8 w-8 opacity-30" />
      <span className="text-sm">{text}</span>
    </div>
  )
}

function KpiCard({
  icon, label, value, sub, trend, color, href, loading
}: {
  icon: React.ReactNode; label: string; value: string | number
  sub?: string; trend?: "up" | "down" | "neutral"; color: string
  href?: string; loading?: boolean
}) {
  const bgMap: Record<string, string> = {
    green: "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/40",
    blue:  "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40",
    amber: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40",
    red:   "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/40",
  }
  const iconMap: Record<string, string> = {
    green: "text-green-600", blue: "text-blue-600", amber: "text-amber-500", red: "text-red-500",
  }
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus
  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"

  const inner = (
    <Card className={`${bgMap[color]} shadow-sm transition-all hover:shadow-md ${href ? "cursor-pointer hover:-translate-y-0.5" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className={`p-2 rounded-lg bg-white/60 dark:bg-black/20 ${iconMap[color]}`}>{icon}</div>
          {trend && <TrendIcon className={`h-4 w-4 mt-1 ${trendColor}`} />}
        </div>
        <div className="mt-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
          {loading
            ? <div className="h-8 w-24 bg-muted animate-pulse rounded mt-1" />
            : <p className="text-3xl font-bold mt-0.5 tabular-nums">{typeof value === "number" ? fmt(value) : value}</p>
          }
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        {href && (
          <div className="mt-2 flex items-center gap-1 text-xs font-medium opacity-60 hover:opacity-100">
            Ver detalle <ArrowRight className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

// ── Tooltip personalizado para gráficas ───────────────────────────────────
function CustomTooltip({ active, payload, label, suffix = "especímenes" }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill }}>
          {p.name ?? p.dataKey}: <span className="font-bold">{fmt(p.value)}</span> {suffix}
        </p>
      ))}
      <p className="text-xs text-muted-foreground mt-1 italic">Clic para ver detalle</p>
    </div>
  )
}

// ── Panel lateral de detalle ───────────────────────────────────────────────
function DetailPanel({
  open, filter, onClose
}: {
  open: boolean
  filter: ActiveFilter | null
  onClose: () => void
}) {
  const router = useRouter()
  const [plants, setPlants] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 8

  useEffect(() => {
    if (!open || !filter) return
    setPage(1)
    fetchPlants(1)
  }, [open, filter])

  useEffect(() => {
    if (!open || !filter) return
    fetchPlants(page)
  }, [page])

  const fetchPlants = async (p: number) => {
    if (!filter) return
    setLoading(true)
    const params: any = { page: p, limit: LIMIT }
    if (filter.type === "family")     params.family     = filter.value
    if (filter.type === "department") params.department = filter.value
    if (filter.type === "collector")  params.collector  = filter.value
    if (filter.type === "status")     params.status     = filter.value
    const r = await apiService.getPlants(params)
    if (r.success && r.data) {
      setPlants(r.data.plants ?? [])
      setTotal(r.data.pagination?.total ?? 0)
    }
    setLoading(false)
  }

  const navUrl = () => {
    const base = "/admin/plantas"
    if (!filter) return base
    const map: Record<string, string> = {
      family: "family", department: "department",
      collector: "collector", status: "status",
    }
    const param = map[filter.type]
    return param ? `${base}?${param}=${encodeURIComponent(filter.value)}` : base
  }

  const pages = Math.ceil(total / LIMIT)

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent side="right" className="w-full sm:w-[520px] flex flex-col p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b">
          <div className="flex items-start justify-between gap-2">
            <div>
              <SheetTitle className="text-base">Detalle de registros</SheetTitle>
              {filter && (
                <SheetDescription className="mt-0.5">
                  {filter.label} · {fmt(total)} espécimen{total !== 1 ? "es" : ""}
                </SheetDescription>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <Spinner />
          ) : plants.length === 0 ? (
            <Empty text="No se encontraron registros para este filtro" />
          ) : (
            <div className="space-y-2">
              {plants.map(p => (
                <div key={p.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    {p.main_image
                      ? <img src={p.main_image} alt="" className="w-full h-full object-cover" />
                      : <Leaf className="h-4 w-4 text-green-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium italic truncate">{p.scientific_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.family} · {p.state_province ?? "Sin depto."} · {p.recorded_by ?? "Sin colector"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        {T_PLANT_STATUS[p.status] ?? p.status ?? "Borrador"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString("es-CO", { day:"2-digit", month:"short", year:"numeric" }) : "—"}
                      </span>
                    </div>
                  </div>
                  <Link href={`/admin/plantas/${p.id}/editar`}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paginación */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-2 border-t text-sm">
            <span className="text-muted-foreground">Página {page} de {pages}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7"
                disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7"
                disabled={page === pages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="px-5 py-3 border-t flex gap-2">
          <Button className="flex-1" size="sm" asChild>
            <Link href={navUrl()}>
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Ver todos en catálogo
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportCsv(plants, `plantas-${filter?.value ?? "filtro"}.csv`)}
            disabled={plants.length === 0}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            CSV
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Dashboard principal ────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats]         = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [period, setPeriod]       = useState<"3m"|"6m"|"1y"|"todo">("todo")
  const [panel, setPanel]         = useState(false)
  const [filter, setFilter]       = useState<ActiveFilter | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    const r = await apiService.getDashboardStats()
    if (r.success && r.data) { setStats(r.data); setLastUpdate(new Date()) }
    if (!silent) setLoading(false); else setRefreshing(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openFilter = (f: ActiveFilter) => {
    if (f.navUrl) { router.push(f.navUrl); return }
    setFilter(f); setPanel(true)
  }
  const closePanel = () => { setPanel(false) }

  const ov   = stats?.overview      ?? {}
  const dist = stats?.distributions ?? {}
  const sugg = stats?.suggestionsStats ?? {}
  const pqrs = stats?.pqrsdfStats      ?? {}

  // ── Tendencia mensual filtrada por periodo ──────────────────────────────
  const allMonthly: any[] = [...(stats?.trends?.monthlyStats ?? [])].reverse()
  const monthSlice = period === "3m" ? 3 : period === "6m" ? 6 : period === "1y" ? 12 : allMonthly.length
  const monthlyTrend = allMonthly.slice(-monthSlice).map((m: any) => ({
    name: MESES[(m.month ?? 1) - 1],
    plantas: Number(m.count),
    _year: m.year, _month: m.month,
  }))
  const monthAvg = monthlyTrend.length
    ? Math.round(monthlyTrend.reduce((s, m) => s + m.plantas, 0) / monthlyTrend.length)
    : 0

  // ── Familias ───────────────────────────────────────────────────────────
  const topFamilies = (dist.topFamilies ?? []).map((f: any) => ({
    name: f.family ?? "Sin familia", value: Number(f.count),
  }))

  // ── Departamentos ───────────────────────────────────────────────────────
  const topDepts = (dist.topDepartments ?? []).map((d: any) => ({
    name: (d.department ?? "N/E").replace(/ (Department|Departamento)$/i, "").trim(),
    _full: d.department ?? "", value: Number(d.count),
  }))

  // ── Sugerencias ────────────────────────────────────────────────────────
  const suggPie = (sugg.byStatus ?? []).map((s: any) => ({
    name: T_SUGG_STATUS[s.status] ?? s.status,
    _raw: s.status, value: Number(s.count),
    color: C_SUGG[s.status] ?? "#6b7280",
  }))

  // ── PQRSDF ─────────────────────────────────────────────────────────────
  const pqrsBar = (pqrs.byTipo ?? []).map((p: any) => ({
    name: T_PQRS_TIPO[p.tipo] ?? p.tipo,
    _raw: p.tipo, value: Number(p.count),
    color: C_TIPO[p.tipo] ?? "#6b7280",
  }))

  // ── Colectores ─────────────────────────────────────────────────────────
  const topCollectors = (dist.topCollectors ?? []).map((c: any) => ({
    name: c.collector ?? "Sin nombre", value: Number(c.count),
  }))

  // ── Conservación ───────────────────────────────────────────────────────
  const conservationBar = (dist.conservationStats ?? []).map((c: any) => ({
    name: (c.status ?? "No evaluado").length > 16 ? (c.status ?? "No evaluado").slice(0, 15) + "…" : (c.status ?? "No evaluado"),
    _full: c.status ?? "No evaluado", value: Number(c.count),
  }))

  // ── Actividad reciente (cross-filter visual) ───────────────────────────
  const recentRaw: any[] = stats?.recentActivity ?? []
  const recentFiltered = filter
    ? recentRaw.filter(r => {
        if (filter.type === "family")     return r.family === filter.value
        if (filter.type === "department") return (r.state_province ?? "").toLowerCase().includes(filter.value.toLowerCase())
        if (filter.type === "collector")  return r.recorded_by === filter.value
        return true
      })
    : recentRaw

  // ── Tendencias KPI ─────────────────────────────────────────────────────
  const plantTrend: "up"|"down"|"neutral" = (ov.plantsThisMonth ?? 0) > 0 ? "up" : "neutral"
  const userTrend: "up"|"down"|"neutral" = (ov.usersGrowth ?? 0) > 0 ? "up" : (ov.usersGrowth ?? 0) < 0 ? "down" : "neutral"

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Panel de análisis — Herbario Digital HEAA
            {lastUpdate && (
              <span className="ml-2 opacity-60">
                · Actualizado {lastUpdate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro temporal */}
          <div className="flex rounded-lg border overflow-hidden text-xs">
            {(["3m","6m","1y","todo"] as const).map(p => (
              <button key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 transition-colors ${period === p ? "bg-foreground text-background" : "hover:bg-muted"}`}>
                {p === "3m" ? "3 meses" : p === "6m" ? "6 meses" : p === "1y" ? "1 año" : "Todo"}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Chip de filtro activo */}
      {filter && (
        <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-sm w-fit">
          <span className="text-blue-700 dark:text-blue-300 font-medium">{filter.label}</span>
          <span className="text-muted-foreground text-xs">· La actividad reciente está filtrada</span>
          <button onClick={() => setFilter(null)} className="ml-1 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── KPIs ──────────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<Leaf className="h-5 w-5"/>} label="Especímenes catalogados"
          value={ov.totalPlants ?? 0} sub={`+${ov.plantsThisMonth ?? 0} este mes`}
          trend={plantTrend} color="green" href="/admin/plantas" loading={loading} />
        <KpiCard icon={<Users className="h-5 w-5"/>} label="Usuarios activos"
          value={ov.totalUsers ?? 0}
          sub={`${(ov.usersGrowth ?? 0) >= 0 ? "+" : ""}${ov.usersGrowth ?? 0}% vs mes anterior`}
          trend={userTrend} color="blue" href="/admin/usuarios" loading={loading} />
        <KpiCard icon={<MessageSquare className="h-5 w-5"/>} label="Sugerencias pendientes"
          value={sugg.pending ?? 0}
          sub={`${sugg.total ?? 0} total · ${sugg.thisMonth ?? 0} este mes`}
          trend={(sugg.pending ?? 0) > 0 ? "down" : "neutral"}
          color="amber" href="/admin/sugerencias?status=pending" loading={loading} />
        <KpiCard icon={<FileText className="h-5 w-5"/>} label="PQRSDF pendientes"
          value={pqrs.pending ?? 0}
          sub={`${pqrs.total ?? 0} total · ${pqrs.thisMonth ?? 0} este mes`}
          trend={(pqrs.pending ?? 0) > 0 ? "down" : "neutral"}
          color="red" href="/admin/pqrsdf?status=pendiente" loading={loading} />
      </div>

      {/* ── Tendencia + Top familias ──────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Tendencia mensual — 3/5 del ancho */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-1">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Tendencia de registros
                </CardTitle>
                <CardDescription className="text-xs">
                  Plantas catalogadas por mes · Promedio: {fmt(monthAvg)} / mes
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">{period === "todo" ? "Todo" : period === "1y" ? "Último año" : period === "6m" ? "6 meses" : "3 meses"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-56 pt-2">
            {loading ? <Spinner /> : monthlyTrend.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                  onClick={d => {
                    if (!d?.activePayload?.length) return
                    const pt = d.activePayload[0].payload
                    openFilter({
                      type: "month", value: `${pt._year}-${pt._month}`,
                      label: `Mes: ${pt.name} ${pt._year}`,
                    })
                  }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  {monthAvg > 0 && (
                    <ReferenceLine y={monthAvg} stroke="#94a3b8" strokeDasharray="4 4"
                      label={{ value: `Prom: ${monthAvg}`, fontSize: 10, fill: "#94a3b8", position: "right" }} />
                  )}
                  <Line type="monotone" dataKey="plantas" name="Plantas"
                    stroke="#16a34a" strokeWidth={2.5}
                    dot={{ r: 4, fill: "#16a34a", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, cursor: "pointer" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top familias — 2/5 del ancho */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-blue-600" />
              Top familias
            </CardTitle>
            <CardDescription className="text-xs">Clic para explorar especímenes de esa familia</CardDescription>
          </CardHeader>
          <CardContent className="h-56 pt-2">
            {loading ? <Spinner /> : topFamilies.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topFamilies} layout="vertical" margin={{ top: 0, right: 4, left: 4, bottom: 0 }}
                  onClick={d => {
                    if (!d?.activePayload?.length) return
                    const fam = d.activePayload[0].payload.name
                    openFilter({ type: "family", value: fam, label: `Familia: ${fam}` })
                  }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Especímenes" radius={[0, 4, 4, 0]} cursor="pointer">
                    {topFamilies.map((_: any, i: number) => (
                      <Cell key={i} fill={filter?.type === "family" && filter.value !== topFamilies[i]?.name
                        ? `${C_GREEN[i % C_GREEN.length]}55`
                        : C_GREEN[i % C_GREEN.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Sugerencias + PQRSDF ─────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-1">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-amber-500" />
                  Sugerencias por estado
                </CardTitle>
                <CardDescription className="text-xs">Clic en un segmento para ir a gestionarlas</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link href="/admin/sugerencias">Ver todas <ArrowRight className="h-3 w-3 ml-1"/></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-56">
            {loading ? <Spinner /> : suggPie.length === 0 ? <Empty text="Sin sugerencias aún" /> : (
              <div className="flex items-center h-full gap-2">
                <ResponsiveContainer width="55%" height="100%">
                  <PieChart onClick={d => {
                    const entry = d?.activePayload?.[0]?.payload
                    if (!entry) return
                    openFilter({
                      type: "status", value: entry._raw,
                      label: `Sugerencias: ${entry.name}`,
                      navUrl: `/admin/sugerencias?status=${entry._raw}`,
                    })
                  }}>
                    <Pie data={suggPie} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80} paddingAngle={3} cursor="pointer">
                      {suggPie.map((e: any, i: number) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any, name: any) => [`${fmt(v)} sugerencias`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5 pr-2">
                  {suggPie.map((s: any, i: number) => (
                    <button key={i}
                      onClick={() => openFilter({ type: "status", value: s._raw, label: `Sugerencias: ${s.name}`, navUrl: `/admin/sugerencias?status=${s._raw}` })}
                      className="flex items-center justify-between w-full text-xs hover:bg-muted/60 rounded px-1.5 py-0.5 transition-colors">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                        {s.name}
                      </span>
                      <span className="font-semibold tabular-nums">{fmt(s.value)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-red-500" />
                  PQRSDF por tipo
                </CardTitle>
                <CardDescription className="text-xs">Clic para gestionar ese tipo de solicitud</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link href="/admin/pqrsdf">Ver todos <ArrowRight className="h-3 w-3 ml-1"/></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-56">
            {loading ? <Spinner /> : pqrsBar.length === 0 ? <Empty text="Sin PQRSDF aún" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pqrsBar} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                  onClick={d => {
                    const entry = d?.activePayload?.[0]?.payload
                    if (!entry) return
                    openFilter({
                      type: "status", value: entry._raw,
                      label: `PQRSDF: ${entry.name}`,
                      navUrl: `/admin/pqrsdf?tipo=${entry._raw}`,
                    })
                  }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v: any) => [`${fmt(v)} solicitudes`]} />
                  <Bar dataKey="value" name="Solicitudes" radius={[4, 4, 0, 0]} cursor="pointer">
                    {pqrsBar.map((e: any, i: number) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Departamentos + Colectores ────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Departamentos — 3/5 */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              Especímenes por departamento
            </CardTitle>
            <CardDescription className="text-xs">Clic para explorar registros de ese departamento</CardDescription>
          </CardHeader>
          <CardContent className="h-52 pt-2">
            {loading ? <Spinner /> : topDepts.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDepts} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  onClick={d => {
                    const entry = d?.activePayload?.[0]?.payload
                    if (!entry) return
                    openFilter({ type: "department", value: entry._full || entry.name, label: `Departamento: ${entry.name}` })
                  }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Especímenes" radius={[4, 4, 0, 0]} cursor="pointer">
                    {topDepts.map((_: any, i: number) => (
                      <Cell key={i} fill={filter?.type === "department" && filter.value !== (topDepts[i]?._full || topDepts[i]?.name)
                        ? `${C_BLUE[i % C_BLUE.length]}55`
                        : C_BLUE[i % C_BLUE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top colectores — 2/5 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Top colectores
            </CardTitle>
            <CardDescription className="text-xs">Clic para ver sus registros</CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            {loading ? <Spinner /> : topCollectors.length === 0 ? <Empty /> : (
              <div className="space-y-2.5">
                {topCollectors.map((c: any, i: number) => (
                  <button key={i}
                    onClick={() => openFilter({ type: "collector", value: c.name, label: `Colector: ${c.name}` })}
                    className={`flex items-center gap-2.5 w-full text-left rounded-lg p-1.5 transition-colors hover:bg-muted/60 ${
                      filter?.type === "collector" && filter.value === c.name ? "bg-purple-50 dark:bg-purple-950/20" : ""
                    }`}>
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium truncate">{c.name}</span>
                        <span className="text-xs font-bold ml-2 tabular-nums">{fmt(c.value)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${Math.round((c.value / (topCollectors[0]?.value || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Conservación ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-1">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <TreePine className="h-4 w-4 text-green-700" />
                Estado de conservación (IUCN)
              </CardTitle>
              <CardDescription className="text-xs">¿Cuántos especímenes de la colección están bajo amenaza?</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <Link href="/admin/plantas?sort=conservation">Ver catálogo <ArrowRight className="h-3 w-3 ml-1"/></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="h-44 pt-1">
          {loading ? <Spinner /> : conservationBar.length === 0 ? <Empty text="Sin datos de conservación" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conservationBar} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}
                onClick={d => {
                  const entry = d?.activePayload?.[0]?.payload
                  if (!entry) return
                  openFilter({ type: "status", value: entry._full, label: `Conservación: ${entry._full}`, navUrl: `/admin/plantas?conservation=${entry._full}` })
                }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={96} />
                <Tooltip formatter={(v: any) => [`${fmt(v)} especímenes`]} />
                <Bar dataKey="value" name="Especímenes" radius={[0, 4, 4, 0]} cursor="pointer">
                  {conservationBar.map((_: any, i: number) => (
                    <Cell key={i} fill={["#ef4444","#f97316","#f59e0b","#22c55e","#6b7280","#3b82f6"][i % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Actividad reciente (cross-filtered) ──────────────────────── */}
      <Card>
        <CardHeader className="pb-1">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                Actividad reciente
                {filter && recentFiltered.length !== recentRaw.length && (
                  <Badge variant="secondary" className="text-xs ml-1">
                    {recentFiltered.length} de {recentRaw.length} resultados
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {filter ? `Filtrado por: ${filter.label}` : "Últimas plantas registradas en la colección"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <Link href="/admin/plantas">Ver todas <ArrowRight className="h-3 w-3 ml-1"/></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <Spinner /> : recentFiltered.length === 0 ? (
            <Empty text={filter ? "No hay registros recientes para este filtro" : "Sin actividad reciente"} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recentFiltered.map((item: any) => (
                <Link key={item.id} href={`/admin/plantas/${item.id}/editar`}
                  className="flex gap-2.5 p-3 rounded-lg border bg-card hover:bg-accent/40 hover:shadow-sm transition-all">
                  <div className="flex-shrink-0 w-11 h-11 rounded-md overflow-hidden bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    {item.main_image
                      ? <img src={item.main_image} alt="" className="w-full h-full object-cover" />
                      : <Leaf className="h-4 w-4 text-green-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium italic truncate leading-tight">{item.scientific_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{item.family}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
                        {T_PLANT_STATUS[item.status] ?? item.status ?? "Borrador"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString("es-CO", { day:"2-digit", month:"short" })
                          : "—"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Panel lateral de detalle ──────────────────────────────────── */}
      <DetailPanel open={panel} filter={filter} onClose={closePanel} />
    </div>
  )
}
