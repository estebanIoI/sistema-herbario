"use client"

// Usando la declaración completa de React para asegurarnos de tener acceso a todas las APIs
import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, MapPin, Thermometer, Droplets, Sun, MessageSquare } from "lucide-react"
import { CloudinaryImage } from "@/components/cloudinary-image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PlantDataSheet from "@/components/plant-data-sheet"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface PlantDetail {
  id: string | number;
  nombre?: string;
  nombreComun?: string;
  familia?: string;
  descripcion?: string;
  habitat?: string;
  usos?: string;
  cuidados?: string;
  imagen?: string;
  imagenes?: string[];
  numeroHerbario?: string;
  genero?: string;
  especie?: string;
  autor?: string;
  determino?: string;
  fechaDeterminacion?: string;
  colector?: string;
  numeroColector?: string;
  fechaColeccion?: string;
  localizacion?: string;
  nombreVernaculo?: string;
  habito?: string;
  estadoReproductivo?: string;
  // Propiedades para las tarjetas de cuidados
  luz?: string;
  riego?: string;
  temperatura?: string;
  // Campos de la API
  scientific_name?: string;
  vernacular_name?: string;
  common_name?: string;
  family?: string;
  genus?: string;
  specific_epithet?: string;
  description?: string;
  catalog_number?: string;
  recorded_by?: string;
  occurrence_id?: string;
  images?: any[];
}

// Tipado explícito para garantizar seguridad en TypeScript
interface RouteParams {
  id: string;
}

