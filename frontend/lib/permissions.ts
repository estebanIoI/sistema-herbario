// ============================================================================
// Control de acceso basado en roles (RBAC) — Panel de administración
// Jerarquía de la matriz:  user < collector < investigador < admin
//
// Único punto de verdad para:
//   · qué secciones del panel ve cada rol (sidebar)
//   · a qué rutas puede entrar (guard de rutas)
//   · qué acciones puede ejecutar (capacidades: registrar, exportar…)
// ============================================================================

export type Role = "admin" | "investigador" | "collector" | "user"

// Roles con acceso al panel /admin (el resto se redirige al sitio público)
export const PANEL_ROLES: Role[] = ["admin", "investigador", "collector"]

// Nivel numérico para comparaciones jerárquicas
export const ROLE_LEVEL: Record<Role, number> = {
  user: 0,
  collector: 1,
  investigador: 2,
  admin: 3,
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  investigador: "Investigador",
  collector: "Colector",
  user: "Usuario",
}

// ── Permisos por ruta del panel ─────────────────────────────────────────────
// Prefijo de ruta → roles autorizados. Se evalúa por coincidencia de prefijo
// (la más larga gana), así /admin/plantas/nueva hereda de /admin/plantas.
export const ROUTE_ROLES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin/plantas",       roles: ["admin", "investigador", "collector"] },
  { prefix: "/admin/taxonomia",     roles: ["admin", "investigador", "collector"] },
  { prefix: "/admin/sugerencias",   roles: ["admin"] },
  { prefix: "/admin/pqrsdf",        roles: ["admin"] },
  { prefix: "/admin/publicaciones", roles: ["admin"] },
  { prefix: "/admin/pagina",        roles: ["admin"] },
  { prefix: "/admin/usuarios",      roles: ["admin"] },
  { prefix: "/admin/configuracion", roles: ["admin"] },
  { prefix: "/admin/backup",        roles: ["admin"] },
  // El índice del dashboard es solo admin (los demás se redirigen a su home)
  { prefix: "/admin",               roles: ["admin"] },
]

// ── Capacidades discretas (para gatear botones/acciones en la UI) ───────────
export const CAPABILITIES = {
  // Registrar/editar especímenes en campo con imágenes
  registerSpecimen: ["admin", "investigador", "collector"] as Role[],
  // Búsqueda avanzada y exportación de datos
  exportData: ["admin", "investigador"] as Role[],
  // Gestión total del portal y de roles
  manageUsers: ["admin"] as Role[],
}

export function can(role: Role | undefined | null, capability: keyof typeof CAPABILITIES): boolean {
  if (!role) return false
  return CAPABILITIES[capability].includes(role)
}

// ¿Puede el rol entrar a esta ruta del panel?
export function canAccessRoute(role: Role | undefined | null, pathname: string): boolean {
  if (!role) return false
  const match = ROUTE_ROLES
    .filter(r => pathname === r.prefix || pathname.startsWith(r.prefix + "/"))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0]
  // Rutas no listadas dentro de /admin: permitir a cualquier rol del panel
  if (!match) return PANEL_ROLES.includes(role)
  return match.roles.includes(role)
}

// Ruta "home" del panel según el rol (a dónde redirigir tras login o si entra
// a una sección no permitida)
export function roleHome(role: Role | undefined | null): string {
  switch (role) {
    case "admin":        return "/admin"
    case "investigador": return "/admin/plantas"
    case "collector":    return "/admin/plantas"
    default:             return "/"
  }
}
