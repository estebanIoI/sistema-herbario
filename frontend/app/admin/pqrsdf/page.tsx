"use client"

import { useState, useEffect, useCallback } from "react"
import { apiService } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText, Search, ChevronLeft, ChevronRight, RefreshCw,
  Clock, CheckCircle2, AlertCircle, MessageSquare, Eye, Calendar,
  User, Mail, Phone, MapPin, Send, History, Loader2
} from "lucide-react"

// ── Config tipos y estados ────────────────────────────────────────────────────

type Tipo = 'peticion' | 'queja' | 'reclamo' | 'sugerencia' | 'denuncia' | 'felicitacion'
type Status = 'pendiente' | 'en_revision' | 'respondido'

const TIPO_CFG: Record<Tipo, { label: string; color: string }> = {
  peticion:    { label: 'Petición',     color: 'bg-blue-100 text-blue-800 border-blue-200' },
  queja:       { label: 'Queja',        color: 'bg-orange-100 text-orange-800 border-orange-200' },
  reclamo:     { label: 'Reclamo',      color: 'bg-red-100 text-red-800 border-red-200' },
  sugerencia:  { label: 'Sugerencia',   color: 'bg-green-100 text-green-800 border-green-200' },
  denuncia:    { label: 'Denuncia',     color: 'bg-purple-100 text-purple-800 border-purple-200' },
  felicitacion:{ label: 'Felicitación', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
}

const STATUS_CFG: Record<Status, { label: string; color: string }> = {
  pendiente:   { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  en_revision: { label: 'En proceso', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  respondido:  { label: 'Respondido', color: 'bg-green-100 text-green-800 border-green-200' },
}

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

// ── Página principal ──────────────────────────────────────────────────────────

export default function PqrsdfAdminPage() {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [filterTipo, setFilterTipo] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const [stats, setStats] = useState({ total: 0, pendiente: 0, en_revision: 0, respondido: 0 })

  const [selected, setSelected] = useState<any | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [respuesta, setRespuesta] = useState("")
  const [sendingResp, setSendingResp] = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)

  const LIMIT = 15

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: any = { page, limit: LIMIT }
      if (filterTipo !== "all") params.tipo = filterTipo
      if (filterStatus !== "all") params.status = filterStatus

      const res = await apiService.getPqrsdf(params)
      if (!res.success) { setError(res.error || "Error al cargar"); return }

      const d = res.data!
      let list: any[] = d.pqrsdf || []

      if (search.trim()) {
        const q = search.toLowerCase()
        list = list.filter(r =>
          r.radicado?.toLowerCase().includes(q) ||
          r.nombre?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.mensaje?.toLowerCase().includes(q)
        )
      }

      setItems(list)
      setTotal(d.total)
      setPages(d.pages)

      const s = { total: d.total, pendiente: 0, en_revision: 0, respondido: 0 }
      for (const r of d.pqrsdf) {
        if (r.status === 'pendiente') s.pendiente++
        else if (r.status === 'en_revision') s.en_revision++
        else if (r.status === 'respondido') s.respondido++
      }
      setStats(s)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, filterTipo, filterStatus, search])

  useEffect(() => { fetchData() }, [fetchData])

  const openDetail = async (item: any) => {
    setSelected(item)
    setRespuesta(item.respuesta || "")
    setHistory([])
    setLoadingDetail(true)
    try {
      const res = await apiService.getPqrsdfById(item.id)
      if (res.success && res.data) {
        setSelected(res.data.pqrsdf)
        setHistory(res.data.history || [])
        setRespuesta(res.data.pqrsdf.respuesta || "")
      }
    } catch { /* usar datos previos */ } finally {
      setLoadingDetail(false)
    }
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
        // Recargar detalle del modal (incluye responded_by_name)
        const det = await apiService.getPqrsdfById(selected.id)
        if (det.success && det.data) {
          setSelected(det.data.pqrsdf)
          setHistory(det.data.history || [])
          setRespuesta(det.data.pqrsdf.respuesta || "")
        }
        // Recargar tabla para mostrar responded_by_name actualizado
        await fetchData()
      }
    } finally { setSendingResp(false) }
  }

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            PQRSDF
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Peticiones, Quejas, Reclamos, Sugerencias, Denuncias y Felicitaciones
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([
          { label: 'Total',       value: stats.total,       icon: FileText,      color: 'text-foreground' },
          { label: 'Pendientes',  value: stats.pendiente,   icon: Clock,         color: 'text-yellow-600' },
          { label: 'En proceso',  value: stats.en_revision, icon: AlertCircle,   color: 'text-blue-600' },
          { label: 'Respondidos', value: stats.respondido,  icon: CheckCircle2,  color: 'text-green-600' },
        ] as const).map(s => (
          <Card key={s.label} className="border">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por radicado, nombre, email o mensaje…"
            className="pl-9"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={filterTipo} onValueChange={v => { setFilterTipo(v); setPage(1) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(TIPO_CFG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_revision">En proceso</SelectItem>
            <SelectItem value="respondido">Respondido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Radicado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Solicitante</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Respondido por</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Cargando…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-destructive">{error}</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No hay registros para mostrar
                  </td>
                </tr>
              ) : items.map(item => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-primary">
                    {item.radicado || `#${item.id}`}
                  </td>
                  <td className="px-4 py-3"><TipoBadge tipo={item.tipo} /></td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {item.anonimo
                      ? <span className="text-muted-foreground italic text-xs">Anónimo</span>
                      : <div>
                          <div className="font-medium">{item.nombre || '—'}</div>
                          <div className="text-xs text-muted-foreground">{item.email || ''}</div>
                        </div>
                    }
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                    {fmtDate(item.created_at)}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    {item.responded_by_name
                      ? <div>
                          <div className="text-xs font-medium">{item.responded_by_name}</div>
                          <div className="text-xs text-muted-foreground">{item.responded_at ? fmtDate(item.responded_at) : ''}</div>
                        </div>
                      : <span className="text-xs text-muted-foreground">—</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="icon" onClick={() => openDetail(item)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {items.length} de {total} registros
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">Página {page} / {pages}</span>
            <Button variant="outline" size="icon" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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

                  {/* Solicitante */}
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
                          {selected.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" />{selected.email}</div>}
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

                  {/* Mensaje */}
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

                  {/* Respuesta institucional existente */}
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

                  {/* Historial */}
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

                  {/* Acciones de estado (sin Pendiente) */}
                  {selected.status === 'pendiente' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={statusChanging}
                        onClick={() => handleStatusChange('en_revision')}
                      >
                        {statusChanging
                          ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          : <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
                        }
                        Marcar En proceso
                      </Button>
                    </div>
                  )}

                  {/* Formulario de respuesta */}
                  {selected.status !== 'respondido' && (
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-medium">
                          <Send className="h-4 w-4" /> Emitir respuesta oficial
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 space-y-3">
                        <Textarea
                          placeholder="Redacte la respuesta oficial para esta solicitud…"
                          rows={4}
                          value={respuesta}
                          onChange={e => setRespuesta(e.target.value)}
                          className="resize-none text-sm"
                        />
                        <Button
                          className="w-full"
                          disabled={sendingResp || respuesta.trim().length < 5}
                          onClick={handleResponder}
                        >
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
