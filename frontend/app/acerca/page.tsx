"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, BookOpen, Microscope, School, MapPin } from "lucide-react"
import { usePublicSettings } from "@/lib/use-public-settings"

const s = (v: any, fallback = "") => (v === null || v === undefined ? fallback : String(v))

export default function AcercaPage() {
  const cfg = usePublicSettings()

  const title        = s(cfg.aboutTitle,   "Herbario HEAA")
  const subtitle     = s(cfg.aboutSubtitle, "Instituto Tecnológico del Putumayo (ITP) - Mocoa")

  const historyImage = s(cfg.aboutHistoryImage)
  const historyTitle = s(cfg.aboutHistoryTitle, "Nuestra Historia")
  const historyP1    = s(cfg.aboutHistoryP1)
  const historyP2    = s(cfg.aboutHistoryP2)
  const historyP3    = s(cfg.aboutHistoryP3)

  const missionText  = s(cfg.aboutMissionText)
  const visionText   = s(cfg.aboutVisionText)

  const statsTitle   = s(cfg.aboutStatsTitle, "Nuestra Colección")
  const stats = [1,2,3,4].map(n => ({
    value: s(cfg[`aboutStat${n}Value`], ["5.200+","120+","850+","1.800+"][n-1]),
    label: s(cfg[`aboutStat${n}Label`], ["Especímenes catalogados","Familias botánicas","Géneros representados","Especies documentadas"][n-1]),
  }))

  const collections = [1,2,3,4].map(n => ({
    title: s(cfg[`aboutCol${n}Title`]),
    text:  s(cfg[`aboutCol${n}Text`]),
  }))

  const research = [1,2,3,4].map(n => ({
    title: s(cfg[`aboutRes${n}Title`]),
    text:  s(cfg[`aboutRes${n}Text`]),
  }))

  const members = [1,2,3].map(n => ({
    image: s(cfg[`aboutMember${n}Image`]),
    name:  s(cfg[`aboutMember${n}Name`]),
    role:  s(cfg[`aboutMember${n}Role`]),
    bio:   s(cfg[`aboutMember${n}Bio`]),
  }))

  const locTitle    = s(cfg.aboutLocationTitle,   "Visítanos")
  const locAddress  = s(cfg.aboutLocationAddress)
  const locSchedule = s(cfg.aboutLocationSchedule)
  const locImage    = s(cfg.aboutLocationImage)

  const partnersTitle = s(cfg.aboutPartnersTitle, "Colaboraciones y Alianzas")
  const partners = [1,2,3,4].map(n => ({
    name:  s(cfg[`aboutPartner${n}Name`],  `Institución ${n}`),
    image: s(cfg[`aboutPartner${n}Image`]),
    url:   s(cfg[`aboutPartner${n}Url`]),
  }))

  const ctaTitle      = s(cfg.aboutCtaTitle,      "Contribuye a nuestra colección")
  const ctaText       = s(cfg.aboutCtaText)
  const ctaBtnText    = s(cfg.aboutCtaButtonText,  "Conoce cómo colaborar")
  const ctaBtnUrl     = s(cfg.aboutCtaButtonUrl,   "/contacto")

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 items-center text-center mb-12">
        <div className="flex items-center justify-center gap-2">
          <School className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">{title}</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{subtitle}</p>
      </div>

      <div className="grid gap-12">
        {/* Historia */}
        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative h-[300px] md:h-[400px] rounded-lg overflow-hidden">
            <Image
              src={historyImage || "/placeholder.svg?height=400&width=600&text=Herbario+ITP"}
              alt={title}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">{historyTitle}</h2>
            {historyP1 && <p className="text-muted-foreground">{historyP1}</p>}
            {historyP2 && <p className="text-muted-foreground">{historyP2}</p>}
            {historyP3 && <p className="text-muted-foreground">{historyP3}</p>}
          </div>
        </section>

        {/* Misión y Visión */}
        <section className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                Misión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{missionText}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Microscope className="h-5 w-5 text-green-600" />
                Visión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{visionText}</p>
            </CardContent>
          </Card>
        </section>

        {/* Estadísticas */}
        <section className="py-8">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-8">{statsTitle}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <Card key={i} className="text-center">
                <CardHeader className="pb-2">
                  <CardTitle className="text-4xl font-bold text-green-600">{stat.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{stat.label}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pestañas */}
        <section>
          <Tabs defaultValue="colecciones" className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-2xl mx-auto mb-8">
              <TabsTrigger value="colecciones">Colecciones</TabsTrigger>
              <TabsTrigger value="investigacion">Investigación</TabsTrigger>
              <TabsTrigger value="equipo">Equipo</TabsTrigger>
            </TabsList>

            <TabsContent value="colecciones" className="space-y-6">
              <h3 className="text-2xl font-bold">Nuestras Colecciones</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {collections.map((c, i) => c.title ? (
                  <div key={i} className="space-y-4">
                    <h4 className="text-xl font-semibold">{c.title}</h4>
                    {c.text && <p className="text-muted-foreground">{c.text}</p>}
                  </div>
                ) : null)}
              </div>
            </TabsContent>

            <TabsContent value="investigacion" className="space-y-6">
              <h3 className="text-2xl font-bold">Líneas de Investigación</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {research.map((r, i) => r.title ? (
                  <div key={i} className="space-y-4">
                    <h4 className="text-xl font-semibold">{r.title}</h4>
                    {r.text && <p className="text-muted-foreground">{r.text}</p>}
                  </div>
                ) : null)}
              </div>
            </TabsContent>

            <TabsContent value="equipo" className="space-y-6">
              <h3 className="text-2xl font-bold">Nuestro Equipo</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {members.map((m, i) => m.name ? (
                  <Card key={i}>
                    <CardHeader>
                      <div className="relative h-40 w-40 mx-auto rounded-full overflow-hidden mb-4">
                        <Image
                          src={m.image || `/placeholder.svg?height=160&width=160&text=${encodeURIComponent(m.role || "Miembro")}`}
                          alt={m.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <CardTitle className="text-center">{m.name}</CardTitle>
                      <CardDescription className="text-center">{m.role}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      {m.bio && <p className="text-sm text-muted-foreground">{m.bio}</p>}
                    </CardContent>
                  </Card>
                ) : null)}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Ubicación */}
        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">{locTitle}</h2>
            {locAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-green-600 mt-1 shrink-0" />
                <p className="text-muted-foreground whitespace-pre-line">{locAddress}</p>
              </div>
            )}
            {locSchedule && <p className="text-muted-foreground">{locSchedule}</p>}
            <div className="pt-4">
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/contacto">
                  Contactar al Herbario <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative h-[300px] md:h-[400px] rounded-lg overflow-hidden">
            <Image
              src={locImage || "/placeholder.svg?height=400&width=600&text=Mapa+ITP+Mocoa"}
              alt="Mapa de ubicación"
              fill
              className="object-cover"
            />
          </div>
        </section>

        {/* Colaboraciones */}
        <section className="py-8">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-8">{partnersTitle}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {partners.map((p, i) => {
              const logo = (
                <div className="relative h-20 w-40">
                  <Image
                    src={p.image || `/placeholder.svg?height=80&width=160&text=${encodeURIComponent(p.name)}`}
                    alt={p.name}
                    fill
                    className="object-contain"
                  />
                </div>
              )
              return (
                <div key={i} className="flex items-center justify-center">
                  {p.url ? (
                    <Link href={p.url} target="_blank" rel="noreferrer" title={p.name}>
                      {logo}
                    </Link>
                  ) : logo}
                </div>
              )
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-green-50 dark:bg-green-950/30 rounded-lg p-8 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold">{ctaTitle}</h2>
            {ctaText && <p className="text-muted-foreground">{ctaText}</p>}
            <div className="pt-2">
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href={ctaBtnUrl}>
                  {ctaBtnText} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
