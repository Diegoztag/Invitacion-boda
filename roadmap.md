# 📌 Roadmap de Mejora del MVP

Este documento sirve como guía de buenas prácticas, mejoras y correcciones para pulir el MVP de la invitación de boda. Cada vez que se implemente una funcionalidad o remediación, se marcará la casilla correspondiente y se añadirá el commit asociado para mantener un historial claro.

---

## 🏗️ Arquitectura y Calidad de Código

- [ ] Desacoplar configuración del backend del `frontend/public/config.js`.
- [x] Centralizar y tipar la configuración en `src/config/index.js`.
- [x] Extraer validaciones de casos de uso a servicios/utilitarias (usar `ValidationService` y/o librería externa).
- [ ] Revisar y simplificar la inyección de dependencias; evitar creación de objetos en el container.
- [x] Eliminar valores "hard‑coded" (p. ej. `maxPassesPerTable = 10`) y moverlos a configuración.
- [ ] Normalizar nomenclatura y DTOs entre capas.
- [x] Evitar imports cruzados entre frontend y backend; usar contratos o variables de entorno.
- [ ] Definir estrategia incremental para migración a TypeScript (ver `docs/MIGRATION_ROADMAP.md`).

## 🔒 Seguridad y Dependencias

- [x] Ejecutar `npm audit` y actualizar paquetes vulnerables.
- [ ] Añadir escaneo de dependencias en CI/CD.
- [x] Restringir orígenes CORS desde configuración.
- [ ] Asegurar uso de helmet, rate‑limit y CSP.
- [ ] Añadir sanitización extra en backend y validaciones en frontend (XSS).
- [ ] Endurecer middleware de autenticación del dashboard (pasar de basic a JWT/OAuth).
- [ ] Implementar protección CSRF para formularios POST.
- [ ] Forzar HTTPS y configurar HSTS con flags de cookies en producción.

## ✅ Pruebas y Cobertura

- [ ] Aumentar cobertura unitaria >90% para entidades y casos de uso.
- [ ] Añadir tests de integración para flujos clave (`create` + `confirm`).
- [ ] Implementar suite e2e (Cypress o similar) que cubra frontend público y dashboard.
- [ ] Automatizar ejecución de tests, lint y audit en CI; bloquear merges si fallan.
- [x] Configurar ESLint y Prettier como hooks (`husky` + `lint-staged`).

## 🧩 UX y Accesibilidad

- [ ] Validaciones en cliente con mensajes en tiempo real.
- [ ] Agregar atributos ARIA y roles accesibles en formularios.
- [ ] Optimizar móvil (mobile‑first) y navegación teclado.
- [ ] Mejorar reconexión de SSE y mensajes de error amigables.
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

- [ ] Completar README con instalación, despliegue y pruebas.
- [ ] Documentar API con Swagger/OpenAPI.
- [x] Añadir `CHANGELOG.md` semántico.
- [x] Crear `SECURITY.md` para reporte de vulnerabilidades.
- [ ] Configurar CI/CD para build, lint, test y deploy.
- [ ] Definir entorno de staging y gestionar variables sensibles.

## 💼 Lógica de Negocio

- [ ] Mejorar detección de invitaciones duplicadas (usar todos los nombres y telefonos).
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

> **Nota:** Cada cambio debe corresponder a un commit individual con mensaje claro. Revisa este roadmap con frecuencia y ajusta prioridades conforme avanzamos.
