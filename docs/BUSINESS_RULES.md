# Reglas de Negocio - Sistema de Invitaciones

## Sistema de Estados de Invitaciones

El sistema maneja dos dimensiones independientes para el estado de las invitaciones:

### Dimensión 1: Estado Activo/Inactivo
- **Activo** (status = '' o vacío): La invitación está activa y el link funciona
- **Inactivo** (status = 'inactive'): La invitación está desactivada temporalmente

### Dimensión 2: Estado de Confirmación
- **Pendiente**: No ha confirmado asistencia
- **Confirmado**: Confirmó que asistirá
- **Cancelado**: Confirmó que NO asistirá
- **Parcial**: Cuando confirman menos personas de las invitadas

## Reglas de Desactivación

### Terminología
- Para el **administrador**: Se usa "Desactivar/Activar" invitación
- Para el **invitado**: Se muestra "Cancelar asistencia" cuando confirma que NO asistirá

### Proceso de Desactivación
1. El administrador puede desactivar cualquier invitación (activa o confirmada)
2. Si la invitación ya está confirmada, se muestra una advertencia especial
3. Se puede agregar un motivo opcional de desactivación
4. La invitación mantiene toda su información pero el link deja de funcionar

### Efectos de la Desactivación
- La invitación NO se cuenta en las estadísticas
- El link de invitación muestra un mensaje de error al invitado
- Se puede reactivar en cualquier momento
- Al reactivar, recupera su estado anterior completo

## Visualización de Estados

### En la tabla de invitaciones:
- **Confirmado**: Badge verde con ícono ✓
- **Pendiente**: Badge amarillo con ícono ⏳
- **Cancelado**: Badge rojo con ícono ✗
- **Parcial**: Badge azul (cuando confirman menos personas de las invitadas)
- **Inactivo**: Badge gris con ícono ⚡

### En el modal de detalles:
- Se muestra el estado con badge grande e ícono
- Si está inactiva, se muestra botón "Activar" en lugar de "Editar"
- Se incluye información del motivo de desactivación si existe

## Sistema de Invitados

### Campos por Invitado
Cada invitación puede tener múltiples invitados, y cada uno tiene:
- **Nombre**: Campo individual para cada persona
- **Tipo**: Categoría del invitado
  - Adulto (default)
  - Niño
  - Staff

### Validaciones
- El número de campos de invitados debe coincidir con el número de pases
- Al cambiar el número de pases, se ajustan los campos dinámicamente
- Los nombres existentes se preservan al aumentar/reducir pases

## Confirmación de Asistencia

### Proceso de Confirmación
1. El invitado accede con su código único
2. Indica si asistirá o no
3. Si asiste, especifica cuántas personas (máximo = pases asignados)
4. Puede agregar restricciones alimentarias
5. Puede dejar un mensaje personal

### Estados de Confirmación
- **Sin confirmar**: Estado inicial
- **Confirmado**: Asistirá al evento
- **Cancelado**: No asistirá al evento
- **Parcial**: Asistirán menos personas de las invitadas

### Edición de Confirmaciones
- El administrador puede editar confirmaciones desde el panel
- Se mantiene un historial de cambios
- Se puede cambiar entre estados sin perder información

## Gestión de Mesas

### Asignación
- Cada invitación tiene una mesa asignada
- Todos los invitados de una invitación se sientan en la misma mesa
- Casos especiales se manejan con notas adicionales

### Validaciones
- Número de mesa debe ser positivo
- Se recomienda validar capacidad total por mesa
- Alertas cuando una mesa está cerca de su capacidad

## Capacidad del Evento

### Límites
- Capacidad total definida en la configuración
- No se pueden crear invitaciones que excedan la capacidad
- Advertencias al acercarse al límite

### Cálculos
- Total de pases = Suma de todos los pases asignados
- Total confirmados = Suma de personas que confirmaron asistencia
- Disponibles = Capacidad total - Total confirmados

## Importación CSV

### Formato Requerido
```csv
Invitado1,Tipo1,Invitado2,Tipo2,Pases,Mesa,Email,Telefono
"Juan García","Adulto","María López","Adulto",2,5,juan@email.com,+521234567890
```

### Validaciones de Importación
- Verificar formato correcto del CSV
- Validar que no se exceda la capacidad del evento
- Detectar y prevenir duplicados
- Generar códigos únicos automáticamente

### Manejo de Errores
- Mostrar errores específicos por fila
- Permitir corrección y re-importación
- Opción de ignorar filas con errores

## Filtros y Búsqueda

### Filtros Disponibles
- Por estado de confirmación (Confirmados, Pendientes, Cancelados)
- Por estado de invitación (Activos, Inactivos)
- Por mesa asignada
- Por tipo de invitado

### Búsqueda
- Por nombre de invitado
- Por código de invitación
- Por número de teléfono
- Por email

## Estadísticas

### Métricas Principales
- Total de invitaciones creadas
- Total de pases asignados
- Confirmaciones recibidas
- Personas que asistirán
- Tasa de confirmación

### Exclusiones
- Las invitaciones inactivas NO se cuentan en estadísticas
- Las canceladas SÍ se cuentan (para métricas de rechazo)

## Notificaciones

### Tipos
- Nueva confirmación recibida
- Cambio en confirmación existente
- Límite de capacidad alcanzado
- Errores de importación

### Canales
- Notificaciones en el panel (toast)
- Badge en el menú lateral
- Sonido opcional para nuevas confirmaciones

## Seguridad y Privacidad

### Códigos de Invitación
- Generados aleatoriamente (6 caracteres)
- Únicos por invitación
- No secuenciales ni predecibles

### Acceso
- Panel admin requiere autenticación
- Links de invitación son públicos pero únicos
- No se muestran datos sensibles en la URL

### Datos Sensibles
- Teléfonos y emails son opcionales
- Se pueden exportar solo con permisos de admin
- No se comparten entre invitaciones

## Casos Especiales

### Invitaciones Grupales
- Familias completas en una sola invitación
- Límite práctico de 10 pases por invitación
- Nombres separados para cada persona

### Mesa de Niños
- Manejar con notas especiales
- No crear sistema separado de mesas por persona

### Personal del Evento
- Categoría "Staff" para proveedores
- Pueden o no contar para la capacidad total
- Estadísticas separadas opcionales
