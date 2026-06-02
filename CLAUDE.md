# CLAUDE.md — Sistema Herbario Digital HEAA

## 🧠 Primer paso siempre

1. Lee `daimuz/DAIMUZ.md` → índice maestro del proyecto
2. Lee `daimuz/memory/current-state.md` → qué funciona hoy
3. Lee el módulo específico → `daimuz/modules/[modulo]/compressed.md`
4. Lee el archivo real del código
5. Lee el flujo si aplica → `daimuz/flows/`

## ⚡ Stack

| Capa       | Tecnología                              |
|------------|-----------------------------------------|
| Frontend   | Next.js (App Router) + TypeScript       |
| Estilos    | Tailwind CSS + Radix UI                 |
| Backend    | Node.js + Express.js                    |
| Base datos | MySQL (Darwin Core)                     |
| Auth       | JWT (jsonwebtoken + bcryptjs)           |
| Archivos   | Multer + Cloudinary                     |
| Cache      | node-cache / Redis (Docker)             |
| Deploy     | Docker + Dokploy + Traefik              |

## 📐 Reglas que nunca se rompen

1. **Un solo endpoint**: toda llamada API va a `POST /api/service` con `{ service, data, token }`
2. **Darwin Core**: los campos de plantas siguen el estándar biológico internacional
3. **Roles**: admin > collector > user — verificar permisos antes de cualquier operación de escritura
4. **Imágenes**: siempre via Cloudinary, nunca almacenamiento local en producción
5. **JWT en campo `token`**: no en headers Authorization, va dentro del payload JSON
6. **Soft delete**: usar `deleted_at` en lugar de `DELETE` en tablas principales

## 💾 Sistema de memoria

Toda la documentación vive en `daimuz/`
Actualizar `daimuz/memory/current-state.md` al final de cada sesión importante.

---

## Red de conexiones

- Índice maestro: [[DAIMUZ]]
- Estado actual: [[current-state]]
- Módulos: [[modules-index]]
- Gobernanza: [[universal-constraints]]
- Orquestador superior: [[NEXUS]]
