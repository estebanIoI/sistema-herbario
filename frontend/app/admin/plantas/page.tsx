"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Plus, Search, Edit2, Eye, Trash2, Globe, FileSpreadsheet,
  Loader2, CheckCircle2, Upload, ChevronLeft, ChevronRight, X,
  AlertCircle, BookOpen, MapPin, Calendar, ImageIcon, ExternalLink
} from "lucide-react"
import Link from "next/link"
import { apiService } from "@/lib/api"

interface Plant {
  id: number
  herbarium_number?: string
  scientific_name: string
  common_name?: string
  vernacular_name?: string
  family?: string
  genus?: string
  collector_name?: string
  collection_date?: string
  department?: string
  status: "published" | "draft" | "review" | "deleted"
  views?: number
  created_at: string
}

interface PaginationData {
  page: number; limit: number; total: number
  totalPages: number; hasNext: boolean; hasPrev: boolean
}

interface ImportResult { imported: number; errors: { row: number; error: string }[] }

// ── Mapeo de columnas Excel → campo BD ────────────────────────────────────────
const COL_MAP: Record<string, string> = {
  occurrenceid: "occurrence_id", basisofrecord: "basis_of_record", type: "record_type",
  institutioncode: "institution_code", institutionid: "institution_id",
  collectioncode: "collection_code", collectionid: "collection_id",
  catalognumber: "herbarium_number", "número de catálogo": "herbarium_number",
  "numero de catalogo": "herbarium_number", "n° catálogo": "herbarium_number",
  recordnumber: "collector_number", "número de registro": "collector_number",
  recordedby: "collector_name", "registrado por": "collector_name", colector: "collector_name",
  identifiedby: "identified_by", "identificado por": "identified_by",
  dateidentified: "date_identified", "fecha de identificación": "date_identified",
  geodeticdatum: "geodetic_datum", kingdom: "kingdom", reino: "kingdom",
  phylum: "phylum", filo: "phylum", class: "class_name", clase: "class_name",
  order: "order_name", orden: "order_name", family: "family", familia: "family",
  subfamily: "subfamily", subfamilia: "subfamily", genus: "genus",
  "género": "genus", genero: "genus", subgenus: "subgenus", "subgénero": "subgenus",
  specificepithet: "species", "epíteto específico": "species", epiteto: "species",
  infraspecificepithet: "infraspecific_epithet", taxonrank: "taxon_rank",
  scientificname: "scientific_name", "nombre científico": "scientific_name",
  "nombre cientifico": "scientific_name", "nombre_cientifico": "scientific_name",
  scientificnameauthorship: "author", autoría: "author", autoria: "author",
  vernacularname: "vernacular_name", "nombre vernáculo": "vernacular_name",
  commonname: "common_name", "nombre común": "common_name", "nombre comun": "common_name",
  taxonremarks: "taxon_remarks", country: "country", "país": "country", pais: "country",
  stateprovince: "department", departamento: "department",
  county: "county", municipio: "county",
  municipality: "municipality", "centro poblado": "municipality",
  locality: "specific_location", localidad: "specific_location",
  minimumelevationinmeters: "altitude", altitud: "altitude", "elevación": "altitude",
  habitat: "habitat", decimallatitude: "latitude", latitud: "latitude",
  "latitud decimal": "latitude", decimallongitude: "longitude", longitud: "longitude",
  "longitud decimal": "longitude", "latitud sexagesimal": "latitude_sexagesimal",
  "longitud sexagesimal": "longitude_sexagesimal",
  organismquantity: "organism_quantity", cantidad: "organism_quantity",
  lifestage: "life_stage", "etapa de vida": "life_stage",
  preparation: "preparation", preparación: "preparation", preparacion: "preparation",
  disposition: "disposition", disposición: "disposition", disposicion: "disposition",
  samplingprotocol: "sampling_protocol", "protocolo de muestreo": "sampling_protocol",
  eventdate: "collection_date", "fecha de colección": "collection_date",
  "fecha de coleccion": "collection_date", "fecha colección": "collection_date",
  fieldnumber: "field_number", "número de campo": "field_number",
  fieldnotes: "field_notes", "notas de campo": "field_notes",
  description: "description", descripción: "description", descripcion: "description",
  uses: "uses", usos: "uses", habit: "habit", "hábito": "habit", habito: "habit",
  flowercolor: "flower_color", "color de la flor": "flower_color",
  fruitcolor: "fruit_color", "color del fruto": "fruit_color",
  "características de hojas": "leaf_characteristics", additionalremarks: "additional_remarks",
  "observaciones adicionales": "additional_remarks", observations: "observations",
  observaciones: "observations", photorecord: "photo_record",
  "fotografía en montaje": "photo_record", updatedby: "updated_by",
  "actualizado por": "updated_by", dateupdated: "date_updated",
  "fecha de actualización": "date_updated", project: "project", proyecto: "project",
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const normalizeKey = (k: string) =>
  k.toLowerCase().trim().replace(/\s+/g, " ").replace(/[_]/g, " ")

const mapExcelRow = (row: Record<string, any>): Record<string, any> => {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(row)) {
    const dbKey = COL_MAP[normalizeKey(k)] ?? COL_MAP[k.toLowerCase()]
    if (dbKey && v !== undefined && v !== null && v !== "") {
      out[dbKey] = String(v).trim()
    }
  }
  if (!out.status) out.status = "draft"
  return out
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  published: { label: "Publicado", cls: "bg-green-100 text-green-700 border-green-200" },
  draft:     { label: "Borrador",  cls: "bg-amber-100  text-amber-700  border-amber-200"  },
  review:    { label: "Revisión",  cls: "bg-sky-100    text-sky-700    border-sky-200"    },
  deleted:   { label: "Eliminado", cls: "bg-red-100    text-red-700    border-red-200"    },
}

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"

