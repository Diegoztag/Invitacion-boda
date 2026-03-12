# Guía de Commits - Conventional Commits

Este proyecto sigue la especificación [Conventional Commits](https://www.conventionalcommits.org/) para mensajes de commits.

## Formato

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Tipos

- **feat**: Una nueva característica
- **fix**: Corrección de un bug
- **docs**: Cambios en documentación
- **style**: Cambios que no afectan el código (formatting, missing semicolons, etc)
- **refactor**: Cambio en código que no corrige bugs ni agrega features
- **perf**: Mejora de rendimiento
- **test**: Agregar o actualizar tests
- **chore**: Cambios en build, dependencies, herramientas, etc
- **ci**: Cambios en configuración de CI/CD

## Scope (Opcional)

Área del código afectada:
- `api`: cambios en rutas/controllers
- `config`: configuración
- `security`: seguridad
- `validation`: validaciones
- `ui`: interfaz de usuario
- `frontend`: cambios en frontend
- `backend`: cambios en backend
- `db`: base de datos/persistencia

## Subject

- Usar imperativo, modo presente: "agregar" no "agregado" ni "agrega"
- No capitalizar la primera letra
- No usar período al final
- Máximo 50 caracteres
- En español preferentemente

## Body (Opcional pero recomendado)

- Explicar el *qué* y el *por qué*, no el *cómo*
- Separar con una línea en blanco del subject
- Máximo 72 caracteres por línea
- Puede tener múltiples párrafos

## Footer (Opcional)

Referencia a issues o breaking changes:
```
Closes #123
Fixes #456
BREAKING CHANGE: descripción del cambio que rompe compatibilidad
```

## Ejemplos

### Ejemplo 1: Feat simple
```
feat(api): agregar endpoint para obtener estadísticas de confirmaciones

El nuevo endpoint GET /api/stats retorna un resumen de confirmaciones,
no asistencias y capacidad disponible para el evento.
```

### Ejemplo 2: Fix
```
fix(validation): corregir validación de teléfono internacional

La expresión regular no aceptaba números con extensiones.
Se actualiza el patrón para soportar formato +1-234-567-8900 ext. 123

Closes #42
```

### Ejemplo 3: Refactor
```
refactor(config): centralizar configuración en src/config/index.js

Mover límites de mesa/invitados de hard-coded a variables de entorno.
Reemplazar imports cruzados de frontend en backend.
```

### Ejemplo 4: Breaking Change
```
feat(api)!: cambiar estructura de respuesta de invitaciones

BREAKING CHANGE: El campo 'attendees' ahora es 'attending_guests'
y usa estructura anidada para mejor claridad.
```

## Beneficios

✅ Historial legible y estructurado
✅ Generar CHANGELOG automáticamente
✅ Determine semantic versioning automáticamente
✅ Facilita code review
✅ Mejor trazabilidad de cambios

## Herramientas

Para automatizar esto, considera usar:
- `commitizen`: CLI interactivo para crear commits válidos
- `commitlint`: Validar commits en pre-commit hooks
