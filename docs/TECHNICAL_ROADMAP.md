# 🗺️ Roadmap Técnico - Sistema de Invitaciones de Boda

**Última actualización**: Marzo 2026

## ✅ Hitos Alcanzados

### Q1 2026

- **Refactorización a Clean Architecture**:
    - `backend` y `frontend` completamente refactorizados.
    - Implementación de Inyección de Dependencias.
- **Suite de Pruebas Completa**:
    - Pruebas unitarias y de integración para el `backend`.
    - Pruebas unitarias para el `frontend` (servicios, componentes y controladores).
- **Seguridad Robusta**:
    - Implementación de autenticación JWT, protección CSRF, headers de seguridad con Helmet y limitación de tasa.

## 🚀 Próximas Fases

### Fase 1: Migración de la Base de Datos (Q2 2026)

**Objetivo**: Reemplazar el almacenamiento basado en archivos CSV por una base de datos relacional para mejorar la escalabilidad, la integridad de los datos y el rendimiento.

- **Tareas**:
    - [ ] **Selección de la Base de Datos**: Evaluar opciones como PostgreSQL, SQLite o MySQL.
    - [ ] **Diseño del Esquema**: Crear el esquema de la base de datos para las tablas `invitations` y `confirmations`.
    - [ ] **Implementación de Repositorios**: Crear nuevas implementaciones de `IInvitationRepository` y `IConfirmationRepository` (ej. `SqlInvitationRepository`).
    - [ ] **Script de Migración**: Desarrollar un script para migrar los datos existentes de los archivos CSV a la nueva base de datos.
    - [ ] **Actualización de Pruebas**: Adaptar las pruebas de integración para que funcionen con la nueva base de datos.

### Fase 2: Mejoras en el Dashboard (Q2 2026)

**Objetivo**: Mejorar la experiencia de usuario y añadir funcionalidades clave al panel de administración.

- **Tareas**:
    - [ ] **Gestión de Configuración Dinámica**: Permitir al administrador editar la configuración de la boda (`frontend/public/config.js`) desde una interfaz en el dashboard.
    - [ ] **Refinamiento de la Interfaz**:
        - Mejorar el sistema de filtrado y búsqueda de invitaciones.
        - Rediseñar los modales de creación y edición para una mejor usabilidad.
    - [ ] **Flujo de Importación de CSV**: Corregir y mejorar el flujo de importación masiva de invitaciones.

### Fase 3: DevOps y Despliegue (Q3 2026)

**Objetivo**: Automatizar y simplificar el proceso de despliegue y mantenimiento de la aplicación.

- **Tareas**:
    - [ ] **Containerización con Docker**:
        - Crear un `Dockerfile` para el `backend`.
        - Crear un `docker-compose.yml` para orquestar el `backend` y la base de datos.
    - [ ] **Pipeline de CI/CD**:
        - Configurar un pipeline (ej. con GitHub Actions) que ejecute automáticamente las pruebas, el linting y el despliegue en cada `push` a la rama principal.

### Fase 4: Funcionalidades Avanzadas (Q4 2026)

**Objetivo**: Añadir características que aporten un valor significativo a la aplicación.

- **Tareas**:
    - [ ] **Notificaciones en Tiempo Real**: Implementar notificaciones push o por correo electrónico cuando un invitado confirme su asistencia.
    - [ ] **Personalización de Plantillas**: Permitir a los usuarios elegir entre diferentes plantillas de diseño para la invitación.
    - [ ] **Internacionalización (i18n)**: Añadir soporte para múltiples idiomas.
