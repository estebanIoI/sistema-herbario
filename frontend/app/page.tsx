'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Leaf, Search, Database, Star, Globe, X, ChevronLeft, ChevronRight } from "lucide-react"
import dynamic from "next/dynamic"

const GlobePolaroids = dynamic(() => import("@/components/globe-polaroids"), { ssr: false })
import { useEffect, useState } from "react"
import { apiService } from "@/lib/api"

interface PublicStats {
  totalPlants: number
  totalFamilies: number
  totalGenera: number
}

interface Plant {
  id: number
  scientificName: string
  commonName?: string
  family: string
  image?: string
}

const ICON_MAP: Record<string, React.ElementType> = {
  Leaf, Search, Database, Star, Globe,
}

const getIcon = (name: string) => ICON_MAP[name] ?? Leaf

const BANNER_COLORS: Record<string, string> = {
  info:    "bg-blue-600 text-white",
  success: "bg-green-600 text-white",
  warning: "bg-yellow-500 text-black",
  error:   "bg-red-600 text-white",
}

export default function Home() {
  const [stats, setStats]               = useState<PublicStats>({ totalPlants: 0, totalFamilies: 0, totalGenera: 0 })
  const [cfg, setCfg]                   = useState<Record<string, any>>({})
  const [featuredPlants, setFeaturedPlants] = useState<Plant[]>([])
  const [loading, setLoading]           = useState(true)
  const [bannerVisible, setBannerVisible] = useState(true)
  const [currentSlide, setCurrentSlide]   = useState(0)
  const [currentHero2, setCurrentHero2]   = useState(0)

  useEffect(() => {
    Promise.all([
      apiService.getPublicStats(),
      apiService.getPublicSettings(),
      apiService.getFeaturedPlants(6),
    ]).then(([statsRes, cfgRes, plantsRes]) => {
      if (statsRes.success && statsRes.data) setStats(statsRes.data as any)
      if (cfgRes.success && cfgRes.data)     setCfg(cfgRes.data as any)
      if (plantsRes.success && plantsRes.data) {
        const mapped = (plantsRes.data as any[]).map(p => ({
          id:             p.id,
          scientificName: p.nombre      ?? p.scientificName ?? "",
          commonName:     p.nombreComun ?? p.commonName,
          family:         p.familia     ?? p.family ?? "",
          image:          p.imagen      ?? p.image,
        }))
        setFeaturedPlants(mapped)
      }
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  // ── Valores derivados de settings ─────────────────────────────────────────
  const featuredCount  = Number(cfg.featuredPlantsCount ?? 3)
  const plantsToShow   = featuredPlants.slice(0, featuredCount)

  const showBanner     = cfg.bannerEnabled === true && !!cfg.bannerText && bannerVisible
  const bannerType     = String(cfg.bannerType ?? "info")
  const bannerColor    = BANNER_COLORS[bannerType] ?? BANNER_COLORS.info

  const heroTitle      = String(cfg.heroTitle      ?? cfg.siteName ?? "Bienvenido a nuestro Herbario Digital")
  const heroSubtitle   = String(cfg.heroSubtitle   ?? cfg.siteDescription ?? "Descubre la diversidad botánica de nuestra región.")
  const cta1Text       = String(cfg.heroCta1Text   ?? "Explorar plantas")
  const cta1Url        = String(cfg.heroCta1Url    ?? "/plantas")
  const cta2Text       = String(cfg.heroCta2Text   ?? "Conoce más")
  const cta2Url        = String(cfg.heroCta2Url    ?? "/acerca")
  const heroBg         = String(cfg.heroBgImage    ?? "")

  // Hero 1 — Slides
  const rawSlides = [1, 2, 3].map(n => ({
    image: String(cfg[`heroSlide${n}Image`] ?? ""),
    url:   String(cfg[`heroSlide${n}Url`]  ?? ""),
  }))
  if (!rawSlides[0].image && heroBg) rawSlides[0].image = heroBg
  const slides = rawSlides.filter(s => s.image)
  const slideInterval = Math.max(2000, Number(cfg.heroSlideInterval ?? 5) * 1000)

  // Hero 2 — Publicaciones / Servicios
  const showHero2  = cfg.hero2Enabled !== false
  const hero2Title = String(cfg.hero2Title    ?? "Publicaciones y Servicios")
  const hero2Sub   = String(cfg.hero2Subtitle ?? "")
  const hero2Int   = Math.max(2000, Number(cfg.hero2Interval ?? 4) * 1000)
  const hero2Items = [1, 2, 3, 4].map(n => ({
    badge: String(cfg[`hero2Item${n}Badge`] ?? ""),
    title: String(cfg[`hero2Item${n}Title`] ?? ""),
    desc:  String(cfg[`hero2Item${n}Desc`]  ?? ""),
    image: String(cfg[`hero2Item${n}Image`] ?? ""),
    url:   String(cfg[`hero2Item${n}Url`]   ?? ""),
  })).filter(item => item.title)

  // Hero 3 — Características
  const showFeatures   = cfg.featuresEnabled !== false
  const featuresTitle  = String(cfg.featuresTitle    ?? "Características de nuestro herbario")
  const featuresSub    = String(cfg.featuresSubtitle ?? "Nuestro herbario digital ofrece una experiencia completa para explorar y aprender sobre plantas.")
  const featuresBg     = String(cfg.featuresBgImage  ?? "")

  const featureCards = [1, 2, 3].map(n => ({
    icon:  String(cfg[`feature${n}Icon`]        ?? ["Leaf","Search","Database"][n-1]),
    title: String(cfg[`feature${n}Title`]       ?? ["Catálogo Extenso","Búsqueda Avanzada","Información Detallada"][n-1]),
    desc:  String(cfg[`feature${n}Description`] ?? ""),
    url:   String(cfg[`feature${n}Url`]         ?? ""),
  }))

  const showFeatured  = cfg.featuredEnabled !== false
  const featuredTitle = String(cfg.featuredSectionTitle ?? "Plantas destacadas")

  // ── Auto-advance Hero 1 ────────────────────────────────────────────────────
  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(() => setCurrentSlide(prev => (prev + 1) % slides.length), slideInterval)
    return () => clearInterval(t)
  }, [slides.length, slideInterval])

  // ── Auto-advance Hero 2 ────────────────────────────────────────────────────
  useEffect(() => {
    if (hero2Items.length <= 1) return
    const t = setInterval(() => setCurrentHero2(prev => (prev + 1) % hero2Items.length), hero2Int)
    return () => clearInterval(t)
  }, [hero2Items.length, hero2Int])

  // ── Bloque de texto del hero (reutilizado en carousel y fallback) ──────────
  const HeroText = () => (
    <div className="max-w-xl space-y-6">
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-white drop-shadow-md">
        {heroTitle}
      </h1>
      <p className="text-gray-200 md:text-xl drop-shadow">{heroSubtitle}</p>
      {!loading && (
        <div className="flex gap-6 text-green-200">
          <Stat value={stats.totalPlants.toLocaleString()} label="Plantas" />
          <Stat value={stats.totalFamilies}                label="Familias" />
          <Stat value={stats.totalGenera}                  label="Géneros" />
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
          <Link href={cta1Url}>{cta1Text} <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
          <Link href={cta2Url}>{cta2Text}</Link>
        </Button>
      </div>
    </div>
  )

  return (
    <div>

      {/* ── Banner global ─────────────────────────────────────────────────── */}
      {showBanner && (
        <div className={`relative w-full flex items-center justify-center gap-3 py-2.5 px-4 text-sm ${bannerColor} z-50`}>
          {cfg.bannerLink ? (
            <Link href={String(cfg.bannerLink)} className="underline underline-offset-2 hover:opacity-90">
              {cfg.bannerText}
            </Link>
          ) : (
            <span>{cfg.bannerText}</span>
          )}
          <button
            aria-label="Cerrar banner"
            onClick={() => setBannerVisible(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Hero 1: Carrusel de imágenes ──────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-green-800">
        {loading ? (
          /* Skeleton mientras carga */
          <div className="min-h-[70vh] flex items-center">
            <div className="container mx-auto px-4 py-20">
              <div className="max-w-xl space-y-4 animate-pulse">
                <div className="h-12 w-3/4 bg-white/10 rounded-lg" />
                <div className="h-6 w-2/3 bg-white/10 rounded-lg" />
                <div className="h-6 w-1/2 bg-white/10 rounded-lg" />
                <div className="flex gap-3 pt-2">
                  <div className="h-11 w-36 bg-green-600/30 rounded-lg" />
                  <div className="h-11 w-28 bg-white/10 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ) : slides.length > 0 ? (
          <>
            {/* ── Mobile: imagen completa + texto debajo ─────────────────── */}
            <div className="sm:hidden">
              {/* Imagen con altura natural, sin recorte */}
              <div className="relative w-full border-b-2 border-green-700 bg-green-950 overflow-hidden">
                {slides.map((slide, i) => {
                  const imgEl = (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slide.image}
                      alt={`Imagen ${i + 1}`}
                      className="w-full h-auto object-contain select-none block"
                    />
                  )
                  return (
                    <div
                      key={i}
                      className={`transition-opacity duration-700 ${i === currentSlide ? 'opacity-100 relative' : 'opacity-0 absolute inset-0'}`}
                    >
                      {slide.url
                        ? <Link href={slide.url} className="block w-full">{imgEl}</Link>
                        : imgEl
                      }
                    </div>
                  )
                })}
                {/* Puntos de navegación mobile */}
                {slides.length > 1 && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        aria-label={`Imagen ${i + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              {/* Texto debajo de la imagen */}
              <div className="px-4 py-8 bg-gradient-to-b from-green-950 to-green-900">
                <HeroText />
              </div>
            </div>

            {/* ── Desktop: carrusel con overlay ──────────────────────────── */}
            <div className="hidden sm:block relative w-full h-[75vh] min-h-[500px] max-h-[800px]">
              {slides.map((slide, i) => {
                const isActive = i === currentSlide
                const imgEl = (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.image}
                    alt={`Imagen ${i + 1}`}
                    className="w-full h-full object-cover select-none"
                  />
                )
                return (
                  <div
                    key={i}
                    className={`absolute inset-0 transition-opacity duration-700 ${isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10'}`}
                  >
                    {slide.url
                      ? <Link href={slide.url} className="block w-full h-full">{imgEl}</Link>
                      : imgEl
                    }
                  </div>
                )
              })}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent pointer-events-none z-10" />
              <div className="absolute inset-0 flex items-center z-20 pointer-events-none">
                <div className="container mx-auto px-4 pointer-events-auto">
                  <HeroText />
                </div>
              </div>
              {slides.length > 1 && (
                <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2 z-20 pointer-events-auto">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      aria-label={`Imagen ${i + 1}`}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Sin imágenes — hero de gradiente limpio */
          <div className="min-h-[70vh] flex items-center">
            <div className="container mx-auto px-4 py-20">
              <HeroText />
            </div>
          </div>
        )}
      </section>

      {/* ── Hero 2: Publicaciones / Servicios + Globo ──────────────────────── */}
      {showHero2 && (
        <section className="py-16 bg-muted/30 overflow-hidden">
          <div className="container mx-auto px-4">

            {/* Encabezado centrado */}
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight">{hero2Title}</h2>
              {hero2Sub && (
                <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">{hero2Sub}</p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              {/* ── Columna izquierda: carrusel de publicaciones / servicios ── */}
              {hero2Items.length > 0 && (
                <div className="relative">
                  <div className="relative overflow-hidden rounded-xl shadow-lg">
                    {hero2Items.map((item, i) => (
                      <div
                        key={i}
                        className={`transition-opacity duration-500 ${
                          i === currentHero2 ? 'opacity-100 relative' : 'opacity-0 absolute inset-0'
                        }`}
                      >
                        <Card className="overflow-hidden border-0">
                          {item.image && (
                            <div className="w-full border-b border-border bg-muted">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-56 object-contain"
                              />
                            </div>
                          )}
                          <CardContent className={`p-6 space-y-3 ${!item.image ? 'pt-8' : ''}`}>
                            {item.badge && (
                              <Badge className="bg-green-600 hover:bg-green-600 text-white">
                                {item.badge}
                              </Badge>
                            )}
                            <h3 className="text-xl font-bold">{item.title}</h3>
                            {item.desc && (
                              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                            )}
                            {item.url && (
                              <Button
                                asChild variant="outline" size="sm"
                                className="mt-2 border-green-600 text-green-700 hover:bg-green-50"
                              >
                                <Link href={item.url}>
                                  Ver más <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>

                  {/* Flechas */}
                  {hero2Items.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentHero2(prev => (prev - 1 + hero2Items.length) % hero2Items.length)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 h-10 w-10 rounded-full bg-background border shadow-md flex items-center justify-center hover:bg-muted transition-colors z-10"
                        aria-label="Anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setCurrentHero2(prev => (prev + 1) % hero2Items.length)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 h-10 w-10 rounded-full bg-background border shadow-md flex items-center justify-center hover:bg-muted transition-colors z-10"
                        aria-label="Siguiente"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {/* Puntos */}
                  {hero2Items.length > 1 && (
                    <div className="flex justify-center gap-2 mt-5">
                      {hero2Items.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentHero2(i)}
                          aria-label={`Item ${i + 1}`}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            i === currentHero2 ? 'w-6 bg-green-600' : 'w-2 bg-gray-300 hover:bg-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Columna derecha: globo con polaroids de plantas ── */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-full max-w-[480px]">
                  <GlobePolaroids plants={featuredPlants} speed={0.003} />
                </div>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  Arrastra el globo para explorar las regiones de recolección
                </p>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ── Hero 3: Características ────────────────────────────────────────── */}
      {showFeatures && (
        <section className={`relative overflow-hidden py-20 ${featuresBg ? "" : "bg-background"}`}>
          {featuresBg && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featuresBg}
                alt="Fondo características"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/65" />
            </>
          )}
          <div className="relative z-10 container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className={`text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl ${featuresBg ? "text-white" : ""}`}>
                {featuresTitle}
              </h2>
              <p className={`mt-4 md:text-lg max-w-3xl mx-auto ${featuresBg ? "text-gray-300" : "text-muted-foreground"}`}>
                {featuresSub}
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featureCards.map(({ icon, title, desc, url }, i) => {
                const Icon = getIcon(icon)
                const isExternal = url.startsWith("http")
                const cardClass = `flex flex-col items-center text-center p-6 rounded-lg shadow-sm transition-all ${
                  featuresBg ? "bg-white/10 backdrop-blur-sm text-white" : "bg-card"
                } ${url ? "hover:shadow-md hover:-translate-y-1 cursor-pointer" : ""}`

                const inner = (
                  <>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{title}</h3>
                    <p className={featuresBg ? "text-gray-300" : "text-muted-foreground"}>
                      {desc || "Próximamente más información."}
                    </p>
                    {url && (
                      <span className={`mt-3 text-sm font-medium flex items-center gap-1 ${featuresBg ? "text-green-300" : "text-green-600"}`}>
                        Ver más <ArrowRight className="h-3 w-3" />
                      </span>
                    )}
                  </>
                )

                return url ? (
                  <Link
                    key={i}
                    href={url}
                    className={cardClass}
                    {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={i} className={cardClass}>{inner}</div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Plantas destacadas ────────────────────────────────────────────── */}
      {showFeatured && (
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold tracking-tighter">{featuredTitle}</h2>
              <Button asChild variant="outline" className="hidden sm:flex">
                <Link href="/plantas">Ver todas <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {loading
                ? [1, 2, 3].map(i => (
                    <div key={i} className="overflow-hidden rounded-lg border bg-card shadow-sm">
                      <div className="h-48 bg-gray-200 animate-pulse" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                      </div>
                    </div>
                  ))
                : plantsToShow.length > 0
                  ? plantsToShow.map(plant => (
                      <Link
                        key={plant.id}
                        href={`/plantas/${plant.id}`}
                        className="group overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="h-48 w-full overflow-hidden border-b border-border bg-muted flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={plant.image || `/placeholder.svg?height=300&width=400&text=${encodeURIComponent(plant.scientificName ?? "Planta")}`}
                            alt={plant.scientificName ?? "Planta"}
                            className="w-full h-full object-contain transition-transform group-hover:scale-105"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-sm italic">{plant.scientificName}</h3>
                          {plant.commonName && <p className="text-xs text-muted-foreground">{plant.commonName}</p>}
                          <p className="text-sm text-muted-foreground">{plant.family}</p>
                        </div>
                      </Link>
                    ))
                  : [1, 2, 3].map(i => (
                      <div key={i} className="overflow-hidden rounded-lg border bg-card shadow-sm">
                        <div className="h-48 border-b border-border bg-muted flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`/placeholder.svg?height=300&width=400&text=Planta+${i}`} alt={`Planta ${i}`} className="w-full h-full object-contain" />
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold">Planta {i}</h3>
                          <p className="text-sm text-muted-foreground">Familia botánica</p>
                        </div>
                      </div>
                    ))
              }
            </div>

            <div className="mt-8 flex justify-center sm:hidden">
              <Button asChild variant="outline">
                <Link href="/plantas">Ver todas <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  )
}
