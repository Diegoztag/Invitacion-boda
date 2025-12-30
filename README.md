# 💒 Sistema de Invitaciones de Boda Digital

Sistema web completo para gestionar invitaciones digitales personalizadas de boda con confirmación de asistencia.

## 🌟 Características

- **Invitaciones Personalizadas**: Cada invitado recibe un enlace único con su código de invitación
- **Sistema de Confirmación**: Los invitados pueden confirmar asistencia indicando cuántos pases usarán
- **Panel de Administración**: Dashboard completo para gestionar invitaciones y ver estadísticas
- **Base de Datos**: Google Sheets como backend para almacenar toda la información
- **Mesa de Regalos**: Sección con enlaces a tiendas y datos bancarios
- **Hashtag de Instagram**: Para que los invitados compartan fotos del evento
- **Diseño Responsivo**: Funciona perfectamente en móviles y computadoras

## 🚀 Instalación Rápida

### 1. Requisitos Previos
- Node.js v14 o superior
- Una cuenta de Google
- Un navegador web moderno

### 2. Clonar el Proyecto
```bash
git clone https://github.com/tu-usuario/invitacion-boda.git
cd invitacion-boda
```

### 3. Instalar Dependencias
```bash
cd backend
npm install
```

### 4. Configurar Google Sheets (MUY IMPORTANTE)

#### Paso 1: Crear una Hoja de Google Sheets
1. Ve a [Google Sheets](https://sheets.google.com)
2. Crea una nueva hoja en blanco
3. Copia el ID de la URL (está entre `/d/` y `/edit`)
   - Ejemplo: Si tu URL es `https://docs.google.com/spreadsheets/d/1ABC123XYZ789/edit`
   - Tu ID es: `1ABC123XYZ789`

#### Paso 2: Configurar Permisos
1. Click en el botón "Compartir" (arriba a la derecha)
2. En "Acceso general", selecciona "Cualquier persona con el enlace"
3. **IMPORTANTE**: Cambia de "Lector" a "Editor"
4. Click en "Listo"

#### Paso 3: Estructura de la Hoja
El sistema creará automáticamente 3 hojas cuando se ejecute por primera vez:
- **Invitaciones**: Almacena todos los datos de invitaciones
- **Confirmaciones**: Registro histórico de confirmaciones
- **Invitados**: Lista de invitados (legacy)

### 5. Configurar Variables de Entorno
1. Copia el archivo de ejemplo:
```bash
cd backend
cp .env.example .env
```

2. Edita el archivo `.env` con tus datos:
```env
# Puerto del servidor
PORT=3000

# ID de tu Google Sheets (el que copiaste en el paso 4)
GOOGLE_SHEETS_ID="1ABC123XYZ789"

# Credenciales del panel de administración
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_contraseña_segura_aqui
```

### 6. Personalizar la Invitación
Edita el archivo `config.js` en la raíz del proyecto:

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
        displayName: "Fernanda & Diego",
        hashtag: "#FerYDiegoSeCasan"
    },
    
    // Fecha del evento
    event: {
        date: new Date('2026-02-28T17:30:00'),
        dateDisplay: {
            day: "28",
            month: "Febrero",
            year: "2026"
        },
        confirmationDeadline: "15 de Enero"
    },
    
    // Ubicación
    location: {
        venue: {
            name: "Hacienda los Reyes",
            address: "Calle Principal #123",
            city: "Ciudad",
            state: "Estado"
        },
        coordinates: {
            lat: 19.4326,
            lng: -99.1332
        }
    },
    
    // Logo personalizado
    navLogo: {
        custom: true,      // true = texto personalizado
        text: "F & D"      // Cambia esto por tus iniciales
    },
    
    // Mesa de regalos
    giftRegistry: {
        enabled: true,
        stores: [
            {
                name: "Amazon",
                icon: "fab fa-amazon",
                url: "https://www.amazon.com.mx/tu-mesa-de-regalos",
                description: "Ver mesa de regalos en Amazon"
            }
        ],
        bankAccount: {
            enabled: true,
            details: {
                bank: "BBVA",
                accountHolder: "Diego Zazueta / Fernanda López",
                accountNumber: "1234567890",
                clabe: "012345678901234567"
            }
        }
    }
};
```

### 7. Iniciar el Servidor
```bash
cd backend
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📋 Cómo Crear Invitaciones (Método Simplificado con CSV)

### Opción 1: Cargar desde archivo CSV

#### 1. Crear archivo CSV con tus invitaciones
Crea un archivo llamado `invitaciones.csv` con el siguiente formato:

