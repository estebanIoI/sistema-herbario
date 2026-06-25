"use client"

import { useCallback, useEffect, useState } from "react"
import { DataTable, ColDef, FilterDef } from "@/components/ui/data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Users, UserX, Shield, Plus, Pencil, Power, Trash2, Loader2 } from "lucide-react"
import { apiService } from "@/lib/api"

interface User {
  id: number; name: string; email: string; phone?: string
  role: "admin" | "investigador" | "collector" | "user"
  status: "active" | "inactive" | "pending"
  created_at: string
}

const ROLE_CFG: Record<string, { label: string; cls: string }> = {
  admin:        { label: "Administrador", cls: "bg-purple-100 text-purple-700 border-purple-200" },
  investigador: { label: "Investigador",  cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  collector:    { label: "Colector",      cls: "bg-blue-100 text-blue-700 border-blue-200" },
  user:         { label: "Usuario",       cls: "bg-gray-100 text-gray-700 border-gray-200" },
}
const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  active:   { label: "Activo",    cls: "bg-green-100 text-green-700 border-green-200" },
  inactive: { label: "Inactivo",  cls: "bg-amber-100 text-amber-700 border-amber-200" },
  pending:  { label: "Pendiente", cls: "bg-sky-100 text-sky-700 border-sky-200" },
}
const ROLE_OPTIONS = [
  { value: "user",         label: "Usuario" },
  { value: "collector",    label: "Colector" },
  { value: "investigador", label: "Investigador" },
  { value: "admin",        label: "Administrador" },
]
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—"

const FILTERS: FilterDef[] = [
  {
    id: "role", label: "Rol", type: "select",
    options: ROLE_OPTIONS.map(r => ({ value: r.value, label: r.label })),
  },
  {
    id: "status", label: "Estado", type: "select",
    options: [{ value: "active", label: "Activo" }, { value: "inactive", label: "Inactivo" }, { value: "pending", label: "Pendiente" }],
  },
]

type FormState = {
  id?: number; name: string; email: string; phone: string
  role: string; status: string; password: string
}
const EMPTY_FORM: FormState = { name: "", email: "", phone: "", role: "user", status: "active", password: "" }

