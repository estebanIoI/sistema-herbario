"use client"

import { useState, useEffect, useCallback } from "react"
import { apiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MessageSquare, Search, ChevronLeft, ChevronRight, RefreshCw,
  Clock, CheckCircle2, AlertCircle, XCircle, Eye, Send,
  History, Loader2, ThumbsUp, ThumbsDown, Tag, User
} from "lucide-react"

// ── Config ────────────────────────────────────────────────────────────────────

type SugStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'implemented'
type SugType = 'feature' | 'bug' | 'improvement' | 'data_correction' | 'new_plant'

const STATUS_CFG: Record<SugStatus, { label: string; color: string }> = {
  pending:     { label: 'Nueva',       color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  in_review:   { label: 'En revisión', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  approved:    { label: 'Aprobada',    color: 'bg-green-100 text-green-800 border-green-200' },
  rejected:    { label: 'Rechazada',   color: 'bg-red-100 text-red-800 border-red-200' },
  implemented: { label: 'Respondida',  color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
}

const TYPE_CFG: Record<SugType, string> = {
  feature:          'Nueva función',
  bug:              'Error',
  improvement:      'Mejora',
  data_correction:  'Corrección de datos',
  new_plant:        'Nueva planta',
}

const PRIORITY_CFG: Record<string, { label: string; color: string }> = {
  low:      { label: 'Baja',     color: 'bg-gray-100 text-gray-700 border-gray-200' },
  medium:   { label: 'Media',    color: 'bg-blue-100 text-blue-700 border-blue-200' },
  high:     { label: 'Alta',     color: 'bg-orange-100 text-orange-700 border-orange-200' },
  critical: { label: 'Crítica',  color: 'bg-red-100 text-red-700 border-red-200' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status as SugStatus]
  const icons: Record<SugStatus, React.ReactNode> = {
    pending:     <Clock className="h-3 w-3" />,
    in_review:   <AlertCircle className="h-3 w-3" />,
    approved:    <CheckCircle2 className="h-3 w-3" />,
    rejected:    <XCircle className="h-3 w-3" />,
    implemented: <CheckCircle2 className="h-3 w-3" />,
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${cfg?.color ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {icons[status as SugStatus]}
      {cfg?.label ?? status}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground border">
      {TYPE_CFG[type as SugType] ?? type}
    </span>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function SugerenciasAdminPage() {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")

  const [stats, setStats] = useState({ total: 0, pending: 0, in_review: 0, approved: 0, rejected: 0, implemented: 0 })

  const [selected, setSelected] = useState<any | null>(null)
  const [adminResponse, setAdminResponse] = useState("")
  const [sendingResp, setSendingResp] = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const LIMIT = 15

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: any = { page, limit: LIMIT }
      if (filterStatus !== "all") params.status = filterStatus
      if (filterType !== "all") params.type = filterType

      const res = await apiService.getSuggestions(params)
      if (!res.success) { setError(res.error || "Error al cargar"); return }

      const d = res.data!
      let list: any[] = d.suggestions || []

      if (search.trim()) {
        const q = search.toLowerCase()
        list = list.filter(s =>
          s.title?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.contact_name?.toLowerCase().includes(q) ||
          s.contact_email?.toLowerCase().includes(q)
        )
      }

      setItems(list)
      setTotal((d as any).pagination?.total ?? list.length)
      setPages((d as any).pagination?.totalPages ?? 1)

      const sm = (d as any).summary
      if (sm) setStats({
        total: sm.total,
        pending: sm.pending,
        in_review: sm.in_review,
        approved: sm.approved,
        rejected: sm.rejected,
        implemented: sm.implemented,
      })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, filterStatus, filterType, search])

  useEffect(() => { fetchData() }, [fetchData])

  const openDetail = (item: any) => {
    setSelected(item)
    setAdminResponse(item.admin_response || "")
    setActionError(null)
  }

  const handleStatusChange = async (newStatus: SugStatus) => {
    if (!selected) return
    setStatusChanging(true)
    setActionError(null)
    try {
      const res = await apiService.updateSuggestionStatus(selected.id, newStatus)
      if (res.success) {
        const updated = { ...selected, status: newStatus }
        setSelected(updated)
        setItems(prev => prev.map(i => i.id === selected.id ? { ...i, status: newStatus } : i))
      } else {
        setActionError(res.error || "Error al actualizar estado")
      }
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setStatusChanging(false) }
  }

  const handleResponder = async () => {
    if (!selected || adminResponse.trim().length < 5) return
    setSendingResp(true)
    setActionError(null)
    try {
      const res = await apiService.respondToSuggestion(selected.id, adminResponse)
      if (res.success) {
        // Actualizar modal con datos completos del servidor (incluye responded_by_name)
        setSelected((prev: any) => ({ ...prev, status: 'implemented', admin_response: adminResponse }))
        // Recargar tabla para mostrar responded_by_name actualizado
        await fetchData()
        // Disparar evento para actualizar contador en sidebar
        window.dispatchEvent(new Event('suggestionProcessed'))
      } else {
        setActionError(res.error || "Error al registrar respuesta")
      }
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setSendingResp(false)
    }
  }

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Sugerencias
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestión de sugerencias, errores y solicitudes de mejora
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {([
          { key: 'total',       label: 'Total',       color: 'text-foreground' },
          { key: 'pending',     label: 'Nuevas',      color: 'text-yellow-600' },
          { key: 'in_review',   label: 'En revisión', color: 'text-blue-600' },
          { key: 'approved',    label: 'Aprobadas',   color: 'text-green-600' },
          { key: 'rejected',    label: 'Rechazadas',  color: 'text-red-600' },
          { key: 'implemented', label: 'Respondidas', color: 'text-emerald-600' },
        ] as const).map(s => (
          <Card key={s.key} className="border">
            <CardContent className="p-3 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{stats[s.key]}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, descripción o contacto…"
            className="pl-9"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={v => { setFilterType(v); setPage(1) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(TYPE_CFG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Contacto</th>
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
                    No hay sugerencias para mostrar
                  </td>
                </tr>
              ) : items.map(item => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium line-clamp-1">{item.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1 hidden sm:block">{item.description}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell"><TypeBadge type={item.suggestion_type} /></td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm">
                    {item.contact_name
                      ? <div>
                          <div className="font-medium">{item.contact_name}</div>
                          <div className="text-xs text-muted-foreground">{item.contact_email || ''}</div>
                        </div>
                      : <span className="text-xs text-muted-foreground italic">Anónimo</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                    {fmtDate(item.submitted_at)}
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
          <p className="text-sm text-muted-foreground">{items.length} de {total} sugerencias</p>
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
                  <MessageSquare className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-medium">{selected.title}</span>
                  <TypeBadge type={selected.suggestion_type} />
                  <StatusBadge status={selected.status} />
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">

                {/* Info del solicitante */}
                {selected.contact_name && (
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-medium">
                        <User className="h-4 w-4" /> Contacto
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-xs text-muted-foreground block">Nombre</span><strong>{selected.contact_name}</strong></div>
                      {selected.contact_email && <div><span className="text-xs text-muted-foreground block">Correo</span>{selected.contact_email}</div>}
                      {selected.contact_phone && <div><span className="text-xs text-muted-foreground block">Teléfono</span>{selected.contact_phone}</div>}
                      <div><span className="text-xs text-muted-foreground block">Enviado</span><span className="text-xs">{fmtDate(selected.submitted_at)}</span></div>
                    </CardContent>
                  </Card>
                )}

                {/* Descripción */}
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center justify-between text-muted-foreground font-medium">
                      <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> Descripción</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-green-600">
                          <ThumbsUp className="h-3 w-3" />{selected.votes_up}
                        </span>
                        <span className="flex items-center gap-1 text-red-500">
                          <ThumbsDown className="h-3 w-3" />{selected.votes_down}
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {selected.description}
                  </CardContent>
                </Card>

                {/* Respuesta institucional */}
                {selected.admin_response && (
                  <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" /> Respuesta institucional
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.admin_response}</p>
                      {selected.responded_by_name && (
                        <p className="text-xs text-muted-foreground">
                          Respondido por <strong>{selected.responded_by_name}</strong> el {fmtDate(selected.responded_at)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Error de acción */}
                {actionError && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{actionError}</p>
                )}

                {/* Cambiar estado */}
                {selected.status !== 'implemented' && selected.status !== 'rejected' && (
                  <div className="flex flex-wrap gap-2">
                    {selected.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={statusChanging}
                        onClick={() => handleStatusChange('in_review')}
                      >
                        {statusChanging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />}
                        Poner en revisión
                      </Button>
                    )}
                    {(selected.status === 'pending' || selected.status === 'in_review') && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={statusChanging}
                        onClick={() => handleStatusChange('approved')}
                      >
                        {statusChanging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />}
                        Aprobar
                      </Button>
                    )}
                    {selected.status !== 'rejected' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={statusChanging}
                        onClick={() => handleStatusChange('rejected')}
                      >
                        {statusChanging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2 text-red-500" />}
                        Rechazar
                      </Button>
                    )}
                  </div>
                )}

                {/* Formulario de respuesta */}
                {selected.status !== 'implemented' && selected.status !== 'rejected' && (
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-medium">
                        <Send className="h-4 w-4" /> Respuesta oficial
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      <Textarea
                        placeholder="Redacte la respuesta oficial para esta sugerencia…"
                        rows={4}
                        value={adminResponse}
                        onChange={e => setAdminResponse(e.target.value)}
                        className="resize-none text-sm"
                      />
                      <Button
                        className="w-full"
                        disabled={sendingResp || adminResponse.trim().length < 5}
                        onClick={handleResponder}
                      >
                        {sendingResp
                          ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando…</>
                          : <><CheckCircle2 className="h-4 w-4 mr-2" />Registrar respuesta y marcar como Respondida</>
                        }
                      </Button>
                      {adminResponse.trim().length > 0 && adminResponse.trim().length < 5 && (
                        <p className="text-xs text-destructive">La respuesta debe tener al menos 5 caracteres.</p>
                      )}
                    </CardContent>
                  </Card>
                )}

              </div>

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
