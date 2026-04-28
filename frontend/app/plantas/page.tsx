"use client"

import { useState, useEffect } from "react"
import { Search, X, Map, List } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import PlantCard from "@/components/plant-card"
import AdvancedFilters from "@/components/advanced-filters"
import PlantMap from "@/components/map/PlantMap"
import type { PlantMapData } from "@/components/map/map-constants"
import { apiService } from "@/lib/api"

// Interfaz para las plantas de la API
interface Plant {
  id: number;
  occurrence_id?: string;
  catalog_number?: string;
  scientific_name: string;
  vernacular_name?: string;
  family: string;
  genus: string;
  specific_epithet?: string;
  state_province?: string;
  municipality?: string;
  locality?: string;
  recorded_by?: string;
  event_date?: string;
  flower_color?: string;
  plant_habit?: string;
  description?: string;
  habitat?: string;
  uses?: string;
  care_instructions?: string;
  decimal_latitude?: number;
  decimal_longitude?: number;
  imageUrls?: string[];
  // Campos adicionales para compatibilidad con PlantCard
  nombre: string;
  nombreComun: string;
  familia: string;
  genero: string;
  especie: string;
  departamento: string;
  municipio: string;
  colector: string;
  numeroColector: string;
  imagen: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function PlantasPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [familiaFilter, setFamiliaFilter] = useState("")
  const [advancedFilters, setAdvancedFilters] = useState<{ field: string; value: string }[]>([])
  const [plantas, setPlantas] = useState<Plant[]>([])
  const [filteredPlantas, setFilteredPlantas] = useState<Plant[]>([])
  const [families, setFamilies] = useState<Array<{value: string, label: string}>>([])
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [mapPlants, setMapPlants] = useState<PlantMapData[]>([])
  const [mapLoading, setMapLoading] = useState(false)

  // Función para cargar plantas desde la API
  const loadPlants = async (params: any = {}) => {
    setLoading(true)
    try {
      // Construir parámetros de filtros avanzados para el backend
      const advancedFiltersParams: any = {}
      advancedFilters.forEach((filter) => {
        // Mapear los campos del frontend a los campos del backend
        const fieldMapping: Record<string, string> = {
          familia: 'family',
          genero: 'genus', 
          especie: 'species',
          departamento: 'department',
          municipio: 'municipality',
          nombreComun: 'vernacular_name',
          colector: 'collector',
          numeroColector: 'catalog_number'
        }
        
        const backendField = fieldMapping[filter.field] || filter.field
        advancedFiltersParams[backendField] = filter.value
      })

      const response = await apiService.getPlants({
        page: currentPage,
        limit: 12,
        search: searchTerm,
        family: familiaFilter && familiaFilter !== "todas" ? familiaFilter : undefined,
        ...advancedFiltersParams, // Incluir filtros avanzados
        ...params
      })

      if (response.success && response.data && response.data.plants) {
        // Mapear los datos de la API al formato esperado por la interfaz
        const mappedPlants = response.data.plants.map((plant: any) => ({
          id: plant.id,
          occurrence_id: plant.occurrence_id,
          catalog_number: plant.catalog_number,
          scientific_name: plant.scientific_name,
          vernacular_name: plant.vernacular_name,
          family: plant.family,
          genus: plant.genus,
          specific_epithet: plant.specific_epithet,
          state_province: plant.state_province,
          municipality: plant.municipality,
          locality: plant.locality,
          recorded_by: plant.recorded_by,
          event_date: plant.event_date,
          flower_color: plant.flower_color,
          plant_habit: plant.plant_habit,
          description: plant.description,
          habitat: plant.habitat,
          uses: plant.uses,
          care_instructions: plant.care_instructions,
          decimal_latitude: plant.decimal_latitude,
          decimal_longitude: plant.decimal_longitude,
          imageUrls: plant.imageUrls || [],
          // Campos adicionales para compatibilidad con PlantCard
          nombre: plant.scientific_name,
          nombreComun: plant.vernacular_name || plant.common_name || "No disponible",
          familia: plant.family,
          genero: plant.genus,
          especie: plant.specific_epithet || "",
          departamento: plant.state_province || "No disponible",
          municipio: plant.municipality || "No disponible",
          colector: plant.recorded_by || "No disponible",
          numeroColector: plant.catalog_number || "No disponible",
          imagen: plant.imageUrls && plant.imageUrls.length > 0 
            ? plant.imageUrls[0] 
            : "/placeholder.svg?height=300&width=400&text=" + encodeURIComponent(plant.scientific_name || "Planta")
        }))

        setPlantas(mappedPlants)
        setFilteredPlantas(mappedPlants)
        
        // Mapear la paginación de la API a nuestro formato
        const apiPagination = response.data.pagination
        setPagination({
          page: apiPagination.page,
          limit: apiPagination.limit,
          total: apiPagination.total,
          totalPages: apiPagination.pages || Math.ceil(apiPagination.total / apiPagination.limit),
          hasNext: apiPagination.page < (apiPagination.pages || Math.ceil(apiPagination.total / apiPagination.limit)),
          hasPrev: apiPagination.page > 1
        })
      } else {
        console.error("Error en la respuesta:", response.error || "Respuesta inválida")
        setPlantas([])
        setFilteredPlantas([])
      }
    } catch (error) {
      console.error("Error al cargar plantas:", error)
    } finally {
      setLoading(false)
    }
  }

