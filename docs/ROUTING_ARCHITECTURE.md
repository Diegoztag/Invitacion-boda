# Arquitectura de Rutas - Sistema de Invitación de Boda

## Descripción General

Este documento describe la nueva arquitectura de rutas implementada para mejorar la organización y separación de responsabilidades entre las diferentes secciones de la aplicación.

## Estructura de Rutas

### Rutas Principales

| Ruta | Descripción | Archivo Servido | Propósito |
|------|-------------|-----------------|-----------|
| `/` | Página de inicio/landing | `frontend/landing/index.html` | Punto de entrada principal con navegación |
| `/invitation` | Invitación pública | `frontend/invitation/index.html` | Invitación de boda para invitados |
| `/dashboard` | Panel de administración | `frontend/dashboard/index.html` | Gestión de invitaciones y confirmaciones |

### Rutas de API

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/invitations` | GET, POST | Gestión de invitaciones |
| `/api/confirmations` | GET, POST | Gestión de confirmaciones |
| `/health` | GET | Estado del servidor |

## Archivos Estáticos

### Configuración de Middleware

```javascript
// Servir archivos estáticos del frontend con nueva estructura
app.use('/admin', express.static(path.join(__dirname, '../../frontend/admin')));
app.use('/invitation', express.static(path.join(__dirname, '../../frontend/invitation')));

// Servir página de inicio desde la raíz
app.use('/', express.static(path.join(__dirname, '../../frontend'), {
    index: 'index.html'
}));
```

### Rutas SPA (Single Page Application)

```javascript
// Rutas específicas para SPA
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/admin/index.html'));
});

app.get('/invitation/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/invitation/index.html'));
});
```

## Beneficios de la Nueva Arquitectura

### 1. Separación Clara de Responsabilidades
- **Landing Page**: Punto de entrada único y profesional
- **Invitación**: Experiencia dedicada para invitados
- **Admin**: Panel separado para gestión

### 2. Mejor Experiencia de Usuario
- URLs más descriptivas y fáciles de recordar
- Navegación intuitiva desde la página de inicio
- Contextos claramente diferenciados

### 3. Escalabilidad
- Fácil agregar nuevas secciones
- Estructura modular y mantenible
- Separación de assets por contexto

### 4. Seguridad
- Panel de admin no expuesto en la raíz
- Mejor control de acceso por rutas
- Separación de recursos sensibles

### 5. SEO y Marketing
- Mejor estructura para motores de búsqueda
- URLs semánticas y descriptivas
- Página de inicio optimizada para conversión

## Estructura de Directorios

```
frontend/
├── index.html              # Landing page principal
├── admin/                  # Panel de administración
│   ├── index.html
│   ├── css/
│   └── js/
└── invitation/             # Invitación pública
    ├── index.html
    ├── styles.css
    ├── config.js
    ├── img/
    └── js/
```

## Configuración del Servidor

### Middleware de Archivos Estáticos

El servidor está configurado para servir archivos estáticos en el siguiente orden:

1. `/admin/*` → `frontend/admin/`
2. `/invitation/*` → `frontend/invitation/`
3. `/` → `frontend/` (con index.html como página principal)

### Manejo de Rutas de Fallback

```javascript
app.get('*', (req, res) => {
    // Si es una ruta de API, devolver 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            error: 'Endpoint no encontrado'
        });
    }
    
    // Para rutas no reconocidas, servir la página de inicio
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});
```

## Navegación

### Página de Inicio (Landing)

La página de inicio (`/`) incluye:
- Diseño elegante con información de la boda
- Botón "Ver Invitación" → `/invitation`
- Botón "Panel Admin" → `/admin`
- Información básica (nombres, fecha)

### Enlaces de Navegación

```html
<a href="/invitation" class="btn btn-primary">Ver Invitación</a>
<a href="/admin" class="btn btn-secondary">Panel Admin</a>
```

## Consideraciones Técnicas

### Content Security Policy (CSP)
- Configurado para permitir recursos locales
- Bloquea recursos externos no autorizados
- Mejora la seguridad de la aplicación

### MIME Types
- Configuración correcta para archivos CSS y JS
- Manejo apropiado de tipos de contenido
- Prevención de errores de carga de recursos

## URLs de Acceso

Con el servidor ejecutándose en puerto 3001:

- **🏠 Inicio**: http://localhost:3001
- **💌 Invitación**: http://localhost:3001/invitation
- **⚙️ Admin**: http://localhost:3001/admin
- **🔧 API**: http://localhost:3001/api
- **❤️ Health**: http://localhost:3001/health

## Migración desde la Estructura Anterior

### Cambios Realizados

1. **Antes**: `/` servía directamente la invitación
2. **Después**: `/` sirve una landing page con navegación

3. **Antes**: `/admin` era la única ruta alternativa
4. **Después**: Estructura clara con `/`, `/invitation`, `/admin`

### Compatibilidad

- Las rutas de API permanecen sin cambios
- El panel de admin mantiene su funcionalidad
- La invitación sigue siendo completamente funcional

## Próximos Pasos

### Mejoras Sugeridas

1. **Subdominios**: Considerar `admin.dominio.com` y `invitacion.dominio.com`
2. **Autenticación**: Implementar protección para rutas de admin
3. **Analytics**: Agregar seguimiento de navegación
4. **PWA**: Convertir en Progressive Web App
5. **Caché**: Implementar estrategias de caché por ruta

### Monitoreo

- Logs estructurados por ruta
- Métricas de uso por sección
- Análisis de patrones de navegación

---

**Fecha de Implementación**: Enero 2026  
**Versión**: 1.0  
**Estado**: Implementado y Funcional