// Para Next.js 15.2+ y React 19
export default function PlantaDetalle({ params }: { params: Promise<RouteParams> | RouteParams }) {
  // En Next.js 15.2+, params puede ser una Promise o un objeto directo
  // Manejamos ambos casos de manera estable
  const [resolvedParams, setResolvedParams] = useState<RouteParams | null>(null);
  const [id, setId] = useState<string>("");
  
  // Resolver params de manera asíncrona y estable
  useEffect(() => {
    const resolveParams = async () => {
      try {
        // Si params es una Promise, la resolvemos
        const resolved = await Promise.resolve(params);
        setResolvedParams(resolved);
        setId(resolved.id);
      } catch (error) {
        console.error("Error resolviendo parámetros:", error);
        // Fallback en caso de error
        setId("1");
      }
    };
    
    resolveParams();
  }, [params]);
  
  // Use a ref for request tracking to persist across renders
  const requestSentRef = React.useRef(false)
  const [planta, setPlanta] = useState<PlantDetail>({ id: "" }) // Inicializar con string vacío
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Solo proceder si tenemos un ID válido
    if (!id) return;
    
    // Reset request flag when ID changes
    if (id !== planta.id?.toString()) {
      requestSentRef.current = false;
    }
    
    // Prevent duplicate requests using ref (more reliable across renders)
    if (requestSentRef.current) return;
    
    const loadPlantData = async () => {
      // Mark that we've sent the request
      requestSentRef.current = true;
      try {
        // Validar que el ID sea un número válido
        const plantId = Number(id);
        if (isNaN(plantId)) {
          toast({
            title: "ID de planta inválido",
            description: "El identificador de la planta no es válido",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        const response = await apiService.getPlantById(plantId)
        
        if (response.success && response.data) {
          // Mapear datos de la API al formato esperado por el componente
          // Obtener datos adicionales para cuidados, si existen
          const cuidadosData = response.data.care_instructions || {};
          
          // Extraer datos de la estructura anidada que devuelve la API
          const data = response.data;
          const taxonomia = data.taxonomia || {};
          const ubicacion = data.ubicacion || {};
          const coleccion = data.coleccion || {};
          const caracteristicas = data.caracteristicas || {};
          const herbario = data.herbario || {};
          
          // Preparar datos para el formato que espera el componente
          // Importante: primero esparcimos los datos originales y luego calculamos/normalizamos
          // para que valores vacíos ("" o null) del backend NO sobrescriban los fallbacks.
          const plantData = {
            ...response.data,
            id: data.id || id,
            // Nombre científico y nombre común
            nombre: data.scientific_name || taxonomia.nombreCientifico || "Nombre científico no disponible",
            nombreComun: data.common_name || taxonomia.nombreVernacular || "N/A",
            // Taxonomía
            familia: taxonomia.familia || data.family || "N/A",
            genero: taxonomia.genero || data.genus || "N/A",
            especie: taxonomia.epitetoEspecifico || data.specific_epithet || "N/A",
            autor: data.author || "N/A",
            nombreVernaculo: taxonomia.nombreVernacular || data.vernacular_name || "N/A",
            // Descripciones (si backend trae vacío, usamos fallback)
            descripcion: (caracteristicas.descripcion || data.description || "").trim() || "No hay descripción disponible",
            habitat: (caracteristicas.habitat || ubicacion.habitat || data.habitat || data.environment || "").trim() || "No hay información de hábitat disponible",
            usos: (caracteristicas.usos || data.uses || data.applications || "").trim() || "No hay información de usos disponible",
            cuidados: (caracteristicas.cuidados || data.care_instructions || "").trim() || "No hay información de cuidados disponible",
            // Imágenes
            imagen: data.images?.[0]?.url || "/placeholder.svg?height=500&width=800&text=Sin+imagen",
            imagenes: data.images?.map((img: any) => img.url) || [],
            // Datos de colección
            numeroHerbario: coleccion.numeroCatalogo || data.catalog_number || "N/A",
            determino: data.determined_by || "N/A",
            fechaDeterminacion: data.determination_date || "N/A",
            colector: coleccion.registradoPor || data.recorded_by || "N/A",
            numeroColector: data.collector_number || "N/A",
            fechaColeccion: coleccion.fechaEvento || data.event_date || "N/A",
            // Ubicación
            localizacion: ubicacion.localidad 
              ? `${ubicacion.pais || ""} ${ubicacion.departamento || ""} ${ubicacion.municipio || ""} ${ubicacion.localidad || ""}`.trim()
              : `${data.country || ""} ${data.state_province || ""} ${data.municipality || ""} ${data.locality || ""}`.trim() || "N/A",
            // Características
            habito: caracteristicas.habito || data.plant_habit || "N/A",
            estadoReproductivo: data.reproductive_condition || "N/A",
            // Datos para tarjetas de cuidados
            luz: cuidadosData.light || "No especificado",
            riego: cuidadosData.watering || "No especificado",
            temperatura: cuidadosData.temperature || "No especificado"
          }
          
          setPlanta(plantData)
        } else {
          toast({
            title: "Error al cargar la planta",
            description: response.error || "No se pudo cargar la información de la planta",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error al cargar detalles de la planta:", error)
        
        // Mensaje más amigable para visitantes
        toast({
          title: "No se pudo cargar la información",
          description: "La planta que buscas no está disponible en este momento. Intenta más tarde.",
          variant: "destructive"
        })
        
        // Cargar datos de ejemplo para no mostrar una página vacía al visitante
        setPlanta({
          id: id,
          nombre: "Información no disponible",
          nombreComun: "Información temporalmente no disponible",
          familia: "N/A",
          descripcion: "Lo sentimos, no podemos mostrar la información de esta planta en este momento.",
          imagen: "/placeholder.svg?height=500&width=800&text=Información+no+disponible"
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadPlantData()
  }, [id, toast, planta.id]) // Mantener dependencias pero id ahora se resuelve de manera estable

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/plantas" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al catálogo
        </Link>
      </Button>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Cargando información de la planta...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
            {/* Imagen principal y galería */}
            <div className="space-y-4">
              {/* Botón de sugerencias */}
              <div className="flex justify-end">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/plantas/${id}/sugerencia`} className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Sugerencias
                  </Link>
                </Button>
              </div>

              <div className="relative aspect-square overflow-hidden rounded-lg">
                <CloudinaryImage
                  src={planta.imagen || "/placeholder.svg"}
                  alt={planta.nombre || "Imagen de planta"}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Solo mostrar la galería si hay imágenes adicionales */}
              {planta.imagenes && planta.imagenes.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {planta.imagenes.map((img, i) => {
                    // Verificar que la URL de imagen sea válida
                    const imageUrl = img && typeof img === 'string' && img.trim() !== ''
                      ? img
                      : "/placeholder.svg";

                    return (
                      <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                        <CloudinaryImage
                          src={imageUrl}
                          alt={`${planta.nombre || 'Planta'} ${i + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Información de la planta */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold italic tracking-tight">{planta.nombre}</h1>
                <p className="text-xl text-muted-foreground">{planta.nombreComun}</p>
                <p className="text-sm text-muted-foreground mt-1">Familia: {planta.familia}</p>
              </div>

              <Tabs defaultValue="descripcion">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="descripcion">Descripción</TabsTrigger>
                  <TabsTrigger value="habitat">Hábitat</TabsTrigger>
                  <TabsTrigger value="usos">Usos</TabsTrigger>
                  <TabsTrigger value="cuidados">Cuidados</TabsTrigger>
                </TabsList>
                <TabsContent value="descripcion" className="mt-4">
                  <p>{planta.descripcion}</p>
                </TabsContent>
                <TabsContent value="habitat" className="mt-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <p>{planta.habitat || "No hay información disponible sobre el hábitat"}</p>
                  </div>
                </TabsContent>
                <TabsContent value="usos" className="mt-4">
                  <p>{planta.usos || "No hay información disponible sobre usos"}</p>
                </TabsContent>
                <TabsContent value="cuidados" className="mt-4">
                  <div className="space-y-4">
                    <p>{planta.cuidados || "No hay información disponible sobre cuidados"}</p>
                    {/* Mostrar tarjetas de cuidados si cualquiera de los tres tiene información específica */}
                    {(planta.luz !== "No especificado" || 
                      planta.riego !== "No especificado" || 
                      planta.temperatura !== "No especificado" || 
                      planta.cuidados) && (
                      <div className="grid grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="p-3">
                            <Sun className="h-5 w-5 text-amber-500" />
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <CardTitle className="text-sm">Luz</CardTitle>
                            <CardDescription>{planta.luz}</CardDescription>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="p-3">
                            <Droplets className="h-5 w-5 text-blue-500" />
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <CardTitle className="text-sm">Riego</CardTitle>
                            <CardDescription>{planta.riego}</CardDescription>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="p-3">
                            <Thermometer className="h-5 w-5 text-red-500" />
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <CardTitle className="text-sm">Temperatura</CardTitle>
                            <CardDescription>{planta.temperatura}</CardDescription>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Ficha técnica de la planta */}
          <div className="mt-12">
            <PlantDataSheet planta={{
              numeroHerbario: planta.numeroHerbario || "",
              familia: planta.familia || "",
              genero: planta.genero || "",
              especie: planta.especie || "",
              autor: planta.autor || "",
              determino: planta.determino || "",
              fechaDeterminacion: planta.fechaDeterminacion || "",
              colector: planta.colector || "",
              numeroColector: planta.numeroColector || "",
              fechaColeccion: planta.fechaColeccion || "",
              localizacion: planta.localizacion || "",
              nombreComun: planta.nombreComun || "",
              nombreVernaculo: planta.nombreVernaculo || "",
              habito: planta.habito || "",
              estadoReproductivo: planta.estadoReproductivo || "",
              // Nuevos campos integrados
              descripcion: planta.descripcion || planta.description || undefined,
              habitat: planta.habitat || undefined,
              usos: planta.usos || undefined,
              cuidados: planta.cuidados || undefined
            }} />
          </div>
        </>
      )}
    </div>
  )
}
