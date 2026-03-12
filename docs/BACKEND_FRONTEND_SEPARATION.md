# Separación de Responsabilidades Backend/Frontend

## 📋 Resumen

Este documento describe la refactorización realizada para centralizar filtros y cálculos en el backend, siguiendo las mejores prácticas de arquitectura de software.

## 🎯 Objetivos Alcanzados

### ✅ Backend - Lógica de Negocio Centralizada

1. **Filtros Automáticos de Invitaciones Inactivas**
    - Método `findAll()` excluye invitaciones inactivas por defecto
    - Parámetro opcional `includeInactive` para casos administrativos
    - Aplicado consistentemente en todos los métodos de búsqueda

2. **Cálculos de Estadísticas Optimizados**
    - Estadísticas calculadas solo con invitaciones activas
    - Desglose por tipos de pases (adultos, niños, staff)
    - Tasas de confirmación y asistencia calculadas en backend

3. **Endpoint `/api/stats` Mejorado**
    - Estructura optimizada sin duplicaciones
    - Datos pre-calculados para el frontend
    - Separación clara entre datos activos, confirmados y totales

### ✅ Frontend - Presentación Simplificada

1. **Eliminación de Filtros en Frontend**
    - Removidos cálculos de distribución de pases
    - Simplificado el método `updatePassDistribution()`
    - Delegación de cálculos de período al backend

2. **Data Mapper Centralizado**
    - Conversión de datos del backend a estructuras del frontend
    - Mapeo consistente para RenderService y Utils
    - Logging mejorado para debugging

## 🏗️ Arquitectura Implementada

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │    │   Datos (CSV)   │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Dashboard   │ │    │ │ Repository  │ │    │ │ invitations │ │
│ │ Controller  │ │◄───┤ │             │ │◄───┤ │    .csv     │ │
│ │             │ │    │ │ - findAll() │ │    │ │             │ │
│ └─────────────┘ │    │ │ - getStats()│ │    │ └─────────────┘ │
│                 │    │ └─────────────┘ │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │                 │
│ │ Data Mapper │ │    │ │ Stats API   │ │    │                 │
│ │             │ │◄───┤ │ /api/stats  │ │    │                 │
│ │             │ │    │ │             │ │    │                 │
│ └─────────────┘ │    │ └─────────────┘ │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Cambios Técnicos Implementados

### Backend

#### 1. CsvInvitationRepository.js

```javascript
// ANTES: Sin filtro automático
async findAll(filters = {}) {
    let invitations = await this.readAllInvitations();
    // Solo filtros manuales
}

// DESPUÉS: Filtro automático de inactivas
async findAll(filters = {}, includeInactive = false) {
    let invitations = await this.readAllInvitations();

    // FILTRO PRINCIPAL: Excluir invitaciones inactivas por defecto
    if (!includeInactive) {
        invitations = invitations.filter(inv => inv.status !== 'inactive');
    }
    // Filtros adicionales...
}
```

#### 2. Routes/index.js - Endpoint /api/stats

```javascript
passDistribution: {
    // Datos principales para el frontend
    activeAdultPasses: invitationStats.activeAdultPasses || 0,
    activeChildPasses: invitationStats.activeChildPasses || 0,
    activeStaffPasses: invitationStats.activeStaffPasses || 0,
    totalActivePasses: (activeAdult + activeChild + activeStaff),

    // Datos confirmados
    confirmedAdultPasses: invitationStats.confirmedAdultPasses || 0,
    // ... más campos
}
```

### Frontend

#### 1. Dashboard Controller - Simplificación

```javascript
// ANTES: Cálculos complejos en frontend
updatePassDistribution(stats) {
    // Múltiples condiciones y fallbacks
    // Cálculos de porcentajes
    // Validaciones complejas
}

// DESPUÉS: Uso directo de datos del backend
updatePassDistribution(stats) {
    const passDistribution = stats.passDistribution || {};

    // Usar datos ya procesados del backend - SIN cálculos
    const adultPasses = passDistribution.activeAdultPasses || 0;
    const childPasses = passDistribution.activeChildPasses || 0;
    const staffPasses = passDistribution.activeStaffPasses || 0;

    // Solo cálculos de presentación (porcentajes)
}
```

## 📊 Beneficios Obtenidos

### 1. **Performance**

- ✅ Filtros aplicados a nivel de datos (más eficiente)
- ✅ Menos transferencia de datos innecesarios
- ✅ Frontend más ligero y rápido

### 2. **Consistencia**

- ✅ Una sola fuente de verdad para filtros
- ✅ Lógica de negocio centralizada
- ✅ Comportamiento predecible en toda la aplicación

### 3. **Mantenibilidad**

- ✅ Cambios de reglas solo en el backend
- ✅ Código frontend más simple y legible
- ✅ Separación clara de responsabilidades

### 4. **Escalabilidad**

- ✅ Fácil agregar nuevos filtros en el backend
- ✅ Frontend independiente de lógica de negocio
- ✅ Preparado para migración a base de datos

## 🔍 Casos de Uso

### 1. **Dashboard Principal**

- Backend filtra automáticamente invitaciones inactivas
- Frontend recibe solo datos relevantes
- Estadísticas calculadas y listas para mostrar

### 2. **Administración**

- Opción `includeInactive=true` para ver todas las invitaciones
- Reportes completos cuando sea necesario
- Flexibilidad para casos especiales

### 3. **APIs Públicas**

- Solo datos activos por defecto
- Protección de datos sensibles
- Consistencia en todas las respuestas

## 🚀 Próximos Pasos

1. **Endpoint de Confirmaciones por Período**
    - Implementar `/api/confirmations/period/:period`
    - Eliminar cálculo restante en frontend

2. **Optimización de Consultas**
    - Implementar índices cuando se migre a BD
    - Cache de estadísticas frecuentes

3. **Validaciones Adicionales**
    - Validar filtros en el backend
    - Sanitización de parámetros de entrada

## 📝 Notas de Implementación

- Todos los métodos de búsqueda ahora excluyen inactivas por defecto
- Parámetro `includeInactive` disponible para casos administrativos
- Frontend simplificado mantiene funcionalidad completa
- Logging mejorado para debugging y monitoreo
- Compatibilidad mantenida con código existente

---

**Fecha de Implementación:** Enero 2026  
**Versión:** 1.0  
**Estado:** ✅ Completado
