# Guía para Desarrolladores — API Herbario Digital HEAA

> Instituto Tecnológico del Putumayo · Backend Node.js + Express + MySQL
> Documento generado a partir del **análisis directo del código fuente** (`src/`). No asume REST ni inventa endpoints: describe el backend tal como funciona hoy.

---

## 1. Análisis arquitectónico

### 1.1 Tipo de arquitectura detectada

**Monolito Modular** con un **Service Gateway** (despachador de comandos en proceso).

- **Monolito:** un único proceso Express desplegable (`server.js` → `src/app.js`), un solo repositorio y una sola base de datos MySQL. No hay microservicios ni comunicación de red entre módulos.
- **Modular:** el código está organizado por dominio dentro de `src/controllers/<módulo>/` (auth, plants, users, taxonomy, locations, dashboard, suggestions, posts, settings, pqrsdf, uploads).
- **Capas:** `Traefik → Express (app.js) → ruta → serviceController (gateway) → controlador de dominio → mysql2 (SQL nativo, sin ORM) → MySQL`.

### 1.2 Patrón de comunicación detectado

**RPC sobre HTTP detrás de un Service Gateway de endpoint único.**

Toda la lógica de negocio se invoca con una sola ruta física:

```
POST /api/service
{ "service": "modulo.accion", "data": { ... }, "token": "JWT?" }
```

El despachador (`src/controllers/serviceController.js`) lee `service`, lo busca en un **registro** (`src/services/index.js`, un objeto `{ 'modulo.accion': fn }` con ~123 entradas) y ejecuta `fn(data, user, context)`. La **acción viaja en el payload**, no en el método HTTP ni en la URL.

### 1.3 ¿REST, RPC o Service Gateway? (con evidencia)

| Patrón | ¿Coincide? | Evidencia en el código |
|--------|:---------:|------------------------|
| **REST** | ❌ No | No hay rutas por recurso ni uso semántico de verbos. Crear, leer, actualizar y borrar una planta son **todas** `POST /api/service` cambiando `data.service`. No se usan PUT/PATCH/DELETE para CRUD. |
| **GraphQL-like** | ❌ No | No hay schema de tipos, ni un único resolver de consulta, ni selección de campos por el cliente. |
| **RPC / Command Dispatcher** | ✅ Sí | `services[service](data, user, context)` invoca una función nombrada. Es una llamada a procedimiento remoto sobre HTTP. |
| **Service Gateway** | ✅ Sí (en proceso) | Un único punto de entrada (`/api/service`) centraliza enrutado, autenticación y autorización antes de delegar. Es un *gateway/facade interno*, no un API Gateway de microservicios (tipo Kong) que enrute por red. |

**Conclusión:** *Service Gateway + RPC* sobre un *Monolito Modular*.

### 1.4 Ventajas y desventajas

**Ventajas**

- **Un solo contrato de transporte:** el frontend siempre hace `POST /api/service`; añadir un servicio es registrar una función, sin tocar rutas ni CORS.
- **Autenticación/roles centralizados:** un único punto (`serviceController`) decide token y rol; no se repite en cada ruta.
- **Simplicidad de despliegue:** un proceso, un build, una base de datos. Fácil de operar para un equipo pequeño.
- **Descubribilidad interna:** el registro `services/index.js` es un índice único de toda la capacidad del backend.

**Desventajas**

- **No idiomático HTTP:** se pierden caché HTTP por método/URL, semántica de verbos, y herramientas REST estándar. Swagger necesita el truco `#servicio` para diferenciar operaciones sobre la misma ruta.
- **Autorización por listas frágiles:** los permisos viven en dos arreglos (`SERVICES_REQUIRING_AUTH` y `adminServices`) separados del registro. Es fácil que un servicio nuevo quede **sin protección** o que una verificación interna de rol nunca reciba el usuario (ver §6, bugs "siempre 403").
- **Acoplamiento al despachador:** todo pasa por una función; los errores se infieren del texto del mensaje para mapear códigos HTTP.
- **Verbo único:** todo es POST, lo que dificulta la observabilidad por método y el rate limiting diferenciado.

