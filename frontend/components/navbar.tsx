"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Leaf, CircleUser, Search } from "lucide-react"
import { usePublicSettings } from "@/lib/use-public-settings"

const GOV_GREEN = "#00833E"
const GOV_DARK = "#005C2A"
const GOV_YELLOW = "#F0A500"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const s = usePublicSettings()
  const isAdmin = pathname?.startsWith("/admin")
  const isLoginPage = pathname === "/login"

  // No mostrar la barra de navegación en las páginas de administración ni en la página de login
  if (isAdmin || isLoginPage) return null

  const logoText  = s.logoText ?? "Herbario HEAA"
  const logoImage = s.logoImageUrl || "/images/logo-uniputumayo.png"

  const govbarEnabled = s.govbarEnabled !== false && s.govbarEnabled !== "false"
  const govbarText    = s.govbarText || "GOV.CO"
  const govbarUrl     = s.govbarUrl  || "https://www.gov.co"

  const routes = [
    { href: "/", label: "Inicio" },
    { href: "/plantas", label: "Plantas" },
    { href: "/publicaciones", label: "Publicaciones" },
    { href: "/acerca", label: "Acerca de" },
    { href: "/contacto", label: "Contacto" },
  ]

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/plantas?search=${encodeURIComponent(q)}` : "/plantas")
    setQuery("")
  }

  return (
    <header className="sticky top-0 z-50 w-full shadow-sm">
      {/* ── Barra superior GOV.CO ─────────────────────────────────────────── */}
      {govbarEnabled && (
        <div className="w-full bg-[#3366CC]">
          <div className="container flex h-8 items-center justify-between">
            <a
              href={govbarUrl}
              target="_blank"
              rel="noreferrer"
              className="text-white font-bold italic text-sm tracking-wide hover:underline"
            >
              {govbarText}
            </a>
            <Link href="/login" className="text-white/90 text-xs hover:text-white hover:underline hidden sm:block">
              Iniciar sesión
            </Link>
          </div>
        </div>
      )}

      {/* ── Header: logo + buscador ───────────────────────────────────────── */}
      <div className="w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            {logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoImage} alt={logoText} className="h-11 w-auto max-w-[200px] object-contain" />
            ) : (
              <Leaf className="h-6 w-6" style={{ color: GOV_GREEN }} />
            )}
            {logoText && <span className="text-lg sm:text-xl font-bold truncate">{logoText}</span>}
          </Link>

          {/* Buscador integrado */}
          <form onSubmit={submitSearch} className="hidden md:flex items-center flex-1 max-w-sm">
            <div className="relative w-full">
              <Input
                type="search"
                placeholder="Buscar plantas..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pr-10 h-9"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="absolute right-0 top-0 h-9 w-9 flex items-center justify-center rounded-r-md text-white"
                style={{ backgroundColor: GOV_GREEN }}
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="icon" className="hidden md:inline-flex" title="Iniciar sesión">
              <Link href="/login">
                <CircleUser className="h-6 w-6" />
                <span className="sr-only">Iniciar sesión</span>
              </Link>
            </Button>

            {/* Menú móvil */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                <div className="flex flex-col space-y-4 mt-8">
                  <form onSubmit={(e) => { submitSearch(e); setIsOpen(false) }} className="relative">
                    <Input
                      type="search"
                      placeholder="Buscar plantas..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="submit"
                      aria-label="Buscar"
                      className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center rounded-r-md text-white"
                      style={{ backgroundColor: GOV_GREEN }}
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </form>
                  {routes.map((route) => (
                    <Link
                      key={route.href}
                      href={route.href}
                      className={`text-sm font-medium transition-colors border-l-4 pl-3 py-1 ${
                        pathname === route.href
                          ? "border-[#F0A500] text-foreground font-semibold"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {route.label}
                    </Link>
                  ))}
                  <Button asChild variant="ghost" size="sm" className="mt-4 justify-start gap-2">
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <CircleUser className="h-5 w-5" />
                      Iniciar sesión
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* ── Navbar institucional verde ────────────────────────────────────── */}
      <nav className="w-full hidden md:block" style={{ backgroundColor: GOV_GREEN }}>
        <div className="container flex items-stretch">
          {routes.map((route) => {
            const active = pathname === route.href
            return (
              <Link
                key={route.href}
                href={route.href}
                className="relative px-5 py-3 text-sm font-medium text-white transition-colors"
                style={{
                  backgroundColor: active ? GOV_DARK : "transparent",
                  boxShadow: active ? `inset 0 -4px 0 0 ${GOV_YELLOW}` : undefined,
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = GOV_DARK }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent" }}
              >
                {route.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
