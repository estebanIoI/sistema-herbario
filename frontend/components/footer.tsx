"use client"

import Link from "next/link"
import { Leaf } from "lucide-react"
import { usePathname } from "next/navigation"
import { SuggestionForm } from "@/components/suggestion-form"
import { usePublicSettings } from "@/lib/use-public-settings"

// Renderiza un enlace del footer: si url está vacía, muestra texto plano
function FooterLink({ text, url }: { text: string; url: string }) {
  if (!text) return null
  if (url) {
    const isExternal = url.startsWith("http")
    return (
      <li>
        <Link
          href={url}
          className="text-muted-foreground hover:text-foreground"
          {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
        >
          {text}
        </Link>
      </li>
    )
  }
  return <li><span className="text-muted-foreground">{text}</span></li>
}

function FooterColumn({ title, links }: {
  title: string
  links: Array<{ text: string; url: string }>
}) {
  const visibleLinks = links.filter(l => l.text)
  if (!title && visibleLinks.length === 0) return null
  return (
    <div>
      {title && <h3 className="mb-3 text-sm font-medium">{title}</h3>}
      <ul className="space-y-2 text-sm">
        {visibleLinks.map((l, i) => (
          <FooterLink key={i} text={l.text} url={l.url} />
        ))}
      </ul>
    </div>
  )
}

export default function Footer() {
  const pathname = usePathname()
  const s = usePublicSettings()

  const isAdmin = pathname?.startsWith("/admin")
  const isLoginPage = pathname === "/login"
  if (isAdmin || isLoginPage) return null

  const logoText   = s.logoText   || "Herbario Digital"
  const logoImage  = s.logoImageUrl || ""
  const footerDesc = s.footerDescription || "Explorando y preservando la diversidad botánica para las generaciones futuras."
  const copyright  = s.footerCopyright  || "Herbario Digital. Todos los derechos reservados."

  const col = (n: 1 | 2 | 3) => ({
    title: s[`footerCol${n}Title`] ?? "",
    links: [1, 2, 3].map(l => ({
      text: s[`footerCol${n}Link${l}Text`] ?? "",
      url:  s[`footerCol${n}Link${l}Url`]  ?? "",
    })),
  })

  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Columna de marca */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {logoImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoImage} alt={logoText} className="h-5 w-5 object-contain" />
              ) : (
                <Leaf className="h-5 w-5 text-green-600" />
              )}
              <span className="text-lg font-bold">{logoText}</span>
            </div>
            <p className="text-sm text-muted-foreground">{footerDesc}</p>
          </div>

          {/* Columnas 1, 2 y 3 configurables */}
          <FooterColumn {...col(1)} />
          <FooterColumn {...col(2)} />

          {/* Columna 3: agrega el formulario de sugerencia al final */}
          <div>
            {col(3).title && <h3 className="mb-3 text-sm font-medium">{col(3).title}</h3>}
            <ul className="space-y-2 text-sm">
              {col(3).links.map((l, i) => (
                <FooterLink key={i} text={l.text} url={l.url} />
              ))}
              <li className="mt-3">
                <SuggestionForm />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {copyright}</p>
        </div>
      </div>
    </footer>
  )
}
