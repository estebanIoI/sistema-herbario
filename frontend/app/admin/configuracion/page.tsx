"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save, Cloud, CheckCircle2, XCircle, Eye, EyeOff, ExternalLink } from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type Setting = {
  id: number
  key_name: string
  value: string
  type: string
  category: string
  description: string
  is_public: boolean
}

// Etiquetas amigables por key_name
const FIELD_LABELS: Record<string, string> = {
  site_name:                  "Nombre del sitio",
  site_description:           "Descripción del sitio",
  institution_name:           "Nombre de la institución",
  herbarium_code:             "Código del herbario",
  institution_address:        "Dirección",
  institution_phone:          "Teléfono",
  contact_email:              "Email de contacto",
  enable_registration:        "Permitir registro de nuevos usuarios",
  require_email_verification: "Requerir verificación de email",
  enable_public_catalog:      "Catálogo público visible",
  enable_suggestions:         "Permitir sugerencias de usuarios",
  plants_per_page:            "Plantas por página (catálogo)",
  search_results_per_page:    "Resultados por página (búsqueda)",
  max_file_size:              "Tamaño máximo de archivo (bytes)",
  allowed_image_types:        "Tipos de imagen permitidos",
  cloudinary_cloud_name:      "Cloud Name",
  cloudinary_api_key:         "API Key",
  cloudinary_api_secret:      "API Secret",
  cloudinary_folder:          "Carpeta base",
  chatbot_enabled:            "Activar asistente virtual",
  chatbot_title:              "Título del chat",
  chatbot_welcome:            "Mensaje de bienvenida",
  chatbot_placeholder:        "Texto del campo de entrada",
  chatbot_launcher:           "Texto del botón flotante",
  chatbot_provider:           "Proveedor de IA (groq | google)",
  chatbot_model:              "Modelo (vacío = predeterminado)",
  chatbot_system_prompt:      "Instrucción de sistema / personalidad",
  chatbot_temperature:        "Creatividad (0.0 – 1.0)",
  chatbot_max_history:        "Máximo de mensajes de historial",
  chatbot_groq_api_key:       "API Key de Groq",
  chatbot_google_api_key:     "API Key de Google AI Studio",
}

const CATEGORY_CONFIG: Record<string, { label: string; description: string; order: number }> = {
  general:    { label: "General",         description: "Información institucional del herbario",   order: 1 },
  contact:    { label: "Contacto",        description: "Datos de contacto público",                order: 2 },
  auth:       { label: "Autenticación",   description: "Control de acceso y registro de usuarios", order: 3 },
  features:   { label: "Funcionalidades", description: "Activar o desactivar módulos del sistema", order: 4 },
  display:    { label: "Visualización",   description: "Paginación y presentación de datos",       order: 5 },
  search:     { label: "Búsqueda",        description: "Configuración del motor de búsqueda",      order: 6 },
  uploads:    { label: "Archivos",        description: "Límites y tipos de archivos permitidos",   order: 7 },
  cloudinary: { label: "Cloudinary",      description: "Credenciales para almacenamiento de imágenes", order: 8 },
  chatbot:    { label: "Asistente Virtual (Chatbot)", description: "IA conversacional con Groq o Google AI Studio", order: 9 },
}

// Campos cuyo valor es contraseña (ocultar por defecto)
const SECRET_KEYS = new Set(["cloudinary_api_key", "cloudinary_api_secret", "chatbot_groq_api_key", "chatbot_google_api_key"])

