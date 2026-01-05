# Guía de Despliegue

## Preparación para Producción

### 1. Configuración de Variables de Entorno

Crear archivo `.env` en producción con valores seguros:

```env
# Puerto del servidor
PORT=3000

# Credenciales del panel admin (CAMBIAR ESTOS VALORES)
ADMIN_USERNAME=admin_produccion
ADMIN_PASSWORD=contraseña_super_segura_2024!

# Configuración de la aplicación
NODE_ENV=production
BASE_URL=https://tu-dominio.com

# Opcional: WhatsApp Business API
WHATSAPP_API_URL=https://api.whatsapp.com/
WHATSAPP_TOKEN=tu_token_produccion
```

### 2. Optimización de Assets

```bash
# Minificar CSS
npx cssnano styles.css styles.min.css
npx cssnano admin/css/*.css --dir admin/css/min/

# Minificar JavaScript
npx terser app.js -o app.min.js
npx terser admin.js -o admin.min.js
npx terser admin/js/*.js --dir admin/js/min/

# Optimizar imágenes
npx imagemin images/* --out-dir=images/optimized/
```

### 3. Configuración de Seguridad

#### Headers de Seguridad (agregar en server.js)
```javascript
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    next();
});
```

## Opciones de Despliegue

### Opción 1: VPS (DigitalOcean, AWS EC2, Linode)

#### Requisitos
- Ubuntu 20.04+ o similar
- 1GB RAM mínimo
- 10GB almacenamiento
- Node.js 14+
- Nginx
- PM2

#### Pasos de Instalación

1. **Conectar al servidor**
```bash
ssh usuario@tu-servidor.com
```

2. **Instalar Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Instalar PM2**
```bash
sudo npm install -g pm2
```

4. **Clonar el proyecto**
```bash
cd /var/www
sudo git clone https://github.com/tu-usuario/invitacion-boda.git
cd invitacion-boda
```

5. **Instalar dependencias**
```bash
cd backend
npm install --production
```

6. **Configurar PM2**
```bash
# Crear ecosystem.config.js
module.exports = {
  apps: [{
    name: 'invitacion-boda',
    script: './backend/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};

# Iniciar aplicación
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

7. **Configurar Nginx**
```nginx
# /etc/nginx/sites-available/invitacion-boda
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Archivos estáticos con caché largo
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

8. **Habilitar sitio**
```bash
sudo ln -s /etc/nginx/sites-available/invitacion-boda /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

9. **Configurar SSL con Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

### Opción 2: Heroku

1. **Instalar Heroku CLI**
```bash
# https://devcenter.heroku.com/articles/heroku-cli
```

2. **Crear app en Heroku**
```bash
heroku create nombre-app-invitacion
```

3. **Configurar variables**
```bash
heroku config:set ADMIN_USERNAME=admin_seguro
heroku config:set ADMIN_PASSWORD=password_muy_segura
heroku config:set NODE_ENV=production
```

4. **Crear Procfile**
```
web: node backend/server.js
```

5. **Desplegar**
```bash
git add .
git commit -m "Preparar para Heroku"
git push heroku main
```

### Opción 3: Vercel (Frontend) + Heroku (Backend)

1. **Separar frontend y backend**
2. **Configurar CORS en backend para permitir frontend**
3. **Actualizar URLs de API en frontend**
4. **Desplegar backend en Heroku**
5. **Desplegar frontend en Vercel**

### Opción 4: Docker

1. **Crear Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY backend/package*.json ./backend/

# Instalar dependencias
RUN cd backend && npm ci --only=production

# Copiar resto del código
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "backend/server.js"]
```

2. **Crear docker-compose.yml**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ADMIN_USERNAME=${ADMIN_USERNAME}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

3. **Construir y ejecutar**
```bash
docker-compose up -d
```

## Monitoreo y Mantenimiento

### 1. Logs con PM2
```bash
# Ver logs en tiempo real
pm2 logs invitacion-boda

# Ver logs históricos
pm2 logs invitacion-boda --lines 1000
```

