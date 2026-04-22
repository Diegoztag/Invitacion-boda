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

### Ciclo 34: Otros Temas (Finalizado)

- [x] Cumplir con normas de protección de datos personales (LGPD/GDPR).
- [x] SEO y metadata en landing page.
- [x] Migrar frontend a bundler moderno (Vite) y modularizar código.
- [x] Mantener sincronía con `docs/MIGRATION_ROADMAP.md` (Obsoleto: Integrado en este roadmap).

### Ciclo 35: Limpieza de Código y Calidad (Finalizado)

- [x] **Corrección de Errores de Estilo**: Ejecutar `lint:fix` para aplicar reglas de estilo automáticamente.
- [x] **Limpieza de Advertencias**: Eliminar `console.log` y variables no usadas en frontend y backend.

### Ciclo 36: Pruebas y Verificación Final (Finalizado)

- [x] **Ejecutar Pruebas del Backend**: Correr la suite de pruebas de Jest para el backend (`npm run test` en la carpeta backend).
- [x] **Ejecutar Pruebas del Frontend**: Correr la suite de pruebas de Jest para el frontend (`npm run test` en la raíz).
- [x] **Revisar Cobertura**: Analizar los reportes de cobertura y añadir pruebas si es necesario para mantener un nivel aceptable.
- [x] **Completar Cobertura de Casos de Uso**: Añadir pruebas unitarias para los casos de uso restantes (`ExportConfirmations`, `ExportInvitations`, `CancelConfirmation`, `DeleteInvitation`, `UpdateInvitation`, `UpdateConfirmation`).

### Ciclo 37: Testing Avanzado y Cobertura (Finalizado)

- [x] **Completar Cobertura de Controladores (Backend)**: Añadir pruebas unitarias para `InvitationController` y `ConfirmationController`.
- [x] **Completar Cobertura de Controladores (Frontend)**: Añadir pruebas unitarias para los controladores del frontend que faltan.
- [x] **Separar Pruebas Unitarias y de Integración**: Crear configuraciones y scripts de npm separados para ejecutar pruebas unitarias y de integración de forma independiente.
- [x] **Pruebas de Integración**: Crear pruebas de integración para los flujos críticos (ej. creación de invitación -> confirmación -> actualización de estadísticas).

### Ciclo 38: Optimización Post-Migración Vite y Performance (Finalizado)

- [x] **Configuración Avanzada de Vite**: Optimizar el chunking (separar vendor de código de aplicación) en `vite.config.js`.
- [x] **Lazy Loading de Componentes**: Implementar carga diferida para componentes no críticos (ej. modales, carrusel) para mejorar el tiempo de carga inicial.
- [x] **Optimización de Imágenes**: Asegurar que todas las imágenes se sirvan en formatos modernos (WebP/AVIF) y utilizar `srcset` para diferentes resoluciones.
- [x] **Minificación Avanzada**: Revisar la configuración de Terser/esbuild en Vite para eliminar console.logs en producción y optimizar el bundle.

### Ciclo 39: Accesibilidad (a11y) y SEO Avanzado (Finalizado)

- [x] **Auditoría de Accesibilidad**: Ejecutar Lighthouse y corregir problemas de contraste, etiquetas ARIA faltantes y navegación por teclado.
- [x] **Sitemap y Robots.txt**: Generar dinámicamente o estáticamente un `sitemap.xml` y `robots.txt` para mejorar la indexación.
- [x] **Microdatos (Schema.org)**: Añadir marcado de datos estructurados (Event) para que los motores de búsqueda entiendan los detalles de la boda.

### Ciclo 40: PWA y Performance Avanzado (Finalizado)

- [x] **PWA Completa**: Añadir `manifest.json` y meta etiquetas para iOS/Android para permitir la instalación de la aplicación.
- [x] **Optimización de Imágenes**: Implementar lazy loading nativo (`loading="lazy"`) en las imágenes para mejorar el tiempo de carga inicial.
- [x] **Seguridad Frontend**: Añadir Content Security Policy (CSP) en el `index.html` para prevenir ataques XSS.
- [x] **Performance**: Preconectar a dominios externos (Google Fonts, FontAwesome) usando `<link rel="preconnect">`.

### Ciclo 41: Refinamiento de la Landing Page y Onboarding (Finalizado)

