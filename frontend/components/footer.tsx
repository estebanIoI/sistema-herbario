"use client"

import Link from "next/link"
import { Leaf } from "lucide-react"
import { usePathname } from "next/navigation"
import { SuggestionForm } from "@/components/suggestion-form"
import { usePublicSettings } from "@/lib/use-public-settings"

const GOV_DARK = "var(--gov-dark)"
const GOV_YELLOW = "var(--gov-yellow)"

// Renderiza un enlace del footer: si url está vacía, muestra texto plano
function FooterLink({ text, url }: { text: string; url: string }) {
  if (!text) return null
  if (url) {
    const isExternal = url.startsWith("http")
    return (
      <li>
        <Link
          href={url}
          className="text-white/75 hover:text-white hover:underline"
          {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
        >
          {text}
        </Link>
      </li>
    )
  }
  return <li><span className="text-white/75">{text}</span></li>
}

function FooterColumn({ title, links }: {
  title: string
  links: Array<{ text: string; url: string }>
}) {
  const visibleLinks = links.filter(l => l.text)
  if (!title && visibleLinks.length === 0) return null
  return (
    <div>
      {title && (
        <h3 className="mb-3 text-sm font-semibold text-white border-b-2 pb-2" style={{ borderColor: GOV_YELLOW }}>
          {title}
        </h3>
      )}
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

  const logoText   = s.logoText || "Herbario HEAA"
  const logoImage  = s.logoImageUrl || "/images/logo-uniputumayo.png"
  const footerDesc = s.footerDescription || "Explorando y preservando la diversidad botánica para las generaciones futuras."
  const copyright  = s.footerCopyright  || "Herbario HEAA — Institución Universitaria del Putumayo. Todos los derechos reservados."
  const legalInfo  = s.footerLegalInfo  || ""

  const govbarText = s.govbarText || "GOV.CO"
  const govbarUrl  = s.govbarUrl  || "https://www.gov.co"

  const col = (n: 1 | 2 | 3) => ({
    title: s[`footerCol${n}Title`] ?? "",
    links: [1, 2, 3].map(l => ({
      text: s[`footerCol${n}Link${l}Text`] ?? "",
      url:  s[`footerCol${n}Link${l}Url`]  ?? "",
    })),
  })

  return (
    <footer style={{ backgroundColor: GOV_DARK }}>
      {/* Franja de acento institucional */}
      <div className="h-1 w-full" style={{ backgroundColor: GOV_YELLOW }} />

      <div className="container py-8 md:py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Columna de marca */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {logoImage ? (
                <div className="bg-white rounded-md p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoImage} alt={logoText} className="h-9 w-auto max-w-[160px] object-contain" />
                </div>
              ) : (
                <Leaf className="h-5 w-5 text-white" />
              )}
            </div>
            <span className="block text-lg font-bold text-white">{logoText}</span>
            <p className="text-sm text-white/75">{footerDesc}</p>
          </div>

          {/* Columnas 1, 2 y 3 configurables */}
          <FooterColumn {...col(1)} />
          <FooterColumn {...col(2)} />

          {/* Columna 3: agrega el formulario de sugerencia al final */}
          <div>
            {col(3).title && (
              <h3 className="mb-3 text-sm font-semibold text-white border-b-2 pb-2" style={{ borderColor: GOV_YELLOW }}>
                {col(3).title}
              </h3>
            )}
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

        {/* Datos legales + sello GOV.CO */}
        <div className="mt-8 border-t border-white/20 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left text-sm text-white/75 space-y-1">
            {legalInfo && <p className="whitespace-pre-line">{legalInfo}</p>}
            <p>© {new Date().getFullYear()} {copyright}</p>
            <p>
              <Link href="/politica-de-datos" className="underline hover:text-white transition-colors">
                Política de Tratamiento de Datos Personales (Ley 1581 de 2012)
              </Link>
            </p>
          </div>
          <a
            href={govbarUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 border border-white/40 rounded px-4 py-2 text-white font-bold italic text-sm tracking-wide hover:bg-white/10 transition-colors"
          >
            {govbarText}
          </a>
        </div>
      </div>
    </footer>
  )
}
