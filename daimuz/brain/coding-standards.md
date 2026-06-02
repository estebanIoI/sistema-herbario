# Estándares de Código

## Backend (JavaScript / Node.js)

- **Estilo**: ESModules o CommonJS (verificar qué usa el proyecto con `package.json`)
- **Naming**: camelCase para variables y funciones, PascalCase para clases
- **Async**: siempre `async/await`, nunca callbacks ni `.then()` encadenados
- **Errores**: usar `try/catch` y pasar al `next(error)` de Express para el errorHandler
- **Queries**: SQL nativo con placeholders `?` (mysql2 previene inyección automáticamente)
- **Logs**: usar `logger.info()`, `logger.warn()`, `logger.error()` de Winston, nunca `console.log`
- **Variables de entorno**: acceder via `process.env.VARIABLE`, nunca hardcodear valores

## Frontend (TypeScript / Next.js)

- **Componentes**: funcionales con hooks, nunca clases
- **Props**: tipado explícito con TypeScript interfaces
- **Estilos**: Tailwind CSS, sin CSS-in-JS ni módulos CSS salvo casos justificados
- **Formularios**: React Hook Form, nunca estado local manual para formularios complejos
- **Llamadas API**: centralizar en funciones de `lib/api.ts`, no fetch directamente en componentes
- **Error handling en fetch**: verificar `response.ok` antes de `.json()`
- **Imágenes**: usar `next/image`, nunca `<img>` directo (excepto Leaflet que requiere `<img>`)

## Reglas generales

- No comentarios que expliquen QUÉ hace el código (los nombres deben ser suficientes)
- Sí comentarios para el PORQUÉ cuando hay una razón no obvia
- No features sin implementar (`// TODO: implementar esto`)
- Soft delete siempre en tablas principales
- Validar entradas en los controladores del backend antes de queries SQL


---

## Red de conexiones

- Nomenclatura: [[naming-conventions]]
- Reglas absolutas: [[universal-constraints]]
- Patrón módulo: [[module-pattern]]
- Índice: [[DAIMUZ]]
