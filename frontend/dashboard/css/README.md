# Sistema CSS Modular - Panel de Administración

Este directorio contiene la nueva arquitectura CSS modular para el panel de administración.

## 📁 Estructura de Archivos

La estructura sigue la metodología ITCSS (Inverted Triangle CSS) adaptada:

```
frontend/dashboard/css/
├── main.css                 # Archivo principal que importa todos los módulos
│
├── 01-settings/            # Configuración global
│   └── _variables.css      # Variables CSS (colores, espaciado, tipografía)
│
├── 02-generic/             # Estilos genéricos y resets
│   ├── _reset.css          # Reset de estilos del navegador
│   └── _base.css           # Estilos base de elementos HTML
│
├── 03-objects/             # Objetos de layout y estructura
│   ├── _layout.css         # Layout principal (grid, contenedores)
│   └── _grid.css           # Sistema de grilla
│
├── 04-components/          # Componentes reutilizables de UI
│   ├── _badges.css         # Etiquetas y badges de estado
│   ├── _buttons.css        # Botones y acciones
│   ├── _cards.css          # Tarjetas y contenedores de contenido
│   ├── _charts.css         # Estilos para gráficos
│   ├── _filters.css        # Panel de filtros
│   ├── _forms.css          # Elementos de formulario
│   ├── _guest-fields.css   # Campos dinámicos de invitados
│   ├── _header.css         # Cabecera de la aplicación
│   ├── _loading.css        # Spinners y skeleton screens
│   ├── _modals.css         # Ventanas modales
│   ├── _pagination.css     # Controles de paginación
│   ├── _search.css         # Barra de búsqueda
│   ├── _sidebar.css        # Menú lateral de navegación
│   ├── _tables.css         # Tablas de datos
│   └── _toasts.css         # Notificaciones emergentes
│
├── 05-pages/               # Estilos específicos por página
│   ├── _cancel-invitation.css     # Modal de cancelación
│   ├── _create-invitation.css     # Modal de creación
│   ├── _dashboard.css             # Vista principal del dashboard
│   ├── _deactivate-invitation.css # Modal de desactivación
│   ├── _edit-invitation.css       # Modal de edición
│   ├── _import-csv.css            # Modal de importación CSV
│   ├── _mobile-invitations.css    # Vista móvil de lista de invitaciones
│   └── _view-invitation.css       # Modal de detalles de invitación
│
└── 06-utilities/           # Clases de utilidad
    └── _utilities.css      # Helpers (margin, padding, text, display)
```

## 🎨 Convenciones

### Variables CSS
Las variables principales se definen en `01-settings/_variables.css` y controlan:
- Colores (tema claro y oscuro)
- Espaciado
- Tipografía
- Bordes y sombras
- Breakpoints

### Nomenclatura
Se utiliza una convención relajada inspirada en BEM:
- `.componente`
- `.componente-elemento`
- `.componente.modificador`

## 🚀 Mantenimiento

### Agregar un nuevo componente
1. Crear el archivo en `04-components/_nuevo-componente.css`
2. Importarlo en `main.css` en la sección correspondiente

### Modificar estilos existentes
1. Localizar el componente específico
2. Realizar cambios usando las variables CSS siempre que sea posible

## ✅ Estado de la Migración
- **Refactorización completa:** Todos los estilos legacy han sido migrados a esta nueva estructura.
- **Limpieza:** Los archivos CSS antiguos han sido eliminados.
- **Independencia:** Este sistema es independiente de los estilos de la invitación (`frontend/invitation/`) y la landing page (`frontend/landing/`).
