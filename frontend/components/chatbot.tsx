"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react"
import { apiService } from "@/lib/api"
import { usePublicSettings } from "@/lib/use-public-settings"

type Msg = { role: "user" | "assistant"; content: string }

export default function Chatbot() {
  const pathname = usePathname()
  const s = usePublicSettings()

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const title = s.chatbotTitle || "Asistente del Herbario"
  const welcome = s.chatbotWelcome || "¡Hola! ¿En qué puedo ayudarte?"
  const placeholder = s.chatbotPlaceholder || "Escribe tu pregunta…"
  const launcher = s.chatbotLauncher || "¿Necesitas ayuda?"

  // Auto-scroll al último mensaje
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, sending, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  // Oculto en admin y login, o si está desactivado
  if (pathname?.startsWith("/admin") || pathname === "/login") return null
  if (s.chatbotEnabled === false) return null

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setError(null)
    const next: Msg[] = [...messages, { role: "user", content: text }]
    setMessages(next)
    setInput("")
    setSending(true)
    try {
      const res = await apiService.chatbotSend(next)
      if (res.success && res.data?.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: res.data!.reply }])
      } else {
        setError(res.error || "No se pudo obtener respuesta. Intenta de nuevo.")
      }
    } catch {
      setError("Error de conexión con el asistente.")
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const brandGreen = "var(--gov-green)"

  return (
    <>
      {/* Botón lanzador */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[1000] flex items-center gap-2 rounded-full px-4 py-3 text-white shadow-lg transition-transform hover:scale-105"
          style={{ backgroundColor: brandGreen }}
          aria-label="Abrir asistente virtual"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline text-sm font-semibold">{launcher}</span>
        </button>
      )}

      {/* Panel del chat */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[1000] flex h-[min(560px,80vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
          {/* Cabecera */}
          <div
            className="flex items-center justify-between px-4 py-3 text-white"
            style={{ backgroundColor: brandGreen }}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-[11px] text-white/80">En línea</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 hover:bg-white/20"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
            {/* Bienvenida */}
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-background px-3 py-2 text-sm shadow-sm">
                {welcome}
              </div>
            </div>

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    m.role === "user"
                      ? "rounded-tr-sm text-white"
                      : "rounded-tl-sm bg-background"
                  }`}
                  style={m.role === "user" ? { backgroundColor: brandGreen } : undefined}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Escribiendo…
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 shadow-sm">
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* Entrada */}
          <div className="flex items-center gap-2 border-t bg-background p-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              disabled={sending}
              className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-green-600/40"
            />
            <button
              type="button"
              onClick={send}
              disabled={sending || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50"
              style={{ backgroundColor: brandGreen }}
              aria-label="Enviar"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>

          <p className="bg-background pb-2 text-center text-[10px] text-muted-foreground">
            Asistente con IA · puede cometer errores
          </p>
        </div>
      )}
    </>
  )
}
