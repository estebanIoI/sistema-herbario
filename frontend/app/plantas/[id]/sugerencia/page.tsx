"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Send, CheckCircle } from "lucide-react"

export default function SugerenciaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  // Usar React.use para desenvolver los parámetros
  const { id } = React.use(params)
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    correccion: "",
    argumento: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Preparar datos para envío a la API
      const apiData = {
        title: `Corrección para planta ID: ${id}`,
        description: `${formData.correccion}\n\nArgumentación: ${formData.argumento}`,
        type: "data_correction", // Tipo específico para correcciones de plantas
        plantId: parseInt(id),
        name: `${formData.nombre} ${formData.apellido}`.trim(),
        email: formData.email,
      }

      // Llamar a la API usando apiService
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: "suggestions.create",
          data: apiData
        }),
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || "Error al enviar sugerencia")
      }
      
      console.log("Sugerencia enviada:", result)
      setSuccess(true)

      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push(`/plantas/${id}`)
      }, 3000)
    } catch (error) {
      console.error("Error al enviar sugerencia:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">
                  ¡Sugerencia enviada exitosamente!
                </h2>
                <p className="text-green-700 dark:text-green-300">
                  Gracias por tu contribución. Los administradores del herbario revisarán tu sugerencia y se pondrán en
                  contacto contigo si es necesario.
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Serás redirigido automáticamente en unos segundos...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button asChild variant="ghost" className="mb-6">
          <Link href={`/plantas/${id}`} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la planta
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-600" />
              Sugerir Corrección
            </CardTitle>
            <CardDescription>
              ¿Has encontrado información incorrecta o incompleta? Ayúdanos a mejorar nuestro herbario enviando tu
              sugerencia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información personal */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Información de contacto</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange("nombre", e.target.value)}
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido *</Label>
                    <Input
                      id="apellido"
                      value={formData.apellido}
                      onChange={(e) => handleInputChange("apellido", e.target.value)}
                      placeholder="Tu apellido"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono de contacto (opcional)</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange("telefono", e.target.value)}
                    placeholder="+57 300 123 4567"
                  />
                </div>
              </div>

              {/* Información de la corrección */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Detalles de la corrección</h3>
                <div className="space-y-2">
                  <Label htmlFor="correccion">Corrección sugerida *</Label>
                  <Textarea
                    id="correccion"
                    value={formData.correccion}
                    onChange={(e) => handleInputChange("correccion", e.target.value)}
                    placeholder="Describe específicamente qué información consideras que debe corregirse..."
                    rows={4}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="argumento">Argumento que justifica el cambio *</Label>
                  <Textarea
                    id="argumento"
                    value={formData.argumento}
                    onChange={(e) => handleInputChange("argumento", e.target.value)}
                    placeholder="Proporciona referencias bibliográficas, experiencia de campo, o cualquier evidencia que respalde tu sugerencia..."
                    rows={5}
                    required
                  />
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Nota:</strong> Todas las sugerencias son revisadas por nuestro equipo de botánicos. Te
                  contactaremos si necesitamos información adicional o para confirmar los cambios realizados.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                  {loading ? "Enviando..." : "Enviar Sugerencia"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
