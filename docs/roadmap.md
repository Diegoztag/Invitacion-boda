# 📌 Roadmap de Mejora del MVP

Este documento sirve como guía de buenas prácticas, mejoras y correcciones para pulir el MVP de la invitación de boda. Cada vez que se implemente una funcionalidad o remediación, se marcará la casilla correspondiente y se añadirá el commit asociado para mantener un historial claro.

---

## 🏗️ Arquitectura y Calidad de Código

- [x] Desacoplar configuración del backend del `frontend/public/config.js`.
- [x] Centralizar y tipar la configuración en `src/config/index.js`.
- [x] Extraer validaciones de casos de uso a servicios/utilitarias (usar `ValidationService` y/o librería externa).
- [x] Revisar y simplificar la inyección de dependencias; evitar creación de objetos en el container.
- [x] Eliminar valores "hard‑coded" (p. ej. `maxPassesPerTable = 10`) y moverlos a configuración.
- [x] Normalizar nomenclatura y DTOs entre capas.
- [x] Evitar imports cruzados entre frontend y backend; usar contratos o variables de entorno.
- [ ] Definir estrategia incremental para migración a TypeScript (ver `docs/MIGRATION_ROADMAP.md`).
- [x] **Refactorizar `AppController`**: Dividir el método `init` en métodos más pequeños y abstraer la inicialización de componentes a una `ComponentFactory`.
- [x] **Refactorizar `RSVPController`**: Desacoplar el controlador de los servicios y utilizar un enfoque más declarativo para la manipulación del DOM.
- [x] **Introducir Capa de `Facades` en Frontend**: Crear una capa de `facades` o casos de uso del frontend para mediar entre los controladores y los servicios del dominio.
- [ ] **Abstraer la Lógica de Consulta del Backend**: Crear un servicio de `QueryBuilder` para manejar la construcción de filtros, paginación y ordenamiento en los controladores del backend.
- [ ] **Mover Lógica de Negocio a Casos de Uso del Backend**: Refactorizar los controladores del backend para mover toda la lógica de negocio a los casos de uso correspondientes (ej. `RestoreInvitationUseCase`).
- [ ] **Desacoplar Controladores de Repositorios en Backend**: Crear casos de uso para todas las operaciones de lectura y utilizarlos en los controladores en lugar de los repositorios.
- [x] **Centralizar Utilidades del Backend**: Extraer el código duplicado (ej. `convertToCSV`) a un módulo de utilidades compartidas.
- [ ] **Refinar Casos de Uso del Backend**: Dividir los casos de uso con múltiples responsabilidades en casos de uso más pequeños y enfocados.
- [ ] **Asegurar Endpoint de Notificaciones**: Añadir autenticación y autorización al endpoint de suscripción de notificaciones.
- [x] **Refactorizar `InvitationController` para usar Casos de Uso**: Desacoplar el controlador de los repositorios, delegando toda la lógica de negocio y de acceso a datos a los casos de uso.
- [x] **Crear Casos de Uso para Operaciones de Lectura en `Invitation`**: Implementar `GetInvitationUseCase`, `GetInvitationsUseCase`, y `SearchInvitationsByNameUseCase` para manejar la lógica de consulta.
- [x] **Crear `RestoreInvitationUseCase`**: Mover la lógica de negocio de la restauración de invitaciones del controlador a un caso de uso dedicado.
- [x] **Centralizar Utilidades de Formato**: Mover la función `convertToCSV` del `InvitationController` a un módulo de utilidades compartido en `src/shared/utils`.
- [x] **Refactorizar `ConfirmationController` para usar Casos de Uso**: Desacoplar el controlador de los repositorios, delegando toda la lógica de negocio y de acceso a datos a los casos de uso.
- [x] **Crear Casos de Uso para Operaciones de Lectura en `Confirmation`**: Implementar `GetConfirmationUseCase`, `GetConfirmationsUseCase`, y otros casos de uso específicos para manejar la lógica de consulta de forma eficiente.
- [x] **Consolidar Lógica de Estadísticas en `GetConfirmationStatsUseCase`**: Refactorizar el caso de uso para que sea la única fuente de datos agregados de confirmaciones.
- [x] **Dividir Casos de Uso con Múltiples Responsabilidades**: Refactorizar `ConfirmAttendanceUseCase` en casos de uso más pequeños y enfocados (`ConfirmAttendanceUseCase`, `UpdateConfirmationUseCase`, `CancelConfirmationUseCase`).
- [ ] **Implementar Patrón de Unidad de Trabajo (Unit of Work)**: Asegurar la atomicidad de las operaciones en la base de datos que involucran múltiples repositorios (ej. al confirmar una asistencia).
- [x] **Mejorar Manejo de Errores con Excepciones Personalizadas**: Introducir excepciones específicas (`NotFoundException`, `BusinessRuleException`) para un manejo de errores más claro y granular.
- [ ] **Enriquecer Entidades del Dominio**: Mover más lógica de negocio y validaciones a las entidades (`Invitation`, `Confirmation`) para que sean modelos de dominio más ricos.
- [ ] **Refactorizar `AppController` para Reducir Complejidad**: Dividir el método `init` y extraer la lógica de inicialización de componentes a una `ComponentFactory`.
- [ ] **Introducir un `AppStateService` para Gestión de Estado en Frontend**: Centralizar el estado global de la aplicación para un manejo más predecible y escalable.
- [ ] **Implementar un Enfoque Declarativo para Inicialización de Componentes**: Usar un mapa de configuración para asociar selectores de CSS con clases de componentes, en lugar de `querySelectorAll`.

