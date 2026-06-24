"use client"

import { useCallback, useEffect, useState } from "react"
import { DataTable, ColDef, FilterDef } from "@/components/ui/data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Users, UserCheck, UserX, Shield } from "lucide-react"
import { apiService } from "@/lib/api"

interface User {
  id: number; name: string; email: string
  role: "admin" | "user" | "collector"
  status: "active" | "inactive" | "pending"
  created_at: string
}

const ROLE_CFG: Record<string, { label: string; cls: string }> = {
  admin:     { label: "Admin",    cls: "bg-purple-100 text-purple-700 border-purple-200" },
  collector: { label: "Colector", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  user:      { label: "Usuario",  cls: "bg-gray-100 text-gray-700 border-gray-200" },
}
const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  active:   { label: "Activo",    cls: "bg-green-100 text-green-700 border-green-200" },
  inactive: { label: "Inactivo",  cls: "bg-amber-100 text-amber-700 border-amber-200" },
  pending:  { label: "Pendiente", cls: "bg-sky-100 text-sky-700 border-sky-200" },
}
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—"

const COLUMNS: ColDef<User>[] = [
  {
    id: "name", header: "Nombre", sortable: true,
    cell: u => (
      <div>
        <p className="text-sm font-medium">{u.name}</p>
        <p className="text-xs text-muted-foreground">{u.email}</p>
      </div>
    ),
  },
  {
    id: "role", header: "Rol", sortable: true, hideBelow: "sm",
    cell: u => {
      const cfg = ROLE_CFG[u.role] ?? ROLE_CFG.user
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${cfg.cls}`}>
          <Shield className="h-2.5 w-2.5" />{cfg.label}
        </span>
      )
    },
  },
  {
    id: "status", header: "Estado", sortable: true, hideBelow: "sm",
    cell: u => {
      const cfg = STATUS_CFG[u.status] ?? STATUS_CFG.inactive
      return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${cfg.cls}`}>{cfg.label}</span>
    },
  },
  {
    id: "created_at", header: "Registro", sortable: true, hideBelow: "md",
    cell: u => <span className="text-xs text-muted-foreground">{fmtDate(u.created_at)}</span>,
  },
]

const FILTERS: FilterDef[] = [
  {
    id: "role", label: "Rol", type: "select",
    options: [{ value: "admin", label: "Admin" }, { value: "collector", label: "Colector" }, { value: "user", label: "Usuario" }],
  },
  {
    id: "status", label: "Estado", type: "select",
    options: [{ value: "active", label: "Activo" }, { value: "inactive", label: "Inactivo" }, { value: "pending", label: "Pendiente" }],
  },
]

export default function UsuariosPage() {
  const [data, setData]           = useState<User[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [page, setPage]           = useState(1)
  const [limit, setLimit]         = useState(25)
  const [search, setSearch]       = useState("")
  const [sort, setSort]           = useState<{ id: string; dir: "asc" | "desc" } | null>(null)
  const [activeFilters, setAF]    = useState<Record<string, string>>({})
  const [detail, setDetail]       = useState<User | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: "users.getAll",
          token: apiService.getToken(),
          data: {
            page, limit,
            search: search || undefined,
            role:   (activeFilters.role   && activeFilters.role   !== "all") ? activeFilters.role   : undefined,
            status: (activeFilters.status && activeFilters.status !== "all") ? activeFilters.status : undefined,
            sortBy: sort?.id, sortDir: sort?.dir,
          },
        }),
      })
      const json = await res.json()
      if (json.success) {
        const rows = Array.isArray(json.data) ? json.data : json.data?.users ?? []
        setData(rows)
        setTotal(json.data?.total ?? json.data?.pagination?.total ?? rows.length)
      } else {
        setError(json.error ?? "Error al cargar usuarios")
      }
    } catch { setError("Error de conexión") }
    finally { setLoading(false) }
  }, [page, limit, search, sort, activeFilters])

  useEffect(() => { load() }, [load])

  const setFilter = (id: string, value: string) => {
    setAF(prev => ({ ...prev, [id]: value }))
    setPage(1)
  }

  const activos    = data.filter(u => u.status === "active").length
  const admins     = data.filter(u => u.role === "admin").length
  const collectors = data.filter(u => u.role === "collector").length

  return (
    <div className="space-y-5 p-1">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />Usuarios
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestión de cuentas del sistema</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",      value: total,      bg: "bg-background" },
          { label: "Activos",    value: activos,    bg: "bg-green-50 dark:bg-green-950/30" },
          { label: "Admins",     value: admins,     bg: "bg-purple-50 dark:bg-purple-950/30" },
          { label: "Colectores", value: collectors, bg: "bg-blue-50 dark:bg-blue-950/30" },
        ].map(s => (
          <div key={s.label} className={`rounded-lg border px-4 py-3 ${s.bg}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <DataTable<User>
        data={data} columns={COLUMNS} getRowId={u => u.id}
        loading={loading} error={error ?? undefined}
        pagination={{ page, limit, total, onPageChange: setPage, onLimitChange: p => { setLimit(p); setPage(1) } }}
        search={search} onSearchChange={v => { setSearch(v); setPage(1) }}
        searchPlaceholder="Buscar por nombre o email…"
        sort={sort} onSortChange={setSort}
        filters={FILTERS} activeFilters={activeFilters} onFilterChange={setFilter}
        onRowClick={setDetail}
        emptyIcon={<UserX className="h-8 w-8 opacity-40" />}
        emptyTitle="Sin usuarios" emptyDescription="No hay usuarios registrados aún."
      />

      <Dialog open={!!detail} onOpenChange={o => { if (!o) setDetail(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />{detail?.name}
            </DialogTitle>
            <DialogDescription>{detail?.email}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              {[
                { label: "Rol",        value: <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${ROLE_CFG[detail.role]?.cls}`}>{ROLE_CFG[detail.role]?.label}</span> },
                { label: "Estado",     value: <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${STATUS_CFG[detail.status]?.cls}`}>{STATUS_CFG[detail.status]?.label}</span> },
                { label: "Registrado", value: fmtDate(detail.created_at) },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span>{r.value}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
