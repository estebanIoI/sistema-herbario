# Sistema de Guardado por Secciones - Nueva Planta

## Descripción
Se implementó un sistema de guardado progresivo que permite guardar la información de una nueva planta por secciones, evitando la pérdida de datos durante el proceso de creación.

## Funcionalidades Implementadas

### 1. **Guardado por Secciones**
Cada sección del formulario ahora tiene un botón "Guardar Sección" que:
- Guarda los datos actuales como borrador (`status: 'draft'`)
- Genera un ID de planta si es la primera vez
- Mantiene el progreso sin validaciones estrictas
- Muestra confirmación visual del guardado

### 2. **Guardar y Continuar**
Cada sección (excepto la última) tiene un botón "Guardar y Continuar" que:
- Guarda la sección actual
- Automáticamente cambia a la siguiente pestaña
- Facilita el flujo de trabajo secuencial

### 3. **Estado Persistente**
- **plantId**: Almacena el ID de la planta guardada parcialmente
- **currentTab**: Controla la pestaña activa actual
- **isSavingSection**: Indica cuando se está guardando una sección

### 4. **Indicadores Visuales**
- Muestra "Planta guardada como borrador (ID: X)" cuando hay progreso guardado
- Botones de carga con spinners durante el guardado
- Botón "Ir a Editar" disponible después del primer guardado

### 5. **Finalización del Proceso**
- **Botón principal actualizado**: Cambia entre "Crear y Publicar" y "Finalizar y Publicar"
- **Cambio de estado**: Al finalizar, cambia `status` de 'draft' a 'published'
- **Validaciones finales**: Solo se aplican validaciones estrictas al publicar

## Secciones del Formulario

1. **Registro** → Taxonomía
2. **Taxonomía** → Ubicación  
3. **Ubicación** → Colección
4. **Colección** → Características
5. **Características** → Imágenes
6. **Imágenes** → Finalizar

## Flujo de Trabajo Recomendado

1. **Llenar Registro básico** → Guardar Sección
2. **Completar Taxonomía** → Guardar y Continuar
3. **Agregar Ubicación** → Guardar y Continuar
4. **Detalles de Colección** → Guardar y Continuar
5. **Características de la planta** → Guardar y Continuar
6. **Subir imágenes** → Guardar Sección
7. **Finalizar y Publicar** → Completa el proceso

## Beneficios

- ✅ **Sin pérdida de datos**: Cada sección se guarda independientemente
- ✅ **Flexibilidad**: Permite trabajar en sesiones múltiples
- ✅ **Progreso visible**: Indica claramente el estado del guardado
- ✅ **Recuperación**: Puede continuar desde donde se dejó
- ✅ **Validaciones progresivas**: Solo aplica validaciones estrictas al finalizar

## Implementación Técnica

### Funciones Clave
- `prepareCommonData()`: Mapea campos del formulario a la base de datos
- `savePlantSection()`: Guarda/actualiza una sección específica
- `saveAndContinue()`: Guarda y avanza a la siguiente sección
- `handleSubmit()`: Finaliza y publica la planta

### Estados de la Planta
- **draft**: Guardado parcial, no visible para visitantes
- **published**: Completado y visible públicamente

### Mapeo de Campos
Los campos del formulario se mapean correctamente a la estructura de la base de datos, incluyendo conversión de tipos y manejo de valores nulos.
