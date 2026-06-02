# Mapa de Roles y Permisos
# Sistema Herbario Digital HEAA

> Fuente de verdad única para permisos por rol.
> Antes de implementar cualquier operación de escritura, consultar esta tabla.

---

## Los 4 niveles de acceso

| Rol | Token JWT | Descripción |
|---|---|---|
| `admin` | ✅ Requerido | Control total del sistema |
| `collector` | ✅ Requerido | Registra y edita especímenes propios |
| `user` | ✅ Requerido | Solo lectura autenticada + sugerencias |
| `(público)` | ❌ Sin token | Solo catálogo público |

---

## Permisos por módulo

### 🔐 auth
| Operación | admin | collector | user | público |
|---|:---:|:---:|:---:|:---:|
| login | ✅ | ✅ | ✅ | ✅ |
| register | ✅ | ✅ | ✅ | ✅ |
| me / refresh | ✅ | ✅ | ✅ | ❌ |
| changePassword | ✅ | ✅ | ✅ (propia) | ❌ |
| forgotPassword / resetPassword | ✅ | ✅ | ✅ | ✅ |

### 🌿 plants
| Operación | admin | collector | user | público |
|---|:---:|:---:|:---:|:---:|
| getAll (publicadas) | ✅ | ✅ | ✅ | ✅ |
| getById | ✅ | ✅ | ✅ | ✅ (si published) |
| search / advancedSearch | ✅ | ✅ | ✅ | ✅ |
| getForMap | ✅ | ✅ | ✅ | ✅ |
| **create** | ✅ | ✅ | ❌ | ❌ |
| **update** | ✅ | ✅ (propias) | ❌ | ❌ |
| **delete** (soft) | ✅ | ❌ | ❌ | ❌ |
| uploadImage | ✅ | ✅ | ❌ | ❌ |
| setMainImage / deleteImage | ✅ | ✅ (propias) | ❌ | ❌ |

### 👤 users
| Operación | admin | collector | user | público |
|---|:---:|:---:|:---:|:---:|
| getAll | ✅ | ❌ | ❌ | ❌ |
| getById | ✅ | ❌ | ✅ (propio) | ❌ |
| **create** | ✅ | ❌ | ❌ | ❌ |
| **update** | ✅ | ✅ (propio) | ✅ (propio) | ❌ |
| **delete** (soft) | ✅ | ❌ | ❌ | ❌ |
| **changeRole** | ✅ | ❌ | ❌ | ❌ |
| activate / deactivate | ✅ | ❌ | ❌ | ❌ |
| uploadAvatar | ✅ | ✅ (propio) | ✅ (propio) | ❌ |
| getActivity | ✅ | ✅ (propia) | ✅ (propia) | ❌ |

### 📊 dashboard
| Operación | admin | collector | user | público |
|---|:---:|:---:|:---:|:---:|
| getStats | ✅ | ✅ (limitado) | ❌ | ❌ |
| getPlantsByFamily | ✅ | ✅ | ❌ | ❌ |
| getPlantsByLocation | ✅ | ✅ | ❌ | ❌ |
| getRecentActivity | ✅ | ❌ | ❌ | ❌ |
| getTopCollectors | ✅ | ✅ | ❌ | ❌ |
| getSystemHealth | ✅ | ❌ | ❌ | ❌ |

### 💬 suggestions
| Operación | admin | collector | user | público |
|---|:---:|:---:|:---:|:---:|
| getAll | ✅ | ✅ (propias) | ✅ (propias) | ❌ |
| create | ✅ | ✅ | ✅ | ❌ |
| **approve / reject** | ✅ | ❌ | ❌ | ❌ |
| countUnread | ✅ | ❌ | ❌ | ❌ |

### 🌐 public (sin auth)
| Operación | admin | collector | user | público |
|---|:---:|:---:|:---:|:---:|
| getStats | ✅ | ✅ | ✅ | ✅ |
| getFeaturedPlants | ✅ | ✅ | ✅ | ✅ |
| getFilterOptions | ✅ | ✅ | ✅ | ✅ |
| autocomplete | ✅ | ✅ | ✅ | ✅ |

### ⚙️ settings
| Operación | admin | collector | user | público |
|---|:---:|:---:|:---:|:---:|
| getPublic | ✅ | ✅ | ✅ | ✅ |
| getAll | ✅ | ❌ | ❌ | ❌ |
| **update** | ✅ | ❌ | ❌ | ❌ |
| backup / restore | ✅ | ❌ | ❌ | ❌ |
| testCloudinary | ✅ | ❌ | ❌ | ❌ |

### 🔬 taxonomy / locations
| Operación | admin | collector | user | público |
|---|:---:|:---:|:---:|:---:|
| getAll / getById | ✅ | ✅ | ✅ | ✅ |
| **create / update / delete** | ✅ | ❌ | ❌ | ❌ |

---

## Reglas de implementación

```javascript
// ✅ Verificar rol ANTES de cualquier operación de escritura
const { role } = req.user;
if (role !== 'admin') throw new Error('Acceso denegado');

// ✅ Para operaciones del recurso propio
if (role !== 'admin' && req.user.id !== targetUserId) {
  throw new Error('Solo puedes modificar tu propio perfil');
}

// ✅ Collectors pueden crear pero solo admins pueden eliminar
if (role !== 'admin' && role !== 'collector') {
  throw new Error('Se requiere rol collector o admin');
}
```

---

## Red de conexiones

- Flujo de auth: [[auth-flow]]
- Módulo de permisos: [[auth/compressed|auth · compressed]]
- Restricciones universales: [[universal-constraints]] (#4 roles)
- Sinapsis de auth: [[auth-chain]]
- Índice: [[modules-index]] · [[DAIMUZ]]
