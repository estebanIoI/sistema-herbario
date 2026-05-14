"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, Leaf, Newspaper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

const CATEGORY_LABELS = { publicacion: 'Publicación', servicio: 'Servicio' }
const STATUS_LABELS    = { published: 'Publicado', draft: 'Borrador' }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminPublicacionesPage() {
  const router = useRouter()
  const [posts, setPosts]       = useState<Post[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleting, setDeleting] = useState<number | null>(null)
  const [toggling, setToggling] = useState<number | null>(null)

  const loadPosts = async () => {
    setLoading(true)
    try {
      const res = await apiService.getPosts({
        search:   search || undefined,
        status:   statusFilter === 'all' ? undefined : statusFilter,
        limit:    100,
      })
      if (res.success && res.data) setPosts(res.data.posts)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(loadPosts, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [search, statusFilter])

  const handleToggleStatus = async (post: Post) => {
    setToggling(post.id)
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    const res = await apiService.updatePost(post.id, { status: newStatus })
    if (res.success) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: newStatus } : p))
    }
    setToggling(null)
  }

  const handleDelete = async (post: Post) => {
    if (!confirm(`¿Eliminar "${post.title}"? Esta acción no se puede deshacer.`)) return
    setDeleting(post.id)
    const res = await apiService.deletePost(post.id)
    if (res.success) setPosts(prev => prev.filter(p => p.id !== post.id))
    setDeleting(null)
  }

  const published = posts.filter(p => p.status === 'published').length
  const drafts    = posts.filter(p => p.status === 'draft').length

  return (
    <div className="p-6 space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-emerald-600" />
            Publicaciones y Servicios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {published} publicados · {drafts} borradores
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push('/admin/publicaciones/nueva')}>
          <Plus className="h-4 w-4 mr-2" /> Nueva publicación
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="published">Publicados</SelectItem>
            <SelectItem value="draft">Borradores</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground animate-pulse">Cargando…</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <Leaf className="h-14 w-14 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No hay publicaciones. ¡Crea la primera!</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Imagen</th>
                <th className="px-4 py-3 text-left">Título</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-center">Vistas</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((post, idx) => (
                <tr key={post.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="px-4 py-3">
                    {post.image_url ? (
                      <img src={post.image_url} alt="" className="h-12 w-16 object-cover rounded" />
                    ) : (
                      <div className="h-12 w-16 rounded bg-muted flex items-center justify-center">
                        <Leaf className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-medium line-clamp-2">{post.title}</p>
                    {post.author_name && (
                      <p className="text-xs text-muted-foreground mt-0.5">{post.author_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      post.category === 'publicacion'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    }`}>
                      {CATEGORY_LABELS[post.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      post.status === 'published'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                    }`}>
                      {STATUS_LABELS[post.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(post.created_at)}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    {post.views}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Editar"
                        onClick={() => router.push(`/admin/publicaciones/${post.id}/editar`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={post.status === 'published' ? 'Pasar a borrador' : 'Publicar'}
                        disabled={toggling === post.id}
                        onClick={() => handleToggleStatus(post)}
                      >
                        {post.status === 'published'
                          ? <EyeOff className="h-4 w-4 text-yellow-600" />
                          : <Eye    className="h-4 w-4 text-emerald-600" />
                        }
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-destructive"
                        title="Eliminar"
                        disabled={deleting === post.id}
                        onClick={() => handleDelete(post)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