- [x] **SEO y Meta Tags en la Landing Page**: Añadir meta tags para SEO y Open Graph en `frontend/index.html`.
- [x] **Accesibilidad en la Landing Page**: Verificar contrastes, etiquetas ARIA y navegación por teclado.
- [x] **Integración del Flujo de Registro**: Implementar un flujo de registro o un mock claro para los botones de "Comenzar Gratis".
- [x] **Optimización de Assets de la Landing Page**: Asegurar que las imágenes usen lazy loading y estén optimizadas.

### Ciclo 42: Refinamiento de Seguridad y Observabilidad (En Progreso)

- [ ] **Cabeceras de Seguridad (Helmet)**: Integrar `helmet` en el backend para proteger contra vulnerabilidades web comunes.
- [ ] **Configuración Estricta de CORS**: Restringir los orígenes permitidos en CORS para mayor seguridad.
- [ ] **Logging Estructurado**: Implementar un logger profesional (ej. Winston o Pino) para mejor trazabilidad.
- [ ] **Backup Automático de SQLite**: Crear un script o tarea programada para realizar copias de seguridad de la base de datos SQLite.

---

## 🚀 Próximas Fases (Roadmap Técnico)

### Fase 1: Migración de la Base de Datos (Q2 2026) (Finalizado)

**Objetivo**: Reemplazar el almacenamiento basado en archivos CSV por una base de datos relacional para mejorar la escalabilidad, la integridad de los datos y el rendimiento.

- **Tareas**:
    - [x] **Selección de la Base de Datos**: Evaluar opciones como PostgreSQL, SQLite o MySQL.
    - [x] **Diseño del Esquema**: Crear el esquema de la base de datos para las tablas `invitations` y `confirmations`.
    - [x] **Implementación de Repositorios**: Crear nuevas implementaciones de `IInvitationRepository` y `IConfirmationRepository` (ej. `SqlInvitationRepository`).
    - [x] **Script de Migración**: Desarrollar un script para migrar los datos existentes de los archivos CSV a la nueva base de datos.
    - [x] **Actualización de Pruebas**: Adaptar las pruebas de integración para que funcionen con la nueva base de datos.

### Fase 2: Mejoras en el Dashboard (Q2 2026) (Finalizado)

**Objetivo**: Mejorar la experiencia de usuario y añadir funcionalidades clave al panel de administración.

- **Tareas**:
    - [x] **Gestión de Configuración Dinámica**: Permitir al administrador editar la configuración de la boda desde una interfaz en el dashboard (Backend y Frontend implementados).
    - [x] **Refinamiento de la Interfaz**:
        - Mejorar el sistema de filtrado y búsqueda de invitaciones (Implementado popover de filtros y ordenamiento por columnas).
        - Rediseñar los modales de creación y edición para una mejor usabilidad (Implementada lógica de campos dinámicos de invitados).
    - [x] **Flujo de Importación de CSV**: Corregir y mejorar el flujo de importación masiva de invitaciones (Implementado modal con drag and drop y validación).

### Fase 3: DevOps y Despliegue (Q3 2026) (Finalizado)

**Objetivo**: Automatizar y simplificar el proceso de despliegue y mantenimiento de la aplicación.

- **Tareas**:
    - [x] **Containerización con Docker**:
        - Crear un `Dockerfile` para el `backend`.
        - Crear un `docker-compose.yml` para orquestar el `backend` y la base de datos.
    - [x] **Pipeline de CI/CD**:
        - Configurar un pipeline (ej. con GitHub Actions) que ejecute automáticamente las pruebas, el linting y el despliegue en cada `push` a la rama principal.

### Fase 4: Funcionalidades Avanzadas (Q4 2026)

**Objetivo**: Añadir características que aporten un valor significativo a la aplicación.

- **Tareas**:
    - [x] **Notificaciones en Tiempo Real**: Implementar notificaciones push o por correo electrónico cuando un invitado confirme su asistencia (Implementado mediante SSE en el dashboard).
    - [x] **Personalización de Plantillas**: Permitir a los usuarios elegir entre diferentes plantillas de diseño para la invitación.
    - [x] **Internacionalización (i18n)**: Añadir soporte para múltiples idiomas (Implementado `i18n-service.js`).

---

> **Nota:** Cada cambio debe corresponder a un commit individual con mensaje claro. Revisa este roadmap con frecuencia y ajusta prioridades conforme avanzamos.
