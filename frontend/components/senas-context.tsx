"use client"

import { createContext, useContext, useRef, useState, useCallback, type ReactNode } from "react"
import { X } from "lucide-react"
import { usePublicSettings } from "@/lib/use-public-settings"

type SenasApi = {
  enabled: boolean
  show: (videoUrl?: string, label?: string) => void
  hide: () => void
}

const SenasContext = createContext<SenasApi>({
  enabled: false,
  show: () => {},
  hide: () => {},
})

/** Hook para que cualquier sección dispare el intérprete de señas al hacer hover. */
export function useSenas() {
  return useContext(SenasContext)
}

/**
 * Provee el intérprete de lengua de señas: un panel flotante (estilo GOV.CO)
 * que muestra el video correspondiente a la sección sobre la que está el cursor.
 * Las URLs de video se configuran por sección desde /admin/pagina.
 */
export function SenasProvider({ children }: { children: ReactNode }) {
  const s = usePublicSettings()
  const enabled = s.senasEnabled === true

  const [active, setActive] = useState<{ url: string; label: string } | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pinned, setPinned] = useState(false)

  const clearTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }

  const show = useCallback(
    (videoUrl?: string, label = "") => {
      if (!enabled) return
      const url = (videoUrl ?? "").trim()
      if (!url) return
      clearTimer()
      setActive({ url, label })
    },
    [enabled]
  )

  const hide = useCallback(() => {
    if (pinned) return
    clearTimer()
    // Pequeño retraso para no parpadear al pasar de una sección a otra
    hideTimer.current = setTimeout(() => setActive(null), 350)
  }, [pinned])

  return (
    <SenasContext.Provider value={{ enabled, show, hide }}>
      {children}

      {enabled && active && (
        <div
          className="fixed bottom-6 left-6 z-[1000] w-[220px] select-none"
          onMouseEnter={clearTimer}
          onMouseLeave={hide}
          role="complementary"
          aria-label="Intérprete de lengua de señas"
        >
          <div className="overflow-hidden rounded-xl border-4 border-blue-700 bg-black shadow-2xl">
            <video
              key={active.url}
              src={active.url}
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              className="block h-[150px] w-full bg-black object-cover"
            />
            {active.label && (
              <div className="bg-blue-700 px-2 py-1 text-center text-[11px] font-semibold text-white">
                {active.label}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setPinned(false)
              clearTimer()
              setActive(null)
            }}
            className="absolute -right-2 -top-2 rounded-full bg-white p-0.5 text-blue-700 shadow ring-1 ring-blue-700 hover:bg-blue-50"
            aria-label="Cerrar intérprete de señas"
            title="Cerrar"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Fijar / soltar el panel para que no desaparezca al mover el cursor */}
          <button
            type="button"
            onClick={() => setPinned((p) => !p)}
            className={`absolute -right-2 top-7 rounded-full px-1.5 py-0.5 text-[9px] font-bold shadow ring-1 ring-blue-700 ${
              pinned ? "bg-blue-700 text-white" : "bg-white text-blue-700 hover:bg-blue-50"
            }`}
            title={pinned ? "Soltar" : "Fijar"}
          >
            {pinned ? "FIJO" : "FIJAR"}
          </button>
        </div>
      )}
    </SenasContext.Provider>
  )
}

/**
 * Envoltorio opcional: aplica los manejadores de hover a su contenido.
 * (En la home se aplican directamente sobre cada <section> vía useSenas.)
 */
export function SenasZone({
  videoUrl,
  label,
  children,
  className,
}: {
  videoUrl?: string
  label?: string
  children: ReactNode
  className?: string
}) {
  const senas = useSenas()
  return (
    <div
      className={className}
      onMouseEnter={() => senas.show(videoUrl, label)}
      onMouseLeave={senas.hide}
    >
      {children}
    </div>
  )
}