export default function ConfiguracionPage() {
  const { toast } = useToast()
  const [grouped, setGrouped] = useState<Record<string, Setting[]>>({})
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})
  const [cloudinaryStatus, setCloudinaryStatus] = useState<"idle" | "loading" | "ok" | "error">("idle")
  const [cloudinaryMsg, setCloudinaryMsg] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiService.getAllSettings()
      .then((res) => {
        if (res.success && res.data) {
          const g: Record<string, Setting[]> = {}
          const v: Record<string, string> = {}
          for (const s of res.data) {
            if (s.category === "pagina") continue   // pagina se gestiona en /admin/pagina
            if (!g[s.category]) g[s.category] = []
            g[s.category].push(s)
            v[s.key_name] = s.value ?? ""
          }
          setGrouped(g)
          setValues(v)
        } else {
          setError(res.error ?? "No se pudo cargar la configuración.")
        }
      })
      .catch(() => setError("Error de conexión con el servidor."))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (key: string, val: string) =>
    setValues(prev => ({ ...prev, [key]: val }))

  const handleBooleanChange = (key: string, checked: boolean) =>
    setValues(prev => ({ ...prev, [key]: String(checked) }))

  const saveCategory = async (category: string) => {
    const settings = grouped[category]
    if (!settings) return
    setSaving(prev => ({ ...prev, [category]: true }))
    try {
      const payload = settings.map(s => ({ key: s.key_name, value: values[s.key_name] ?? "" }))
      const res = await apiService.updateSettings(payload)
      if (res.success) {
        toast({ title: "Guardado", description: `${CATEGORY_CONFIG[category]?.label ?? category} actualizado correctamente.` })
      } else {
        toast({ title: "Error", description: res.error ?? "No se pudo guardar.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Error de conexión.", variant: "destructive" })
    } finally {
      setSaving(prev => ({ ...prev, [category]: false }))
    }
  }

  const testCloudinary = async () => {
    setCloudinaryStatus("loading")
    try {
      const res = await apiService.testCloudinaryConnection()
      if (res.success && res.data?.configured) {
        setCloudinaryStatus("ok")
        setCloudinaryMsg(res.data.message ?? "Conexión exitosa")
      } else {
        setCloudinaryStatus("error")
        setCloudinaryMsg(res.data?.message ?? res.error ?? "No se pudo conectar")
      }
    } catch {
      setCloudinaryStatus("error")
      setCloudinaryMsg("Error de conexión con el servidor")
    }
  }

  const renderField = (s: Setting) => {
    const val = values[s.key_name] ?? ""
    const label = FIELD_LABELS[s.key_name] ?? s.key_name
    const isSecret = SECRET_KEYS.has(s.key_name)
    const visible = showSecret[s.key_name]

    if (s.type === "boolean") {
      return (
        <div key={s.key_name} className="flex items-center justify-between py-3 border-b last:border-0">
          <div>
            <Label className="font-medium text-sm">{label}</Label>
            {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
          </div>
          <Switch
            checked={val === "true"}
            onCheckedChange={(checked) => handleBooleanChange(s.key_name, checked)}
          />
        </div>
      )
    }

    return (
      <div key={s.key_name} className="space-y-1.5 pb-4 border-b last:border-0 last:pb-0">
        <Label className="font-medium text-sm">{label}</Label>
        {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
        <div className="relative">
          <Input
            type={isSecret && !visible ? "password" : s.type === "number" ? "number" : "text"}
            value={val}
            onChange={(e) => handleChange(s.key_name, e.target.value)}
            className={isSecret ? "pr-10" : ""}
            placeholder={isSecret ? "••••••••••••" : undefined}
          />
          {isSecret && (
            <button
              type="button"
              onClick={() => setShowSecret(prev => ({ ...prev, [s.key_name]: !prev[s.key_name] }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive p-6">{error}</p>
  }

  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => (CATEGORY_CONFIG[a]?.order ?? 99) - (CATEGORY_CONFIG[b]?.order ?? 99)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Ajustes del sistema. El contenido de la página de inicio se gestiona en{" "}
          <a href="/admin/pagina" className="underline underline-offset-2 hover:text-foreground inline-flex items-center gap-1">
            Página <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>

      {sortedCategories.map((category) => {
        const cfg = CATEGORY_CONFIG[category]
        const settings = grouped[category]
        const isCloudinary = category === "cloudinary"

        return (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {isCloudinary && <Cloud className="h-4 w-4" />}
                    {cfg?.label ?? category}
                  </CardTitle>
                  {cfg?.description && (
                    <CardDescription className="mt-1">{cfg.description}</CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isCloudinary && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testCloudinary}
                      disabled={cloudinaryStatus === "loading"}
                    >
                      {cloudinaryStatus === "loading" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : cloudinaryStatus === "ok" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mr-1.5" />
                      ) : cloudinaryStatus === "error" ? (
                        <XCircle className="h-3.5 w-3.5 text-destructive mr-1.5" />
                      ) : null}
                      Probar conexión
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => saveCategory(category)}
                    disabled={saving[category]}
                  >
                    {saving[category]
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      : <Save className="h-3.5 w-3.5 mr-1.5" />}
                    Guardar
                  </Button>
                </div>
              </div>
              {isCloudinary && cloudinaryMsg && (
                <p className={`text-xs mt-2 ${cloudinaryStatus === "ok" ? "text-green-600" : "text-destructive"}`}>
                  {cloudinaryMsg}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-0">
              {settings.map(renderField)}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
