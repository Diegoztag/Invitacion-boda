# Arquitectura del Sistema

## Visión General

El sistema de invitaciones de boda es una aplicación web full-stack que sigue una arquitectura cliente-servidor tradicional con almacenamiento basado en archivos CSV.

```
┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Frontend      │
│  (Invitación)   │     │    (Admin)      │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────▼──────┐
              │   Backend   │
              │  (Express)  │
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │ CSV Storage │
              │   (Local)   │
              └─────────────┘
```

## Componentes Principales

### 1. Frontend - Invitación (index.html + app.js)

**Responsabilidades:**
- Mostrar información de la boda
- Validar código de invitación
- Formulario de confirmación de asistencia
- Mostrar mesa de regalos
- Responsive design

**Tecnologías:**
- HTML5 + CSS3 (vanilla)
- JavaScript ES6+ (vanilla)
- Bootstrap 5 (framework CSS)
- Font Awesome (iconos)

### 2. Frontend - Panel Admin (admin.html + admin.js)

**Responsabilidades:**
- Dashboard con estadísticas
- CRUD de invitaciones
- Importación/exportación CSV
- Visualización de confirmaciones
- Gestión de estados

**Estructura Modular:**
```
admin/
├── js/
│   ├── components/
│   │   └── admin-modal.js      # Sistema de modales reutilizable ✅
│   ├── services/
│   │   └── notification-service.js # Servicio de notificaciones ✅
│   ├── admin-api.js            # Cliente API centralizado ✅
│   ├── admin-constants.js      # Constantes globales ✅
│   ├── admin-utils.js          # Utilidades compartidas ✅
│   ├── store.js                # Estado global
│   ├── main.js                 # Punto de entrada
│   └── performance.js          # Monitoreo de rendimiento
└── css/
    └── [múltiples archivos CSS modulares]
```

**Módulos Implementados:**
- ✅ **admin-modal.js**: Sistema completo de modales con `Modal` class y `ModalFactory`
- ✅ **notification-service.js**: Servicio centralizado para notificaciones en tiempo real
- ✅ **admin-api.js**: API client con manejo de errores y helpers
- ✅ **admin-constants.js**: Todas las constantes del sistema centralizadas
- ✅ **admin-utils.js**: +30 funciones utilitarias reutilizables

### 3. Backend (Node.js + Express)

**Responsabilidades:**
- API RESTful
- Autenticación básica
- Manejo de archivos CSV
- Validación de datos
- Generación de códigos únicos

**Estructura:**
```
backend/
├── server.js              # Servidor principal
├── services/
│   ├── csvStorage.js      # Capa de persistencia
│   └── invitationService.js # Lógica de negocio
└── package.json
```

### 4. Almacenamiento (CSV)

**Archivos:**
- `data/invitations.csv` - Registro de invitaciones
- `data/confirmations.csv` - Registro de confirmaciones

**Ventajas:**
- Sin dependencias de base de datos
- Fácil backup y portabilidad
- Editable manualmente si es necesario
- Importación/exportación directa

## Flujo de Datos

### 1. Creación de Invitación
```
Admin → POST /api/invitations → invitationService → csvStorage → invitations.csv
```

### 2. Confirmación de Asistencia
```
Invitado → GET /api/invitation/:code → Validación → Formulario
         → POST /api/confirm → csvStorage → confirmations.csv
```

### 3. Visualización de Estadísticas
```
Admin → GET /api/stats → csvStorage → Agregación → Response JSON
```

## Patrones de Diseño Implementados

### 1. Módulo (Module Pattern)
```javascript
// admin/js/services/notification-service.js
const NotificationService = (function() {
    let container;
    
    function init() { /* ... */ }
    function show(message, type) { /* ... */ }
    
    return { init, show };
})();
```

### 2. Singleton
```javascript
// admin/js/store.js
class Store {
    constructor() {
        if (Store.instance) {
            return Store.instance;
        }
        Store.instance = this;
    }
}
```

### 3. Factory
```javascript
// Generación de elementos DOM
function createTableRow(invitation) {
    const row = document.createElement('tr');
    // ... construcción del elemento
    return row;
}
```

### 4. Observer (Event-Driven)
```javascript
// Sistema de eventos personalizado
document.addEventListener('invitationUpdated', (e) => {
    updateStatistics();
    refreshTable();
});
```

## Decisiones Arquitectónicas

### 1. Sin Framework Frontend
**Razón:** Simplicidad y rendimiento
- Proyecto relativamente pequeño
- Evitar complejidad de build tools
- Carga rápida
- Fácil mantenimiento

### 2. CSV vs Base de Datos
**Razón:** Portabilidad y simplicidad
- No requiere instalación de DB
- Fácil migración entre servidores
- Backup simple (copiar archivos)
- Suficiente para volumen esperado (~500 invitaciones)

### 3. Arquitectura Modular en Admin
**Razón:** Mantenibilidad
- Separación de responsabilidades
- Reutilización de código
- Facilita testing
- Permite crecimiento ordenado

### 4. API RESTful
**Razón:** Estándar de la industria
- Fácil de entender
- Bien documentado
- Permite futura migración a SPA
- Compatible con múltiples clientes

## Seguridad

### Implementada
- Autenticación HTTP Basic para admin
- Códigos de invitación únicos y aleatorios
- Validación de entrada en servidor
- CORS configurado
- Headers de seguridad básicos

### Por Implementar
- HTTPS en producción
- Rate limiting
- CSRF tokens
- Sanitización más robusta
- Logs de auditoría

## Rendimiento

### Optimizaciones Actuales
- Archivos CSS/JS minificados en producción
- Imágenes optimizadas
- Caché de navegador para assets
- Lazy loading de imágenes

### Optimizaciones Futuras
- Service Worker para offline
- CDN para assets estáticos
- Compresión gzip
- Paginación server-side
- Índices en memoria para CSV

## Escalabilidad

### Límites Actuales
- ~1000 invitaciones sin degradación
- ~50 usuarios concurrentes
- Archivos CSV hasta 10MB

### Plan de Escalado
1. **Fase 1** (actual): CSV local
2. **Fase 2**: SQLite para mayor volumen
3. **Fase 3**: PostgreSQL para múltiples eventos
4. **Fase 4**: Microservicios si es necesario

## Testing

### Estrategia Actual
- Testing manual
- Validaciones en cliente y servidor
- Logs para debugging

### Estrategia Propuesta
```
tests/
├── unit/
│   ├── services/
│   └── utils/
├── integration/
│   └── api/
└── e2e/
    └── flows/
```

## Monitoreo

### Actual
- Logs en consola
- Errores en archivo

### Propuesto
- APM (Application Performance Monitoring)
- Alertas por email
- Dashboard de métricas
- Logs centralizados

## Deployment

### Arquitectura de Deployment
```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │ HTTPS
┌──────▼──────┐
│   Nginx     │ (Reverse Proxy)
└──────┬──────┘
       │
┌──────▼──────┐
│  Node.js    │ (PM2)
└──────┬──────┘
       │
┌──────▼──────┐
│    CSV      │ (Local FS)
└─────────────┘
```

## Consideraciones Futuras

### 1. Migración a SPA
- React/Vue para mayor interactividad
- API completamente separada
- Estado global con Redux/Vuex

### 2. Multi-tenancy
- Soporte para múltiples eventos
- Aislamiento de datos
- Personalización por evento

### 3. Integraciones
- WhatsApp Business API
- Google Calendar
- Servicios de email
- Pasarelas de pago (regalos)

### 4. Analytics
- Tracking de comportamiento
- Heatmaps
- Conversión de confirmaciones
- A/B testing
