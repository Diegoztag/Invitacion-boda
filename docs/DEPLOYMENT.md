# 🚀 Guía de Despliegue

## Preparación para Producción

### 1. Construir el Proyecto

Este proyecto no requiere un paso de "construcción" para el frontend, ya que los archivos se sirven estáticamente. Sin embargo, es crucial instalar solo las dependencias de producción para el backend.

### 2. Configurar Variables de Entorno

En tu servidor de producción, crea un archivo `.env` dentro de la carpeta `backend`. **No subas este archivo a tu repositorio de Git.**

```env
# Puerto en el que correrá el servidor
PORT=3000

# Define el entorno como producción para activar optimizaciones
NODE_ENV=production

# Credenciales seguras para el panel de administración
ADMIN_USERNAME=usuario_admin_prod
ADMIN_PASSWORD=una_contraseña_muy_larga_y_segura

# URL base de tu aplicación (si aplica)
BASE_URL=https://tu-dominio.com
```

## Despliegue en un Servidor VPS (Recomendado)

Esta guía asume un servidor con Ubuntu 20.04 o superior.

### Requisitos del Servidor

- Node.js v14+
- Nginx (como proxy inverso)
- PM2 (para gestionar el proceso de Node.js)
- Git

### Pasos

1.  **Conéctate a tu servidor vía SSH.**

2.  **Instala Node.js, Nginx y PM2:**

    ```bash
    # Instalar Node.js (ejemplo con v18)
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs

    # Instalar PM2 globalmente
    sudo npm install -g pm2

    # Instalar Nginx
    sudo apt-get install -y nginx
    ```

3.  **Clona tu proyecto:**

    ```bash
    cd /var/www
    sudo git clone https://github.com/tu-usuario/invitacion-boda.git
    cd invitacion-boda
    ```

4.  **Instala las dependencias de producción:**

    ```bash
    npm install --production
    ```

    Esto instalará las dependencias de la raíz y luego, gracias al `postinstall`, las del `backend`.

5.  **Configura y inicia la aplicación con PM2:**
    Crea un archivo `ecosystem.config.js` en la raíz del proyecto:

    ```javascript
    module.exports = {
        apps: [
            {
                name: 'invitacion-boda',
                script: './backend/src/server.js',
                instances: 1,
                autorestart: true,
                watch: false,
                max_memory_restart: '1G',
                env: {
                    NODE_ENV: 'production'
                }
            }
        ]
    };
    ```

    Inicia la aplicación:

    ```bash
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    ```

6.  **Configura Nginx como Proxy Inverso:**
    Crea un archivo de configuración para tu sitio en `/etc/nginx/sites-available/invitacion-boda`:

    ```nginx
    server {
        listen 80;
        server_name tu-dominio.com;

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

    Habilita el sitio y reinicia Nginx:

    ```bash
    sudo ln -s /etc/nginx/sites-available/invitacion-boda /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

7.  **Configura SSL con Let's Encrypt (Muy Recomendado):**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d tu-dominio.com
    ```

## Otras Opciones de Despliegue

### Docker

1.  **Crea un `Dockerfile` en la raíz del proyecto:**

    ```dockerfile
    FROM node:18-alpine

    WORKDIR /app

    # Instalar dependencias de la raíz
    COPY package*.json ./
    RUN npm install --production

    # Copiar todo el código
    COPY . .

    # Instalar dependencias del backend
    RUN cd backend && npm install --production

    EXPOSE 3000

    CMD ["node", "backend/src/server.js"]
    ```

2.  Construye y ejecuta la imagen.

### Heroku

1.  **Asegúrate de tener el Heroku CLI.**
2.  **Crea un `Procfile` en la raíz:**
    ```
    web: node backend/src/server.js
    ```
3.  **Configura las variables de entorno en el dashboard de Heroku.**
4.  **Despliega tu código:**
    ```bash
    git push heroku main
    ```

## Mantenimiento y Actualizaciones

### Actualizar la Aplicación

1.  Conéctate a tu servidor.
2.  Navega al directorio del proyecto: `cd /var/www/invitacion-boda`.
3.  Obtén los últimos cambios: `git pull origin main`.
4.  Instala cualquier nueva dependencia: `npm install --production`.
5.  Reinicia la aplicación con PM2: `pm2 restart invitacion-boda`.

### Backups

Es crucial hacer backups regulares de la carpeta `backend/data/`, que contiene tus invitaciones y confirmaciones. Puedes automatizar esto con un script y `cron`.
