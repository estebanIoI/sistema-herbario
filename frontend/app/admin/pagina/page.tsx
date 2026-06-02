"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, Monitor, Megaphone, Layout, Star, Info, Globe, Cloud, CheckCircle2, XCircle, Search, BookOpen, ImageIcon, PanelBottom, Leaf, Link2, Layers, Image as ImageLucide, UploadCloud, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type SettingMap = Record<string, string>

const str = (v: any) => (v === null || v === undefined ? "" : String(v))

export default function PaginaAdminPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<SettingMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [testingCloud, setTestingCloud] = useState(false)
  const [cloudTestResult, setCloudTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [publishedPlants, setPublishedPlants] = useState<Array<{
    id: number; scientific_name: string; common_name?: string; vernacular_name?: string;
    family?: string; department?: string; catalog_number?: string; featured: boolean
  }>>([])
  const [loadingPlants, setLoadingPlants] = useState(false)
  const [plantSearch, setPlantSearch] = useState("")
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingSlide, setUploadingSlide] = useState<number | null>(null)
  const logoFileRef = useRef<HTMLInputElement>(null)
  const slideFileRefs = useRef<(HTMLInputElement | null)[]>([null, null, null])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast({ title: "Tipo de archivo no válido", description: "Usa JPG, PNG, WebP, SVG o GIF", variant: "destructive" })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Archivo muy grande", description: "El logo no debe superar los 5 MB", variant: "destructive" })
      return
    }
    setUploadingLogo(true)
    try {
      const res = await apiService.uploadImage(file, { entityType: 'logo', isTemporary: false })
      if (res.success && res.data?.url) {
        set("logo_image_url", res.data.url)
        toast({ title: "Logo subido", description: "La imagen se subió a Cloudinary correctamente." })
      } else {
        throw new Error(res.error ?? "Error al subir")
      }
    } catch (err: any) {
      toast({ title: "Error al subir el logo", description: err.message, variant: "destructive" })
    } finally {
      setUploadingLogo(false)
      if (logoFileRef.current) logoFileRef.current.value = ""
    }
  }

  const handleSlideUpload = async (n: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast({ title: "Tipo de archivo no válido", description: "Usa JPG, PNG, WebP o GIF", variant: "destructive" })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Archivo muy grande", description: "La imagen no debe superar los 10 MB", variant: "destructive" })
      return
    }
    setUploadingSlide(n)
    try {
      const res = await apiService.uploadImage(file, { entityType: 'hero', isTemporary: false })
      if (res.success && res.data?.url) {
        set(`hero_slide${n}_image`, res.data.url)
        toast({ title: `Imagen ${n} subida`, description: "La imagen se subió a Cloudinary correctamente." })
      } else {
        throw new Error(res.error ?? "Error al subir")
      }
    } catch (err: any) {
      toast({ title: "Error al subir la imagen", description: err.message, variant: "destructive" })
    } finally {
      setUploadingSlide(null)
      const ref = slideFileRefs.current[n - 1]
      if (ref) ref.value = ""
    }
  }

  useEffect(() => {
    apiService.getAllSettings()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const map: SettingMap = {}
          for (const s of res.data) map[s.key_name] = str(s.value)
          setSettings(map)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const set = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const SECTION_NAMES: Record<string, string> = {
    general: 'Información general',
    banner: 'Banner de anuncio',
    hero_text: 'Hero — Texto y botones',
    hero_stats: 'Hero — Contadores de estadísticas',
    hero_image_fit: 'Hero — Presentación de imagen',
    hero_slides: 'Hero — Carrusel de imágenes',
    hero2: 'Publicaciones y Servicios',
    features: 'Sección Características (Hero 3)',
    featured: 'Plantas Destacadas',
    cloudinary: 'Cloudinary',
    logo: 'Logo y marca',
    footer: 'Pie de página',
    about_header: 'Acerca — Encabezado e Historia',
    about_mission: 'Acerca — Misión y Visión',
    about_stats: 'Acerca — Colección',
    about_collections: 'Acerca — Pestaña Colecciones',
    about_research: 'Acerca — Pestaña Investigación',
    about_team: 'Acerca — Equipo',
    about_location: 'Acerca — Ubicación',
    about_partners: 'Acerca — Colaboraciones',
    about_cta: 'Acerca — Llamada a la acción',
  }

  const saveSection = async (sectionId: string, keys: string[]) => {
    setSaving(sectionId)
    setSaved(null)
    try {
      const payload = keys.map((k) => ({ key: k, value: settings[k] ?? "" }))
      const res = await apiService.updateSettings(payload)
      if (res.success) {
        setSaved(sectionId)
        setTimeout(() => setSaved(null), 3000)
        toast({
          title: "✓ Configuración guardada",
          description: `Los cambios de "${SECTION_NAMES[sectionId] ?? sectionId}" se guardaron correctamente.`,
        })
      } else {
        throw new Error(res.error ?? 'Error desconocido')
      }
    } catch (e: any) {
      toast({
        title: "Error al guardar",
        description: e.message ?? "No se pudo guardar la configuración. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setSaving(null)
    }
  }

  const testCloudinary = async () => {
    setTestingCloud(true)
    setCloudTestResult(null)
    try {
      const res = await apiService.testCloudinaryConnection()
      if (res.success && res.data) {
        setCloudTestResult({ ok: res.data.configured, message: res.data.message })
      } else {
        setCloudTestResult({ ok: false, message: res.error ?? "Error al probar la conexión" })
      }
    } catch (e) {
      setCloudTestResult({ ok: false, message: "Error de red" })
    } finally {
      setTestingCloud(false)
    }
  }

  const loadPublishedPlants = useCallback(async () => {
    if (publishedPlants.length > 0) return // ya cargadas
    setLoadingPlants(true)
    try {
      const res = await apiService.getPlants({ status: 'published', limit: 200 })
      if (res.success && res.data?.plants) {
        setPublishedPlants(res.data.plants.map((p: any) => ({
          id: p.id,
          scientific_name: p.scientific_name,
          common_name: p.common_name,
          vernacular_name: p.vernacular_name,
          family: p.family,
          department: p.department || p.state_province,
          catalog_number: p.catalog_number,
          featured: !!p.featured,
        })))
      }
    } catch { /* silently */ }
    finally { setLoadingPlants(false) }
  }, [publishedPlants.length])

  const toggleFeatured = async (id: number, current: boolean) => {
    setTogglingId(id)
    try {
      await apiService.updatePlant(id, { featured: !current })
      setPublishedPlants(prev =>
        prev.map(p => p.id === id ? { ...p, featured: !current } : p)
      )
    } catch { /* silently */ }
    finally { setTogglingId(null) }
  }

  const SaveBtn = ({ sectionId, keys }: { sectionId: string; keys: string[] }) => (
    <Button
      onClick={() => saveSection(sectionId, keys)}
      disabled={saving === sectionId}
      className={`transition-colors ${saved === sectionId ? "bg-green-700 hover:bg-green-700" : "bg-green-600 hover:bg-green-700"}`}
    >
      {saving === sectionId ? (
        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando…</>
      ) : saved === sectionId ? (
        <><CheckCircle2 className="h-4 w-4 mr-2" />¡Guardado!</>
      ) : (
        <><Save className="h-4 w-4 mr-2" />Guardar cambios</>
      )}
    </Button>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Página de inicio</h1>
        <p className="text-muted-foreground">
          Configura el contenido y apariencia de cada sección de la página principal.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="flex items-center gap-1"><Globe className="h-4 w-4" />General</TabsTrigger>
          <TabsTrigger value="banner" className="flex items-center gap-1"><Megaphone className="h-4 w-4" />Banner</TabsTrigger>
          <TabsTrigger value="hero" className="flex items-center gap-1"><Monitor className="h-4 w-4" />Hero 1</TabsTrigger>
          <TabsTrigger value="hero2" className="flex items-center gap-1"><Layers className="h-4 w-4" />Publicaciones</TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-1"><Layout className="h-4 w-4" />Características</TabsTrigger>
          <TabsTrigger value="featured" className="flex items-center gap-1" onClick={loadPublishedPlants}><Star className="h-4 w-4" />Plantas Destacadas</TabsTrigger>
          <TabsTrigger value="cloudinary" className="flex items-center gap-1"><Cloud className="h-4 w-4" />Cloudinary</TabsTrigger>
          <TabsTrigger value="logo" className="flex items-center gap-1"><ImageIcon className="h-4 w-4" />Logo</TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center gap-1"><PanelBottom className="h-4 w-4" />Pie de página</TabsTrigger>
          <TabsTrigger value="acerca" className="flex items-center gap-1"><BookOpen className="h-4 w-4" />Acerca de</TabsTrigger>
          <TabsTrigger value="login" className="flex items-center gap-1"><ImageLucide className="h-4 w-4" />Login</TabsTrigger>
        </TabsList>

        {/* ── GENERAL ──────────────────────────────────────────────────────── */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Información general del herbario</CardTitle>
              <CardDescription>Nombre del sitio, institución y datos de contacto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Nombre del sitio" id="site_name">
                <Input id="site_name" value={str(settings.site_name)} onChange={(e) => set("site_name", e.target.value)} />
              </Field>
              <Field label="Descripción del sitio" id="site_description">
                <Textarea id="site_description" rows={3} value={str(settings.site_description)} onChange={(e) => set("site_description", e.target.value)} />
              </Field>
              <Field label="Nombre de la institución" id="institution_name">
                <Input id="institution_name" value={str(settings.institution_name)} onChange={(e) => set("institution_name", e.target.value)} />
              </Field>
              <Field label="Código del herbario" id="herbarium_code">
                <Input id="herbarium_code" value={str(settings.herbarium_code)} onChange={(e) => set("herbarium_code", e.target.value)} />
              </Field>
              <Field label="Email de contacto" id="contact_email">
                <Input id="contact_email" type="email" value={str(settings.contact_email)} onChange={(e) => set("contact_email", e.target.value)} />
              </Field>
              <Field label="Dirección" id="institution_address">
                <Input id="institution_address" value={str(settings.institution_address)} onChange={(e) => set("institution_address", e.target.value)} />
              </Field>
              <Field label="Teléfono" id="institution_phone">
                <Input id="institution_phone" value={str(settings.institution_phone)} onChange={(e) => set("institution_phone", e.target.value)} />
              </Field>

              {/* Logo del header */}
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-green-600" />
                  Logo del encabezado
                </p>

                {/* Vista previa grande — solo el logo */}
                <div className="flex justify-center">
                  <div className="relative h-32 w-32 rounded-xl border-2 border-dashed border-border bg-background flex items-center justify-center overflow-hidden">
                    {settings.logo_image_url ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={str(settings.logo_image_url)}
                          alt="Logo"
                          className="h-full w-full object-contain p-3"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => set("logo_image_url", "")}
                          className="absolute top-1 right-1 rounded-full bg-background/80 p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                          title="Quitar logo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <Leaf className="h-14 w-14 text-green-600 opacity-50" />
                    )}
                  </div>
                </div>
                {!settings.logo_image_url && (
                  <p className="text-xs text-center text-muted-foreground -mt-2">Sin logo — se mostrará la hojita verde</p>
                )}

                {/* Subir imagen a Cloudinary */}
                <div className="space-y-1.5">
                  <Label>Subir imagen del logo</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={uploadingLogo}
                      onClick={() => logoFileRef.current?.click()}
                    >
                      {uploadingLogo
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Subiendo…</>
                        : <><UploadCloud className="h-4 w-4 mr-2" />Subir a Cloudinary</>
                      }
                    </Button>
                    <input
                      ref={logoFileRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,image/gif"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WebP, SVG o GIF · máx. 5 MB</p>
                </div>

                {/* URL manual */}
                <Field
                  label="O pega la URL del logo"
                  id="logo_image_url_general"
                  hint="También puedes pegar directamente una URL externa"
                >
                  <Input
                    id="logo_image_url_general"
                    placeholder="https://... o /logo.png"
                    value={str(settings.logo_image_url)}
                    onChange={(e) => set("logo_image_url", e.target.value)}
                  />
                </Field>

                {/* Texto editable del logo */}
                <Field
                  label="Texto junto al logo"
                  id="logo_text_general"
                  hint="Texto que aparece al lado del logo en el header. Vacío = sin texto"
                >
                  <Input
                    id="logo_text_general"
                    placeholder="Ej: Herbario Digital"
                    value={str(settings.logo_text)}
                    onChange={(e) => set("logo_text", e.target.value)}
                  />
                </Field>
              </div>

              <div className="pt-2">
                <SaveBtn sectionId="general" keys={["site_name","site_description","institution_name","herbarium_code","contact_email","institution_address","institution_phone","logo_image_url","logo_text"]} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── BANNER ───────────────────────────────────────────────────────── */}
        <TabsContent value="banner">
          <Card>
            <CardHeader>
              <CardTitle>Banner de anuncio</CardTitle>
              <CardDescription>Banda informativa que aparece al inicio de la página principal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="banner_enabled"
                  checked={settings.banner_enabled === "true"}
                  onCheckedChange={(v) => set("banner_enabled", String(v))}
                />
                <Label htmlFor="banner_enabled">Mostrar banner</Label>
              </div>

              <Field label="Texto del banner" id="banner_text">
                <Input
                  id="banner_text"
                  placeholder="Ej: ¡Nueva colección de Orquídeas disponible!"
                  value={str(settings.banner_text)}
                  onChange={(e) => set("banner_text", e.target.value)}
                />
              </Field>

              <Field label="Tipo / color" id="banner_type">
                <Select value={str(settings.banner_type) || "info"} onValueChange={(v) => set("banner_type", v)}>
                  <SelectTrigger id="banner_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Información (azul)</SelectItem>
                    <SelectItem value="success">Éxito (verde)</SelectItem>
                    <SelectItem value="warning">Advertencia (amarillo)</SelectItem>
                    <SelectItem value="error">Error (rojo)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="URL enlazada (opcional)" id="banner_link">
                <Input
                  id="banner_link"
                  placeholder="/plantas o https://..."
                  value={str(settings.banner_link)}
                  onChange={(e) => set("banner_link", e.target.value)}
                />
              </Field>

              {/* Vista previa del banner */}
              {settings.banner_enabled === "true" && settings.banner_text && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-2">Vista previa:</p>
                  <BannerPreview type={str(settings.banner_type)} text={str(settings.banner_text)} link={str(settings.banner_link)} />
                </div>
              )}

              <div className="pt-2">
                <SaveBtn sectionId="banner" keys={["banner_enabled","banner_text","banner_type","banner_link"]} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── HERO 1 ────────────────────────────────────────────────────────── */}
        <TabsContent value="hero">
          <div className="space-y-4">

            {/* Texto y botones */}
            <Card>
              <CardHeader>
                <CardTitle>Texto y botones</CardTitle>
                <CardDescription>Título, subtítulo y botones de acción que aparecen sobre el carrusel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Título principal" id="hero_title">
                  <Input id="hero_title" value={str(settings.hero_title)} onChange={(e) => set("hero_title", e.target.value)} />
                </Field>
                <Field label="Subtítulo / descripción" id="hero_subtitle">
                  <Textarea id="hero_subtitle" rows={3} value={str(settings.hero_subtitle)} onChange={(e) => set("hero_subtitle", e.target.value)} />
                </Field>
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <p className="text-sm font-medium">Botón principal (CTA 1)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Texto" id="hero_cta1_text">
                      <Input id="hero_cta1_text" value={str(settings.hero_cta1_text)} onChange={(e) => set("hero_cta1_text", e.target.value)} />
                    </Field>
                    <Field label="URL" id="hero_cta1_url">
                      <Input id="hero_cta1_url" value={str(settings.hero_cta1_url)} onChange={(e) => set("hero_cta1_url", e.target.value)} />
                    </Field>
                  </div>
                </div>
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <p className="text-sm font-medium">Botón secundario (CTA 2)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Texto" id="hero_cta2_text">
                      <Input id="hero_cta2_text" value={str(settings.hero_cta2_text)} onChange={(e) => set("hero_cta2_text", e.target.value)} />
                    </Field>
                    <Field label="URL" id="hero_cta2_url">
                      <Input id="hero_cta2_url" value={str(settings.hero_cta2_url)} onChange={(e) => set("hero_cta2_url", e.target.value)} />
                    </Field>
                  </div>
                </div>
                <div className="pt-2">
                  <SaveBtn sectionId="hero_text" keys={["hero_title","hero_subtitle","hero_cta1_text","hero_cta1_url","hero_cta2_text","hero_cta2_url"]} />
                </div>
              </CardContent>
            </Card>

            {/* Contadores de estadísticas */}
            <Card>
              <CardHeader>
                <CardTitle>Contadores de estadísticas</CardTitle>
                <CardDescription>
                  Muestra u oculta los contadores de Plantas, Familias y Géneros que aparecen debajo del subtítulo del hero
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    id="hero_stats_enabled"
                    checked={settings.hero_stats_enabled !== "false"}
                    onCheckedChange={(v) => set("hero_stats_enabled", String(v))}
                  />
                  <Label htmlFor="hero_stats_enabled">
                    {settings.hero_stats_enabled !== "false" ? "Contadores visibles" : "Contadores ocultos"}
                  </Label>
                </div>
                {settings.hero_stats_enabled !== "false" && (
                  <div className="flex gap-6 p-4 rounded-lg bg-green-900/20 border border-green-800/30">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-300">N</p>
                      <p className="text-xs text-green-400">Plantas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-300">N</p>
                      <p className="text-xs text-green-400">Familias</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-300">N</p>
                      <p className="text-xs text-green-400">Géneros</p>
                    </div>
                  </div>
                )}
                <div className="pt-2">
                  <SaveBtn sectionId="hero_stats" keys={["hero_stats_enabled"]} />
                </div>
              </CardContent>
            </Card>

            {/* Ajuste de imagen */}
            <Card>
              <CardHeader>
                <CardTitle>Presentación de la imagen</CardTitle>
                <CardDescription>
                  Define cómo se muestra la imagen del carrusel en el hero (aplica solo en pantallas medianas y grandes)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Opción: Expandida (cover) */}
                  <button
                    type="button"
                    onClick={() => set("hero_image_fit", "cover")}
                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                      (settings.hero_image_fit ?? "cover") === "cover"
                        ? "border-green-600 bg-green-50"
                        : "border-muted hover:border-green-400"
                    }`}
                  >
                    <div className="h-16 rounded bg-gradient-to-r from-green-800 to-green-600 mb-3 overflow-hidden relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-full bg-green-700 opacity-60" />
                        <span className="absolute text-[10px] text-white font-medium">imagen cubre todo</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium">Expandida</p>
                    <p className="text-xs text-muted-foreground">La imagen se recorta para cubrir toda la sección</p>
                  </button>

                  {/* Opción: Enmarcada (contain) */}
                  <button
                    type="button"
                    onClick={() => set("hero_image_fit", "contain")}
                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                      settings.hero_image_fit === "contain"
                        ? "border-green-600 bg-green-50"
                        : "border-muted hover:border-green-400"
                    }`}
                  >
                    <div className="h-16 rounded bg-green-950 mb-3 flex items-center justify-center overflow-hidden">
                      <div className="h-12 w-24 bg-green-700 rounded flex items-center justify-center">
                        <span className="text-[10px] text-white font-medium">imagen completa</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium">Enmarcada</p>
                    <p className="text-xs text-muted-foreground">La imagen se muestra completa; el contenedor se adapta a su tamaño</p>
                  </button>
                </div>
                <div className="pt-2">
                  <SaveBtn sectionId="hero_image_fit" keys={["hero_image_fit"]} />
                </div>
              </CardContent>
            </Card>

            {/* Carrusel de imágenes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageLucide className="h-4 w-4" />
                  Carrusel de imágenes
                </CardTitle>
                <CardDescription>
                  Configura hasta 3 imágenes que rotan automáticamente. Con una sola imagen no aparece la navegación.
                  El contenedor se adapta a la altura natural de la imagen sin recortarla.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Intervalo de rotación" id="hero_slide_interval" hint="Segundos entre cada imagen (mínimo 2)">
                  <Input
                    id="hero_slide_interval"
                    type="number"
                    min={2}
                    max={60}
                    placeholder="5"
                    value={str(settings.hero_slide_interval)}
                    onChange={(e) => set("hero_slide_interval", e.target.value)}
                    className="max-w-[140px]"
                  />
                </Field>

                {[1, 2, 3].map((n) => (
                  <div key={n} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">{n}</span>
                      <p className="text-sm font-semibold">
                        Imagen {n}{n === 1 ? " (principal)" : " (opcional)"}
                      </p>
                    </div>

                    {/* Vista previa + botón quitar */}
                    {settings[`hero_slide${n}_image`] ? (
                      <div className="relative rounded-md overflow-hidden border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={str(settings[`hero_slide${n}_image`])}
                          alt={`Vista previa slide ${n}`}
                          className="w-full h-36 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => set(`hero_slide${n}_image`, "")}
                          className="absolute top-1.5 right-1.5 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-destructive transition-colors"
                          title="Quitar imagen"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-md border-2 border-dashed border-border bg-background h-36 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <ImageLucide className="h-8 w-8 opacity-30" />
                        <p className="text-xs">{n === 1 ? "Sin imagen — el hero usará fondo degradado" : "Slide vacío — no se mostrará"}</p>
                      </div>
                    )}

                    {/* Subir a Cloudinary */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Subir imagen</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={uploadingSlide === n}
                          onClick={() => slideFileRefs.current[n - 1]?.click()}
                        >
                          {uploadingSlide === n
                            ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Subiendo…</>
                            : <><UploadCloud className="h-3.5 w-3.5 mr-1.5" />Subir a Cloudinary</>
                          }
                        </Button>
                        <input
                          ref={(el) => { slideFileRefs.current[n - 1] = el }}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(e) => handleSlideUpload(n, e)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">JPG, PNG, WebP o GIF · máx. 10 MB</p>
                    </div>

                    <Field label="O pega la URL de la imagen" id={`hero_slide${n}_image`} hint={n === 1 ? "Si se deja vacía, el hero muestra un fondo degradado" : "Deja vacío para no usar este slide"}>
                      <Input
                        id={`hero_slide${n}_image`}
                        placeholder="https://... o /imagen.jpg"
                        value={str(settings[`hero_slide${n}_image`])}
                        onChange={(e) => set(`hero_slide${n}_image`, e.target.value)}
                      />
                    </Field>
                    <Field label="URL de redirección al hacer clic" id={`hero_slide${n}_url`} hint="Vacío = la imagen no es clickeable">
                      <Input
                        id={`hero_slide${n}_url`}
                        placeholder="/plantas o https://..."
                        value={str(settings[`hero_slide${n}_url`])}
                        onChange={(e) => set(`hero_slide${n}_url`, e.target.value)}
                      />
                    </Field>
                  </div>
                ))}

                <div className="pt-2">
                  <SaveBtn sectionId="hero_slides" keys={[
                    "hero_slide_interval",
                    "hero_slide1_image","hero_slide1_url",
                    "hero_slide2_image","hero_slide2_url",
                    "hero_slide3_image","hero_slide3_url",
                    "hero_bg_image",
                  ]} />
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ── HERO 2: PUBLICACIONES / SERVICIOS ────────────────────────────── */}
        <TabsContent value="hero2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Publicaciones y Servicios
              </CardTitle>
              <CardDescription>
                Carrusel que aparece entre el hero de imágenes y la sección de características.
                Configura hasta 4 tarjetas con publicaciones, servicios o noticias del herbario.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              <div className="flex items-center gap-3">
                <Switch
                  id="hero2_enabled"
                  checked={settings.hero2_enabled !== "false"}
                  onCheckedChange={(v) => set("hero2_enabled", String(v))}
                />
                <Label htmlFor="hero2_enabled">Mostrar sección</Label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Título de la sección" id="hero2_title">
                  <Input
                    id="hero2_title"
                    placeholder="Publicaciones y Servicios"
                    value={str(settings.hero2_title)}
                    onChange={(e) => set("hero2_title", e.target.value)}
                  />
                </Field>
                <Field label="Intervalo de rotación" id="hero2_interval" hint="Segundos entre tarjetas (mínimo 2)">
                  <Input
                    id="hero2_interval"
                    type="number"
                    min={2}
                    max={60}
                    placeholder="4"
                    value={str(settings.hero2_interval)}
                    onChange={(e) => set("hero2_interval", e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Subtítulo (opcional)" id="hero2_subtitle">
                <Input
                  id="hero2_subtitle"
                  placeholder="Descripción breve de la sección…"
                  value={str(settings.hero2_subtitle)}
                  onChange={(e) => set("hero2_subtitle", e.target.value)}
                />
              </Field>

              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">{n}</span>
                    <p className="text-sm font-semibold">Tarjeta {n}{n > 2 ? " (opcional)" : ""}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Etiqueta / Badge" id={`hero2_item${n}_badge`} hint={`Ej: Publicación, Servicio, Noticia`}>
                      <Input
                        id={`hero2_item${n}_badge`}
                        placeholder="Publicación"
                        value={str(settings[`hero2_item${n}_badge`])}
                        onChange={(e) => set(`hero2_item${n}_badge`, e.target.value)}
                      />
                    </Field>
                    <Field label="URL de redirección" id={`hero2_item${n}_url`} hint="Vacío = sin enlace">
                      <Input
                        id={`hero2_item${n}_url`}
                        placeholder="/publicaciones/1 o https://..."
                        value={str(settings[`hero2_item${n}_url`])}
                        onChange={(e) => set(`hero2_item${n}_url`, e.target.value)}
                      />
                    </Field>
                  </div>

                  <Field label="Título" id={`hero2_item${n}_title`}>
                    <Input
                      id={`hero2_item${n}_title`}
                      placeholder="Título de la publicación o servicio"
                      value={str(settings[`hero2_item${n}_title`])}
                      onChange={(e) => set(`hero2_item${n}_title`, e.target.value)}
                    />
                  </Field>

                  <Field label="Descripción" id={`hero2_item${n}_desc`}>
                    <Textarea
                      id={`hero2_item${n}_desc`}
                      rows={3}
                      placeholder="Descripción breve…"
                      value={str(settings[`hero2_item${n}_desc`])}
                      onChange={(e) => set(`hero2_item${n}_desc`, e.target.value)}
                    />
                  </Field>

                  <Field label="URL de imagen" id={`hero2_item${n}_image`} hint="Vacío = tarjeta sin imagen">
                    <Input
                      id={`hero2_item${n}_image`}
                      placeholder="https://..."
                      value={str(settings[`hero2_item${n}_image`])}
                      onChange={(e) => set(`hero2_item${n}_image`, e.target.value)}
                    />
                  </Field>

                  {settings[`hero2_item${n}_image`] && (
                    <div className="rounded-md overflow-hidden border h-24 bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={str(settings[`hero2_item${n}_image`])}
                        alt={`Vista previa tarjeta ${n}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-2">
                <SaveBtn sectionId="hero2" keys={[
                  "hero2_enabled","hero2_title","hero2_subtitle","hero2_interval",
                  "hero2_item1_badge","hero2_item1_title","hero2_item1_desc","hero2_item1_image","hero2_item1_url",
                  "hero2_item2_badge","hero2_item2_title","hero2_item2_desc","hero2_item2_image","hero2_item2_url",
                  "hero2_item3_badge","hero2_item3_title","hero2_item3_desc","hero2_item3_image","hero2_item3_url",
                  "hero2_item4_badge","hero2_item4_title","hero2_item4_desc","hero2_item4_image","hero2_item4_url",
                ]} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CARACTERÍSTICAS ──────────────────────────────────────────────── */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Sección de Características</CardTitle>
              <CardDescription>Las tres tarjetas informativas bajo el hero</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3">
                <Switch
                  id="features_enabled"
                  checked={settings.features_enabled !== "false"}
                  onCheckedChange={(v) => set("features_enabled", String(v))}
                />
                <Label htmlFor="features_enabled">Mostrar sección</Label>
              </div>

              <Field label="Título de la sección" id="features_title">
                <Input id="features_title" value={str(settings.features_title)} onChange={(e) => set("features_title", e.target.value)} />
              </Field>
              <Field label="Subtítulo de la sección" id="features_subtitle">
                <Textarea id="features_subtitle" rows={2} value={str(settings.features_subtitle)} onChange={(e) => set("features_subtitle", e.target.value)} />
              </Field>
              <Field label="Imagen de fondo (Hero 2)" id="features_bg_image" hint="Opcional. Deja vacío para mostrar la sección con fondo claro sin imagen.">
                <Input id="features_bg_image" placeholder="https://..." value={str(settings.features_bg_image)} onChange={(e) => set("features_bg_image", e.target.value)} />
              </Field>

              {[1, 2, 3].map((n) => (
                <div key={n} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <p className="text-sm font-semibold">Tarjeta {n}</p>
                  <Field label="Título" id={`feature${n}_title`}>
                    <Input id={`feature${n}_title`} value={str(settings[`feature${n}_title`])} onChange={(e) => set(`feature${n}_title`, e.target.value)} />
                  </Field>
                  <Field label="Descripción" id={`feature${n}_description`}>
                    <Textarea id={`feature${n}_description`} rows={2} value={str(settings[`feature${n}_description`])} onChange={(e) => set(`feature${n}_description`, e.target.value)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Icono (nombre Lucide)" id={`feature${n}_icon`} hint="Ej: Leaf, Search, Database, Star, Globe">
                      <Input id={`feature${n}_icon`} value={str(settings[`feature${n}_icon`])} onChange={(e) => set(`feature${n}_icon`, e.target.value)} />
                    </Field>
                    <Field label="URL de redirección" id={`feature${n}_url`} hint="Vacío = tarjeta sin enlace">
                      <Input id={`feature${n}_url`} placeholder="/plantas o https://..." value={str(settings[`feature${n}_url`])} onChange={(e) => set(`feature${n}_url`, e.target.value)} />
                    </Field>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <SaveBtn sectionId="features" keys={[
                  "features_enabled","features_title","features_subtitle","features_bg_image",
                  "feature1_icon","feature1_title","feature1_description","feature1_url",
                  "feature2_icon","feature2_title","feature2_description","feature2_url",
                  "feature3_icon","feature3_title","feature3_description","feature3_url",
                ]} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PLANTAS DESTACADAS ────────────────────────────────────────────── */}
        <TabsContent value="featured" className="space-y-4">
          {/* Configuración de la sección */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de la sección</CardTitle>
              <CardDescription>Controla cómo se muestra la cuadrícula en la página de inicio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="featured_enabled"
                  checked={settings.featured_enabled !== "false"}
                  onCheckedChange={(v) => set("featured_enabled", String(v))}
                />
                <Label htmlFor="featured_enabled">Mostrar sección</Label>
              </div>
              <Field label="Título de la sección" id="featured_section_title">
                <Input id="featured_section_title" value={str(settings.featured_section_title)} onChange={(e) => set("featured_section_title", e.target.value)} />
              </Field>
              <Field label="Número de plantas a mostrar" id="featured_plants_count" hint="Recomendado: 3 o 6">
                <Input
                  id="featured_plants_count"
                  type="number" min={1} max={12}
                  value={str(settings.featured_plants_count)}
                  onChange={(e) => set("featured_plants_count", e.target.value)}
                />
              </Field>
              <div className="pt-2">
                <SaveBtn sectionId="featured" keys={["featured_enabled","featured_section_title","featured_plants_count"]} />
              </div>
            </CardContent>
          </Card>

          {/* Selector de plantas destacadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Plantas publicadas</span>
                {publishedPlants.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 mr-2">
                      {publishedPlants.filter(p => p.featured).length} destacadas
                    </Badge>
                    {publishedPlants.length} publicadas
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Activa la estrella ★ en cada espécimen para marcarlo como destacado en la página de inicio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPlants ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : publishedPlants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BookOpen className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No hay plantas publicadas</p>
                  <p className="text-xs mt-1">Publica especímenes desde el módulo de Plantas para poder destacarlos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Buscador */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre, familia o departamento…"
                      className="pl-8 h-9 text-sm"
                      value={plantSearch}
                      onChange={e => setPlantSearch(e.target.value)}
                    />
                  </div>

                  {/* Grid de plantas */}
                  <ScrollArea className="h-[420px] pr-2">
                    {(() => {
                      const q = plantSearch.toLowerCase()
                      const filtered = publishedPlants.filter(p =>
                        !q ||
                        p.scientific_name.toLowerCase().includes(q) ||
                        (p.common_name ?? "").toLowerCase().includes(q) ||
                        (p.vernacular_name ?? "").toLowerCase().includes(q) ||
                        (p.family ?? "").toLowerCase().includes(q) ||
                        (p.department ?? "").toLowerCase().includes(q)
                      )
                      if (filtered.length === 0) return (
                        <p className="text-center py-8 text-sm text-muted-foreground">Sin resultados para "{plantSearch}"</p>
                      )
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {filtered.map(plant => (
                            <button
                              key={plant.id}
                              onClick={() => toggleFeatured(plant.id, plant.featured)}
                              disabled={togglingId === plant.id}
                              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors w-full ${
                                plant.featured
                                  ? "border-amber-300 bg-amber-50 hover:bg-amber-100"
                                  : "border-border bg-card hover:bg-muted/50"
                              }`}
                            >
                              <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
                                {togglingId === plant.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : (
                                  <Star className={`h-5 w-5 transition-colors ${plant.featured ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40 hover:text-amber-300"}`} />
                                )}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm italic font-medium truncate leading-tight">
                                  {plant.scientific_name}
                                </p>
                                {(plant.common_name || plant.vernacular_name) && (
                                  <p className="text-xs text-muted-foreground truncate not-italic">
                                    {plant.common_name || plant.vernacular_name}
                                  </p>
                                )}
                                <div className="flex gap-2 mt-0.5 flex-wrap">
                                  {plant.family && (
                                    <span className="text-[10px] text-muted-foreground">{plant.family}</span>
                                  )}
                                  {plant.department && (
                                    <span className="text-[10px] text-muted-foreground">· {plant.department}</span>
                                  )}
                                </div>
                              </div>
                              {plant.featured && (
                                <Badge variant="outline" className="flex-shrink-0 text-[10px] text-amber-700 border-amber-200 bg-amber-50 h-5 px-1.5">
                                  Destacada
                                </Badge>
                              )}
                            </button>
                          ))}
                        </div>
                      )
                    })()}
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* ── CLOUDINARY ───────────────────────────────────────────────────── */}
        <TabsContent value="cloudinary">
          <Card>
            <CardHeader>
              <CardTitle>Credenciales de Cloudinary</CardTitle>
              <CardDescription>
                Configura tu cuenta de Cloudinary para gestionar el almacenamiento de imágenes del herbario.
                Estas credenciales son privadas y nunca se exponen al público.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/30 flex items-start gap-3">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Obtén tus credenciales en{" "}
                  <strong>cloudinary.com → Settings → API Keys</strong>.
                  Si los campos están vacíos, se usarán las variables de entorno del servidor como respaldo.
                </p>
              </div>

              <Field label="Cloud Name" id="cloudinary_cloud_name">
                <Input
                  id="cloudinary_cloud_name"
                  placeholder="ej: djhhtzcwu"
                  value={str(settings.cloudinary_cloud_name)}
                  onChange={(e) => set("cloudinary_cloud_name", e.target.value)}
                />
              </Field>

              <Field label="API Key" id="cloudinary_api_key">
                <Input
                  id="cloudinary_api_key"
                  placeholder="ej: 168734666324739"
                  value={str(settings.cloudinary_api_key)}
                  onChange={(e) => set("cloudinary_api_key", e.target.value)}
                />
              </Field>

              <Field label="API Secret" id="cloudinary_api_secret" hint="Nunca se muestra en texto claro una vez guardado">
                <Input
                  id="cloudinary_api_secret"
                  type="password"
                  placeholder={settings.cloudinary_api_secret ? "••••••••" : "Ingresa el API Secret"}
                  value={str(settings.cloudinary_api_secret)}
                  onChange={(e) => set("cloudinary_api_secret", e.target.value)}
                />
              </Field>

              <Field label="Carpeta base" id="cloudinary_folder" hint="Subcarpeta raíz donde se guardarán las imágenes">
                <Input
                  id="cloudinary_folder"
                  placeholder="herbario"
                  value={str(settings.cloudinary_folder)}
                  onChange={(e) => set("cloudinary_folder", e.target.value)}
                />
              </Field>

              {/* Resultado del test */}
              {cloudTestResult && (
                <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                  cloudTestResult.ok
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}>
                  {cloudTestResult.ok
                    ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    : <XCircle className="h-4 w-4 flex-shrink-0" />
                  }
                  {cloudTestResult.message}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={testCloudinary}
                  disabled={testingCloud}
                >
                  {testingCloud
                    ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    : <Cloud className="h-4 w-4 mr-2" />
                  }
                  {testingCloud ? "Probando…" : "Probar conexión"}
                </Button>
                <SaveBtn
                  sectionId="cloudinary"
                  keys={["cloudinary_cloud_name", "cloudinary_api_key", "cloudinary_api_secret", "cloudinary_folder"]}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* ── LOGO ─────────────────────────────────────────────────────────── */}
        <TabsContent value="logo">
          <Card>
            <CardHeader>
              <CardTitle>Logo y marca</CardTitle>
              <CardDescription>
                Nombre del sitio que aparece en la barra de navegación y en el pie de página.
                Opcionalmente puedes usar una imagen como logo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Texto del logo / nombre del sitio" id="logo_text">
                <Input
                  id="logo_text"
                  placeholder="Ej: Herbario Digital"
                  value={str(settings.logo_text)}
                  onChange={(e) => set("logo_text", e.target.value)}
                />
              </Field>

              <Field
                label="URL de imagen del logo (opcional)"
                id="logo_image_url"
                hint="Si se deja vacío se usará el ícono de hoja verde por defecto"
              >
                <Input
                  id="logo_image_url"
                  placeholder="https://... o /logo.png"
                  value={str(settings.logo_image_url)}
                  onChange={(e) => set("logo_image_url", e.target.value)}
                />
              </Field>

              {/* Vista previa del logo */}
              <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
                <p className="text-xs text-muted-foreground">Vista previa del logo:</p>
                <div className="flex items-center gap-2">
                  {settings.logo_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={str(settings.logo_image_url)}
                      alt="Logo"
                      className="h-8 w-8 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <Leaf className="h-6 w-6 text-green-600" />
                  )}
                  <span className="text-xl font-bold">
                    {str(settings.logo_text) || "Herbario Digital"}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <SaveBtn sectionId="logo" keys={["logo_text", "logo_image_url"]} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PIE DE PÁGINA ────────────────────────────────────────────────── */}
        <TabsContent value="footer">
          <div className="space-y-4">
            {/* Texto general */}
            <Card>
              <CardHeader>
                <CardTitle>Texto general</CardTitle>
                <CardDescription>Descripción y copyright que aparecen en el pie de página</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Descripción breve" id="footer_description">
                  <Textarea
                    id="footer_description"
                    rows={2}
                    value={str(settings.footer_description)}
                    onChange={(e) => set("footer_description", e.target.value)}
                  />
                </Field>
                <Field label="Texto de copyright" id="footer_copyright" hint="Se mostrará con el año actual antes del texto">
                  <Input
                    id="footer_copyright"
                    value={str(settings.footer_copyright)}
                    onChange={(e) => set("footer_copyright", e.target.value)}
                  />
                </Field>
                <div className="pt-2">
                  <SaveBtn sectionId="footer" keys={[
                    "footer_description", "footer_copyright",
                    "footer_col1_title",
                    "footer_col1_link1_text", "footer_col1_link1_url",
                    "footer_col1_link2_text", "footer_col1_link2_url",
                    "footer_col1_link3_text", "footer_col1_link3_url",
                    "footer_col2_title",
                    "footer_col2_link1_text", "footer_col2_link1_url",
                    "footer_col2_link2_text", "footer_col2_link2_url",
                    "footer_col2_link3_text", "footer_col2_link3_url",
                    "footer_col3_title",
                    "footer_col3_link1_text", "footer_col3_link1_url",
                    "footer_col3_link2_text", "footer_col3_link2_url",
                    "footer_col3_link3_text", "footer_col3_link3_url",
                  ]} />
                </div>
              </CardContent>
            </Card>

            {/* Columnas del footer */}
            {([1, 2, 3] as const).map((col) => (
              <Card key={col}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Columna {col}
                  </CardTitle>
                  <CardDescription>
                    Sección de enlaces de la columna {col} del pie de página
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Título de la columna" id={`footer_col${col}_title`}>
                    <Input
                      id={`footer_col${col}_title`}
                      value={str(settings[`footer_col${col}_title`])}
                      onChange={(e) => set(`footer_col${col}_title`, e.target.value)}
                    />
                  </Field>
                  {([1, 2, 3] as const).map((link) => (
                    <div key={link} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                      <p className="text-sm font-medium text-muted-foreground">Enlace {link}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Texto" id={`footer_col${col}_link${link}_text`}>
                          <Input
                            id={`footer_col${col}_link${link}_text`}
                            placeholder="Ej: Catálogo de Plantas"
                            value={str(settings[`footer_col${col}_link${link}_text`])}
                            onChange={(e) => set(`footer_col${col}_link${link}_text`, e.target.value)}
                          />
                        </Field>
                        <Field
                          label="URL"
                          id={`footer_col${col}_link${link}_url`}
                          hint={link > 1 ? "Vacío = texto plano sin enlace" : undefined}
                        >
                          <Input
                            id={`footer_col${col}_link${link}_url`}
                            placeholder="/ruta o https://..."
                            value={str(settings[`footer_col${col}_link${link}_url`])}
                            onChange={(e) => set(`footer_col${col}_link${link}_url`, e.target.value)}
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        {/* ── ACERCA DE ────────────────────────────────────────────────────── */}
        <TabsContent value="acerca">
          <div className="space-y-4">

            {/* Encabezado e Historia */}
            <Card>
              <CardHeader>
                <CardTitle>Encabezado e Historia</CardTitle>
                <CardDescription>Título, subtítulo y sección narrativa de la página "Acerca de"</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Título principal" id="about_title">
                    <Input id="about_title" value={str(settings.about_title)} onChange={e => set("about_title", e.target.value)} />
                  </Field>
                  <Field label="Subtítulo" id="about_subtitle">
                    <Input id="about_subtitle" value={str(settings.about_subtitle)} onChange={e => set("about_subtitle", e.target.value)} />
                  </Field>
                </div>
                <Field label="URL imagen sección Historia" id="about_history_image" hint="Imagen que aparece al lado del texto de historia">
                  <Input id="about_history_image" placeholder="https://..." value={str(settings.about_history_image)} onChange={e => set("about_history_image", e.target.value)} />
                </Field>
                <Field label="Título sección Historia" id="about_history_title">
                  <Input id="about_history_title" value={str(settings.about_history_title)} onChange={e => set("about_history_title", e.target.value)} />
                </Field>
                <Field label="Párrafo 1" id="about_history_p1">
                  <Textarea id="about_history_p1" rows={3} value={str(settings.about_history_p1)} onChange={e => set("about_history_p1", e.target.value)} />
                </Field>
                <Field label="Párrafo 2" id="about_history_p2">
                  <Textarea id="about_history_p2" rows={3} value={str(settings.about_history_p2)} onChange={e => set("about_history_p2", e.target.value)} />
                </Field>
                <Field label="Párrafo 3" id="about_history_p3">
                  <Textarea id="about_history_p3" rows={3} value={str(settings.about_history_p3)} onChange={e => set("about_history_p3", e.target.value)} />
                </Field>
                <div className="pt-2">
                  <SaveBtn sectionId="about_header" keys={["about_title","about_subtitle","about_history_image","about_history_title","about_history_p1","about_history_p2","about_history_p3"]} />
                </div>
              </CardContent>
            </Card>

            {/* Misión y Visión */}
            <Card>
              <CardHeader>
                <CardTitle>Misión y Visión</CardTitle>
                <CardDescription>Textos de la misión y visión institucional</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Misión" id="about_mission_text">
                  <Textarea id="about_mission_text" rows={4} value={str(settings.about_mission_text)} onChange={e => set("about_mission_text", e.target.value)} />
                </Field>
                <Field label="Visión" id="about_vision_text">
                  <Textarea id="about_vision_text" rows={4} value={str(settings.about_vision_text)} onChange={e => set("about_vision_text", e.target.value)} />
                </Field>
                <div className="pt-2">
                  <SaveBtn sectionId="about_mission" keys={["about_mission_text","about_vision_text"]} />
                </div>
              </CardContent>
            </Card>

            {/* Colección / Estadísticas */}
            <Card>
              <CardHeader>
                <CardTitle>Colección — Estadísticas</CardTitle>
                <CardDescription>Cuatro cifras destacadas que se muestran en la sección "Nuestra Colección"</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Título de la sección" id="about_stats_title">
                  <Input id="about_stats_title" value={str(settings.about_stats_title)} onChange={e => set("about_stats_title", e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  {([1,2,3,4] as const).map(n => (
                    <div key={n} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                      <p className="text-xs font-medium text-muted-foreground">Estadística {n}</p>
                      <Field label="Valor" id={`about_stat${n}_value`}>
                        <Input id={`about_stat${n}_value`} placeholder="Ej: 5.200+" value={str(settings[`about_stat${n}_value`])} onChange={e => set(`about_stat${n}_value`, e.target.value)} />
                      </Field>
                      <Field label="Etiqueta" id={`about_stat${n}_label`}>
                        <Input id={`about_stat${n}_label`} placeholder="Ej: Especímenes catalogados" value={str(settings[`about_stat${n}_label`])} onChange={e => set(`about_stat${n}_label`, e.target.value)} />
                      </Field>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <SaveBtn sectionId="about_stats" keys={[
                    "about_stats_title",
                    "about_stat1_value","about_stat1_label","about_stat2_value","about_stat2_label",
                    "about_stat3_value","about_stat3_label","about_stat4_value","about_stat4_label",
                  ]} />
                </div>
              </CardContent>
            </Card>

            {/* Pestaña Colecciones */}
            <Card>
              <CardHeader>
                <CardTitle>Pestaña "Colecciones"</CardTitle>
                <CardDescription>Cuatro sub-secciones de la pestaña Colecciones en la página Acerca de</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {([1,2,3,4] as const).map(n => (
                  <div key={n} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                    <p className="text-sm font-semibold">Colección {n}</p>
                    <Field label="Título" id={`about_col${n}_title`}>
                      <Input id={`about_col${n}_title`} value={str(settings[`about_col${n}_title`])} onChange={e => set(`about_col${n}_title`, e.target.value)} />
                    </Field>
                    <Field label="Descripción" id={`about_col${n}_text`}>
                      <Textarea id={`about_col${n}_text`} rows={3} value={str(settings[`about_col${n}_text`])} onChange={e => set(`about_col${n}_text`, e.target.value)} />
                    </Field>
                  </div>
                ))}
                <div className="pt-2">
                  <SaveBtn sectionId="about_collections" keys={[
                    "about_col1_title","about_col1_text","about_col2_title","about_col2_text",
                    "about_col3_title","about_col3_text","about_col4_title","about_col4_text",
                  ]} />
                </div>
              </CardContent>
            </Card>

            {/* Pestaña Investigación */}
            <Card>
              <CardHeader>
                <CardTitle>Pestaña "Investigación"</CardTitle>
                <CardDescription>Cuatro líneas de investigación en la pestaña Investigación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {([1,2,3,4] as const).map(n => (
                  <div key={n} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                    <p className="text-sm font-semibold">Línea {n}</p>
                    <Field label="Título" id={`about_res${n}_title`}>
                      <Input id={`about_res${n}_title`} value={str(settings[`about_res${n}_title`])} onChange={e => set(`about_res${n}_title`, e.target.value)} />
                    </Field>
                    <Field label="Descripción" id={`about_res${n}_text`}>
                      <Textarea id={`about_res${n}_text`} rows={3} value={str(settings[`about_res${n}_text`])} onChange={e => set(`about_res${n}_text`, e.target.value)} />
                    </Field>
                  </div>
                ))}
                <div className="pt-2">
                  <SaveBtn sectionId="about_research" keys={[
                    "about_res1_title","about_res1_text","about_res2_title","about_res2_text",
                    "about_res3_title","about_res3_text","about_res4_title","about_res4_text",
                  ]} />
                </div>
              </CardContent>
            </Card>

            {/* Equipo */}
            <Card>
              <CardHeader>
                <CardTitle>Pestaña "Equipo"</CardTitle>
                <CardDescription>Los tres miembros del equipo que se muestran en la pestaña Equipo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {([1,2,3] as const).map(n => (
                  <div key={n} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                    <p className="text-sm font-semibold">Miembro {n}</p>
                    <Field label="Nombre" id={`about_member${n}_name`}>
                      <Input id={`about_member${n}_name`} value={str(settings[`about_member${n}_name`])} onChange={e => set(`about_member${n}_name`, e.target.value)} />
                    </Field>
                    <Field label="Cargo / Rol" id={`about_member${n}_role`}>
                      <Input id={`about_member${n}_role`} value={str(settings[`about_member${n}_role`])} onChange={e => set(`about_member${n}_role`, e.target.value)} />
                    </Field>
                    <Field label="Biografía" id={`about_member${n}_bio`}>
                      <Textarea id={`about_member${n}_bio`} rows={2} value={str(settings[`about_member${n}_bio`])} onChange={e => set(`about_member${n}_bio`, e.target.value)} />
                    </Field>
                    <Field label="URL foto" id={`about_member${n}_image`} hint="Vacío = imagen de marcador de posición">
                      <Input id={`about_member${n}_image`} placeholder="https://..." value={str(settings[`about_member${n}_image`])} onChange={e => set(`about_member${n}_image`, e.target.value)} />
                    </Field>
                  </div>
                ))}
                <div className="pt-2">
                  <SaveBtn sectionId="about_team" keys={[
                    "about_member1_image","about_member1_name","about_member1_role","about_member1_bio",
                    "about_member2_image","about_member2_name","about_member2_role","about_member2_bio",
                    "about_member3_image","about_member3_name","about_member3_role","about_member3_bio",
                  ]} />
                </div>
              </CardContent>
            </Card>

            {/* Ubicación */}
            <Card>
              <CardHeader>
                <CardTitle>Ubicación</CardTitle>
                <CardDescription>Sección "Visítanos" con dirección, horario e imagen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Título" id="about_location_title">
                  <Input id="about_location_title" value={str(settings.about_location_title)} onChange={e => set("about_location_title", e.target.value)} />
                </Field>
                <Field label="Dirección" id="about_location_address" hint="Usa Enter para saltos de línea">
                  <Textarea id="about_location_address" rows={3} value={str(settings.about_location_address)} onChange={e => set("about_location_address", e.target.value)} />
                </Field>
                <Field label="Horario de atención" id="about_location_schedule">
                  <Textarea id="about_location_schedule" rows={3} value={str(settings.about_location_schedule)} onChange={e => set("about_location_schedule", e.target.value)} />
                </Field>
                <Field label="URL imagen/mapa" id="about_location_image" hint="Imagen que aparece al lado del texto de ubicación">
                  <Input id="about_location_image" placeholder="https://..." value={str(settings.about_location_image)} onChange={e => set("about_location_image", e.target.value)} />
                </Field>
                <div className="pt-2">
                  <SaveBtn sectionId="about_location" keys={["about_location_title","about_location_address","about_location_schedule","about_location_image"]} />
                </div>
              </CardContent>
            </Card>

            {/* Colaboraciones */}
            <Card>
              <CardHeader>
                <CardTitle>Colaboraciones y Alianzas</CardTitle>
                <CardDescription>Cuatro instituciones colaboradoras con logo y enlace opcional</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Título de la sección" id="about_partners_title">
                  <Input id="about_partners_title" value={str(settings.about_partners_title)} onChange={e => set("about_partners_title", e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  {([1,2,3,4] as const).map(n => (
                    <div key={n} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                      <p className="text-xs font-medium text-muted-foreground">Institución {n}</p>
                      <Field label="Nombre" id={`about_partner${n}_name`}>
                        <Input id={`about_partner${n}_name`} placeholder="Ej: Universidad Nacional" value={str(settings[`about_partner${n}_name`])} onChange={e => set(`about_partner${n}_name`, e.target.value)} />
                      </Field>
                      <Field label="URL logo" id={`about_partner${n}_image`}>
                        <Input id={`about_partner${n}_image`} placeholder="https://..." value={str(settings[`about_partner${n}_image`])} onChange={e => set(`about_partner${n}_image`, e.target.value)} />
                      </Field>
                      <Field label="URL enlace" id={`about_partner${n}_url`} hint="Vacío = sin enlace">
                        <Input id={`about_partner${n}_url`} placeholder="https://..." value={str(settings[`about_partner${n}_url`])} onChange={e => set(`about_partner${n}_url`, e.target.value)} />
                      </Field>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <SaveBtn sectionId="about_partners" keys={[
                    "about_partners_title",
                    "about_partner1_name","about_partner1_image","about_partner1_url",
                    "about_partner2_name","about_partner2_image","about_partner2_url",
                    "about_partner3_name","about_partner3_image","about_partner3_url",
                    "about_partner4_name","about_partner4_image","about_partner4_url",
                  ]} />
                </div>
              </CardContent>
            </Card>

            {/* CTA final */}
            <Card>
              <CardHeader>
                <CardTitle>Llamada a la acción (CTA)</CardTitle>
                <CardDescription>Bloque verde al final de la página que invita a colaborar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Título" id="about_cta_title">
                  <Input id="about_cta_title" value={str(settings.about_cta_title)} onChange={e => set("about_cta_title", e.target.value)} />
                </Field>
                <Field label="Texto descriptivo" id="about_cta_text">
                  <Textarea id="about_cta_text" rows={3} value={str(settings.about_cta_text)} onChange={e => set("about_cta_text", e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Texto del botón" id="about_cta_button_text">
                    <Input id="about_cta_button_text" value={str(settings.about_cta_button_text)} onChange={e => set("about_cta_button_text", e.target.value)} />
                  </Field>
                  <Field label="URL del botón" id="about_cta_button_url">
                    <Input id="about_cta_button_url" placeholder="/contacto" value={str(settings.about_cta_button_url)} onChange={e => set("about_cta_button_url", e.target.value)} />
                  </Field>
                </div>
                <div className="pt-2">
                  <SaveBtn sectionId="about_cta" keys={["about_cta_title","about_cta_text","about_cta_button_text","about_cta_button_url"]} />
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ── LOGIN ────────────────────────────────────────────────────────── */}
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageLucide className="h-5 w-5" />
                Página de inicio de sesión
              </CardTitle>
              <CardDescription>
                Imagen de fondo del panel izquierdo y textos que se muestran en la pantalla de login
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field
                label="URL de imagen de fondo"
                id="login_bg_image"
                hint="Imagen botánica que aparece en el panel izquierdo del login en escritorio"
              >
                <Input
                  id="login_bg_image"
                  placeholder="https://..."
                  value={str(settings.login_bg_image)}
                  onChange={(e) => set("login_bg_image", e.target.value)}
                />
              </Field>

              {settings.login_bg_image && (
                <div className="rounded-lg border overflow-hidden bg-muted/30">
                  <p className="text-xs text-muted-foreground px-3 pt-2">Vista previa:</p>
                  <div className="relative h-40 m-3 rounded overflow-hidden bg-green-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={str(settings.login_bg_image)}
                      alt="Vista previa login"
                      className="w-full h-full object-cover opacity-40"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <div className="absolute inset-0 flex items-end p-3">
                      <span className="text-white text-sm font-light opacity-80">
                        {str(settings.login_tagline) || "Descubre la flora de la Amazonia"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Field
                label="Tagline del panel izquierdo"
                id="login_tagline"
                hint="Texto principal que aparece sobre la imagen"
              >
                <Input
                  id="login_tagline"
                  placeholder="Descubre la flora de la Amazonia"
                  value={str(settings.login_tagline)}
                  onChange={(e) => set("login_tagline", e.target.value)}
                />
              </Field>

              <Field
                label="Atribución de la imagen"
                id="login_bg_attribution"
                hint="Crédito fotográfico que se muestra en la esquina inferior izquierda"
              >
                <Input
                  id="login_bg_attribution"
                  placeholder="Ej: IERNA SINCHI"
                  value={str(settings.login_bg_attribution)}
                  onChange={(e) => set("login_bg_attribution", e.target.value)}
                />
              </Field>

              <div className="pt-2">
                <SaveBtn sectionId="login" keys={["login_bg_image", "login_bg_attribution", "login_tagline"]} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Componentes auxiliares ─────────────────────────────────────────────────────

function Field({ label, id, hint, children }: { label: string; id: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function BannerPreview({ type, text, link }: { type: string; text: string; link: string }) {
  const colors: Record<string, string> = {
    info:    "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    error:   "bg-red-50 border-red-200 text-red-800",
  }
  const cls = colors[type] || colors.info
  const content = (
    <div className={`w-full text-center text-sm py-2 px-4 border rounded ${cls}`}>
      {text}
      {link && <span className="ml-2 underline text-xs">→ Ver más</span>}
    </div>
  )
  return link ? <a href={link} target="_blank" rel="noreferrer">{content}</a> : content
}
