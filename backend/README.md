# Wedding Invitation Backend

Sistema backend para gestión de invitaciones de boda implementado con Clean Architecture y principios SOLID.

## 🏗️ Arquitectura

El proyecto sigue los principios de **Clean Architecture** organizando el código en capas bien definidas:

```
backend/src/
├── core/                    # Capa de Dominio
│   ├── entities/           # Entidades de negocio
│   └── repositories/       # Interfaces de repositorios
├── application/            # Capa de Aplicación
│   └── usecases/          # Casos de uso
├── infrastructure/         # Capa de Infraestructura
│   └── repositories/      # Implementaciones de repositorios
├── presentation/          # Capa de Presentación
│   ├── controllers/       # Controladores REST
│   ├── routes/           # Configuración de rutas
│   └── middleware/       # Middleware de seguridad
├── shared/               # Servicios compartidos
│   └── utils/           # Utilidades y servicios
└── tests/               # Tests unitarios
```

## 🚀 Características

### Principios SOLID Implementados

- **Single Responsibility**: Cada clase tiene una responsabilidad específica
- **Open/Closed**: Extensible sin modificar código existente
- **Liskov Substitution**: Interfaces bien definidas
- **Interface Segregation**: Interfaces específicas y cohesivas
- **Dependency Inversion**: Dependencias hacia abstracciones

### Funcionalidades

- ✅ **Gestión de Invitaciones**: CRUD completo con validaciones
- ✅ **Confirmación de Asistencia**: Sistema de confirmación robusto
- ✅ **Autenticación y Autorización**: JWT y Basic Auth
- ✅ **Validación y Sanitización**: Protección contra XSS y ataques
- ✅ **Rate Limiting**: Protección contra ataques de fuerza bruta
- ✅ **Logging Estructurado**: Sistema de logs detallado
- ✅ **Paginación y Filtros**: Consultas optimizadas
- ✅ **Exportación/Importación**: Soporte para CSV
- ✅ **Estadísticas**: Dashboard con métricas
- ✅ **Tests Unitarios**: Cobertura de código

## 📦 Instalación

### Prerrequisitos

- Node.js 16+ 
- npm o yarn

### Configuración

1. **Instalar dependencias**:
```bash
npm install
```

2. **Configurar variables de entorno**:
```bash
cp .env.example .env
```

3. **Variables de entorno disponibles**:
```env
# Servidor
PORT=3001
NODE_ENV=development

# Seguridad
JWT_SECRET=your-secret-key
ADMIN_PASSWORD=your-admin-password

# Archivos CSV
CSV_INVITATIONS_PATH=./data/invitations.csv
CSV_CONFIRMATIONS_PATH=./data/confirmations.csv

# Logging
LOG_LEVEL=info

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 🔧 Uso

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Ejecutar tests
npm test

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar tests en modo watch
npm run test:watch

# Linting
npm run lint

# Formatear código
npm run format
```

### Producción

```bash
# Construir para producción
npm run build

# Iniciar servidor de producción
npm start
```

## 📚 API Documentation

### Endpoints Principales

#### Invitaciones

```http
GET    /api/invitations/:code          # Obtener invitación
POST   /api/invitations               # Crear invitación (admin)
PUT    /api/invitations/:code         # Actualizar invitación (admin)
DELETE /api/invitations/:code         # Eliminar invitación (admin)
GET    /api/invitations               # Listar invitaciones (admin)
GET    /api/invitations/stats         # Estadísticas (admin)
POST   /api/invitations/import        # Importar CSV (admin)
GET    /api/invitations/export        # Exportar datos (admin)
```

#### Confirmaciones

```http
POST   /api/confirmations/:code       # Confirmar asistencia
GET    /api/confirmations/:code       # Obtener confirmación
PUT    /api/confirmations/:code       # Actualizar confirmación
DELETE /api/confirmations/:code       # Cancelar confirmación (admin)
GET    /api/confirmations             # Listar confirmaciones (admin)
GET    /api/confirmations/stats       # Estadísticas (admin)
GET    /api/confirmations/positive    # Confirmaciones positivas (admin)
GET    /api/confirmations/negative    # Confirmaciones negativas (admin)
```

