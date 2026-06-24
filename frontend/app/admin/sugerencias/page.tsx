"use client"

import { useState, useEffect, useCallback } from "react"
import { apiService } from "@/lib/api"
import { DataTable, ColDef, FilterDef } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MessageSquare, Clock, CheckCircle2, AlertCircle, XCircle,
  Send, Tag, User, ThumbsUp, ThumbsDown, Loader2, Eye
} from "lucide-react"

// ── Config ────────────────────────────────────────────────────────────────────

type SugStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'implemented'
type SugType   = 'feature' | 'bug' | 'improvement' | 'data_correction' | 'new_plant'

const STATUS_CFG: Record<SugStatus, { label: string; color: string }> = {
  pending:     { label: 'Nueva',       color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  in_review:   { label: 'En revisión', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  approved:    { label: 'Aprobada',    color: 'bg-green-100 text-green-800 border-green-200' },
  rejected:    { label: 'Rechazada',   color: 'bg-red-100 text-red-800 border-red-200' },
  implemented: { label: 'Respondida',  color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
}

const TYPE_CFG: Record<SugType, string> = {
  feature:         'Nueva función',
  bug:             'Error',
  improvement:     'Mejora',
  data_correction: 'Corrección de datos',
  new_plant:       'Nueva planta',
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

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

// ── Columnas ──────────────────────────────────────────────────────────────────

const COLUMNS: ColDef<any>[] = [
  {
    id: "title", header: "Título", sortable: true,
    cell: row => (
      <div>
        <p className="text-sm font-medium line-clamp-1">{row.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-1 hidden sm:block">{row.description}</p>
      </div>
    ),
  },
  {
    id: "suggestion_type", header: "Tipo", hideBelow: "sm",
    cell: row => (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground border">
        {TYPE_CFG[row.suggestion_type as SugType] ?? row.suggestion_type}
      </span>
    ),
  },
  {
    id: "contact_name", header: "Contacto", hideBelow: "md",
    cell: row => row.contact_name
      ? <div>
          <p className="text-sm font-medium">{row.contact_name}</p>
          <p className="text-xs text-muted-foreground">{row.contact_email ?? ''}</p>
        </div>
      : <span className="text-xs text-muted-foreground italic">Anónimo</span>,
  },
  {
    id: "submitted_at", header: "Fecha", sortable: true, hideBelow: "lg",
    cell: row => <span className="text-xs text-muted-foreground">{fmtDate(row.submitted_at)}</span>,
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
    id: "status", label: "Estado", type: "select",
    options: Object.entries(STATUS_CFG).map(([k, v]) => ({ value: k, label: v.label })),
  },
  {
    id: "type", label: "Tipo", type: "select",
    options: Object.entries(TYPE_CFG).map(([k, v]) => ({ value: k, label: v })),
  },
]

// ── Página ────────────────────────────────────────────────────────────────────

export default function SugerenciasAdminPage() {
  const [items, setItems]         = useState<any[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [page, setPage]           = useState(1)
  const [limit, setLimit]         = useState(15)
  const [search, setSearch]       = useState("")
  const [sort, setSort]           = useState<{ id: string; dir: "asc" | "desc" } | null>(null)
  const [activeFilters, setAF]    = useState<Record<string, string>>({})
  const [stats, setStats]         = useState({ total: 0, pending: 0, in_review: 0, approved: 0, rejected: 0, implemented: 0 })
  const [selected, setSelected]   = useState<any | null>(null)
  const [adminResponse, setAdminResponse] = useState("")
  const [sendingResp, setSendingResp]     = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)
  const [actionError, setActionError]     = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params: any = { page, limit }
      if (activeFilters.status && activeFilters.status !== "all") params.status = activeFilters.status
      if (activeFilters.type   && activeFilters.type   !== "all") params.type   = activeFilters.type
      if (search.trim()) params.search = search
      if (sort) {
        // mapear id de columna al campo que conoce el backend
        const sortMap: Record<string, string> = { suggestion_type: 'type', submitted_at: 'submitted_at' }
        params.sortBy  = sortMap[sort.id] ?? sort.id
        params.sortDir = sort.dir
      }

      const res = await apiService.getSuggestions(params)
      if (!res.success) { setError(res.error || "Error al cargar"); return }

      const d = res.data!
      setItems(d.suggestions ?? [])
      setTotal((d as any).pagination?.total ?? (d.suggestions?.length ?? 0))

      const sm = (d as any).summary
      if (sm) setStats({ total: sm.total, pending: sm.pending, in_review: sm.in_review, approved: sm.approved, rejected: sm.rejected, implemented: sm.implemented })
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, limit, activeFilters, search, sort])

  useEffect(() => { fetchData() }, [fetchData])

  const setFilter = (id: string, value: string) => { setAF(prev => ({ ...prev, [id]: value })); setPage(1) }

  const openDetail = (item: any) => {
    setSelected(item); setAdminResponse(item.admin_response || ""); setActionError(null)
  }

  const handleStatusChange = async (newStatus: SugStatus) => {
    if (!selected) return
    setStatusChanging(true); setActionError(null)
    try {
      const res = await apiService.updateSuggestionStatus(selected.id, newStatus)
      if (res.success) {
        setSelected((p: any) => ({ ...p, status: newStatus }))
        setItems(prev => prev.map(i => i.id === selected.id ? { ...i, status: newStatus } : i))
      } else { setActionError(res.error || "Error al actualizar") }
    } catch (e: any) { setActionError(e.message) }
    finally { setStatusChanging(false) }
  }

  const handleResponder = async () => {
    if (!selected || adminResponse.trim().length < 5) return
    setSendingResp(true); setActionError(null)
    try {
      const res = await apiService.respondToSuggestion(selected.id, adminResponse)
      if (res.success) {
        setSelected((p: any) => ({ ...p, status: 'implemented', admin_response: adminResponse }))
        await fetchData()
        window.dispatchEvent(new Event('suggestionProcessed'))
      } else { setActionError(res.error || "Error al responder") }
    } catch (e: any) { setActionError(e.message) }
    finally { setSendingResp(false) }
  }

  return (
    <div className="space-y-5 p-1">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />Sugerencias
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestión de sugerencias, errores y solicitudes de mejora</p>
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
          <div key={s.key} className="rounded-lg border px-3 py-2.5 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{stats[s.key]}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <DataTable<any>
        data={items} columns={COLUMNS} getRowId={r => r.id}
        loading={loading} error={error ?? undefined}
        pagination={{ page, limit, total, onPageChange: setPage, onLimitChange: p => { setLimit(p); setPage(1) } }}
        search={search} onSearchChange={v => { setSearch(v); setPage(1) }}
        searchPlaceholder="Buscar por título, descripción o contacto…"
        sort={sort} onSortChange={setSort}
        filters={FILTERS} activeFilters={activeFilters} onFilterChange={setFilter}
        onRowClick={openDetail}
        emptyIcon={<MessageSquare className="h-8 w-8 opacity-40" />}
        emptyTitle="Sin sugerencias" emptyDescription="No hay sugerencias registradas aún."
      />

      {/* Modal detalle */}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <MessageSquare className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-medium">{selected.title}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground border">
                    {TYPE_CFG[selected.suggestion_type as SugType] ?? selected.suggestion_type}
                  </span>
                  <StatusBadge status={selected.status} />
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
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

                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center justify-between text-muted-foreground font-medium">
                      <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> Descripción</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-green-600"><ThumbsUp className="h-3 w-3" />{selected.votes_up}</span>
                        <span className="flex items-center gap-1 text-red-500"><ThumbsDown className="h-3 w-3" />{selected.votes_down}</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {selected.description}
                  </CardContent>
                </Card>

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

                {actionError && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{actionError}</p>
                )}

                {selected.status !== 'implemented' && selected.status !== 'rejected' && (
                  <div className="flex flex-wrap gap-2">
                    {selected.status === 'pending' && (
                      <Button variant="outline" size="sm" disabled={statusChanging} onClick={() => handleStatusChange('in_review')}>
                        {statusChanging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />}
                        Poner en revisión
                      </Button>
                    )}
                    {(selected.status === 'pending' || selected.status === 'in_review') && (
                      <Button variant="outline" size="sm" disabled={statusChanging} onClick={() => handleStatusChange('approved')}>
                        {statusChanging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />}
                        Aprobar
                      </Button>
                    )}
                    {selected.status !== 'rejected' && (
                      <Button variant="outline" size="sm" disabled={statusChanging} onClick={() => handleStatusChange('rejected')}>
                        {statusChanging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2 text-red-500" />}
                        Rechazar
                      </Button>
                    )}
                  </div>
                )}

                {selected.status !== 'implemented' && selected.status !== 'rejected' && (
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-medium">
                        <Send className="h-4 w-4" /> Respuesta oficial
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      <textarea
                        placeholder="Redacte la respuesta oficial para esta sugerencia…"
                        rows={4}
                        value={adminResponse}
                        onChange={e => setAdminResponse(e.target.value)}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      />
                      <Button className="w-full" disabled={sendingResp || adminResponse.trim().length < 5} onClick={handleResponder}>
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
