"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  CheckCircle2, Loader2, Home, ChevronRight, Mail, FileText,
  AlertTriangle, Star, MessageSquare, Flag, Search, ThumbsUp, Clock
} from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { usePublicSettings } from "@/lib/use-public-settings"

// ── Constantes ────────────────────────────────────────────────────────────────

const TIPOS = [
  {
    value: "peticion",
    label: "Petición",
    icon: FileText,
    color: "border-blue-200 bg-blue-50 hover:bg-blue-100",
    colorSelected: "border-blue-500 bg-blue-100 ring-2 ring-blue-400",
    badge: "bg-blue-100 text-blue-800",
    desc: "Solicitud de carácter general o particular para recibir respuesta sobre temas de competencia del herbario.",
    tiempo: "15 días hábiles",
  },
  {
    value: "queja",
    label: "Queja",
    icon: AlertTriangle,
    color: "border-orange-200 bg-orange-50 hover:bg-orange-100",
    colorSelected: "border-orange-500 bg-orange-100 ring-2 ring-orange-400",
    badge: "bg-orange-100 text-orange-800",
    desc: "Insatisfacción o disgusto por la actuación o el comportamiento de un funcionario o la institución.",
    tiempo: "15 días hábiles",
  },
  {
    value: "reclamo",
    label: "Reclamo",
    icon: MessageSquare,
    color: "border-red-200 bg-red-50 hover:bg-red-100",
    colorSelected: "border-red-500 bg-red-100 ring-2 ring-red-400",
    badge: "bg-red-100 text-red-800",
    desc: "Expresión de disconformidad referida a la prestación de los servicios a cargo del herbario.",
    tiempo: "15 días hábiles",
  },
  {
    value: "sugerencia",
    label: "Sugerencia",
    icon: Search,
    color: "border-green-200 bg-green-50 hover:bg-green-100",
    colorSelected: "border-green-500 bg-green-100 ring-2 ring-green-400",
    badge: "bg-green-100 text-green-800",
    desc: "Propuestas para el mejor desarrollo de las actividades del herbario.",
    tiempo: "15 días hábiles",
  },
  {
    value: "denuncia",
    label: "Denuncia",
    icon: Flag,
    color: "border-purple-200 bg-purple-50 hover:bg-purple-100",
    colorSelected: "border-purple-500 bg-purple-100 ring-2 ring-purple-400",
    badge: "bg-purple-100 text-purple-800",
    desc: "Pone en conocimiento una conducta presuntamente irregular para que se adelante la correspondiente investigación.",
    tiempo: "Remitida a autoridad competente",
  },
  {
    value: "felicitacion",
    label: "Felicitación",
    icon: ThumbsUp,
    color: "border-yellow-200 bg-yellow-50 hover:bg-yellow-100",
    colorSelected: "border-yellow-500 bg-yellow-100 ring-2 ring-yellow-400",
    badge: "bg-yellow-100 text-yellow-800",
    desc: "Expresión de satisfacción frente a alguna de las actividades del herbario.",
    tiempo: "Inmediata o 10-15 días hábiles",
  },
]

const TIPOS_IDENTIFICACION = [
  { value: "CC",  label: "CC — Cédula de Ciudadanía" },
  { value: "CE",  label: "CE — Cédula de Extranjería" },
  { value: "PA",  label: "PA — Pasaporte" },
  { value: "NIT", label: "NIT — Número de Identificación Tributaria" },
  { value: "TI",  label: "TI — Tarjeta de Identidad" },
  { value: "RC",  label: "RC — Registro Civil" },
  { value: "PEP", label: "PEP — Permiso Especial de Permanencia" },
]

