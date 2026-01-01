// admin/js/main.js - Main entry point for admin panel

// Import all modules
import { 
    UI_CONFIG, 
    DEFAULT_VALUES, 
    PASS_DISTRIBUTION,
    AVATAR_GRADIENTS,
    GRADIENT_STYLES,
    INVITATION_STATUS,
    STATUS_LABELS,
    BADGE_CLASSES,
    PERCENTAGE_THRESHOLDS,
    INVITATION_TYPES,
    PASS_TYPE_LABELS,
    TIME_CONFIG,
    TIME_LABELS,
    API_ENDPOINTS,
    NOTIFICATION_MESSAGES,
    MODAL_CONFIG,
    BREAKPOINTS,
    CSV_CONFIG,
    ICONS,
    DEMO_INVITATIONS
} from './admin-constants.js';

import {
    calculateCancelledPasses,
    getInitials,
    formatGuestNames,
    getRandomGradient,
    getTimeAgo,
    getPassTypeText,
    getTableNumber,
    formatDate,
    formatPhone,
    calculatePercentageStats,
    debounce,
    parseSimpleCSV,
    updateStatsUI,
    updateInvitationPercentageBadge,
    updateTargetElements,
    updateConfirmedChangeIndicator,
    generateDemoStats,
    getStatusBadge,
    renderStatBadge,
    getBadgeType,
    renderTableRow,
    updateTablePagination,
    calculatePaginationInfo
} from './admin-utils.js';

import { Modal, ModalFactory, showToast } from './components/admin-modal.js';
import { createAdminAPI, APIHelpers } from './admin-api.js';
import { notificationService } from './services/notification-service.js';

// Re-export everything for backward compatibility
export {
    // Constants
    UI_CONFIG, 
    DEFAULT_VALUES, 
    PASS_DISTRIBUTION,
    AVATAR_GRADIENTS,
    GRADIENT_STYLES,
    INVITATION_STATUS,
    STATUS_LABELS,
    BADGE_CLASSES,
    PERCENTAGE_THRESHOLDS,
    INVITATION_TYPES,
    PASS_TYPE_LABELS,
    TIME_CONFIG,
    TIME_LABELS,
    API_ENDPOINTS,
    NOTIFICATION_MESSAGES,
    MODAL_CONFIG,
    BREAKPOINTS,
    CSV_CONFIG,
    ICONS,
    DEMO_INVITATIONS,
    
    // Utils
    calculateCancelledPasses,
    getInitials,
    formatGuestNames,
    getRandomGradient,
    getTimeAgo,
    getPassTypeText,
    getTableNumber,
    formatDate,
    formatPhone,
    calculatePercentageStats,
    debounce,
    parseSimpleCSV,
    updateStatsUI,
    updateInvitationPercentageBadge,
    updateTargetElements,
    updateConfirmedChangeIndicator,
    generateDemoStats,
    getStatusBadge,
    renderStatBadge,
    getBadgeType,
    renderTableRow,
    updateTablePagination,
    calculatePaginationInfo,
    
    // Modal system
    Modal,
    ModalFactory,
    showToast,
    
    // API
    createAdminAPI,
    APIHelpers,
    
    // Services
    notificationService
};

// Initialize the admin panel when this module is imported
console.log('Admin panel modules loaded successfully');

// Start notification monitoring when the module loads
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // Load initial notifications
        notificationService.loadInitialNotifications();
        
        // Start monitoring for new confirmations
        notificationService.startMonitoring();
        
        // Update notification count
        notificationService.updateNotificationCount();
    });
}
