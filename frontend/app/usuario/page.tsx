import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Leaf, MessageSquare, Settings } from "lucide-react"
import Link from "next/link"

export default function UsuarioPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Panel de Usuario</h1>
          <p className="text-muted-foreground">Bienvenido a tu área personal del Herbario Digital</p>
        </div>

        {/* Tarjetas de acciones */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                Explorar Plantas
              </CardTitle>
              <CardDescription>Navega por nuestra colección completa de especímenes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/plantas">Ver Catálogo</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Mis Sugerencias
              </CardTitle>
              <CardDescription>Revisa las sugerencias que has enviado</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Próximamente
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Configuración
              </CardTitle>
              <CardDescription>Administra tu perfil y preferencias</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Próximamente
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle>¿Qué puedes hacer como usuario registrado?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                Enviar sugerencias de corrección para especímenes
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                Dejar comentarios en las fichas de plantas
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                Guardar plantas favoritas (próximamente)
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                Recibir notificaciones sobre nuevas adiciones (próximamente)
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
