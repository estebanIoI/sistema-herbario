"use client"

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import { useRouter } from 'next/navigation'
import MarkerClusterGroup from 'react-leaflet-cluster'

import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import './map-styles.css'

// Tipos y constantes compartidos — importados desde archivo sin Leaflet
import type { PlantMapData } from './map-constants'
import { FAMILY_PALETTE, DEFAULT_MARKER_COLOR } from './map-constants'

// Re-exportar para compatibilidad (tipo siempre seguro en SSR)
export type { PlantMapData }

// ── Constantes del mapa ──────────────────────────────────────────────────────

const COLOMBIA_CENTER: [number, number] = [4.5709, -74.2973]
const DEFAULT_ZOOM = 6

// Icono Leaflet por defecto (requerido en Next.js para evitar íconos rotos)
const DefaultIcon = L.icon({
  iconUrl: '/images/marker-icon.png',
  iconRetinaUrl: '/images/marker-icon-2x.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

// ── Helpers ──────────────────────────────────────────────────────────────────

function createDotMarker(color: string): L.DivIcon {
  return L.divIcon({
    html: `<div class="dot-marker" style="background:${color}"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -9],
  })
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function FitBounds({ plants }: { plants: PlantMapData[] }) {
  const map = useMap()

  useEffect(() => {
    if (plants.length === 0) return
    const valid = plants.filter(p => !isNaN(p.decimal_latitude) && !isNaN(p.decimal_longitude))
    if (valid.length === 0) return

    const bounds = L.latLngBounds(
      valid.map(p => [p.decimal_latitude, p.decimal_longitude] as [number, number])
    )

    let cancelled = false
    const raf = requestAnimationFrame(() => {
      if (cancelled) return
      try {
        map.stop()
        // animate:false evita que _onZoomTransitionEnd se dispare tras un
        // re-render, eliminando el crash '_leaflet_pos' undefined
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12, animate: false })
      } catch {
        // Ignorar cualquier estado inconsistente residual
      }
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      try { map.stop() } catch { /* ignorar */ }
    }
  }, [plants, map])

  return null
}

function ResetViewControl() {
  const map = useMap()

  useEffect(() => {
    const wrapper = L.DomUtil.create('div', 'leaflet-bar leaflet-control')
    const btn = L.DomUtil.create('a', 'reset-view-btn', wrapper) as HTMLAnchorElement
    btn.href = '#'
    btn.title = 'Ver Colombia completa'
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2.5"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
      </svg>`

    L.DomEvent.on(btn, 'click', (e) => {
      L.DomEvent.preventDefault(e)
      L.DomEvent.stopPropagation(e)
      map.setView(COLOMBIA_CENTER, DEFAULT_ZOOM)
    })

    const ctrl = new L.Control({ position: 'topleft' })
    ctrl.onAdd = () => wrapper
    ctrl.addTo(map)

    return () => { ctrl.remove() }
  }, [map])

  return null
}

// ── Sub-componente: vuela a coordenadas exactas ───────────────────────────────

function FlyToPlant({ focusedCoords }: { focusedCoords?: { lat: number; lng: number } }) {
  const map = useMap()

  useEffect(() => {
    if (!focusedCoords) return
    const { lat, lng } = focusedCoords

    // Delay para dejar que Leaflet termine de montar y FitBounds se resuelva
    const t = setTimeout(() => {
      try {
        map.flyTo([lat, lng], 15, { animate: true, duration: 1.2 })
      } catch { /* ignorar estado inconsistente */ }
    }, 600)

    return () => clearTimeout(t)
  }, [focusedCoords, map])

  return null
}

// ── Componente principal ─────────────────────────────────────────────────────

interface Props {
  plants: PlantMapData[]
  familyColorMap: Map<string, string>
  onPlantClick?: (plantId: number) => void
  selectedPlantId?: number
  focusedCoords?: { lat: number; lng: number }
}

export default function MapContainerInternal({ plants, familyColorMap, onPlantClick, selectedPlantId, focusedCoords }: Props) {
  const router = useRouter()

  const validPlants = plants.filter(
    p => p.decimal_latitude && p.decimal_longitude &&
         !isNaN(p.decimal_latitude) && !isNaN(p.decimal_longitude)
  )

  const handlePlantClick = (plantId: number) => {
    if (onPlantClick) onPlantClick(plantId)
    else router.push(`/plantas/${plantId}`)
  }

  return (
    <MapContainer
      center={COLOMBIA_CENTER}
      zoom={DEFAULT_ZOOM}
      className="w-full h-full rounded-lg z-0"
      scrollWheelZoom={true}
    >
      {/* ── Capas base ──────────────────────────────────────────────────── */}
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Callejero">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Satélite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            maxZoom={18}
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Topográfico">
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
            maxZoom={17}
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <FitBounds plants={validPlants} />
      <ResetViewControl />
      <FlyToPlant focusedCoords={focusedCoords} />

      {/* ── Marcadores agrupados ─────────────────────────────────────────── */}
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
      >
        {validPlants.map((plant) => {
          const color = familyColorMap.get(plant.family) ?? DEFAULT_MARKER_COLOR

          return (
            <Marker
              key={plant.id}
              position={[plant.decimal_latitude, plant.decimal_longitude]}
              icon={createDotMarker(color)}
            >
              <Popup minWidth={220} maxWidth={280}>
                <div className="plant-popup">
                  {/* Imagen */}
                  {plant.image && (
                    <img
                      src={plant.image}
                      alt={plant.scientific_name}
                      className="popup-image"
                    />
                  )}

                  {/* Nombre científico */}
                  <h3>{plant.scientific_name}</h3>

                  {/* Nombre vernáculo */}
                  {plant.vernacular_name && (
                    <p className="vernacular-name">{plant.vernacular_name}</p>
                  )}

                  {/* Metadatos */}
                  <div className="popup-meta">
                    <span className="popup-family">
                      <span className="family-dot" style={{ background: color }} />
                      {plant.family}
                    </span>

                    {(plant.municipality || plant.state_province) && (
                      <span className="popup-location">
                        📍&nbsp;{[plant.municipality, plant.state_province].filter(Boolean).join(', ')}
                      </span>
                    )}

                    {(plant.recorded_by || plant.event_date) && (
                      <span className="popup-collector">
                        🔬&nbsp;{[plant.recorded_by, plant.event_date].filter(Boolean).join(' · ')}
                      </span>
                    )}

                    {plant.catalog_number && (
                      <span className="popup-herbarium">
                        🏷&nbsp;{plant.catalog_number}
                      </span>
                    )}

                    {plant.minimum_elevation_in_meters != null && (
                      <span className="popup-altitude">
                        ⛰&nbsp;{plant.minimum_elevation_in_meters} msnm
                      </span>
                    )}

                    {plant.plant_habit && (
                      <span className="popup-habit">
                        🌿&nbsp;{plant.plant_habit}
                      </span>
                    )}
                  </div>

                  {/* Insignia de borrador */}
                  {plant.status && plant.status !== 'published' && (
                    <span className="popup-status-badge">
                      {plant.status === 'draft' ? 'Borrador' : plant.status}
                    </span>
                  )}

                  <button
                    className="view-details"
                    onClick={() => handlePlantClick(plant.id)}
                  >
                    Ver ficha completa →
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
