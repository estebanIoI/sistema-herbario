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
  
  // Form state - usando nombres de campos que existen en la BD
  const [formData, setFormData] = useState({
    // Información taxonómica
    scientific_name: '',
    common_name: '',
    vernacular_name: '',
    family: '',
    genus: '',
    species: '',
    author: '',
    infraspecific_epithet: '',
    taxonomic_status: 'accepted',
    
    // Información del herbario
    herbarium_number: '',
    determination_date: '',
    determined_by: '',
    type_status: 'none',
    
    // Información de colección
    collector_name: '',
    collector_number: '',
    additional_collectors: '',
    collection_date: '',
    
    // Información geográfica
    country: 'Colombia',
    department: '',
    municipality: '',
    specific_location: '',
    latitude: '',
    longitude: '',
    altitude: '',
    coordinate_uncertainty: '',
    georeferenced_by: '',
    
    // Información ecológica
    habitat: '',
    substrate: '',
    associated_species: '',
    abundance: '',
    reproductive_state: '',
    
    // Descripción morfológica
    habit: '',
    height_min: '',
    height_max: '',
    description: '',
    distinguishing_features: '',
    
    // Información de uso
    uses: '',
    care_instructions: '',
    conservation_status: 'NE',
    
    // Información del sistema
    status: 'draft',
    featured: false,
    observations: '',
    notes: ''
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
        
        // Mapear los datos de la API al formato del formulario usando nombres reales de BD
        setFormData({
          // Información taxonómica
          scientific_name: plant.scientific_name || '',
          common_name: plant.common_name || '',
          vernacular_name: plant.vernacular_name || '',
          family: plant.family || '',
          genus: plant.genus || '',
          species: plant.species || '',
          author: plant.author || '',
          infraspecific_epithet: plant.infraspecific_epithet || '',
          taxonomic_status: plant.taxonomic_status || 'accepted',
          
          // Información del herbario
          herbarium_number: plant.herbarium_number || '',
          determination_date: plant.determination_date || '',
          determined_by: plant.determined_by || '',
          type_status: plant.type_status || 'none',
          
          // Información de colección
          collector_name: plant.collector_name || '',
          collector_number: plant.collector_number || '',
          additional_collectors: plant.additional_collectors || '',
          collection_date: plant.collection_date || '',
          
          // Información geográfica
          country: plant.country || 'Colombia',
          department: plant.department || '',
          municipality: plant.municipality || '',
          specific_location: plant.specific_location || '',
          latitude: plant.latitude || '',
          longitude: plant.longitude || '',
          altitude: plant.altitude || '',
          coordinate_uncertainty: plant.coordinate_uncertainty || '',
          georeferenced_by: plant.georeferenced_by || '',
          
          // Información ecológica
          habitat: plant.habitat || '',
          substrate: plant.substrate || '',
          associated_species: plant.associated_species || '',
          abundance: plant.abundance || '',
          reproductive_state: plant.reproductive_state || '',
          
          // Descripción morfológica
          habit: plant.habit || '',
          height_min: plant.height_min || '',
          height_max: plant.height_max || '',
          description: plant.description || '',
          distinguishing_features: plant.distinguishing_features || '',
          
          // Información de uso
          uses: plant.uses || '',
          care_instructions: plant.care_instructions || '',
          conservation_status: plant.conservation_status || 'NE',
          
          // Información del sistema
          status: plant.status || 'draft',
          featured: plant.featured || false,
          observations: plant.observations || '',
          notes: plant.notes || ''
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

      // Preparar los datos para enviar - solo campos que existen en la BD
      const updateData: any = {
        // Solo incluir campos que realmente existen en la tabla plants
        scientific_name: formData.scientific_name,
        common_name: formData.common_name || null,
        vernacular_name: formData.vernacular_name || null,
        family: formData.family,
        genus: formData.genus,
        species: formData.species || null,
        author: formData.author || null,
        infraspecific_epithet: formData.infraspecific_epithet || null,
        taxonomic_status: formData.taxonomic_status,
        
        herbarium_number: formData.herbarium_number || null,
        determination_date: dateToNull(formData.determination_date),
        determined_by: formData.determined_by || null,
        type_status: formData.type_status,
        
        collector_name: formData.collector_name || null,
        collector_number: formData.collector_number || null,
        additional_collectors: formData.additional_collectors || null,
        collection_date: dateToNull(formData.collection_date),
        
        country: formData.country,
        department: formData.department || null,
        municipality: formData.municipality || null,
        specific_location: formData.specific_location || null,
        latitude: numToNull(formData.latitude),
        longitude: numToNull(formData.longitude),
        altitude: numToNull(formData.altitude),
        coordinate_uncertainty: numToNull(formData.coordinate_uncertainty),
        georeferenced_by: formData.georeferenced_by || null,
        
        habitat: formData.habitat || null,
        substrate: formData.substrate || null,
        associated_species: formData.associated_species || null,
        abundance: formData.abundance || null,
        reproductive_state: formData.reproductive_state || null,
        
        habit: formData.habit || null,
        height_min: numToNull(formData.height_min),
        height_max: numToNull(formData.height_max),
        description: formData.description || null,
        distinguishing_features: formData.distinguishing_features || null,
        
        uses: formData.uses || null,
        care_instructions: formData.care_instructions || null,
        conservation_status: formData.conservation_status,
        
        status: formData.status,
        featured: formData.featured,
        observations: formData.observations || null,
        notes: formData.notes || null
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
                    <Label htmlFor="species">Especie</Label>
                    <Input 
                      id="species" 
                      placeholder="Ej. humboldtii"
                      value={formData.species}
                      onChange={(e) => handleInputChange('species', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="author">Autoría del nombre científico</Label>
                    <Input 
                      id="author" 
                      placeholder="Ej. Bonpl."
                      value={formData.author}
                      onChange={(e) => handleInputChange('author', e.target.value)}
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
                    <Label htmlFor="herbarium_number">Número de herbario</Label>
                    <Input 
                      id="herbarium_number" 
                      placeholder="Ej. HEAA-001234"
                      value={formData.herbarium_number}
                      onChange={(e) => handleInputChange('herbarium_number', e.target.value)}
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
                    <Label htmlFor="department">Departamento</Label>
                    <Input 
                      id="department" 
                      placeholder="Ej. Putumayo"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
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
                  <Label htmlFor="specific_location">Localidad específica</Label>
                  <Input 
                    id="specific_location" 
                    placeholder="Ej. Vereda El Pepino, 2 km al sur de la cabecera municipal"
                    value={formData.specific_location}
                    onChange={(e) => handleInputChange('specific_location', e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitud decimal</Label>
                    <Input 
                      id="latitude" 
                      placeholder="Ej. 1.1234"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitud decimal</Label>
                    <Input 
                      id="longitude" 
                      placeholder="Ej. -76.5678"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="altitude">Altitud (m)</Label>
                    <Input 
                      id="altitude" 
                      placeholder="Ej. 800"
                      value={formData.altitude}
                      onChange={(e) => handleInputChange('altitude', e.target.value)}
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
                  <Label htmlFor="collection_date">Fecha de colección</Label>
                  <Input 
                    id="collection_date" 
                    type="date"
                    value={formData.collection_date}
                    onChange={(e) => handleInputChange('collection_date', e.target.value)}
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
                    <Label htmlFor="habit">Hábito de crecimiento</Label>
                    <Select value={formData.habit} onValueChange={(value) => handleInputChange('habit', value)}>
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
                      <SelectItem value="pending">Pendiente de revisión</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="archived">Archivado</SelectItem>
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
