# API Reference

## Base URL
```
http://localhost:3000/api
```

## Autenticación

El panel de administración requiere autenticación HTTP Basic:

```http
Authorization: Basic base64(username:password)
```

## Endpoints

### 🔐 Autenticación
- **Tipo**: Basic Auth
- **Credenciales**: `admin:admin123`
- **Header**: `Authorization: Basic YWRtaW46YWRtaW4xMjM=`

### 📨 Invitaciones

#### GET /api/invitations
Obtiene todas las invitaciones con filtros y paginación.

**Parámetros de consulta:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10, max: 100)
- `status` (opcional): Filtrar por estado
- `confirmed` (opcional): true/false para filtrar confirmadas
- `search` (opcional): Buscar por nombre de invitado
- `sortBy` (opcional): Campo para ordenar (default: createdAt)
- `sortOrder` (opcional): asc/desc (default: desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "code": "ABC123",
      "guestNames": ["Juan García", "María López"],
      "guestTypes": ["Adulto", "Adulto"],
      "numberOfPasses": 2,
      "tableNumber": 5,
      "email": "juan@email.com",
      "phone": "+521234567890",
      "createdAt": "2024-01-01T10:00:00Z",
      "confirmed": true,
      "confirmedPasses": 2,
      "confirmationDate": "2024-01-15T14:30:00Z",
      "status": ""
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

#### GET /api/invitation/:code
Obtiene una invitación específica por su código.

**Parameters:**
- `code` (string): Código único de la invitación

**Response:**
```json
{
  "code": "ABC123",
  "guestNames": ["Juan García", "María López"],
  "numberOfPasses": 2,
  "tableNumber": 5,
  "confirmed": false,
  "status": ""
}
```

**Error Response:**
```json
{
  "error": "Invitación no encontrada"
}
```

#### POST /api/invitations
Crea una nueva invitación.

**Request Body:**
```json
{
  "guests": [
    { "name": "Juan García", "type": "Adulto" },
    { "name": "María López", "type": "Adulto" }
  ],
  "tableNumber": 5,
  "email": "juan@email.com",
  "phone": "+521234567890"
}
```

**Response:**
```json
{
  "success": true,
  "invitation": {
    "code": "XYZ789",
    "guestNames": ["Juan García", "María López"],
    "guestTypes": ["Adulto", "Adulto"],
    "numberOfPasses": 2,
    "tableNumber": 5,
    "invitationUrl": "http://localhost:3000/invitacion?invitation=XYZ789"
  }
}
```

#### PUT /api/invitations/:code
Actualiza una invitación existente.

**Parameters:**
- `code` (string): Código de la invitación

**Request Body:**
```json
{
  "guests": [
    { "name": "Juan García", "type": "Adulto" },
    { "name": "María López", "type": "Adulto" },
    { "name": "Pedrito García", "type": "Niño" }
  ],
  "tableNumber": 6,
  "email": "nuevo@email.com",
  "phone": "+521234567891"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitación actualizada correctamente"
}
```

#### PUT /api/invitation/:code/deactivate
Desactiva una invitación (la marca como inactiva).

**Parameters:**
- `code` (string): Código de la invitación

**Request Body:**
```json
{
  "deactivatedBy": "admin",
  "deactivationReason": "Motivo de desactivación (opcional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitación desactivada exitosamente"
}
```

#### PUT /api/invitation/:code/activate
Activa una invitación previamente desactivada.

**Parameters:**
- `code` (string): Código de la invitación

**Response:**
```json
{
  "success": true,
  "message": "Invitación activada exitosamente"
}
```

### Confirmaciones

#### POST /api/confirm
Registra la confirmación de asistencia de un invitado.

**Request Body:**
```json
{
  "code": "ABC123",
  "willAttend": true,
  "attendingGuests": 2,
  "attendingNames": ["Juan García", "María López"],
  "email": "juan@email.com",
  "phone": "+521234567890",
  "dietaryRestrictions": "Vegetariano",
  "message": "¡Muchas gracias por la invitación!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Confirmación registrada exitosamente"
}
```

**Error Response:**
```json
{
  "error": "Código de invitación inválido"
}
```

#### PUT /api/invitations/:code/confirmation
Actualiza la confirmación de una invitación (solo admin).

**Parameters:**
- `code` (string): Código de la invitación

**Request Body:**
```json
{
  "willAttend": false,
  "attendingGuests": 0,
  "attendingNames": [],
  "message": "No podremos asistir"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Confirmación actualizada correctamente"
}
```

### Estadísticas

#### GET /api/stats
Obtiene estadísticas generales del evento con estructura optimizada sin duplicaciones.

**Autenticación requerida**: Sí

**Response:**
```json
{
  "success": true,
  "stats": {
    "invitations": {
      "total": 4,
      "confirmed": 0,
      "pending": 4,
      "cancelled": 0,
      "inactive": 0,
      "totalPasses": 6
    },
    "confirmations": {
      "totalConfirmedGuests": 0,
      "pendingPasses": 6,
      "withDietaryRestrictions": 0,
      "withMessages": 0,
      "withPhone": 0,
      "byType": {
        "adult": 0,
        "child": 0,
        "staff": 0
      }
    },
    "rates": {
      "confirmationRate": "0.00",
      "attendanceRate": "0.00"
    },
    "passDistribution": {
      "activeAdultPasses": 4,
      "activeChildPasses": 2,
      "activeStaffPasses": 0,
      "totalActivePasses": 6,
      "confirmedAdultPasses": 0,
      "confirmedChildPasses": 0,
      "confirmedStaffPasses": 0,
      "totalAdultPasses": 4,
      "totalChildPasses": 2,
      "totalStaffPasses": 0
    }
  }
}
```

**Estructura optimizada:**
- **invitations**: Datos sobre invitaciones (total, estados, pases)
- **confirmations**: Datos sobre confirmaciones y tipos de invitados
- **rates**: Tasas calculadas como porcentajes

**Notas importantes:**
- Estructura sin duplicaciones para mejor rendimiento
- Las estadísticas se calculan únicamente desde el archivo `invitations.csv`
- Los campos `confirmed`, `confirmedPasses` en invitaciones determinan el estado
- Las tasas se calculan como porcentajes con 2 decimales
- Eliminadas redundancias de la estructura anterior

### Importación/Exportación

#### POST /api/import
Importa invitaciones desde un archivo CSV.

**Request Body (multipart/form-data):**
- `file`: Archivo CSV con las invitaciones

**CSV Format:**
```csv
Invitado1,Tipo1,Invitado2,Tipo2,Pases,Mesa,Email,Telefono
"Juan García","Adulto","María López","Adulto",2,5,juan@email.com,+521234567890
```

**Response:**
```json
{
  "success": true,
  "imported": 10,
  "errors": [],
  "invitations": [
    {
      "code": "ABC123",
      "guestNames": ["Juan García", "María López"],
      "invitationUrl": "http://localhost:3000/invitacion?invitation=ABC123"
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "imported": 8,
  "errors": [
    {
      "row": 3,
      "error": "Número de pases no coincide con invitados"
    },
    {
      "row": 5,
      "error": "Mesa debe ser un número"
    }
  ]
}
```

#### POST /api/invitations/import ⭐
Importa invitaciones en lote.

**Request Body:**
```json
{
  "invitations": [
    {
      "guestNames": ["Juan Pérez"],
      "numberOfPasses": 2,
      "tableNumber": 5,
      "phone": "+521234567890"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "success": [...], 
    "errors": [...]   
  },
  "message": "Importación completada: 5 exitosas, 2 fallidas"
}
```

#### GET /api/invitations/export
Exporta todas las invitaciones.

**Parámetros de consulta:**
- `format` (opcional): json/csv (default: json)

**Response:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="invitaciones_export.csv"`

#### GET /api/invitations/stats
Obtiene estadísticas de invitaciones.

#### GET /api/invitations/search/:name
Busca invitaciones por nombre de invitado.

#### DELETE /api/invitations/:code
Elimina una invitación (soft delete).

**Parameters:**
- `code` (string): Código de la invitación

**Request Body:**
```json
{
  "reason": "Motivo de eliminación"
}
```

### Utilidades

#### GET /api/health
Verifica el estado del servidor.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T10:00:00Z"
}
```

## Códigos de Estado HTTP

- `200 OK`: Solicitud exitosa
- `201 Created`: Recurso creado exitosamente
- `400 Bad Request`: Error en los datos enviados
- `401 Unauthorized`: Falta autenticación o es inválida
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto (ej: código duplicado)
- `500 Internal Server Error`: Error del servidor

## Manejo de Errores

Todos los errores siguen el formato:

```json
{
  "error": "Descripción del error",
  "details": "Información adicional (opcional)"
}
```

## Límites y Restricciones

- **Tamaño máximo de archivo CSV**: 5MB
- **Máximo de invitaciones por importación**: 1000
- **Longitud del código de invitación**: 6 caracteres
- **Caracteres permitidos en nombres**: Letras, espacios, acentos
- **Formato de teléfono**: Debe incluir código de país

## Ejemplos de Uso

### Crear una invitación con cURL
```bash
curl -X POST http://localhost:3000/api/invitations \
  -u admin:password \
  -H "Content-Type: application/json" \
  -d '{
    "guests": [
      {"name": "Juan García", "type": "Adulto"},
      {"name": "María López", "type": "Adulto"}
    ],
    "tableNumber": 5,
    "email": "juan@email.com"
  }'
```

### Confirmar asistencia
```bash
curl -X POST http://localhost:3000/api/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ABC123",
    "willAttend": true,
    "attendingGuests": 2,
    "attendingNames": ["Juan García", "María López"],
    "message": "¡Gracias por la invitación!"
  }'
```

### Obtener estadísticas
```bash
curl -X GET http://localhost:3000/api/stats \
  -u admin:password
```

## Notas de Implementación

### Validaciones
- Los códigos de invitación son únicos y generados aleatoriamente
- Los emails son validados con regex básico
- Los números de teléfono deben empezar con '+'
- El número de pases debe coincidir con la cantidad de invitados

### Seguridad
- Usar HTTPS en producción
- Las credenciales de admin deben ser seguras
- Considerar implementar rate limiting
- Sanitizar todas las entradas de usuario

### Performance
- Las operaciones CSV pueden ser lentas con muchos registros
- Considerar caché para estadísticas
- Implementar paginación para listas grandes
