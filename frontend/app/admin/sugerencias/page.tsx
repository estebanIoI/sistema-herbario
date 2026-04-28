"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, Eye, CheckCircle, X, Clock, MessageSquare } from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

// Tipos para las sugerencias
interface Sugerencia {
  id: number
  plantaId?: string
  plantaNombre?: string
  nombre: string
  apellido?: string
  email: string
  telefono?: string
  correccion: string
  argumento: string
  fecha: string
  estado: string
  scientific_name?: string
  title?: string
  description?: string
  contact_name?: string
  contact_email?: string
  submitted_at?: string
  status?: string
}

// No se necesitan datos de ejemplo, todos los datos vendrán de la API

export default function SugerenciasPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSugerencia, setSelectedSugerencia] = useState<Sugerencia | null>(null)
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuth()

  // Cargar sugerencias desde el API
  useEffect(() => {
    loadSuggestions()
  }, [currentPage])

  const loadSuggestions = async () => {
    setLoading(true)
    try {
      console.log("Cargando sugerencias, página:", currentPage)
      console.log("Estado de autenticación:", isAuthenticated, "Usuario:", user?.role)
      
      // Verificar si el usuario está autenticado antes de cargar
      if (!isAuthenticated) {
        console.error("Usuario no autenticado al cargar sugerencias")
        toast({
          title: "Error de autenticación",
          description: "Debes iniciar sesión para acceder a las sugerencias",
          variant: "destructive"
        })
        setSugerencias([])
        setLoading(false)
        return
      }

      const response = await apiService.getSuggestions({
        page: currentPage,
        limit: 20,
        status: 'all'
      })

      console.log("Respuesta de sugerencias:", response)

      if (response.success && response.data) {
        // Mapear los datos de la API al formato esperado por el componente
        const mappedSugerencias = response.data.suggestions.map((sugerencia: any) => ({
          id: sugerencia.id,
          plantaId: sugerencia.plant_id?.toString(),
          plantaNombre: sugerencia.scientific_name || "Sin nombre científico",
          nombre: sugerencia.contact_name || sugerencia.name || "Anónimo",
          apellido: "",
          email: sugerencia.contact_email || sugerencia.email || "",
          telefono: sugerencia.contact_phone || "",
          correccion: sugerencia.title || "",
          argumento: sugerencia.description || "",
          fecha: sugerencia.submitted_at || new Date().toISOString(),
          estado: mapApiStatus(sugerencia.status),
          // Mantener campos originales para referencia
          ...sugerencia
        }))

        setSugerencias(mappedSugerencias)
        
        // Configurar paginación
        if (response.data.pagination) {
          setPagination({
            page: response.data.pagination.page,
            limit: response.data.pagination.limit,
            total: response.data.pagination.total,
            totalPages: response.data.pagination.totalPages,
            hasNext: response.data.pagination.hasNext,
            hasPrev: response.data.pagination.hasPrev
          })
        }
      } else {
        console.error("Error al cargar sugerencias:", response.error)
        setSugerencias([])
        toast({
          title: "Error al cargar sugerencias",
          description: response.error || "No se pudieron cargar las sugerencias",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error al cargar sugerencias:", error)
      setSugerencias([])
      toast({
        title: "Error de conexión",
        description: error instanceof Error ? error.message : "No se pudo conectar con el servidor",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para mapear estados de la API a los estados del componente
  const mapApiStatus = (status?: string) => {
    switch (status) {
      case 'pending': return 'nueva'
      case 'in_review': return 'revisada'
      case 'approved': return 'aprobada'
      case 'rejected': return 'rechazada'
      default: return status || 'nueva'
    }
  }

  // Función para cambiar el estado de una sugerencia
  const handleChangeStatus = async (id: number, status: string) => {
    try {
      console.log(`Cambiando estado de sugerencia ${id} a ${status}`);
      let response;
      
      switch (status) {
        case 'aprobada':
          response = await apiService.approveSuggestion(id)
          break
        case 'rechazada':
          response = await apiService.rejectSuggestion(id)
          break
        case 'revisada':
          response = await apiService.updateSuggestionStatus(id, 'in_review')
          break
        default:
          response = await apiService.updateSuggestionStatus(id, status)
      }

      if (response.success) {
        toast({
          title: "Estado actualizado",
          description: "El estado de la sugerencia ha sido actualizado correctamente"
        })
        
        // Actualizar localmente
        setSugerencias(prev => prev.map(s => 
          s.id === id ? { ...s, estado: status } : s
        ))
        
        if (selectedSugerencia?.id === id) {
          setSelectedSugerencia(prev => prev ? {...prev, estado: status} : null)
        }
      } else {
        toast({
          title: "Error",
          description: response.error || "No se pudo actualizar el estado",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el estado",
        variant: "destructive"
      })
    }
  }

  const filteredSugerencias = sugerencias.filter(
    (sugerencia) =>
      (sugerencia.plantaNombre?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (sugerencia.nombre?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (sugerencia.apellido?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
  )

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "nueva":
        return <Badge variant="destructive">Nueva</Badge>
      case "revisada":
        return <Badge variant="secondary">Revisada</Badge>
      case "aprobada":
        return (
          <Badge variant="default" className="bg-green-600">
            Aprobada
          </Badge>
        )
      case "rechazada":
        return <Badge variant="outline">Rechazada</Badge>
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "nueva":
        return <Clock className="h-4 w-4 text-red-500" />
      case "revisada":
        return <Eye className="h-4 w-4 text-blue-500" />
      case "aprobada":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rechazada":
        return <X className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const estadisticas = {
    total: sugerencias.length,
    nuevas: sugerencias.filter((s) => s.estado === "nueva").length,
    revisadas: sugerencias.filter((s) => s.estado === "revisada").length,
    aprobadas: sugerencias.filter((s) => s.estado === "aprobada").length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Sugerencias</h1>
        <p className="text-muted-foreground">Administra las sugerencias de corrección enviadas por los usuarios</p>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevas</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estadisticas.nuevas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revisadas</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{estadisticas.revisadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estadisticas.aprobadas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar sugerencias..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de sugerencias */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>Planta</TableHead>
              <TableHead>Enviado por</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Corrección</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">Cargando sugerencias...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSugerencias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <p className="text-sm text-muted-foreground">No se encontraron sugerencias</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSugerencias.map((sugerencia) => (
                <TableRow key={sugerencia.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getEstadoIcon(sugerencia.estado)}
                      {getEstadoBadge(sugerencia.estado)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium italic">{sugerencia.plantaNombre || "N/A"}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {sugerencia.nombre} {sugerencia.apellido || ""}
                      </p>
                      <p className="text-sm text-muted-foreground">{sugerencia.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(sugerencia.fecha).toLocaleDateString("es-ES")}</TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate">{sugerencia.correccion}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedSugerencia(sugerencia)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalle de Sugerencia</DialogTitle>
                          <DialogDescription>Sugerencia para {selectedSugerencia?.plantaNombre}</DialogDescription>
                        </DialogHeader>
                        {selectedSugerencia && (
                          <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <h4 className="font-semibold mb-2">Información del remitente</h4>
                                <div className="space-y-1 text-sm">
                                  <p>
                                    <strong>Nombre:</strong> {selectedSugerencia.nombre} {selectedSugerencia.apellido || ""}
                                  </p>
                                  <p>
                                    <strong>Email:</strong> {selectedSugerencia.email}
                                  </p>
                                  {selectedSugerencia.telefono && (
                                    <p>
                                      <strong>Teléfono:</strong> {selectedSugerencia.telefono}
                                    </p>
                                  )}
                                  <p>
                                    <strong>Fecha:</strong> {new Date(selectedSugerencia.fecha).toLocaleString("es-ES")}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Estado actual</h4>
                                <div className="flex items-center gap-2">
                                  {getEstadoIcon(selectedSugerencia.estado)}
                                  {getEstadoBadge(selectedSugerencia.estado)}
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">Corrección sugerida</h4>
                              <p className="text-sm bg-muted p-3 rounded">{selectedSugerencia.correccion}</p>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">Argumento</h4>
                              <p className="text-sm bg-muted p-3 rounded">{selectedSugerencia.argumento}</p>
                            </div>

                            <div className="flex gap-2 pt-4">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleChangeStatus(selectedSugerencia.id, 'aprobada')}
                                disabled={selectedSugerencia.estado === 'aprobada' || loading}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprobar
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleChangeStatus(selectedSugerencia.id, 'revisada')}
                                disabled={selectedSugerencia.estado === 'revisada' || loading}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Marcar como revisada
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleChangeStatus(selectedSugerencia.id, 'rechazada')}
                                disabled={selectedSugerencia.estado === 'rechazada' || loading}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Paginación */}
      {!loading && filteredSugerencias.length > 0 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((old) => Math.max(old - 1, 1))}
            disabled={currentPage === 1 || loading}
          >
            Anterior
          </Button>
          <div className="text-sm">
            Página {pagination.page} de {pagination.totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((old) => old + 1)}
            disabled={!pagination.hasNext || loading}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