---

## 2. El patrón Monolito Modular + Service Gateway en detalle

### 2.1 Recorrido de una petición

```
Frontend
  └─ POST /api/service { service:"plants.getAll", data:{ limit:12 } }
       └─ app.js (helmet, cors, rateLimiter, logger)
            └─ routes/service.js  → serviceController.handleRequest
                 1. ¿existe data.service en el registro?           → si no: 404
                 2. ¿está en SERVICES_REQUIRING_AUTH?               → si sí y no hay token: 401
                 3. verifica JWT (body.token) y carga el usuario    → token malo/usuario inactivo: 403
                 4. ¿está en adminServices y el rol no es admin?    → 403
                 5. result = services["plants.getAll"](data, user, context)
                 6. responde { success:true, data:result, service, timestamp, executionTime }
```

### 2.2 Envoltura de respuesta (siempre la misma)

Éxito:
```json
{ "success": true, "data": { ... }, "service": "plants.getAll", "timestamp": "2026-06-04T12:00:00.000Z", "executionTime": 14 }
```

Error:
```json
{ "success": false, "error": "Planta no encontrada", "code": null, "service": "plants.getById", "timestamp": "..." }
```

El código HTTP de error se **infiere** del mensaje cuando el error no trae `statusCode`:
`ER_DUP_ENTRY` → 409; mensaje con *"no encontrado"* → 404; *"permisos"/"autorizado"* → 403; *"requerido"/"inválido"* → 400; en otro caso → **500**.

### 2.3 Rutas HTTP reales (las únicas fuera del gateway)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET`  | `/health` | — | Estado del sistema y BD. Exenta de rate limit. |
| `GET`  | `/info` | — | Metadatos del servidor. Exenta de rate limit. |
| `POST` | `/api/plantas/upload` | **Header** `Authorization: Bearer` | Subida de imagen (multipart, máx 10 MB) a Cloudinary o local. |
| `GET`  | `/api/media/plantas/{file}` | — | Sirve imágenes locales (protegido contra path traversal). |
| `POST` | `/api/service` | Body `token` (según servicio) | **Gateway**: todos los demás servicios. |

> ⚠️ **Importante:** el JWT viaja en el **campo `token` del cuerpo JSON**, NO en el header `Authorization` — excepto en `POST /api/plantas/upload`, que es la única ruta que usa `Authorization: Bearer`.

---

## 3. Flujo de autenticación

```
1. POST /api/service { service:"auth.login", data:{ email, password } }
   → { success:true, data:{ token, user:{ id, email, name, role } } }

2. Guarda el token (válido 24 h).

3. En cada servicio protegido, envía el token en el BODY:
   POST /api/service { service:"plants.create", token:"<JWT>", data:{ ... } }

4. Perfil actual:
   POST /api/service { service:"auth.me", token:"<JWT>", data:{} }

5. Cerrar sesión:
   POST /api/service { service:"auth.logout", token:"<JWT>", data:{} }
```

**Roles:** jerarquía conceptual `admin > collector > user`. En la práctica, casi todo lo restringido exige `admin` (lista `adminServices`). Los servicios protegidos sólo por token (sin admin) son, por ejemplo, `auth.me`, `auth.logout` y `users.updateProfile`.

**Subida de imagen** (header, no body):
```
POST /api/plantas/upload
Authorization: Bearer <JWT>
Content-Type: multipart/form-data ; campo "image"
→ { success:true, data:{ url, thumbnailUrl, filename, ... } }
```

---

## 4. Estructura de módulos

