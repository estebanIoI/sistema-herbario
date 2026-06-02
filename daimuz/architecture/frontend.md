# Arquitectura Frontend

## Stack
- **Framework**: Next.js 15.2.4 (App Router) · React 19
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS 3.4 + PostCSS
- **UI Components**: Radix UI (30+ componentes headless) + Lucide icons
- **Formularios**: React Hook Form + Zod resolvers
- **Mapas**: Leaflet 1.9 + react-leaflet 5 + leaflet.markercluster (clustering)
- **Gráficos**: Chart.js + react-chartjs-2 **Y** Recharts (ambos disponibles)
- **Imágenes**: Cloudinary (`@cloudinary/react` + `@cloudinary/url-gen`)
- **Auth state**: Context API (`lib/auth-context.tsx`) · token en `localStorage`
- **Fechas**: date-fns
- **Utils**: clsx + tailwind-merge (función `cn()` en `lib/utils.ts`)
- **Notificaciones**: sonner (toast moderno) + use-toast.ts (shadcn)
- **Carousel**: Embla Carousel
- **Globo 3D**: cobe (`components/globe-polaroids.tsx`)
- **Command palette**: cmdk
- **Excel**: xlsx (export/import)
- **Dark mode**: next-themes

⚠️ `next.config.mjs`: `output: 'standalone'` · `eslint.ignoreDuringBuilds: true` · `typescript.ignoreBuildErrors: true` · `images.unoptimized: true`

## Estructura de `app/page.tsx` (página de inicio)

Controlada completamente por settings de BD (categoria `'pagina'`). Secciones en orden:

| Sección | Setting de control | Qué muestra |
|---------|-------------------|-------------|
| **Hero 1** | `hero_title`, `hero_slide1..3_image` | Banner principal + carrusel de imágenes |
| **Hero 2** | `hero2_enabled` | "Publicaciones y Servicios" — carrusel de ítems con imagen/badge/título/link |
| **Hero 3** | `features_enabled` | Tarjetas de características (Catálogo, Búsqueda, Información Detallada) |
| **Featured Plants** | `featured_enabled` | Plantas destacadas (`featured=TRUE`) con imagen |
| **Mapa** | (siempre visible) | Leaflet con clustering de plantas geolocalizadas |

⚠️ `GlobePolaroids` fue eliminado de Hero 2 el 2026-06-01 — ya no se usa en `page.tsx`. El carrusel de publicaciones queda centrado (`max-w-2xl mx-auto`).

## Estructura de rutas (`app/`)

```
Públicas:
  /                     → page.tsx (inicio — ver tabla de secciones arriba)
  /plantas              → catálogo de plantas con filtros
  /plantas/[id]         → detalle completo de planta
  /plantas/[id]/sugerencia → formulario de sugerencia
  /publicaciones        → blog/publicaciones
  /publicaciones/[id]   → detalle de publicación
  /acerca               → información del herbario
  /contacto             → formulario de contacto

Autenticadas:
  /login                → formulario de login
  /usuario              → perfil del usuario logueado

Admin (requieren role=admin):
  /admin                → dashboard con stats y gráficos
  /admin/plantas        → listado con CRUD
  /admin/plantas/nueva  → formulario crear planta
  /admin/plantas/[id]/editar → formulario editar
  /admin/usuarios       → gestión de usuarios
  /admin/sugerencias    → moderación de sugerencias
  /admin/publicaciones  → gestión del blog
  /admin/configuracion  → settings del sistema
  /admin/estadisticas   → estadísticas detalladas
```

## Cómo hace llamadas al backend

Todo via la clase `ApiService` en `lib/api.ts` (898 líneas, método central `fetchApi<T>()`):

```typescript
// Patrón real de llamada (lib/api.ts)
const url = `${API_BASE_URL}/api/service`
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    service: 'plants.getAll',
    data: { page: 1, limit: 12 },
    token: localStorage.getItem('token') // token en localStorage
  })
})
```

Instancia global exportada: `apiService` (singleton).

## Archivos clave en lib/

| Archivo | Propósito |
|---------|-----------|
| `lib/api.ts` | Cliente API principal (898 líneas) — único a usar |
| `lib/api-backup.ts` | ⚠️ Versión anterior — NO usar |
| `lib/api-clean.ts` | ⚠️ Versión alternativa — NO usar |
| `lib/auth-context.tsx` | Provider + hook `useAuth()` · `AuthProvider` wrappea la app |
| `lib/cloudinary.ts` | Config y utilidades Cloudinary |
| `lib/use-public-settings.ts` | Hook para cargar settings.getPublic |
| `lib/utils.ts` | Función `cn()` (clsx + tailwind-merge) |

## Componentes principales

| Componente | Propósito |
|-----------|-----------|
| `navbar.tsx` | Barra de navegación principal |
| `footer.tsx` | Pie de página |
| `plant-card.tsx` | Tarjeta de planta en el catálogo |
| `plant-data-sheet.tsx` | Ficha completa de datos de planta |
| `map/PlantMap.tsx` | Mapa Leaflet con clustering |
| `advanced-filters.tsx` | Panel de filtros avanzados |
| `suggestion-form.tsx` | Formulario de sugerencias |
| `cloudinary-image.tsx` | Imagen optimizada vía Cloudinary |
| `globe-polaroids.tsx` | Globo 3D (cobe) — ~~eliminado de page.tsx 2026-06-01~~ · archivo existe pero sin uso activo |
| `visitors-chart.tsx` | Gráfico de visitantes (Chart.js) |
| `admin-sidebar.tsx` | Sidebar del panel admin |
| `protected-route.tsx` | Guard de rutas autenticadas |

## Hooks personalizados

| Hook | Propósito |
|------|-----------|
| `hooks/use-plants.ts` | Operaciones con plantas |
| `hooks/use-search.ts` | Lógica de búsqueda |
| `hooks/use-filters.ts` | Estado de filtros del catálogo |
| `hooks/use-dashboard.ts` | Datos del dashboard admin |

## Variables de entorno

| Variable | Valor dev | Valor Docker prod |
|----------|-----------|-------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5001` | URL pública del backend |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | nombre del cloud | mismo |

⚠️ El puerto por defecto del frontend es **5001** (no 5000). El backend en Docker expone el puerto 5001 al host. En desarrollo local el backend corre en :5000, pero el frontend apunta a :5001 por defecto.


---

## Red de conexiones

- Consume: [[backend]] · [[api-routes]]
- Flujos: [[auth-flow]] · [[plant-upload-flow]]
- Módulos renderizados: [[plants/compressed|plants]] · [[auth/compressed|auth]] · [[dashboard/compressed|dashboard]]
- Identidad: [[DAIMUZ]]
