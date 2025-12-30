# Desarrollo con Live Reload

Este proyecto incluye un ambiente de desarrollo unificado con live reload integrado que actualiza automáticamente el navegador cuando haces cambios en los archivos.

## Instalación

1. Instala las dependencias del backend (no hay dependencias en el frontend):
```bash
cd backend
npm install
cd ..
```

## Ejecutar el proyecto

### Un solo comando para todo:

```bash
npm run dev
```
o
```bash
npm start
```

Esto ejecutará el servidor unificado con:
- Frontend y Backend en el mismo puerto: http://localhost:3000
- Live reload integrado que actualiza automáticamente el navegador
- API disponible en http://localhost:3000/api

## Características del Live Reload

- **Servidor unificado**: Todo corre en el puerto 3000
- **Recarga automática**: Cualquier cambio en archivos HTML, CSS, JS se reflejará automáticamente en el navegador
- **Sin necesidad de F5**: El navegador se actualiza solo cuando guardas cambios
- **Nodemon para el backend**: Los cambios en el servidor también reinician automáticamente

## Archivos importantes

- `admin.html` - Panel de administración (página principal)
- `index.html` - Página de invitación
- `app.js` - Lógica de la invitación
- `admin.js` - Lógica del panel admin
- `styles.css` - Estilos de la invitación
- `admin-styles.css` - Estilos del panel admin
- `backend/server.js` - Servidor Express
- `backend/services/` - Servicios del backend

## Notas

- El live reload funciona para todos los archivos estáticos (HTML, CSS, JS)
- Los cambios en el backend requieren reiniciar el servidor (pero nodemon lo hace automáticamente)
- Asegúrate de que los puertos 8080 y 3000 estén libres antes de iniciar
