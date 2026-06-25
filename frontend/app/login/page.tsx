"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Leaf, Eye, EyeOff, AlertCircle, Microscope, TreePine, BookOpen } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { roleHome, type Role } from "@/lib/permissions"
import { usePublicSettings } from "@/lib/use-public-settings"

const DEFAULT_BG = "https://www.floresyplantas.net/wp-content/uploads/psychotria-elata-1.jpg"

export default function LoginPage() {
  const router = useRouter()
  const { login, register } = useAuth()
  const settings = usePublicSettings()

  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const bgImage = settings.login_bg_image || DEFAULT_BG
  const attribution = settings.login_bg_attribution || "IERNA SINCHI"
  const tagline = settings.login_tagline || "Descubre la flora de la Amazonia"
  const logoText = settings.logo_text || "Herbario Digital"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const result = await login(loginData.email, loginData.password)
      if (result.success) {
        router.push(roleHome((result.user?.role ?? "user") as Role))
      } else {
        setError(result.error || "Error al iniciar sesión")
      }
    } catch {
      setError("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    if (registerData.password !== registerData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }
    if (registerData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setLoading(false)
      return
    }
    try {
      const result = await register(registerData.name, registerData.email, registerData.password)
      if (result.success) {
        router.push("/usuario")
      } else {
        setError(result.error || "Error al registrarse")
      }
    } catch {
      setError("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (tab: "login" | "register") => {
    setActiveTab(tab)
    setError("")
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo — imagen y marca ── */}
      <div className="hidden md:flex md:w-[48%] relative flex-col justify-between overflow-hidden">
        {/* Imagen de fondo */}
        <img
          src={bgImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradiente oscuro sobre imagen */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-950/90 via-green-900/80 to-green-800/70" />
        {/* Velo inferior para legibilidad del tagline */}
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-green-950/80 to-transparent" />

        {/* Círculos decorativos */}
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full border border-white/5" />
        <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full border border-white/8" />
        <div className="absolute bottom-32 left-[-60px] w-56 h-56 rounded-full border border-green-400/10" />

        {/* Logo — arriba */}
        <div className="relative z-10 p-10">
          <Link href="/" className="flex items-center gap-3 text-white/90 hover:text-white transition-colors w-fit group">
            {settings.logo_image_url ? (
              <img src={settings.logo_image_url} alt="" className="h-7 w-7 object-contain" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-green-600/40 border border-green-400/30 flex items-center justify-center group-hover:bg-green-600/60 transition-colors">
                <Leaf className="h-4 w-4 text-green-200" />
              </div>
            )}
            <span className="text-base font-semibold tracking-wide">{logoText}</span>
          </Link>
        </div>

        {/* Contenido central — tagline */}
        <div className="relative z-10 px-10 pb-4 space-y-6">
          <div className="space-y-3">
            <p className="text-green-300/70 text-[10px] font-semibold tracking-[0.25em] uppercase">
              Instituto SINCHI · Colombia
            </p>
            <h1 className="text-3xl font-light text-white leading-tight">
              {tagline}
            </h1>
            <p className="text-green-100/50 text-sm font-light leading-relaxed max-w-[260px]">
              Un catálogo científico de la diversidad botánica colombiana, documentado con rigor académico.
            </p>
          </div>

          {/* Estadísticas / chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { icon: TreePine, label: "Flora amazónica" },
              { icon: Microscope, label: "Rigor científico" },
              { icon: BookOpen, label: "Acceso abierto" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-full px-3 py-1">
                <Icon className="h-3 w-3 text-green-300/70" />
                <span className="text-xs text-white/60 font-light">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Atribución — abajo */}
        <div className="relative z-10 px-10 pb-6">
          <p className="text-[10px] text-white/25 tracking-wide">Fotografía: {attribution}</p>
        </div>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-10 bg-gray-50">

        {/* Logo móvil */}
        <Link href="/" className="md:hidden flex items-center gap-2 text-green-700 mb-10">
          <div className="h-7 w-7 rounded-lg bg-green-600 flex items-center justify-center">
            <Leaf className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-base font-semibold">{logoText}</span>
        </Link>

        {/* Tarjeta del formulario */}
        <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-xl border border-gray-200 p-8">

          {/* Encabezado */}
          <div className="mb-7">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              {activeTab === "login" ? "Bienvenido de nuevo" : "Crear una cuenta"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {activeTab === "login"
                ? "Ingresa tus datos para continuar"
                : "Completa el formulario para registrarte"}
            </p>
          </div>

          {/* ── FORMULARIO LOGIN ── */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Correo electrónico
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  className="h-11 border-gray-200 bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500/20 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu contraseña"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    className="h-11 border-gray-200 bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500/20 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 pr-10 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-3 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm mt-1"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Iniciando sesión…
                  </span>
                ) : "Iniciar sesión"}
              </Button>
            </form>
          )}

          {/* ── FORMULARIO REGISTRO ── */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="register-name" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Nombre completo
                </Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Tu nombre"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  required
                  className="h-11 border-gray-200 bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500/20 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="register-email" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Correo electrónico
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                  className="h-11 border-gray-200 bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500/20 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="register-password" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Contraseña
                  </Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Mín. 6 caracteres"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                    className="h-11 border-gray-200 bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500/20 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="register-confirm" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Confirmar
                  </Label>
                  <Input
                    id="register-confirm"
                    type="password"
                    placeholder="Repite"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    required
                    className="h-11 border-gray-200 bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500/20 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-3 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm mt-1"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Creando cuenta…
                  </span>
                ) : "Crear cuenta"}
              </Button>
            </form>
          )}

          {/* Toggle login / registro */}
          <p className="text-center text-sm text-gray-500 mt-5">
            {activeTab === "login" ? (
              <>
                ¿No tienes cuenta?{" "}
                <button
                  onClick={() => switchTab("register")}
                  className="text-green-600 hover:text-green-700 font-semibold transition-colors"
                >
                  Regístrate
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{" "}
                <button
                  onClick={() => switchTab("login")}
                  className="text-green-600 hover:text-green-700 font-semibold transition-colors"
                >
                  Inicia sesión
                </button>
              </>
            )}
          </p>

          {/* Divisor */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">o</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Visitante */}
          <button
            onClick={() => router.push("/plantas")}
            className="w-full h-11 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium"
          >
            Explorar como visitante
          </button>
        </div>

        {/* Volver al inicio — fuera de la tarjeta */}
        <div className="text-center mt-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <span>←</span>
            <span>Volver al inicio</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