// ── Componente principal ──────────────────────────────────────────────────────
export default function AdminPlantas() {
  const [plantas, setPlantas] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1, limit: 25, total: 0, totalPages: 0, hasNext: false, hasPrev: false,
  })
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  // Import dialog
  const [importOpen, setImportOpen] = useState(false)
  const [importRows, setImportRows] = useState<Record<string, any>[]>([])
  const [importHeaders, setImportHeaders] = useState<string[]>([])
  const [importFile, setImportFile] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedPlant, setSelectedPlant] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiService.getPlants({
        page,
        limit: 25,
        search: search || undefined,
        status: statusFilter === "all" ? "all" : statusFilter,
      })
      if (res.success && res.data?.plants) {
        setPlantas(res.data.plants)
        const p = res.data.pagination
        const totalPages = p.pages ?? Math.ceil(p.total / p.limit)
        setPagination({
          page: p.page, limit: p.limit, total: p.total,
          totalPages, hasNext: p.page < totalPages, hasPrev: p.page > 1,
        })
      } else {
        setPlantas([])
      }
    } catch { setPlantas([]) }
    finally { setLoading(false) }
  }, [page, search, statusFilter])

  useEffect(() => {
    const t = setTimeout(load, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [load])

  // Resetear a página 1 cuando cambia el filtro o búsqueda
  useEffect(() => { setPage(1) }, [search, statusFilter])

  // ── Detail modal ──────────────────────────────────────────────────────────
  const openDetail = async (id: number) => {
    setDetailOpen(true)
    setDetailLoading(true)
    setSelectedPlant(null)
    try {
      const res = await apiService.getPlantById(id)
      if (res.success && res.data) setSelectedPlant(res.data)
    } catch { /* silently fail */ }
    finally { setDetailLoading(false) }
  }

  // ── Selección ──────────────────────────────────────────────────────────────
  const toggleSelect = (id: number) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const toggleAll = () =>
    setSelected(prev =>
      prev.size === plantas.length ? new Set() : new Set(plantas.map(p => p.id))
    )

  const clearSelection = () => setSelected(new Set())

  // ── Acciones ───────────────────────────────────────────────────────────────
  const deletePlant = async (id: number) => {
    if (!confirm("¿Eliminar esta planta?")) return
    await apiService.deletePlant(id)
    load()
  }

  const publishPlant = async (id: number) => {
    await apiService.updatePlant(id, { status: "published" })
    load()
  }

  const bulkPublish = async () => {
    if (!selected.size) return
    setBulkLoading(true)
    for (const id of selected) await apiService.updatePlant(id, { status: "published" })
    setBulkLoading(false)
    clearSelection()
    load()
  }

  const bulkDelete = async () => {
    if (!confirm(`¿Eliminar ${selected.size} planta(s)?`)) return
    setBulkLoading(true)
    for (const id of selected) await apiService.deletePlant(id)
    setBulkLoading(false)
    clearSelection()
    load()
  }

  // ── Import Excel ───────────────────────────────────────────────────────────
  const parseCSVText = (text: string): Record<string, any>[] => {
    const parseLine = (line: string) => {
      const res: string[] = []; let cur = ""; let inQ = false
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ }
        else if (ch === ',' && !inQ) { res.push(cur.trim()); cur = "" }
        else { cur += ch }
      }
      res.push(cur.trim()); return res
    }
    const lines = text.replace(/\r\n/g, "\n").split("\n").filter(l => l.trim())
    if (lines.length < 2) return []
    const headers = parseLine(lines[0])
    return lines.slice(1).map(line => {
      const vals = parseLine(line)
      const row: Record<string, any> = {}
      headers.forEach((h, i) => { row[h] = vals[i] ?? "" })
      return row
    }).filter(r => Object.values(r).some(v => v !== ""))
  }

  const parseExcel = async (file: File) => {
    let data: Record<string, any>[] = []
    const ext = file.name.split(".").pop()?.toLowerCase()

    if (ext === "csv") {
      const text = await file.text()
      data = parseCSVText(text)
    } else {
      try {
        const { read, utils } = await import("xlsx")
        const buf = await file.arrayBuffer()
        const wb = read(buf, { type: "array", cellDates: true })
        const ws = wb.Sheets[wb.SheetNames[0]]
        data = utils.sheet_to_json(ws, { defval: "" })
      } catch {
        // fallback: intentar como CSV de texto
        try {
          const text = await file.text()
          data = parseCSVText(text)
        } catch {
          alert("No se pudo leer el archivo. Por favor guarda el Excel como CSV e intenta de nuevo.")
          return
        }
      }
    }

    if (!data.length) return
    setImportFile(file.name)
    setImportRows(data)
    setImportHeaders(Object.keys(data[0]))
    setImportResult(null)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) parseExcel(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) parseExcel(f)
  }

  const doImport = async () => {
    if (!importRows.length) return
    setImporting(true)
    try {
      const plants = importRows.map(mapExcelRow)
      const res = await apiService.importPlants(plants)
      if (res.success && res.data) {
        setImportResult(res.data)
        load()
      }
    } catch (e: any) {
      setImportResult({ imported: 0, errors: [{ row: 0, error: e.message }] })
    } finally { setImporting(false) }
  }

  const resetImport = () => {
    setImportRows([]); setImportHeaders([]); setImportFile(null); setImportResult(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  // ── Stats locales ──────────────────────────────────────────────────────────
  const stats = {
    total:     pagination.total,
    published: plantas.filter(p => p.status === "published").length,
    draft:     plantas.filter(p => p.status === "draft").length,
    review:    plantas.filter(p => p.status === "review").length,
  }

  const fromN = (page - 1) * pagination.limit + 1
  const toN   = Math.min(page * pagination.limit, pagination.total)

  return (
    <div className="space-y-4">
      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Herbario</h1>
          <p className="text-sm text-muted-foreground">
            {pagination.total.toLocaleString()} especímenes registrados
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setImportOpen(true); resetImport() }}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Importar Excel
          </Button>
          <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
            <Link href="/admin/plantas/nueva">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo espécimen
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, familia, colector…"
            className="pl-8 h-9 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="published">Publicados</SelectItem>
            <SelectItem value="draft">Borradores</SelectItem>
            <SelectItem value="review">En revisión</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Bulk actions ─────────────────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-muted rounded-md text-sm">
          <span className="font-medium">{selected.size} seleccionado(s)</span>
          <div className="flex gap-2 ml-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={bulkPublish} disabled={bulkLoading}>
              {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Publicar"}
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={bulkDelete} disabled={bulkLoading}>
              Eliminar
            </Button>
          </div>
          <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={clearSelection}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Tabla ────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10 pl-4">
                <Checkbox
                  checked={selected.size > 0 && selected.size === plantas.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="w-28 text-xs font-medium">Catálogo</TableHead>
              <TableHead className="text-xs font-medium">Nombre científico / Común</TableHead>
              <TableHead className="text-xs font-medium w-36">Familia</TableHead>
              <TableHead className="text-xs font-medium w-44">Colector</TableHead>
              <TableHead className="text-xs font-medium w-32">Fecha col.</TableHead>
              <TableHead className="text-xs font-medium w-28">Departamento</TableHead>
              <TableHead className="text-xs font-medium w-24">Estado</TableHead>
              <TableHead className="text-xs font-medium w-16 text-right pr-4">Vistas</TableHead>
              <TableHead className="w-20 text-right pr-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 10 }).map((__, j) => (
                    <TableCell key={j}>
                      <div className="h-3.5 bg-muted rounded animate-pulse" style={{ width: j === 2 ? "80%" : "60%" }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : plantas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-8 w-8 opacity-40" />
                    <p className="text-sm">No se encontraron especímenes</p>
                    {search && <p className="text-xs">Prueba con otro término de búsqueda</p>}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              plantas.map(p => {
                const s = STATUS_CFG[p.status] ?? STATUS_CFG.draft
                return (
                  <TableRow key={p.id} className="group hover:bg-muted/30">
                    <TableCell className="pl-4 w-10">
                      <Checkbox
                        checked={selected.has(p.id)}
                        onCheckedChange={() => toggleSelect(p.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {p.herbarium_number ?? <span className="opacity-40">—</span>}
                    </TableCell>
                    <TableCell>
                      <p className="italic text-sm font-medium leading-tight">{p.scientific_name}</p>
                      {(p.vernacular_name || p.common_name) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.vernacular_name || p.common_name}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.family ?? <span className="opacity-40">—</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[11rem] truncate">
                      {p.collector_name ?? <span className="opacity-40">—</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmtDate(p.collection_date)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.department ?? <span className="opacity-40">—</span>}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full border ${s.cls}`}>
                        {s.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground pr-4">
                      {p.views ?? 0}
                    </TableCell>
                    <TableCell className="pr-2">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openDetail(p.id)}
                          title="Ver detalles"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Link href={`/admin/plantas/${p.id}/editar`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        {p.status !== "published" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-green-600 hover:text-green-700"
                            onClick={() => publishPlant(p.id)}
                            title="Publicar"
                          >
                            <Globe className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={() => deletePlant(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Paginación ───────────────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground text-xs">
            {fromN}–{toN} de {pagination.total.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!pagination.hasPrev}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const n = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i
              if (n > pagination.totalPages) return null
              return (
                <Button
                  key={n}
                  variant={n === page ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => setPage(n)}
                >
                  {n}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!pagination.hasNext}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Dialog Importar Excel ────────────────────────────────────────── */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              Importar especímenes desde Excel
            </DialogTitle>
            <DialogDescription>
              Carga tu matriz Excel (.xlsx / .xls / .csv) con los datos del herbario.
              La primera fila debe contener los encabezados de columna.
            </DialogDescription>
          </DialogHeader>

          {!importFile ? (
            /* Zona de drop */
            <div
              className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${
                dragOver ? "border-green-500 bg-green-50" : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mx-auto h-8 w-8 mb-3 text-muted-foreground/60" />
              <p className="font-medium text-sm">Arrastra el archivo aquí o haz clic para seleccionarlo</p>
              <p className="text-xs text-muted-foreground mt-1">
                Soporta <strong>.xlsx</strong>, <strong>.xls</strong> y <strong>.csv</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                En Excel: Archivo → Guardar como → CSV (separado por comas)
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          ) : importResult ? (
            /* Resultado */
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                importResult.errors.length === 0
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                {importResult.errors.length === 0
                  ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  : <AlertCircle className="h-5 w-5 flex-shrink-0" />
                }
                <div>
                  <p className="font-medium">{importResult.imported} espécimen(es) importado(s) correctamente</p>
                  {importResult.errors.length > 0 && (
                    <p className="text-sm mt-0.5">{importResult.errors.length} fila(s) con errores</p>
                  )}
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="text-xs space-y-1 max-h-40 overflow-y-auto border rounded p-2">
                  {importResult.errors.map((e, i) => (
                    <p key={i} className="text-red-600">Fila {e.row}: {e.error}</p>
                  ))}
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" size="sm" onClick={resetImport}>Importar otro archivo</Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setImportOpen(false)}>Cerrar</Button>
              </div>
            </div>
          ) : (
            /* Vista previa */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{importFile}</span>
                  <span className="text-muted-foreground">· {importRows.length} filas</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetImport}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Mapa de columnas detectadas */}
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Columnas mapeadas:</span>{" "}
                {importHeaders
                  .filter(h => COL_MAP[normalizeKey(h)] || COL_MAP[h.toLowerCase()])
                  .map(h => COL_MAP[normalizeKey(h)] ?? COL_MAP[h.toLowerCase()])
                  .filter(Boolean)
                  .join(" · ") || "Ninguna detectada automáticamente"}
              </div>

              {/* Preview tabla */}
              <div className="border rounded overflow-auto max-h-64">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      {importHeaders.slice(0, 8).map(h => (
                        <TableHead key={h} className="text-[11px] whitespace-nowrap">{h}</TableHead>
                      ))}
                      {importHeaders.length > 8 && (
                        <TableHead className="text-[11px] text-muted-foreground">+{importHeaders.length - 8} más</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importRows.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {importHeaders.slice(0, 8).map(h => (
                          <TableCell key={h} className="text-[11px] whitespace-nowrap max-w-[120px] truncate">
                            {String(row[h] ?? "")}
                          </TableCell>
                        ))}
                        {importHeaders.length > 8 && <TableCell />}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {importRows.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  Mostrando 5 de {importRows.length} filas
                </p>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" size="sm" onClick={resetImport}>Cancelar</Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={doImport}
                  disabled={importing}
                >
                  {importing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importando…</>
                  ) : (
                    <><FileSpreadsheet className="h-4 w-4 mr-2" />Importar {importRows.length} filas</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog Detalle de Planta ─────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0">
          {detailLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedPlant ? (
            <>
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-semibold italic leading-tight">
                        {selectedPlant.scientific_name}
                      </h2>
                      {selectedPlant.author && (
                        <span className="text-sm text-muted-foreground not-italic">{selectedPlant.author}</span>
                      )}
                      <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full border ${STATUS_CFG[selectedPlant.status]?.cls ?? STATUS_CFG.draft.cls}`}>
                        {STATUS_CFG[selectedPlant.status]?.label ?? 'Borrador'}
                      </span>
                    </div>
                    {(selectedPlant.common_name || selectedPlant.vernacular_name) && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {selectedPlant.common_name}{selectedPlant.vernacular_name && selectedPlant.vernacular_name !== selectedPlant.common_name ? ` · ${selectedPlant.vernacular_name}` : ''}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                      {selectedPlant.herbarium_number && (
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                          #{selectedPlant.herbarium_number}
                        </span>
                      )}
                      {selectedPlant.family && <span>{selectedPlant.family}</span>}
                      {selectedPlant.department && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{selectedPlant.department}
                        </span>
                      )}
                      {selectedPlant.collection_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{fmtDate(selectedPlant.collection_date)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />{selectedPlant.views ?? 0} vistas
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Link href={`/admin/plantas/${selectedPlant.id}/editar`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                        <Edit2 className="h-3 w-3" />Editar
                      </Button>
                    </Link>
                    {selectedPlant.status !== 'published' && (
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1 bg-green-600 hover:bg-green-700"
                        onClick={() => { publishPlant(selectedPlant.id); setDetailOpen(false) }}
                      >
                        <Globe className="h-3 w-3" />Publicar
                      </Button>
                    )}
                    <Link href={`/plantas/${selectedPlant.id}`} target="_blank">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver página pública">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Tabs con todos los campos */}
              <Tabs defaultValue="registro" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 pt-3 border-b">
                  <TabsList className="h-8 gap-0.5">
                    <TabsTrigger value="registro" className="text-xs h-7">Registro</TabsTrigger>
                    <TabsTrigger value="taxonomia" className="text-xs h-7">Taxonomía</TabsTrigger>
                    <TabsTrigger value="coleccion" className="text-xs h-7">Colección</TabsTrigger>
                    <TabsTrigger value="ubicacion" className="text-xs h-7">Ubicación</TabsTrigger>
                    <TabsTrigger value="caracteristicas" className="text-xs h-7">Características</TabsTrigger>
                    <TabsTrigger value="imagenes" className="text-xs h-7 flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      Imágenes{selectedPlant.images?.length ? ` (${selectedPlant.images.length})` : ''}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1">
                  {/* ── Registro ───────────────────────────────────────────── */}
                  <TabsContent value="registro" className="m-0 p-6">
                    <FieldGrid>
                      <Field label="Nº Catálogo / Herbario" value={selectedPlant.herbarium_number} mono />
                      <Field label="occurrence ID" value={selectedPlant.occurrence_id} mono />
                      <Field label="Tipo de base" value={selectedPlant.basis_of_record} />
                      <Field label="Tipo de registro" value={selectedPlant.record_type} />
                      <Field label="Institución" value={selectedPlant.institution_code} />
                      <Field label="ID Institución" value={selectedPlant.institution_id} />
                      <Field label="Código colección" value={selectedPlant.collection_code} />
                      <Field label="ID Colección" value={selectedPlant.collection_id} />
                      <Field label="Datum Geodésico" value={selectedPlant.geodetic_datum} />
                      <Field label="Tipo de espécimen" value={selectedPlant.type_status} />
                      <Field label="Identificado por" value={selectedPlant.identified_by} />
                      <Field label="Fecha identificación" value={fmtDate(selectedPlant.date_identified)} />
                      <Field label="Determinado por" value={selectedPlant.determined_by} />
                      <Field label="Fecha determinación" value={fmtDate(selectedPlant.determination_date)} />
                      <Field label="Actualizado por" value={selectedPlant.updated_by} />
                      <Field label="Fecha actualización" value={fmtDate(selectedPlant.date_updated)} />
                      <Field label="Proyecto" value={selectedPlant.project} wide />
                      <Field label="Fotografía en montaje" value={selectedPlant.photo_record} wide />
                      <Field label="Estado verificación" value={selectedPlant.verification_status} />
                      <Field label="Estado taxonómico" value={selectedPlant.taxonomic_status} />
                      <Field label="Estado publicación" value={STATUS_CFG[selectedPlant.status]?.label} />
                      <Field label="Destacado" value={selectedPlant.featured ? 'Sí' : 'No'} />
                    </FieldGrid>
                  </TabsContent>

                  {/* ── Taxonomía ──────────────────────────────────────────── */}
                  <TabsContent value="taxonomia" className="m-0 p-6">
                    <FieldGrid>
                      <Field label="Nombre científico" value={selectedPlant.scientific_name} italic wide />
                      <Field label="Autor" value={selectedPlant.author} />
                      <Field label="Nombre común" value={selectedPlant.common_name} />
                      <Field label="Nombre vernáculo" value={selectedPlant.vernacular_name} />
                      <div className="col-span-2"><Separator /></div>
                      <Field label="Reino" value={selectedPlant.kingdom} />
                      <Field label="Filo" value={selectedPlant.phylum} />
                      <Field label="Clase" value={selectedPlant.class_name} />
                      <Field label="Orden" value={selectedPlant.order_name} />
                      <Field label="Familia" value={selectedPlant.family} />
                      <Field label="Subfamilia" value={selectedPlant.subfamily} />
                      <Field label="Género" value={selectedPlant.genus} italic />
                      <Field label="Subgénero" value={selectedPlant.subgenus} italic />
                      <Field label="Epíteto específico" value={selectedPlant.species} italic />
                      <Field label="Epíteto infraespecífico" value={selectedPlant.infraspecific_epithet} italic />
                      <Field label="Categoría taxonómica" value={selectedPlant.taxon_rank} />
                      <Field label="Estado taxonómico" value={selectedPlant.taxonomic_status} />
                      <Field label="Observaciones taxonómicas" value={selectedPlant.taxon_remarks} wide />
                    </FieldGrid>
                  </TabsContent>

                  {/* ── Colección ──────────────────────────────────────────── */}
                  <TabsContent value="coleccion" className="m-0 p-6">
                    <FieldGrid>
                      <Field label="Colector principal" value={selectedPlant.collector_name} />
                      <Field label="Nº colector" value={selectedPlant.collector_number} mono />
                      <Field label="Colectores adicionales" value={selectedPlant.additional_collectors} wide />
                      <Field label="Fecha de colección" value={fmtDate(selectedPlant.collection_date)} />
                      <Field label="Nº de campo" value={selectedPlant.field_number} mono />
                      <Field label="Notas de campo" value={selectedPlant.field_notes} wide />
                      <Field label="Cantidad organismo" value={selectedPlant.organism_quantity} />
                      <Field label="Tipo de cantidad" value={selectedPlant.organism_quantity_type} />
                      <Field label="Etapa de vida" value={selectedPlant.life_stage} />
                      <Field label="Tipo de preparación" value={selectedPlant.preparation} />
                      <Field label="Disposición" value={selectedPlant.disposition} />
                      <Field label="Protocolo de muestreo" value={selectedPlant.sampling_protocol} />
                    </FieldGrid>
                  </TabsContent>

                  {/* ── Ubicación ──────────────────────────────────────────── */}
                  <TabsContent value="ubicacion" className="m-0 p-6">
                    <FieldGrid>
                      <Field label="País" value={selectedPlant.country} />
                      <Field label="Departamento" value={selectedPlant.department} />
                      <Field label="Municipio / County" value={selectedPlant.county} />
                      <Field label="Centro poblado" value={selectedPlant.municipality} />
                      <Field label="Localidad específica" value={selectedPlant.specific_location} wide />
                      <div className="col-span-2"><Separator /></div>
                      <Field label="Latitud decimal" value={selectedPlant.latitude?.toString()} mono />
                      <Field label="Longitud decimal" value={selectedPlant.longitude?.toString()} mono />
                      <Field label="Latitud sexagesimal" value={selectedPlant.latitude_sexagesimal} mono />
                      <Field label="Longitud sexagesimal" value={selectedPlant.longitude_sexagesimal} mono />
                      <Field label="Altitud (m)" value={selectedPlant.altitude?.toString()} />
                      <Field label="Incertidumbre coord. (m)" value={selectedPlant.coordinate_uncertainty?.toString()} />
                      <Field label="Georeferenciado por" value={selectedPlant.georeferenced_by} />
                      <div className="col-span-2"><Separator /></div>
                      <Field label="Hábitat" value={selectedPlant.habitat} wide />
                      <Field label="Sustrato" value={selectedPlant.substrate} />
                      <Field label="Especies asociadas" value={selectedPlant.associated_species} wide />
                      <Field label="Abundancia" value={selectedPlant.abundance} />
                      <Field label="Estado reproductivo" value={selectedPlant.reproductive_state} />
                    </FieldGrid>
                  </TabsContent>

                  {/* ── Características ────────────────────────────────────── */}
                  <TabsContent value="caracteristicas" className="m-0 p-6">
                    <FieldGrid>
                      <Field label="Hábito de crecimiento" value={selectedPlant.habit} />
                      <Field label="Altura mínima (m)" value={selectedPlant.height_min?.toString()} />
                      <Field label="Altura máxima (m)" value={selectedPlant.height_max?.toString()} />
                      <Field label="DAP (cm)" value={selectedPlant.dbh?.toString()} />
                      <Field label="Color de la flor" value={selectedPlant.flower_color} />
                      <Field label="Color del fruto" value={selectedPlant.fruit_color} />
                      <Field label="Características de hojas" value={selectedPlant.leaf_characteristics} wide />
                      <Field label="Descripción general" value={selectedPlant.description} wide />
                      <Field label="Características distintivas" value={selectedPlant.distinguishing_features} wide />
                      <div className="col-span-2"><Separator /></div>
                      <Field label="Usos" value={selectedPlant.uses} wide />
                      <Field label="Instrucciones de cuidado" value={selectedPlant.care_instructions} wide />
                      <Field label="Estado de conservación" value={selectedPlant.conservation_status} />
                      <div className="col-span-2"><Separator /></div>
                      <Field label="Observaciones" value={selectedPlant.observations} wide />
                      <Field label="Notas" value={selectedPlant.notes} wide />
                      <Field label="Observaciones adicionales" value={selectedPlant.additional_remarks} wide />
                    </FieldGrid>
                  </TabsContent>

                  {/* ── Imágenes ───────────────────────────────────────────── */}
                  <TabsContent value="imagenes" className="m-0 p-6">
                    {selectedPlant.images?.length ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedPlant.images.map((img: any) => (
                          <div key={img.id} className="relative group rounded-lg overflow-hidden border bg-muted aspect-square">
                            <img
                              src={img.thumbnailUrl || img.url}
                              alt={img.caption || selectedPlant.scientific_name}
                              className="w-full h-full object-cover"
                            />
                            {img.isMain && (
                              <span className="absolute top-1.5 left-1.5 text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full font-medium">
                                Principal
                              </span>
                            )}
                            {img.caption && (
                              <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[11px] px-2 py-1 truncate">
                                {img.caption}
                              </p>
                            )}
                            <a
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors"
                            >
                              <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <ImageIcon className="h-10 w-10 mb-3 opacity-30" />
                        <p className="text-sm">Sin imágenes registradas</p>
                      </div>
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </>
          ) : (
            <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
              No se pudo cargar la información
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Helpers de presentación ────────────────────────────────────────────────────
function FieldGrid({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</dl>
}

function Field({
  label, value, wide, mono, italic,
}: {
  label: string; value?: string | null; wide?: boolean; mono?: boolean; italic?: boolean
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground mb-0.5">{label}</dt>
      <dd className={`text-sm ${mono ? "font-mono" : ""} ${italic ? "italic" : ""} ${!value ? "text-muted-foreground/50" : ""}`}>
        {value || "—"}
      </dd>
    </div>
  )
}
