# Protocolo de actualización de DAIMUZ

## Cuándo actualizar cada archivo

| Evento | Archivos a actualizar |
|--------|----------------------|
| Nuevo módulo creado | `indexes/modules-index.md` · `modules/[nuevo]/compressed.md` · `DAIMUZ.md` |
| Nuevo endpoint agregado | `indexes/endpoints-index.md` · `modules/[modulo]/compressed.md` |
| Nueva tabla o columna | `indexes/db-tables-index.md` |
| Regla de negocio nueva | `governance/universal-constraints.md` · `modules/[modulo]/compressed.md` |
| Feature completada | `memory/completed-features.md` · `memory/current-state.md` |
| Bug crítico resuelto | `memory/bugs-history.md` · `memory/important-fixes.md` |
| Sesión de trabajo importante | `memory/current-state.md` · `memory/changelog.md` |
| Decisión arquitectural tomada | `decisions/[decision].md` · `governance/why-decisions.md` |
| Sprint nuevo | `context/current-sprint.md` |

## Regla de oro

Al finalizar una sesión donde se hizo algo significativo, actualizar mínimo:
1. `memory/current-state.md` — ¿qué funciona ahora que no funcionaba antes?
2. `memory/changelog.md` — entrada de fecha con lo que cambió

## Cuándo NO actualizar

- No documentes lo que está en el código (rutas, nombres de funciones exactos, código)
- No copies código en daimuz — referencia el archivo con su path
- No documentes detalles que `git log` ya registra


---

## Red de conexiones

- Reglas: [[universal-constraints]]
- Decisiones: [[why-decisions]]
- Estado: [[current-state]]
- Índice: [[DAIMUZ]]