### 2. Monitoreo de Recursos
```bash
# Estado de la aplicación
pm2 status

# Monitoreo en tiempo real
pm2 monit

# Métricas detalladas
pm2 info invitacion-boda
```

### 3. Backups Automáticos

Crear script de backup (`backup.sh`):
```bash
#!/bin/bash
BACKUP_DIR="/home/usuario/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Backup de datos CSV
tar -czf $BACKUP_DIR/data_$DATE.tar.gz /var/www/invitacion-boda/data/

# Mantener solo últimos 30 días
find $BACKUP_DIR -name "data_*.tar.gz" -mtime +30 -delete
```

Agregar a crontab:
```bash
# Backup diario a las 2 AM
0 2 * * * /home/usuario/backup.sh
```

### 4. Actualizaciones

```bash
# Proceso de actualización seguro
cd /var/www/invitacion-boda

# 1. Backup antes de actualizar
./backup.sh

# 2. Obtener últimos cambios
git pull origin main

# 3. Instalar nuevas dependencias
cd backend && npm install --production

# 4. Reiniciar aplicación
pm2 restart invitacion-boda

# 5. Verificar logs
pm2 logs invitacion-boda --lines 100
```

## Checklist de Producción

### Antes del Despliegue
- [ ] Variables de entorno configuradas
- [ ] Credenciales seguras (no las default)
- [ ] Assets minificados
- [ ] Imágenes optimizadas
- [ ] SSL/HTTPS configurado
- [ ] Headers de seguridad
- [ ] Backup inicial de datos

### Después del Despliegue
- [ ] Verificar que el sitio carga correctamente
- [ ] Probar panel de administración
- [ ] Probar creación de invitación
- [ ] Probar confirmación de asistencia
- [ ] Verificar logs sin errores
- [ ] Configurar monitoreo
- [ ] Programar backups automáticos

### Mantenimiento Regular
- [ ] Revisar logs semanalmente
- [ ] Verificar backups mensuales
- [ ] Actualizar dependencias trimestralmente
- [ ] Renovar SSL antes de expirar
- [ ] Monitorear uso de recursos

## Troubleshooting Común

### La aplicación no inicia
```bash
# Verificar logs
pm2 logs invitacion-boda --lines 200

# Verificar puerto en uso
sudo lsof -i :3000

# Verificar permisos de carpeta data
ls -la data/
```

### Error 502 Bad Gateway
```bash
# Verificar que PM2 está corriendo
pm2 status

# Verificar configuración de Nginx
sudo nginx -t

# Reiniciar servicios
pm2 restart invitacion-boda
sudo systemctl restart nginx
```

### Problemas de permisos
```bash
# Dar permisos correctos
sudo chown -R www-data:www-data /var/www/invitacion-boda
sudo chmod -R 755 /var/www/invitacion-boda
sudo chmod -R 775 /var/www/invitacion-boda/data
```

## Escalabilidad

### Cuando considerar escalar:
- Más de 1000 invitaciones activas
- Tiempo de respuesta > 2 segundos
- Uso de CPU > 80% constante
- Archivos CSV > 10MB

### Opciones de escalado:
1. **Vertical**: Aumentar recursos del servidor
2. **Horizontal**: Múltiples instancias con load balancer
3. **Migrar a base de datos**: PostgreSQL o MySQL
4. **CDN para assets**: CloudFlare, AWS CloudFront
5. **Caché**: Redis para consultas frecuentes

## Seguridad en Producción

### Recomendaciones críticas:
1. Usar HTTPS siempre
2. Actualizar dependencias regularmente
3. Implementar rate limiting
4. Logs de auditoría para acciones admin
5. Backup encriptado de datos
6. Firewall configurado (UFW)
7. Fail2ban para prevenir ataques
8. Monitoreo de seguridad

### Configuración de Firewall
```bash
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable
```

## Contacto y Soporte

Para problemas de despliegue:
1. Revisar logs detalladamente
2. Buscar en issues del repositorio
3. Crear nuevo issue con información completa
4. Incluir: versión, entorno, logs, pasos para reproducir