```
backend/
├── server.js                  ← arranque HTTP + sockets + shutdown
├── docs/
│   ├── api-spec.yaml          ← OpenAPI 3.1 (servido en /api-docs)
│   └── GUIA-DESARROLLADORES.md ← este documento
└── src/
    ├── app.js                 ← Express: middlewares + montaje de rutas + Swagger UI
    ├── config/                ← database.js (pool mysql2), cloudinary.js, socket.js
    ├── routes/
    │   ├── service.js         ← POST /api/service  → serviceController
    │   ├── plants.js          ← POST /api/plantas/upload (multipart)
    │   └── media.js           ← GET  /api/media/plantas/:file
    ├── controllers/
    │   ├── serviceController.js ← DESPACHADOR: registro de auth/roles + envoltura
    │   ├── auth/  plants/  users/  taxonomy/  locations/
    │   ├── dashboard/  suggestions/  posts/  settings/  pqrsdf/  uploads/
    ├── services/
    │   └── index.js           ← REGISTRO { 'modulo.accion': fn }  (fuente de verdad)
    ├── middleware/            ← auth.js, rateLimiter.js, errorHandler.js, upload.js
    └── utils/                 ← logger.js (Winston)
```

**Convención clave:** un servicio se ejecuta como `fn(data, user, context)`:
- `data` = el objeto `data` del body.
- `user` = `{ id, email, name, role, status }` si el servicio está en `SERVICES_REQUIRING_AUTH`; si no, `null`.
- `context` = `{ ip, userAgent }`.

> Nota: algunos controladores históricos están escritos al estilo Express `(req, res)` y **no funcionan** invocados por el gateway (ver §6).

### 4.1 Catálogo de módulos (servicios reales del registro)

| Módulo | Servicios destacados | Notas |
|--------|----------------------|-------|
| **auth** | login, register, me, logout, forgotPassword, resetPassword | `register` fuerza rol `user`. `resetPassword` está simulado. `refresh`/`changePassword`/`verifyEmail` no funcionan vía gateway. |
| **plants** | getAll, getById, getForMap, create🔒, update🔒, delete🔒, advancedSearch, getStats, export, import🔒 | Campos en **snake_case Darwin Core**. Varias variantes de búsqueda son alias de `advancedSearch`. |
| **taxonomy** | getFamilies, getGeneraByFamily, getSpeciesByGenus, getTaxonomyTree, autocomplete.* | `getGenera`/`getSpecies` son alias de `getFamilies`. Crear/editar/borrar son stubs. |
| **locations** | getDepartments, getMunicipalitiesByDepartment, getCollectionSites | Crear/editar/borrar son stubs. |
| **users** | getAll🔒, getById🔒, create🔒, update🔒, delete🔒, updateProfile | `changeRole`/`getProfile`/`getActivity` no funcionan vía gateway; varios servicios (`getStats`, `activate`…) están registrados pero no resuelven (404). |
| **dashboard** | getStats🔒, getRecentActivity🔒, getPlantsByFamily, getMonthlyStats… | Sólo `getStats` y `getRecentActivity` exigen admin; el resto es público hoy. |
| **suggestions** | create, vote, getById, getAll🔒, approve🔒, reject🔒, countUnread🔒 | `update`/`updateStatus`/`getStats` tienen el bug "siempre 403". |
| **posts** | getAll, getById, create🔒, update🔒, delete🔒 | Sin token sólo se ven `published`. |
| **settings** | getAll🔒, get, update🔒, updateMultiple🔒, getPublic | `get`/`getSystemInfo`/`getPublic` no verifican rol. |
| **pqrsdf** | create, getAll🔒 | `create` usa campos en español (`tipo`, `mensaje`, `autoriza`…). |
| **uploads** | uploadFile, deleteFile, getFileInfo, validateFile | La subida binaria real es la ruta REST `/api/plantas/upload`. |

🔒 = requiere rol admin.

---

## 5. Ejemplos de consumo

### 5.1 JavaScript (cliente universal con `fetch`)

