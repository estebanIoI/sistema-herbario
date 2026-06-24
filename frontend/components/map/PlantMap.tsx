"use client"

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { FAMILY_PALETTE, DEFAULT_MARKER_COLOR } from './map-constants'
import type { PlantMapData } from './map-constants'

// Re-exportar tipo para uso externo (sin tocar Leaflet)
export type { PlantMapData }

// Importación dinámica — Leaflet requiere window, nunca corre en SSR
const MapContainerInternal = dynamic(
  () => import('./MapContainerInternal'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="w-full h-full absolute inset-0 rounded-lg" />
          <p className="relative z-10 text-muted-foreground animate-pulse text-sm">Cargando mapa…</p>
        </div>
      </div>
    ),
  }
)

interface PlantMapProps {
  plants: PlantMapData[]
  onPlantClick?: (plantId: number) => void
  height?: string
  className?: string
  selectedPlantId?: number
  focusedCoords?: { lat: number; lng: number }
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function PlantMap({
  plants,
  onPlantClick,
  height = '500px',
  className = '',
  selectedPlantId,
  focusedCoords,
}: PlantMapProps) {
  const [legendOpen, setLegendOpen] = useState(true)

  // ── Color map: top N familias por conteo reciben colores de la paleta ──────
  const { familyColorMap, legendEntries } = useMemo(() => {
    const counts = new Map<string, number>()
    plants.forEach(p => {
      if (p.family) counts.set(p.family, (counts.get(p.family) ?? 0) + 1)
    })
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])

    const familyColorMap = new Map<string, string>()
    sorted.slice(0, FAMILY_PALETTE.length).forEach(([fam], i) => {
      familyColorMap.set(fam, FAMILY_PALETTE[i])
    })

    const legendEntries: { family: string; count: number; color: string }[] = sorted
      .slice(0, FAMILY_PALETTE.length)
      .map(([fam, count], i) => ({ family: fam, count, color: FAMILY_PALETTE[i] }))

    const othersCount = sorted.slice(FAMILY_PALETTE.length).reduce((s, [, c]) => s + c, 0)
    if (othersCount > 0) {
      legendEntries.push({ family: 'Otras familias', count: othersCount, color: DEFAULT_MARKER_COLOR })
    }

    return { familyColorMap, legendEntries }
  }, [plants])

  // ── Estadísticas ──────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:       plants.length,
    families:    new Set(plants.filter(p => p.family).map(p => p.family)).size,
    departments: new Set(plants.filter(p => p.state_province).map(p => p.state_province)).size,
  }), [plants])

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Mapa */}
      <MapContainerInternal
        plants={plants}
        familyColorMap={familyColorMap}
        onPlantClick={onPlantClick}
        selectedPlantId={selectedPlantId}
        focusedCoords={focusedCoords}
      />

      {/* ── Panel de estadísticas (esquina inferior izquierda) ───────────── */}
      {plants.length > 0 && (
        <div className="map-stats">
          <div className="map-stats-row">
            <span className="map-stats-icon">🌿</span>
            <span><strong>{stats.total}</strong> especímenes</span>
          </div>
          <div className="map-stats-row">
            <span className="map-stats-icon">📚</span>
            <span><strong>{stats.families}</strong> familias</span>
          </div>
          <div className="map-stats-row">
            <span className="map-stats-icon">📍</span>
            <span><strong>{stats.departments}</strong> departamentos</span>
          </div>
        </div>
      )}

      {/* ── Leyenda de familias (esquina inferior derecha) ──────────────── */}
      {legendEntries.length > 0 && (
        <div className={`plant-legend ${legendOpen ? 'legend-open' : 'legend-collapsed'}`}>
          <button
            className="legend-toggle"
            onClick={() => setLegendOpen(o => !o)}
            title={legendOpen ? 'Ocultar leyenda' : 'Mostrar leyenda'}
          >
            <span>Familias</span>
            <span className="legend-chevron">{legendOpen ? '▾' : '▸'}</span>
          </button>

          {legendOpen && (
            <ul className="legend-list">
              {legendEntries.map(e => (
                <li key={e.family} className="legend-item">
                  <span className="legend-dot" style={{ background: e.color }} />
                  <span className="legend-family">{e.family}</span>
                  <span className="legend-count">{e.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
