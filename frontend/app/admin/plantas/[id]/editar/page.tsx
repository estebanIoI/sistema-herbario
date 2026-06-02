"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Loader2, AlertCircle, Upload, X, ImagePlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { CloudinaryImage } from "@/components/cloudinary-image"

// Tipos para las imágenes
interface PlantImage {
  id?: number;
  file?: File;
  url: string;
  serverUrl?: string;
  thumbnailUrl?: string;
  originalName: string;
  isUploading?: boolean;
  uploadFailed?: boolean;
  isExisting?: boolean; // Para marcar imágenes que ya existen en el servidor
  markedForDeletion?: boolean; // Para marcar imágenes existentes para eliminar
}

export default function EditarPlantaPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [plantId] = useState(Number(params.id))

  // Estado para manejo de imágenes
  const [uploadedImages, setUploadedImages] = useState<PlantImage[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup para URLs de objetos blob al desmontar
  useEffect(() => {
    return () => {
      uploadedImages.forEach(image => {
        if (image.file && image.url.startsWith('blob:')) {
          URL.revokeObjectURL(image.url)
        }
      })
    }
  }, [])
  
  // Form state - nombres Darwin Core (DwC snake_case)
  const [formData, setFormData] = useState({
    // Taxonomía (cols 36-50)
    scientific_name: '',
    common_name: '',
    vernacular_name: '',
    family: '',
    genus: '',
    specific_epithet: '',           // Col 46 · specificEpithet
    scientific_name_authorship: '', // Col 37 · scientificNameAuthorship
    infraspecific_epithet: '',
    taxonomic_status: 'accepted',
    taxon_rank: 'species',
    taxon_remarks: '',
    kingdom: 'Plantae',
    phylum: 'Magnoliophyta',
    class_name: 'Equisetopsida',
    order_name: '',
    subfamily: '',
    subgenus: '',
    // Espécimen (cols 8-9)
    catalog_number: '',   // Col 8 · catalogNumber
    record_number: '',    // Col 9 · recordNumber
    // Identificación (cols 32-35)
    identified_by: '',
    date_identified: '',
    determined_by: '',
    determination_date: '',
    updated_by: '',
    date_updated: '',
    type_status: 'none',
    // Colección (cols 10-20)
    recorded_by: '',      // Col 10 · recordedBy
    additional_collectors: '',
    event_date: '',       // Col 17 · eventDate
    organism_quantity: '',
    organism_quantity_type: '',
    life_stage: '',
    preparations: '',     // Col 14 · preparations
    disposition: '',
    sampling_protocol: '',
    field_number: '',
    field_notes: '',
    // Ubicación (cols 21-31)
    country: 'Colombia',
    state_province: '',   // Col 22 · stateProvince
    county: '',           // Col 23 · county (municipio)
    municipality: '',     // Col 24 · municipality (vereda)
    locality: '',         // Col 25 · locality
    decimal_latitude: '',             // Col 27
    decimal_latitude_sexagesimal: '', // Col 28
    decimal_longitude: '',            // Col 29
    decimal_longitude_sexagesimal: '',// Col 30
    minimum_elevation_in_meters: '',  // Col 26
    coordinate_uncertainty: '',
    georeferenced_by: '',
    // Ecología
    habitat: '',
    substrate: '',
    associated_species: '',
    abundance: '',
    reproductive_state: '',
    // Morfología
    plant_habit: '',  // (antes: habit)
    height_min: '',
    height_max: '',
    description: '',
    distinguishing_features: '',
    flower_color: '',
    fruit_color: '',
    leaf_characteristics: '',
    // Uso y conservación
    uses: '',
    care_instructions: '',
    conservation_status: 'NE',
    // Sistema
    status: 'draft',
    featured: false,
    observations: '',
    notes: '',
    // Proyecto
    project: '',
    photo_record: '',
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
    // Resetear el input para permitir seleccionar el mismo archivo de nuevo
    if (event.target) {
      event.target.value = ''
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
    const newImages: PlantImage[] = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      originalName: file.name,
      isUploading: false,
      isExisting: false
    }))

    setUploadedImages(prev => [...prev, ...newImages])

    // Subir cada archivo al servidor
    for (const file of validFiles) {
      setUploadedImages(prev => prev.map(img =>
        img.file === file ? { ...img, isUploading: true } : img
      ))

      try {
        const response = await apiService.uploadImage(file, {
          entityType: 'plant',
          entityId: plantId,
          isTemporary: false
        })

        if (response.success && response.data) {
          setUploadedImages(prev => prev.map(img =>
            img.file === file ? {
              ...img,
              id: response.data.id,
              serverUrl: response.data.url,
              thumbnailUrl: response.data.thumbnailUrl,
              isUploading: false,
              uploadFailed: false
            } : img
          ))
          toast({
            title: "Imagen subida",
            description: `${file.name} se subió correctamente`,
          })
        } else {
          setUploadedImages(prev => prev.map(img =>
            img.file === file ? { ...img, isUploading: false, uploadFailed: true } : img
          ))
          toast({
            title: "Error al subir imagen",
            description: response.error || "No se pudo subir la imagen",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Error uploading image:', error)
        setUploadedImages(prev => prev.map(img =>
          img.file === file ? { ...img, isUploading: false, uploadFailed: true } : img
        ))
      }
    }
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
    setUploadedImages(prev => {
      const image = prev[index]

      // Si es una imagen existente del servidor, marcarla para eliminación
      if (image.isExisting) {
        return prev.map((img, i) =>
          i === index ? { ...img, markedForDeletion: true } : img
        )
      }

      // Si es una imagen nueva (con URL local), revocar la URL y eliminar
      if (image.file) {
        URL.revokeObjectURL(image.url)
      }

      return prev.filter((_, i) => i !== index)
    })
  }

  const restoreImage = (index: number) => {
    setUploadedImages(prev => prev.map((img, i) =>
      i === index ? { ...img, markedForDeletion: false } : img
    ))
  }

  // Cargar datos de la planta
  const loadPlantData = async () => {
    setIsLoadingData(true)
    try {
      const response = await apiService.getPlantById(plantId)
      if (response.success && response.data) {
        const plant = response.data
        
        // Mapear datos de la API al formulario — nombres Darwin Core
        setFormData({
          // Taxonomía
          scientific_name: plant.scientific_name || '',
          common_name: plant.common_name || '',
          vernacular_name: plant.vernacular_name || '',
          family: plant.family || '',
          genus: plant.genus || '',
          specific_epithet: plant.specific_epithet || '',
          scientific_name_authorship: plant.scientific_name_authorship || '',
          infraspecific_epithet: plant.infraspecific_epithet || '',
          taxonomic_status: plant.taxonomic_status || 'accepted',
          taxon_rank: plant.taxon_rank || 'species',
          taxon_remarks: plant.taxon_remarks || '',
          kingdom: plant.kingdom || 'Plantae',
          phylum: plant.phylum || 'Magnoliophyta',
          class_name: plant.class_name || 'Equisetopsida',
          order_name: plant.order_name || '',
          subfamily: plant.subfamily || '',
          subgenus: plant.subgenus || '',
          // Espécimen
          catalog_number: plant.catalog_number || '',
          record_number: plant.record_number || '',
          // Identificación
          identified_by: plant.identified_by || '',
          date_identified: plant.date_identified || '',
          determined_by: plant.determined_by || '',
          determination_date: plant.determination_date || '',
          updated_by: plant.updated_by || '',
          date_updated: plant.date_updated || '',
          type_status: plant.type_status || 'none',
          // Colección
          recorded_by: plant.recorded_by || '',
          additional_collectors: plant.additional_collectors || '',
          event_date: plant.event_date || '',
          organism_quantity: plant.organism_quantity || '',
          organism_quantity_type: plant.organism_quantity_type || '',
          life_stage: plant.life_stage || '',
          preparations: plant.preparations || '',
          disposition: plant.disposition || '',
          sampling_protocol: plant.sampling_protocol || '',
          field_number: plant.field_number || '',
          field_notes: plant.field_notes || '',
          // Ubicación
          country: plant.country || 'Colombia',
          state_province: plant.state_province || '',
          county: plant.county || '',
          municipality: plant.municipality || '',
          locality: plant.locality || '',
          decimal_latitude: plant.decimal_latitude || '',
          decimal_latitude_sexagesimal: plant.decimal_latitude_sexagesimal || '',
          decimal_longitude: plant.decimal_longitude || '',
          decimal_longitude_sexagesimal: plant.decimal_longitude_sexagesimal || '',
          minimum_elevation_in_meters: plant.minimum_elevation_in_meters || '',
          coordinate_uncertainty: plant.coordinate_uncertainty || '',
          georeferenced_by: plant.georeferenced_by || '',
          // Ecología
          habitat: plant.habitat || '',
          substrate: plant.substrate || '',
          associated_species: plant.associated_species || '',
          abundance: plant.abundance || '',
          reproductive_state: plant.reproductive_state || '',
          // Morfología
          plant_habit: plant.plant_habit || '',
          height_min: plant.height_min || '',
          height_max: plant.height_max || '',
          description: plant.description || '',
          distinguishing_features: plant.distinguishing_features || '',
          flower_color: plant.flower_color || '',
          fruit_color: plant.fruit_color || '',
          leaf_characteristics: plant.leaf_characteristics || '',
          // Uso y conservación
          uses: plant.uses || '',
          care_instructions: plant.care_instructions || '',
          conservation_status: plant.conservation_status || 'NE',
          // Sistema
          status: plant.status || 'draft',
          featured: plant.featured || false,
          observations: plant.observations || '',
          notes: plant.notes || '',
          // Proyecto
          project: plant.project || '',
          photo_record: plant.photo_record || '',
        })

        // Cargar imágenes existentes
        if (plant.images && Array.isArray(plant.images)) {
          const existingImages: PlantImage[] = plant.images.map((img: any) => ({
            id: img.id,
            url: img.url || img.thumbnailUrl,
            serverUrl: img.url,
            thumbnailUrl: img.thumbnailUrl,
            originalName: img.originalName || img.filename || 'Imagen',
            isExisting: true,
            markedForDeletion: false
          }))
          setUploadedImages(existingImages)
        } else if (plant.image_urls) {
          // Fallback: si las imágenes vienen como array de URLs en image_urls
          try {
            const imageUrls = typeof plant.image_urls === 'string'
              ? JSON.parse(plant.image_urls)
              : plant.image_urls

            if (Array.isArray(imageUrls) && imageUrls.length > 0) {
              const existingImages: PlantImage[] = imageUrls.map((url: string, index: number) => ({
                id: index,
                url: url,
                serverUrl: url,
                originalName: `Imagen ${index + 1}`,
                isExisting: true,
                markedForDeletion: false
              }))
              setUploadedImages(existingImages)
            }
          } catch (e) {
            console.warn('Error parsing image_urls:', e)
          }
        }
      } else {
        toast({
          title: "Error",
          description: "No se pudo cargar la información de la planta",
          variant: "destructive"
        })
        router.push('/admin/plantas')
      }
    } catch (error) {
      console.error('Error al cargar planta:', error)
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar la información de la planta",
        variant: "destructive"
      })
      router.push('/admin/plantas')
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    if (plantId) {
      loadPlantData()
    }
  }, [plantId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Función helper para convertir strings vacíos a null para campos de fecha y convertir formato ISO
      const dateToNull = (dateStr: string) => {
        if (!dateStr || dateStr.trim() === '') return null;
        // Si es una fecha ISO (contiene 'T'), convertir a formato YYYY-MM-DD
        if (dateStr.includes('T')) {
          return dateStr.split('T')[0];
        }
        return dateStr;
      }

      // Función helper para convertir strings vacíos a null para campos numéricos
      const numToNull = (numStr: string | number | null | undefined) => {
        if (numStr === null || numStr === undefined) return null
        const str = String(numStr)
        return str.trim() !== '' ? str : null
      }

      // Preparar datos — nombres Darwin Core
      const updateData: any = {
        // Taxonomía
        scientific_name: formData.scientific_name,
        common_name: formData.common_name || null,
        vernacular_name: formData.vernacular_name || null,
        family: formData.family,
        genus: formData.genus,
        specific_epithet: formData.specific_epithet || null,
        scientific_name_authorship: formData.scientific_name_authorship || null,
        infraspecific_epithet: formData.infraspecific_epithet || null,
        taxonomic_status: formData.taxonomic_status,
        taxon_rank: formData.taxon_rank || null,
        taxon_remarks: formData.taxon_remarks || null,
        kingdom: formData.kingdom || null,
        phylum: formData.phylum || null,
        class_name: formData.class_name || null,
        order_name: formData.order_name || null,
        subfamily: formData.subfamily || null,
        subgenus: formData.subgenus || null,
        // Espécimen
        catalog_number: formData.catalog_number || null,
        record_number: formData.record_number || null,
        // Identificación
        identified_by: formData.identified_by || null,
        date_identified: dateToNull(formData.date_identified),
        determined_by: formData.determined_by || null,
        determination_date: dateToNull(formData.determination_date),
        updated_by: formData.updated_by || null,
        date_updated: dateToNull(formData.date_updated),
        type_status: formData.type_status,
        // Colección
        recorded_by: formData.recorded_by || null,
        additional_collectors: formData.additional_collectors || null,
        event_date: dateToNull(formData.event_date),
        organism_quantity: formData.organism_quantity || null,
        organism_quantity_type: formData.organism_quantity_type || null,
        life_stage: formData.life_stage || null,
        preparations: formData.preparations || null,
        disposition: formData.disposition || null,
        sampling_protocol: formData.sampling_protocol || null,
        field_number: formData.field_number || null,
        field_notes: formData.field_notes || null,
        // Ubicación
        country: formData.country,
        state_province: formData.state_province || null,
        county: formData.county || null,
        municipality: formData.municipality || null,
        locality: formData.locality || null,
        decimal_latitude: numToNull(formData.decimal_latitude),
        decimal_longitude: numToNull(formData.decimal_longitude),
        decimal_latitude_sexagesimal: formData.decimal_latitude_sexagesimal || null,
        decimal_longitude_sexagesimal: formData.decimal_longitude_sexagesimal || null,
        minimum_elevation_in_meters: numToNull(formData.minimum_elevation_in_meters),
        coordinate_uncertainty: numToNull(formData.coordinate_uncertainty),
        georeferenced_by: formData.georeferenced_by || null,
        // Ecología
        habitat: formData.habitat || null,
        substrate: formData.substrate || null,
        associated_species: formData.associated_species || null,
        abundance: formData.abundance || null,
        reproductive_state: formData.reproductive_state || null,
        // Morfología
        plant_habit: formData.plant_habit || null,
        height_min: numToNull(formData.height_min),
        height_max: numToNull(formData.height_max),
        description: formData.description || null,
        distinguishing_features: formData.distinguishing_features || null,
        flower_color: formData.flower_color || null,
        fruit_color: formData.fruit_color || null,
        leaf_characteristics: formData.leaf_characteristics || null,
        // Uso y conservación
        uses: formData.uses || null,
        care_instructions: formData.care_instructions || null,
        conservation_status: formData.conservation_status,
        // Sistema
        status: formData.status,
        featured: formData.featured,
        observations: formData.observations || null,
        notes: formData.notes || null,
        // Proyecto
        project: formData.project || null,
        photo_record: formData.photo_record || null,
      }

      // Remover campos undefined o que causen problemas
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key]
        }
      })

      // Procesar imágenes
      const activeImages = uploadedImages.filter(img => !img.markedForDeletion)
      const imagesToDelete = uploadedImages.filter(img => img.markedForDeletion && img.isExisting)

      // Agregar URLs de imágenes activas al update
      const imageUrls = activeImages
        .map(img => img.serverUrl || img.url)
        .filter(url => url && !url.startsWith('blob:'))

      if (imageUrls.length > 0) {
        updateData.image_urls = JSON.stringify(imageUrls)
      }

      // Agregar IDs de imágenes para asociar
      const imageIds = activeImages
        .map(img => img.id)
        .filter((id): id is number => typeof id === 'number')

      if (imageIds.length > 0) {
        updateData.imageIds = imageIds
      }

      // Agregar IDs de imágenes a eliminar
      if (imagesToDelete.length > 0) {
        updateData.deleteImageIds = imagesToDelete
          .map(img => img.id)
          .filter((id): id is number => typeof id === 'number')
      }

      console.log('🌱 Datos de la planta a actualizar:', updateData)
      console.log('🖼️ Imágenes activas:', imageUrls.length)
      console.log('🗑️ Imágenes a eliminar:', imagesToDelete.length)
      console.log('🔐 Token de autenticación disponible:', !!apiService.getToken())

      const response = await apiService.updatePlant(plantId, updateData)
      
      if (response.success) {
        toast({
          title: "✅ Éxito",
          description: "La planta ha sido actualizada exitosamente",
          variant: "default"
        })
        router.push('/admin/plantas')
      } else {
        let errorMessage = response.error || "Ocurrió un error al actualizar la planta"
        let errorTitle = "Error"
        
        if (response.error?.includes('Autenticación requerida')) {
          errorTitle = "Sesión requerida"
          errorMessage = "Debes iniciar sesión como administrador para editar plantas."
          router.push('/login')
        } else if (response.error?.includes('Permisos insuficientes')) {
          errorTitle = "Sin permisos"
          errorMessage = "Tu cuenta no tiene permisos para editar plantas. Contacta al administrador."
        }
        
        console.error('Error detallado al actualizar planta:', response)
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('Error al actualizar planta:', error)
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al actualizar la planta",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando información de la planta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Planta</h1>
          <p className="text-muted-foreground">
            Modifica la información del espécimen: {formData.scientific_name || 'Sin nombre científico'}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/plantas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Tabs defaultValue="taxonomia" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 w-full">
            <TabsTrigger value="taxonomia">Taxonomía</TabsTrigger>
            <TabsTrigger value="herbario">Herbario</TabsTrigger>
            <TabsTrigger value="coleccion">Colección</TabsTrigger>
            <TabsTrigger value="ubicacion">Ubicación</TabsTrigger>
            <TabsTrigger value="caracteristicas">Características</TabsTrigger>
            <TabsTrigger value="imagenes">Imágenes</TabsTrigger>
            <TabsTrigger value="estado">Estado</TabsTrigger>
          </TabsList>

          {/* Sección: Taxonomía */}
          <TabsContent value="taxonomia" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Taxonómica</CardTitle>
                <CardDescription>Clasificación científica del espécimen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scientific_name">Nombre científico *</Label>
                  <Input 
                    id="scientific_name" 
                    placeholder="Ej. Quercus humboldtii"
                    value={formData.scientific_name}
                    onChange={(e) => handleInputChange('scientific_name', e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vernacular_name">Nombre vernáculo</Label>
                    <Input 
                      id="vernacular_name" 
                      placeholder="Ej. Roble"
                      value={formData.vernacular_name}
                      onChange={(e) => handleInputChange('vernacular_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="common_name">Nombre común</Label>
                    <Input 
                      id="common_name" 
                      placeholder="Ej. Roble común"
                      value={formData.common_name}
                      onChange={(e) => handleInputChange('common_name', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="family">Familia *</Label>
                    <Input 
                      id="family" 
                      placeholder="Ej. Fagaceae"
                      value={formData.family}
                      onChange={(e) => handleInputChange('family', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genus">Género *</Label>
                    <Input 
                      id="genus" 
                      placeholder="Ej. Quercus"
                      value={formData.genus}
                      onChange={(e) => handleInputChange('genus', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specific_epithet">Especie</Label>
                    <Input
                      id="specific_epithet"
                      placeholder="Ej. humboldtii"
                      value={formData.specific_epithet}
                      onChange={(e) => handleInputChange('specific_epithet', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="scientific_name_authorship">Autoría del nombre científico</Label>
                    <Input
                      id="scientific_name_authorship"
                      placeholder="Ej. Bonpl."
                      value={formData.scientific_name_authorship}
                      onChange={(e) => handleInputChange('scientific_name_authorship', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="infraspecific_epithet">Epíteto infraespecífico</Label>
                    <Input 
                      id="infraspecific_epithet" 
                      placeholder="Ej. var. colombiana"
                      value={formData.infraspecific_epithet}
                      onChange={(e) => handleInputChange('infraspecific_epithet', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sección: Herbario */}
          <TabsContent value="herbario" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Información del Herbario</CardTitle>
                <CardDescription>Datos de determinación y tipo de espécimen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="catalog_number">Número de catálogo</Label>
                    <Input
                      id="catalog_number"
                      placeholder="Ej. HEAA-001234"
                      value={formData.catalog_number}
                      onChange={(e) => handleInputChange('catalog_number', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="determined_by">Determinado por</Label>
                    <Input 
                      id="determined_by" 
                      placeholder="Ej. Dr. Juan Pérez"
                      value={formData.determined_by}
                      onChange={(e) => handleInputChange('determined_by', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="determination_date">Fecha de determinación</Label>
                    <Input 
                      id="determination_date" 
                      type="date"
                      value={formData.determination_date}
                      onChange={(e) => handleInputChange('determination_date', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type_status">Estado del tipo</Label>
                    <Select value={formData.type_status} onValueChange={(value) => handleInputChange('type_status', value)}>
                      <SelectTrigger id="type_status">
                        <SelectValue placeholder="Selecciona el estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ninguno</SelectItem>
                        <SelectItem value="holotype">Holotipo</SelectItem>
                        <SelectItem value="isotype">Isotipo</SelectItem>
                        <SelectItem value="paratype">Paratipo</SelectItem>
                        <SelectItem value="lectotype">Lectotipo</SelectItem>
                        <SelectItem value="neotype">Neotipo</SelectItem>
                        <SelectItem value="epitype">Epitipo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sección: Colección */}
          <TabsContent value="coleccion" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Geográfica</CardTitle>
                <CardDescription>Ubicación donde fue recolectado el espécimen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="state_province">Departamento</Label>
                    <Input
                      id="state_province"
                      placeholder="Ej. Putumayo"
                      value={formData.state_province}
                      onChange={(e) => handleInputChange('state_province', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="municipality">Municipio</Label>
                    <Input 
                      id="municipality" 
                      placeholder="Ej. Mocoa"
                      value={formData.municipality}
                      onChange={(e) => handleInputChange('municipality', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locality">Localidad específica</Label>
                  <Input
                    id="locality"
                    placeholder="Ej. Vereda El Pepino, 2 km al sur de la cabecera municipal"
                    value={formData.locality}
                    onChange={(e) => handleInputChange('locality', e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="decimal_latitude">Latitud decimal</Label>
                    <Input
                      id="decimal_latitude"
                      placeholder="Ej. 1.1234"
                      value={formData.decimal_latitude}
                      onChange={(e) => handleInputChange('decimal_latitude', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="decimal_longitude">Longitud decimal</Label>
                    <Input
                      id="decimal_longitude"
                      placeholder="Ej. -76.5678"
                      value={formData.decimal_longitude}
                      onChange={(e) => handleInputChange('decimal_longitude', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimum_elevation_in_meters">Altitud (m)</Label>
                    <Input
                      id="minimum_elevation_in_meters"
                      placeholder="Ej. 800"
                      value={formData.minimum_elevation_in_meters}
                      onChange={(e) => handleInputChange('minimum_elevation_in_meters', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="habitat">Hábitat</Label>
                  <Textarea 
                    id="habitat" 
                    placeholder="Describe el hábitat donde fue encontrado el espécimen..."
                    value={formData.habitat}
                    onChange={(e) => handleInputChange('habitat', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sección: Colección */}
          <TabsContent value="coleccion" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de Colección</CardTitle>
                <CardDescription>Datos sobre la recolección del espécimen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="additional_collectors">Colectores adicionales</Label>
                  <Input 
                    id="additional_collectors" 
                    placeholder="Ej. María García, Luis Rodríguez"
                    value={formData.additional_collectors}
                    onChange={(e) => handleInputChange('additional_collectors', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_date">Fecha de colección</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => handleInputChange('event_date', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sección: Características */}
          <TabsContent value="caracteristicas" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Características del Espécimen</CardTitle>
                <CardDescription>Descripción morfológica y características observables</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción general</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe las características generales del espécimen..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="plant_habit">Hábito de crecimiento</Label>
                    <Select value={formData.plant_habit} onValueChange={(value) => handleInputChange('plant_habit', value)}>
                      <SelectTrigger id="habit">
                        <SelectValue placeholder="Selecciona el hábito" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="árbol">Árbol</SelectItem>
                        <SelectItem value="arbusto">Arbusto</SelectItem>
                        <SelectItem value="hierba">Hierba</SelectItem>
                        <SelectItem value="trepadora">Trepadora</SelectItem>
                        <SelectItem value="epífita">Epífita</SelectItem>
                        <SelectItem value="suculenta">Suculenta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height_min">Altura mínima (m)</Label>
                    <Input 
                      id="height_min" 
                      placeholder="Ej. 1.5"
                      value={formData.height_min}
                      onChange={(e) => handleInputChange('height_min', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="height_max">Altura máxima (m)</Label>
                    <Input 
                      id="height_max" 
                      placeholder="Ej. 15"
                      value={formData.height_max}
                      onChange={(e) => handleInputChange('height_max', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reproductive_state">Estado reproductivo</Label>
                    <Input 
                      id="reproductive_state" 
                      placeholder="Ej. Floreciendo, fructificando"
                      value={formData.reproductive_state}
                      onChange={(e) => handleInputChange('reproductive_state', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distinguishing_features">Características distintivas</Label>
                  <Textarea 
                    id="distinguishing_features" 
                    placeholder="Describe las características que distinguen este espécimen..."
                    value={formData.distinguishing_features}
                    onChange={(e) => handleInputChange('distinguishing_features', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uses">Usos conocidos</Label>
                  <Textarea 
                    id="uses" 
                    placeholder="Describe los usos medicinales, alimenticios o de otro tipo..."
                    value={formData.uses}
                    onChange={(e) => handleInputChange('uses', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="care_instructions">Instrucciones de cuidado</Label>
                  <Textarea 
                    id="care_instructions" 
                    placeholder="Instrucciones para el cuidado y mantenimiento..."
                    value={formData.care_instructions}
                    onChange={(e) => handleInputChange('care_instructions', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conservation_status">Estado de conservación</Label>
                  <Select value={formData.conservation_status} onValueChange={(value) => handleInputChange('conservation_status', value)}>
                    <SelectTrigger id="conservation_status">
                      <SelectValue placeholder="Selecciona el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NE">No Evaluado</SelectItem>
                      <SelectItem value="DD">Datos Insuficientes</SelectItem>
                      <SelectItem value="LC">Preocupación Menor</SelectItem>
                      <SelectItem value="NT">Casi Amenazado</SelectItem>
                      <SelectItem value="VU">Vulnerable</SelectItem>
                      <SelectItem value="EN">En Peligro</SelectItem>
                      <SelectItem value="CR">En Peligro Crítico</SelectItem>
                      <SelectItem value="EW">Extinto en Estado Silvestre</SelectItem>
                      <SelectItem value="EX">Extinto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations">Observaciones</Label>
                  <Textarea 
                    id="observations" 
                    placeholder="Observaciones adicionales sobre el espécimen..."
                    value={formData.observations}
                    onChange={(e) => handleInputChange('observations', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sección: Imágenes */}
          <TabsContent value="imagenes" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Imágenes del Espécimen</CardTitle>
                <CardDescription>
                  Agrega o actualiza las fotografías del espécimen. Formatos aceptados: JPG, PNG, GIF, WebP. Máximo 10MB por imagen.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Zona de arrastrar y soltar */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="imageUpload"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <ImagePlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Arrastra y suelta imágenes aquí
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    o haz clic en el botón para seleccionar
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Seleccionar imágenes
                  </Button>
                </div>

                {/* Vista previa de imágenes */}
                {uploadedImages.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-gray-700">
                      Imágenes ({uploadedImages.filter(img => !img.markedForDeletion).length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {uploadedImages.map((image, index) => (
                        <div
                          key={image.id || index}
                          className={`relative group rounded-lg overflow-hidden border ${
                            image.markedForDeletion
                              ? 'opacity-50 border-red-300 bg-red-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="aspect-square relative">
                            {image.isUploading ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                              </div>
                            ) : (
                              <CloudinaryImage
                                src={image.serverUrl || image.url}
                                alt={image.originalName}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>

                          {/* Indicador de estado */}
                          {image.uploadFailed && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                              Error
                            </div>
                          )}
                          {image.isExisting && !image.markedForDeletion && (
                            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                              Guardada
                            </div>
                          )}
                          {image.markedForDeletion && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                              Se eliminará
                            </div>
                          )}

                          {/* Botones de acción */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {image.markedForDeletion ? (
                              <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 bg-green-600 hover:bg-green-700"
                                onClick={() => restoreImage(index)}
                              >
                                <span className="text-white text-xs">↩</span>
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          {/* Nombre del archivo */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                            {image.originalName}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mensaje cuando no hay imágenes */}
                {uploadedImages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No hay imágenes asociadas a este espécimen.</p>
                    <p className="text-sm mt-1">Agrega imágenes para mejorar la documentación.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sección: Estado */}
          <TabsContent value="estado" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Estado de Publicación</CardTitle>
                <CardDescription>Controla la visibilidad del espécimen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Estado actual</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecciona el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="review">En revisión</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="deleted">Eliminado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Estados disponibles:</h4>
                      <ul className="text-sm text-blue-700 mt-1 space-y-1">
                        <li><strong>Borrador:</strong> Solo visible para administradores</li>
                        <li><strong>Pendiente:</strong> En revisión, no visible públicamente</li>
                        <li><strong>Publicado:</strong> Visible para todos los visitantes</li>
                        <li><strong>Archivado:</strong> No visible públicamente, conservado para historial</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/plantas')}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="bg-green-600 hover:bg-green-700" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
