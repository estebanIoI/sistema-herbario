"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Upload, Plus, X, Save, Loader2, CheckCircle2, MapPin, Sparkles, Copy, ChevronDown, LayoutTemplate, Pencil, Trash2, ExternalLink, Hash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"

// ── Tipos helpers ────────────────────────────────────────────────────────────
type AutocompleteItem = { id: number; value: string; type: string; label: string }

type TipoPlantilla = 'institucion' | 'coleccion' | 'ubicacion'

type Plantilla = {
  id: string
  nombre: string
  tipo: TipoPlantilla
  campos: Record<string, string>
}

// ── Valores por defecto (se usan solo si localStorage está vacío) ─────────────
const PLANTILLAS_DEFAULT: Plantilla[] = [
  // Institución
  {
    id: 'default-inst-unip',
    nombre: 'UNIP',
    tipo: 'institucion',
    campos: {
      institutionCode: 'Institución Universitaria del Putumayo (UNIP)',
      institutionID: '800247940',
      basisOfRecord: 'preservedSpecimen',
      type: 'physicalObject',
    },
  },
  // Colección
  {
    id: 'default-col-heaa',
    nombre: 'HEAA - Herbario general',
    tipo: 'coleccion',
    campos: { collectionCode: 'HEAA', collectionID: 'HEAA-ITP' },
  },
  {
    id: 'default-col-heaa-moc',
    nombre: 'HEAA-MOC - Mocoa',
    tipo: 'coleccion',
    campos: { collectionCode: 'HEAA-MOC', collectionID: '' },
  },
  {
    id: 'default-col-heaa-sib',
    nombre: 'HEAA-SIB - Sibundoy',
    tipo: 'coleccion',
    campos: { collectionCode: 'HEAA-SIB', collectionID: '' },
  },
  // Ubicación
  {
    id: 'default-ubic-mocoa',
    nombre: 'Putumayo - Mocoa',
    tipo: 'ubicacion',
    campos: { country: 'Colombia', stateProvince: 'Putumayo', county: 'Mocoa' },
  },
  {
    id: 'default-ubic-sibundoy',
    nombre: 'Putumayo - Sibundoy',
    tipo: 'ubicacion',
    campos: { country: 'Colombia', stateProvince: 'Putumayo', county: 'Sibundoy' },
  },
]

const LS_KEY = 'heaa_plantillas_v1'

const loadPlantillas = (): Plantilla[] => {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : PLANTILLAS_DEFAULT
  } catch { return PLANTILLAS_DEFAULT }
}

