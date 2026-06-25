import { redirect } from "next/navigation"

// Módulo de Estadísticas retirado: su información ya está disponible en el
// Dashboard y en otros módulos. Se redirige para evitar enlaces rotos.
export default function EstadisticasPage() {
  redirect("/admin")
}