  // Función para cargar familias
  const loadFamilies = async () => {
    try {
      const response = await apiService.getFamilies()
      if (response.success && response.data) {
        // El backend siempre devuelve {families: [...], total: number}
        // Filtrar familias con nombres vacíos (SelectItem no permite value="")
        const mappedFamilies = response.data.families
          .filter((family) => family.name && family.name.trim() !== '')
          .map((family) => ({
            value: family.name,
            label: `${family.name} (${family.speciesCount} especies)`
          }))
        setFamilies(mappedFamilies)
      }
    } catch (error) {
      console.error("Error al cargar familias:", error)
    }
  }

  // Función para cargar plantas para el mapa
  const loadMapPlants = async () => {
    setMapLoading(true)
    try {
      // Construir parámetros de filtros avanzados para el backend
      const advancedFiltersParams: any = {}
      advancedFilters.forEach((filter) => {
        const fieldMapping: Record<string, string> = {
          familia: 'family',
          genero: 'genus',
          especie: 'species',
          departamento: 'department',
          municipio: 'municipality',
          nombreComun: 'vernacular_name',
          colector: 'collector',
          numeroColector: 'catalog_number'
        }
        const backendField = fieldMapping[filter.field] || filter.field
        advancedFiltersParams[backendField] = filter.value
      })

      const response = await apiService.getPlantsForMap({
        search: searchTerm,
        family: familiaFilter && familiaFilter !== "todas" ? familiaFilter : undefined,
        ...advancedFiltersParams
      })

      if (response.success && response.data) {
        setMapPlants(response.data.plants)
      }
    } catch (error) {
      console.error("Error al cargar plantas para el mapa:", error)
    } finally {
      setMapLoading(false)
    }
  }

