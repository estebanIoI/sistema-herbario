"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Map, List, Camera, ChevronUp, ChevronDown, ChevronsUpDown, Eye } from "lucide-react"
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
  const router = useRouter()
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
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map')
  const [mapPlants, setMapPlants] = useState<PlantMapData[]>([])
  const [mapLoading, setMapLoading] = useState(false)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [tablePage, setTablePage] = useState(1)
  const [tablePageSize, setTablePageSize] = useState(25)

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
      loadMapPlants()
    }, searchTerm ? 500 : 0)

    return () => clearTimeout(debounceTimer)
  }, [currentPage, searchTerm, familiaFilter, advancedFilters])

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

  // ── Tabla del mapa ──────────────────────────────────────────────────────────

  const mapTableStats = useMemo(() => {
    const families    = new Set(mapPlants.filter(p => p.family).map(p => p.family)).size
    const genera      = new Set(mapPlants.filter(p => p.genus).map(p => p.genus)).size
    const species     = new Set(mapPlants.map(p => p.scientific_name)).size
    const threatened  = mapPlants.filter(p => p.conservation_status && p.conservation_status.trim() !== '').length
    const useful      = mapPlants.filter(p => p.has_uses === 1).length
    return { families, genera, species, threatened, useful }
  }, [mapPlants])

  const handleTableSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setTablePage(1)
  }

  const sortedMapPlants = useMemo(() => {
    if (!sortField) return mapPlants
    return [...mapPlants].sort((a, b) => {
      const av = ((a as any)[sortField] ?? '') as string
      const bv = ((b as any)[sortField] ?? '') as string
      const cmp = String(av).localeCompare(String(bv), 'es', { sensitivity: 'base' })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [mapPlants, sortField, sortDir])

  const totalTablePages = Math.ceil(sortedMapPlants.length / tablePageSize)
  const paginatedMapPlants = useMemo(() => {
    const start = (tablePage - 1) * tablePageSize
    return sortedMapPlants.slice(start, start + tablePageSize)
  }, [sortedMapPlants, tablePage, tablePageSize])

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
        <>
          {/* Mapa */}
          <div className="mb-8">
            {mapLoading ? (
              <div className="h-[500px] bg-muted rounded-lg flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Cargando mapa...</p>
              </div>
            ) : mapPlants.length === 0 ? (
              <div className="h-[500px] bg-muted rounded-lg flex flex-col items-center justify-center">
                <p className="text-lg text-muted-foreground">No hay plantas con ubicación geográfica registrada.</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <PlantMap
                plants={mapPlants}
                height="500px"
                className="rounded-lg border shadow-sm"
              />
            )}
          </div>

          {/* ── Sección estadísticas + tabla ─────────────────────────────── */}
          {!mapLoading && mapPlants.length > 0 && (
            <div className="mb-8">
              {/* Contador total */}
              <p className="text-sm text-muted-foreground mb-5">
                <span className="font-semibold text-foreground">{mapPlants.length}</span> registros con ubicación geográfica
              </p>

              {/* Tarjetas de estadísticas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {[
                  { label: 'Familias',            value: mapTableStats.families,  color: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800' },
                  { label: 'Géneros',             value: mapTableStats.genera,    color: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' },
                  { label: 'Especies',            value: mapTableStats.species,   color: 'bg-violet-50 border-violet-200 dark:bg-violet-950 dark:border-violet-800' },
                  { label: 'Esp. amenazadas',     value: mapTableStats.threatened,color: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' },
                  { label: 'Plantas útiles',      value: mapTableStats.useful,    color: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800' },
                ].map(card => (
                  <div key={card.label} className={`rounded-xl border p-4 text-center ${card.color}`}>
                    <p className="text-3xl font-bold tabular-nums">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-tight">{card.label}</p>
                  </div>
                ))}
              </div>

              {/* Controles de la tabla */}
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-sm text-muted-foreground">
                  Mostrando registros del{' '}
                  <span className="font-medium text-foreground">{(tablePage - 1) * tablePageSize + 1}</span>
                  {' '}al{' '}
                  <span className="font-medium text-foreground">{Math.min(tablePage * tablePageSize, sortedMapPlants.length)}</span>
                  {' '}de un total de{' '}
                  <span className="font-medium text-foreground">{sortedMapPlants.length}</span> registros
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Registros por página:</span>
                  <Select value={String(tablePageSize)} onValueChange={v => { setTablePageSize(Number(v)); setTablePage(1) }}>
                    <SelectTrigger className="w-20 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 25, 50, 100].map(n => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto rounded-lg border shadow-sm">
                <table className="w-full text-sm">
                  {(() => {
                    const SortIcon = ({ field }: { field: string }) => {
                      if (sortField !== field) return <ChevronsUpDown className="inline h-3 w-3 ml-1 opacity-40" />
                      return sortDir === 'asc'
                        ? <ChevronUp className="inline h-3 w-3 ml-1 text-primary" />
                        : <ChevronDown className="inline h-3 w-3 ml-1 text-primary" />
                    }
                    const headers = (
                      <tr className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-3 text-left cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleTableSort('collector_number')}>
                          No. Colector <SortIcon field="collector_number" />
                        </th>
                        <th className="px-3 py-3 text-left cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleTableSort('recorded_by')}>
                          Colector <SortIcon field="recorded_by" />
                        </th>
                        <th className="px-3 py-3 text-center whitespace-nowrap">Imagen</th>
                        <th className="px-3 py-3 text-left cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleTableSort('family')}>
                          Familia <SortIcon field="family" />
                        </th>
                        <th className="px-3 py-3 text-left cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleTableSort('genus')}>
                          Género <SortIcon field="genus" />
                        </th>
                        <th className="px-3 py-3 text-left cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleTableSort('scientific_name')}>
                          Especie <SortIcon field="scientific_name" />
                        </th>
                        <th className="px-3 py-3 text-left cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleTableSort('catalog_number')}>
                          No. Herbario <SortIcon field="catalog_number" />
                        </th>
                        <th className="px-3 py-3 text-center whitespace-nowrap">Acción</th>
                      </tr>
                    )
                    return (
                      <>
                        <thead>{headers}</thead>
                        <tbody className="divide-y divide-border">
                          {paginatedMapPlants.map((plant, idx) => (
                            <tr key={plant.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                              <td className="px-3 py-2 text-muted-foreground">{plant.collector_number || '—'}</td>
                              <td className="px-3 py-2">{plant.recorded_by || '—'}</td>
                              <td className="px-3 py-2 text-center">
                                {plant.image ? (
                                  <img
                                    src={plant.image}
                                    alt={plant.scientific_name}
                                    className="h-10 w-14 object-cover rounded mx-auto"
                                  />
                                ) : (
                                  <Camera className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                                )}
                              </td>
                              <td className="px-3 py-2">{plant.family || '—'}</td>
                              <td className="px-3 py-2">{plant.genus || '—'}</td>
                              <td className="px-3 py-2">
                                <em>{plant.scientific_name}</em>
                                {plant.author && <span className="text-muted-foreground ml-1 not-italic">{plant.author}</span>}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{plant.catalog_number || '—'}</td>
                              <td className="px-3 py-2 text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs gap-1"
                                  onClick={() => router.push(`/plantas/${plant.id}`)}
                                >
                                  <Eye className="h-3 w-3" />
                                  Ver ficha
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>{headers}</tfoot>
                      </>
                    )
                  })()}
                </table>
              </div>

              {/* Paginación */}
              {totalTablePages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTablePage(p => Math.max(1, p - 1))}
                    disabled={tablePage === 1}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalTablePages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalTablePages - 4, tablePage - 2)) + i
                      if (pageNum > totalTablePages) return null
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === tablePage ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTablePage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTablePage(p => Math.min(totalTablePages, p + 1))}
                    disabled={tablePage === totalTablePages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
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
