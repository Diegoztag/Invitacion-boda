# Sistema de Invitaciones de Boda - Diego & Fernanda

Sistema web completo para gestionar invitaciones personalizadas de boda con confirmación de asistencia.

## Características

### Para Invitados
- **Invitaciones Personalizadas**: Cada invitado recibe un enlace único con su nombre y número de pases
- **Confirmación Flexible**: Los invitados pueden confirmar cuántos asistirán de sus pases disponibles
- **Información Completa**: Detalles del evento, ubicación, itinerario y código de vestimenta
- **Subida de Fotos**: Los invitados pueden compartir fotos del evento
- **Diseño Responsivo**: Funciona perfectamente en móviles y computadoras

### Para Administradores
- **Panel de Control**: Dashboard con estadísticas en tiempo real
- **Gestión de Invitaciones**: Crear y administrar invitaciones personalizadas
- **Seguimiento de Confirmaciones**: Ver quién ha confirmado y cuántos asistirán
- **Exportación de Datos**: Descargar lista de confirmaciones en formato CSV
- **Integración con WhatsApp**: Enviar invitaciones directamente por WhatsApp

## Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Base de Datos**: Google Sheets API
- **Almacenamiento**: Google Drive API
- **Notificaciones**: WhatsApp API (Twilio)
- **Mapas**: Google Maps API

## Instalación

### Requisitos Previos
- Node.js (v14 o superior)
- Cuenta de Google Cloud Platform
- Credenciales de servicio de Google

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/Diegoztag/Invitacion-boda.git
cd Invitacion-boda
```

2. **Instalar dependencias del backend**
```bash
cd backend
npm install
```

3. **Configurar variables de entorno**
Crear archivo `backend/.env` con:
```env
PORT=3000
GOOGLE_SHEETS_ID=tu_spreadsheet_id
GOOGLE_DRIVE_FOLDER_ID=tu_folder_id
TWILIO_ACCOUNT_SID=tu_twilio_sid
TWILIO_AUTH_TOKEN=tu_twilio_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

4. **Configurar credenciales de Google**
- Crear proyecto en Google Cloud Console
- Habilitar Google Sheets API y Google Drive API
- Crear cuenta de servicio y descargar JSON
- Guardar como `backend/credentials/google-service-account.json`

5. **Crear Google Spreadsheet**
- Crear nuevo spreadsheet en Google Sheets
- Compartir con el email de la cuenta de servicio
- Copiar el ID del spreadsheet al archivo .env

6. **Iniciar el servidor**
```bash
cd backend
npm start
```

El servidor estará disponible en `http://localhost:3000`

## Uso

### Para Administradores

1. **Acceder al panel de administración**
   - Navegar a `http://localhost:3000/admin.html`

2. **Crear nueva invitación**
   - Ir a "Crear Invitación"
   - Ingresar nombres de invitados
   - Especificar número de pases
   - Opcionalmente agregar email y teléfono

3. **Enviar invitación**
   - En la lista de invitaciones, hacer clic en el ícono de WhatsApp
   - O copiar el enlace único y enviarlo manualmente

4. **Monitorear confirmaciones**
   - Ver el dashboard para estadísticas generales
   - Revisar la sección "Confirmaciones" para detalles

### Para Invitados

1. **Acceder a la invitación**
   - Usar el enlace personalizado recibido
   - Ejemplo: `http://localhost:3000/?invitation=abc123`

2. **Ver información personalizada**
   - La invitación mostrará el nombre del invitado
   - Se indicará el número de pases disponibles

3. **Confirmar asistencia**
   - Seleccionar si asistirán o no
   - Si asisten, indicar cuántos de los pases usarán
   - Proporcionar nombres de los asistentes
   - Agregar información de contacto

4. **Compartir fotos**
   - Después del evento, subir fotos en la sección correspondiente

## Estructura del Proyecto

```
Invitacion-boda/
├── index.html              # Página principal de invitación
├── app.js                  # Lógica frontend principal
├── styles.css              # Estilos de la invitación
├── config.js               # Configuración centralizada
├── admin.html              # Panel de administración
├── admin.js                # Lógica del panel admin
├── admin-styles.css        # Estilos del panel admin
├── backend/
│   ├── server.js           # Servidor Express principal
│   ├── package.json        # Dependencias del backend
│   ├── services/
│   │   ├── googleSheets.js # Integración con Google Sheets
│   │   ├── googleDrive.js  # Integración con Google Drive
│   │   ├── whatsapp.js     # Integración con WhatsApp
│   │   └── invitationService.js # Lógica de invitaciones
│   └── credentials/        # Carpeta para credenciales (no incluida en git)
└── README.md               # Este archivo
```