```javascript
// api.js — un único cliente para todo el backend
const API_URL = "http://localhost:5001"; // prod: https://api.2.24.195.20.nip.io

export async function callService(service, data = {}, token = null) {
  const res = await fetch(`${API_URL}/api/service`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service, data, ...(token ? { token } : {}) }),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || `Error en ${service}`);
  }
  return json.data;
}

// --- Uso ---
// 1) Login
const { token, user } = await callService("auth.login", {
  email: "admin@heaa.edu.co",
  password: "admin123",
});

// 2) Listar plantas (público)
const { plants, pagination } = await callService("plants.getAll", {
  page: 1, limit: 12, family: "Heliconiaceae",
});

// 3) Crear espécimen (admin, token en el body)
const nueva = await callService("plants.create", {
  scientific_name: "Heliconia psittacorum",
  family: "Heliconiaceae",
  genus: "Heliconia",
  catalog_number: "HEAA-0001",
}, token);
```

### 5.2 Subida de imagen (header `Authorization`, multipart)

```javascript
export async function uploadPlantImage(file, token) {
  const form = new FormData();
  form.append("image", file); // <input type="file">
  const res = await fetch(`${API_URL}/api/plantas/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }, // ← aquí SÍ va en header
    body: form,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data; // { url, thumbnailUrl, filename, ... }
}
```

### 5.3 React (hook + componente)

```jsx
// useService.js
import { useState, useCallback } from "react";
import { callService } from "./api";

export function useService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (service, data, token) => {
    setLoading(true); setError(null);
    try {
      return await callService(service, data, token);
    } catch (e) {
      setError(e.message); throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { run, loading, error };
}
```

```jsx
// PlantList.jsx
import { useEffect, useState } from "react";
import { useService } from "./useService";

export default function PlantList() {
  const { run, loading, error } = useService();
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    run("plants.getAll", { page: 1, limit: 12 })
      .then((d) => setPlants(d.plants))
      .catch(() => {});
  }, [run]);

  if (loading) return <p>Cargando…</p>;
  if (error) return <p>Error: {error}</p>;
  return (
    <ul>
      {plants.map((p) => (
        <li key={p.id}>
          <em>{p.scientific_name}</em> — {p.family}
        </li>
      ))}
    </ul>
  );
}
```

```jsx
// Login.jsx — guardar el token en estado/Context (NO en localStorage de un artifact)
import { useState } from "react";
import { callService } from "./api";

export default function Login({ onLogged }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);

  async function submit(e) {
    e.preventDefault();
    try {
      const { token, user } = await callService("auth.login", { email, password });
      onLogged(token, user); // el padre guarda token+user en memoria/Context
    } catch (e) { setErr(e.message); }
  }

  return (
    <form onSubmit={submit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" />
      <button>Entrar</button>
      {err && <p>{err}</p>}
    </form>
  );
}
```

### 5.4 Aplicaciones móviles

**React Native** (mismo patrón; el token se guarda con AsyncStorage o SecureStore):

```javascript
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://api.2.24.195.20.nip.io";

