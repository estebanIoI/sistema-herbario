"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Leaf, Eye, EyeOff, AlertCircle, User, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { login, register } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Estados para login
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  // Estados para registro
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await login(loginData.email, loginData.password)
      
      if (result.success) {
        // Redirigir según el rol del usuario
        // Esto se puede mejorar obteniendo el rol del contexto de autenticación
        router.push("/admin") // Por defecto, después podemos usar el rol real
      } else {
        setError(result.error || "Error al iniciar sesión")
      }
    } catch (err) {
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
        // Redirigir a área de usuario después del registro
        router.push("/usuario")
      } else {
        setError(result.error || "Error al registrarse")
      }
    } catch (err) {
      setError("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  const continueAsGuest = () => {
    router.push("/plantas")
  }

  return (
    <div className="min-h-screen flex items-center justify-end relative overflow-hidden">
      {/* Imagen de fondo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black opacity-30 z-10" /> {/* Overlay para mejorar contraste */}
        <img 
          src="https://www.floresyplantas.net/wp-content/uploads/psychotria-elata-1.jpg" 
          alt="Fondo herbario" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Contenido de herbario a la izquierda */}
      <div className="hidden md:block absolute left-8 top-8 z-20">
        <Link href="/" className="flex items-center gap-2 text-white hover:text-green-100">
          <Leaf className="h-6 w-6" />
          <span className="text-lg font-bold">Herbario Digital</span>
        </Link>
      </div>
      
      {/* Tarjeta de Login alineada a la derecha */}
      <div className="w-full max-w-md space-y-6 rounded-lg shadow-xl p-6 border border-white/20 backdrop-blur-md bg-transparent z-10 mr-8 relative">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <Leaf className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold text-white">Herbario Digital</span>
            </div>
          </div>
          <p className="text-white/80">Accede a tu cuenta o explora como visitante</p>
        </div>

        {/* Tabs para Login/Registro */}
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/30 dark:bg-gray-800/30">
            <TabsTrigger value="login" className="data-[state=active]:bg-white/50 data-[state=active]:text-black dark:data-[state=active]:bg-gray-900/50 dark:data-[state=active]:text-white">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-white/50 data-[state=active]:text-black dark:data-[state=active]:bg-gray-900/50 dark:data-[state=active]:text-white">Registrarse</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <div className="border border-white/20 rounded-md p-4 pt-6 shadow-sm bg-transparent backdrop-blur-sm">
              <div className="mb-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <User className="h-5 w-5" />
                  Iniciar Sesión
                </h3>
                <p className="text-sm text-white/80">Ingresa tus credenciales para acceder</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-white">Correo electrónico</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-white">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Tu contraseña"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-white/70 hover:text-white hover:bg-white/20"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-green-600/80 hover:bg-green-700/90 text-white border-none backdrop-blur-sm" disabled={loading}>
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <div className="border border-white/20 rounded-md p-4 pt-6 shadow-sm bg-transparent backdrop-blur-sm">
              <div className="mb-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Users className="h-5 w-5" />
                  Crear Cuenta
                </h3>
                <p className="text-sm text-white/80">Regístrate para acceder a funciones adicionales</p>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name" className="text-white">Nombre completo</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Tu nombre completo"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-white">Correo electrónico</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-white">Contraseña</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm" className="text-white">Confirmar contraseña</Label>
                  <Input
                    id="register-confirm"
                    type="password"
                    placeholder="Repite tu contraseña"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-green-600/80 hover:bg-green-700/90 text-white border-none backdrop-blur-sm" disabled={loading}>
                  {loading ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>

        {/* Continuar como visitante */}
        <div className="border border-white/20 rounded-md p-4 text-center space-y-3 backdrop-blur-sm shadow-sm bg-transparent">
          <p className="text-sm text-white/80">¿Solo quieres explorar?</p>
          <Button variant="outline" onClick={continueAsGuest} className="w-full bg-white/20 text-white border-white/20 hover:bg-white/30">
            Continuar como visitante
          </Button>
        </div>

        {/* Link de regreso */}
        <div className="text-center">
          <Link href="/" className="text-sm text-white/70 hover:text-white">
            ← Volver al inicio
          </Link>
        </div>
      </div>

      {/* Atribución de la imagen en la parte inferior */}
      <div className="absolute bottom-2 left-2 text-xs text-white/70 z-10">
        <p>Imagen: IERNA SINCHI</p>
      </div>
    </div>
  )
}
