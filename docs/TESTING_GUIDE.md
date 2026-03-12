# Guía de Testing - Sistema de Invitaciones de Boda

## Resumen

Esta guía describe el estado actual del testing en el sistema de invitaciones de boda, incluyendo los tests unitarios ya implementados en el backend y las estrategias para testing del frontend Clean Architecture.

## 🧪 Estado Actual del Testing

### ✅ Backend - Tests Implementados

El backend ya cuenta con una suite de tests unitarios implementada usando Jest:

#### Estructura de Tests Backend

```
backend/src/tests/
├── setup.js                    # Configuración global de tests
├── env.js                      # Variables de entorno para testing
└── unit/
    ├── entities/
    │   └── Invitation.test.js   # Tests de entidad Invitation
    └── usecases/
        └── CreateInvitationUseCase.test.js  # Tests de caso de uso
```

#### Tests de Entidades

- **Invitation.test.js**: Tests completos para la entidad Invitation
    - Validación de datos de entrada
    - Métodos de negocio
    - Estados de confirmación
    - Manejo de errores

#### Tests de Casos de Uso

- **CreateInvitationUseCase.test.js**: Tests del caso de uso de creación
    - Flujo completo de creación
    - Validaciones de negocio
    - Manejo de errores
    - Mocking de dependencias

#### Configuración Jest

```javascript
// jest.config.js
module.exports = {
    testEnvironment: 'node',
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    testMatch: ['**/tests/**/*.test.js'],
    setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js']
};
```

### 🔄 Frontend - Testing Pendiente

El frontend con Clean Architecture está preparado para testing pero aún no implementado.

## Estructura de Testing

### 1. Testing Manual

#### Verificación de Arquitectura

**✅ Estructura de Archivos**

- [ ] Verificar que todas las carpetas están creadas según la estructura definida
- [ ] Confirmar que todos los archivos están en sus ubicaciones correctas
- [ ] Validar que no hay imports rotos

**✅ Dependency Injection**

- [ ] Verificar que DIContainer se inicializa correctamente
- [ ] Confirmar que todos los servicios se registran
- [ ] Validar que las dependencias se resuelven correctamente

#### Testing de Componentes

**✅ CountdownComponent**

```javascript
// En consola del navegador:
const countdown = new CountdownComponent(document.querySelector('[data-countdown]'), {
    targetDate: '2024-12-31T23:59:59'
});
await countdown.init();
// Verificar que se muestra el countdown correctamente
```

**✅ ModalComponent**

```javascript
// En consola del navegador:
const modal = new ModalComponent(document.querySelector('[data-modal]'));
await modal.init();
modal.show({ title: 'Test', content: 'Testing modal' });
// Verificar que el modal se muestra y funciona
```

**✅ LoaderComponent**

```javascript
// En consola del navegador:
const loader = new LoaderComponent(document.querySelector('[data-loader]'));
await loader.init();
loader.show('Testing...');
// Verificar que el loader se muestra
```

#### Testing de Servicios

**✅ InvitationService**

```javascript
// En consola del navegador:
const invitationService = WeddingApp.getService('invitationService');
const invitation = await invitationService.getInvitation('test-id');
console.log('Invitation:', invitation);
// Verificar que se obtienen datos correctamente
```

**✅ ValidationService**

```javascript
// En consola del navegador:
const validationService = WeddingApp.getService('validationService');
const isValid = validationService.validateEmail('test@example.com');
console.log('Email valid:', isValid);
// Verificar que la validación funciona
```

#### Testing de Controladores

**✅ NavigationController**

```javascript
// En consola del navegador:
const navController = WeddingApp.getController('navigation');
navController.navigateToSection('rsvp');
// Verificar que la navegación funciona
```

**✅ RSVPController**

```javascript
// En consola del navegador:
const rsvpController = WeddingApp.getController('rsvp');
console.log('RSVP State:', rsvpController.getCurrentState());
// Verificar que el controlador RSVP funciona
```

### 2. Testing de Integración

#### Flujo Completo de Usuario

**Escenario 1: Carga de Invitación**

1. [ ] Abrir URL con parámetro `?id=test-invitation`
2. [ ] Verificar que se carga la invitación
3. [ ] Confirmar que se personaliza el contenido
4. [ ] Validar que se actualizan los meta tags

**Escenario 2: Navegación**

1. [ ] Hacer clic en enlaces de navegación
2. [ ] Verificar smooth scroll
3. [ ] Confirmar actualización de URL
4. [ ] Validar highlight de sección activa

**Escenario 3: Formulario RSVP**

1. [ ] Llenar formulario RSVP
2. [ ] Verificar validación en tiempo real
3. [ ] Enviar formulario
4. [ ] Confirmar mensaje de éxito

**Escenario 4: Carrusel de Imágenes**

1. [ ] Verificar autoplay
2. [ ] Probar navegación con botones
3. [ ] Testear swipe en móvil
4. [ ] Confirmar lazy loading de imágenes

### 3. Testing de Rendimiento

#### Métricas a Verificar

**✅ Tiempo de Carga**

