import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, MapPin, User } from "lucide-react"

interface PlantDataSheetProps {
  planta: {
    numeroHerbario: string
    familia: string
    genero: string
    especie: string
    autor: string
    determino: string
    fechaDeterminacion: string
    colector: string
    numeroColector: string
    fechaColeccion: string
    localizacion: string
    nombreComun: string
    nombreVernaculo: string
    habito: string
    estadoReproductivo: string
  // Campos adicionales integrados desde la base de datos
  descripcion?: string
  habitat?: string
  usos?: string
  cuidados?: string
  }
}

export default function PlantDataSheet({ planta }: PlantDataSheetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-green-600" />
          Ficha Técnica del Espécimen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Información taxonómica */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Información Taxonómica</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Número de herbario</label>
                <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{planta.numeroHerbario}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Familia</label>
                <p className="font-medium">{planta.familia}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Género</label>
                <p className="font-medium italic">{planta.genero}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Especie</label>
                <p className="font-medium italic">{planta.especie}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Autor</label>
                <p className="font-medium">{planta.autor}</p>
              </div>
            </div>
          </div>

          {/* Información de determinación y colección */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Determinación y Colección
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Determinó</label>
                <p className="font-medium">{planta.determino}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fecha de determinación</label>
                <p className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(planta.fechaDeterminacion).toLocaleDateString("es-ES")}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Colector</label>
                <p className="font-medium">{planta.colector}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Número del colector</label>
                <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{planta.numeroColector}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fecha de colección</label>
                <p className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(planta.fechaColeccion).toLocaleDateString("es-ES")}
                </p>
              </div>
            </div>
          </div>

          {/* Información geográfica y características */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ubicación y Características
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Localización completa</label>
                <p className="text-sm">{planta.localizacion}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nombre común</label>
                <p className="font-medium">{planta.nombreComun}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nombre vernáculo</label>
                <p className="font-medium">{planta.nombreVernaculo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Hábito</label>
                <Badge variant="secondary">{planta.habito}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Estado reproductivo</label>
                <Badge variant="outline" className="border-green-200 text-green-700">
                  {planta.estadoReproductivo}
                </Badge>
              </div>
            </div>
          </div>
        </div>


      </CardContent>
    </Card>
  )
}