## API Endpoints

### Invitaciones
- `GET /api/invitation/:code` - Obtener invitación por código
- `POST /api/invitation` - Crear nueva invitación
- `POST /api/invitation/:code/confirm` - Confirmar asistencia
- `GET /api/invitations` - Listar todas las invitaciones

### Estadísticas
- `GET /api/stats` - Obtener estadísticas generales

### Fotos
- `POST /api/upload-photos` - Subir fotos del evento

## Personalización

### Archivo de Configuración Central
Toda la personalización se realiza en el archivo `config.js`:

```javascript
const WEDDING_CONFIG = {
    // Información de los novios
    couple: {
        groom: {
            name: "Diego",
            fullName: "Diego Zazueta"
        },
        bride: {
            name: "Fernanda",
            fullName: "Fernanda López"
        },
        displayName: "Diego & Fernanda",
        hashtag: "#DiegoYFerSeCasan"
    },
    
    // Detalles del evento
    event: {
        date: new Date('2026-02-28T17:30:00'),
        dateDisplay: {
            day: "28",
            month: "Febrero",
            year: "2026"
        },
        confirmationDeadline: "1 de Febrero",
        type: "Nuestra Boda"
    },
    
    // Ubicación
    location: {
        venue: {
            name: "Hacienda los Reyes",
            address: "Ejido el 30",
            city: "Ciudad",
            state: "Estado"
        },
        ceremony: {
            name: "Ceremonia Civil",
            time: "5:30 PM",
            description: "Firma de documentos"
        },
        reception: {
            name: "Recepción",
            time: "7:00 PM",
            description: "Celebración y fiesta"
        },
        coordinates: {
            lat: 19.4326,
            lng: -99.1332
        }
    },
    
    // Itinerario del día
    schedule: [
        // Array con todos los eventos del día
    ],
    
    // Código de vestimenta
    dressCode: {
        title: "Código de Vestimenta",
        description: "Formal - Evitar colores pasteles",
        note: "Recuerden que será al aire libre, asistan bien abrigados"
    },
    
    // Mensajes personalizables
    messages: {
        welcome: "Nos casamos",
        rsvpTitle: "Confirma tu Asistencia",
        // ... más mensajes
    },
    
    // Colores del tema
    theme: {
        primaryColor: "#d4a574",
        secondaryColor: "#8b7355",
        accentColor: "#f8f4e6",
        textDark: "#333",
        textLight: "#666"
    }
};
```

### Elementos Personalizables

1. **Nombres de los Novios**: Actualiza `couple.groom.name` y `couple.bride.name`
2. **Fecha del Evento**: Modifica `event.date` con la fecha correcta
3. **Ubicación**: Actualiza toda la sección `location` con los datos del lugar
4. **Itinerario**: Personaliza el array `schedule` con los eventos del día
5. **Mensajes**: Modifica todos los textos en la sección `messages`
6. **Colores**: Cambia los valores en `theme` para personalizar la paleta de colores
7. **Hashtag**: Actualiza `couple.hashtag` con el hashtag de tu boda

### Aplicar Cambios de Colores
Si cambias los colores en `config.js`, también debes actualizar las variables CSS en `styles.css` para que coincidan:

```css
:root {
    --primary-color: #d4a574;  /* Debe coincidir con theme.primaryColor */
    --secondary-color: #8b7355; /* Debe coincidir con theme.secondaryColor */
    --accent-color: #f8f4e6;    /* Debe coincidir con theme.accentColor */
}
```

## Seguridad

- Las invitaciones usan códigos únicos aleatorios
- Los datos se almacenan en Google Sheets con acceso restringido
- Las credenciales se manejan mediante variables de entorno
- Rate limiting implementado en el servidor

## Soporte

Para reportar problemas o solicitar nuevas características, crear un issue en el repositorio.

## Licencia

Este proyecto es privado y de uso exclusivo para la boda de Diego & Fernanda.
