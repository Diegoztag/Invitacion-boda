# Technical Roadmap - Sistema de Invitaciones de Boda

## Resumen Ejecutivo

Este documento unifica el análisis técnico del sistema actual con el plan de refactorización, organizando las tareas de menor a mayor impacto. Incluye tanto el trabajo completado como las mejoras pendientes.

## Estado Actual del Sistema

### Arquitectura
- **Frontend**: HTML/CSS/JS vanilla para invitados y panel admin
- **Backend**: Node.js/Express con almacenamiento en CSV
- **Sin framework**: Decisión consciente para simplicidad
- **Live reload**: Implementado para desarrollo

### Problemas Técnicos Principales
1. **Violaciones DRY**: Código duplicado en múltiples lugares
2. **Funciones gigantes**: Algunas superan 200 líneas
3. **Sin modularización**: Archivos monolíticos (app.js 800+ líneas, admin.js 1600+ líneas)
4. **Acoplamiento alto**: Lógica de negocio mezclada con UI
5. **Sin tests**: Código difícil de testear y mantener

## 🟢 Trabajo Completado

### Funcionalidades Implementadas ✅
1. **Sistema de campos individuales por invitado**
   - Cada invitado con campo propio y tipo (Adulto/Niño/Staff)
   - Eliminación del campo redundante "Tipo de Invitación"
   - Preservación de datos al cambiar número de pases

2. **Sistema de Desactivación de Invitaciones**
   - Estado dual: activo/inactivo + confirmación
   - Modal de confirmación con advertencias
   - Badge visual para estados
   - Exclusión automática de estadísticas
   - Funciones `deactivateInvitation()` y `activateInvitation()` implementadas

3. **Sistema de Edición de Invitaciones** ✅ [IMPLEMENTADO]
   - Modal de edición integrado en el modal de detalles
   - Preservación de datos de invitados al cambiar pases
   - Edición de estado de confirmación
   - Validación de capacidad total del evento
   - Actualización en tiempo real sin recargar página

4. **Sistema de Componentes Reutilizables** ✅ [PARCIALMENTE IMPLEMENTADO]
   - Clase `Modal` reutilizable en `admin-modal.js`
   - `ModalFactory` para crear modales específicos
   - Sistema de notificaciones toast
   - Componentes modulares en carpeta `admin/js/components/`

5. **Utilidades y Helpers** ✅ [IMPLEMENTADO]
   - `admin-utils.js` con funciones reutilizables:
     - `calculateCancelledPasses()`
     - `formatGuestNames()`
     - `getStatusBadge()`
     - `updateStatsUI()`
     - `debounce()`
     - Funciones de formateo y validación

6. **Constantes Centralizadas** ✅ [IMPLEMENTADO]
   - `admin-constants.js` con todas las constantes del sistema
   - Configuración UI, valores por defecto, endpoints API
   - Sin valores hardcodeados en el código principal

7. **Sistema de Notificaciones** ✅ [IMPLEMENTADO]
   - `notification-service.js` para manejo centralizado
   - Notificaciones en tiempo real
   - Badge de contador en header
   - Sonido de notificación opcional

8. **Correcciones de UI/UX**
   - Centrado de botones corregido
   - Espaciado en modales mejorado
   - Alineación de elementos en tablas
   - Responsive design mejorado

9. **Documentación Reorganizada**
   - Nueva estructura en carpeta `docs/`
   - Separación clara de conceptos
   - Documentación técnica completa

### Arquitectura Modular Implementada ✅
```
admin/
├── js/
│   ├── admin-api.js          ✅ API centralizada
│   ├── admin-constants.js    ✅ Constantes globales
│   ├── admin-utils.js        ✅ Utilidades reutilizables
│   ├── components/
│   │   └── admin-modal.js    ✅ Sistema de modales
│   └── services/
│       └── notification-service.js ✅ Servicio de notificaciones
```

## 📋 Roadmap de Refactorización

### 🟢 IMPACTO BAJO - Cambios Seguros (2-3 días)

#### Fase 1.1: Limpieza de Código [Por hacer]
**Duración**: 0.5 días | **Prioridad**: Alta
- Eliminar código comentado y console.logs
- Remover funciones no utilizadas
- Formatear código consistentemente

#### Fase 1.2: Documentación JSDoc [Por hacer]
**Duración**: 1 día | **Prioridad**: Media
```javascript
/**
 * Crea una nueva invitación
 * @param {Object} data - Datos de la invitación
 * @returns {Promise<Object>} Invitación creada
 */
async function createInvitation(data) { }
```

#### Fase 1.3: Validación Robusta Backend [Por hacer]
**Duración**: 0.5 días | **Prioridad**: Alta
- Implementar express-validator
- Centralizar reglas de validación
- Mejorar mensajes de error

### 🟡 IMPACTO MEDIO - Cambios Moderados (3-4 días)

#### Fase 2.1: Extraer Constantes [Por hacer]
**Duración**: 0.5 días | **Prioridad**: Alta
```javascript
// config/constants.js
export const APP_CONFIG = {
  API_ENDPOINTS: { /* ... */ },
  UI: { /* ... */ },
  VALIDATION: { /* ... */ }
};
```

#### Fase 2.2: Crear Utilidades [Por hacer]
**Duración**: 1 día | **Prioridad**: Alta
- `utils/formatters.js` - Formateo de fechas, números
- `utils/validators.js` - Validaciones reutilizables
- `utils/dom.js` - Helpers para manipulación DOM

