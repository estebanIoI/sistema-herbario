"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import createGlobe from "cobe"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, X } from "lucide-react"
import Link from "next/link"

export interface PolaroidMarker {
  id: string
  location: [number, number]
  image: string
  caption: string
  rotate: number
  plantId?: number
  scientificName?: string
  family?: string
  commonName?: string
}

interface GlobePolaoidsProps {
  markers?: PolaroidMarker[]
  className?: string
  speed?: number
  onMarkerClick?: (marker: PolaroidMarker) => void
}

const defaultMarkers: PolaroidMarker[] = [
  { id: "p1", location: [4.711,  -74.072], image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=120&h=120&fit=crop",  caption: "Bogotá",   rotate: -5 },
  { id: "p2", location: [-1.831, -78.183], image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=120&h=120&fit=crop",  caption: "Ecuador",  rotate:  4 },
  { id: "p3", location: [-4.215, -69.943], image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=120&h=120&fit=crop",  caption: "Leticia",  rotate: -3 },
  { id: "p4", location: [1.614,  -75.607], image: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=120&h=120&fit=crop",  caption: "Florencia", rotate:  6 },
  { id: "p5", location: [3.865,  -67.926], image: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=120&h=120&fit=crop",  caption: "Inírida",  rotate: -4 },
  { id: "p6", location: [-3.119, -60.022], image: "https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?w=120&h=120&fit=crop",  caption: "Manaos",   rotate:  3 },
]

export function GlobePolaroids({
  markers = defaultMarkers,
  className = "",
  speed = 0.003,
  onMarkerClick,
}: GlobePolaoidsProps) {
  const canvasRef            = useRef<HTMLCanvasElement>(null)
  const pointerInteracting   = useRef<{ x: number; y: number } | null>(null)
  const dragOffset           = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef         = useRef(0)
  const thetaOffsetRef       = useRef(0)
  const isPausedRef          = useRef(false)
  const [selected, setSelected] = useState<PolaroidMarker | null>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    isPausedRef.current = true
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current   += dragOffset.current.phi
      thetaOffsetRef.current += dragOffset.current.theta
      dragOffset.current      = { phi: 0, theta: 0 }
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi:   (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        }
      }
    }
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerup",   handlePointerUp,   { passive: true })
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup",   handlePointerUp)
    }
  }, [handlePointerUp])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    let globe: ReturnType<typeof createGlobe> | null = null
    let animationId: number
    let phi = 0

    function init() {
      const width = canvas.offsetWidth
      if (width === 0 || globe) return

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width, height: width,
        phi: 0, theta: 0.2, dark: 0, diffuse: 1.5,
        mapSamples: 16000, mapBrightness: 9,
        baseColor:   [1, 1, 1],
        markerColor: [0.4, 0.6, 0.9],
        glowColor:   [0.94, 0.93, 0.91],
        markerElevation: 0,
        markers: markers.map(m => ({ location: m.location, size: 0.04, id: m.id })),
        arcs: [], arcColor: [0.5, 0.7, 1],
        arcWidth: 0.5, arcHeight: 0.25, opacity: 0.7,
      })

      function animate() {
        if (!isPausedRef.current) phi += speed
        globe!.update({
          phi:   phi + phiOffsetRef.current   + dragOffset.current.phi,
          theta: 0.2 + thetaOffsetRef.current + dragOffset.current.theta,
        })
        animationId = requestAnimationFrame(animate)
      }
      animate()
      setTimeout(() => canvas && (canvas.style.opacity = "1"))
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      const ro = new ResizeObserver(entries => {
        if (entries[0]?.contentRect.width > 0) { ro.disconnect(); init() }
      })
      ro.observe(canvas)
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      if (globe) globe.destroy()
    }
  }, [markers, speed])

  const handleClick = (m: PolaroidMarker) => {
    if (onMarkerClick) { onMarkerClick(m); return }
    setSelected(m)
  }

  return (
    <>
      <div className={`relative aspect-square select-none ${className}`}>
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          style={{
            width: "100%", height: "100%", cursor: "grab", opacity: 0,
            transition: "opacity 1.2s ease", borderRadius: "50%", touchAction: "none",
          }}
        />

        {markers.map(m => (
          <div
            key={m.id}
            onClick={() => handleClick(m)}
            style={{
              position:  "absolute",
              // @ts-expect-error CSS Anchor Positioning
              positionAnchor: `--cobe-${m.id}`,
              bottom:    "anchor(top)",
              left:      "anchor(center)",
              translate: "-50% 0",
              marginBottom: 8,
              background: "#fff",
              padding:   "6px 6px 24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)",
              transform: `rotate(${m.rotate}deg)`,
              cursor:    "pointer",
              opacity:   `var(--cobe-visible-${m.id}, 0)`,
              filter:    `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 8px))`,
              transition: "opacity 0.3s, filter 0.3s, transform 0.2s",
              zIndex:    10,
            }}
            className="hover:scale-110 hover:z-20"
          >
            <img
              src={m.image}
              alt={m.caption}
              style={{ display: "block", width: 60, height: 60, objectFit: "cover" }}
            />
            <span style={{
              position: "absolute", bottom: 5, left: 0, right: 0,
              textAlign: "center", fontFamily: "system-ui, sans-serif",
              fontSize: "0.5rem", color: "#333", letterSpacing: "0.02em",
            }}>
              {m.caption}
            </span>
          </div>
        ))}
      </div>

      {/* Modal de información de la planta */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          {selected && (
            <>
              <div className="relative">
                <img
                  src={selected.image}
                  alt={selected.caption}
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold italic">
                    {selected.scientificName || selected.caption}
                  </DialogTitle>
                </DialogHeader>
                {selected.commonName && (
                  <p className="text-sm text-muted-foreground">{selected.commonName}</p>
                )}
                {selected.family && (
                  <Badge variant="secondary" className="text-xs">{selected.family}</Badge>
                )}
                {selected.plantId && (
                  <Button asChild size="sm" className="w-full bg-green-600 hover:bg-green-700 mt-2">
                    <Link href={`/plantas/${selected.plantId}`}>
                      Ver ficha completa <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
