# Guía de Contribución

## Código de Conducta

Este proyecto se adhiere a un código de conducta basado en el respeto mutuo. Se espera que todos los contribuyentes:
- Sean respetuosos y profesionales
- Acepten críticas constructivas
- Se enfoquen en lo mejor para la comunidad
- Muestren empatía hacia otros miembros

## Cómo Contribuir

### 1. Reportar Bugs

Antes de crear un issue:
- Verifica que el bug no haya sido reportado
- Incluye pasos detallados para reproducir
- Especifica tu entorno (OS, Node version, etc.)
- Agrega screenshots si es relevante

### 2. Sugerir Mejoras

- Abre un issue describiendo la mejora
- Explica por qué sería útil
- Proporciona ejemplos de uso
- Considera la compatibilidad hacia atrás

### 3. Contribuir Código

1. **Fork el repositorio**
2. **Crea una rama** para tu feature: `git checkout -b feature/mi-nueva-funcionalidad`
3. **Haz commits** con mensajes descriptivos
4. **Push** a tu fork: `git push origin feature/mi-nueva-funcionalidad`
5. **Abre un Pull Request**

## Estándares de Código

### Principios Fundamentales

#### 1. DRY (Don't Repeat Yourself)
```javascript
// ❌ MALO - Código duplicado
function formatUserName(user) {
    return user.firstName + ' ' + user.lastName;
}
function formatGuestName(guest) {
    return guest.firstName + ' ' + guest.lastName;
}

// ✅ BUENO - Función reutilizable
function formatFullName(person) {
    return `${person.firstName} ${person.lastName}`;
}
```

#### 2. KISS (Keep It Simple, Stupid)
```javascript
// ❌ MALO - Innecesariamente complejo
const isAdult = (age) => {
    if (age >= 18) {
        return true;
    } else {
        return false;
    }
}

// ✅ BUENO - Simple y directo
const isAdult = (age) => age >= 18;
```

#### 3. SOLID
- **S**ingle Responsibility: Una función = una tarea
- **O**pen/Closed: Extensible sin modificar código existente
- **L**iskov Substitution: Las subclases deben ser intercambiables
- **I**nterface Segregation: Interfaces específicas > generales
- **D**ependency Inversion: Depender de abstracciones

### Convenciones de Código

#### Nombres
```javascript
// Variables y funciones: camelCase
const userName = 'Juan';
function calculateTotal() {}

// Clases y constructores: PascalCase
class InvitationService {}

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const API_TIMEOUT = 5000;

// Archivos: kebab-case
// user-service.js
// invitation-modal.js
```

#### Funciones
```javascript
// Máximo 20-30 líneas por función
// Nombres descriptivos y verbos
// JSDoc obligatorio para funciones públicas

/**
 * Valida el formato de un código de invitación
 * @param {string} code - Código a validar
 * @returns {boolean} True si el código es válido
 */
function validateInvitationCode(code) {
    return /^[A-Z0-9]{6}$/.test(code);
}
```

#### Estructura de Archivos
```javascript
// 1. Imports
import { validateEmail } from './utils/validators.js';
import { API_ENDPOINTS } from './constants.js';

// 2. Constantes
const RETRY_DELAY = 1000;

// 3. Funciones auxiliares privadas
function _formatData(data) { }

// 4. Funciones/Clases públicas
export function processInvitation(data) { }

// 5. Exports al final (si no son inline)
export { processInvitation };
```

### Estilo de Código

#### JavaScript
```javascript
// Usar const/let, nunca var
const immutableValue = 42;
let mutableValue = 'hello';

// Preferir arrow functions para callbacks
array.map(item => item * 2);

// Destructuring cuando sea apropiado
const { name, email } = user;

// Template literals para strings
const message = `Hola ${name}, tu email es ${email}`;

// Async/await sobre promises
async function fetchData() {
    try {
        const data = await api.get('/data');
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
```

#### CSS
```css
/* Usar variables CSS */
:root {
    --primary-color: #007bff;
    --spacing-unit: 1rem;
}

/* BEM para naming */
.invitation-card {}
.invitation-card__header {}
.invitation-card__header--active {}

/* Mobile-first */
.element {
    /* Estilos mobile */
}

@media (min-width: 768px) {
    .element {
        /* Estilos desktop */
    }
}
```

### Manejo de Errores

```javascript
// Siempre manejar errores explícitamente
try {
    const result = await riskyOperation();
    return result;
} catch (error) {
    // Log detallado para debugging
    console.error('Error in riskyOperation:', {
        error: error.message,
        stack: error.stack,
        context: { /* datos relevantes */ }
    });
    
    // Mensaje amigable para el usuario
    throw new Error('No se pudo completar la operación');
}

// Crear clases de error personalizadas
class ValidationError extends Error {
    constructor(field, value) {
        super(`Valor inválido para ${field}: ${value}`);
        this.name = 'ValidationError';
        this.field = field;
        this.value = value;
    }
}
```

