# Flujo de Subida de Planta con Imagen

## Paso 1: Crear la planta (datos)

```
Frontend: POST /api/service
{
  service: "plants.create",
  token: "eyJ...",
  data: {
    scientific_name: "Heliconia stricta",
    family: "Heliconiaceae",
    genus: "Heliconia",
    collector_name: "Juan Pérez",
    collection_date: "2024-03-15",
    department: "Putumayo",
    municipality: "Mocoa",
    habitat: "Bosque húmedo tropical",
    herbarium_number: "HEAA-001",
    status: "draft"
  }
}

Respuesta: { success: true, data: { id: 123 } }
```

## Paso 2: Subir imagen (multipart)

```
Frontend: POST /api/plantas/upload
Content-Type: multipart/form-data
Headers: Authorization o token en form data
Body:
  - plant_id: 123
  - image: [archivo]
  - image_type: "habit"
  - caption: "Vista general de la planta"
  - is_main: true

Middleware upload.js (Multer):
  - Valida MIME type (solo imágenes)
  - Límite 10MB
  - Sanitiza nombre de archivo

Cloudinary (producción):
  - Sube a carpeta "herbario/plantas/123/"
  - Genera thumbnail automático
  - Retorna image_url, thumbnail_url

Inserta en plant_images:
  - plant_id, image_url, thumbnail_url, is_main=true, image_type

Respuesta: { success: true, data: { image_url, thumbnail_url } }
```

## Paso 3: Publicar planta

```
Frontend: POST /api/service
{
  service: "plants.update",
  token: "eyJ...",
  data: { id: 123, status: "published" }
}
```

## Flujo de guardado por secciones (frontend — `app/admin/plantas/nueva/`)

El formulario de creación implementa guardado progresivo por pestañas. Cada sección tiene botón "Guardar Sección" y "Guardar y Continuar".

**Estados de la planta:** `draft` (borrador no visible) → `published` (público)

**Orden de pestañas:** Registro → Taxonomía → Ubicación → Colección → Características → Imágenes → Finalizar

**Funciones clave en `page.tsx`:**
- `prepareCommonData()` — mapea campos del form a columnas DwC de la BD
- `savePlantSection()` — crea planta si no existe (genera ID), luego actualiza la sección
- `saveAndContinue()` — llama `savePlantSection()` y avanza al tab siguiente
- `handleSubmit()` — finaliza: cambia `status: 'draft'` → `'published'`, aplica validaciones estrictas

**Estado del componente:**
- `plantId` — ID de la planta en borrador (null si aún no se guardó ninguna sección)
- `currentTab` — pestaña activa
- `isSavingSection` — booleano para deshabilitar botones durante guardado

⚠️ Las validaciones estrictas solo se aplican en `handleSubmit()`, no en `savePlantSection()`.

---

## Flujo alternativo — Editar imagen existente

```
1. plants.getImages { plant_id: 123 } → lista de imágenes
2. POST /api/plantas/upload con nueva imagen → agrega a plant_images
3. plants.setMainImage { plant_id: 123, image_id: 456 } → actualiza is_main
4. plants.deleteImage { image_id: 789 } → elimina de Cloudinary + BD
```

> ⚠️ Los nombres de campo en los ejemplos son ilustrativos. En el código real usar nombres Darwin Core: `recorded_by` (no `collector_name`), `event_date` (no `collection_date`), `state_province` (no `department`), `catalog_number` (no `herbarium_number`). Ver [[darwin-core-fields]].

---

## Red de conexiones

- Módulo que implementa este flujo: [[plants/compressed|plants · compressed]]
- Impacto de cambios: [[plants-chain]]
- Autenticación requerida: [[auth-flow]] (Paso 2: obtener token)
- Reglas que gobiernan: [[universal-constraints]] (reglas #2 DwC, #3 soft delete, #5 Cloudinary, #9 nombres DwC)
- Referencia de campos DwC: [[darwin-core-fields]]
- Configuración de Cloudinary: [[integrations]]
- Tablas involucradas: [[db-tables-index]] → `plants`, `plant_images`
- Capa de ejecución: [[backend]]
- Identidad del sistema: [[DAIMUZ]]
