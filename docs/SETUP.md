# 🛠️ Guía de Configuración y Desarrollo

## Requisitos del Sistema

- **Node.js**: v14.0.0 o superior
- **npm**: v6.0.0 o superior
- **Git**: Para control de versiones

## Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/invitacion-boda.git
cd invitacion-boda
```

### 2. Instalar Dependencias

Desde la raíz del proyecto, ejecuta:

```bash
npm install
```

Este comando instalará las dependencias tanto del `frontend` como del `backend` gracias al script `postinstall`.

### 3. Configurar Variables de Entorno

1.  Navega a la carpeta del backend:
    ```bash
    cd backend
    ```
2.  Copia el archivo de ejemplo:
    ```bash
    cp .env.example .env
    ```
3.  Edita el archivo `.env` con tus valores:

```env
# Puerto en el que correrá el servidor backend
PORT=3000

# Credenciales para el panel de administración
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_contraseña_segura_aqui
```

## Desarrollo

### Ejecutar en Modo Desarrollo

Desde la **raíz del proyecto**, ejecuta:

```bash
npm run dev
```

Este comando utiliza `concurrently` para lanzar dos procesos simultáneamente:

1.  **Servidor Backend**: Inicia el servidor de Node.js en modo de desarrollo (`nodemon`) en `http://localhost:3000`. Se reiniciará automáticamente si detecta cambios en los archivos del `backend`.
2.  **Browser-Sync**: Inicia un servidor de desarrollo para el `frontend`.
    - **Proxy**: Redirige las peticiones al `backend` en `localhost:3000`.
    - **Live Reload**: Monitorea los archivos del `frontend` (HTML, CSS, JS) y recarga el navegador automáticamente cuando detecta cambios.

### Acceso a la Aplicación

- **Página de Invitación**: `http://localhost:3001` (servido por Browser-Sync)
- **API del Backend**: `http://localhost:3000/api`

## Scripts Disponibles (desde la raíz)

- `npm run dev`: Inicia el entorno de desarrollo completo.
- `npm start`: Inicia solo el servidor del backend en modo producción.
- `npm run test:frontend`: Ejecuta las pruebas del frontend.
- `npm run test:backend`: Ejecuta las pruebas del backend.
- `npm run lint`: Revisa el código en busca de errores de estilo.
- `npm run format`: Formatea el código con Prettier.

## Debugging

### Debugging del Backend en VS Code

1.  Asegúrate de tener la extensión "Debugger for Chrome" o similar si es necesario.
2.  Crea o edita el archivo `.vscode/launch.json` en la raíz del proyecto:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Debug Backend",
            "program": "${workspaceFolder}/backend/src/server.js",
            "runtimeExecutable": "nodemon",
            "envFile": "${workspaceFolder}/backend/.env",
            "restart": true,
            "console": "integratedTerminal",
            "internalConsoleOptions": "neverOpen"
        }
    ]
}
```

3.  Ve a la pestaña "Run and Debug" en VS Code, selecciona "Debug Backend" y presiona F5.

## Troubleshooting

- **El puerto 3000 o 3001 está en uso**:
    - Usa `npx kill-port 3000` o `npx kill-port 3001` para liberar el puerto.
- **Errores de permisos en la carpeta `data/`**:
    - Asegúrate de que el proceso de Node.js tenga permisos de escritura en la carpeta `data/` dentro del `backend`.
