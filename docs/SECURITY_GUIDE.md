# Guía de Seguridad

Este documento describe las práctica de seguridad implementadas y cómo usarlas.

---

## 🛡️ Protecciones Implementadas

### 1. XSS (Cross-Site Scripting)

**¿Qué es?** Inyección de código JavaScript malicioso en el sitio.

**Mitigaciones:**

#### Frontend - SecurityService

```javascript
// Escapar HTML
const safe = SecurityService.escapeHtml(userInput);

// Sanitizar texto
const clean = SecurityService.sanitizeText(userInput);

// Crear elemento seguro
const link = SecurityService.createElement(
    'a',
    {
        href: SecurityService.sanitizeUrl(url),
        target: '_blank'
    },
    SecurityService.sanitizeText(title)
);

// Validar y sanitizar email
const { isValid, sanitized } = SecurityService.validateAndSanitizeEmail(email);

// Detectar amenazas
const { isSafe, threat } = SecurityService.detectThreats(userInput);
```

#### Frontend - FormValidator

```javascript
const form = document.getElementById('myForm');
const validator = new FormValidator(form);

// Validar un campo
validator.validateField(field);

// Validar todos
if (!validator.validate()) {
    console.log('Errores:', validator.getErrors());
    return;
}

// Obtener datos seguros
const data = validator.getFormData();
```

#### Backend - ValidationService

```javascript
// Validar y sanitizar datos
const validation = validationService.validateInvitationData(req.body);

if (!validation.isValid) {
    return res.status(400).json({
        errors: validation.errors
    });
}

// Los datos ya están sanitizados
const cleanData = validation.sanitized;
```

### 2. CSRF (Cross-Site Request Forgery)

**¿Qué es?** Solicitud maliciosa desde otro sitio usando credenciales del usuario.

**Mitigaciones:**

#### Backend - CSRF Middleware

```javascript
const CSRFMiddleware = require('./presentation/middleware/csrf');
const csrf = new CSRFMiddleware(logger);

app.use(csrf.generateMiddleware()); // Generar token
app.use(csrf.validateMiddleware()); // Validar token
csrf.startCleanupInterval(); // Limpiar expirados
```

#### Frontend - SecurityService

```javascript
// El token CSRF se incluye automáticamente en requests
SecurityService.secureFetch('/api/invitations', {
    method: 'POST',
    body: JSON.stringify(data)
})
    .then(response => response.json())
    .then(data => console.log(data));

// Acceder al token si es necesario
const token = SecurityService.getCSRFToken();
const newToken = SecurityService.generateCSRFToken();
SecurityService.setCSRFToken(newToken);
```

### 3. Rate Limiting

**¿Qué es?** Protección contra ataques de fuerza bruta y DoS.

**Implementación:**

- General: 1000 requests/15 minutos
- Autenticación: 20 intentos/15 minutos (configurable via `RATE_LIMIT_*` en `.env`)

### 4. Headers de Seguridad

**Helmet** - Establecer headers HTTP seguros:

- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Strict-Transport-Security (HSTS)

**CORS Restringido** - Solo orígenes configurados en `CORS_ALLOWED_ORIGINS`

### 5. Validación de Entrada

**Capas de validación:**

1. **Cliente**: FormValidator con validación en tiempo real
2. **Backend**: ValidationService con reglas de negocio
3. **Sanitización**: SecurityService sanitiza antes de almacenar

---

## 📋 Best Practices

### ✅ Hacer

1. **Siempre sanitizar input del usuario**

```javascript
const name = SecurityService.sanitizeText(userInput);
```

2. **Usar FormValidator para formularios**

```javascript
const validator = new FormValidator(document.getElementById('form'));
if (validator.validate()) {
    // Procesar datos limpios
    const data = validator.getFormData();
}
```

3. **Crear elementos DOM de forma segura**

```javascript
const div = SecurityService.createElement('div', {}, 'Contenido');
// NO: div.innerHTML = userInput
```

4. **Validar URLs**

```javascript
const safeUrl = SecurityService.sanitizeUrl(userUrl);
if (!safeUrl) {
    console.warn('URL potencialmente peligrosa rechazada');
}
```

5. **Usar secureFetch para requests**

```javascript
await SecurityService.secureFetch(url, {
    method: 'POST',
    body: JSON.stringify(data)
});
```

### ❌ Evitar

1. **NO usar innerHTML con datos del usuario**

```javascript
// ❌ PELIGROSO
element.innerHTML = userInput;

// ✅ CORRECTO
element.textContent = SecurityService.sanitizeText(userInput);
```

2. **NO permitir javascript: en URLs**

```javascript
// ❌ PELIGROSO
<a href={userInput}>Click</a>;

// ✅ CORRECTO
const href = SecurityService.sanitizeUrl(userInput);
<a href={href}>Click</a>;
```

3. **NO confiar en validación solo del cliente**

```javascript
// Frontend valida para UX, pero siempre validar en backend
```

4. **NO guardar contraseñas o tokens en localStorage**

```javascript
// localStorage.setItem('password', pwd); // ❌

// Usar cookies httpOnly en su lugar
```

5. **NO loguear datos sensibles**

```javascript
// ❌ SecurityService.logError('Failed', { password: pwd });

// ✅
SecurityService.logError('Failed', { userId: user.id });
```

---

## 🔍 Detección de Amenazas

El `SecurityService` detecta automáticamente:

- Protocolo `javascript:`
- Tags `<script>`
- Event handlers (`onclick=`, etc.)
- Protocolo `data:`
- Funcion `eval()`
- Protocolo `vbscript:`
- Tags `<iframe>`

```javascript
const { isSafe, threat } = SecurityService.detectThreats(userInput);

if (!isSafe) {
    SecurityService.logError(`Amenaza detectada: ${threat}`);
    // Rechazar input
}
```

---

## 🧪 Testing de Seguridad

### Pruebas Manuales

1. **XSS - Test básico**

```
Input: <script>alert('XSS')</script>
Esperado: Mostrar como texto, no ejecutar
```

2. **XSS - Event Handler**

```
Input: <img src=x onerror="alert('XSS')">
Esperado: Rechazado o escapado
```

3. **CSRF - Sin Token**

```
POST /api/invitations
Sin header X-CSRF-Token
Esperado: 403 Forbidden
```

4. **Rate Limit**

```
100+ requests al mismo endpoint en corto tiempo
Esperado: 429 Too Many Requests
```

### Test Automatizados

```javascript
describe('SecurityService', () => {
    it('debe escapar HTML', () => {
        const result = SecurityService.escapeHtml('<script>');
        expect(result).toBe('&lt;script&gt;');
    });

    it('debe detectar XSS', () => {
        const { isSafe } = SecurityService.detectThreats('javascript:alert(1)');
        expect(isSafe).toBe(false);
    });
});
```

---

## 🚀 Despliegue Seguro

### Producción

1. **HTTPS obligatorio**

```env
NODE_ENV=production
FORCE_HTTPS=true
```

2. **Headers HSTS**

```env
HSTS_MAX_AGE=31536000
```

3. **Credenciales seguras**

```env
DASHBOARD_USERNAME=<usuario-unico>
DASHBOARD_PASSWORD=<contraseña-20-caracteres>
```

4. **CORS restrictivo**

```env
CORS_ALLOWED_ORIGINS=https://tumio.com
```

5. **Rate limiting agresivo**

```env
RATE_LIMIT_MAX=500
RATE_LIMIT_WINDOW_MS=600000
```

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN Security](https://developer.mozilla.org/es/docs/Web/Security)

---

**Última actualización:** 2026-03-12