const savePlantillas = (list: Plantilla[]) => {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

// ── PlantillaDropdown (fuera del componente principal para evitar remount en cada render) ──
function PlantillaDropdown({
  tipo, plantillas: list, open, onToggle, onApply, onNew, onEdit, onDelete
}: {
  tipo: TipoPlantilla
  plantillas: Plantilla[]
  open: boolean
  onToggle: () => void
  onApply: (p: Plantilla) => void
  onNew: () => void
  onEdit: (p: Plantilla) => void
  onDelete: (id: string) => void
}) {
  const items = list.filter(p => p.tipo === tipo)
  return (
    <div className="relative">
      <Button type="button" variant="outline" size="sm" onClick={onToggle}>
        <LayoutTemplate className="mr-2 h-4 w-4" />Plantillas<ChevronDown className="ml-1 h-3 w-3" />
      </Button>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-64 rounded-md border bg-background shadow-lg">
          <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b">
            <span className="text-xs font-medium text-muted-foreground">Plantillas guardadas</span>
            <button type="button" onClick={onNew}
              className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Plus className="h-3 w-3" />Nueva
            </button>
          </div>
          {items.length === 0 && (
            <p className="px-3 py-3 text-xs text-muted-foreground text-center">Sin plantillas. Crea una con "+ Nueva".</p>
          )}
          {items.map(p => (
            <div key={p.id} className="flex items-center gap-1 px-2 py-1.5 hover:bg-muted group">
              <button type="button" className="flex-1 text-left text-sm px-1 truncate" onClick={() => onApply(p)}>
                {p.nombre}
              </button>
              <button type="button" onClick={() => onEdit(p)} title="Editar"
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-primary transition-opacity">
                <Pencil className="h-3 w-3" />
              </button>
              <button type="button" onClick={() => onDelete(p.id)} title="Eliminar"
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── PlantillaModal (fuera del componente principal para evitar remount en cada render) ──
function PlantillaModal({
  plantillaModal, plantillaForm, setPlantillaForm, setPlantillaModal, onSave,
  camposInstitucion, camposColeccion, camposUbicacion,
}: {
  plantillaModal: { tipo: TipoPlantilla; editing: Plantilla | null } | null
  plantillaForm: { nombre: string; campos: Record<string, string> }
  setPlantillaForm: React.Dispatch<React.SetStateAction<{ nombre: string; campos: Record<string, string> }>>
  setPlantillaModal: (v: null) => void
  onSave: () => void
  camposInstitucion: { key: string; label: string; placeholder: string }[]
  camposColeccion:   { key: string; label: string; placeholder: string }[]
  camposUbicacion:   { key: string; label: string; placeholder: string }[]
}) {
  if (!plantillaModal) return null
  const campos = plantillaModal.tipo === 'institucion' ? camposInstitucion
               : plantillaModal.tipo === 'coleccion'   ? camposColeccion
               : camposUbicacion
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {plantillaModal.editing ? 'Editar plantilla' : 'Nueva plantilla'}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({plantillaModal.tipo === 'institucion' ? 'Institución' : plantillaModal.tipo === 'coleccion' ? 'Colección' : 'Ubicación'})
            </span>
          </h2>
          <Button type="button" variant="ghost" size="icon" onClick={() => setPlantillaModal(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-1">
            <Label className="text-xs font-medium">Nombre de la plantilla *</Label>
            <Input
              placeholder="Ej. UNIP - Mocoa"
              value={plantillaForm.nombre}
              onChange={e => setPlantillaForm(p => ({ ...p, nombre: e.target.value }))}
            />
          </div>
          {campos.map(c => (
            <div key={c.key} className="space-y-1">
              <Label className="text-xs font-medium">{c.label}</Label>
              <Input
                placeholder={c.placeholder}
                value={plantillaForm.campos[c.key] || ''}
                onChange={e => setPlantillaForm(p => ({ ...p, campos: { ...p.campos, [c.key]: e.target.value } }))}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => setPlantillaModal(null)}>Cancelar</Button>
          <Button type="button" onClick={onSave} disabled={!plantillaForm.nombre.trim()}>
            <Save className="mr-2 h-4 w-4" />{plantillaModal.editing ? 'Guardar cambios' : 'Crear plantilla'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function NuevaPlantaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingSection, setIsSavingSection] = useState(false)
  const [plantId, setPlantId] = useState<number | null>(null)
  const plantIdRef = useRef<number | null>(null)
  const isSavingRef = useRef(false) // protección contra doble clic (sync)
  const [currentTab, setCurrentTab] = useState("registro")
  const [uploadedImages, setUploadedImages] = useState<Array<{
    id?: number;
    file?: File;
    url: string;
    serverUrl?: string;
    thumbnailUrl?: string;
    originalName: string;
    isUploading?: boolean;
    uploadFailed?: boolean;
  }>>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [savedSections, setSavedSections] = useState<Set<string>>(new Set())
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['registro']))

  // Orden de tabs igual al orden de columnas del Excel BD_Gral_HEAA
  const REQUIRED_SECTIONS = ['Registro', 'Colección', 'Ubicación', 'Taxonomía', 'Características']
  const REQUIRED_TABS = ['registro', 'coleccion', 'ubicacion', 'taxonomia', 'caracteristicas']
  const allSaved = REQUIRED_SECTIONS.every(s => savedSections.has(s))
  const allVisited = REQUIRED_TABS.every(t => visitedTabs.has(t))
  const canPublish = allSaved || allVisited

  // ── Estados para features de asistencia ─────────────────────────────────────
  const [gbifLoading, setGbifLoading] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [copySearch, setCopySearch] = useState('')
  const [copyResults, setCopyResults] = useState<any[]>([])
  const [copySearching, setCopySearching] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)

  // ── Plantillas CRUD ───────────────────────────────────────────────────────
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [plantillaMenu, setPlantillaMenu] = useState<TipoPlantilla | null>(null) // qué menú dropdown está abierto
  const [plantillaModal, setPlantillaModal] = useState<{ tipo: TipoPlantilla; editing: Plantilla | null } | null>(null)
  const [plantillaForm, setPlantillaForm] = useState<{ nombre: string; campos: Record<string, string> }>({ nombre: '', campos: {} })

  useEffect(() => { setPlantillas(loadPlantillas()) }, [])

  const CAMPOS_INSTITUCION: { key: string; label: string; placeholder: string }[] = [
    { key: 'institutionCode', label: 'Nombre de la institución', placeholder: 'Institución Universitaria del Putumayo (UNIP)' },
    { key: 'institutionID',   label: 'NIT / ID institución',     placeholder: '800247940' },
    { key: 'basisOfRecord',   label: 'Base del registro',        placeholder: 'preservedSpecimen' },
    { key: 'type',            label: 'Tipo',                     placeholder: 'physicalObject' },
  ]

  const CAMPOS_COLECCION: { key: string; label: string; placeholder: string }[] = [
    { key: 'collectionCode', label: 'Código de la colección',   placeholder: 'HEAA' },
    { key: 'collectionID',   label: 'ID colección (GRSciColl)', placeholder: 'HEAA-ITP' },
  ]

  const CAMPOS_UBICACION: { key: string; label: string; placeholder: string }[] = [
    { key: 'country',       label: 'País',         placeholder: 'Colombia' },
    { key: 'stateProvince', label: 'Departamento', placeholder: 'Putumayo' },
    { key: 'county',        label: 'Municipio',    placeholder: 'Mocoa' },
  ]

  const openNewPlantilla = (tipo: TipoPlantilla) => {
    const camposDefault: Record<string, string> = {}
    const lista = tipo === 'institucion' ? CAMPOS_INSTITUCION : tipo === 'coleccion' ? CAMPOS_COLECCION : CAMPOS_UBICACION
    lista.forEach(c => { camposDefault[c.key] = '' })
    setPlantillaForm({ nombre: '', campos: camposDefault })
    setPlantillaModal({ tipo, editing: null })
    setPlantillaMenu(null)
  }

  const openEditPlantilla = (p: Plantilla) => {
    setPlantillaForm({ nombre: p.nombre, campos: { ...p.campos } })
    setPlantillaModal({ tipo: p.tipo, editing: p })
    setPlantillaMenu(null)
  }

  const savePlantillaForm = () => {
    if (!plantillaModal || !plantillaForm.nombre.trim()) return
    const updated = plantillaModal.editing
      ? plantillas.map(p => p.id === plantillaModal.editing!.id
          ? { ...p, nombre: plantillaForm.nombre, campos: plantillaForm.campos }
          : p)
      : [...plantillas, { id: crypto.randomUUID(), nombre: plantillaForm.nombre, tipo: plantillaModal.tipo, campos: plantillaForm.campos }]
    setPlantillas(updated)
    savePlantillas(updated)
    setPlantillaModal(null)
    toast({ title: plantillaModal.editing ? 'Plantilla actualizada' : 'Plantilla creada' })
  }

  const deletePlantilla = (id: string) => {
    const updated = plantillas.filter(p => p.id !== id)
    setPlantillas(updated)
    savePlantillas(updated)
    toast({ title: 'Plantilla eliminada' })
  }

  const applyPlantilla = (p: Plantilla) => {
    setFormData(prev => ({ ...prev, ...p.campos }))
    setPlantillaMenu(null)
    toast({ title: `Plantilla "${p.nombre}" aplicada`, description: 'Revisa y ajusta los campos pre-llenados.' })
  }

  // Autocompletado por campo
  const [acSuggestions, setAcSuggestions] = useState<Record<string, AutocompleteItem[]>>({})
  const [acOpen, setAcOpen] = useState<Record<string, boolean>>({})
  const acTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // ── Autocompletar desde BD ────────────────────────────────────────────────
  const handleAutocomplete = (field: string, value: string, acType: 'all' | 'scientific' | 'common' | 'family') => {
    handleInputChange(field, value)
    clearTimeout(acTimers.current[field])
    if (value.length < 2) { setAcSuggestions(p => ({ ...p, [field]: [] })); return }
    acTimers.current[field] = setTimeout(async () => {
      try {
        const res = await apiService.getAutocomplete(value, acType)
        if (res.success && res.data) {
          setAcSuggestions(p => ({ ...p, [field]: res.data! }))
          setAcOpen(p => ({ ...p, [field]: true }))
        }
      } catch {}
    }, 300)
  }

  const pickSuggestion = (field: string, value: string) => {
    handleInputChange(field, value)
    setAcOpen(p => ({ ...p, [field]: false }))
    setAcSuggestions(p => ({ ...p, [field]: [] }))
  }

  // ── GBIF: rellenar taxonomía desde nombre científico ─────────────────────
  // La API /species/match devuelve authorship dentro de scientificName, no como campo separado.
  // Ej: scientificName="Solanum abiaguense Knapp", canonicalName="Solanum abiaguense"
  // → authorship = "Knapp"
  const fetchGbifTaxonomy = async () => {
    const name = formData.scientificName.trim()
    if (!name) return
    setGbifLoading(true)
    try {
      const res = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}&kingdom=Plantae`, {
        headers: { 'Accept': 'application/json' }
      })
      if (!res.ok) throw new Error(`GBIF respondió ${res.status}`)
      const data = await res.json()
      if (data.matchType === 'NONE') {
        toast({ title: 'No encontrado en GBIF', description: `"${name}" no arrojó resultados. Verifica el nombre.`, variant: 'destructive' })
        return
      }
      // Extraer autoría: scientificName - canonicalName
      const authorship = (data.scientificName && data.canonicalName)
        ? data.scientificName.replace(data.canonicalName, '').trim()
        : ''
      // Epíteto: segunda palabra de canonicalName (ej. "Solanum abiaguense" → "abiaguense")
      const epithet = data.canonicalName?.split(' ')[1] || data.species?.split(' ')[1] || ''
      // rank: GBIF devuelve "SPECIES" en mayúsculas
      const rank = data.rank?.toLowerCase() || ''

      setFormData(prev => ({
        ...prev,
        family:                   data.family   || prev.family,
        orderName:                data.order    || prev.orderName,
        class:                    data.class    || prev.class,
        phylum:                   data.phylum   || prev.phylum,
        kingdom:                  data.kingdom  || prev.kingdom,
        genus:                    data.genus    || prev.genus,
        specificEpithet:          epithet       || prev.specificEpithet,
        scientificNameAuthorship: authorship    || prev.scientificNameAuthorship,
        taxonRank:                rank          || prev.taxonRank,
      }))
      toast({ title: '✅ Taxonomía completada desde GBIF', description: `Familia: ${data.family} · Confianza: ${data.confidence}%` })
    } catch (err: any) {
      toast({ title: 'Error al consultar GBIF', description: err.message || 'Verifica tu conexión a internet.', variant: 'destructive' })
    } finally {
      setGbifLoading(false)
    }
  }

  // ── GPS: rellenar coordenadas decimales ──────────────────────────────────
  const fetchGPS = () => {
    if (!navigator.geolocation) {
      toast({ title: 'GPS no disponible', description: 'Tu dispositivo no soporta geolocalización.', variant: 'destructive' })
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          decimalLatitude:  pos.coords.latitude.toFixed(6),
          decimalLongitude: pos.coords.longitude.toFixed(6),
        }))
        toast({ title: '📍 Coordenadas obtenidas', description: `Lat: ${pos.coords.latitude.toFixed(6)} · Lon: ${pos.coords.longitude.toFixed(6)}` })
        setGpsLoading(false)
      },
      () => {
        toast({ title: 'No se pudo obtener ubicación', description: 'Permite el acceso a la ubicación en tu navegador.', variant: 'destructive' })
        setGpsLoading(false)
      }
    )
  }

  // ── Copiar desde espécimen existente ─────────────────────────────────────
  const searchForCopy = async (q: string) => {
    setCopySearch(q)
    if (q.length < 2) { setCopyResults([]); return }
    setCopySearching(true)
    try {
      const res = await apiService.getPlants({ search: q, limit: 8 })
      if (res.success && res.data) setCopyResults(res.data.plants)
    } catch {}
    setCopySearching(false)
  }

  const copyFromPlant = async (id: number) => {
    try {
      const res = await apiService.getPlantById(id)
      if (!res.success || !res.data) return
      const p = res.data
      setFormData(prev => ({
        ...prev,
        scientificName:          p.scientific_name          || prev.scientificName,
        scientificNameAuthorship:p.scientific_name_authorship || prev.scientificNameAuthorship,
        family:                  p.family                   || prev.family,
        genus:                   p.genus                    || prev.genus,
        specificEpithet:         p.specific_epithet         || prev.specificEpithet,
        infraspecificEpithet:    p.infraspecific_epithet    || prev.infraspecificEpithet,
        taxonRank:               p.taxon_rank               || prev.taxonRank,
        vernacularName:          p.vernacular_name          || prev.vernacularName,
        orderName:               p.order_name               || prev.orderName,
        class:                   p.class_name               || prev.class,
        phylum:                  p.phylum                   || prev.phylum,
        kingdom:                 p.kingdom                  || prev.kingdom,
        subfamily:               p.subfamily                || prev.subfamily,
        subgenus:                p.subgenus                 || prev.subgenus,
        stateProvince:           p.state_province           || prev.stateProvince,
        county:                  p.county                   || prev.county,
        municipality:            p.municipality             || prev.municipality,
        habitat:                 p.habitat                  || prev.habitat,
        recordedBy:              p.recorded_by              || prev.recordedBy,
        samplingProtocol:        p.sampling_protocol        || prev.samplingProtocol,
        // catalogNumber y occurrenceID NO se copian — deben ser únicos
      }))
      setShowCopyModal(false)
      setCopySearch('')
      setCopyResults([])
      toast({ title: '📋 Datos copiados', description: `Basado en "${p.scientific_name}". Número de catálogo y ID de ocurrencia no se copiaron.` })
    } catch {
      toast({ title: 'Error al copiar', variant: 'destructive' })
    }
  }

  useEffect(() => {
    return () => {
      uploadedImages.forEach(image => {
        if (image.file) URL.revokeObjectURL(image.url)
      })
    }
  }, [])

  const [formData, setFormData] = useState({
    // Cols 1-3: Registro básico
    occurrenceID: '',
    basisOfRecord: '',
    type: '',
    // Cols 4-7: Institución
    institutionCode: 'Institución Universitaria del Putumayo (UNIP)',
    institutionID: '800.247.940',
    collectionCode: 'HEAA',
    collectionID: '',
    // Cols 8-10: Espécimen
    catalogNumber: '',
    recordNumber: '',
    recordedBy: '',
    // Cols 11-20: Colección
    organismQuantity: '',
    organismQuantityType: '',
    lifeStage: '',
    preparation: '',
    disposition: '',
    samplingProtocol: '',
    eventDate: '',
    habitat: '',
    fieldNumber: '',
    fieldNotes: '',
    // Cols 21-31: Ubicación
    country: 'Colombia',
    stateProvince: '',
    county: '',
    municipality: '',
    locality: '',
    minimumElevationInMeters: '',
    decimalLatitudeSexagesimal: '',
    decimalLatitude: '',
    decimalLongitudeSexagesimal: '',
    decimalLongitude: '',
    geodetic: 'WGS84',
    // Cols 32-35: Determinación
    identifiedBy: '',
    dateIdentified: '',
    updatedBy: '',
    dateUpdated: '',
    // Extra: Proyecto
    project: '',
    // Cols 36-50: Taxonomía
    scientificName: '',
    scientificNameAuthorship: '',
    kingdom: 'Plantae',
    phylum: 'Magnoliophyta',
    class: 'Equisetopsida',
    orderName: '',
    family: '',
    subfamily: '',
    genus: '',
    subgenus: '',
    specificEpithet: '',
    infraspecificEpithet: '',
    taxonRank: 'species',
    vernacularName: '',
    taxonRemarks: '',
    // Características morfológicas (extra)
    description: '',
    plantHeight: '',
    plantHabit: '',
    flowerColor: '',
    fruitColor: '',
    leafCharacteristics: '',
    uses: '',
    additionalRemarks: '',
    // Col 51: Imágenes
    photoRecord: '',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // ── Ref para saber si occurrenceID fue editado manualmente ─────────────────
  const occurrenceManualRef = useRef(false)

  // Auto-generar occurrenceID cuando cambia catalogNumber
  useEffect(() => {
    if (!occurrenceManualRef.current && formData.catalogNumber.trim()) {
      setFormData(prev => ({ ...prev, occurrenceID: `HEAA-${prev.catalogNumber.trim()}` }))
    }
  }, [formData.catalogNumber])

  // ── Sugerir siguiente número de catálogo desde el código de colección ───────
  const [catalogLoading, setCatalogLoading] = useState(false)
  const suggestCatalogNumber = async () => {
    const prefix = (formData.collectionCode || 'HEAA').trim().toUpperCase()
    setCatalogLoading(true)
    try {
      // Buscar por catalog_number con el prefijo exacto, en todos los estados
      const res = await apiService.getPlants({ catalog_number: prefix, status: 'all', limit: 500 })
      if (res.success && res.data) {
        const plants = res.data.plants as any[]
        const nums = plants
          .map((p: any) => (p.catalog_number || '').toUpperCase())
          .filter((c: string) => c.startsWith(prefix + '-'))
          .map((c: string) => parseInt(c.slice(prefix.length + 1), 10))
          .filter((n: number) => !isNaN(n))
        const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
        handleInputChange('catalogNumber', `${prefix}-${String(next).padStart(3, '0')}`)
      } else {
        handleInputChange('catalogNumber', `${prefix}-001`)
      }
    } catch {
      handleInputChange('catalogNumber', `${prefix}-001`)
    } finally {
      setCatalogLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) handleFiles(Array.from(files))
  }

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      const maxSize = 10 * 1024 * 1024
      if (!validTypes.includes(file.type)) {
        toast({ title: "Tipo de archivo no válido", description: `${file.name} no es una imagen válida`, variant: "destructive" })
        return false
      }
      if (file.size > maxSize) {
        toast({ title: "Archivo muy grande", description: `${file.name} supera los 10MB`, variant: "destructive" })
        return false
      }
      return true
    })
    if (validFiles.length === 0) return

    const newImages = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      originalName: file.name,
      isUploading: false
    }))
    setUploadedImages(prev => [...prev, ...newImages])

    validFiles.forEach(async (file) => {
      setUploadedImages(prev => prev.map(img => img.file === file ? { ...img, isUploading: true } : img))
      try {
        const response = await apiService.uploadImage(file, { entityType: 'plant', isTemporary: true })
        if (response.success && response.data) {
          setUploadedImages(prev => prev.map(img =>
            img.file === file ? { ...img, id: response.data!.id, serverUrl: response.data!.url, thumbnailUrl: response.data!.thumbnailUrl, isUploading: false } : img
          ))
        } else {
          throw new Error(response.error || 'Error al subir imagen')
        }
      } catch (error: any) {
        setUploadedImages(prev => prev.map(img =>
          img.file === file ? { ...img, isUploading: false, uploadFailed: true } : img
        ))
        const isEndpointError = error.message?.includes('Endpoint no encontrado') || error.message?.includes('404')
        if (!isEndpointError) {
          toast({ title: "Error al subir imagen", description: `${file.name}: ${error.message}`, variant: "destructive" })
        }
      }
    })
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }

  const removeImage = (index: number) => {
    const imageToRemove = uploadedImages[index]
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
    if (imageToRemove.file) URL.revokeObjectURL(imageToRemove.url)
    if (imageToRemove.id) {
      apiService.deleteImage(imageToRemove.id).catch(err => console.error('Error al eliminar imagen:', err))
    }
  }

  const prepareCommonData = () => {
    const dateToNull = (dateStr: string) => {
      if (!dateStr || dateStr.trim() === '') return null
      return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
    }
    const numToNull = (numStr: string) => (numStr && numStr.trim() !== '' ? numStr : null)

    return {
      // Taxonomía (cols 36-50)
      scientific_name: formData.scientificName || null,
      scientific_name_authorship: formData.scientificNameAuthorship || null,
      common_name: formData.vernacularName || null,
      vernacular_name: formData.vernacularName || null,
      family: formData.family || null,
      genus: formData.genus || null,
      specific_epithet: formData.specificEpithet || null,
      infraspecific_epithet: formData.infraspecificEpithet || null,
      taxon_rank: formData.taxonRank || 'species',
      taxon_remarks: formData.taxonRemarks || null,
      taxonomic_status: 'accepted',
      kingdom: formData.kingdom || 'Plantae',
      phylum: formData.phylum || 'Magnoliophyta',
      class_name: formData.class || 'Equisetopsida',
      order_name: formData.orderName || null,
      subfamily: formData.subfamily || null,
      subgenus: formData.subgenus || null,
      // Espécimen (cols 8-9)
      catalog_number: formData.catalogNumber || null,
      record_number: formData.recordNumber || null,
      // Identificación (cols 32-35)
      identified_by: formData.identifiedBy || null,
      date_identified: dateToNull(formData.dateIdentified),
      determination_date: dateToNull(formData.dateIdentified),
      determined_by: formData.identifiedBy || null,
      updated_by: formData.updatedBy || null,
      date_updated: dateToNull(formData.dateUpdated),
      type_status: 'none',
      // Institución (cols 4-7)
      institution_code: formData.institutionCode || 'Institución Universitaria del Putumayo (UNIP)',
      institution_id: formData.institutionID || '800.247.940',
      collection_code: formData.collectionCode || 'HEAA',
      collection_id: formData.collectionID || null,
      geodetic: formData.geodetic || 'WGS84',
      // Registro DwC (cols 1-3)
      occurrence_id: formData.occurrenceID || null,
      basis_of_record: formData.basisOfRecord || null,
      record_type: formData.type || null,
      // Colección (cols 10-20)
      recorded_by: formData.recordedBy || null,
      additional_collectors: null,
      event_date: dateToNull(formData.eventDate),
      organism_quantity: formData.organismQuantity || null,
      organism_quantity_type: formData.organismQuantityType || null,
      life_stage: formData.lifeStage || null,
      preparations: formData.preparation || null,
      disposition: formData.disposition || null,
      sampling_protocol: formData.samplingProtocol || null,
      field_number: formData.fieldNumber || null,
      field_notes: formData.fieldNotes || null,
      // Ubicación (cols 21-31)
      country: formData.country || 'Colombia',
      state_province: formData.stateProvince || null,
      county: formData.county || null,
      municipality: formData.municipality || null,
      locality: formData.locality || null,
      decimal_latitude: numToNull(formData.decimalLatitude),
      decimal_longitude: numToNull(formData.decimalLongitude),
      decimal_latitude_sexagesimal: formData.decimalLatitudeSexagesimal || null,
      decimal_longitude_sexagesimal: formData.decimalLongitudeSexagesimal || null,
      minimum_elevation_in_meters: numToNull(formData.minimumElevationInMeters),
      coordinate_uncertainty: null,
      georeferenced_by: null,
      // Ecología
      habitat: formData.habitat || null,
      substrate: null,
      associated_species: null,
      abundance: null,
      reproductive_state: formData.lifeStage || null,
      // Morfología
      plant_habit: formData.plantHabit || null,
      height_min: numToNull(formData.plantHeight),
      height_max: null,
      description: formData.description || null,
      distinguishing_features: formData.leafCharacteristics || null,
      flower_color: formData.flowerColor || null,
      fruit_color: formData.fruitColor || null,
      leaf_characteristics: formData.leafCharacteristics || null,
      // Uso y conservación
      uses: formData.uses || null,
      care_instructions: null,
      conservation_status: 'NE',
      // Sistema
      status: 'draft',
      featured: false,
      observations: formData.additionalRemarks || null,
      notes: formData.fieldNotes || null,
      // Proyecto (cols 51-52)
      project: formData.project || null,
      photo_record: formData.photoRecord || null,
    }
  }

  // Validaciones ligeras por sección (no bloquean, solo advierten)
  const warnMissingFields = (sectionName: string): boolean => {
    const warnings: Record<string, { field: string; label: string }[]> = {
      'Registro':    [{ field: 'catalogNumber', label: 'Número de catálogo' }, { field: 'recordedBy', label: 'Registrado por' }],
      'Colección':   [{ field: 'eventDate', label: 'Fecha del evento' }],
      'Ubicación':   [{ field: 'locality', label: 'Localidad' }],
      'Taxonomía':   [{ field: 'scientificName', label: 'Nombre científico' }, { field: 'family', label: 'Familia' }, { field: 'genus', label: 'Género' }, { field: 'specificEpithet', label: 'Epíteto específico' }],
    }
    const checks = warnings[sectionName] || []
    const missing = checks.filter(c => !formData[c.field as keyof typeof formData])
    if (missing.length > 0) {
      toast({
        title: `Campos incompletos en ${sectionName}`,
        description: `Falta: ${missing.map(c => c.label).join(', ')}. Se guardará como borrador.`,
      })
    }
    return true // siempre permite guardar como borrador
  }

  const savePlantSection = async (sectionName: string) => {
    // Protección contra doble clic (ref es síncrono, estado es asíncrono)
    if (isSavingRef.current) return
    isSavingRef.current = true
    setIsSavingSection(true)

    try {
      if (!apiService.isAuthenticated()) {
        toast({ title: "Sesión requerida", description: "Debes iniciar sesión como administrador.", variant: "destructive" })
        return
      }

      // Advertir campos faltantes sin bloquear
      warnMissingFields(sectionName)

      // Avisar si hay imágenes aún subiendo
      if (uploadedImages.some(img => img.isUploading)) {
        toast({ title: "Imágenes subiendo", description: "Algunas imágenes todavía se están subiendo a Cloudinary. Se guardarán al finalizar." })
      }

      const plantData: any = prepareCommonData()

      // Si se guarda la sección Imágenes, incluir las imágenes ya subidas
      if (sectionName === 'Imágenes') {
        const readyImages = uploadedImages.filter(img => img.id && !img.isUploading)
        if (readyImages.length > 0) {
          plantData.localImages = readyImages.map(img => ({
            id: img.id,
            url: img.serverUrl || img.url,
            thumbnailUrl: img.thumbnailUrl,
            filename: img.originalName,
            originalName: img.originalName
          }))
        }
      }

      // Usar ref (síncrono) en lugar de state (puede estar desactualizado)
      const currentPlantId = plantIdRef.current
      let response

      if (currentPlantId) {
        response = await apiService.updatePlant(currentPlantId, plantData)
      } else {
        response = await apiService.createPlant(plantData)
      }

      if (response.success) {
        // El backend devuelve { success, data: { id, ... } }
        const resultId = response.data?.id
        if (!currentPlantId && resultId) {
          plantIdRef.current = resultId
          setPlantId(resultId)
        }
        toast({ title: "Sección guardada", description: `La sección "${sectionName}" fue guardada correctamente.` })
        setSavedSections(prev => new Set(prev).add(sectionName))
        return true
      } else {
        const errMsg = response.error || 'Error al guardar'
        // Mensaje específico para número de catálogo duplicado
        if (errMsg.includes('herbario') || errMsg.includes('duplicate') || errMsg.includes('ER_DUP')) {
          throw new Error('El número de catálogo ya existe. Usa uno diferente o edita la planta existente.')
        }
        throw new Error(errMsg)
      }
    } catch (error: any) {
      toast({ title: "Error al guardar", description: error.message || "No se pudo guardar la sección", variant: "destructive" })
      return false
    } finally {
      isSavingRef.current = false
      setIsSavingSection(false)
    }
  }

  const saveAndContinue = async (currentSection: string, nextSection: string) => {
    const saved = await savePlantSection(currentSection)
    if (saved) setCurrentTab(nextSection)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Protección doble clic en submit (estado puede estar desactualizado al re-render)
    if (isLoading) return
    setIsLoading(true)

    try {
      if (!apiService.isAuthenticated()) {
        toast({ title: "Sesión requerida", description: "Debes iniciar sesión como administrador.", variant: "destructive" })
        router.push('/login')
        return
      }

      if (uploadedImages.some(img => img.isUploading)) {
        toast({ title: "Espera un momento", description: "Hay imágenes subiendo a Cloudinary. Por favor espera.", variant: "destructive" })
        return
      }

      // Validaciones obligatorias para publicar
      const requiredFields: Record<string, string> = {
        scientificName: 'Nombre científico',
        family: 'Familia',
        genus: 'Género',
        specificEpithet: 'Epíteto específico',
        locality: 'Localidad',
        recordedBy: 'Registrado por'
      }
      for (const [field, label] of Object.entries(requiredFields)) {
        if (!formData[field as keyof typeof formData]) {
          toast({ title: "Campo requerido", description: `El campo "${label}" es obligatorio para finalizar`, variant: "destructive" })
          return
        }
      }

      const plantData: any = prepareCommonData()
      plantData.status = 'published'

      // Incluir imágenes (solo las que subieron correctamente a Cloudinary)
      const imageList = uploadedImages.filter(img => !img.isUploading)
      if (imageList.length > 0) {
        plantData.localImages = imageList.map(img => ({
          id: img.id,
          file: img.uploadFailed ? img.file : undefined, // reintentar subida si falló
          url: img.serverUrl || img.url,
          thumbnailUrl: img.thumbnailUrl,
          filename: img.originalName,
          originalName: img.originalName
        }))
      }

      // Usar ref (síncrono) — evita estado stale en rapid re-renders
      const currentPlantId = plantIdRef.current
      const response = currentPlantId
        ? await apiService.updatePlant(currentPlantId, plantData)
        : await apiService.createPlant(plantData)

      if (response.success) {
        toast({ title: "¡Planta creada exitosamente!", description: "La información del espécimen fue guardada correctamente." })
        router.push('/admin/plantas')
      } else {
        const errMsg = response.error || 'Error al crear el espécimen'
        if (errMsg.includes('herbario') || errMsg.includes('duplicate') || errMsg.includes('ER_DUP')) {
          throw new Error('El número de catálogo ya existe. Usa uno diferente o edita la planta existente.')
        }
        throw new Error(errMsg)
      }
    } catch (error: any) {
      toast({ title: "Error al crear espécimen", description: error.message || "Hubo un error al guardar la información", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const SectionButtons = ({ sectionName, nextTab }: { sectionName: string; nextTab: string }) => (
    <div className="flex justify-between pt-4">
      <Button type="button" variant="outline" onClick={() => savePlantSection(sectionName)} disabled={isSavingSection}>
        {isSavingSection ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : <><Save className="mr-2 h-4 w-4" />Guardar Sección</>}
      </Button>
      <Button type="button" onClick={() => saveAndContinue(sectionName, nextTab)} disabled={isSavingSection}>
        {isSavingSection ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar y Continuar'}
      </Button>
    </div>
  )

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Añadir Nueva Planta</h1>
          <p className="text-muted-foreground">Completa el formulario para añadir un nuevo espécimen al herbario</p>
        </div>
        <div className="flex gap-2">
          {/* Basado en... */}
          <Button type="button" variant="outline" onClick={() => setShowCopyModal(true)}>
            <Copy className="mr-2 h-4 w-4" />Basado en...
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/plantas"><ArrowLeft className="mr-2 h-4 w-4" />Volver</Link>
          </Button>
        </div>
      </div>

      {/* Modal gestión plantillas */}
      <PlantillaModal
        plantillaModal={plantillaModal}
        plantillaForm={plantillaForm}
        setPlantillaForm={setPlantillaForm}
        setPlantillaModal={setPlantillaModal}
        onSave={savePlantillaForm}
        camposInstitucion={CAMPOS_INSTITUCION}
        camposColeccion={CAMPOS_COLECCION}
        camposUbicacion={CAMPOS_UBICACION}
      />

      {/* Modal copiar desde espécimen */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Basado en espécimen existente</h2>
              <Button type="button" variant="ghost" size="icon" onClick={() => { setShowCopyModal(false); setCopySearch(''); setCopyResults([]) }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Busca una planta existente para copiar sus datos taxonómicos y de colecta. El número de catálogo e ID no se copian.</p>
            <div className="relative">
              <Input placeholder="Nombre científico, familia, género..." value={copySearch}
                onChange={e => searchForCopy(e.target.value)} autoFocus />
              {copySearching && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <div className="mt-2 max-h-60 overflow-y-auto rounded-md border">
              {copyResults.length === 0 && copySearch.length >= 2 && !copySearching && (
                <p className="p-4 text-sm text-muted-foreground text-center">Sin resultados</p>
              )}
              {copyResults.map(plant => (
                <button key={plant.id} type="button"
                  className="w-full px-4 py-3 text-left text-sm hover:bg-muted border-b last:border-0 transition-colors"
                  onClick={() => copyFromPlant(plant.id)}>
                  <p className="font-medium italic">{plant.scientific_name}</p>
                  <p className="text-xs text-muted-foreground">{plant.family} · {plant.catalog_number}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <Tabs
          value={currentTab}
          onValueChange={(tab) => { setCurrentTab(tab); setVisitedTabs(prev => new Set(prev).add(tab)) }}
          className="w-full"
        >
          {/* Orden de tabs = orden columnas Excel BD_Gral_HEAA */}
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 w-full">
            {[
              { value: 'registro',        label: 'Registro' },
              { value: 'coleccion',       label: 'Colección' },
              { value: 'ubicacion',       label: 'Ubicación' },
              { value: 'taxonomia',       label: 'Taxonomía' },
              { value: 'caracteristicas', label: 'Características' },
              { value: 'imagenes',        label: 'Imágenes' },
            ].map(({ value, label }) => (
              <TabsTrigger key={value} value={value} className="flex items-center gap-1">
                {savedSections.has(label)
                  ? <CheckCircle2 className="h-3 w-3 text-green-500" />
                  : visitedTabs.has(value)
                  ? <CheckCircle2 className="h-3 w-3 text-muted-foreground/50" />
                  : null}
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── TAB 1: REGISTRO (cols 1-10) ─────────────────────────────── */}
          <TabsContent value="registro" className="space-y-6 mt-6">

            {/* cols 1-3: DwC básico */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Registro</CardTitle>
                <CardDescription>Datos básicos del registro biológico (Darwin Core)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="occurrenceID">ID del registro biológico</Label>
                    <div className="relative">
                      <Input id="occurrenceID" placeholder="Se genera automáticamente desde el N° de catálogo"
                        value={formData.occurrenceID}
                        onChange={e => {
                          occurrenceManualRef.current = true
                          handleInputChange('occurrenceID', e.target.value)
                        }} />
                      {!occurrenceManualRef.current && formData.occurrenceID && (
                        <span className="absolute right-2 top-2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Auto</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Se genera como <code>HEAA-{'{'}N° catálogo{'}'}</code>. Puedes editarlo.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basisOfRecord">Base del registro</Label>
                    <Select value={formData.basisOfRecord} onValueChange={v => handleInputChange('basisOfRecord', v)}>
                      <SelectTrigger id="basisOfRecord"><SelectValue placeholder="Selecciona una opción" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preservedSpecimen" title="Espécimen físico preservado (prensado, secado, alcohol). Aplica a la mayoría de colecciones de herbario.">Espécimen preservado</SelectItem>
                        <SelectItem value="livingSpecimen" title="Organismo vivo mantenido en cultivo, jardín botánico o laboratorio.">Espécimen vivo</SelectItem>
                        <SelectItem value="fossilSpecimen" title="Restos o impresiones de organismos preservados en roca u otro medio geológico.">Espécimen fósil</SelectItem>
                        <SelectItem value="humanObservation" title="Registro basado en observación directa sin colecta de material físico.">Observación humana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select value={formData.type} onValueChange={v => handleInputChange('type', v)}>
                      <SelectTrigger id="type"><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physicalObject" title="Objeto físico tangible: lámina de herbario, frasco con tejido, etc. Es el valor estándar para especímenes de herbario.">Objeto físico</SelectItem>
                        <SelectItem value="event" title="Evento de colecta o muestreo en campo, sin espécimen físico asociado.">Evento</SelectItem>
                        <SelectItem value="location" title="Registro centrado en el lugar geográfico, no en el organismo.">Localidad</SelectItem>
                        <SelectItem value="identification" title="Registro de la determinación taxonómica del espécimen.">Identificación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* cols 4-5: Institución */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Institución</CardTitle>
                    <CardDescription>Datos de la institución custodia del herbario</CardDescription>
                  </div>
                  <PlantillaDropdown
                    tipo="institucion"
                    plantillas={plantillas}
                    open={plantillaMenu === 'institucion'}
                    onToggle={() => setPlantillaMenu(p => p === 'institucion' ? null : 'institucion')}
                    onApply={applyPlantilla}
                    onNew={() => openNewPlantilla('institucion')}
                    onEdit={openEditPlantilla}
                    onDelete={deletePlantilla}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="institutionCode">Nombre de la institución</Label>
                    <Input id="institutionCode" value={formData.institutionCode}
                      onChange={e => handleInputChange('institutionCode', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="institutionID">NIT / ID de la institución</Label>
                    <Input id="institutionID" value={formData.institutionID}
                      onChange={e => handleInputChange('institutionID', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* cols 6-7: Colección */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Colección</CardTitle>
                    <CardDescription>Código e ID de la colección específica donde se ingresa el espécimen</CardDescription>
                  </div>
                  <PlantillaDropdown
                    tipo="coleccion"
                    plantillas={plantillas}
                    open={plantillaMenu === 'coleccion'}
                    onToggle={() => setPlantillaMenu(p => p === 'coleccion' ? null : 'coleccion')}
                    onApply={applyPlantilla}
                    onNew={() => openNewPlantilla('coleccion')}
                    onEdit={openEditPlantilla}
                    onDelete={deletePlantilla}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="collectionCode">Código de la colección</Label>
                    <Input id="collectionCode" placeholder="Ej. HEAA-MOC"
                      value={formData.collectionCode}
                      onChange={e => handleInputChange('collectionCode', e.target.value)} />
                    <p className="text-xs text-muted-foreground">El catálogo se generará como <strong>{formData.collectionCode || 'CÓDIGO'}-001</strong></p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collectionID">ID de la colección (GRSciColl)</Label>
                    <Input id="collectionID" placeholder="Ej. HEAA-ITP"
                      value={formData.collectionID} onChange={e => handleInputChange('collectionID', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* cols 8-10: Espécimen */}
            <Card>
              <CardHeader>
                <CardTitle>Datos del Espécimen</CardTitle>
                <CardDescription>Número de catálogo, registro y colector</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="catalogNumber">Número de catálogo *</Label>
                    <div className="flex gap-2">
                      <Input id="catalogNumber"
                        placeholder={`Ej. ${formData.collectionCode || 'HEAA'}-001`}
                        required
                        value={formData.catalogNumber}
                        onChange={e => handleInputChange('catalogNumber', e.target.value)} />
                      <Button type="button" variant="outline" size="sm" onClick={suggestCatalogNumber}
                        disabled={catalogLoading || !formData.collectionCode.trim()}
                        title="Generar siguiente número basado en el código de colección">
                        {catalogLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hash className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Presiona # para auto-generar el siguiente número de la colección</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recordNumber">Número de registro</Label>
                    <Input id="recordNumber" placeholder="Ej. AO4604"
                      value={formData.recordNumber} onChange={e => handleInputChange('recordNumber', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recordedBy">Registrado por *</Label>
                    <Input id="recordedBy" placeholder="Ej. Andrés Orejuela / Guerly León" required
                      value={formData.recordedBy} onChange={e => handleInputChange('recordedBy', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <SectionButtons sectionName="Registro" nextTab="coleccion" />
          </TabsContent>

          {/* ── TAB 2: COLECCIÓN (cols 11-20) ───────────────────────────── */}
          <TabsContent value="coleccion" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de Colección</CardTitle>
                <CardDescription>Datos sobre la recolección y preparación del espécimen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* cols 11-12: cantidad organismo — tipo como Select */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="organismQuantity">Cantidad del organismo</Label>
                    <Input id="organismQuantity" placeholder="Ej. 3"
                      value={formData.organismQuantity} onChange={e => handleInputChange('organismQuantity', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organismQuantityType">Tipo de cantidad</Label>
                    <Select value={formData.organismQuantityType} onValueChange={v => handleInputChange('organismQuantityType', v)}>
                      <SelectTrigger id="organismQuantityType"><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individuos">Individuos</SelectItem>
                        <SelectItem value="muestras">Muestras</SelectItem>
                        <SelectItem value="ramets">Ramets</SelectItem>
                        <SelectItem value="colonias">Colonias</SelectItem>
                        <SelectItem value="parcelas">Parcelas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* cols 13-15: lifeStage, preparations, disposition */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="lifeStage">Etapa de vida</Label>
                    <Select value={formData.lifeStage} onValueChange={v => handleInputChange('lifeStage', v)}>
                      <SelectTrigger id="lifeStage"><SelectValue placeholder="Selecciona una etapa" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="floracion">Floración</SelectItem>
                        <SelectItem value="fructificacion">Fructificación</SelectItem>
                        <SelectItem value="vegetativo">Vegetativo</SelectItem>
                        <SelectItem value="semilla">Semilla</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preparation">Preparaciones</Label>
                    <Select value={formData.preparation} onValueChange={v => handleInputChange('preparation', v)}>
                      <SelectTrigger id="preparation"><SelectValue placeholder="Tipo de preparación" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exsicado">Exsicado botánico</SelectItem>
                        <SelectItem value="muestra_tejido">Muestra de tejido</SelectItem>
                        <SelectItem value="semillas">Semillas</SelectItem>
                        <SelectItem value="polen">Polen</SelectItem>
                        <SelectItem value="fotografia">Solo fotografía</SelectItem>
                        <SelectItem value="alcohol">En alcohol</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="disposition">Disposición</Label>
                    <Select value={formData.disposition} onValueChange={v => handleInputChange('disposition', v)}>
                      <SelectTrigger id="disposition"><SelectValue placeholder="Selecciona disposición" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enColeccion">En colección</SelectItem>
                        <SelectItem value="prestamo">En préstamo</SelectItem>
                        <SelectItem value="perdido">Perdido</SelectItem>
                        <SelectItem value="destruido">Destruido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* cols 16-17-19: samplingProtocol, eventDate, fieldNumber */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="samplingProtocol">Protocolo de muestreo</Label>
                    <Select value={formData.samplingProtocol} onValueChange={v => handleInputChange('samplingProtocol', v)}>
                      <SelectTrigger id="samplingProtocol"><SelectValue placeholder="Selecciona protocolo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="coleccion_general">Colección general</SelectItem>
                        <SelectItem value="transecto">Transecto</SelectItem>
                        <SelectItem value="parcela">Parcela</SelectItem>
                        <SelectItem value="punto_conteo">Punto de conteo</SelectItem>
                        <SelectItem value="oportunista">Oportunista</SelectItem>
                        <SelectItem value="red_neblina">Red de neblina</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Fecha del evento</Label>
                    <Input id="eventDate" type="date"
                      value={formData.eventDate} onChange={e => handleInputChange('eventDate', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fieldNumber">Número de campo</Label>
                    <Input id="fieldNumber" placeholder="Ej. AO4604"
                      value={formData.fieldNumber} onChange={e => handleInputChange('fieldNumber', e.target.value)} />
                  </div>
                </div>

                {/* col 18: habitat (entre eventDate y fieldNumber en el Excel) */}
                <div className="space-y-2">
                  <Label htmlFor="habitat">Hábitat</Label>
                  <Input id="habitat" placeholder="Descripción del hábitat donde se colectó el espécimen"
                    value={formData.habitat} onChange={e => handleInputChange('habitat', e.target.value)} />
                </div>

                {/* col 20: fieldNotes */}
                <div className="space-y-2">
                  <Label htmlFor="fieldNotes">Notas de campo</Label>
                  <Textarea id="fieldNotes" rows={3}
                    placeholder="Ej. Árbol 5 m. Cáliz verde, corola blanca, anteras amarillas."
                    value={formData.fieldNotes} onChange={e => handleInputChange('fieldNotes', e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <SectionButtons sectionName="Colección" nextTab="ubicacion" />
          </TabsContent>

          {/* ── TAB 3: UBICACIÓN (cols 21-31) ───────────────────────────── */}
          <TabsContent value="ubicacion" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Ubicación Geográfica</CardTitle>
                    <CardDescription>Información sobre la localidad donde se recolectó el espécimen</CardDescription>
                  </div>
                  <PlantillaDropdown
                    tipo="ubicacion"
                    plantillas={plantillas}
                    open={plantillaMenu === 'ubicacion'}
                    onToggle={() => setPlantillaMenu(p => p === 'ubicacion' ? null : 'ubicacion')}
                    onApply={applyPlantilla}
                    onNew={() => openNewPlantilla('ubicacion')}
                    onEdit={openEditPlantilla}
                    onDelete={deletePlantilla}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* cols 21-22: country, stateProvince — selects cascados */}
                {(() => {
                  const PAISES = [
                    'Colombia','Venezuela','Ecuador','Perú','Brasil','Bolivia','Argentina','Chile',
                    'Paraguay','Uruguay','México','Guatemala','Honduras','El Salvador','Nicaragua',
                    'Costa Rica','Panamá','Cuba','España','Estados Unidos','Otro',
                  ]
                  const DEPARTAMENTOS: Record<string, string[]> = {
                    Colombia: [
                      'Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas',
                      'Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca',
                      'Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta','Nariño',
                      'Norte de Santander','Putumayo','Quindío','Risaralda',
                      'San Andrés y Providencia','Santander','Sucre','Tolima',
                      'Valle del Cauca','Vaupés','Vichada','Bogotá D.C.',
                    ],
                  }
                  const MUNICIPIOS: Record<string, string[]> = {
                    Amazonas: ['Leticia','Puerto Nariño','El Encanto','La Chorrera','La Pedrera','La Victoria','Mirití-Paraná','Puerto Alegría','Puerto Arica','Puerto Santander','Tarapacá'],
                    Antioquia: ['Medellín','Abejorral','Abriaquí','Alejandría','Amagá','Amalfi','Andes','Angelópolis','Angostura','Anorí','Anzá','Apartadó','Arboletes','Argelia','Armenia','Barbosa','Belmira','Bello','Betania','Betulia','Briceño','Buriticá','Cáceres','Caicedo','Caldas','Campamento','Cañasgordas','Caracolí','Caramanta','Carepa','Carolina','Caucasia','Chigorodó','Cisneros','Cocorná','Concepción','Concordia','Copacabana','Dabeiba','Donmatías','Ebéjico','El Bagre','El Carmen de Viboral','El Santuario','Entrerríos','Envigado','Fredonia','Frontino','Giraldo','Girardota','Gómez Plata','Granada','Guadalupe','Guarne','Guatapé','Heliconia','Hispania','Itagüí','Ituango','Jardín','Jericó','La Ceja','La Estrella','La Pintada','La Unión','Liborina','Maceo','Marinilla','Montebello','Murindó','Mutatá','Nariño','Necoclí','Nechí','Olaya','Peñol','Peque','Pueblorrico','Puerto Berrío','Puerto Nare','Puerto Triunfo','Remedios','Retiro','Rionegro','Sabanalarga','Sabaneta','Salgar','San Andrés de Cuerquia','San Carlos','San Francisco','San Jerónimo','San José de la Montaña','San Juan de Urabá','San Luis','San Pedro de los Milagros','San Pedro de Urabá','San Rafael','San Roque','San Vicente Ferrer','Santa Bárbara','Santa Rosa de Osos','Santo Domingo','Segovia','Sonsón','Sopetrán','Støfregard','Tarazá','Tarso','Titiribí','Toledo','Turbo','Uramita','Urrao','Valdivia','Valparaíso','Vegachí','Venecia','Vigía del Fuerte','Yalí','Yarumal','Yolombó','Yondó','Zaragoza'],
                    Arauca: ['Arauca','Arauquita','Cravo Norte','Fortul','Puerto Rondón','Saravena','Tame'],
                    Atlántico: ['Barranquilla','Baranoa','Campo de la Cruz','Candelaria','Galapa','Juan de Acosta','Luruaco','Malambo','Manatí','Palmar de Varela','Piojó','Polonuevo','Ponedera','Puerto Colombia','Repelón','Sabanagrande','Sabanalarga','Santa Lucía','Santo Tomás','Soledad','Suan','Tubará','Usiacurí'],
                    Bolívar: ['Cartagena','Achí','Altos del Rosario','Arenal','Arjona','Arroyohondo','Barranco de Loba','Calamar','Cantagallo','Cicuco','Clemencia','Córdoba','El Carmen de Bolívar','El Guamo','El Peñón','Hatillo de Loba','Magangué','Mahates','Margarita','María La Baja','Mompós','Montecristo','Morales','Norosí','Pinillos','Regidor','Río Viejo','San Cristóbal','San Estanislao','San Fernando','San Jacinto','San Jacinto del Cauca','San Juan Nepomuceno','San Martín de Loba','San Pablo','Santa Catalina','Santa Rosa','Santa Rosa del Sur','Simití','Soplaviento','Talaigua Nuevo','Tiquisio','Turbaco','Turbaná','Villanueva','Zambrano'],
                    Boyacá: ['Tunja','Almeida','Aquitania','Arcabuco','Belén','Berbeo','Betéitiva','Boavita','Boyacá','Briceño','Buenavista','Busbanzá','Caldas','Campohermoso','Cerinza','Chinavita','Chiquinquirá','Chíquiza','Chiscas','Chita','Chitaraque','Chivatá','Ciénega','Cómbita','Coper','Corrales','Covarachía','Cubará','Cucaita','Cuítiva','Duitama','El Cocuy','El Espino','Firavitoba','Floresta','Gachantivá','Gameza','Garagoa','Guacamayas','Guateque','Guayatá','Güicán','Iza','Jenesano','Jericó','La Capilla','La Uvita','La Victoria','Labranzagrande','Macanal','Maripí','Miraflores','Mongua','Monguí','Moniquirá','Motavita','Muzo','Nobsa','Nuevo Colón','Oicatá','Otanche','Pachavita','Páez','Paipa','Pajarito','Panqueba','Pauna','Paya','Paz de Río','Pesca','Pisba','Puerto Boyacá','Quípama','Ramiriquí','Ráquira','Rondón','Saboyá','Sáchica','Samacá','San Eduardo','San José de Pare','San Luis de Gaceno','San Mateo','San Miguel de Sema','San Pablo de Borbur','Santana','Santa María','Santa Rosa de Viterbo','Santa Sofía','Sativanorte','Sativasur','Siachoque','Soatá','Socotá','Socha','Sogamoso','Somondoco','Sora','Soracá','Sotaquirá','Susacón','Sutamarchán','Sutatenza','Tasco','Tenza','Tibaná','Tibasosa','Tinjacá','Tipacoque','Toca','Togüí','Tópaga','Tota','Turmequé','Tuta','Tutazá','Umbita','Ventaquemada','Villa de Leyva','Viracachá','Zetaquira'],
                    Caldas: ['Manizales','Aguadas','Anserma','Aranzazu','Belalcázar','Chinchiná','Filadelfia','La Dorada','La Merced','Manzanares','Marmato','Marquetalia','Marulanda','Neira','Norcasia','Pácora','Palestina','Pensilvania','Riosucio','Robledo','Salamina','Samaná','San José','Supía','Victoria','Villamaría','Viterbo'],
                    Caquetá: ['Florencia','Albania','Belén de los Andaquíes','Cartagena del Chairá','Curillo','El Doncello','El Paujil','La Montañita','Milán','Morelia','Puerto Rico','San José del Fragua','San Vicente del Caguán','Solano','Solita','Valparaíso'],
                    Casanare: ['Yopal','Aguazul','Chámeza','Hato Corozal','La Salina','Maní','Monterrey','Nunchía','Orocué','Paz de Ariporo','Pore','Recetor','Sabanalarga','Sácama','San Luis de Palenque','Támara','Tauramena','Trinidad','Villanueva'],
                    Cauca: ['Popayán','Almaguer','Argelia','Balboa','Bolívar','Buenos Aires','Cajibío','Caldono','Caloto','Corinto','El Tambo','Florencia','Guachené','Guapi','Inzá','Jambaló','La Sierra','La Vega','López de Micay','Mercaderes','Miranda','Morales','Padilla','Páez','Patía','Piamonte','Piendamó','Puerto Tejada','Puracé','Rosas','San Sebastián','Santa Rosa','Santander de Quilichao','Silvia','Sotara','Suárez','Sucre','Timbío','Timbiquí','Toribío','Totoró','Villa Rica'],
                    Cesar: ['Valledupar','Aguachica','Agustín Codazzi','Astrea','Becerril','Bosconia','Chimichagua','Chiriguaná','Curumaní','El Copey','El Paso','Gamarra','González','La Gloria','La Jagua de Ibirico','La Paz','Manaure','Pailitas','Pelaya','Pueblo Bello','Río de Oro','San Alberto','San Diego','San Martín','Tamalameque'],
                    Chocó: ['Quibdó','Acandí','Alto Baudó','Atrato','Bagadó','Bahía Solano','Bajo Baudó','Bojayá','Carmen del Darién','Cértegui','Condoto','El Cantón del San Pablo','El Carmen de Atrato','El Litoral del San Juan','Istmina','Juradó','Lloró','Medio Atrato','Medio Baudó','Medio San Juan','Nóvita','Nuquí','Río Iro','Río Quito','Riosucio','San José del Palmar','Sipí','Tadó','Unguía','Unión Panamericana'],
                    Córdoba: ['Montería','Ayapel','Buenavista','Canalete','Cereté','Chimá','Chinú','Ciénaga de Oro','Cotorra','La Apartada','Lorica','Los Córdobas','Momil','Montelíbano','Moñitos','Planeta Rica','Pueblo Nuevo','Puerto Escondido','Puerto Libertador','Purísima','Sahagún','San Andrés de Sotavento','San Antero','San Bernardo del Viento','San Carlos','San José de Uré','San Pelayo','Santa Cruz de Lorica','Tierralta','Tuchín','Valencia'],
                    Cundinamarca: ['Bogotá D.C.','Agua de Dios','Albán','Anapoima','Anolaima','Apulo','Arbeláez','Beltrán','Bituima','Bojacá','Cabrera','Cachipay','Cajicá','Caparrapí','Cáqueza','Carmen de Carupa','Chaguaní','Chía','Chipaque','Choachí','Chocontá','Cogua','Cota','Cucunubá','El Colegio','El Peñón','El Rosal','Facatativá','Fómeque','Fosca','Funza','Fúquene','Fusagasugá','Gachalá','Gachancipá','Gachetá','Gama','Girardot','Granada','Guachetá','Guaduas','Guasca','Guataquí','Guatavita','Guayabal de Síquima','Guayabetal','Gutiérrez','Jerusalén','Junín','La Calera','La Mesa','La Palma','La Peña','La Vega','Lenguazaque','Machetá','Madrid','Manta','Medina','Mosquera','Nariño','Nemocón','Nilo','Nimaima','Nocaima','Ospina Pérez','Pacho','Paime','Pandi','Paratebueno','Pasca','Puerto Salgar','Pulí','Quebradanegra','Quetame','Quipile','Ricaurte','San Antonio del Tequendama','San Bernardo','San Cayetano','San Francisco','San Juan de Río Seco','Sasaima','Sesquilé','Sibaté','Silvania','Simijaca','Soacha','Sopó','Subachoque','Suesca','Supatá','Susa','Sutatausa','Tabio','Tausa','Tena','Tibacuy','Tibirita','Tocaima','Tocancipá','Topaipí','Ubalá','Ubaque','Ubaté','Une','Útica','Venecia','Vergara','Vianí','Villagómez','Villapinzón','Villeta','Viotá','Yacopí','Zipacón','Zipaquirá'],
                    Guainía: ['Inírida','Barranco Minas','Cacahual','La Guadalupe','Mapiripana','Morichal','Pana Pana','Puerto Colombia','San Felipe'],
                    Guaviare: ['San José del Guaviare','Calamar','El Retorno','Miraflores'],
                    Huila: ['Neiva','Acevedo','Agrado','Aipe','Algeciras','Altamira','Baraya','Campoalegre','Colombia','Elías','Garzón','Gigante','Guadalupe','Hobo','Iquira','Isnos','La Argentina','La Plata','Nataga','Oporapa','Paicol','Palermo','Palestina','Pital','Pitalito','Rivera','Saladoblanco','San Agustín','Santa María','Suaza','Tarqui','Tello','Teruel','Tesalia','Timaná','Villavieja','Yaguará'],
                    'La Guajira': ['Riohacha','Albania','Barrancas','Dibulla','Distracción','El Molino','Fonseca','Hatonuevo','La Jagua del Pilar','Maicao','Manaure','San Juan del Cesar','Uribia','Urumita','Villanueva'],
                    Magdalena: ['Santa Marta','Algarrobo','Aracataca','Ariguaní','Cerro de San Antonio','Chivolo','Ciénaga','Concordia','El Banco','El Piñón','El Retén','Fundación','Guamal','Nueva Granada','Pedraza','Pijiño del Carmen','Pivijay','Plato','Puebloviejo','Remolino','Sabanas de San Ángel','Salamina','San Sebastián de Buenavista','San Zenón','Santa Ana','Santa Bárbara de Pinto','Sitionuevo','Tenerife','Zapayán','Zona Bananera'],
                    Meta: ['Villavicencio','Acacías','Barranca de Upía','Cabuyaro','Castilla la Nueva','Cubarral','Cumaral','El Calvario','El Castillo','El Dorado','Fuente de Oro','Granada','Guamal','La Macarena','La Uribe','Lejanías','Mapiripán','Mesetas','Puerto Concordia','Puerto Gaitán','Puerto Lleras','Puerto López','Puerto Rico','Restrepo','San Carlos de Guaroa','San Juan de Arama','San Juanito','San Martín','Vistahermosa'],
                    Nariño: ['Pasto','Albán','Aldana','Ancuyá','Arboleda','Barbacoas','Belén','Buesaco','Chachagüí','Colón','Consacá','Contadero','Córdoba','Cuaspud','Cumbal','Cumbitara','El Charco','El Peñol','El Rosario','El Tablón de Gómez','El Tambo','Francisco Pizarro','Funes','Guachucal','Guaitarilla','Gualmatán','Iles','Imués','Ipiales','La Cruz','La Florida','La Llanada','La Tola','La Unión','Leiva','Linares','Los Andes','Magüí','Mallama','Mosquera','Nariño','Olaya Herrera','Ospina','Policarpa','Potosí','Providencia','Puerres','Pupiales','Ricaurte','Roberto Payán','Samaniego','San Bernardo','San Lorenzo','San Pablo','San Pedro de Cartago','Sandoná','Santa Bárbara','Santacruz','Sapuyes','Taminango','Tangua','Tumaco','Túquerres','Yacuanquer'],
                    'Norte de Santander': ['Cúcuta','Ábrego','Arboledas','Bochalema','Bucarasica','Cáchira','Cácota','Chinácota','Chitagá','Convención','Cucutilla','Durania','El Carmen','El Tarra','El Zulia','Gramalote','Hacarí','Herrán','Labateca','La Esperanza','La Playa','Los Patios','Lourdes','Mutiscua','Ocaña','Pamplona','Pamplonita','Puerto Santander','Ragonvalia','Salazar','San Calixto','San Cayetano','Santiago','Sardinata','Silos','Teorama','Tibú','Toledo','Villa Caro','Villa del Rosario'],
                    Putumayo: ['Mocoa','Colón','Orito','Puerto Asís','Puerto Caicedo','Puerto Guzmán','Puerto Leguízamo','San Francisco','San Miguel','Santiago','Sibundoy','Valle del Guamuez','Villagarzón'],
                    Quindío: ['Armenia','Buenavista','Calarcá','Circasia','Córdoba','Filandia','Génova','La Tebaida','Montenegro','Pijao','Quimbaya','Salento'],
                    Risaralda: ['Pereira','Apía','Balboa','Belén de Umbría','Dosquebradas','Guática','La Celia','La Virginia','Marsella','Mistrató','Pueblo Rico','Quinchía','Santa Rosa de Cabal','Santuario'],
                    'San Andrés y Providencia': ['San Andrés','Providencia'],
                    Santander: ['Bucaramanga','Aguada','Albania','Aratoca','Barbosa','Barichara','Barrancabermeja','Betulia','Bolívar','Cabrera','California','Capitanejo','Carcasí','Cepitá','Cerrito','Charalá','Charta','Chima','Chipatá','Cimitarra','Confines','Contratación','Coromoro','Curití','El Carmen de Chucurí','El Guacamayo','El Peñón','El Playón','Encino','Enciso','Floridablanca','Galán','Gámbita','Girón','Guaca','Guadalupe','Guapotá','Guavatá','Güepsa','Hato','Jesús María','Jordán','La Belleza','La Paz','Landázuri','Lebrija','Los Santos','Macaravita','Málaga','Matanza','Mogotes','Molagavita','Ocamonte','Oiba','Onzaga','Palmar','Palmas del Socorro','Páramo','Piedecuesta','Pinchote','Puente Nacional','Puerto Parra','Puerto Wilches','Rionegro','Sabana de Torres','San Andrés','San Benito','San Gil','San Joaquín','San José de Miranda','San Miguel','San Vicente de Chucurí','Santa Bárbara','Santa Helena del Opón','Simacota','Socorro','Suaita','Sucre','Suratá','Tona','Valle de San José','Vélez','Vetas','Villanueva','Zapatoca'],
                    Sucre: ['Sincelejo','Buenavista','Caimito','Chalán','Colosó','Corozal','Coveñas','El Roble','Galeras','Guaranda','La Unión','Los Palmitos','Majagual','Morroa','Ovejas','Palmito','Sampués','San Benito Abad','San Juan de Betulia','San Marcos','San Onofre','San Pedro','Santiago de Tolú','Sincé','Sucre','Tolú Viejo'],
                    Tolima: ['Ibagué','Alpujarra','Alvarado','Ambalema','Anzoátegui','Armero','Ataco','Cajamarca','Carmen de Apicalá','Casabianca','Chaparral','Coello','Coyaima','Cunday','Dolores','Espinal','Falan','Flandes','Fresno','Guamo','Herveo','Honda','Icononzo','Lérida','Líbano','Mariquita','Melgar','Murillo','Natagaima','Ortega','Palocabildo','Piedras','Planadas','Prado','Purificación','Rioblanco','Roncesvalles','Rovira','Saldaña','San Antonio','San Luis','Santa Isabel','Suárez','Valle de San Juan','Venadillo','Villahermosa','Villarrica'],
                    'Valle del Cauca': ['Cali','Alcalá','Andalucía','Ansermanuevo','Argelia','Bolívar','Buenaventura','Buga','Bugalagrande','Caicedonia','Calima','Candelaria','Cartago','Dagua','El Águila','El Cairo','El Cerrito','El Dovio','El Darién','Florida','Ginebra','Guacarí','Jamundí','La Cumbre','La Unión','La Victoria','Obando','Palmira','Pradera','Restrepo','Riofrío','Roldanillo','San Pedro','Sevilla','Toro','Trujillo','Tuluá','Ulloa','Versalles','Vijes','Yotoco','Yumbo','Zarzal'],
                    Vaupés: ['Mitú','Carurú','Pacoa','Papunaua','Taraira','Yavaraté'],
                    Vichada: ['Puerto Carreño','Cumaribo','La Primavera','Santa Rosalía'],
                    'Bogotá D.C.': ['Bogotá D.C.'],
                  }

                  const deptos = DEPARTAMENTOS[formData.country] || []
                  const municipios = MUNICIPIOS[formData.stateProvince] || []

                  return (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="country">País</Label>
                          <Select
                            value={formData.country}
                            onValueChange={v => {
                              handleInputChange('country', v)
                              handleInputChange('stateProvince', '')
                              handleInputChange('county', '')
                            }}
                          >
                            <SelectTrigger id="country"><SelectValue placeholder="Selecciona un país" /></SelectTrigger>
                            <SelectContent>
                              {PAISES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="stateProvince">Departamento / Región</Label>
                          {deptos.length > 0 ? (
                            <Select
                              value={formData.stateProvince}
                              onValueChange={v => {
                                handleInputChange('stateProvince', v)
                                handleInputChange('county', '')
                              }}
                            >
                              <SelectTrigger id="stateProvince"><SelectValue placeholder="Selecciona un departamento" /></SelectTrigger>
                              <SelectContent className="max-h-72">
                                {deptos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input id="stateProvince" placeholder="Ej. Putumayo"
                              value={formData.stateProvince} onChange={e => handleInputChange('stateProvince', e.target.value)} />
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="county">Municipio</Label>
                          {municipios.length > 0 ? (
                            <Select value={formData.county} onValueChange={v => handleInputChange('county', v)}>
                              <SelectTrigger id="county"><SelectValue placeholder="Selecciona un municipio" /></SelectTrigger>
                              <SelectContent className="max-h-72">
                                {municipios.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input id="county" placeholder="Ej. Mocoa"
                              value={formData.county} onChange={e => handleInputChange('county', e.target.value)} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="municipality">Centro poblado / Vereda</Label>
                          <Input id="municipality" placeholder="Ej. Las Mesas"
                            value={formData.municipality} onChange={e => handleInputChange('municipality', e.target.value)} />
                        </div>
                      </div>
                    </>
                  )
                })()}

                {/* col 25: locality */}
                <div className="space-y-2">
                  <Label htmlFor="locality">Localidad *</Label>
                  <Textarea id="locality" rows={2} required
                    placeholder="Ej. Vía Mocoa - San Francisco, arriba de la vereda Las Mesas"
                    value={formData.locality} onChange={e => handleInputChange('locality', e.target.value)} />
                </div>

                {/* col 26: minimumElevationInMeters */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="minimumElevationInMeters">Elevación mínima (m.s.n.m.)</Label>
                    <Input id="minimumElevationInMeters" type="number" placeholder="Ej. 1300"
                      value={formData.minimumElevationInMeters} onChange={e => handleInputChange('minimumElevationInMeters', e.target.value)} />
                  </div>
                </div>

                {/* cols 27-30: coordenadas decimales + GPS */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Coordenadas (decimal)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={fetchGPS} disabled={gpsLoading}
                      title="Obtener coordenadas automáticamente desde tu dispositivo">
                      {gpsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                      {gpsLoading ? 'Obteniendo...' : 'Usar mi ubicación'}
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="decimalLatitude" className="text-xs text-muted-foreground">Latitud decimal</Label>
                      <Input id="decimalLatitude" placeholder="Ej. 1.0934 (neg = Sur)"
                        value={formData.decimalLatitude} onChange={e => handleInputChange('decimalLatitude', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="decimalLongitude" className="text-xs text-muted-foreground">Longitud decimal</Label>
                      <Input id="decimalLongitude" placeholder="Ej. -76.7333 (neg = Oeste)"
                        value={formData.decimalLongitude} onChange={e => handleInputChange('decimalLongitude', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* col 31: geodeticDatum */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="geodetic">Datum geodésico</Label>
                    <Input id="geodetic" placeholder="Ej. WGS84"
                      value={formData.geodetic} onChange={e => handleInputChange('geodetic', e.target.value)} />
                  </div>
                </div>

                {/* Vista previa en mapa */}
                {formData.decimalLatitude && formData.decimalLongitude && (
                  <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Coordenadas registradas</p>
                      <p className="text-xs text-muted-foreground">
                        {formData.decimalLatitude}, {formData.decimalLongitude}
                        {formData.county && ` · ${formData.county}`}
                        {formData.stateProvince && `, ${formData.stateProvince}`}
                      </p>
                    </div>
                    <a
                      href={`/plantas?lat=${formData.decimalLatitude}&lng=${formData.decimalLongitude}&zoom=14`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ver en mapa
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <SectionButtons sectionName="Ubicación" nextTab="taxonomia" />
          </TabsContent>

          {/* ── TAB 4: TAXONOMÍA (cols 32-50) ───────────────────────────── */}
          <TabsContent value="taxonomia" className="space-y-6 mt-6">

            {/* cols 32-35: Determinación e identificación */}
            <Card>
              <CardHeader>
                <CardTitle>Determinación e Identificación</CardTitle>
                <CardDescription>Datos de quien identificó el espécimen y confirmó la determinación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="identifiedBy">Identificado por</Label>
                    <Input id="identifiedBy" placeholder="Ej. Andrés Orejuela"
                      value={formData.identifiedBy} onChange={e => handleInputChange('identifiedBy', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateIdentified">Fecha de identificación</Label>
                    <Input id="dateIdentified" type="date"
                      value={formData.dateIdentified} onChange={e => handleInputChange('dateIdentified', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project">Proyecto</Label>
                  <Input id="project"
                    placeholder="Ej. Diversidad de la familia Solanaceae a lo largo del gradiente altitudinal Mocoa - San Francisco"
                    value={formData.project} onChange={e => handleInputChange('project', e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* cols 36-50: Taxonomía */}
            <Card>
              <CardHeader>
                <CardTitle>Información Taxonómica</CardTitle>
                <CardDescription>Clasificación taxonómica del espécimen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* cols 36-37: scientificName, scientificNameAuthorship */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="scientificName">Nombre científico *</Label>
                    <div className="flex gap-2">
                      <Input id="scientificName" placeholder="Ej. Solanum abiaguense" required
                        value={formData.scientificName} onChange={e => handleInputChange('scientificName', e.target.value)} />
                      <Button type="button" variant="outline" size="sm" onClick={fetchGbifTaxonomy}
                        disabled={gbifLoading || !formData.scientificName.trim()}
                        title="Consultar GBIF y rellenar familia, orden, clase, filo y autoría automáticamente">
                        {gbifLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Escribe el nombre y presiona ✨ para autocompletar taxonomía desde GBIF</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scientificNameAuthorship">Autoría del nombre científico</Label>
                    <Input id="scientificNameAuthorship" placeholder="Se rellena automáticamente con GBIF"
                      value={formData.scientificNameAuthorship} onChange={e => handleInputChange('scientificNameAuthorship', e.target.value)} />
                  </div>
                </div>

                {/* cols 38-40: kingdom, phylum, class */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="kingdom">Reino</Label>
                    <Input id="kingdom" placeholder="Ej. Plantae"
                      value={formData.kingdom} onChange={e => handleInputChange('kingdom', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phylum">Filo</Label>
                    <Input id="phylum" placeholder="Ej. Magnoliophyta"
                      value={formData.phylum} onChange={e => handleInputChange('phylum', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">Clase</Label>
                    <Input id="class" placeholder="Ej. Equisetopsida"
                      value={formData.class} onChange={e => handleInputChange('class', e.target.value)} />
                  </div>
                </div>

                {/* cols 41-43: order, family, subfamily */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="order">Orden</Label>
                    <Input id="order" placeholder="Se rellena con GBIF ✨"
                      value={formData.orderName} onChange={e => handleInputChange('orderName', e.target.value)} />
                  </div>
                  {/* Familia con autocompletado */}
                  <div className="space-y-2 relative">
                    <Label htmlFor="family">Familia *</Label>
                    <Input id="family" placeholder="Ej. Solanaceae" required autoComplete="off"
                      value={formData.family}
                      onChange={e => handleAutocomplete('family', e.target.value, 'family')}
                      onBlur={() => setTimeout(() => setAcOpen(p => ({ ...p, family: false })), 150)} />
                    {acOpen['family'] && acSuggestions['family']?.length > 0 && (
                      <div className="absolute z-50 w-full rounded-md border bg-background shadow-lg top-[64px]">
                        {acSuggestions['family'].map(s => (
                          <button key={s.id} type="button" onMouseDown={() => pickSuggestion('family', s.value)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted border-b last:border-0">{s.label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subfamily">Subfamilia</Label>
                    <Input id="subfamily" placeholder="Subfamilia (opcional)"
                      value={formData.subfamily} onChange={e => handleInputChange('subfamily', e.target.value)} />
                  </div>
                </div>

                {/* cols 44-46: genus, subgenus, specificEpithet */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Género con autocompletado */}
                  <div className="space-y-2 relative">
                    <Label htmlFor="genus">Género *</Label>
                    <Input id="genus" placeholder="Ej. Solanum" required autoComplete="off"
                      value={formData.genus}
                      onChange={e => handleAutocomplete('genus', e.target.value, 'scientific')}
                      onBlur={() => setTimeout(() => setAcOpen(p => ({ ...p, genus: false })), 150)} />
                    {acOpen['genus'] && acSuggestions['genus']?.length > 0 && (
                      <div className="absolute z-50 w-full rounded-md border bg-background shadow-lg top-[64px]">
                        {acSuggestions['genus'].map(s => (
                          <button key={s.id} type="button" onMouseDown={() => pickSuggestion('genus', s.value)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted border-b last:border-0">{s.label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subgenus">Subgénero</Label>
                    <Input id="subgenus" placeholder="Subgénero (opcional)"
                      value={formData.subgenus} onChange={e => handleInputChange('subgenus', e.target.value)} />
                  </div>
                  {/* Epíteto con autocompletado */}
                  <div className="space-y-2 relative">
                    <Label htmlFor="specificEpithet">Epíteto específico *</Label>
                    <Input id="specificEpithet" placeholder="Ej. abiaguense" required autoComplete="off"
                      value={formData.specificEpithet}
                      onChange={e => handleAutocomplete('specificEpithet', e.target.value, 'scientific')}
                      onBlur={() => setTimeout(() => setAcOpen(p => ({ ...p, specificEpithet: false })), 150)} />
                    {acOpen['specificEpithet'] && acSuggestions['specificEpithet']?.length > 0 && (
                      <div className="absolute z-50 w-full rounded-md border bg-background shadow-lg top-[64px]">
                        {acSuggestions['specificEpithet'].map(s => (
                          <button key={s.id} type="button" onMouseDown={() => pickSuggestion('specificEpithet', s.value)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted border-b last:border-0">{s.label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* cols 47-50: infraspecificEpithet, taxonRank, vernacularName, taxonRemarks */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="infraspecificEpithet">Epíteto infraespecífico</Label>
                    <Input id="infraspecificEpithet" placeholder="Opcional"
                      value={formData.infraspecificEpithet} onChange={e => handleInputChange('infraspecificEpithet', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxonRank">Categoría del taxón</Label>
                    <Select value={formData.taxonRank} onValueChange={v => handleInputChange('taxonRank', v)}>
                      <SelectTrigger id="taxonRank"><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="species">Especie</SelectItem>
                        <SelectItem value="subspecies">Subespecie</SelectItem>
                        <SelectItem value="variety">Variedad</SelectItem>
                        <SelectItem value="form">Forma</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vernacularName">Nombre común</Label>
                    <Input id="vernacularName" placeholder="Nombre común (opcional)"
                      value={formData.vernacularName} onChange={e => handleInputChange('vernacularName', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxonRemarks">Comentarios del taxón</Label>
                  <Textarea id="taxonRemarks" rows={3} placeholder="Comentarios adicionales sobre el taxón..."
                    value={formData.taxonRemarks} onChange={e => handleInputChange('taxonRemarks', e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <SectionButtons sectionName="Taxonomía" nextTab="caracteristicas" />
          </TabsContent>

          {/* ── TAB 5: CARACTERÍSTICAS (morfológicas extra) ──────────────── */}
          <TabsContent value="caracteristicas" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Características del Espécimen</CardTitle>
                <CardDescription>Descripción morfológica y ecológica detallada</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción general</Label>
                  <Textarea id="description" rows={4} placeholder="Descripción detallada del espécimen..."
                    value={formData.description} onChange={e => handleInputChange('description', e.target.value)} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="plantHeight">Altura de la planta (m)</Label>
                    <Input id="plantHeight" type="number" step="0.1" placeholder="Ej. 5.0"
                      value={formData.plantHeight} onChange={e => handleInputChange('plantHeight', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plantHabit">Hábito de crecimiento</Label>
                    <Select value={formData.plantHabit} onValueChange={v => handleInputChange('plantHabit', v)}>
                      <SelectTrigger id="plantHabit"><SelectValue placeholder="Selecciona un hábito" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="arbol">Árbol</SelectItem>
                        <SelectItem value="arbusto">Arbusto</SelectItem>
                        <SelectItem value="hierba">Hierba</SelectItem>
                        <SelectItem value="trepadora">Trepadora</SelectItem>
                        <SelectItem value="epifita">Epífita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="flowerColor">Color de la flor</Label>
                    <Input id="flowerColor" placeholder="Ej. Corola blanca, anteras amarillas"
                      value={formData.flowerColor} onChange={e => handleInputChange('flowerColor', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fruitColor">Color del fruto</Label>
                    <Input id="fruitColor" placeholder="Color del fruto (si aplica)"
                      value={formData.fruitColor} onChange={e => handleInputChange('fruitColor', e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="leafCharacteristics">Características de las hojas</Label>
                    <Textarea id="leafCharacteristics" rows={3} placeholder="Descripción de las hojas..."
                      value={formData.leafCharacteristics} onChange={e => handleInputChange('leafCharacteristics', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uses">Usos</Label>
                    <Textarea id="uses" rows={3} placeholder="Usos tradicionales o conocidos..."
                      value={formData.uses} onChange={e => handleInputChange('uses', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalRemarks">Observaciones adicionales</Label>
                  <Textarea id="additionalRemarks" rows={3} placeholder="Cualquier otra información relevante..."
                    value={formData.additionalRemarks} onChange={e => handleInputChange('additionalRemarks', e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <SectionButtons sectionName="Características" nextTab="imagenes" />
          </TabsContent>

          {/* ── TAB 6: IMÁGENES (col 51 + multimedia) ───────────────────── */}
          <TabsContent value="imagenes" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Imágenes del Espécimen</CardTitle>
                <CardDescription>Fotografías y documentación visual (se suben a Cloudinary)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-5">
                  <div
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center transition-colors ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
                    onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  >
                    <div className="mb-4 rounded-full bg-primary/10 p-3">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-1 text-lg font-semibold">Arrastra y suelta imágenes</h3>
                    <p className="mb-4 text-sm text-muted-foreground">O haz clic para seleccionar archivos</p>
                    <Button variant="outline" size="sm" type="button"
                      onClick={() => document.getElementById('file-input')?.click()}>
                      Seleccionar archivos
                    </Button>
                    <input id="file-input" type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-md border bg-muted overflow-hidden">
                        {image.isUploading ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                          </div>
                        ) : (
                          <>
                            <img src={image.url} alt={image.originalName} className="w-full h-full object-cover" />
                            <Button variant="destructive" size="icon" type="button"
                              className="absolute right-1 top-1 h-6 w-6" onClick={() => removeImage(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                            {image.id && !image.isUploading && !image.uploadFailed && (
                              <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            {image.uploadFailed && !image.isUploading && (
                              <div className="absolute bottom-1 right-1 bg-yellow-500 text-white rounded-full p-1" title="Solo vista previa local">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                    <div className="flex aspect-square items-center justify-center rounded-md border border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => document.getElementById('file-input')?.click()}>
                      <Button variant="ghost" size="icon" type="button"><Plus className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>

                {/* col 51: photoRecord */}
                <div className="mt-6 space-y-2">
                  <Label htmlFor="photoRecord">Fotografía en Montaje</Label>
                  <Select value={formData.photoRecord} onValueChange={v => handleInputChange('photoRecord', v)}>
                    <SelectTrigger id="photoRecord"><SelectValue placeholder="¿Tiene fotografía en montaje?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="si">Sí</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Resumen de imágenes:</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>📁 {uploadedImages.length} imagen(es) seleccionada(s)</p>
                      {uploadedImages.filter(img => img.id && !img.uploadFailed).length > 0 && (
                        <p className="text-green-600">✅ {uploadedImages.filter(img => img.id && !img.uploadFailed).length} ya subida(s) a Cloudinary</p>
                      )}
                      {uploadedImages.filter(img => img.isUploading).length > 0 && (
                        <p className="text-blue-600">⏳ {uploadedImages.filter(img => img.isUploading).length} subiendo...</p>
                      )}
                      {uploadedImages.filter(img => img.uploadFailed || (!img.id && !img.isUploading)).length > 0 && (
                        <p className="text-orange-600">📤 {uploadedImages.filter(img => img.uploadFailed || (!img.id && !img.isUploading)).length} se subirá(n) al guardar el espécimen</p>
                      )}
                    </div>
                    <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700 border border-blue-200">
                      💡 Todas las imágenes se almacenan en Cloudinary. Solo se guarda el enlace en la base de datos.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => savePlantSection('Imágenes')} disabled={isSavingSection}>
                {isSavingSection ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : <><Save className="mr-2 h-4 w-4" />Guardar Sección</>}
              </Button>
              <div className="space-x-2">
                {plantId && (
                  <Button type="button" variant="outline" onClick={() => router.push(`/admin/plantas/${plantId}/editar`)}>
                    Ir a Editar
                  </Button>
                )}
                <Button type="submit" disabled={isLoading || !canPublish} className="bg-green-600 hover:bg-green-700"
                  title={!canPublish ? 'Visita o guarda todas las secciones para habilitar' : undefined}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Finalizando...</> : 'Finalizar y Publicar'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-6 border-t">
          <div className="flex items-center space-x-4">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/plantas')}>Cancelar</Button>
            {plantId && <div className="text-sm text-muted-foreground">✅ Borrador guardado (ID: {plantId})</div>}
          </div>
          <div className="flex flex-col items-end gap-1">
            {!canPublish && (
              <p className="text-xs text-muted-foreground">
                {`${Math.max(savedSections.size, visitedTabs.size > 1 ? visitedTabs.size - 1 : 0)}/5 secciones — visita o guarda todas para publicar`}
              </p>
            )}
            <Button type="submit" className="bg-green-600 hover:bg-green-700"
              disabled={isLoading || !canPublish || uploadedImages.some(img => img.isUploading)}
              title={!canPublish ? 'Visita o guarda todas las secciones para habilitar' : undefined}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Finalizando y publicando...</>
              ) : uploadedImages.some(img => img.isUploading) ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Esperando imágenes...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {plantId ? 'Finalizar y Publicar' : 'Crear y Publicar'}
                  {uploadedImages.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">+{uploadedImages.length} img</span>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
