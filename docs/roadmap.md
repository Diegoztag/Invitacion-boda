# 📌 Roadmap de Mejora del MVP

Este documento sirve como guía de buenas prácticas, mejoras y correcciones para pulir el MVP de la invitación de boda. Cada vez que se implemente una funcionalidad o remediación, se marcará la casilla correspondiente y se añadirá el commit asociado para mantener un historial claro.

---

## 🌟 Ciclos de Mejora Continuos

### Ciclo 26: Seguridad (Finalizado)

- [x] **Fortalecer la Gestión de Secretos**: Eliminar credenciales y secretos hardcodeados de `authMiddleware.js` y forzar su configuración a través de variables de entorno.
- [x] **Implementar Rate Limiting**: Añadir `rate limiting` al endpoint de `login` para prevenir ataques de fuerza bruta.
- [x] **Integrar Protección CSRF**: Integrar el `validateMiddleware` de CSRF en todas las rutas POST, PUT, DELETE y PATCH.
- [x] **Forzar HTTPS en Producción**: Añadir un middleware que fuerce HTTPS y configure HSTS.

### Ciclo 27: Arquitectura del Backend (Finalizado)

- [x] **Abstraer la Lógica de Consulta**: Crear un servicio de `QueryBuilder` para manejar la construcción de filtros, paginación y ordenamiento en los controladores.
- [x] **Mover Lógica de Negocio a Casos de Uso**: Refactorizar los controladores para mover toda la lógica de negocio a los casos de uso correspondientes (ej. `RestoreInvitationUseCase`).
- [x] **Desacoplar Controladores de Repositorios**: Crear casos de uso para todas las operaciones de lectura y utilizarlos en los controladores en lugar de los repositorios.
- [x] **Centralizar Utilidades**: Extraer el código duplicado (ej. `convertToCSV`) a un módulo de utilidades compartidas.
- [x] **Refinar Casos de Uso**: Dividir los casos de uso con múltiples responsabilidades en casos de uso más pequeños y enfocados.
- [x] **Asegurar Endpoint de Notificaciones**: Añadir autenticación y autorización al endpoint de suscripción de notificaciones.

### Ciclo 28: Lógica de Negocio (Finalizado)

- [x] **Mejorar Detección de Duplicados**: Implementar una lógica más robusta para detectar invitaciones duplicadas, considerando todos los nombres de los invitados.
- [x] **Asegurar la Transaccionalidad**: Refactorizar los casos de uso de escritura (`CreateInvitation` y `ConfirmAttendance`) para que sean transaccionales.
- [x] **Optimizar Consultas de Datos**: Mejorar la eficiencia de las consultas en `GetConfirmationStatsUseCase` para evitar obtener grandes cantidades de datos en memoria.
- [x] **Refactorizar y Simplificar Casos de Uso**: Mover la lógica de negocio de los casos de uso a las entidades o a servicios de dominio.

### Ciclo 29: Arquitectura del Frontend (Finalizado)

- [x] **Refactorizar `AppController`**: Dividir el método `init` en métodos más pequeños y abstraer la inicialización de componentes a una `ComponentFactory`.
- [x] **Refactorizar `ContentController`**: Desacoplar el controlador de los servicios y utilizar un enfoque más declarativo para la manipulación del DOM.
- [x] **Refactorizar `ThemeController`**: Simplificar el manejo de temas y mejorar la legibilidad del código.
- [x] **Refactorizar `Component`**: Crear una clase base `Component` para manejar el ciclo de vida de los componentes de la interfaz de usuario.
- [x] **Refactorizar `ErrorHandler`**: Centralizar el manejo de errores en un `ErrorHandler` global.
- [x] **Refactorizar `EventBus`**: Implementar un `EventBus` para la comunicación entre componentes.
- [x] **Refactorizar `EventLogger`**: Crear un `EventLogger` para registrar eventos importantes de la aplicación.
- [x] **Refactorizar `jest.setup.js`**: Simplificar la configuración de Jest y eliminar código duplicado.
- [x] **Refactorizar `jest.config.frontend.js`**: Consolidar la configuración de Jest para el frontend.
- [x] **Refactorizar `RSVPController`**: Desacoplar el controlador de los servicios y utilizar un enfoque más declarativo para la manipulación del DOM.
- [x] **Mejorar la Arquitectura General**: Introducir una capa de `Facades` o casos de uso del frontend para mediar entre los controladores y los servicios del dominio.

### Ciclo 30: Testing (Finalizado)

- [x] **Mejorar la Estrategia de Cobertura**: Aumentar los umbrales de cobertura en las configuraciones de Jest para asegurar que las partes críticas del sistema estén bien probadas.
- [x] **Separar los Tipos de Pruebas**: Crear configuraciones de Jest separadas para tests unitarios y de integración para acelerar el ciclo de desarrollo.
- [x] **Implementar Pruebas End-to-End (E2E)**: Añadir una suite de pruebas E2E con Cypress o Playwright para validar los flujos de usuario completos.
- [x] **Consolidar la Configuración de Jest**: Refactorizar los archivos de configuración de Jest para eliminar duplicados y simplificar el mantenimiento.

### Ciclo 31: UX y Accesibilidad

- [x] Implementar internacionalización básica (ES/EN).
- [x] Revisar contrastes de colores y añadir modo oscuro opcional.
- [x] Añadir manejo offline o mensaje de falta de conexión.

### Ciclo 32: Rendimiento y Escalabilidad

- [x] Cachear respuestas frecuentes (memoria/Redis).
- [x] Evaluar migración de CSV a base de datos (relacional o NoSQL).
- [x] Optimizar paginación y consultas en repositorios.
- [x] Comprimir/minificar recursos front-end y habilitar Service Worker.
- [x] Monitorizar tiempos de respuesta (APM) y definir alertas.

### Ciclo 33: Documentación y Operaciones

- [x] Documentar API con Swagger/OpenAPI.
- [x] Configurar CI/CD para build, lint, test y deploy.
- [x] Definir entorno de staging y gestionar variables sensibles.

### Ciclo 34: Otros Temas

- [ ] Cumplir con normas de protección de datos personales (LGPD/GDPR).
- [ ] SEO y metadata en landing page.
- [ ] Migrar frontend a bundler moderno (Vite) y modularizar código.
- [ ] Mantener sincronía con `docs/MIGRATION_ROADMAP.md`.

---

## 🚀 Próximas Fases (Roadmap Técnico)

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

---

> **Nota:** Cada cambio debe corresponder a un commit individual con mensaje claro. Revisa este roadmap con frecuencia y ajusta prioridades conforme avanzamos.
