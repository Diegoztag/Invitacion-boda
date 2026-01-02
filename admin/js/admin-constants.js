// admin-constants.js - Constantes y configuración para el panel de administración

// Configuración de UI
export const UI_CONFIG = {
    RECENT_CONFIRMATIONS_LIMIT: 5,
    ITEMS_PER_PAGE: 5,
    DEBOUNCE_DELAY: 250,
    ANIMATION_DURATION: 300,
    RESIZE_DEBOUNCE: 250
};

// Valores por defecto
export const DEFAULT_VALUES = {
    TARGET_INVITATIONS: 150,
    TARGET_GUESTS: 250,
    ADULT_PASSES: 2,
    CHILD_PASSES: 0,
    STAFF_PASSES: 1,
    DEMO_STATS: {
        totalInvitations: 150,
        totalPasses: 220,
        confirmedPasses: 85,
        pendingInvitations: 45,
        cancelledPasses: 20,
        pendingPasses: 115,
        adultPasses: 176,
        childPasses: 33,
        staffPasses: 11
    }
};

// Porcentajes de distribución de pases
export const PASS_DISTRIBUTION = {
    WITH_CHILDREN: {
        ADULT: 0.8,    // 80%
        CHILD: 0.15,   // 15%
        STAFF: 0.05    // 5%
    },
    WITHOUT_CHILDREN: {
        ADULT: 0.95,   // 95%
        CHILD: 0,      // 0%
        STAFF: 0.05    // 5%
    }
};

// Gradientes para avatares
export const AVATAR_GRADIENTS = [
    'gradient-purple',
    'gradient-blue', 
    'gradient-primary'
];

export const GRADIENT_STYLES = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
];

// Estados de invitación
export const INVITATION_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    REJECTED: 'rejected',
    PARTIAL: 'partial'
};

// Textos de estados
export const STATUS_LABELS = {
    [INVITATION_STATUS.PENDING]: 'Pendiente',
    [INVITATION_STATUS.CONFIRMED]: 'Confirmado',
    [INVITATION_STATUS.REJECTED]: 'Cancelado',
    [INVITATION_STATUS.PARTIAL]: 'Parcial'
};

// Clases CSS para badges
export const BADGE_CLASSES = {
    PRIMARY: 'primary',
    SUCCESS: 'success',
    WARNING: 'warning',
    DANGER: 'danger'
};

// Umbrales para badges de porcentaje
export const PERCENTAGE_THRESHOLDS = {
    HIGH: 100,
    MEDIUM: 75,
    LOW: 0
};

// Tipos de invitación
export const INVITATION_TYPES = {
    ADULTS: 'adults',
    FAMILY: 'family',
    STAFF: 'staff'
};

// Textos para tipos de pases
export const PASS_TYPE_LABELS = {
    SINGLE_ADULT: 'adulto',
    MULTIPLE_ADULTS: 'adultos',
    FAMILY: 'familia',
    STAFF: 'staff',
    CHILD: 'Niños',
    CHILD_NOT_ALLOWED: 'Niños (No permitidos)'
};

// Configuración de tiempo
export const TIME_CONFIG = {
    MINUTES_IN_HOUR: 60,
    HOURS_IN_DAY: 24,
    RECENT_DAYS: 7,
    COUNTDOWN_INTERVAL: 1000
};

// Textos de tiempo
export const TIME_LABELS = {
    MINUTE_SINGULAR: 'minuto',
    MINUTE_PLURAL: 'minutos',
    HOUR_SINGULAR: 'hora',
    HOUR_PLURAL: 'horas',
    YESTERDAY: 'ayer',
    DAYS_AGO: 'días'
};

// Configuración de API
export const API_ENDPOINTS = {
    STATS: '/stats',
    INVITATIONS: '/invitations',
    CREATE_INVITATION: '/invitation'
};

// Mensajes de notificación
export const NOTIFICATION_MESSAGES = {
    INVITATION_CREATED: 'Invitación creada exitosamente',
    INVITATION_ERROR: 'Error al crear la invitación',
    LINK_COPIED: 'Enlace copiado al portapapeles',
    CSV_EXPORTED: 'Archivo CSV exportado exitosamente',
    EDIT_IN_DEVELOPMENT: 'Función de edición en desarrollo',
    DELETE_IN_DEVELOPMENT: 'Función de eliminación en desarrollo',
    DELETE_CONFIRMATION: '¿Estás seguro de que deseas eliminar esta invitación?'
};

// Configuración de modales
export const MODAL_CONFIG = {
    ANIMATION_DELAY: 100,
    HIDE_DELAY: 3000,
    FADE_OUT_DELAY: 300
};

// Configuración de tablas
export const TABLE_CONFIG = {
    MIN_WIDTH: 700,
    MOBILE_MIN_WIDTH: 500
};

// Breakpoints responsivos
export const BREAKPOINTS = {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1200,
    LARGE: 1540
};

// Configuración de CSV
export const CSV_CONFIG = {
    HEADERS: ['Código', 'Invitados', 'Pases', 'Estado', 'Confirmados', 'Cancelados', 'Asistirá', 'Teléfono', 'Restricciones', 'Mensaje', 'Fecha Confirmación'],
    DELIMITER: ',',
    ENCODING: 'text/csv;charset=utf-8;'
};

// Iconos Font Awesome
export const ICONS = {
    ARROW_UP: 'fa-arrow-up',
    ARROW_DOWN: 'fa-arrow-down',
    MINUS: 'fa-minus',
    CHECK_CIRCLE: 'fa-check-circle',
    TIMES_CIRCLE: 'fa-times-circle',
    EXCLAMATION_CIRCLE: 'fa-exclamation-circle',
    CLOCK: 'fa-clock',
    EYE: 'fa-eye',
    LINK: 'fa-link',
    COPY: 'fa-copy',
    DOWNLOAD: 'fa-download',
    HEART: 'fa-heart',
    UTENSILS: 'fa-utensils',
    ELLIPSIS_V: 'fa-ellipsis-v'
};

// Estilos inline que deben moverse a CSS (para referencia)
export const INLINE_STYLES_TO_MIGRATE = {
    guestNameLineHeight: 'line-height: 1.4;',
    tableNumberStyle: 'text-align: center; font-size: 0.875rem; font-weight: 600; color: var(--primary);',
    messageStyle: 'font-style: italic; color: var(--text-muted); font-size: 0.875rem;',
    cancelledPassesStyle: 'color: #f44336; font-weight: 600;',
    avatarStyle: 'width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px;',
    pulseAnimation: 'display: inline-block; width: 6px; height: 6px; background: currentColor; border-radius: 50%; margin-right: 6px; animation: pulse 2s infinite;'
};

// Configuración de demo data
export const DEMO_INVITATIONS = [
    {
        id: 'demo1',
        code: 'abc123',
        guestNames: ['Carlos Méndez'],
        numberOfPasses: 2,
        confirmed: true,
        confirmedPasses: 2,
        confirmationDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        confirmationDetails: {
            willAttend: true,
            message: '¡Felicidades! Ahí estaremos sin falta.'
        }
    },
    {
        id: 'demo2',
        code: 'def456',
        guestNames: ['Lucía Ramos'],
        numberOfPasses: 1,
        confirmed: true,
        confirmedPasses: 1,
        confirmationDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
        confirmationDetails: {
            willAttend: true
        }
    }
];
