"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, BookOpen, Microscope, MapPin, Mail, Phone, Code2, Github } from "lucide-react"
import { usePublicSettings } from "@/lib/use-public-settings"

const s = (v: any, fallback = "") => (v === null || v === undefined ? fallback : String(v))
const b = (v: any, fallback = true) => (v === null || v === undefined || v === "" ? fallback : v === true || v === "true")

export default function AcercaPage() {
  const cfg = usePublicSettings()

  const title        = s(cfg.aboutTitle,   "Herbario HEAA")
  const subtitle     = s(cfg.aboutSubtitle, "Institución Universitaria del Putumayo (Uniputumayo) - Mocoa")
  const headerLogo   = s(cfg.aboutHeaderLogo, "/images/logo-uniputumayo.png")

  const historyImage = s(cfg.aboutHistoryImage)
  const historyTitle = s(cfg.aboutHistoryTitle, "Nuestra Historia")
  const historyP1    = s(cfg.aboutHistoryP1)
  const historyP2    = s(cfg.aboutHistoryP2)
  const historyP3    = s(cfg.aboutHistoryP3)

  const missionTitle = s(cfg.aboutMissionTitle, "Misión")
  const visionTitle  = s(cfg.aboutVisionTitle,  "Visión")
  const missionText  = s(cfg.aboutMissionText)
  const visionText   = s(cfg.aboutVisionText)

  const leaderEnabled = b(cfg.aboutLeaderEnabled)
  const leaderLabel   = s(cfg.aboutLeaderLabel, "Líder del proyecto")
  const leaderImage   = s(cfg.aboutLeaderImage)
  const leaderName    = s(cfg.aboutLeaderName,  "MSc. Jhon Henry Cuellar Portilla")
  const leaderRole    = s(cfg.aboutLeaderRole,  "Director de Programa Ingeniería de Sistemas")
  const leaderEmail   = s(cfg.aboutLeaderEmail, "jcuellar@itp.edu.co")
  const leaderPhone   = s(cfg.aboutLeaderPhone, "+57 314 335 1747")

  const creditsEnabled = b(cfg.aboutCreditsEnabled)
  const creditsTitle   = s(cfg.aboutCreditsTitle, "Créditos de desarrollo")
  const creditsText    = s(cfg.aboutCreditsText)
  const creditsSupport = s(cfg.aboutCreditsSupportText, "¿Necesitas soporte técnico del aplicativo? Contacta a los desarrolladores por correo o GitHub.")
  const devs = [1, 2].map(n => ({
    image: s(cfg[`aboutDev${n}Image`], [
      "https://avatars.githubusercontent.com/u/115267707?v=4",
      "https://avatars.githubusercontent.com/u/134365120?v=4",
    ][n - 1]),
    badge: s(cfg[`aboutDev${n}Badge`], "Desarrollador Full Stack"),
    name:  s(cfg[`aboutDev${n}Name`],  ["Jhon Esteban Josa Quinchoa", "Maycol Sebastián Francisco Guerrero López"][n - 1]),
    role:  s(cfg[`aboutDev${n}Role`],  "Estudiante de Ingeniería de Sistemas — Uniputumayo"),
    bio:   s(cfg[`aboutDev${n}Bio`], [
      "Backend y frontend con Node.js, Express, Next.js, React, MySQL y Docker.",
      "Desarrollo web y móvil con Python, JavaScript, Laravel, Flutter, MySQL y Firebase.",
    ][n - 1]),
    email: s(cfg[`aboutDev${n}Email`], ["jhonjosa2021@itp.edu.co", "maycolguerrero2021@itp.edu.co"][n - 1]),
    github: s(cfg[`aboutDev${n}Github`], ["https://github.com/esteban2oo1", "https://github.com/mclguerrero"][n - 1]),
  }))

  const statsTitle   = s(cfg.aboutStatsTitle, "Nuestra Colección")
  const stats = [1,2,3,4].map(n => ({
    value: s(cfg[`aboutStat${n}Value`], ["5.200+","120+","850+","1.800+"][n-1]),
    label: s(cfg[`aboutStat${n}Label`], ["Especímenes catalogados","Familias botánicas","Géneros representados","Especies documentadas"][n-1]),
  }))

  const tab1Label    = s(cfg.aboutTab1Label, "Colecciones")
  const tab2Label    = s(cfg.aboutTab2Label, "Investigación")
  const tab3Label    = s(cfg.aboutTab3Label, "Equipo")
  const colTabTitle  = s(cfg.aboutColTabTitle,  "Nuestras Colecciones")
  const resTabTitle  = s(cfg.aboutResTabTitle,  "Líneas de Investigación")
  const teamTabTitle = s(cfg.aboutTeamTabTitle, "Nuestro Equipo")

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
  const contactBtnText = s(cfg.aboutContactButtonText, "Contactar al Herbario")
  const contactBtnUrl  = s(cfg.aboutContactButtonUrl,  "/contacto")
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
        <div className="relative h-20 w-64 md:h-24 md:w-80">
          <Image
            src={headerLogo || "/images/logo-uniputumayo.png"}
            alt="Uniputumayo — Institución Universitaria del Putumayo"
            fill
            className="object-contain"
            priority
          />
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
                {missionTitle}
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
                {visionTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{visionText}</p>
            </CardContent>
          </Card>
        </section>

        {/* Líder del proyecto */}
        {leaderEnabled && leaderName && (
          <section className="flex justify-center">
            <Card className="w-full max-w-xl">
              <CardContent className="flex items-center gap-6 p-6 md:p-8">
                <div className="relative h-24 w-24 md:h-28 md:w-28 shrink-0 rounded-full overflow-hidden ring-2 ring-green-600/20">
                  <Image
                    src={leaderImage || `/placeholder.svg?height=112&width=112&text=${encodeURIComponent(leaderLabel)}`}
                    alt={leaderName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-green-600">{leaderLabel}</p>
                  <h2 className="text-xl md:text-2xl font-bold leading-tight">{leaderName}</h2>
                  {leaderRole && <p className="text-muted-foreground">{leaderRole}</p>}
                  <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-sm text-muted-foreground">
                    {leaderEmail && (
                      <a href={`mailto:${leaderEmail}`} className="flex items-center gap-1.5 hover:text-foreground">
                        <Mail className="h-4 w-4 shrink-0" /> {leaderEmail}
                      </a>
                    )}
                    {leaderPhone && (
                      <a href={`tel:${leaderPhone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-foreground">
                        <Phone className="h-4 w-4 shrink-0" /> {leaderPhone}
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

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
              <TabsTrigger value="colecciones">{tab1Label}</TabsTrigger>
              <TabsTrigger value="investigacion">{tab2Label}</TabsTrigger>
              <TabsTrigger value="equipo">{tab3Label}</TabsTrigger>
            </TabsList>

            <TabsContent value="colecciones" className="space-y-6">
              <h3 className="text-2xl font-bold">{colTabTitle}</h3>
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
              <h3 className="text-2xl font-bold">{resTabTitle}</h3>
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
              <h3 className="text-2xl font-bold">{teamTabTitle}</h3>
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
                <Link href={contactBtnUrl}>
                  {contactBtnText} <ArrowRight className="ml-2 h-4 w-4" />
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

        {/* Créditos de desarrollo — responsables del aplicativo */}
        {creditsEnabled && (
          <section className="py-4">
            <div className="text-center mb-8 space-y-2">
              <h2 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
                <Code2 className="h-7 w-7 text-green-600" /> {creditsTitle}
              </h2>
              {creditsText && <p className="text-muted-foreground max-w-2xl mx-auto">{creditsText}</p>}
            </div>
            <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {devs.map((d, i) => d.name ? (
                <Card key={i} className="overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-green-600 to-emerald-400" />
                  <CardContent className="flex flex-col items-center text-center gap-3 p-6 pt-8">
                    <div className="relative h-24 w-24 rounded-full overflow-hidden ring-4 ring-green-600/15">
                      <Image
                        src={d.image || `/placeholder.svg?height=96&width=96&text=Dev`}
                        alt={d.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {d.badge && <p className="text-xs font-semibold uppercase tracking-widest text-green-600">{d.badge}</p>}
                    <h3 className="text-lg font-bold leading-tight">{d.name}</h3>
                    {d.role && <p className="text-sm text-muted-foreground -mt-2">{d.role}</p>}
                    {d.bio && <p className="text-sm text-muted-foreground">{d.bio}</p>}
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      {d.email && (
                        <Button asChild variant="outline" size="sm">
                          <a href={`mailto:${d.email}`}>
                            <Mail className="h-4 w-4 mr-1.5" /> Correo
                          </a>
                        </Button>
                      )}
                      {d.github && (
                        <Button asChild variant="outline" size="sm">
                          <a href={d.github} target="_blank" rel="noreferrer">
                            <Github className="h-4 w-4 mr-1.5" /> GitHub
                          </a>
                        </Button>
                      )}
                    </div>
                    {d.email && <p className="text-xs text-muted-foreground">{d.email}</p>}
                  </CardContent>
                </Card>
              ) : null)}
            </div>
            {creditsSupport && (
              <p className="text-center text-sm text-muted-foreground mt-8 max-w-2xl mx-auto">{creditsSupport}</p>
            )}
          </section>
        )}

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
