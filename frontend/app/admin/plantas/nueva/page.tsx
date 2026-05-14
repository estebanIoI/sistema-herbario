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
import { ArrowLeft, Upload, Plus, X, Save, Loader2, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"

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
    institutionCode: 'Instituto Tecnológico del Putumayo (ITP)',
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
      scientific_name: formData.scientificName || null,
      common_name: formData.vernacularName || null,
      vernacular_name: formData.vernacularName || null,
      family: formData.family || null,
      genus: formData.genus || null,
      species: formData.specificEpithet || null,
      author: formData.scientificNameAuthorship || null,
      infraspecific_epithet: formData.infraspecificEpithet || null,
      taxonomic_status: 'accepted',
      herbarium_number: formData.catalogNumber || null,
      determination_date: dateToNull(formData.dateIdentified),
      determined_by: formData.identifiedBy || null,
      type_status: 'none',
      collector_name: formData.recordedBy || null,
      collector_number: formData.recordNumber || null,
      additional_collectors: null,
      collection_date: dateToNull(formData.eventDate),
      country: formData.country || 'Colombia',
      department: formData.stateProvince || null,
      municipality: formData.municipality || null,
      specific_location: formData.locality || null,
      latitude: numToNull(formData.decimalLatitude),
      longitude: numToNull(formData.decimalLongitude),
      altitude: numToNull(formData.minimumElevationInMeters),
      coordinate_uncertainty: null,
      georeferenced_by: null,
      habitat: formData.habitat || null,
      substrate: null,
      associated_species: null,
      abundance: null, // ENUM restringido: no se mapea desde texto libre
      reproductive_state: formData.lifeStage || null,
      habit: formData.plantHabit || null,
      height_min: numToNull(formData.plantHeight),
      height_max: null,
      description: formData.description || null,
      distinguishing_features: formData.leafCharacteristics || null,
      uses: formData.uses || null,
      care_instructions: null,
      conservation_status: 'NE',
      status: 'draft',
      featured: false,
      observations: formData.additionalRemarks || null,
      notes: formData.fieldNotes || null,
      updated_by: formData.updatedBy || null,
      date_updated: dateToNull(formData.dateUpdated),
      project: formData.project || null,
      photo_record: formData.photoRecord || null,
      county: formData.county || null,
      latitude_sexagesimal: formData.decimalLatitudeSexagesimal || null,
      longitude_sexagesimal: formData.decimalLongitudeSexagesimal || null,
      organism_quantity: formData.organismQuantity || null,
      organism_quantity_type: formData.organismQuantityType || null,
      life_stage: formData.lifeStage || null,
      preparation: formData.preparation || null,
      disposition: formData.disposition || null,
      sampling_protocol: formData.samplingProtocol || null,
      field_number: formData.fieldNumber || null,
      field_notes: formData.fieldNotes || null,
      flower_color: formData.flowerColor || null,
      fruit_color: formData.fruitColor || null,
      leaf_characteristics: formData.leafCharacteristics || null,
      occurrence_id: formData.occurrenceID || null,
      basis_of_record: formData.basisOfRecord || null,
      record_type: formData.type || null,
      identified_by: formData.identifiedBy || null,
      date_identified: dateToNull(formData.dateIdentified),
      geodetic_datum: formData.geodetic || 'WGS84',
      institution_code: formData.institutionCode || 'Instituto Tecnológico del Putumayo (ITP)',
      institution_id: formData.institutionID || '800.247.940',
      collection_code: formData.collectionCode || 'HEAA',
      collection_id: formData.collectionID || null,
      kingdom: formData.kingdom || 'Plantae',
      phylum: formData.phylum || 'Magnoliophyta',
      class_name: formData.class || 'Equisetopsida',
      order_name: formData.orderName || null,
      subfamily: formData.subfamily || null,
      subgenus: formData.subgenus || null,
      taxon_rank: formData.taxonRank || 'species',
      taxon_remarks: formData.taxonRemarks || null,
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
        <Button asChild variant="outline">
          <Link href="/admin/plantas"><ArrowLeft className="mr-2 h-4 w-4" />Volver</Link>
        </Button>
      </div>

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
                    <Input id="occurrenceID" placeholder="Ej. AO4604"
                      value={formData.occurrenceID} onChange={e => handleInputChange('occurrenceID', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basisOfRecord">Base del registro</Label>
                    <Select value={formData.basisOfRecord} onValueChange={v => handleInputChange('basisOfRecord', v)}>
                      <SelectTrigger id="basisOfRecord"><SelectValue placeholder="Selecciona una opción" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preservedSpecimen">PreservedSpecimen</SelectItem>
                        <SelectItem value="livingSpecimen">LivingSpecimen</SelectItem>
                        <SelectItem value="fossilSpecimen">FossilSpecimen</SelectItem>
                        <SelectItem value="humanObservation">HumanObservation</SelectItem>
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
                        <SelectItem value="physicalObject">PhysicalObject</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                        <SelectItem value="identification">Identification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* cols 4-7: Institución */}
            <Card>
              <CardHeader>
                <CardTitle>Información Institucional</CardTitle>
                <CardDescription>Datos de la institución y la colección</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="institutionCode">Código de la institución</Label>
                    <Input id="institutionCode" value={formData.institutionCode}
                      onChange={e => handleInputChange('institutionCode', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="institutionID">ID de la institución</Label>
                    <Input id="institutionID" value={formData.institutionID}
                      onChange={e => handleInputChange('institutionID', e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="collectionCode">Código de la colección</Label>
                    <Input id="collectionCode" value={formData.collectionCode}
                      onChange={e => handleInputChange('collectionCode', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collectionID">ID de la colección</Label>
                    <Input id="collectionID" placeholder="Ej. 000233"
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
                    <Input id="catalogNumber" placeholder="Ej. 000233" required
                      value={formData.catalogNumber} onChange={e => handleInputChange('catalogNumber', e.target.value)} />
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

                {/* cols 11-12: cantidad organismo */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="organismQuantity">Cantidad del organismo</Label>
                    <Input id="organismQuantity" placeholder="Cantidad"
                      value={formData.organismQuantity} onChange={e => handleInputChange('organismQuantity', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organismQuantityType">Tipo de cantidad</Label>
                    <Input id="organismQuantityType" placeholder="Ej. Individuos, muestras"
                      value={formData.organismQuantityType} onChange={e => handleInputChange('organismQuantityType', e.target.value)} />
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
                    <Input id="preparation" placeholder="Ej. Exsicado botánico"
                      value={formData.preparation} onChange={e => handleInputChange('preparation', e.target.value)} />
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
                    <Input id="samplingProtocol" placeholder="Ej. Colección general"
                      value={formData.samplingProtocol} onChange={e => handleInputChange('samplingProtocol', e.target.value)} />
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
                <CardTitle>Ubicación Geográfica</CardTitle>
                <CardDescription>Información sobre la localidad donde se recolectó el espécimen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* cols 21-22: country, stateProvince */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input id="country" placeholder="Ej. Colombia"
                      value={formData.country} onChange={e => handleInputChange('country', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stateProvince">Departamento</Label>
                    <Input id="stateProvince" placeholder="Ej. Putumayo"
                      value={formData.stateProvince} onChange={e => handleInputChange('stateProvince', e.target.value)} />
                  </div>
                </div>

                {/* cols 23-24: county, municipality */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="county">Municipio</Label>
                    <Input id="county" placeholder="Ej. Mocoa"
                      value={formData.county} onChange={e => handleInputChange('county', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="municipality">Centro poblado / Cabecera municipal</Label>
                    <Input id="municipality" placeholder="Ej. Las Mesas"
                      value={formData.municipality} onChange={e => handleInputChange('municipality', e.target.value)} />
                  </div>
                </div>

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

                {/* cols 27-28: decimalLatitude sexagesimal → decimal (orden Excel) */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="decimalLatitudeSexagesimal">Latitud sexagesimal</Label>
                    <Input id="decimalLatitudeSexagesimal" placeholder={`Ej. 01°04'42"`}
                      value={formData.decimalLatitudeSexagesimal} onChange={e => handleInputChange('decimalLatitudeSexagesimal', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="decimalLatitude">Latitud decimal</Label>
                    <Input id="decimalLatitude" placeholder="Ej. 1.0934"
                      value={formData.decimalLatitude} onChange={e => handleInputChange('decimalLatitude', e.target.value)} />
                  </div>
                </div>

                {/* cols 29-30: decimalLongitude sexagesimal → decimal (orden Excel) */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="decimalLongitudeSexagesimal">Longitud sexagesimal</Label>
                    <Input id="decimalLongitudeSexagesimal" placeholder={`Ej. 76°44'00"`}
                      value={formData.decimalLongitudeSexagesimal} onChange={e => handleInputChange('decimalLongitudeSexagesimal', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="decimalLongitude">Longitud decimal</Label>
                    <Input id="decimalLongitude" placeholder="Ej. -76.7333"
                      value={formData.decimalLongitude} onChange={e => handleInputChange('decimalLongitude', e.target.value)} />
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="updatedBy">Actualizado/Confirmado por</Label>
                    <Input id="updatedBy" placeholder="Nombre de quien actualizó o confirmó"
                      value={formData.updatedBy} onChange={e => handleInputChange('updatedBy', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateUpdated">Fecha de actualización/Confirmación</Label>
                    <Input id="dateUpdated" type="date"
                      value={formData.dateUpdated} onChange={e => handleInputChange('dateUpdated', e.target.value)} />
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
                    <Input id="scientificName" placeholder="Ej. Solanum abiaguense" required
                      value={formData.scientificName} onChange={e => handleInputChange('scientificName', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scientificNameAuthorship">Autoría del nombre científico</Label>
                    <Input id="scientificNameAuthorship" placeholder="Ej. S. Knapp"
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
                    <Input id="order" placeholder="Ej. Solanales"
                      value={formData.orderName} onChange={e => handleInputChange('orderName', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="family">Familia *</Label>
                    <Input id="family" placeholder="Ej. Solanaceae" required
                      value={formData.family} onChange={e => handleInputChange('family', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subfamily">Subfamilia</Label>
                    <Input id="subfamily" placeholder="Subfamilia (opcional)"
                      value={formData.subfamily} onChange={e => handleInputChange('subfamily', e.target.value)} />
                  </div>
                </div>

                {/* cols 44-46: genus, subgenus, specificEpithet */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="genus">Género *</Label>
                    <Input id="genus" placeholder="Ej. Solanum" required
                      value={formData.genus} onChange={e => handleInputChange('genus', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subgenus">Subgénero</Label>
                    <Input id="subgenus" placeholder="Subgénero (opcional)"
                      value={formData.subgenus} onChange={e => handleInputChange('subgenus', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specificEpithet">Epíteto específico *</Label>
                    <Input id="specificEpithet" placeholder="Ej. abiaguense" required
                      value={formData.specificEpithet} onChange={e => handleInputChange('specificEpithet', e.target.value)} />
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
