# Frontend - Sistema de Invitaciones de Boda

## 📁 Estructura del Frontend

Este directorio contiene todo el código del frontend del sistema, organizado en dos aplicaciones principales:

```
frontend/
├── invitation/          🎨 Invitación Pública
│   ├── index.html          → Página principal de la invitación
│   ├── styles.css          → Estilos CSS principales
│   ├── config.js           → Configuración de la boda
│   ├── app-legacy.js       → Archivo legacy como backup
│   ├── img/                → Recursos de imagen
│   └── js/                 → Clean Architecture
│       ├── config/            → DI Container + Configuración
│       ├── core/              → Servicios de negocio
│       ├── infrastructure/    → API + Storage
│       ├── presentation/      → Controllers + Components
│       └── shared/            → Utilidades compartidas
└── admin/               👨‍💼 Panel Administrativo
    ├── index.html          → Dashboard principal (antes admin.html)
    ├── admin.js            → Script principal del admin
    ├── css/                → Estilos modulares (25+ archivos)
    └── js/                 → Arquitectura modular
        ├── controllers/       → Dashboard, Invitations, Navigation
        ├── services/          → Notification service
        └── components/        → Modal components
```

## 🎯 Aplicaciones

### 🎨 **Public** - Invitación para Invitados
- **Propósito**: Invitación de boda para los invitados
- **Audiencia**: Invitados a la boda
- **Tecnología**: Clean Architecture + Dependency Injection
- **Características**:
  - Diseño responsive y elegante
  - Countdown hasta la boda
  - Formulario de confirmación de asistencia
  - Galería de fotos
  - Información del evento y ubicación

### 👨‍💼 **Admin** - Panel Administrativo
- **Propósito**: Gestión de invitaciones y confirmaciones
- **Audiencia**: Administradores de la boda
- **Tecnología**: Arquitectura modular + CSS consolidado
- **Características**:
  - Dashboard con estadísticas
  - Gestión de invitaciones
  - Importación/exportación CSV
  - Visualización de confirmaciones
  - Reportes y analytics
  - **CSS optimizado**: Un solo archivo en lugar de 25+ archivos

## 🚀 Cómo Ejecutar

### **Invitación Pública**
```bash
# Abrir directamente en navegador
open frontend/invitation/index.html

# O servir con servidor local
cd frontend/invitation
python -m http.server 8000
# Visitar: http://localhost:8000
```

### **Panel Administrativo**
```bash
# Abrir directamente en navegador
open frontend/admin/index.html

# O servir con servidor local
cd frontend/admin
python -m http.server 8001
# Visitar: http://localhost:8001
```

## 🏗️ Arquitectura

### **Public - Clean Architecture**
- **Dependency Injection Container** para gestión de dependencias
- **Separación de capas** (Core, Infrastructure, Presentation)
- **Servicios especializados** para cada funcionalidad
- **Componentes UI modulares** y reutilizables

### **Admin - Arquitectura Modular**
- **Controllers** para gestión de vistas
- **Services** para lógica de negocio
- **Components** para elementos UI reutilizables
- **CSS consolidado** - Un archivo `admin.css` que importa todos los módulos
- **Performance optimizada** - Una sola petición HTTP para estilos

## 📊 Beneficios de la Estructura Unificada

### **🎯 Organización Clara**
- **Todo el frontend** en una sola carpeta
- **Separación lógica** entre público y admin
- **Recursos compartidos** posibles entre aplicaciones
- **Estructura escalable** para futuras funcionalidades

### **🔧 Desarrollo Eficiente**
- **Build unificado** posible para ambas aplicaciones
- **Dependencias compartidas** entre public y admin
- **Configuración centralizada** en nivel frontend
- **Testing unificado** para todo el frontend
- **CSS optimizado** - Consolidación de estilos para mejor performance

### **📦 Deployment Flexible**
- **Deployment conjunto** o independiente según necesidad
- **Configuración unificada** de servidor web
- **Optimización conjunta** de assets y recursos
- **Monitoreo centralizado** del frontend

## 🔄 Próximos Pasos

### **Optimizaciones Implementadas**
1. **✅ CSS Consolidado** - Admin CSS unificado en un solo archivo
2. **✅ Rutas Optimizadas** - Backend configurado para nueva estructura
3. **✅ Performance Mejorada** - Menos peticiones HTTP

### **Optimizaciones Pendientes**
1. **Build System** - Webpack/Vite para optimización
2. **Shared Components** - Componentes compartidos entre invitation/admin
3. **Shared Services** - Servicios API compartidos
4. **Testing Suite** - Tests unitarios e integración

### **Mejoras Arquitectónicas**
1. **Micro-frontends** - Evolución hacia micro-frontends
2. **Module Federation** - Compartir módulos entre aplicaciones
3. **Service Worker** - PWA capabilities
4. **Performance Optimization** - Bundle splitting y lazy loading

## 📝 Notas de Desarrollo

### **Convenciones**
- **invitation/**: Todo relacionado con la invitación pública
- **admin/**: Todo relacionado con el panel administrativo
- **Nombres descriptivos** para archivos y carpetas
- **Documentación inline** en código JavaScript

### **Configuración**
- **config.js**: Configuración específica de la boda
- **Variables de entorno**: Para diferentes ambientes
- **API endpoints**: Configurados en infrastructure layer

---

**📅 Última actualización**: Enero 7, 2026  
**👤 Estructura**: Frontend unificado con invitation/ y admin/
**🎯 Estado**: Reorganización completada  
**📊 Progreso**: Estructura optimizada y documentada
