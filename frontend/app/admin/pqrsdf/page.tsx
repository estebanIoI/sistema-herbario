"use client"

import { useState, useEffect, useCallback } from "react"
import { apiService } from "@/lib/api"
import { DataTable, ColDef, FilterDef } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText, Clock, CheckCircle2, AlertCircle, MessageSquare,
  User, Mail, Phone, MapPin, Send, History, Loader2, Eye
} from "lucide-react"

// ── Config ────────────────────────────────────────────────────────────────────

type Tipo   = 'peticion' | 'queja' | 'reclamo' | 'sugerencia' | 'denuncia' | 'felicitacion'
type Status = 'pendiente' | 'en_revision' | 'respondido'

const TIPO_CFG: Record<Tipo, { label: string; color: string }> = {
  peticion:     { label: 'Petición',     color: 'bg-blue-100 text-blue-800 border-blue-200' },
  queja:        { label: 'Queja',        color: 'bg-orange-100 text-orange-800 border-orange-200' },
  reclamo:      { label: 'Reclamo',      color: 'bg-red-100 text-red-800 border-red-200' },
  sugerencia:   { label: 'Sugerencia',   color: 'bg-green-100 text-green-800 border-green-200' },
  denuncia:     { label: 'Denuncia',     color: 'bg-purple-100 text-purple-800 border-purple-200' },
  felicitacion: { label: 'Felicitación', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
}

const STATUS_CFG: Record<Status, { label: string; color: string }> = {
  pendiente:   { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  en_revision: { label: 'En proceso', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  respondido:  { label: 'Respondido', color: 'bg-green-100 text-green-800 border-green-200' },
}

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

function TipoBadge({ tipo }: { tipo: string }) {
  const cfg = TIPO_CFG[tipo as Tipo]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cfg?.color ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {cfg?.label ?? tipo}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status as Status]
  const icons: Record<Status, React.ReactNode> = {
    pendiente:   <Clock className="h-3 w-3" />,
    en_revision: <AlertCircle className="h-3 w-3" />,
    respondido:  <CheckCircle2 className="h-3 w-3" />,
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${cfg?.color ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {icons[status as Status]}
      {cfg?.label ?? status}
    </span>
  )
}

// ── Columnas ──────────────────────────────────────────────────────────────────

const COLUMNS: ColDef<any>[] = [
  {
    id: "radicado", header: "Radicado", sortable: true,
    cell: row => <span className="font-mono text-xs font-medium text-primary">{row.radicado || `#${row.id}`}</span>,
  },
  {
    id: "tipo", header: "Tipo", sortable: true,
    cell: row => <TipoBadge tipo={row.tipo} />,
  },
  {
    id: "nombre", header: "Solicitante", hideBelow: "md",
    cell: row => row.anonimo
      ? <span className="text-muted-foreground italic text-xs">Anónimo</span>
      : <div>
          <p className="text-sm font-medium">{row.nombre || '—'}</p>
          <p className="text-xs text-muted-foreground">{row.email ?? ''}</p>
        </div>,
  },
  {
    id: "created_at", header: "Fecha", sortable: true, hideBelow: "lg",
    cell: row => <span className="text-xs text-muted-foreground">{fmtDate(row.created_at)}</span>,
  },
  {
    id: "status", header: "Estado", sortable: true,
    cell: row => <StatusBadge status={row.status} />,
  },
  {
    id: "responded_by_name", header: "Respondido por", hideBelow: "xl",
    cell: row => row.responded_by_name
      ? <div>
          <p className="text-xs font-medium">{row.responded_by_name}</p>
          <p className="text-xs text-muted-foreground">{row.responded_at ? fmtDate(row.responded_at) : ''}</p>
        </div>
      : <span className="text-xs text-muted-foreground">—</span>,
  },
  {
    id: "_actions", header: "", mobileHide: true,
    cell: () => (
      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-60 group-hover:opacity-100">
        <Eye className="h-4 w-4" />
      </Button>
    ),
  },
]

const FILTERS: FilterDef[] = [
  {
    id: "tipo", label: "Tipo", type: "select",
    options: Object.entries(TIPO_CFG).map(([k, v]) => ({ value: k, label: v.label })),
  },
  {
    id: "status", label: "Estado", type: "select",
    options: [
      { value: "pendiente",   label: "Pendiente" },
      { value: "en_revision", label: "En proceso" },
      { value: "respondido",  label: "Respondido" },
    ],
  },
]

// ── Página ────────────────────────────────────────────────────────────────────

export default function PqrsdfAdminPage() {
  const [items, setItems]           = useState<any[]>([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [page, setPage]             = useState(1)
  const [limit, setLimit]           = useState(15)
  const [search, setSearch]         = useState("")
  const [sort, setSort]             = useState<{ id: string; dir: "asc" | "desc" } | null>(null)
  const [activeFilters, setAF]      = useState<Record<string, string>>({})
  const [stats, setStats]           = useState({ total: 0, pendiente: 0, en_revision: 0, respondido: 0 })
  const [selected, setSelected]     = useState<any | null>(null)
  const [history, setHistory]       = useState<any[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [respuesta, setRespuesta]   = useState("")
  const [sendingResp, setSendingResp]     = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params: any = { page, limit }
      if (activeFilters.tipo   && activeFilters.tipo   !== "all") params.tipo   = activeFilters.tipo
      if (activeFilters.status && activeFilters.status !== "all") params.status = activeFilters.status
      if (search.trim()) params.search = search
      if (sort) { params.sortBy = sort.id; params.sortDir = sort.dir }

      const res = await apiService.getPqrsdf(params)
      if (!res.success) { setError(res.error || "Error al cargar"); return }

      const d = res.data!
      const list: any[] = d.pqrsdf ?? []
      setItems(list)
      setTotal(d.total)

      const s = { total: d.total, pendiente: 0, en_revision: 0, respondido: 0 }
      for (const r of list) {
        if      (r.status === 'pendiente')   s.pendiente++
        else if (r.status === 'en_revision') s.en_revision++
        else if (r.status === 'respondido')  s.respondido++
      }
      setStats(s)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, limit, activeFilters, search, sort])

  useEffect(() => { fetchData() }, [fetchData])

  const setFilter = (id: string, value: string) => { setAF(prev => ({ ...prev, [id]: value })); setPage(1) }

  const openDetail = async (item: any) => {
    setSelected(item); setRespuesta(item.respuesta || ""); setHistory([]); setLoadingDetail(true)
    try {
      const res = await apiService.getPqrsdfById(item.id)
      if (res.success && res.data) {
        setSelected(res.data.pqrsdf)
        setHistory(res.data.history ?? [])
        setRespuesta(res.data.pqrsdf.respuesta || "")
      }
    } catch { /* usar datos previos */ } finally { setLoadingDetail(false) }
  }

  const handleStatusChange = async (newStatus: Status) => {
    if (!selected) return
    setStatusChanging(true)
    try {
      const res = await apiService.updatePqrsdfStatus(selected.id, newStatus)
      if (res.success) {
        setSelected((p: any) => ({ ...p, status: newStatus }))
        setItems(prev => prev.map(i => i.id === selected.id ? { ...i, status: newStatus } : i))
      }
    } finally { setStatusChanging(false) }
  }

  const handleResponder = async () => {
    if (!selected || respuesta.trim().length < 5) return
    setSendingResp(true)
    try {
      const res = await apiService.respondToPqrsdf(selected.id, respuesta)
      if (res.success) {
        const det = await apiService.getPqrsdfById(selected.id)
        if (det.success && det.data) {
          setSelected(det.data.pqrsdf)
          setHistory(det.data.history ?? [])
          setRespuesta(det.data.pqrsdf.respuesta || "")
        }
        await fetchData()
      }
    } finally { setSendingResp(false) }
  }

  return (
    <div className="space-y-5 p-1">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />PQRSDF
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Peticiones, Quejas, Reclamos, Sugerencias, Denuncias y Felicitaciones
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { label: 'Total',       value: stats.total,       color: 'text-foreground' },
          { label: 'Pendientes',  value: stats.pendiente,   color: 'text-yellow-600' },
          { label: 'En proceso',  value: stats.en_revision, color: 'text-blue-600' },
          { label: 'Respondidos', value: stats.respondido,  color: 'text-green-600' },
        ] as const).map(s => (
          <div key={s.label} className="rounded-lg border px-4 py-3">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <DataTable<any>
        data={items} columns={COLUMNS} getRowId={r => r.id}
        loading={loading} error={error ?? undefined}
        pagination={{ page, limit, total, onPageChange: setPage, onLimitChange: p => { setLimit(p); setPage(1) } }}
        search={search} onSearchChange={v => { setSearch(v); setPage(1) }}
        searchPlaceholder="Buscar por radicado, nombre, email o mensaje…"
        sort={sort} onSortChange={setSort}
        filters={FILTERS} activeFilters={activeFilters} onFilterChange={setFilter}
        onRowClick={openDetail}
        emptyIcon={<FileText className="h-8 w-8 opacity-40" />}
        emptyTitle="Sin registros" emptyDescription="No hay PQRSDF registradas aún."
      />

      {/* Modal detalle */}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-mono text-sm">{selected.radicado || `#${selected.id}`}</span>
                  <TipoBadge tipo={selected.tipo} />
                  <StatusBadge status={selected.status} />
                </DialogTitle>
              </DialogHeader>

              {loadingDetail ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-medium">
                        <User className="h-4 w-4" /> Solicitante
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      {selected.anonimo ? (
                        <p className="text-sm text-muted-foreground italic">Solicitud anónima</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-xs text-muted-foreground block">Nombre</span><strong>{selected.nombre || '—'}</strong></div>
                          <div><span className="text-xs text-muted-foreground block">Identificación</span><span>{selected.tipo_identificacion} {selected.numero_documento || '—'}</span></div>
                          {selected.email    && <div className="flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" />{selected.email}</div>}
                          {selected.telefono && <div className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{selected.telefono}</div>}
                          {(selected.ciudad || selected.departamento) && (
                            <div className="flex items-center gap-1 col-span-2">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {[selected.ciudad, selected.departamento, selected.pais].filter(Boolean).join(', ')}
                            </div>
                          )}
                          <div><span className="text-xs text-muted-foreground block">Medio de respuesta</span><span className="capitalize">{selected.medio_respuesta?.replace('_', ' ') || '—'}</span></div>
                          <div><span className="text-xs text-muted-foreground block">Fecha radicación</span><span className="text-xs">{fmtDate(selected.created_at)}</span></div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-medium">
                        <MessageSquare className="h-4 w-4" /> Mensaje
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 text-sm leading-relaxed whitespace-pre-wrap">
                      {selected.mensaje}
                    </CardContent>
                  </Card>

                  {selected.respuesta && (
                    <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-400">
                          <CheckCircle2 className="h-4 w-4" /> Respuesta institucional
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 space-y-2">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.respuesta}</p>
                        {selected.responded_by_name && (
                          <p className="text-xs text-muted-foreground">
                            Respondido por <strong>{selected.responded_by_name}</strong> el {fmtDate(selected.responded_at)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {history.length > 0 && (
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-medium">
                          <History className="h-4 w-4" /> Historial de acciones
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <ol className="relative border-l border-border ml-2 space-y-3">
                          {history.map((h, i) => (
                            <li key={i} className="ml-4 relative">
                              <div className="absolute -left-5 top-1 h-2.5 w-2.5 rounded-full border border-background bg-muted-foreground" />
                              <p className="text-xs font-medium">{h.description}</p>
                              <p className="text-xs text-muted-foreground">{h.user_name || 'Sistema'} · {fmtDate(h.created_at)}</p>
                            </li>
                          ))}
                        </ol>
                      </CardContent>
                    </Card>
                  )}

                  {selected.status === 'pendiente' && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={statusChanging} onClick={() => handleStatusChange('en_revision')}>
                        {statusChanging
                          ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          : <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
                        }
                        Marcar En proceso
                      </Button>
                    </div>
                  )}

                  {selected.status !== 'respondido' && (
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-medium">
                          <Send className="h-4 w-4" /> Emitir respuesta oficial
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 space-y-3">
                        <textarea
                          placeholder="Redacte la respuesta oficial para esta solicitud…"
                          rows={4}
                          value={respuesta}
                          onChange={e => setRespuesta(e.target.value)}
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        />
                        <Button className="w-full" disabled={sendingResp || respuesta.trim().length < 5} onClick={handleResponder}>
                          {sendingResp
                            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando…</>
                            : <><CheckCircle2 className="h-4 w-4 mr-2" />Registrar respuesta y marcar como Respondido</>
                          }
                        </Button>
                        {respuesta.trim().length > 0 && respuesta.trim().length < 5 && (
                          <p className="text-xs text-destructive">La respuesta debe tener al menos 5 caracteres.</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              <DialogFooter className="mt-2">
                <Button variant="outline" onClick={() => setSelected(null)}>Cerrar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