#### Autenticación

```http
POST   /auth/login                    # Login admin
GET    /auth/verify                   # Verificar token
```

#### Utilidades

```http
GET    /health                        # Health check
GET    /api/dashboard/stats           # Estadísticas generales (admin)
```

### Autenticación

#### JWT Token
```http
Authorization: Bearer <token>
```

#### Basic Auth
```http
Authorization: Basic <base64(username:password)>
```

### Ejemplos de Uso

#### Crear Invitación
```bash
curl -X POST http://localhost:3001/api/invitations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "guestNames": ["Juan Pérez", "María García"],
    "numberOfPasses": 2,
    "phone": "+1234567890"
  }'
```

#### Confirmar Asistencia
```bash
curl -X POST http://localhost:3001/api/confirmations/INV001 \
  -H "Content-Type: application/json" \
  -d '{
    "willAttend": true,
    "attendingGuests": 2,
    "attendingNames": ["Juan Pérez", "María García"],
    "phone": "+1234567890",
    "dietaryRestrictions": "Vegetariano",
    "message": "¡Nos vemos en la boda!"
  }'
```

## 🧪 Testing

### Estructura de Tests

```
src/tests/
├── unit/
│   ├── entities/          # Tests de entidades
│   ├── usecases/         # Tests de casos de uso
│   ├── repositories/     # Tests de repositorios
│   └── controllers/      # Tests de controladores
├── integration/          # Tests de integración
├── setup.js             # Configuración global
└── env.js              # Variables de entorno para tests
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests específicos
npm test -- --testPathPattern=entities

# Con cobertura
npm run test:coverage

# En modo watch
npm run test:watch
```

### Cobertura de Código

El proyecto mantiene un mínimo de 70% de cobertura en:
- Líneas de código
- Funciones
- Ramas
- Declaraciones

## 🔒 Seguridad

### Medidas Implementadas

- **Helmet**: Headers de seguridad HTTP
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **CORS**: Configuración de orígenes permitidos
- **Input Validation**: Validación y sanitización de datos
- **JWT Authentication**: Tokens seguros para autenticación
- **Request Logging**: Monitoreo de todas las solicitudes
- **Error Handling**: Manejo seguro de errores

### Configuración de Seguridad

```javascript
// Rate limiting
windowMs: 15 * 60 * 1000,  // 15 minutos
max: 100,                   // 100 requests por ventana

// JWT
expiresIn: '24h',          // Tokens válidos por 24 horas

// CORS
allowedOrigins: [
  'http://localhost:3000',
  'https://yourdomain.com'
]
```

## 📊 Monitoring y Logging

### Sistema de Logs

El sistema utiliza logging estructurado con diferentes niveles:

- **ERROR**: Errores críticos
- **WARN**: Advertencias
- **INFO**: Información general
- **DEBUG**: Información de depuración

### Métricas Disponibles

- Total de invitaciones
- Confirmaciones por tipo
- Tasa de confirmación
- Tasa de asistencia
- Invitados confirmados
- Restricciones dietarias
- Mensajes para los novios

## 🚀 Deployment

### Variables de Entorno de Producción

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=<strong-secret-key>
ADMIN_PASSWORD=<secure-password>
LOG_LEVEL=warn
```

### Docker (Opcional)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 Contribución

### Estándares de Código

- **ESLint**: Linting de código
- **Prettier**: Formateo automático
- **Conventional Commits**: Formato de commits
- **Clean Architecture**: Principios arquitectónicos
- **SOLID**: Principios de diseño

### Flujo de Desarrollo

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'feat: agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Para reportar bugs o solicitar nuevas funcionalidades, por favor crear un issue en el repositorio.

---

**Desarrollado con ❤️ para hacer las bodas más especiales**
