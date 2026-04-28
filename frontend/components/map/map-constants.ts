// Constantes y tipos compartidos entre PlantMap y MapContainerInternal.
// Este archivo NO importa Leaflet — es seguro en SSR.

export interface PlantMapData {
  id: number
  scientific_name: string
  vernacular_name?: string
  family: string
  decimal_latitude: number
  decimal_longitude: number
  department?: string
  municipality?: string
  recorded_by?: string
  event_date?: string
  catalog_number?: string
  altitude?: number | null
  habit?: string
  image?: string
  status?: string
}

export const FAMILY_PALETTE = [
  '#16a34a', // verde
  '#2563eb', // azul
  '#dc2626', // rojo
  '#d97706', // ámbar
  '#7c3aed', // violeta
  '#0891b2', // cian
  '#be185d', // rosa
  '#ea580c', // naranja
  '#0d9488', // teal
  '#9333ea', // púrpura
]

export const DEFAULT_MARKER_COLOR = '#6b7280'
