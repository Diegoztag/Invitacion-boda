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
- **[AGENT.md](./AGENT.md)** - Guía principal para agentes IA y desarrolladores
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
```bash
cd backend
npm install
```

### 4. Configurar Variables de Entorno
1. Copia el archivo de ejemplo:
```bash
cd backend
cp .env.example .env
```

2. Edita el archivo `.env` con tus datos:
```env
# Puerto del servidor
PORT=3000

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

El servidor estará disponible en:
- Panel de administración: `http://localhost:3000`
- Página de invitación: `http://localhost:3000/invitacion`

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
1. Ve a `http://localhost:3000`
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

Los enlaces de invitación tendrán el formato:
`http://localhost:3000/invitacion?invitation=CODIGO_UNICO`

## 📊 Panel de Administración

El panel incluye:
- **Estadísticas en tiempo real**: Total de invitaciones, confirmaciones, etc.
- **Lista de invitaciones**: Con estado de confirmación
- **Detalles de confirmación**: Quién asistirá, restricciones alimentarias, mensajes
- **Búsqueda y filtros**: Para encontrar invitaciones específicas

## 📂 Estructura de Datos

El sistema almacena toda la información en archivos CSV locales:

- **`data/invitations.csv`**: Lista de todas las invitaciones
- **`data/confirmations.csv`**: Registro de confirmaciones

Los archivos se crean automáticamente al iniciar el servidor por primera vez.

### Formato de invitations.csv:
```csv
code,guestNames,numberOfPasses,email,phone,createdAt,confirmed,confirmedPasses,confirmationDate
abc123,"Juan Pérez y María García",2,juan@email.com,+521234567890,2024-01-01T10:00:00Z,false,0,
```

### Formato de confirmations.csv:
```csv
code,willAttend,attendingGuests,attendingNames,email,phone,dietaryRestrictions,message,confirmedAt
abc123,true,2,"Juan Pérez, María García",juan@email.com,+521234567890,Sin gluten,¡Felicidades!,2024-01-02T15:30:00Z
```

## 🔧 Solución de Problemas

### Las invitaciones no se guardan
1. Verifica que la carpeta `data` tenga permisos de escritura
2. Asegúrate de que el servidor esté ejecutándose
3. Revisa la consola del servidor para ver mensajes de error

### Error al cargar CSV
1. Verifica que el archivo esté en formato UTF-8
2. Asegúrate de seguir el formato exacto (separado por comas)
3. No uses comillas a menos que el campo contenga comas

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

## 💾 Respaldo de Datos

### Hacer respaldo manual:
1. Copia la carpeta `data` completa
2. O descarga los archivos CSV desde el panel de administración

### Restaurar respaldo:
1. Detén el servidor
2. Reemplaza los archivos en la carpeta `data`
3. Reinicia el servidor

## 📝 Notas Importantes

- **Almacenamiento Local**: Los datos se guardan en archivos CSV en la carpeta `data`
- **Seguridad**: Cambia las credenciales por defecto del admin
- **Respaldos**: Haz copias periódicas de la carpeta `data`
- **Personalización**: Todos los textos están en `config.js` para fácil edición
- **Sin límites**: No hay restricciones de filas como en servicios externos

## 🤝 Soporte

Si tienes problemas o preguntas:
1. Revisa la sección de solución de problemas
2. Verifica que seguiste todos los pasos de configuración
3. Revisa los logs del servidor para mensajes de error

## 🛠️ Para Desarrolladores

### Estructura del Proyecto
```
invitacion-boda/
├── backend/              # Servidor Node.js/Express
├── admin/               # Recursos del panel admin
│   ├── js/             # JavaScript modular
│   └── css/            # Estilos modulares
├── data/               # Archivos CSV (generados)
├── docs/               # Documentación técnica
├── AGENT.md            # Guía para agentes IA
├── config.js           # Configuración global
├── index.html          # Página de invitación
└── admin.html          # Panel de administración
```

### Tecnologías Utilizadas
- **Frontend**: HTML5, CSS3, JavaScript ES6+ (Vanilla)
- **Backend**: Node.js, Express.js
- **Base de Datos**: CSV (decisión consciente por portabilidad)
- **Estilos**: Bootstrap 5, CSS personalizado
- **Iconos**: Font Awesome

### Principios de Desarrollo
- **SOLID**: Principios de diseño orientado a objetos
- **DRY**: Don't Repeat Yourself
- **KISS**: Keep It Simple, Stupid
- **Clean Code**: Código limpio y mantenible
- **Modular**: Arquitectura modular y reutilizable

### Contribuir al Proyecto
1. Lee [CONTRIBUTING.md](./docs/CONTRIBUTING.md) para conocer los estándares
2. Consulta [TECHNICAL_ROADMAP.md](./docs/TECHNICAL_ROADMAP.md) para ver qué está pendiente
3. Sigue las reglas de negocio en [BUSINESS_RULES.md](./docs/BUSINESS_RULES.md)
4. Actualiza la documentación relevante después de tus cambios

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

¡Felicidades por tu boda! 🎉💒

**Última actualización**: Enero 2025