```javascript
// Habilitar monitoring en app-config.js
APP_CONFIG.enablePerformanceMonitoring = true;
// Verificar en consola el tiempo de inicialización
```

**✅ Memoria**

```javascript
// En DevTools > Performance
// Verificar que no hay memory leaks
// Confirmar que los event listeners se limpian correctamente
```

### 4. Testing de Compatibilidad

#### Navegadores

- [ ] Chrome (última versión)
- [ ] Firefox (última versión)
- [ ] Safari (última versión)
- [ ] Edge (última versión)

#### Dispositivos

- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### 5. Testing de Errores

#### Manejo de Errores

```javascript
// Simular error de red
// Verificar que se muestra mensaje de error apropiado
// Confirmar que la app no se rompe
```

#### Fallbacks

- [ ] Verificar comportamiento sin JavaScript
- [ ] Confirmar fallbacks para componentes que fallan
- [ ] Validar mensajes de error user-friendly

## Checklist de Testing Completo

### Pre-Testing

- [ ] Backup del código actual
- [ ] Configurar entorno de testing
- [ ] Preparar datos de prueba

### Testing Funcional

- [ ] Todos los componentes funcionan individualmente
- [ ] Todos los servicios responden correctamente
- [ ] Todos los controladores manejan eventos
- [ ] La navegación funciona en todos los escenarios
- [ ] El formulario RSVP procesa datos correctamente
- [ ] Los carruseles funcionan en todos los dispositivos

### Testing de Integración

- [ ] La aplicación se inicializa sin errores
- [ ] Todos los módulos se comunican correctamente
- [ ] Los eventos se propagan entre componentes
- [ ] El estado se mantiene consistente

### Testing de UX

- [ ] Las animaciones son suaves
- [ ] Los tiempos de respuesta son aceptables
- [ ] La interfaz es responsive
- [ ] La accesibilidad está implementada

### Testing de Errores

- [ ] Los errores se manejan gracefully
- [ ] Los mensajes de error son claros
- [ ] La aplicación se recupera de errores
- [ ] No hay console errors en producción

## Scripts de Testing Automatizado

### Testing Básico

```javascript
// test-basic.js
async function testBasicFunctionality() {
    console.log('🧪 Starting basic functionality tests...');

    // Test 1: App initialization
    if (window.WeddingApp && window.WeddingApp.isReady()) {
        console.log('✅ App initialized successfully');
    } else {
        console.error('❌ App failed to initialize');
        return false;
    }

    // Test 2: Services availability
    const services = ['invitationService', 'metaService', 'validationService'];
    for (const service of services) {
        if (window.WeddingApp.getService(service)) {
            console.log(`✅ ${service} available`);
        } else {
            console.error(`❌ ${service} not available`);
            return false;
        }
    }

    // Test 3: Controllers availability
    const controllers = ['navigation', 'content'];
    for (const controller of controllers) {
        if (window.WeddingApp.getController(controller)) {
            console.log(`✅ ${controller} controller available`);
        } else {
            console.error(`❌ ${controller} controller not available`);
            return false;
        }
    }

    console.log('🎉 All basic tests passed!');
    return true;
}

// Ejecutar tests
testBasicFunctionality();
```

### Testing de Componentes

```javascript
// test-components.js
async function testComponents() {
    console.log('🧪 Starting component tests...');

    // Test countdown components
    const countdowns = document.querySelectorAll('[data-countdown]');
    console.log(`Found ${countdowns.length} countdown components`);

    // Test modal components
    const modals = document.querySelectorAll('[data-modal]');
    console.log(`Found ${modals.length} modal components`);

    // Test carousel components
    const carousels = document.querySelectorAll('[data-carousel]');
    console.log(`Found ${carousels.length} carousel components`);

    console.log('🎉 Component discovery completed!');
}

// Ejecutar tests
testComponents();
```

## Resolución de Problemas Comunes

### Error: "Module not found"

- Verificar rutas de imports
- Confirmar que todos los archivos existen
- Validar sintaxis de ES6 modules

### Error: "Service not registered"

- Verificar configuración en dependencies.js
- Confirmar que DIContainer se inicializa
- Validar orden de registro de servicios

### Error: "Controller not initialized"

- Verificar que el contenedor DOM existe
- Confirmar que las dependencias están disponibles
- Validar configuración de opciones

### Performance Issues

- Verificar que se destruyen event listeners
- Confirmar que no hay memory leaks
- Validar lazy loading de componentes

## Métricas de Éxito

### Funcionalidad

- ✅ 100% de componentes funcionando
- ✅ 100% de servicios respondiendo
- ✅ 100% de controladores operativos

### Rendimiento

- ✅ Tiempo de carga < 2 segundos
- ✅ Tiempo de inicialización < 500ms
- ✅ Sin memory leaks detectados

### UX

- ✅ Responsive en todos los dispositivos
- ✅ Animaciones suaves (60fps)
- ✅ Accesibilidad implementada

### Calidad

- ✅ Sin errores en consola
- ✅ Manejo graceful de errores
- ✅ Código limpio y mantenible

---

**Nota**: Este documento debe actualizarse conforme se añadan nuevas funcionalidades o se identifiquen nuevos casos de testing.