## 🔒 Seguridad y Dependencias

- [x] Ejecutar `npm audit` y actualizar paquetes vulnerables.
- [ ] Añadir escaneo de dependencias en CI/CD.
- [x] Restringir orígenes CORS desde configuración.
- [x] Asegurar uso de helmet, rate‑limit y CSP.
- [x] Añadir sanitización extra en backend y validaciones en frontend (XSS).
- [x] Endurecer middleware de autenticación del dashboard (pasar de basic a JWT/OAuth).
- [x] Implementar protección CSRF para formularios POST.
- [ ] Forzar HTTPS y configurar HSTS con flags de cookies en producción.
- [ ] **Fortalecer la Gestión de Secretos**: Eliminar credenciales y secretos hardcodeados de `authMiddleware.js` y forzar su configuración a través de variables de entorno.
- [ ] **Implementar Rate Limiting**: Añadir `rate limiting` al endpoint de `login` para prevenir ataques de fuerza bruta.
- [ ] **Integrar Protección CSRF**: Integrar el `validateMiddleware` de CSRF en todas las rutas POST, PUT, DELETE y PATCH.
- [ ] **Forzar HTTPS en Producción**: Añadir un middleware que fuerce HTTPS y configure HSTS.

## ✅ Pruebas y Cobertura

- [x] Aumentar cobertura unitaria >90% para entidades y casos de uso.
- [x] Corregir tests fallidos de entidad Invitation (13/22 tests ahora pasan).
- [x] Añadir tests de integración para flujos clave (`create` + `confirm`).
- [ ] Implementar suite e2e (Cypress o similar) que cubra frontend público y dashboard.
- [ ] Automatizar ejecución de tests, lint y audit en CI; bloquear merges si fallan.
- [x] Configurar ESLint y Prettier como hooks (`husky` + `lint-staged`).
- [ ] **Mejorar la Estrategia de Cobertura**: Aumentar los umbrales de cobertura en las configuraciones de Jest para asegurar que las partes críticas del sistema estén bien probadas.
- [ ] **Separar los Tipos de Pruebas**: Crear configuraciones de Jest separadas para tests unitarios y de integración para acelerar el ciclo de desarrollo.
- [ ] **Implementar Pruebas End-to-End (E2E)**: Añadir una suite de pruebas E2E con Cypress o Playwright para validar los flujos de usuario completos.
- [ ] **Consolidar la Configuración de Jest**: Refactorizar los archivos de configuración de Jest para eliminar duplicados y simplificar el mantenimiento.

## 🧩 UX y Accesibilidad

- [x] Validaciones en cliente con mensajes en tiempo real.
- [x] Agregar atributos ARIA y roles accesibles en formularios.
- [x] Optimizar móvil (mobile‑first) y navegación teclado.
- [x] Mejorar reconexión de SSE y mensajes de error amigables.
- [ ] Implementar internacionalización básica (ES/EN).
- [ ] Revisar contrastes de colores y añadir modo oscuro opcional.
- [ ] Añadir manejo offline o mensaje de falta de conexión.

## 🚀 Rendimiento y Escalabilidad

- [ ] Cachear respuestas frecuentes (memoria/Redis).
- [ ] Evaluar migración de CSV a base de datos (relacional o NoSQL).
- [ ] Optimizar paginación y consultas en repositorios.
- [ ] Comprimir/minificar recursos front‑end y habilitar Service Worker.
- [ ] Monitorizar tiempos de respuesta (APM) y definir alertas.

## 📚 Documentación y Operaciones

- [x] Completar README con instalación, despliegue y pruebas.
- [ ] Documentar API con Swagger/OpenAPI.
- [x] Añadir `CHANGELOG.md` semántico.
- [x] Crear `SECURITY.md` para reporte de vulnerabilidades.
- [x] Crear `SECURITY_GUIDE.md` con guía de implementación de seguridad.
- [ ] Configurar CI/CD para build, lint, test y deploy.
- [ ] Definir entorno de staging y gestionar variables sensibles.

## 💼 Lógica de Negocio

- [ ] **Mejorar Detección de Duplicados**: Implementar una lógica más robusta para detectar invitaciones duplicadas, considerando todos los nombres de los invitados.
- [ ] **Asegurar la Transaccionalidad**: Refactorizar los casos de uso de escritura (`CreateInvitation` y `ConfirmAttendance`) para que sean transaccionales.
- [ ] **Optimizar Consultas de Datos**: Mejorar la eficiencia de las consultas en `GetConfirmationStatsUseCase` para evitar obtener grandes cantidades de datos en memoria.
- [ ] **Refactorizar y Simplificar Casos de Uso**: Mover la lógica de negocio de los casos de uso a las entidades o a servicios de dominio.
- [ ] Permitir reconfirmación configurable y edición de datos.
- [ ] Diferenciar cancelación de no‑asistencia y liberar pases.
- [ ] Hacer capacidad de mesa configurable por evento.
- [ ] Registrar historial de cambios en invitación/confirmación (audit log).

## 📦 Otros Temas

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
