"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Leaf, CircleUser } from "lucide-react"
import { usePublicSettings } from "@/lib/use-public-settings"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const s = usePublicSettings()
  const isAdmin = pathname?.startsWith("/admin")
  const isLoginPage = pathname === "/login"

  // No mostrar la barra de navegación en las páginas de administración ni en la página de login
  if (isAdmin || isLoginPage) return null

  const logoText  = s.logoText ?? "Herbario Digital"
  const logoImage = s.logoImageUrl || ""

  const routes = [
    { href: "/", label: "Inicio" },
    { href: "/plantas", label: "Plantas" },
    { href: "/publicaciones", label: "Publicaciones" },
    { href: "/acerca", label: "Acerca de" },
    { href: "/contacto", label: "Contacto" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {logoImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoImage} alt={logoText} className="h-10 w-10 object-contain" />
          ) : (
            <Leaf className="h-6 w-6 text-green-600" />
          )}
          {logoText && <span className="text-xl font-bold">{logoText}</span>}
        </Link>

        {/* Navegación para escritorio */}
        <nav className="hidden md:flex gap-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === route.href ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {route.label}
            </Link>
          ))}
        </nav>

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
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname === route.href ? "text-foreground" : "text-muted-foreground"
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
    </header>
  )
}
