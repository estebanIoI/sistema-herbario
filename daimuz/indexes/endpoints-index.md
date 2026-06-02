# Índice de Endpoints

## Endpoint único (API Gateway)

```
POST /api/service
Body: { "service": "modulo.accion", "data": {...}, "token": "jwt" }
```

## Endpoints directos

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/plantas/upload` | Subir imagen de planta (multipart/form-data) | JWT |
| GET | `/api/media/plantas/:file` | Servir imagen almacenada localmente | No |
| GET | `/health` | Health check del sistema | No |
| GET | `/info` | Información del sistema | No |

---

## Servicios via POST /api/service

### auth.*
| Service | Descripción | Auth requerida |
|---------|-------------|----------------|
| `auth.login` | Autenticar usuario, devuelve JWT | No |
| `auth.register` | Registrar nuevo usuario | No |
| `auth.logout` | Cerrar sesión | Sí |
| `auth.me` | Obtener usuario actual | Sí |
| `auth.refresh` | Refrescar token JWT | Sí |
| `auth.changePassword` | Cambiar contraseña | Sí |
| `auth.forgotPassword` | Enviar email recuperación | No |
| `auth.resetPassword` | Resetear con token de email | No |
| `auth.verifyEmail` | Verificar email con token | No |

### plants.*
| Service | Descripción | Auth requerida |
|---------|-------------|----------------|
| `plants.getAll` | Listar plantas con paginación y filtros | No |
| `plants.getById` | Obtener planta por ID | No |
| `plants.create` | Crear nueva planta | Sí (admin/collector) |
| `plants.update` | Actualizar planta | Sí (admin/collector) |
| `plants.delete` | Soft delete de planta | Sí (admin) |
| `plants.bulkDelete` | Eliminar múltiples plantas | Sí (admin) |
| `plants.search` | Búsqueda por texto | No |
| `plants.advancedSearch` | Búsqueda con filtros múltiples | No |
| `plants.searchByFamily` | Filtrar por familia | No |
| `plants.searchByGenus` | Filtrar por género | No |
| `plants.searchByLocation` | Filtrar por ubicación | No |
| `plants.searchByCollector` | Filtrar por colector | No |
| `plants.uploadImage` | Subir imagen a Cloudinary | Sí |
| `plants.deleteImage` | Eliminar imagen | Sí (admin) |
| `plants.getImages` | Obtener imágenes de planta | No |
| `plants.setMainImage` | Definir imagen principal | Sí |
| `plants.export` | Exportar datos (CSV/JSON) | Sí (admin) |
| `plants.import` | Importar datos masivos | Sí (admin) |
| `plants.getStats` | Estadísticas de plantas | No |
| `plants.getRecent` | Plantas recientes | No |
| `plants.getMostViewed` | Plantas más vistas | No |
| `plants.getForMap` | Plantas con coordenadas para mapa | No |

### users.*
| Service | Descripción | Auth requerida |
|---------|-------------|----------------|
| `users.getAll` | Listar usuarios | Sí (admin) |
| `users.getById` | Obtener usuario | Sí (admin) |
| `users.create` | Crear usuario | Sí (admin) |
| `users.update` | Actualizar usuario | Sí |
| `users.delete` | Eliminar usuario | Sí (admin) |
| `users.updateProfile` | Actualizar perfil propio | Sí |
| `users.changeRole` | Cambiar rol | Sí (admin) |
| `users.uploadAvatar` | Subir foto de perfil | Sí |
| `users.getActivity` | Historial de actividad | Sí |
| `users.activate` | Activar cuenta | Sí (admin) |
| `users.deactivate` | Desactivar cuenta | Sí (admin) |

### dashboard.*
| Service | Descripción |
|---------|-------------|
| `dashboard.getStats` | Conteos totales: plantas, usuarios, sugerencias |
| `dashboard.getPlantsByFamily` | Distribución por familia (para gráfico) |
| `dashboard.getPlantsByLocation` | Distribución geográfica |
| `dashboard.getRecentActivity` | Últimas acciones del sistema |
| `dashboard.getTopCollectors` | Ranking de colectores |
| `dashboard.getMonthlyStats` | Estadísticas mensuales |
| `dashboard.getVisitorsChart` | Visitas por período |
| `dashboard.getSystemHealth` | Estado de servicios |
| `dashboard.getStorageInfo` | Espacio de almacenamiento |

### suggestions.*
| Service | Descripción | Auth requerida |
|---------|-------------|----------------|
| `suggestions.create` | Crear sugerencia | Sí |
| `suggestions.getAll` | Listar sugerencias | Sí (admin) |
| `suggestions.getById` | Ver sugerencia | Sí |
| `suggestions.approve` | Aprobar sugerencia | Sí (admin) |
| `suggestions.reject` | Rechazar sugerencia | Sí (admin) |
| `suggestions.getByStatus` | Filtrar por estado | Sí |
| `suggestions.addComment` | Agregar comentario | Sí |
| `suggestions.countUnread` | Contar sin leer | Sí (admin) |

### taxonomy.*
| Service | Descripción |
|---------|-------------|
| `taxonomy.getFamilies` | Listar todas las familias |
| `taxonomy.getGenera` | Listar géneros |
| `taxonomy.getGeneraByFamily` | Géneros de una familia |
| `taxonomy.getSpecies` | Listar especies |
| `taxonomy.getSpeciesByGenus` | Especies de un género |
| `taxonomy.getTaxonomyTree` | Árbol completo jerárquico |
| `taxonomy.createFamily` | Crear familia (admin) |
| `taxonomy.createGenus` | Crear género (admin) |
| `taxonomy.validateTaxonomy` | Validar nombre científico |

### locations.*
| Service | Descripción |
|---------|-------------|
| `locations.getDepartments` | Listar departamentos |
| `locations.getMunicipalities` | Listar municipios |
| `locations.getMunicipalitiesByDepartment` | Municipios de un dpto |
| `locations.getCollectionSites` | Sitios de colección |
| `locations.createLocation` | Crear sitio (admin) |
| `locations.getLocationStats` | Estadísticas por ubicación |

### settings.*
| Service | Descripción | Auth requerida |
|---------|-------------|----------------|
| `settings.getPublic` | Settings públicos (sin auth) | No |
| `settings.getAll` | Todos los settings | Sí (admin) |
| `settings.get` | Un setting por clave | Sí (admin) |
| `settings.update` | Actualizar setting | Sí (admin) |
| `settings.updateMultiple` | Actualizar varios | Sí (admin) |
| `settings.testCloudinary` | Probar conexión Cloudinary | Sí (admin) |


---

## Red de conexiones

- Rutas: [[api-routes]]
- Módulos: [[modules-index]]
- Backend: [[backend]]
- Índice: [[DAIMUZ]]