```csv
Nombres,Pases,Email,Telefono
Juan Pérez y María García,2,juan@email.com,+521234567890
Pedro López,1,pedro@email.com,+521234567891
Ana Martínez y Carlos Ruiz,2,ana@email.com,+521234567892
Familia González,4,gonzalez@email.com,+521234567893
```

**Importante sobre el formato:**
- **Nombres**: Los nombres de los invitados. Si son varios, sepáralos con "y"
- **Pases**: Número de lugares disponibles (número entero)
- **Email**: Correo electrónico (opcional, puedes dejar vacío)
- **Telefono**: Número de WhatsApp con código de país (opcional)
- **NO incluyas** comillas en los campos
- Guarda el archivo con codificación UTF-8 para acentos

#### 2. Cargar el archivo en el panel de administración
1. Ve a `http://localhost:3000/admin.html`
2. En la sección "Cargar Invitaciones", selecciona tu archivo CSV
3. Click en "Cargar Invitaciones"
4. El sistema generará automáticamente:
   - Un código único para cada invitación
   - El enlace personalizado para cada invitado

### Opción 2: Crear invitaciones individuales

Si prefieres crear invitaciones una por una:
1. En el panel de administración, usa el formulario "Crear Nueva Invitación"
2. Llena los campos y click en "Crear"

### Compartir las invitaciones
Una vez cargadas/creadas las invitaciones:
1. En el panel verás la lista completa con los enlaces únicos
2. Puedes copiar cada enlace y enviarlo por WhatsApp/email
3. También puedes exportar la lista completa con los enlaces

## 📊 Panel de Administración

El panel incluye:
- **Estadísticas en tiempo real**: Total de invitaciones, confirmaciones, etc.
- **Lista de invitaciones**: Con estado de confirmación
- **Detalles de confirmación**: Quién asistirá, restricciones alimentarias, mensajes
- **Búsqueda y filtros**: Para encontrar invitaciones específicas

## 🔧 Solución de Problemas

### Google Sheets no se conecta
1. Verifica que el ID en `.env` sea correcto
2. Asegúrate de que la hoja esté compartida como "Editor"
3. Revisa la consola del servidor para ver mensajes de error

### Las invitaciones no se guardan
1. Verifica que Google Sheets tenga permisos de edición
2. Asegúrate de que el servidor esté ejecutándose
3. Revisa la consola del navegador (F12) para ver errores

### El logo no aparece
1. Verifica la configuración en `config.js`
2. Si usas `custom: false`, asegúrate de que los nombres de los novios estén configurados

## 🎨 Personalización Adicional

### Cambiar Colores
Edita el archivo `styles.css` y busca las variables CSS al inicio:
```css
:root {
    --primary-color: #d4a574;  /* Color dorado */
    --secondary-color: #8b7355; /* Color café */
    --accent-color: #f8f4e6;    /* Color crema */
}
```

### Cambiar Fuentes
Las fuentes se cargan desde Google Fonts en `index.html`. Puedes cambiarlas editando:
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Montserrat:wght@300;400;600&display=swap" rel="stylesheet">
```

### Modificar el Itinerario
En `config.js`, edita la sección `schedule`:
```javascript
schedule: [
    {
        time: "5:00 PM",
        title: "Ceremonia Civil",
        description: "Firma de documentos"
    },
    // Agrega más eventos aquí
]
```

## 🚀 Despliegue en Producción

### Opción 1: Heroku
1. Instala [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Crea una app en Heroku
3. Configura las variables de entorno
4. Despliega con Git

### Opción 2: VPS (DigitalOcean, AWS, etc.)
1. Clona el repositorio en tu servidor
2. Instala Node.js y PM2
3. Configura Nginx como proxy reverso
4. Usa PM2 para mantener la app ejecutándose

### Opción 3: Vercel/Netlify (Solo Frontend)
1. Despliega el backend en un servicio como Heroku
2. Actualiza `config.js` con la URL del backend
3. Despliega el frontend en Vercel o Netlify

## 📝 Notas Importantes

- **Límite de Google Sheets**: Máximo 10,000 filas
- **Seguridad**: Cambia las credenciales por defecto del admin
- **Respaldos**: Descarga periódicamente tu Google Sheets
- **Personalización**: Todos los textos están en `config.js` para fácil edición

## 🤝 Soporte

Si tienes problemas o preguntas:
1. Revisa la sección de solución de problemas
2. Verifica que seguiste todos los pasos de configuración
3. Revisa los logs del servidor para mensajes de error

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

¡Felicidades por tu boda! 🎉💒
