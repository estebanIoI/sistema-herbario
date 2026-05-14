"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Eye, Calendar, Tag, Leaf, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiService } from "@/lib/api"

interface Post {
  id: number
  title: string
  content: string | null
  excerpt: string | null
  image_url: string | null
  category: 'publicacion' | 'servicio'
  tags: string | null
  views: number
  created_at: string
  updated_at: string
  author_name: string | null
  author_avatar: string | null
}

const CATEGORY_META = {
  publicacion: { label: 'Publicación', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  servicio:    { label: 'Servicio',    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

function renderContent(content: string) {
  return content.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />
    if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-8 mb-3">{line.slice(3)}</h2>
    if (line.startsWith('# '))  return <h1 key={i} className="text-3xl font-bold mt-8 mb-4">{line.slice(2)}</h1>
    if (line.startsWith('- '))  return <li key={i} className="ml-5 list-disc text-foreground/80">{line.slice(2)}</li>
    return <p key={i} className="text-foreground/80 leading-relaxed">{line}</p>
  })
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [post, setPost]       = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    apiService.getPostById(Number(id)).then(res => {
      if (res.success && res.data) setPost(res.data)
      else setError('Publicación no encontrada')
    }).catch(() => setError('Error al cargar la publicación')).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-600 border-t-transparent mx-auto" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Leaf className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground mb-6">{error || 'Publicación no encontrada'}</p>
        <Button variant="outline" onClick={() => router.push('/publicaciones')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
      </div>
    )
  }

  const meta = CATEGORY_META[post.category] ?? CATEGORY_META.publicacion

  return (
    <div className="min-h-screen bg-background">
      {/* Hero image o banner */}
      {post.image_url ? (
        <div className="relative h-72 md:h-96 overflow-hidden">
          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="container mx-auto">
              <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 ${meta.className}`}>
                {meta.label}
              </span>
              <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight max-w-3xl">
                {post.title}
              </h1>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 py-14 px-4">
          <div className="container mx-auto">
            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 ${meta.className}`}>
              {meta.label}
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight max-w-3xl">
              {post.title}
            </h1>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Volver */}
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" onClick={() => router.push('/publicaciones')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Publicaciones
        </Button>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b">
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            {post.author_name || 'Admin'}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(post.created_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {post.views} vistas
          </span>
        </div>

        {/* Excerpt destacado */}
        {post.excerpt && (
          <p className="text-lg text-muted-foreground italic border-l-4 border-emerald-500 pl-4 mb-8 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Contenido */}
        {post.content ? (
          <div className="prose prose-emerald dark:prose-invert max-w-none space-y-3">
            {renderContent(post.content)}
          </div>
        ) : (
          <p className="text-muted-foreground italic">Sin contenido adicional.</p>
        )}

        {/* Tags */}
        {post.tags && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t">
            {post.tags.split(',').map(t => (
              <span key={t.trim()} className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                <Tag className="h-3 w-3" />
                {t.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Volver bottom */}
        <div className="mt-12">
          <Button variant="outline" onClick={() => router.push('/publicaciones')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Ver todas las publicaciones
          </Button>
        </div>
      </div>
    </div>
  )
}
