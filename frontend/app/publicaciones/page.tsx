"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Eye, Calendar, Tag, ChevronRight, Leaf } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiService } from "@/lib/api"

interface Post {
  id: number
  title: string
  excerpt: string | null
  image_url: string | null
  category: 'publicacion' | 'servicio'
  tags: string | null
  status: string
  views: number
  created_at: string
  author_name: string | null
  author_avatar: string | null
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)     return 'hace un momento'
  if (diff < 3600)   return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400)  return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} días`
  return new Date(dateStr).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

const CATEGORY_META = {
  publicacion: { label: 'Publicación', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  servicio:    { label: 'Servicio',     color: 'bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-300'    },
}

function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const meta = CATEGORY_META[post.category] ?? CATEGORY_META.publicacion

  return (
    <article
      className="group flex flex-col rounded-2xl overflow-hidden border bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={onClick}
    >
      {/* Imagen de portada */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {post.image_url ? (
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-900">
            <Leaf className="h-16 w-16 text-emerald-300 dark:text-emerald-700" />
          </div>
        )}
        {/* Categoría sobre la imagen */}
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${meta.color}`}>
          {meta.label}
        </span>
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <h2 className="font-bold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Tags */}
        {post.tags && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.split(',').slice(0, 3).map(t => (
              <span key={t.trim()} className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                <Tag className="h-2.5 w-2.5" />
                {t.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {/* Autor */}
            <div className="flex items-center gap-1.5">
              {post.author_avatar ? (
                <img src={post.author_avatar} alt={post.author_name || ''} className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-emerald-600">{(post.author_name || 'A')[0].toUpperCase()}</span>
                </div>
              )}
              <span className="font-medium">{post.author_name || 'Admin'}</span>
            </div>
            {/* Fecha */}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {timeAgo(post.created_at)}
            </span>
          </div>
          {/* Vistas */}
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {post.views}
          </span>
        </div>
      </div>

      {/* CTA al hover */}
      <div className="px-5 pb-4">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          Leer más <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </article>
  )
}

export default function PublicacionesPage() {
  const router = useRouter()
  const [posts, setPosts]       = useState<Post[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState<'all' | 'publicacion' | 'servicio'>('all')
  const [page, setPage]         = useState(1)
  const [total, setTotal]       = useState(0)
  const LIMIT = 12

  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await apiService.getPosts({
          category: category === 'all' ? undefined : category,
          search:   search || undefined,
          page,
          limit: LIMIT,
        })
        if (!active) return
        if (res.success && res.data) {
          setPosts(res.data.posts)
          setTotal(res.data.total)
        }
      } finally {
        if (active) setLoading(false)
      }
    }, search ? 400 : 0)
    return () => { active = false; clearTimeout(timer) }
  }, [category, search, page])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-green-700 to-teal-800 py-16 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-12 text-9xl">🌿</div>
          <div className="absolute bottom-4 right-16 text-7xl">🍃</div>
          <div className="absolute top-1/2 left-1/3 text-6xl">🌱</div>
        </div>
        <div className="container relative mx-auto text-center text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
            Publicaciones y Servicios
          </h1>
          <p className="text-emerald-100 text-lg max-w-xl mx-auto">
            Noticias, investigaciones y servicios del Herbario HEAA
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        {/* Barra de búsqueda + filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar publicaciones..."
              className="pl-9"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>

        {/* Tabs de categoría */}
        <div className="flex gap-2 justify-center mb-8 flex-wrap">
          {([
            { key: 'all',        label: 'Todos' },
            { key: 'publicacion', label: 'Publicaciones' },
            { key: 'servicio',    label: 'Servicios' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => { setCategory(tab.key); setPage(1) }}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                category === tab.key
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contador */}
        {!loading && (
          <p className="text-center text-sm text-muted-foreground mb-6">
            {total === 0 ? 'No hay publicaciones' : `${total} publicación${total !== 1 ? 'es' : ''}`}
          </p>
        )}

        {/* Grid feed */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border bg-muted animate-pulse aspect-[3/4]" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <Leaf className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No hay publicaciones disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onClick={() => router.push(`/publicaciones/${post.id}`)}
              />
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
