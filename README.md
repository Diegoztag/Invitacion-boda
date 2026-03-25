# 💒 Sistema de Invitaciones de Boda Digital

Sistema web completo para gestionar invitaciones digitales personalizadas de boda con confirmación de asistencia.

## 🌟 Características

- **Invitaciones Personalizadas**: Cada invitado recibe un enlace único con su código de invitación
- **Sistema de Confirmación**: Los invitados pueden confirmar asistencia indicando cuántos pases usarán
- **Panel de Administración**: Dashboard completo para gestionar invitaciones y ver estadísticas
- **Base de Datos Local**: Archivos CSV como base de datos (no requiere servicios externos)
- **Carga Masiva**: Importa múltiples invitaciones desde un archivo CSV
- **Mesa de Regalos**: Sección con enlaces a tiendas y datos bancarios
- **Hashtag de Instagram**: Para que los invitados compartan fotos del evento
- **Diseño Responsivo**: Funciona perfectamente en móviles y computadoras
- **Sistema de Estados**: Gestión de invitaciones activas/inactivas y confirmaciones
- **Arquitectura Modular**: Código organizado y mantenible

## 📚 Documentación

Para desarrolladores y contribuidores:

- **[docs/](./docs/)** - Documentación técnica completa
    - [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Arquitectura del sistema
    - [API.md](./docs/API.md) - Documentación de la API
    - [BUSINESS_RULES.md](./docs/BUSINESS_RULES.md) - Reglas de negocio
    - [TECHNICAL_ROADMAP.md](./docs/TECHNICAL_ROADMAP.md) - Estado actual y roadmap
    - [CONTRIBUTING.md](./docs/CONTRIBUTING.md) - Guía de contribución
    - [SETUP.md](./docs/SETUP.md) - Configuración detallada
    - [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Guía de despliegue

## 🚀 Instalación Rápida

### 1. Requisitos Previos

- Node.js v14 o superior
- Un navegador web moderno

### 2. Clonar el Proyecto

```bash
git clone https://github.com/tu-usuario/invitacion-boda.git
cd invitacion-boda
```

### 3. Instalar Dependencias

Desde la raíz del proyecto, ejecuta:

```bash
npm install
```

Este comando instalará las dependencias tanto del `frontend` como del `backend`.

### 4. Configurar Variables de Entorno

1.  Ve a la carpeta `backend`: `cd backend`
2.  Copia el archivo de ejemplo: `cp .env.example .env`
3.  Edita el archivo `.env` con tus datos:

```env
# Puerto del servidor
PORT=3000

# Credenciales del panel de administración
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_contraseña_segura_aqui
```

### 5. Ejecutar en Desarrollo

Desde la raíz del proyecto, ejecuta:

```bash
npm run dev
```

Esto iniciará:

- El servidor del `backend` en `http://localhost:3000`
- Un servidor de desarrollo para el `frontend` con recarga automática.

### 6. Ejecutar Pruebas

Desde la raíz del proyecto:

```bash
# Ejecutar pruebas del frontend
npm run test:frontend

# Ejecutar pruebas del backend
npm run test:backend
```

### 7. Linting y Formateo de Código

Desde la raíz del proyecto:

```bash
# Revisar errores de linting
npm run lint

# Corregir automáticamente errores de linting
npm run lint:fix

# Formatear código con Prettier
npm run format
```

### 8. Personalizar la Invitación

Edita el archivo `frontend/public/config.js`.

## 🚀 Despliegue en Producción

Sigue las instrucciones en [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## 🛡️ Seguridad

- **Sin conexión externa**: Los datos nunca salen de tu servidor
- **Encriptación en tránsito**: HTTPS obligatorio en producción
- **Validación completa**: Frontend y backend validan todos los datos
- **Protección contra XSS**: Todos los inputs se sanitizan
- **Protección contra CSRF**: Tokens automáticos en POST/PUT/DELETE
- **Rate limiting**: Límite de intentos para prevenir ataques

Para más detalles, ver [docs/SECURITY_GUIDE.md](./docs/SECURITY_GUIDE.md).

## 🏗️ Arquitectura

El proyecto sigue una arquitectura de monorepo, con una clara separación entre el `frontend` y el `backend`.

```
invitacion-boda/
├── backend/              # Servidor Node.js/Express
├── frontend/             # Aplicaciones cliente
│   ├── invitation/       # Página pública de confirmación
│   ├── dashboard/        # Panel administrativo
│   └── ...
├── data/                 # Archivos CSV (generados por el backend)
├── docs/                 # Documentación técnica
└── ...
```

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

¡Felicidades por tu boda! 🎉💒
