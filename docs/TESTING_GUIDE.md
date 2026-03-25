# 🧪 Guía de Pruebas

## Filosofía de Pruebas

Este proyecto adopta un enfoque pragmático para las pruebas, centrándose en:

1.  **Pruebas Unitarias**: Para la lógica de negocio crítica en el `backend` (entidades, casos de uso) y en el `frontend` (servicios, utilidades).
2.  **Pruebas de Integración**: Para verificar la correcta interacción entre las diferentes capas del `backend`.
3.  **Pruebas E2E (End-to-End)**: (Planificadas) Para simular flujos de usuario completos.

## Herramientas Utilizadas

- **Jest**: Framework de pruebas para JavaScript.
- **Supertest**: Para pruebas de integración de la API del `backend`.
- **JSDOM**: Para simular un entorno de navegador en las pruebas del `frontend`.

## Ejecución de Pruebas

Todos los comandos de prueba deben ejecutarse desde la **raíz del proyecto**.

### Ejecutar Todas las Pruebas

```bash
npm test
```

### Pruebas del Backend

```bash
# Ejecutar todas las pruebas del backend
npm run test:backend

# Ejecutar pruebas en modo "watch"
npm run test:backend:watch

# Generar informe de cobertura
npm run test:backend:coverage
```

### Pruebas del Frontend

```bash
# Ejecutar todas las pruebas del frontend
npm run test:frontend

# Ejecutar pruebas en modo "watch"
npm run test:frontend:watch

# Generar informe de cobertura
npm run test:frontend:coverage
```

## Estructura de las Pruebas

### Backend

Las pruebas del `backend` se encuentran en `backend/src/tests/`.

```
backend/src/tests/
├── setup.js                # Configuración global para las pruebas
├── env.js                  # Variables de entorno específicas para pruebas
├── integration/            # Pruebas de integración
│   └── createConfirmFlow.test.js
└── unit/                   # Pruebas unitarias
    ├── entities/
    ├── usecases/
    └── middleware/
```

- **Pruebas Unitarias**: Se centran en una sola unidad de código (una clase, una función) y utilizan mocks para aislar las dependencias.
- **Pruebas de Integración**: Prueban la interacción entre varias unidades, por ejemplo, un controlador, un caso de uso y un repositorio.

### Frontend

Las pruebas del `frontend` se encuentran junto al código que prueban, en directorios `__tests__`.

```
frontend/invitation/js/
├── core/
│   └── services/
│       ├── __tests__/
│       │   └── validation-service.test.js
│       └── validation-service.js
└── presentation/
    └── controllers/
        ├── __tests__/
        │   └── rsvp-controller.test.js
        └── rsvp-controller.js
```

## Cobertura de Código

Después de ejecutar las pruebas con el script de cobertura, se generará un informe detallado en la carpeta `coverage/` de cada proyecto (`frontend` y `backend`).

Para ver el informe, abre el archivo `coverage/lcov-report/index.html` en tu navegador.

## Pruebas End-to-End (E2E)

Las pruebas E2E aún no se han implementado. La estrategia futura será utilizar un framework como **Cypress** o **Playwright** para automatizar las interacciones del usuario en un navegador real.

### Escenarios a Cubrir

1.  **Flujo de Confirmación de Invitado**:
    - Un usuario abre un enlace de invitación.
    - Ve la información personalizada.
    - Rellena y envía el formulario de confirmación.
    - Recibe un mensaje de éxito.
2.  **Flujo de Administración**:
    - El administrador inicia sesión en el dashboard.
    - Ve la lista de invitaciones.
    - Crea, edita y elimina una invitación.
    - Ve las estadísticas de confirmación actualizadas.
