"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useEffect, useRef, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggle = () => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const newTheme = theme === "dark" ? "light" : "dark"

    document.documentElement.style.setProperty("--ripple-x", `${x}px`)
    document.documentElement.style.setProperty("--ripple-y", `${y}px`)

    if (!("startViewTransition" in document)) {
      setTheme(newTheme)
      return
    }

    ;(document as any).startViewTransition(() => {
      setTheme(newTheme)
    })
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
        <span className="sr-only">Cambiar tema</span>
      </Button>
    )
  }

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={`Cambiar a tema ${theme === "dark" ? "claro" : "oscuro"}`}
      className="w-9 h-9 rounded-full border border-border/50 hover:border-border transition-colors"
    >
      <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  )
}
