"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DataTable, ColDef, FilterDef } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, Eye, EyeOff, Leaf, Newspaper, Loader2 } from "lucide-react"
import { apiService } from "@/lib/api"

interface Post {
  id: number
  title: string
  excerpt: string | null
  image_url: string | null
  category: 'publicacion' | 'servicio'
  tags: string | null
  status: 'published' | 'draft'
  views: number
  created_at: string
  author_name: string | null
}

const CATEGORY_CFG = {
  publicacion: { label: 'Publicación', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  servicio:    { label: 'Servicio',    cls: 'bg-blue-100 text-blue-700 border-blue-200' },
}
const STATUS_CFG = {
  published: { label: 'Publicado', cls: 'bg-green-100 text-green-700 border-green-200' },
  draft:     { label: 'Borrador',  cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

const FILTERS: FilterDef[] = [
  {
    id: "status", label: "Estado", type: "select",
    options: [{ value: "published", label: "Publicado" }, { value: "draft", label: "Borrador" }],
  },
  {
    id: "category", label: "Categoría", type: "select",
    options: [{ value: "publicacion", label: "Publicación" }, { value: "servicio", label: "Servicio" }],
  },
]

export default function AdminPublicacionesPage() {
  const router = useRouter()
  const [posts, setPosts]       = useState<Post[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [limit, setLimit]       = useState(25)
  const [search, setSearch]     = useState("")
  const [sort, setSort]         = useState<{ id: string; dir: "asc" | "desc" } | null>(null)
  const [activeFilters, setAF]  = useState<Record<string, string>>({})
  const [deleting, setDeleting] = useState<number | null>(null)
  const [toggling, setToggling] = useState<number | null>(null)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiService.getPosts({
        search:   search || undefined,
        status:   (activeFilters.status   && activeFilters.status   !== "all") ? activeFilters.status   : undefined,
        category: (activeFilters.category && activeFilters.category !== "all") ? activeFilters.category : undefined,
        page, limit,
        sortBy:   sort?.id, sortDir: sort?.dir,
      })
      if (res.success && res.data) {
        setPosts(res.data.posts)
        setTotal(res.data.pagination?.total ?? res.data.posts.length)
      }
    } finally { setLoading(false) }
  }, [search, activeFilters, page, limit, sort])

  useEffect(() => { loadPosts() }, [loadPosts])

  const setFilter = (id: string, value: string) => { setAF(prev => ({ ...prev, [id]: value })); setPage(1) }

  const handleToggleStatus = async (post: Post) => {
    setToggling(post.id)
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    const res = await apiService.updatePost(post.id, { status: newStatus })
    if (res.success) setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: newStatus } : p))
    setToggling(null)
  }

  const handleDelete = async (post: Post) => {
    if (!confirm(`¿Eliminar "${post.title}"? Esta acción no se puede deshacer.`)) return
    setDeleting(post.id)
    const res = await apiService.deletePost(post.id)
    if (res.success) { setPosts(prev => prev.filter(p => p.id !== post.id)); setTotal(t => t - 1) }
    setDeleting(null)
  }

  const published = posts.filter(p => p.status === 'published').length
  const drafts    = posts.filter(p => p.status === 'draft').length

  const COLUMNS: ColDef<Post>[] = [
    {
      id: "image_url", header: "Imagen",
      cell: post => post.image_url
        ? <img src={post.image_url} alt="" className="h-11 w-16 object-cover rounded" />
        : <div className="h-11 w-16 rounded bg-muted flex items-center justify-center">
            <Leaf className="h-4 w-4 text-muted-foreground/40" />
          </div>,
    },
    {
      id: "title", header: "Título", sortable: true,
      cell: post => (
        <div>
          <p className="font-medium line-clamp-2 text-sm">{post.title}</p>
          {post.author_name && <p className="text-xs text-muted-foreground mt-0.5">{post.author_name}</p>}
        </div>
      ),
    },
    {
      id: "category", header: "Categoría", sortable: true, hideBelow: "sm",
      cell: post => {
        const cfg = CATEGORY_CFG[post.category]
        return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cfg?.cls}`}>{cfg?.label}</span>
      },
    },
    {
      id: "status", header: "Estado", sortable: true, hideBelow: "sm",
      cell: post => {
        const cfg = STATUS_CFG[post.status]
        return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cfg?.cls}`}>{cfg?.label}</span>
      },
    },
    {
      id: "created_at", header: "Fecha", sortable: true, hideBelow: "md",
      cell: post => <span className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(post.created_at)}</span>,
    },
    {
      id: "views", header: "Vistas", sortable: true, align: "right", hideBelow: "lg",
      cell: post => <span className="text-xs text-muted-foreground">{post.views}</span>,
    },
    {
      id: "_actions", header: "",
      cell: post => (
        <div className="flex items-center justify-end gap-0.5">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar"
            onClick={e => { e.stopPropagation(); router.push(`/admin/publicaciones/${post.id}/editar`) }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"
            title={post.status === 'published' ? 'Pasar a borrador' : 'Publicar'}
            disabled={toggling === post.id}
            onClick={e => { e.stopPropagation(); handleToggleStatus(post) }}>
            {toggling === post.id
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : post.status === 'published'
                ? <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                : <Eye className="h-3.5 w-3.5 text-emerald-600" />
            }
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" title="Eliminar"
            disabled={deleting === post.id}
            onClick={e => { e.stopPropagation(); handleDelete(post) }}>
            {deleting === post.id
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Trash2 className="h-3.5 w-3.5" />
            }
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5 p-1">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-emerald-600" />Publicaciones y Servicios
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {published} publicados · {drafts} borradores
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push('/admin/publicaciones/nueva')}>
          <Plus className="h-4 w-4 mr-2" />Nueva publicación
        </Button>
      </div>

      <DataTable<Post>
        data={posts} columns={COLUMNS} getRowId={p => p.id}
        loading={loading}
        pagination={{ page, limit, total, onPageChange: setPage, onLimitChange: p => { setLimit(p); setPage(1) } }}
        search={search} onSearchChange={v => { setSearch(v); setPage(1) }}
        searchPlaceholder="Buscar por título o autor…"
        sort={sort} onSortChange={setSort}
        filters={FILTERS} activeFilters={activeFilters} onFilterChange={setFilter}
        emptyIcon={<Leaf className="h-8 w-8 opacity-40" />}
        emptyTitle="Sin publicaciones" emptyDescription="¡Crea la primera publicación!"
      />
    </div>
  )
}
