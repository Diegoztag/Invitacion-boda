# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Agregado
- Sistema de edición de confirmaciones desde el panel admin
- Funcionalidad de desactivación/activación de invitaciones
- Validación mejorada en importación CSV con manejo de nombres múltiples
- Categorización de invitados (Adulto, Niño, Staff)
- Preservación de datos al cambiar número de pases
- Modal unificado para ver y editar invitaciones
- Documentación estructurada en carpeta `docs/`
- Archivo AGENT.md con directivas para agentes IA

### Cambiado
- Mejorado el manejo de múltiples invitados con comas
- Actualizada la estructura de campos dinámicos para invitados
- Refactorizado el sistema de modales para mejor reutilización
- Reorganizada la documentación del proyecto

### Corregido
- Error al agregar múltiples invitados separados por comas
- Pérdida de datos al modificar número de pases
- Problemas de visualización en móviles
- Validaciones inconsistentes en formularios

### Por Corregir
- **BUG**: Al agregar invitaciones con múltiples nombres separados por comas (ej: "pino, cristian, lupe"), se generan invitaciones con nombres concatenados incorrectamente
  - Comportamiento esperado: Crear campos individuales para cada nombre
  - Comportamiento actual: Los nombres se agrupan incorrectamente en los pases

## [1.2.0] - 2024-01-04

### Agregado
- Sistema de estados dual: Activo/Inactivo + Estado de confirmación
- Badge visual para invitaciones inactivas
- Motivo opcional al desactivar invitaciones
- Historial de cambios en invitaciones
- Validación de capacidad total del evento
- Notificaciones toast mejoradas

### Cambiado
- Rediseñado el modal de visualización de invitaciones
- Mejorada la UI/UX del panel de administración
- Optimizado el rendimiento de las tablas grandes
- Actualizada la estructura modular del frontend admin

### Corregido
- Estadísticas incorrectas al contar invitaciones inactivas
- Problemas de scroll en modales largos
- Alineación de elementos en tablas

## [1.1.0] - 2023-12-15

### Agregado
- Importación masiva desde CSV
- Exportación de invitaciones a CSV
- Sistema de paginación en tabla de invitaciones
- Búsqueda y filtros avanzados
- Live reload para desarrollo
- Soporte para restricciones alimentarias

### Cambiado
- Migrado a arquitectura modular en admin
- Mejorado el sistema de notificaciones
- Actualizado Bootstrap a v5.3
- Optimizadas las consultas a CSV

### Corregido
- Memory leak en event listeners
- Problemas de codificación UTF-8 en CSV
- Validación de emails mejorada

## [1.0.0] - 2023-11-01

### Agregado
- Sistema base de invitaciones digitales
- Panel de administración
- Confirmación de asistencia
- Gestión de mesas
- Estadísticas en tiempo real
- Mesa de regalos digital
- Diseño responsive
- Almacenamiento en CSV local

### Características Iniciales
- Generación de códigos únicos
- Enlaces personalizados por invitación
- Dashboard con métricas
- Formulario de RSVP
- Integración con Google Maps
- Countdown para el evento
- Galería de fotos
- Información del evento

## Guía de Versionado

### Versión Mayor (X.0.0)
- Cambios incompatibles con versiones anteriores
- Rediseños mayores de arquitectura
- Cambios en el formato de datos

### Versión Menor (0.X.0)
- Nueva funcionalidad compatible
- Mejoras significativas
- Deprecación de features

### Versión Parche (0.0.X)
- Corrección de bugs
- Mejoras menores
- Actualizaciones de seguridad

## Enlaces

- [Comparar versiones](https://github.com/tu-usuario/invitacion-boda/compare/)
- [Releases](https://github.com/tu-usuario/invitacion-boda/releases)
- [Issues](https://github.com/tu-usuario/invitacion-boda/issues)

---

Para mantener este archivo actualizado:
1. Agregar cambios en la sección [Unreleased] durante el desarrollo
2. Al hacer release, mover los cambios a una nueva versión con fecha
3. Seguir el formato establecido
4. Incluir links de comparación entre versiones
