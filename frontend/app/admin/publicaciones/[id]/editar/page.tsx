"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Newspaper, Save, Eye, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiService } from "@/lib/api"

export default function EditarPublicacionPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm] = useState({
    title:     '',
    excerpt:   '',
    content:   '',
    image_url: '',
    category:  'publicacion',
    tags:      '',
    status:    'draft',
  })

  useEffect(() => {
    apiService.getPostById(Number(id)).then(res => {
      if (res.success && res.data) {
        const p = res.data
        setForm({
          title:     p.title     || '',
          excerpt:   p.excerpt   || '',
          content:   p.content   || '',
          image_url: p.image_url || '',
          category:  p.category  || 'publicacion',
          tags:      p.tags      || '',
          status:    p.status    || 'draft',
        })
      } else {
        setError('Publicación no encontrada')
      }
    }).catch(() => setError('Error al cargar')).finally(() => setLoading(false))
  }, [id])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async (statusOverride?: string) => {
    if (!form.title.trim()) { setError('El título es requerido'); return }
    setSaving(true); setError('')
    try {
      const res = await apiService.updatePost(Number(id), { ...form, status: statusOverride ?? form.status })
      if (res.success) router.push('/admin/publicaciones')
      else setError(res.error || 'Error al guardar')
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-600 border-t-transparent mx-auto" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/publicaciones')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Newspaper className="h-6 w-6 text-emerald-600" /> Editar publicación
        </h1>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm">{error}</div>
      )}

      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Título *</Label>
          <Input id="title" value={form.title} onChange={set('title')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="publicacion">Publicación</SelectItem>
                <SelectItem value="servicio">Servicio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="image_url">URL de imagen de portada</Label>
          <Input id="image_url" placeholder="https://..." value={form.image_url} onChange={set('image_url')} />
          {form.image_url && (
            <img src={form.image_url} alt="preview" className="mt-2 h-40 w-full object-cover rounded-lg border" />
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="excerpt">Extracto</Label>
          <textarea
            id="excerpt"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            value={form.excerpt}
            onChange={set('excerpt')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="content">Contenido</Label>
          <textarea
            id="content"
            rows={14}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y font-mono"
            value={form.content}
            onChange={set('content')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tags">Etiquetas</Label>
          <Input id="tags" placeholder="separadas por comas" value={form.tags} onChange={set('tags')} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button className="bg-emerald-600 hover:bg-emerald-700 flex-1" disabled={saving} onClick={() => handleSave()}>
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <Button variant="outline" disabled={saving} onClick={() => handleSave('published')}>
          <Eye className="h-4 w-4 mr-2" /> Guardar y publicar
        </Button>
      </div>
    </div>
  )
}
