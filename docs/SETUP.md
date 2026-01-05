# Guía de Configuración y Desarrollo

## Requisitos del Sistema

- **Node.js**: v14.0.0 o superior
- **npm**: v6.0.0 o superior
- **Git**: Para control de versiones
- **Editor de código**: VS Code recomendado

## Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/invitacion-boda.git
cd invitacion-boda
```

### 2. Instalar Dependencias

```bash
cd backend
npm install
cd ..
```

### 3. Configurar Variables de Entorno

```bash
cd backend
cp .env.example .env
```

Editar `.env` con tus valores:

```env
# Puerto del servidor
PORT=3000

# Credenciales del panel de administración
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_contraseña_segura_aqui

# Configuración de WhatsApp (opcional)
WHATSAPP_API_URL=https://api.whatsapp.com/
WHATSAPP_TOKEN=tu_token_aqui
```

## Desarrollo con Live Reload

Este proyecto incluye un ambiente de desarrollo unificado con live reload integrado.

### Ejecutar en Modo Desarrollo

```bash
npm run dev
# o
npm start
```

Esto ejecutará:
- Frontend y Backend en el mismo puerto: http://localhost:3000
- Live reload integrado que actualiza automáticamente el navegador
- API disponible en http://localhost:3000/api

### Características del Live Reload

- **Servidor unificado**: Todo corre en el puerto 3000
- **Recarga automática**: Cualquier cambio en archivos HTML, CSS, JS se reflejará automáticamente
- **Sin necesidad de F5**: El navegador se actualiza solo cuando guardas cambios
- **Nodemon para el backend**: Los cambios en el servidor también reinician automáticamente

## Scripts Disponibles

```json
{
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "jest",
  "lint": "eslint .",
  "format": "prettier --write ."
}
```

## Estructura del Proyecto

```
invitacion-boda/
├── backend/
│   ├── server.js           # Servidor Express principal
│   ├── services/           # Lógica de negocio
│   │   ├── csvStorage.js   # Manejo de archivos CSV
│   │   └── invitationService.js
│   └── package.json
├── admin/
│   ├── js/                 # JavaScript del panel admin
│   │   ├── components/     # Componentes reutilizables
│   │   ├── services/       # Servicios
│   │   └── admin-*.js      # Módulos específicos
│   └── css/                # Estilos del panel admin
├── data/                   # Archivos CSV (generados)
├── docs/                   # Documentación
├── admin.html              # Panel de administración
├── index.html              # Página de invitación
├── app.js                  # Lógica de la invitación
├── admin.js                # Lógica del panel admin
└── config.js               # Configuración global

```

## Configuración del Editor

### VS Code - Extensiones Recomendadas

- **ESLint**: Linting de JavaScript
- **Prettier**: Formateo de código
- **Live Server**: Preview local (alternativa)
- **GitLens**: Mejor integración con Git

### Configuración Recomendada (.vscode/settings.json)

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000
}
```

## Troubleshooting

### El servidor no inicia

1. Verificar que el puerto 3000 esté libre:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Linux/Mac
   lsof -i :3000
   ```

2. Matar proceso si es necesario:
   ```bash
   # Windows
   taskkill /PID <PID> /F
   
   # Linux/Mac
   kill -9 <PID>
   ```

### Los cambios no se reflejan

1. Limpiar caché del navegador (Ctrl+F5)
2. Verificar que nodemon esté corriendo
3. Revisar la consola por errores

### Errores de permisos en data/

```bash
# Windows (como administrador)
icacls data /grant Everyone:F

# Linux/Mac
chmod 755 data
```

### El live reload no funciona

1. Verificar que el WebSocket esté conectado (ver consola del navegador)
2. Desactivar extensiones del navegador que puedan interferir
3. Probar en modo incógnito

## Debugging

### Debug en VS Code

1. Crear archivo `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/server.js",
      "envFile": "${workspaceFolder}/backend/.env"
    }
  ]
}
```

2. Presionar F5 para iniciar debugging

### Logs de Desarrollo

Los logs se muestran en la consola. Para más detalle:

```javascript
// En server.js
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('Información detallada...');
}
```

## Mejores Prácticas de Desarrollo

1. **Commits frecuentes**: Hacer commits pequeños y descriptivos
2. **Branch por feature**: Crear una rama para cada funcionalidad
3. **Pull requests**: Revisar código antes de merge a main
4. **Tests**: Escribir tests para nuevas funcionalidades
5. **Documentación**: Actualizar docs al agregar features

## Enlaces Útiles

- [Documentación de Express](https://expressjs.com/)
- [Guía de Node.js](https://nodejs.org/docs/)
- [MDN Web Docs](https://developer.mozilla.org/)