export default function UsuariosPage() {
  const { toast } = useToast()
  const [data, setData]        = useState<User[]>([])
  const [total, setTotal]      = useState(0)
  const [loading, setLoading]  = useState(true)
  const [error, setError]      = useState<string | null>(null)
  const [page, setPage]        = useState(1)
  const [limit, setLimit]      = useState(25)
  const [search, setSearch]    = useState("")
  const [sort, setSort]        = useState<{ id: string; dir: "asc" | "desc" } | null>(null)
  const [activeFilters, setAF] = useState<Record<string, string>>({})

  // Formulario crear/editar
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm]         = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const isEdit = form.id != null

  // Confirmación de borrado
  const [toDelete, setToDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    const res = await apiService.getUsers({
      page, limit,
      search: search || undefined,
      role:   (activeFilters.role   && activeFilters.role   !== "all") ? activeFilters.role   : undefined,
      status: (activeFilters.status && activeFilters.status !== "all") ? activeFilters.status : undefined,
      sortBy: sort?.id, sortDir: sort?.dir,
    })
    if (res.success) {
      const rows = Array.isArray(res.data) ? res.data : res.data?.users ?? []
      setData(rows)
      setTotal(res.data?.total ?? res.data?.pagination?.total ?? rows.length)
    } else {
      setError(res.error ?? "Error al cargar usuarios")
    }
    setLoading(false)
  }, [page, limit, search, sort, activeFilters])

  useEffect(() => { load() }, [load])

  const setFilter = (id: string, value: string) => { setAF(prev => ({ ...prev, [id]: value })); setPage(1) }

  const openCreate = () => { setForm(EMPTY_FORM); setFormOpen(true) }
  const openEdit = (u: User) => {
    setForm({ id: u.id, name: u.name, email: u.email, phone: u.phone ?? "", role: u.role, status: u.status, password: "" })
    setFormOpen(true)
  }

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Faltan datos", description: "Nombre y email son obligatorios.", variant: "destructive" }); return
    }
    if (!isEdit && form.password.length < 6) {
      toast({ title: "Contraseña inválida", description: "Mínimo 6 caracteres.", variant: "destructive" }); return
    }
    setSaving(true)
    const res = isEdit
      ? await apiService.updateUser({
          id: form.id!, name: form.name, email: form.email, phone: form.phone,
          role: form.role, status: form.status,
          ...(form.password ? { password: form.password } : {}),
        })
      : await apiService.createUser({
          name: form.name, email: form.email, password: form.password,
          role: form.role, phone: form.phone || undefined,
        })
    setSaving(false)
    if (res.success) {
      toast({ title: isEdit ? "Usuario actualizado" : "Usuario creado", description: form.email })
      setFormOpen(false); load()
    } else {
      toast({ title: "Error", description: res.error ?? "No se pudo guardar", variant: "destructive" })
    }
  }

  const toggleStatus = async (u: User) => {
    const next = u.status === "active" ? "inactive" : "active"
    const res = await apiService.updateUser({ id: u.id, status: next })
    if (res.success) { toast({ title: next === "inactive" ? "Usuario desactivado" : "Usuario activado", description: u.email }); load() }
    else toast({ title: "Error", description: res.error ?? "No se pudo cambiar el estado", variant: "destructive" })
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    const res = await apiService.deleteUser(toDelete.id)
    setDeleting(false)
    if (res.success) { toast({ title: "Usuario eliminado", description: toDelete.email }); setToDelete(null); load() }
    else toast({ title: "Error", description: res.error ?? "No se pudo eliminar", variant: "destructive" })
  }

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
    {
      id: "actions", header: "",
      cell: u => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => openEdit(u)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title={u.status === "active" ? "Desactivar" : "Activar"} onClick={() => toggleStatus(u)}>
            <Power className={`h-3.5 w-3.5 ${u.status === "active" ? "text-amber-600" : "text-green-600"}`} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" title="Eliminar" onClick={() => setToDelete(u)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const activos      = data.filter(u => u.status === "active").length
  const admins       = data.filter(u => u.role === "admin").length
  const investigad   = data.filter(u => u.role === "investigador").length
  const collectors   = data.filter(u => u.role === "collector").length

  return (
    <div className="space-y-5 pt-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight flex items-center gap-2" style={{ color: "var(--bot-ink)" }}>
            <Users className="h-7 w-7" style={{ color: "var(--bot-green)" }} />Usuarios
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--bot-ink-soft)" }}>Gestión de cuentas y roles del sistema</p>
        </div>
        <Button onClick={openCreate} style={{ background: "var(--bot-green)" }} className="text-white hover:opacity-90">
          <Plus className="h-4 w-4 mr-1.5" /> Nuevo usuario
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total",         value: total },
          { label: "Activos",       value: activos },
          { label: "Admins",        value: admins },
          { label: "Investigadores",value: investigad },
          { label: "Colectores",    value: collectors },
        ].map(s => (
          <div key={s.label} className="rounded-lg border px-4 py-3 bg-background">
            <div className="text-2xl font-bold tabular-nums">{s.value}</div>
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
        onRowClick={openEdit}
        emptyIcon={<UserX className="h-8 w-8 opacity-40" />}
        emptyTitle="Sin usuarios" emptyDescription="No hay usuarios registrados aún."
      />

      {/* Crear / Editar */}
      <Dialog open={formOpen} onOpenChange={o => { if (!o) setFormOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isEdit ? "Editar usuario" : "Nuevo usuario"}
            </DialogTitle>
            <DialogDescription>
              {isEdit ? "Modifica los datos y el rol del usuario." : "Crea una cuenta y asígnale un rol."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="u-name">Nombre</Label>
              <Input id="u-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-email">Email</Label>
              <Input id="u-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-phone">Teléfono (opcional)</Label>
              <Input id="u-phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-pass">{isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}</Label>
              <Input id="u-pass" type="password" placeholder={isEdit ? "Dejar en blanco para no cambiar" : "Mínimo 6 caracteres"}
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={save} disabled={saving} style={{ background: "var(--bot-green)" }} className="text-white hover:opacity-90">
              {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Guardando…</> : (isEdit ? "Guardar cambios" : "Crear usuario")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar borrado */}
      <Dialog open={!!toDelete} onOpenChange={o => { if (!o) setToDelete(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-4 w-4" /> Eliminar usuario
            </DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres eliminar a <span className="font-medium">{toDelete?.name}</span> ({toDelete?.email})? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Eliminando…</> : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