  // Cargar familias al montar el componente
  useEffect(() => {
    loadFamilies()
  }, [])
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadPlants()
      // Cargar plantas del mapa si estamos en modo mapa
      if (viewMode === 'map') {
        loadMapPlants()
      }
    }, searchTerm ? 500 : 0) // Debounce de 500ms para búsquedas

    return () => clearTimeout(debounceTimer)
  }, [currentPage, searchTerm, familiaFilter, advancedFilters])

  // Cargar plantas del mapa cuando se cambia a vista de mapa
  useEffect(() => {
    if (viewMode === 'map' && mapPlants.length === 0) {
      loadMapPlants()
    }
  }, [viewMode])

  // Los filtros avanzados ahora se envían al backend junto con otros filtros
  // Ya no necesitamos aplicar filtros localmente porque el backend maneja todo
  useEffect(() => {
    // Solo mostramos las plantas que vienen del backend
    // ya filtradas según todos los criterios incluyendo filtros avanzados
    setFilteredPlantas(plantas)
  }, [plantas])

  // Manejar la eliminación de un filtro avanzado
  const removeAdvancedFilter = (index: number) => {
    const newFilters = [...advancedFilters]
    newFilters.splice(index, 1)
    setAdvancedFilters(newFilters)
  }

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm("")
    setFamiliaFilter("")
    setAdvancedFilters([])
    setCurrentPage(1)
    // Recargar plantas sin filtros
    loadPlants()
  }

  // Obtener el label para un campo dado
  const getFieldLabel = (field: string) => {
    const fieldLabels: Record<string, string> = {
      familia: "Familia",
      genero: "Género",
      especie: "Especie",
      departamento: "Departamento",
      municipio: "Municipio",
      nombreComun: "Nombre común",
      colector: "Nombre del colector",
      numeroColector: "Número del colector",
    }
    return fieldLabels[field] || field
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter mb-2">Catálogo de Plantas</h1>
          <p className="text-muted-foreground">Explora nuestra colección de plantas y descubre sus características</p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="grid gap-4 mb-8 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar plantas..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={familiaFilter} onValueChange={setFamiliaFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Familia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {families.map((family) => (
              <SelectItem key={family.value} value={family.value}>
                {family.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <AdvancedFilters onFiltersChange={setAdvancedFilters} />

        {/* Toggle Vista Lista/Mapa */}
        <div className="flex gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            Lista
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('map')}
            className="gap-2"
          >
            <Map className="h-4 w-4" />
            Mapa
          </Button>
        </div>
      </div>

      {/* Filtros activos */}
      {(familiaFilter || advancedFilters.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {familiaFilter && familiaFilter !== "todas" && (
            <Badge variant="outline" className="flex items-center gap-1">
              Familia: {familiaFilter}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setFamiliaFilter("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {advancedFilters.map((filter, index) => (
            <Badge key={index} variant="outline" className="flex items-center gap-1">
              {getFieldLabel(filter.field)}: {filter.value}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeAdvancedFilter(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Vista de Mapa */}
      {viewMode === 'map' && (
        <div className="mb-8">
          {mapLoading ? (
            <div className="h-[500px] bg-muted rounded-lg flex items-center justify-center">
              <p className="text-lg text-muted-foreground">Cargando mapa...</p>
            </div>
          ) : mapPlants.length === 0 ? (
            <div className="h-[500px] bg-muted rounded-lg flex flex-col items-center justify-center">
              <p className="text-lg text-muted-foreground">No hay plantas con ubicación geográfica registrada.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={clearFilters}
              >
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-2">
                {mapPlants.length} plantas con ubicación geográfica
              </div>
              <PlantMap
                plants={mapPlants}
                height="500px"
                className="rounded-lg border shadow-sm"
              />
            </>
          )}
        </div>
      )}

      {/* Resultados de la búsqueda (Vista Lista) */}
      {viewMode === 'list' && (
        <>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Cargando plantas...</p>
            </div>
          ) : filteredPlantas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No se encontraron plantas con los criterios seleccionados.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  clearFilters()
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredPlantas.map((planta) => (
                  <PlantCard key={planta.id} planta={planta} />
                ))}
              </div>

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    Anterior
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(
                        pagination.totalPages - 4,
                        Math.max(1, currentPage - 2)
                      )) + i;

                      if (pageNum > pagination.totalPages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Siguiente
                  </Button>
                </div>
              )}

              {/* Información de resultados */}
              <div className="text-center text-sm text-muted-foreground mt-4">
                Mostrando {((currentPage - 1) * pagination.limit) + 1} - {Math.min(currentPage * pagination.limit, pagination.total)} de {pagination.total} plantas
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
