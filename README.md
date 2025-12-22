# Invitación de Boda SPA

Una aplicación web SPA (Single Page Application) moderna y elegante para invitaciones de boda con funcionalidades avanzadas.

## 🌟 Características

- **Diseño Mobile-First Responsive**: Optimizado para todos los dispositivos
- **Confirmación de Asistencia**: Formulario integrado que guarda en Google Sheets
- **Recordatorios por WhatsApp**: Sistema automatizado usando Twilio
- **Galería de Fotos**: Los invitados pueden subir fotos que se guardan en Google Drive
- **Mapa Interactivo**: Integración con Google Maps
- **Panel de Administración**: Control total sobre invitados y confirmaciones
- **Cuenta Regresiva**: Timer dinámico hasta el día de la boda

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- Cuenta de Google Cloud Platform
- Cuenta de Twilio (para WhatsApp)
- Editor de código (recomendado: VS Code)

## 🚀 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd invitacion-boda
```

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 3. Configuración de servicios

#### Google Cloud Platform

1. Crear un proyecto en [Google Cloud Console](https://console.cloud.google.com/)
2. Habilitar las APIs:
   - Google Sheets API
   - Google Drive API
   - Google Maps JavaScript API

3. Crear una cuenta de servicio:
   - Ve a "IAM y administración" > "Cuentas de servicio"
   - Crear nueva cuenta de servicio
   - Descargar el archivo JSON de credenciales
   - Guardarlo como `backend/credentials/google-service-account.json`

4. Crear una hoja de cálculo en Google Sheets:
   - Crear nueva hoja en Google Sheets
   - Copiar el ID de la URL (está entre `/d/` y `/edit`)
   - Compartir la hoja con el email de la cuenta de servicio

#### Twilio (WhatsApp)

1. Crear cuenta en [Twilio](https://www.twilio.com)
2. Configurar WhatsApp Sandbox:
   - Ir a Messaging > Try it out > Send a WhatsApp message
   - Seguir las instrucciones para activar el sandbox
3. Obtener credenciales:
   - Account SID
   - Auth Token
   - WhatsApp number (sandbox: +14155238886)

### 4. Configurar variables de entorno

1. Copiar el archivo de ejemplo:
```bash
cp backend/.env.example backend/.env
```

2. Editar `backend/.env` con tus credenciales:
```env
# Server
PORT=3000

# Google APIs
GOOGLE_SHEETS_ID=tu_id_de_hoja_de_calculo
GOOGLE_DRIVE_FOLDER_ID=tu_id_de_carpeta_opcional

# Twilio
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Google Maps
GOOGLE_MAPS_API_KEY=tu_api_key_de_maps

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_contraseña_segura
```

### 5. Personalizar la invitación

Editar los siguientes archivos para personalizar tu invitación:

#### `index.html`
- Cambiar "Nombre & Pareja" por los nombres reales
- Actualizar fecha, hora y ubicaciones
- Modificar el hashtag de la boda

#### `app.js`
- Actualizar la configuración en el objeto `CONFIG`:
```javascript
const CONFIG = {
    weddingDate: new Date('2024-06-15T16:00:00'), // Tu fecha
    googleMapsApiKey: 'YOUR_API_KEY',
    location: {
        lat: 19.4326, // Coordenadas del lugar
        lng: -99.1332,
        name: 'Salón Crystal',
        address: 'Calle Elegante #456, Ciudad'
    }
};
```

#### `styles.css`
- Modificar colores en las variables CSS si lo deseas

## 🏃‍♂️ Ejecutar la aplicación

1. Iniciar el servidor:
```bash
cd backend
npm start
```

2. Abrir en el navegador:
- Frontend: http://localhost:3000
- Panel Admin: http://localhost:3000/admin.html

## 📱 Uso

### Para invitados:
1. Acceder a la invitación
2. Navegar por las secciones
3. Confirmar asistencia
4. Subir fotos del evento

### Para administradores:
1. Acceder a `/admin.html`
2. Iniciar sesión (usuario: admin, contraseña: la configurada)
3. Gestionar confirmaciones
4. Enviar recordatorios
5. Ver estadísticas

## 🔧 Características técnicas

- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Backend**: Node.js, Express
- **Base de datos**: Google Sheets
- **Almacenamiento**: Google Drive
- **Mensajería**: Twilio WhatsApp API
- **Mapas**: Google Maps API

## 📝 Estructura del proyecto

```
invitacion-boda/
├── index.html          # Página principal
├── admin.html          # Panel de administración
├── styles.css          # Estilos principales
├── admin-styles.css    # Estilos del admin
├── app.js              # Lógica del frontend
├── admin.js            # Lógica del admin
└── backend/
    ├── server.js       # Servidor Express
    ├── package.json    # Dependencias
    ├── .env            # Variables de entorno
    └── services/       # Servicios de integración
        ├── googleSheets.js
        ├── googleDrive.js
        └── whatsapp.js
```

## 🚀 Despliegue en producción

### Opción 1: Heroku
1. Crear cuenta en Heroku
2. Instalar Heroku CLI
3. Crear nueva app
4. Configurar variables de entorno
5. Deploy con Git

### Opción 2: VPS (DigitalOcean, AWS, etc)
1. Configurar servidor con Node.js
2. Usar PM2 para mantener la app activa
3. Configurar Nginx como proxy reverso
4. Obtener certificado SSL con Let's Encrypt

### Opción 3: Vercel/Netlify (solo frontend estático)
- Separar frontend y backend
- Desplegar backend en Heroku
- Frontend en Vercel/Netlify

## 🐛 Solución de problemas

### Error de autenticación de Google
- Verificar que el archivo de credenciales esté en la ubicación correcta
- Confirmar que las APIs estén habilitadas
- Verificar que la hoja esté compartida con la cuenta de servicio

### WhatsApp no envía mensajes
- Verificar credenciales de Twilio
- Confirmar que el número esté en formato internacional
- Revisar el sandbox de WhatsApp

### Las fotos no se suben
- Verificar permisos de Google Drive
- Confirmar que el ID de carpeta sea correcto
- Revisar límite de tamaño de archivo (10MB)

## 📄 Licencia

Este proyecto está bajo licencia MIT. Puedes usarlo libremente para tu boda.

## 💝 Créditos

Desarrollado con amor para hacer tu día especial aún más memorable.

---

¡Felicidades por tu boda! 🎉💑