### Testing

#### Estructura de Tests
```javascript
describe('InvitationService', () => {
    describe('createInvitation', () => {
        it('should create invitation with valid data', async () => {
            // Arrange
            const data = { /* ... */ };
            
            // Act
            const result = await service.createInvitation(data);
            
            // Assert
            expect(result).toHaveProperty('code');
            expect(result.code).toHaveLength(6);
        });
        
        it('should throw error with invalid data', async () => {
            // Test de caso de error
        });
    });
});
```

#### Cobertura Mínima
- Funciones críticas: 90%
- Utilidades: 80%
- Componentes UI: 70%

### Documentación

#### JSDoc
```javascript
/**
 * Servicio para gestionar invitaciones
 * @class
 */
class InvitationService {
    /**
     * Crea una nueva invitación
     * @param {Object} data - Datos de la invitación
     * @param {string[]} data.guestNames - Nombres de los invitados
     * @param {number} data.tableNumber - Número de mesa
     * @returns {Promise<Invitation>} Invitación creada
     * @throws {ValidationError} Si los datos son inválidos
     * @example
     * const invitation = await service.create({
     *   guestNames: ['Juan', 'María'],
     *   tableNumber: 5
     * });
     */
    async create(data) { }
}
```

#### README para nuevas features
Cada nueva funcionalidad debe incluir:
- Descripción de la funcionalidad
- Cómo usarla
- Configuración necesaria
- Ejemplos de código

### Git Workflow

#### Commits
```bash
# Formato de mensaje
<tipo>(<alcance>): <descripción corta>

<descripción detallada opcional>

<referencias a issues>

# Tipos
feat: Nueva funcionalidad
fix: Corrección de bug
docs: Cambios en documentación
style: Cambios de formato (no afectan funcionalidad)
refactor: Refactorización de código
test: Agregar o modificar tests
chore: Tareas de mantenimiento

# Ejemplos
feat(invitations): agregar validación de email
fix(admin): corregir error al exportar CSV
docs(api): actualizar documentación de endpoints
```

#### Branches
```bash
# Features
feature/nombre-descriptivo

# Bugfixes
fix/descripcion-del-bug

# Hotfixes
hotfix/problema-critico
```

### Code Review Checklist

Antes de aprobar un PR, verificar:

- [ ] El código sigue las convenciones del proyecto
- [ ] Hay tests para la nueva funcionalidad
- [ ] La documentación está actualizada
- [ ] No hay código comentado o console.logs
- [ ] El código es DRY y KISS
- [ ] Los nombres son descriptivos
- [ ] El manejo de errores es apropiado
- [ ] No hay vulnerabilidades de seguridad obvias
- [ ] El rendimiento es aceptable
- [ ] Es compatible con el código existente

### Performance Guidelines

#### Optimizaciones Obligatorias
```javascript
// Debounce para eventos frecuentes
const debouncedSearch = debounce(searchFunction, 300);
input.addEventListener('input', debouncedSearch);

// Lazy loading para imágenes
<img loading="lazy" src="image.jpg" alt="Descripción">

// Memoización para cálculos costosos
const memoizedCalculation = useMemo(() => {
    return expensiveCalculation(data);
}, [data]);
```

#### Evitar
- Manipulación excesiva del DOM
- Loops anidados innecesarios
- Operaciones síncronas bloqueantes
- Memory leaks (limpiar event listeners)

### Seguridad

#### Validación de Entrada
```javascript
// Siempre validar y sanitizar entrada del usuario
function sanitizeInput(input) {
    return input
        .trim()
        .replace(/[<>]/g, '') // Prevenir XSS básico
        .slice(0, MAX_LENGTH); // Limitar longitud
}

// Usar bibliotecas especializadas cuando sea posible
import validator from 'validator';
if (!validator.isEmail(email)) {
    throw new ValidationError('Email inválido');
}
```

#### Nunca hacer
- Guardar contraseñas en texto plano
- Confiar en validación solo del cliente
- Exponer información sensible en logs
- Usar eval() o innerHTML con datos del usuario

## Proceso de Release

1. Actualizar CHANGELOG.md
2. Actualizar versión en package.json
3. Crear tag: `git tag -a v1.0.0 -m "Release version 1.0.0"`
4. Push tag: `git push origin v1.0.0`
5. Crear release en GitHub

## Recursos Útiles

- [MDN Web Docs](https://developer.mozilla.org/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Contacto

Para preguntas sobre contribución:
- Abrir un issue con la etiqueta `question`
- Revisar issues existentes primero
- Ser específico y proporcionar contexto