export async function callService(service, data = {}) {
  const token = await AsyncStorage.getItem("token"); // null si no hay sesión
  const res = await fetch(`${API_URL}/api/service`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service, data, ...(token ? { token } : {}) }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

// Login y persistencia del token
export async function login(email, password) {
  const { token, user } = await callService("auth.login", { email, password });
  await AsyncStorage.setItem("token", token);
  return user;
}
```

**Flutter / Dart** (equivalente conceptual):

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

const apiUrl = 'https://api.2.24.195.20.nip.io';

Future<dynamic> callService(String service, {Map data = const {}, String? token}) async {
  final body = {'service': service, 'data': data};
  if (token != null) body['token'] = token;

  final res = await http.post(
    Uri.parse('$apiUrl/api/service'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode(body),
  );
  final json = jsonDecode(res.body);
  if (json['success'] != true) {
    throw Exception(json['error'] ?? 'Error en $service');
  }
  return json['data'];
}
```

> **Regla de oro móvil:** el JWT siempre va dentro del JSON (`token`), igual que en web. Sólo `/api/plantas/upload` usa el header `Authorization: Bearer`.

---

## 6. Estado real de los servicios (importante para no perder tiempo)

El registro tiene ~123 servicios, pero no todos están operativos. La especificación OpenAPI marca cada operación con `x-service-status`:

| Estado | Qué significa | Ejemplos |
|--------|---------------|----------|
| **ok** | Funcional. | `auth.login`, `plants.getAll`, `plants.create`, `pqrsdf.create` |
| **stub** | Registrado pero responde `{ success:false, "Funcionalidad pendiente" }`. | `taxonomy.createFamily`, `locations.createLocation`, `plants.uploadImage`, `uploads.resizeImage` |
| **broken** | Handler estilo Express; **falla** vía gateway. | `auth.refresh`, `auth.changePassword`, `users.changeRole`, `users.getProfile` |
| **always403** | Verifica admin pero no recibe el usuario → **siempre 403**. | `suggestions.update`, `suggestions.updateStatus`, `suggestions.getStats`, `users.toggleStatus` |
| **404 (no documentado)** | Registrado con controlador `undefined` → "Servicio no encontrado". | `users.getStats`, `users.activate`, `users.deactivate`, `users.uploadAvatar`, `autocomplete.collectors` |

### Hallazgos de seguridad detectados en el código (recomendado corregir)

1. **Escrituras sin protección:** `plants.purgeDeleted` (borrado físico) y `uploads.deleteFile` no están en las listas de autenticación → accesibles sin token. Los `taxonomy.*`/`locations.*` de escritura hoy son stubs, pero igualmente quedarían desprotegidos al implementarse.
2. **Lectura sensible pública:** `dashboard.getSystemHealth`, `dashboard.getStorageInfo` y la mayoría de métricas del dashboard (salvo `getStats`/`getRecentActivity`) responden sin autenticación.
3. **Bugs "siempre 403":** `suggestions.update`, `suggestions.updateStatus`, `suggestions.getStats` y `users.toggleStatus` verifican admin internamente pero no están en `SERVICES_REQUIRING_AUTH`, por lo que el despachador nunca inyecta el usuario. Solución: añadirlos a esa lista.
4. **Ajustes sin rol:** `settings.get` y `settings.getSystemInfo` no verifican rol.
5. **Recomendación de fondo:** mover los metadatos de auth/rol al propio registro (`services/index.js`), por ejemplo `{ fn, auth:true, role:'admin' }`, para que un servicio nuevo no pueda quedar desprotegido por olvido en una lista paralela.

---

## 7. Documentación interactiva (Swagger UI)

- **Swagger UI:** `GET /api-docs` (servido por `swagger-ui-express` desde `docs/api-spec.yaml`).
- **Spec cruda:** `GET /docs/api-spec.yaml`.
- Para probar un servicio protegido en Swagger UI, copia el JWT en el campo `token` del ejemplo del cuerpo (Swagger no puede inyectar campos en el body automáticamente, porque la autenticación de esta API no usa header).

### Cómo probar rápido con cURL

```bash
# Login
curl -s -X POST http://localhost:5001/api/service \
  -H "Content-Type: application/json" \
  -d '{"service":"auth.login","data":{"email":"admin@heaa.edu.co","password":"admin123"}}'

# Servicio protegido (token en el body)
curl -s -X POST http://localhost:5001/api/service \
  -H "Content-Type: application/json" \
  -d '{"service":"dashboard.getStats","token":"<JWT>","data":{}}'
```

---

*Última actualización generada desde el código fuente. Si cambias `src/services/index.js` o las listas de auth en `serviceController.js`, regenera `docs/api-spec.yaml` y revisa este documento.*