#### Fase 2.3: Refactorizar CSS con BEM [Por hacer]
**Duración**: 1.5 días | **Prioridad**: Media
- Separar en archivos modulares
- Implementar metodología BEM
- Eliminar código CSS duplicado

### 🟠 IMPACTO ALTO - Cambios Significativos (7-8 días)

#### Fase 3.1: Sistema de Componentes [Por hacer]
**Duración**: 2 días | **Prioridad**: Alta
```javascript
// components/DataTable.js
export class DataTable {
  constructor(config) { /* ... */ }
  render() { /* ... */ }
  update() { /* ... */ }
}
```

#### Fase 3.2: Modularizar Frontend [Por hacer]
**Duración**: 2-3 días | **Prioridad**: Alta
- Separar app.js en módulos
- Crear estructura de carpetas clara
- Implementar patrón módulo

#### Fase 3.3: Arquitectura Backend por Capas [Por hacer]
**Duración**: 2 días | **Prioridad**: Media
```
backend/
├── routes/
├── controllers/
├── services/
└── middleware/
```

### 🔴 IMPACTO MUY ALTO - Cambios Estructurales (4-5 días)

#### Fase 4.1: Patrón MVC Completo [Por hacer]
**Duración**: 3-4 días | **Prioridad**: Baja
- Implementar controladores
- Crear modelos
- Separar vistas

#### Fase 4.2: Tests Unitarios [Por hacer]
**Duración**: 2-3 días | **Prioridad**: Baja
- Jest para backend
- Tests de integración API
- Coverage mínimo 80%

## 🚀 Funcionalidades Nuevas Pendientes

### 1. Edición de Confirmaciones [CRÍTICO]
**Problema**: No se pueden editar confirmaciones una vez enviadas

**Solución propuesta**:
- Modo edición en modal existente
- Preservar datos al cambiar pases
- Validación de capacidad total
- Historial de cambios

**Diseño UX**:
```
┌─────────────────────────────────────────┐
│ Detalles de Invitación                ✕ │
├─────────────────────────────────────────┤
│              ✏️ Editando                │
│                                         │
│ 🎟️ Pases: [3] ▼   🪑 Mesa: [5] ▼      │
│                                         │
│ 👥 Invitados:                           │
│ ┌─────────────────────┬──────────────┐  │
│ │ Juan García         │ Adulto    ▼  │  │
│ │ María López         │ Adulto    ▼  │  │
│ │ Pedrito García      │ Niño      ▼  │  │
│ └─────────────────────┴──────────────┘  │
└─────────────────────────────────────────┘
```

### 2. Cancelación Soft de Invitaciones
**Problema**: No se pueden cancelar invitaciones

**Solución**:
- Estado "cancelado" en lugar de eliminar
- Mantener historial completo
- Posibilidad de reactivar
- Modal de confirmación con advertencias

### 3. Optimizaciones de Rendimiento
- Service Worker para offline
- Lazy loading de imágenes
- Virtual scrolling para tablas grandes
- Caché de consultas frecuentes

### 4. Mejoras de Seguridad
- Autenticación real para admin (actualmente usa HTTP Basic)
- Rate limiting
- CSRF tokens
- Sanitización robusta de inputs

### 5. Funcionalidades Adicionales
- Dashboard con gráficos
- Notificaciones push
- Códigos QR para invitaciones
- Envío masivo WhatsApp
- Exportación a Excel

## 📊 Métricas de Éxito

### Por Fase Completada
- **Impacto Bajo**: -20% código duplicado, +documentación
- **Impacto Medio**: -30% valores hardcodeados, +reutilización
- **Impacto Alto**: +80% modularización, -50% acoplamiento
- **Impacto Muy Alto**: +90% test coverage, arquitectura clara

## 🎯 Priorización Recomendada

### Sprint 1 (1 semana)
1. Edición de confirmaciones (funcionalidad crítica)
2. Limpieza de código
3. Extraer constantes

### Sprint 2 (1 semana)
1. Crear utilidades
2. Validaciones backend
3. Comenzar modularización

### Sprint 3 (2 semanas)
1. Sistema de componentes
2. Refactorización CSS
3. Arquitectura backend

### Backlog
- Patrón MVC completo
- Tests unitarios
- Optimizaciones avanzadas

## 📈 Estimación Total

- **Trabajo completado**: ~5 días
- **Trabajo pendiente crítico**: 5-7 días
- **Trabajo pendiente deseable**: 10-12 días
- **Total del proyecto**: 20-24 días

## ⚠️ Riesgos y Mitigaciones

1. **Riesgo**: Romper funcionalidad existente
   - **Mitigación**: Cambios incrementales, testing manual exhaustivo

2. **Riesgo**: Sobre-ingeniería
   - **Mitigación**: Enfoque pragmático, YAGNI principle

3. **Riesgo**: Scope creep
   - **Mitigación**: Priorización estricta, MVPs para features nuevas

## 📝 Notas de Implementación

- Mantener siempre una versión funcional
- Commits frecuentes y descriptivos
- Code review antes de merge
- Documentar decisiones arquitectónicas
- Medir impacto de cada cambio

---

**Última actualización**: Enero 2024
**Estado**: En progreso
**Siguiente revisión**: Después de Sprint 1
