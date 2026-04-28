import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { CloudinaryImage } from "@/components/cloudinary-image"

interface PlantaProps {
  planta: {
    id: number
    nombre: string
    nombreComun: string
    familia: string
    imagen: string
    [key: string]: any
  }
}

export default function PlantCard({ planta }: PlantaProps) {
  return (
    <Link href={`/plantas/${planta.id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <div className="relative aspect-square">
          <CloudinaryImage
            src={planta.imagen || "/placeholder.svg"}
            alt={planta.nombre}
            fill
            className="object-cover"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold italic">{planta.nombre}</h3>
          <p className="text-sm text-muted-foreground">{planta.nombreComun}</p>
          <p className="text-xs text-muted-foreground mt-1">Familia: {planta.familia}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
