# Changelog

Todos los cambios notables en este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto sigue [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Configuración centralizada en `backend/src/config/index.js` para gestionar variables desde un único lugar
- Variables de entorno documentadas en `.env.example` con todas las opciones disponibles
- Soporte para configuración de CORS desde variables de entorno
- Límites de mesa, invitados y pases ahora configurables por variable de entorno

### Changed

- **BREAKING**: Backend ahora carga configuración desde `src/config/index.js` en lugar de `frontend/public/config.js`
- Refactorización de `CreateInvitationUseCase.validateInput()` para usar `ValidationService` de forma más extensiva
- CORS middleware ahora lee desde configuración centralizada
- `SecurityMiddleware` acepta parámetro `config` en su constructor

### Fixed

- Eliminadas vulnerabilidades de seguridad en dependencias (`ajv`, `minimatch`, `qs`) via `npm audit fix`
- Desacoplamiento de Frontend y Backend: removed cross-imports

### Removed

- Imports directos a `frontend/public/config.js` desde backend (usar configuración centralizada)

---

## [1.0.0] - 2026-03-12

### Added

- Sistema de invitaciones de boda con Clean Architecture
- Backend con Express.js y estructura de capas definidas
- Frontend modular con vista de invitación, dashboard y landing
- Validación de datos con `ValidationService`
- Autenticación básica en dashboard
- Middleware de seguridad (helmet, rate-limit, CORS)
- Testing con Jest (unit tests)
- Logging centralizado
- Sistema SSE para notificaciones en tiempo real
- Almacenamiento CSV para datos de invitaciones

### Features

- Crear invitaciones con información de invitados
- Confirmar asistencia y seleccionar cantidad de pases
- Filtrar y buscar invitaciones desde el dashboard
- Ver estadísticas de confirmaciones en tiempo real
- Validación de capacidad de mesas
- Generación de códigos únicos de invitación

---

## Notas de Versionado

- `[Unreleased]`: Cambios que aún no se han liberado en una versión
- `[X.Y.Z]`: Versiones liberadas etiquetadas en git

### Cambios Significativos (Breaking Changes)

Se indican con **BREAKING** para facilitar identificación en sistemas de actualización automática.
