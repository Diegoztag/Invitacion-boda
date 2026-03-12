# Política de Seguridad

## Reportar Vulnerabilidades

Si descubres una vulnerabilidad de seguridad, **NO ABRAS UN ISSUE PÚBLICO**. En su lugar:

1. Envía un email a <security@your-domain.com> (a definir) con:
   - Descripción de la vulnerabilidad
   - Paso a paso para reproducirla
   - Impacto potencial
   - Sugerencias de fix (si las tienes)

2. Proporciona un plazo razonable (típicamente 30-90 días) antes de divulgar públicamente

3. Recibirás reconocimiento en el SECURITY_ADVISORIES.md una vez resuelta

## Prácticas de Seguridad

### Backend

- ✅ Validación y sanitización de inputs
- ✅ Rate limiting en endpoints
- ✅ CORS restringido
- ✅ Headers de seguridad (Helmet)
- ✅ Autenticación en dashboard
- 🔄 JWT/OAuth (en progreso)
- 🔄 HTTPS obligatorio en producción (en progreso)

### Frontend

- ✅ Sanitización de datos del servidor
- 🔄 CSP strict (en progreso)
- 🔄 Protección CSRF (en progreso)
- 🔄 Validación de inputs cliente-side (en progreso)

### Dependencias

- ✅ npm audit ejecutado regularmente
- ✅ Actualizaciones de seguridad prioritarias
- 🔄 CI/CD con escaneo de dependencias (en progreso)

### Datos Personales

- ✅ Almacenamiento local (CSV) seguro
- ✅ Teléfono sanitizado al guardar
- 🔄 Cumplimiento LGPD/GDPR (en progreso)
- 🔄 Política de privacidad (pendiente)

## Cumplimiento

- [ ] OWASP Top 10: Principalmente cubierto
- [ ] GDPR: En progreso
- [ ] LGPD: En progreso

## Historial de Seguridad

### 2026-03-12
- npm audit fix: Solucionadas 3 vulnerabilidades en dependencias
  - ajv: ReDoS fix
  - minimatch: ReDoS fixes (3 issues)
  - qs: arrayLimit bypass fix

## Actualizaciones

Este proyecto mantiene:
- Dependencias actualizadas
- Auditorías de seguridad mensuales
- Revisiones de código enfocadas en seguridad

---

**Última actualización**: 2026-03-12
