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
import { DatePicker } from "@/components/date-picker"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"

export default function NuevaPlantaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingSection, setIsSavingSection] = useState(false)
  const [plantId, setPlantId] = useState<number | null>(null) // ID de la planta guardada parcialmente
  const plantIdRef = useRef<number | null>(null) // Ref para acceso síncrono al ID
  const [currentTab, setCurrentTab] = useState("registro")
  const [uploadedImages, setUploadedImages] = useState<Array<{
    id?: number;
    file?: File;
    url: string; // URL local para vista previa
    serverUrl?: string; // URL del servidor después de subir
    thumbnailUrl?: string;
    originalName: string;
    isUploading?: boolean;
    uploadFailed?: boolean; // Marca si falló la subida al servidor
  }>>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [savedSections, setSavedSections] = useState<Set<string>>(new Set())
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['registro']))

  const REQUIRED_SECTIONS = ['Registro', 'Taxonomía', 'Ubicación', 'Colección', 'Características']
  const REQUIRED_TABS = ['registro', 'taxonomia', 'ubicacion', 'coleccion', 'caracteristicas']
  const allSaved = REQUIRED_SECTIONS.every(s => savedSections.has(s))
  const allVisited = REQUIRED_TABS.every(t => visitedTabs.has(t))
  const canPublish = allSaved || allVisited
  
  // Cleanup function for URL objects
  useEffect(() => {
    return () => {
      uploadedImages.forEach(image => {
        if (image.file) {
          URL.revokeObjectURL(image.url)
        }
      })
    }
  }, [])
  
  // Form state - organized by sections
  const [formData, setFormData] = useState({
    // Registro
    occurrenceID: '',
    basisOfRecord: '',
    type: '',
    recordedBy: '',
    catalogNumber: '',
    recordNumber: '',
    identifiedBy: '',
    dateIdentified: '',
    geodetic: 'WGS84',
    institutionCode: 'Instituto Tecnológico del Putumayo (ITP)',
    institutionID: '800.247.940',
    collectionCode: 'HEAA',
    collectionID: '',
    
    // Taxonomía
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
    
    // Ubicación
    country: 'Colombia',
    stateProvince: '',
    county: '',
    municipality: '',
    locality: '',
    minimumElevationInMeters: '',
    habitat: '',
    decimalLatitude: '',
    decimalLongitude: '',
    decimalLatitudeSexagesimal: '',
    decimalLongitudeSexagesimal: '',
    
    // Colección
    organismQuantity: '',
    organismQuantityType: '',
    lifeStage: '',
    preparation: '',
    disposition: '',
    samplingProtocol: '',
    eventDate: '',
    fieldNumber: '',
    fieldNotes: '',
    
    // Características
    description: '',
    plantHeight: '',
    plantHabit: '',
    flowerColor: '',
    fruitColor: '',
    leafCharacteristics: '',
    uses: '',
    additionalRemarks: '',
    
    // Imágenes
    photoRecord: '',

    // Actualización/Confirmación
    updatedBy: '',
    dateUpdated: '',

    // Proyecto
    project: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Funciones para manejo de imágenes
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      handleFiles(Array.from(files))
    }
  }

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      const maxSize = 10 * 1024 * 1024 // 10MB
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Tipo de archivo no válido",
          description: `${file.name} no es un tipo de imagen válido`,
          variant: "destructive"
        })
        return false
      }
      
      if (file.size > maxSize) {
        toast({
          title: "Archivo muy grande",
          description: `${file.name} es muy grande. Máximo 10MB`,
          variant: "destructive"
        })
        return false
      }
      
      return true
    })

    if (validFiles.length === 0) return

    // Agregar imágenes con preview local inmediato
    const newImages = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file), // Vista previa local inmediata
      originalName: file.name,
      isUploading: false // Empezar como no subiendo para mostrar vista previa
    }))

    // Mostrar vista previa inmediatamente
    setUploadedImages(prev => [...prev, ...newImages])

    // Intentar subir cada archivo en segundo plano (sin bloquear UI)
    validFiles.forEach(async (file, index) => {
      // Marcar como subiendo después de mostrar la vista previa
      setUploadedImages(prev => prev.map(img => 
        img.file === file ? { ...img, isUploading: true } : img
      ))

      try {
        // Verificar si el endpoint existe antes de intentar subir
        const response = await apiService.uploadImage(file, {
          entityType: 'plant',
          isTemporary: true
        })

        if (response.success && response.data) {
          // Actualizar con datos del servidor, manteniendo vista previa local
          setUploadedImages(prev => prev.map(img => 
            img.file === file ? {
              ...img,
              id: response.data!.id,
              serverUrl: response.data!.url,
              thumbnailUrl: response.data!.thumbnailUrl,
              isUploading: false
            } : img
          ))
        } else {
          throw new Error(response.error || 'Error al subir imagen')
        }
      } catch (error: any) {
        console.warn('Upload failed:', error.message || error)
        
        // Mantener la imagen con vista previa local, marcar que falló la subida
        setUploadedImages(prev => prev.map(img => 
          img.file === file ? {
            ...img,
            isUploading: false,
            uploadFailed: true // Marcar que falló la subida
          } : img
        ))

        // Solo mostrar toast para errores importantes (no para endpoint no encontrado)
        const isEndpointError = error.message?.includes('Endpoint no encontrado') || 
                               error.message?.includes('404')
        
        if (!isEndpointError) {
          toast({
            title: "Error al subir imagen",
            description: `${file.name} se muestra localmente. Error: ${error.message}`,
            variant: "destructive"
          })
        }
        // Para errores de endpoint, silenciosamente mantener solo vista previa local
      }
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const removeImage = (index: number) => {
    const imageToRemove = uploadedImages[index]
    
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
    
    // Limpiar URL temporal si existe
    if (imageToRemove.file) {
      URL.revokeObjectURL(imageToRemove.url)
    }
    
    // Si la imagen ya fue subida, eliminarla del servidor
    if (imageToRemove.id) {
      apiService.deleteImage(imageToRemove.id).catch(error => {
        console.error('Error al eliminar imagen del servidor:', error)
      })
    }
  }

  // Función para preparar datos comunes
  const prepareCommonData = () => {
    // Helper functions para limpiar datos
    const dateToNull = (dateStr: string) => {
      if (!dateStr || dateStr.trim() === '') return null;
      if (dateStr.includes('T')) {
        return dateStr.split('T')[0];
      }
      return dateStr;
    };

    const numToNull = (numStr: string) => {
      return numStr && numStr.trim() !== '' ? numStr : null;
    };

    // Mapear campos del formulario a campos de la base de datos
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
      abundance: formData.organismQuantity || null,
      reproductive_state: formData.lifeStage || null,
      habit: formData.plantHabit || null,
      height_min: numToNull(formData.plantHeight),
      height_max: null,
      
      description: formData.description || null,
      distinguishing_features: formData.leafCharacteristics || null,
      uses: formData.uses || null,
      care_instructions: null,
      conservation_status: 'NE',
      
      status: 'draft', // Marcar como borrador cuando se guarda por secciones
      featured: false,
      observations: formData.additionalRemarks || null,
      notes: formData.fieldNotes || null,

      // Campos de actualización y proyecto
      updated_by: formData.updatedBy || null,
      date_updated: dateToNull(formData.dateUpdated),
      project: formData.project || null,
      photo_record: formData.photoRecord || null,

      // Campos adicionales del registro
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

      // Darwin Core
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

      // Taxonomía extendida
      kingdom: formData.kingdom || 'Plantae',
      phylum: formData.phylum || 'Magnoliophyta',
      class_name: formData.class || 'Equisetopsida',
      order_name: formData.orderName || null,
      subfamily: formData.subfamily || null,
      subgenus: formData.subgenus || null,
      taxon_rank: formData.taxonRank || 'species',
      taxon_remarks: formData.taxonRemarks || null
    };
  };

  // Función para guardar o actualizar planta por secciones
  const savePlantSection = async (sectionName: string) => {
    setIsSavingSection(true);

    try {
      // Verificar autenticación
      if (!apiService.isAuthenticated()) {
        toast({
          title: "Sesión requerida",
          description: "Debes iniciar sesión como administrador.",
          variant: "destructive"
        });
        return;
      }

      const plantData = prepareCommonData();

      // Usar el ref para acceso síncrono al ID (evita problemas de timing con setState)
      const currentPlantId = plantIdRef.current;

      let response;
      if (currentPlantId) {
        // Actualizar planta existente
        response = await apiService.updatePlant(currentPlantId, plantData);
      } else {
        // Crear nueva planta
        response = await apiService.createPlant(plantData);
      }

      if (response.success && response.data) {
        // Si es primera vez, guardar el ID tanto en ref (síncrono) como en state (para re-render)
        if (!currentPlantId && response.data.id) {
          plantIdRef.current = response.data.id; // Actualización inmediata
          setPlantId(response.data.id); // Actualización del estado para UI
        }

        toast({
          title: "Sección guardada",
          description: `La sección "${sectionName}" ha sido guardada correctamente.`,
        });

        setSavedSections(prev => new Set(prev).add(sectionName));
        return true;
      } else {
        throw new Error(response.error || 'Error al guardar');
      }
    } catch (error: any) {
      console.error('Error al guardar sección:', error);
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo guardar la sección",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSavingSection(false);
    }
  };

  // Función para guardar y continuar a la siguiente sección
  const saveAndContinue = async (currentSection: string, nextSection: string) => {
    const saved = await savePlantSection(currentSection);
    if (saved) {
      setCurrentTab(nextSection);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Verificar autenticación antes de continuar
      if (!apiService.isAuthenticated()) {
        toast({
          title: "Sesión requerida",
          description: "Debes iniciar sesión como administrador para finalizar la planta.",
          variant: "destructive"
        })
        setIsLoading(false)
        router.push('/login')
        return
      }

      // Verificar si hay imágenes subiendo
      if (uploadedImages.some(img => img.isUploading)) {
        toast({
          title: "Espera un momento",
          description: "Hay imágenes que se están subiendo. Por favor espera a que terminen.",
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }

      // Validaciones requeridas para finalizar
      const requiredFields = {
        scientificName: 'Nombre científico',
        family: 'Familia',
        genus: 'Género',
        specificEpithet: 'Epíteto específico',
        locality: 'Localidad',
        recordedBy: 'Registrado por'
      }

      for (const [field, label] of Object.entries(requiredFields)) {
        if (!formData[field as keyof typeof formData]) {
          toast({
            title: "Campo requerido",
            description: `El campo "${label}" es obligatorio para finalizar`,
            variant: "destructive"
          })
          setIsLoading(false)
          return
        }
      }

      // Preparar datos finales
      const plantData: any = prepareCommonData();
      plantData.status = 'published'; // Cambiar a publicado al finalizar

      // Agregar imágenes si las hay
      if (uploadedImages.length > 0) {
        plantData.localImages = uploadedImages.map(img => ({
          id: img.id,
          file: img.file,
          url: img.serverUrl || img.url,
          filename: img.originalName,
          originalName: img.originalName
        }));
      }

      let response;
      if (plantId) {
        // Actualizar planta existente y cambiar status a published
        response = await apiService.updatePlant(plantId, plantData);
      } else {
        // Crear nueva planta directamente como published
        response = await apiService.createPlant(plantData);
      }

      if (response.success) {
        toast({
          title: "¡Planta creada exitosamente!",
          description: "La información del espécimen ha sido guardada correctamente.",
        })

        // Redirigir a la lista de plantas
        router.push('/admin/plantas')
      } else {
        throw new Error(response.error || 'Error al crear el espécimen')
      }
    } catch (error: any) {
      console.error('Error al crear planta:', error)
      toast({
        title: "Error al crear espécimen",
        description: error.message || "Hubo un error al guardar la información",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Añadir Nueva Planta</h1>
          <p className="text-muted-foreground">Completa el formulario para añadir un nuevo espécimen al herbario</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/plantas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Tabs value={currentTab} onValueChange={(tab) => { setCurrentTab(tab); setVisitedTabs(prev => new Set(prev).add(tab)); }} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 w-full">
            <TabsTrigger value="registro" className="flex items-center gap-1">
              {savedSections.has('Registro') ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : visitedTabs.has('registro') ? <CheckCircle2 className="h-3 w-3 text-muted-foreground/50" /> : null}
              Registro
            </TabsTrigger>
            <TabsTrigger value="taxonomia" className="flex items-center gap-1">
              {savedSections.has('Taxonomía') ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : visitedTabs.has('taxonomia') ? <CheckCircle2 className="h-3 w-3 text-muted-foreground/50" /> : null}
              Taxonomía
            </TabsTrigger>
            <TabsTrigger value="ubicacion" className="flex items-center gap-1">
              {savedSections.has('Ubicación') ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : visitedTabs.has('ubicacion') ? <CheckCircle2 className="h-3 w-3 text-muted-foreground/50" /> : null}
              Ubicación
            </TabsTrigger>
            <TabsTrigger value="coleccion" className="flex items-center gap-1">
              {savedSections.has('Colección') ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : visitedTabs.has('coleccion') ? <CheckCircle2 className="h-3 w-3 text-muted-foreground/50" /> : null}
              Colección
            </TabsTrigger>
            <TabsTrigger value="caracteristicas" className="flex items-center gap-1">
              {savedSections.has('Características') ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : visitedTabs.has('caracteristicas') ? <CheckCircle2 className="h-3 w-3 text-muted-foreground/50" /> : null}
              Características
            </TabsTrigger>
            <TabsTrigger value="imagenes">Imágenes</TabsTrigger>
          </TabsList>

          {/* Sección 1: Información de Registro */}
          <TabsContent value="registro" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de Registro</CardTitle>
                <CardDescription>Datos básicos del registro biológico</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="occurrenceID">ID del registro biológico</Label>
                    <Input 
                      id="occurrenceID" 
                      placeholder="Ej. AO4604"
                      value={formData.occurrenceID}
                      onChange={(e) => handleInputChange('occurrenceID', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basisOfRecord">Base del registro</Label>
                    <Select value={formData.basisOfRecord} onValueChange={(value) => handleInputChange('basisOfRecord', value)}>
                      <SelectTrigger id="basisOfRecord">
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
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
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physicalObject">PhysicalObject</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                        <SelectItem value="identification">Identification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recordedBy">Registrado por *</Label>
                    <Input 
                      id="recordedBy" 
                      placeholder="Ej. Andrés Orejuela / Guerly León"
                      value={formData.recordedBy}
                      onChange={(e) => handleInputChange('recordedBy', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="catalogNumber">Número de catálogo *</Label>
                    <Input 
                      id="catalogNumber" 
                      placeholder="Ej. 000233"
                      value={formData.catalogNumber}
                      onChange={(e) => handleInputChange('catalogNumber', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recordNumber">Número de registro</Label>
                    <Input 
                      id="recordNumber" 
                      placeholder="Ej. AO4604"
                      value={formData.recordNumber}
                      onChange={(e) => handleInputChange('recordNumber', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="identifiedBy">Identificado por</Label>
                    <Input 
                      id="identifiedBy" 
                      placeholder="Ej. Andrés Orejuela"
                      value={formData.identifiedBy}
                      onChange={(e) => handleInputChange('identifiedBy', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dateIdentified">Fecha de identificación</Label>
                    <Input
                      id="dateIdentified"
                      type="date"
                      value={formData.dateIdentified}
                      onChange={(e) => handleInputChange('dateIdentified', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="geodetic">Datum geodésico</Label>
                    <Input
                      id="geodetic"
                      placeholder="Ej. WGS84"
                      value={formData.geodetic}
                      onChange={(e) => handleInputChange('geodetic', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información Institucional</CardTitle>
                <CardDescription>Datos de la institución y colección</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="institutionCode">Código de la institución</Label>
                    <Input
                      id="institutionCode"
                      placeholder="Ej. Instituto Tecnológico del Putumayo (ITP)"
                      value={formData.institutionCode}
                      onChange={(e) => handleInputChange('institutionCode', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="institutionID">ID de la institución</Label>
                    <Input
                      id="institutionID"
                      placeholder="Ej. 800.247.940"
                      value={formData.institutionID}
                      onChange={(e) => handleInputChange('institutionID', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="collectionCode">Código de la colección</Label>
                    <Input
                      id="collectionCode"
                      placeholder="Ej. HEAA"
                      value={formData.collectionCode}
                      onChange={(e) => handleInputChange('collectionCode', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collectionID">ID de la colección</Label>
                    <Input
                      id="collectionID"
                      placeholder="Ej. 000233"
                      value={formData.collectionID}
                      onChange={(e) => handleInputChange('collectionID', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actualización y Proyecto</CardTitle>
                <CardDescription>Datos de actualización/confirmación y proyecto de investigación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="updatedBy">Actualizado/Confirmado por</Label>
                    <Input
                      id="updatedBy"
                      placeholder="Nombre de quien actualizó o confirmó"
                      value={formData.updatedBy}
                      onChange={(e) => handleInputChange('updatedBy', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateUpdated">Fecha de actualización/Confirmación</Label>
                    <Input
                      id="dateUpdated"
                      type="date"
                      value={formData.dateUpdated}
                      onChange={(e) => handleInputChange('dateUpdated', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Proyecto</Label>
                  <Input
                    id="project"
                    placeholder="Ej. Diversidad de la familia Solanaceae a lo largo del gradiente altitudinal Mocoa - San Francisco"
                    value={formData.project}
                    onChange={(e) => handleInputChange('project', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Botones de acción para esta sección */}
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => savePlantSection('Registro')}
                disabled={isSavingSection}
              >
                {isSavingSection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Sección
                  </>
                )}
              </Button>
              
              <Button 
                type="button"
                onClick={() => saveAndContinue('Registro', 'taxonomia')}
                disabled={isSavingSection}
              >
                {isSavingSection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar y Continuar'
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Sección 2: Taxonomía */}
          <TabsContent value="taxonomia" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Taxonómica</CardTitle>
                <CardDescription>Clasificación taxonómica del espécimen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="scientificName">Nombre científico *</Label>
                    <Input 
                      id="scientificName" 
                      placeholder="Ej. Solanum abiaguense"
                      value={formData.scientificName}
                      onChange={(e) => handleInputChange('scientificName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scientificNameAuthorship">Autoría del nombre científico</Label>
                    <Input 
                      id="scientificNameAuthorship" 
                      placeholder="Ej. S. Knapp"
                      value={formData.scientificNameAuthorship}
                      onChange={(e) => handleInputChange('scientificNameAuthorship', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="kingdom">Reino</Label>
                    <Input 
                      id="kingdom" 
                      placeholder="Ej. Plantae"
                      value={formData.kingdom}
                      onChange={(e) => handleInputChange('kingdom', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phylum">Filo</Label>
                    <Input 
                      id="phylum" 
                      placeholder="Ej. Magnoliophyta"
                      value={formData.phylum}
                      onChange={(e) => handleInputChange('phylum', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">Clase</Label>
                    <Input 
                      id="class" 
                      placeholder="Ej. Equisetopsida"
                      value={formData.class}
                      onChange={(e) => handleInputChange('class', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="order">Orden</Label>
                    <Input 
                      id="order" 
                      placeholder="Ej. Solanales"
                      value={formData.orderName}
                      onChange={(e) => handleInputChange('orderName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="family">Familia *</Label>
                    <Input 
                      id="family" 
                      placeholder="Ej. Solanaceae"
                      value={formData.family}
                      onChange={(e) => handleInputChange('family', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subfamily">Subfamilia</Label>
                    <Input 
                      id="subfamily" 
                      placeholder="Subfamilia (opcional)"
                      value={formData.subfamily}
                      onChange={(e) => handleInputChange('subfamily', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="genus">Género *</Label>
                    <Input 
                      id="genus" 
                      placeholder="Ej. Solanum"
                      value={formData.genus}
                      onChange={(e) => handleInputChange('genus', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subgenus">Subgénero</Label>
                    <Input 
                      id="subgenus" 
                      placeholder="Subgénero (opcional)"
                      value={formData.subgenus}
                      onChange={(e) => handleInputChange('subgenus', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specificEpithet">Epíteto específico *</Label>
                    <Input 
                      id="specificEpithet" 
                      placeholder="Ej. abiaguense"
                      value={formData.specificEpithet}
                      onChange={(e) => handleInputChange('specificEpithet', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="infraspecificEpithet">Epíteto infragenérico</Label>
                    <Input
                      id="infraspecificEpithet"
                      placeholder="Epíteto infragenérico (opcional)"
                      value={formData.infraspecificEpithet}
                      onChange={(e) => handleInputChange('infraspecificEpithet', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxonRank">Categoría del taxón</Label>
                    <Select value={formData.taxonRank} onValueChange={(v) => handleInputChange('taxonRank', v)}>
                      <SelectTrigger id="taxonRank">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
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
                    <Input
                      id="vernacularName"
                      placeholder="Nombre común (opcional)"
                      value={formData.vernacularName}
                      onChange={(e) => handleInputChange('vernacularName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxonRemarks">Comentarios del taxón</Label>
                  <Textarea
                    id="taxonRemarks"
                    placeholder="Comentarios adicionales sobre el taxón..."
                    rows={3}
                    value={formData.taxonRemarks}
                    onChange={(e) => handleInputChange('taxonRemarks', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Botones de acción para esta sección */}
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => savePlantSection('Taxonomía')}
                disabled={isSavingSection}
              >
                {isSavingSection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Sección
                  </>
                )}
              </Button>
              
              <Button 
                type="button"
                onClick={() => saveAndContinue('Taxonomía', 'ubicacion')}
                disabled={isSavingSection}
              >
                {isSavingSection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar y Continuar'
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Sección 3: Ubicación */}
          <TabsContent value="ubicacion" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Ubicación Geográfica</CardTitle>
                <CardDescription>Información sobre la localidad donde se recolectó el espécimen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input 
                      id="country" 
                      placeholder="Ej. Colombia"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stateProvince">Departamento</Label>
                    <Input 
                      id="stateProvince" 
                      placeholder="Ej. Putumayo"
                      value={formData.stateProvince}
                      onChange={(e) => handleInputChange('stateProvince', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="county">Municipio</Label>
                    <Input
                      id="county"
                      placeholder="Ej. Mocoa"
                      value={formData.county}
                      onChange={(e) => handleInputChange('county', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="municipality">Centro poblado / Cabecera municipal</Label>
                    <Input
                      id="municipality"
                      placeholder="Ej. Las Mesas"
                      value={formData.municipality}
                      onChange={(e) => handleInputChange('municipality', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locality">Localidad *</Label>
                  <Textarea
                    id="locality"
                    placeholder="Ej. Vía Mocoa - San Francisco, arriba de la vereda Las Mesas"
                    rows={2}
                    value={formData.locality}
                    onChange={(e) => handleInputChange('locality', e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="minimumElevationInMeters">Elevación mínima en metros</Label>
                    <Input
                      id="minimumElevationInMeters"
                      type="number"
                      placeholder="Ej. 1300"
                      value={formData.minimumElevationInMeters}
                      onChange={(e) => handleInputChange('minimumElevationInMeters', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="habitat">Hábitat</Label>
                    <Input
                      id="habitat"
                      placeholder="Descripción del hábitat"
                      value={formData.habitat}
                      onChange={(e) => handleInputChange('habitat', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="decimalLatitude">Latitud decimal</Label>
                    <Input
                      id="decimalLatitude"
                      placeholder="Ej. 1.0934"
                      value={formData.decimalLatitude}
                      onChange={(e) => handleInputChange('decimalLatitude', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="decimalLongitude">Longitud decimal</Label>
                    <Input
                      id="decimalLongitude"
                      placeholder="Ej. -76.7333"
                      value={formData.decimalLongitude}
                      onChange={(e) => handleInputChange('decimalLongitude', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="decimalLatitudeSexagesimal">Latitud sexagesimal</Label>
                    <Input
                      id="decimalLatitudeSexagesimal"
                      placeholder="Ej. 01°04'42&quot;"
                      value={formData.decimalLatitudeSexagesimal}
                      onChange={(e) => handleInputChange('decimalLatitudeSexagesimal', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="decimalLongitudeSexagesimal">Longitud sexagesimal</Label>
                    <Input
                      id="decimalLongitudeSexagesimal"
                      placeholder="Ej. 76°44'00&quot;"
                      value={formData.decimalLongitudeSexagesimal}
                      onChange={(e) => handleInputChange('decimalLongitudeSexagesimal', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Botones de acción para esta sección */}
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => savePlantSection('Ubicación')}
                disabled={isSavingSection}
              >
                {isSavingSection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Sección
                  </>
                )}
              </Button>
              
              <Button 
                type="button"
                onClick={() => saveAndContinue('Ubicación', 'coleccion')}
                disabled={isSavingSection}
              >
                {isSavingSection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar y Continuar'
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Sección 4: Colección */}
          <TabsContent value="coleccion" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de Colección</CardTitle>
                <CardDescription>Datos sobre la recolección y preparación del espécimen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="organismQuantity">Cantidad del organismo</Label>
                    <Input
                      id="organismQuantity"
                      placeholder="Cantidad"
                      value={formData.organismQuantity}
                      onChange={(e) => handleInputChange('organismQuantity', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organismQuantityType">Tipo de cantidad del organismo</Label>
                    <Input
                      id="organismQuantityType"
                      placeholder="Ej. Individuos, muestras"
                      value={formData.organismQuantityType}
                      onChange={(e) => handleInputChange('organismQuantityType', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="lifeStage">Etapa de vida</Label>
                    <Select value={formData.lifeStage} onValueChange={(value) => handleInputChange('lifeStage', value)}>
                      <SelectTrigger id="lifeStage">
                        <SelectValue placeholder="Selecciona una etapa" />
                      </SelectTrigger>
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
                    <Input
                      id="preparation"
                      placeholder="Ej. Exsicado botánico"
                      value={formData.preparation}
                      onChange={(e) => handleInputChange('preparation', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="disposition">Disposición</Label>
                    <Select value={formData.disposition} onValueChange={(v) => handleInputChange('disposition', v)}>
                      <SelectTrigger id="disposition">
                        <SelectValue placeholder="Selecciona disposición" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enColeccion">En colección</SelectItem>
                        <SelectItem value="prestamo">En préstamo</SelectItem>
                        <SelectItem value="perdido">Perdido</SelectItem>
                        <SelectItem value="destruido">Destruido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="samplingProtocol">Protocolo de muestreo</Label>
                    <Input
                      id="samplingProtocol"
                      placeholder="Ej. Colección general"
                      value={formData.samplingProtocol}
                      onChange={(e) => handleInputChange('samplingProtocol', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Fecha del evento</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => handleInputChange('eventDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fieldNumber">Número de campo</Label>
                    <Input
                      id="fieldNumber"
                      placeholder="Ej. AO4604"
                      value={formData.fieldNumber}
                      onChange={(e) => handleInputChange('fieldNumber', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fieldNotes">Notas de campo</Label>
                  <Textarea
                    id="fieldNotes"
                    placeholder="Ej. Árbol 5 m. Cáliz verde, corola blanca, anteras amarillas."
                    rows={3}
                    value={formData.fieldNotes}
                    onChange={(e) => handleInputChange('fieldNotes', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Botones de acción para esta sección */}
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => savePlantSection('Colección')}
                disabled={isSavingSection}
              >
                {isSavingSection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Sección
                  </>
                )}
              </Button>
              
              <Button 
                type="button"
                onClick={() => saveAndContinue('Colección', 'caracteristicas')}
                disabled={isSavingSection}
              >
                {isSavingSection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar y Continuar'
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Sección 5: Características */}
          <TabsContent value="caracteristicas" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Características del Espécimen</CardTitle>
                <CardDescription>
                  Descripción detallada de las características morfológicas y ecológicas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción general</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Descripción detallada del espécimen..." 
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="plantHeight">Altura de la planta (m)</Label>
                    <Input 
                      id="plantHeight" 
                      type="number" 
                      step="0.1" 
                      placeholder="Ej. 5.0"
                      value={formData.plantHeight}
                      onChange={(e) => handleInputChange('plantHeight', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plantHabit">Hábito de crecimiento</Label>
                    <Select value={formData.plantHabit} onValueChange={(value) => handleInputChange('plantHabit', value)}>
                      <SelectTrigger id="plantHabit">
                        <SelectValue placeholder="Selecciona un hábito" />
                      </SelectTrigger>
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
                    <Input
                      id="flowerColor"
                      placeholder="Ej. Corola blanca, anteras amarillas"
                      value={formData.flowerColor}
                      onChange={(e) => handleInputChange('flowerColor', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fruitColor">Color del fruto</Label>
                    <Input
                      id="fruitColor"
                      placeholder="Color del fruto (si aplica)"
                      value={formData.fruitColor}
                      onChange={(e) => handleInputChange('fruitColor', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="leafCharacteristics">Características de las hojas</Label>
                    <Textarea
                      id="leafCharacteristics"
                      placeholder="Descripción de las hojas..."
                      rows={3}
                      value={formData.leafCharacteristics}
                      onChange={(e) => handleInputChange('leafCharacteristics', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uses">Usos</Label>
                    <Textarea
                      id="uses"
                      placeholder="Usos tradicionales o conocidos..."
                      rows={3}
                      value={formData.uses}
                      onChange={(e) => handleInputChange('uses', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalRemarks">Observaciones adicionales</Label>
                  <Textarea
                    id="additionalRemarks"
                    placeholder="Cualquier otra información relevante..."
                    rows={3}
                    value={formData.additionalRemarks}
                    onChange={(e) => handleInputChange('additionalRemarks', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Botones de acción para esta sección */}
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => savePlantSection('Características')}
                disabled={isSavingSection}
              >
                {isSavingSection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Sección
                  </>
                )}
              </Button>
              
              <Button 
                type="button"
                onClick={() => saveAndContinue('Características', 'imagenes')}
                disabled={isSavingSection}
              >
                {isSavingSection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar y Continuar'
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Sección 6: Imágenes */}
          <TabsContent value="imagenes" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Imágenes del Espécimen</CardTitle>
                <CardDescription>Fotografías y documentación visual del espécimen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-5">
                  <div 
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                      isDragOver 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted-foreground/25'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="mb-4 rounded-full bg-primary/10 p-3">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-1 text-lg font-semibold">Arrastra y suelta imágenes</h3>
                    <p className="mb-4 text-sm text-muted-foreground">O haz clic para seleccionar archivos</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById('file-input')?.click()}
                      type="button"
                    >
                      Seleccionar archivos
                    </Button>
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
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
                            <img
                              src={image.url} // Siempre usar la URL local para vista previa
                              alt={image.originalName}
                              className="w-full h-full object-cover"
                            />
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              className="absolute right-1 top-1 h-6 w-6"
                              onClick={() => removeImage(index)}
                              type="button"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            {/* Indicadores de estado */}
                            {image.isUploading && (
                              <div className="absolute bottom-1 left-1 bg-blue-500 text-white rounded-full p-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                              </div>
                            )}
                            {image.id && !image.isUploading && !image.uploadFailed && (
                              <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            {image.uploadFailed && !image.isUploading && (
                              <div className="absolute bottom-1 right-1 bg-yellow-500 text-white rounded-full p-1" title="Solo vista previa local - Error al subir al servidor">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                    <div 
                      className="flex aspect-square items-center justify-center rounded-md border border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => document.getElementById('file-input')?.click()}
                    >
                      <Button variant="ghost" size="icon" type="button">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Label htmlFor="photoRecord">Fotografía en Montaje</Label>
                  <Select value={formData.photoRecord} onValueChange={(value) => handleInputChange('photoRecord', value)}>
                    <SelectTrigger id="photoRecord">
                      <SelectValue placeholder="¿Tiene fotografía en montaje?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="si">Sí</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Resumen de imágenes para el espécimen:</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>📁 {uploadedImages.length} imagen(es) total seleccionada(s)</p>
                      
                      {uploadedImages.filter(img => img.id && !img.uploadFailed).length > 0 && (
                        <p className="text-green-600">
                          ✅ {uploadedImages.filter(img => img.id && !img.uploadFailed).length} ya subida(s) al servidor
                        </p>
                      )}
                      
                      {uploadedImages.filter(img => img.isUploading).length > 0 && (
                        <p className="text-blue-600">
                          ⏳ {uploadedImages.filter(img => img.isUploading).length} subiendo...
                        </p>
                      )}
                      
                      {uploadedImages.filter(img => img.uploadFailed || (!img.id && !img.isUploading)).length > 0 && (
                        <p className="text-orange-600">
                          📤 {uploadedImages.filter(img => img.uploadFailed || (!img.id && !img.isUploading)).length} se subirá(n) al guardar el espécimen
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700 border border-blue-200">
                      💡 <strong>Nota:</strong> Todas las imágenes seleccionadas se incluirán automáticamente 
                      con el espécimen cuando hagas clic en "Guardar Espécimen". Las que no se hayan subido 
                      se procesarán durante el guardado.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Botones de acción para esta sección */}
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => savePlantSection('Imágenes')}
                disabled={isSavingSection}
              >
                {isSavingSection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Sección
                  </>
                )}
              </Button>
              
              <div className="space-x-2">
                {plantId && (
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/admin/plantas/${plantId}/editar`)}
                  >
                    Ir a Editar
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isLoading || !canPublish}
                  className="bg-green-600 hover:bg-green-700"
                  title={!canPublish ? 'Visita o guarda todas las secciones para habilitar' : undefined}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    'Finalizar y Publicar'
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-6 border-t">
          <div className="flex items-center space-x-4">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/plantas')}>
              Cancelar
            </Button>
            {plantId && (
              <div className="text-sm text-muted-foreground">
                ✅ Planta guardada como borrador (ID: {plantId})
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {!canPublish && (
              <p className="text-xs text-muted-foreground">
                {allSaved
                  ? null
                  : `${Math.max(savedSections.size, visitedTabs.size > 1 ? visitedTabs.size - 1 : 0)}/5 secciones — visita o guarda todas para publicar`}
              </p>
            )}
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700"
            disabled={isLoading || !canPublish || uploadedImages.some(img => img.isUploading)}
            title={!canPublish ? 'Visita o guarda todas las secciones para habilitar' : undefined}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finalizando y publicando...
              </>
            ) : uploadedImages.some(img => img.isUploading) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Esperando imágenes...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {plantId ? 'Finalizar y Publicar' : 'Crear y Publicar'}
                {uploadedImages.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                    +{uploadedImages.length} img
                  </span>
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
