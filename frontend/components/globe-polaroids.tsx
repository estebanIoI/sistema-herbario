"use client"

import { GlobePolaroids, PolaroidMarker } from "@/components/ui/cobe-globe-polaroids"

interface Plant {
  id: number
  scientificName: string
  commonName?: string
  family?: string
  image?: string
}

// Ubicaciones en Colombia/Amazonia donde se recolectan las plantas
const LOCATIONS: [number, number][] = [
  [4.711,  -74.072],   // Bogotá
  [-1.831, -78.183],   // Amazonas ecuatoriano
  [-4.215, -69.943],   // Leticia
  [1.614,  -75.607],   // Florencia
  [3.865,  -67.926],   // Puerto Inírida
  [-3.119, -60.022],   // Manaos
]

const ROTATIONS = [-5, 4, -3, 6, -4, 3]

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?w=120&h=120&fit=crop",
]

interface Props {
  plants?: Plant[]
  speed?: number
  className?: string
}

export default function GlobeWithPlants({ plants = [], speed = 0.003, className }: Props) {
  const withImages = plants.filter(p => p.image)

  const markers: PolaroidMarker[] = LOCATIONS.map((location, i) => {
    const plant = withImages[i]
    return {
      id:             `plant-${i}`,
      location,
      image:          plant?.image ?? FALLBACK_IMAGES[i % FALLBACK_IMAGES.length],
      caption:        plant ? (plant.commonName || plant.scientificName) : `Planta ${i + 1}`,
      rotate:         ROTATIONS[i],
      plantId:        plant?.id,
      scientificName: plant?.scientificName,
      commonName:     plant?.commonName,
      family:         plant?.family,
    }
  })

  return <GlobePolaroids markers={markers} speed={speed} className={className} />
}