const DEPARTAMENTOS = [
  "Amazonas","Antioquia","Arauca","Atlántico","Bolívar","Boyacá","Caldas",
  "Caquetá","Casanare","Cauca","Cesar","Chocó","Córdoba","Cundinamarca",
  "Guainía","Guaviare","Huila","La Guajira","Magdalena","Meta","Nariño",
  "Norte de Santander","Putumayo","Quindío","Risaralda",
  "San Andrés y Providencia","Santander","Sucre","Tolima","Valle del Cauca",
  "Vaupés","Vichada",
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({ label, id, required, hint, children }: {
  label: string; id: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

const EMPTY_FORM = {
  anonimo: false,
  nombre: "",
  tipo_identificacion: "CC",
  numero_documento: "",
  direccion_correspondencia: "",
  medio_respuesta: "email",
  telefono: "",
  pais: "Colombia",
  departamento: "",
  ciudad: "",
  email: "",
  fax: "",
  tipo: "",
  mensaje: "",
  autoriza: false,
}

type FormState = typeof EMPTY_FORM

export default function ContactoPage() {
  const { toast } = useToast()
  const cfg = usePublicSettings()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{
    radicado: string; tipo: string; fechaRadicacion: string; tiempoRespuesta: string
  } | null>(null)

  const set = (key: keyof FormState, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const contactEmail = cfg.contactEmail || "herbario@herbariodigital.com"
  const instAddress  = cfg.institutionAddress || "Mocoa, Putumayo, Colombia"

  const selectedTipo = TIPOS.find(t => t.value === form.tipo)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.tipo) {
      toast({ title: "Selecciona el tipo de comunicación", variant: "destructive" })
      return
    }
    if (!form.mensaje.trim()) {
      toast({ title: "El mensaje es requerido", variant: "destructive" })
      return
    }
    if (!form.autoriza) {
      toast({ title: "Debes aceptar la política de tratamiento de datos", variant: "destructive" })
      return
    }

    setSending(true)
    try {
      const res = await apiService.createPqrsdf({
        tipo: form.tipo,
        anonimo: form.anonimo,
        nombre: form.anonimo ? undefined : form.nombre,
        tipo_identificacion: form.anonimo ? undefined : form.tipo_identificacion,
        numero_documento: form.anonimo ? undefined : form.numero_documento,
        direccion_correspondencia: form.anonimo ? undefined : form.direccion_correspondencia,
        medio_respuesta: form.medio_respuesta,
        telefono: form.telefono || undefined,
        pais: form.pais,
        departamento: form.departamento || undefined,
        ciudad: form.ciudad || undefined,
        email: form.email || undefined,
        fax: form.fax || undefined,
        mensaje: form.mensaje,
        autoriza: form.autoriza,
      })

      if (res.success && res.data) {
        setResult(res.data)
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        throw new Error(res.error || "Error al enviar la solicitud")
      }
    } catch (err: any) {
      toast({ title: "Error al enviar", description: err.message, variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  // ── Vista de confirmación ──────────────────────────────────────────────────
  if (result) {
    const tipoInfo = TIPOS.find(t => t.value === result.tipo)
    const fecha = new Date(result.fechaRadicacion)
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="border-green-200">
          <CardContent className="pt-8 pb-6 text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-green-700 mb-2">¡Solicitud radicada con éxito!</h1>
              <p className="text-muted-foreground">
                Su {tipoInfo?.label.toLowerCase() ?? result.tipo} ha sido recibida y registrada en nuestro sistema.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-5 text-left space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Número de radicado</span>
                <Badge className="font-mono text-base px-3 py-1 bg-green-600 hover:bg-green-600">
                  {result.radicado}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tipo</span>
                <span className="font-medium capitalize">{result.tipo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fecha y hora</span>
                <span className="font-medium">{fecha.toLocaleString("es-CO")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tiempo de respuesta</span>
                <span className="font-medium text-right max-w-[60%]">{result.tiempoRespuesta}</span>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 text-left">
              <strong>Importante:</strong> Guarde el número de radicado como comprobante de su solicitud.
              La respuesta se enviará por el medio indicado dentro del tiempo establecido por la ley.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => { setResult(null); setForm(EMPTY_FORM) }}
              >
                Radicar otra solicitud
              </Button>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/">Ir al inicio</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href="/" className="flex items-center gap-1 hover:text-foreground">
          <Home className="h-3.5 w-3.5" />Inicio
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">PQRSDF</span>
      </nav>

      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          Peticiones, Quejas, Reclamos, Sugerencias, Denuncias y Felicitaciones
        </h1>
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="py-4 text-sm text-muted-foreground leading-relaxed">
            Con el deseo de consolidarse como una institución de investigación científica de puertas abiertas,
            cualquier ciudadano puede enviar sus Peticiones, Quejas, Sugerencias, Denuncias, Reclamos o
            Felicitaciones relativas a las funciones propias del Herbario HEAA, a través del correo electrónico{" "}
            <a href={`mailto:${contactEmail}`} className="text-green-700 font-medium hover:underline">
              {contactEmail}
            </a>{" "}
            o del formulario a continuación. El trámite implica un estudio y una respuesta adecuada, generada
            dentro de los plazos establecidos por la Ley 1755 de 2015.
            <br /><br />
            La respuesta se efectuará por el mismo medio indicado en su solicitud.
            Para mayor agilidad y cuidado ambiental, indicar un correo electrónico como medio de respuesta.
          </CardContent>
        </Card>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Sección 1: Información del solicitante ─────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="h-6 w-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                  Información del solicitante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Fecha */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
                  <span className="text-sm font-medium">Fecha de radicación:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString("es-CO", { day:"2-digit", month:"2-digit", year:"numeric" })}
                  </span>
                </div>

                {/* Anónimo */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    ¿Desea realizar el trámite como persona anónima?<span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <RadioGroup
                    value={form.anonimo ? "si" : "no"}
                    onValueChange={v => set("anonimo", v === "si")}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="si" id="anonimo-si" />
                      <Label htmlFor="anonimo-si" className="font-normal cursor-pointer">Sí</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="anonimo-no" />
                      <Label htmlFor="anonimo-no" className="font-normal cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                  {form.anonimo && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                      El Herbario HEAA recibe solicitudes de manera anónima. No podremos enviarle una respuesta
                      directamente, pero su solicitud será atendida.
                    </p>
                  )}
                </div>

                {/* Campos personales — solo si no anónimo */}
                {!form.anonimo && (
                  <>
                    <Field label="Nombre completo" id="nombre" required>
                      <Input
                        id="nombre"
                        placeholder="Ej. Jaime Jaramillo"
                        value={form.nombre}
                        onChange={e => set("nombre", e.target.value)}
                        required
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Tipo de identificación" id="tipo_id" required>
                        <Select value={form.tipo_identificacion} onValueChange={v => set("tipo_identificacion", v)}>
                          <SelectTrigger id="tipo_id">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_IDENTIFICACION.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Número de documento" id="num_doc" required>
                        <Input
                          id="num_doc"
                          placeholder="Ej. 123456789"
                          value={form.numero_documento}
                          onChange={e => set("numero_documento", e.target.value)}
                        />
                      </Field>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        ¿Cómo desea recibir la respuesta?<span className="text-red-500 ml-0.5">*</span>
                      </Label>
                      <RadioGroup
                        value={form.medio_respuesta}
                        onValueChange={v => set("medio_respuesta", v)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="email" id="resp-email" />
                          <Label htmlFor="resp-email" className="font-normal cursor-pointer flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" /> Email
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="correo_fisico" id="resp-fisico" />
                          <Label htmlFor="resp-fisico" className="font-normal cursor-pointer">Correo físico</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {form.medio_respuesta === "email" && (
                      <Field label="Correo electrónico" id="email" required hint="La respuesta será enviada a este correo">
                        <Input
                          id="email"
                          type="email"
                          placeholder="ejemplo@correo.com"
                          value={form.email}
                          onChange={e => set("email", e.target.value)}
                          required={form.medio_respuesta === "email"}
                        />
                      </Field>
                    )}

                    {form.medio_respuesta === "correo_fisico" && (
                      <Field label="Dirección de correspondencia" id="dir_cor" required>
                        <Input
                          id="dir_cor"
                          placeholder="Ej. CALLE 20 #5-44"
                          value={form.direccion_correspondencia}
                          onChange={e => set("direccion_correspondencia", e.target.value)}
                        />
                      </Field>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Teléfono" id="telefono">
                        <Input
                          id="telefono"
                          placeholder="3001234567"
                          value={form.telefono}
                          onChange={e => set("telefono", e.target.value)}
                        />
                      </Field>
                      <Field label="Fax" id="fax">
                        <Input
                          id="fax"
                          placeholder="+57 1 300 1234"
                          value={form.fax}
                          onChange={e => set("fax", e.target.value)}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Field label="País" id="pais" required>
                        <Input
                          id="pais"
                          value={form.pais}
                          onChange={e => set("pais", e.target.value)}
                        />
                      </Field>
                      <Field label="Departamento" id="departamento">
                        <Select value={form.departamento} onValueChange={v => set("departamento", v)}>
                          <SelectTrigger id="departamento">
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEPARTAMENTOS.map(d => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Ciudad" id="ciudad">
                        <Input
                          id="ciudad"
                          placeholder="Ej. Mocoa"
                          value={form.ciudad}
                          onChange={e => set("ciudad", e.target.value)}
                        />
                      </Field>
                    </div>

                    {form.medio_respuesta === "correo_fisico" && (
                      <Field label="Correo electrónico" id="email_opt" hint="Opcional: para acuse de recibo digital">
                        <Input
                          id="email_opt"
                          type="email"
                          placeholder="ejemplo@correo.com"
                          value={form.email}
                          onChange={e => set("email", e.target.value)}
                        />
                      </Field>
                    )}

                    <p className="text-xs text-muted-foreground italic">
                      Los campos marcados con <span className="text-red-500">*</span> son obligatorios.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* ── Sección 2: Tipo de comunicación ───────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="h-6 w-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                  Tipo de comunicación
                  <span className="text-red-500 ml-0.5 font-normal text-base">*</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {TIPOS.map(({ value, label, icon: Icon, color, colorSelected, badge, desc }) => {
                    const selected = form.tipo === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set("tipo", value)}
                        className={`flex flex-col items-start gap-2 p-4 rounded-lg border-2 text-left transition-all ${selected ? colorSelected : color}`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="font-semibold text-sm">{label}</span>
                          {selected && <CheckCircle2 className="h-4 w-4 ml-auto text-green-600" />}
                        </div>
                        <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
                        <Badge variant="secondary" className={`text-[10px] ${badge}`}>
                          <Clock className="h-2.5 w-2.5 mr-1" />{TIPOS.find(t=>t.value===value)?.tiempo}
                        </Badge>
                      </button>
                    )
                  })}
                </div>

                {/* Mensaje */}
                <Field label="Mensaje" id="mensaje" required
                  hint="Describa con detalle su petición, queja, reclamo, sugerencia, denuncia o felicitación">
                  <Textarea
                    id="mensaje"
                    rows={6}
                    placeholder="Escriba su mensaje aquí..."
                    value={form.mensaje}
                    onChange={e => set("mensaje", e.target.value)}
                    required
                  />
                  <p className="text-xs text-right text-muted-foreground">{form.mensaje.length} caracteres</p>
                </Field>

                {/* Autorización de datos */}
                <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    De conformidad con la <strong>Ley 1581 de 2012</strong> y el <strong>Decreto 1377 de 2013</strong>,
                    autorizo expresa e irrevocablemente el tratamiento de la información y datos personales suministrados
                    en el presente formulario, conforme a la Política de Protección y Tratamiento de Datos Personales
                    del Herbario HEAA.
                  </p>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="autoriza"
                      checked={form.autoriza}
                      onCheckedChange={v => set("autoriza", Boolean(v))}
                    />
                    <Label htmlFor="autoriza" className="text-sm cursor-pointer leading-snug">
                      Autorizo el tratamiento de mis datos personales según la política de privacidad
                      <span className="text-red-500 ml-0.5">*</span>
                    </Label>
                  </div>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-800">
                  <strong>Al enviar este formulario</strong>, el sistema generará de forma inmediata un número de
                  radicado con fecha y hora de presentación. Si proporcionó un correo electrónico, recibirá un
                  acuse de recibo automático.
                </div>

                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-green-600 hover:bg-green-700 h-11 text-base"
                >
                  {sending
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando solicitud…</>
                    : <><Star className="h-4 w-4 mr-2" />Enviar y radicar solicitud</>
                  }
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* ── Columna lateral ────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Tiempos de respuesta */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-green-600" />
                  Tiempos de respuesta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  De conformidad con la <strong>Ley 1755 de 2015</strong>:
                </p>
                {[
                  { t: "Petición general / particular", d: "15 días hábiles" },
                  { t: "Petición de documentos",        d: "10 días hábiles" },
                  { t: "Consultas",                     d: "30 días hábiles" },
                  { t: "Reclamos y Quejas",             d: "15 días hábiles" },
                  { t: "Sugerencias",                   d: "15 días hábiles" },
                  { t: "Denuncias",                     d: "Se remite a autoridad competente" },
                  { t: "Felicitaciones",                d: "Inmediata o 10-15 días hábiles" },
                ].map(({ t, d }) => (
                  <div key={t} className="flex flex-col gap-0.5 py-2 border-b last:border-0">
                    <span className="text-xs font-medium">{t}</span>
                    <span className="text-xs text-green-700">{d}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* PQRSDF Anónimas */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">PQRSDF Anónimas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El Herbario HEAA recibe peticiones, quejas, reclamos, sugerencias, denuncias y felicitaciones
                  de manera <strong>anónima</strong>, conforme a la Ley. En este caso no será posible enviar
                  una respuesta directa al solicitante.
                </p>
              </CardContent>
            </Card>

            {/* Contacto directo */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Contacto directo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Mail className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                  <a href={`mailto:${contactEmail}`} className="hover:text-green-700 break-all">{contactEmail}</a>
                </div>
                <div className="flex items-start gap-2">
                  <Home className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                  <span>{instAddress}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
