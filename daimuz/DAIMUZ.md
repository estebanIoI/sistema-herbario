# DAIMUZ — Índice Maestro
# Sistema Herbario Digital HEAA · Instituto Tecnológico del Putumayo

> Lee este archivo primero. Luego sigue el orden de lectura abajo.

---

## 🗺️ Orden de lectura

```
CLAUDE.md (root)
    ↓
daimuz/DAIMUZ.md  ← estás aquí
    ↓
daimuz/memory/current-state.md     ← ¿dónde estamos?
    ↓
daimuz/indexes/modules-index.md    ← ¿en qué módulo?
    ↓
daimuz/modules/[X]/compressed.md   ← ¿qué archivos tocar?
    ↓
el archivo real del código
```

---

## 📁 Mapa del cerebro

| Carpeta | Qué encontrarás |
|---------|----------------|
| `indexes/` | Navegación O(1): módulos, endpoints, tablas, archivos |
| `modules/` | Un folder por módulo con `compressed.md` + docs completos |
| `memory/` | Estado actual, changelog, features completas, bugs |
| `governance/` | Reglas absolutas y por qué existen |
| `architecture/` | Visión técnica por capa |
| `context/` | Sprint actual, pendientes, entorno |
| `brain/` | ADN: identidad, filosofía, estándares, nomenclatura |
| `flows/` | Flujos end-to-end completos |
| `decisions/` | ADRs: por qué se decidió cada cosa |
| `synapses/` | Impacto entre módulos al cambiar algo |
| `ontology/` | Qué ES cada entidad del dominio |
| `vault/` | Referencia: api-routes, business-rules, darwin-core-fields, glossary, integrations |
| `prompts/` | Plantillas de prompts para tareas comunes |

## 🔴 Estado crítico actual

⚠️ **La BD de producción requiere migración SQL urgente.**  
El código ya usa nombres DwC pero la BD todavía tiene nombres viejos.  
Script en [decisions/darwin-core-migration.md](decisions/darwin-core-migration.md)

---

## ⚡ Módulos del sistema (91 servicios totales)

| Módulo | N° | Qué hace | compressed |
|--------|:--:|----------|-----------|
| **auth** | 9 | Login, registro, JWT 24h, roles | [→](modules/auth/compressed.md) |
| **plants** | 26 | CRUD catálogo botánico Darwin Core | [→](modules/plants/compressed.md) |
| **users** | 12 | Gestión de usuarios y perfiles | [→](modules/users/compressed.md) |
| **dashboard** | 8 | Estadísticas y métricas | [→](modules/dashboard/compressed.md) |
| **suggestions** | 12 | Sugerencias con moderación | [→](modules/suggestions/compressed.md) |
| **taxonomy** | 11 | Familias, géneros, especies | [→](modules/taxonomy/compressed.md) |
| **locations** | 8 | Departamentos, municipios, sitios | [→](modules/locations/compressed.md) |
| **settings** | 8 | Configuración pública y privada | [→](modules/settings/compressed.md) |
| **uploads** | 8 | Gestión de archivos + Cloudinary | [→](modules/uploads/compressed.md) |
| **public** | 6 | Sin auth: stats, featured, filtros, autocompletado | [→](modules/public/compressed.md) |
| **validation** | 4 | Validación de datos de entrada | — |
| **posts** | 5 | ⚠️ **SIN TABLA** — operaciones fallan en runtime | — |
| **pqrsdf** | 2 | Peticiones ciudadanas con radicado | — |

---

## 🔑 Patrón central — API Gateway

**TODA** llamada al backend usa:
```json
POST /api/service
{ "service": "modulo.accion", "data": {...}, "token": "jwt_opcional" }
```

Excepciones directas:
- `POST /api/plantas/upload` — subida de imagen (multipart)
- `GET /api/media/plantas/:file` — servir imagen local
- `GET /health` — health check
- `GET /info` — info del sistema

---

## 📊 Estado rápido

→ Ver [memory/current-state.md](memory/current-state.md) para estado actual detallado.

---

## 🏛️ Institución

- **Proyecto**: Herbario Digital HEAA
- **Institución**: Instituto Tecnológico del Putumayo
- **Stack**: Node.js + Express · Next.js · MySQL · Docker + Dokploy

---

## Red de conexiones — Cerebro completo

### Módulos
[[auth/compressed|auth]] · [[plants/compressed|plants]] · [[users/compressed|users]] · [[dashboard/compressed|dashboard]] · [[suggestions/compressed|suggestions]] · [[taxonomy/compressed|taxonomy]] · [[locations/compressed|locations]] · [[settings/compressed|settings]] · [[uploads/compressed|uploads]] · [[public/compressed|public]]

### Flujos
[[auth-flow]] · [[plant-upload-flow]]

### Sinapsis
[[plants-chain]]

### Gobernanza
[[universal-constraints]] · [[why-decisions]] · [[update-protocol]]

### Arquitectura
[[backend]] · [[frontend]] · [[database]] · [[deployment]] · [[overview]]

### Índices
[[modules-index]] · [[endpoints-index]] · [[db-tables-index]] · [[files-index]]

### Referencia
[[api-routes]] · [[business-rules]] · [[darwin-core-fields]] · [[glossary]] · [[integrations]]

### Orquestador superior
[[NEXUS]] → para flujos híbridos con Acadimuz y futuros cerebros
