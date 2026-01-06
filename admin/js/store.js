// admin/js/store.js - State management for admin panel

/**
 * Simple state management store for the admin panel
 * Implements Observer pattern for reactive updates
 */
export class InvitationStore {
    constructor() {
        this.state = {
            invitations: [],
            stats: {
                totalInvitations: 0,
                confirmedPasses: 0,
                pendingPasses: 0,
                cancelledPasses: 0,
                totalPasses: 0,
                adultPasses: 0,
                childPasses: 0,
                staffPasses: 0
            },
            filters: {
                search: '',
                status: {
                    confirmed: true,
                    pending: true,
                    rejected: true
                },
                type: {
                    adults: true,
                    family: true,
                    staff: true
                }
            },
            ui: {
                currentSection: 'dashboard',
                currentPage: 1,
                itemsPerPage: 5,
                loading: false,
                error: null
            }
        };
        
        this.listeners = new Map();
        this.initialized = false;
    }
    
    /**
     * Initialize the store
     */
    init() {
        if (this.initialized) return;
        
        // Load initial state from localStorage if available
        const savedState = localStorage.getItem('adminPanelState');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                // Only restore UI preferences, not data
                this.state.filters = parsed.filters || this.state.filters;
                this.state.ui.itemsPerPage = parsed.ui?.itemsPerPage || this.state.ui.itemsPerPage;
            } catch (e) {
                console.error('Error loading saved state:', e);
            }
        }
        
        this.initialized = true;
    }
    
    /**
     * Subscribe to state changes
     * @param {string} key - State key to watch (e.g., 'invitations', 'stats', 'filters')
     * @param {Function} callback - Function to call when state changes
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        
        this.listeners.get(key).add(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(key);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }
    
    /**
     * Notify listeners of state change
     * @param {string} key - State key that changed
     */
    notify(key) {
        const callbacks = this.listeners.get(key);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(this.state[key]);
                } catch (error) {
                    console.error('Error in state listener:', error);
                }
            });
        }
        
        // Also notify wildcard listeners
        const wildcardCallbacks = this.listeners.get('*');
        if (wildcardCallbacks) {
            wildcardCallbacks.forEach(callback => {
                try {
                    callback(this.state);
                } catch (error) {
                    console.error('Error in wildcard listener:', error);
                }
            });
        }
        
        // Save state to localStorage (excluding data)
        this.saveState();
    }
    
    /**
     * Save state to localStorage
     */
    saveState() {
        try {
            const stateToSave = {
                filters: this.state.filters,
                ui: {
                    itemsPerPage: this.state.ui.itemsPerPage
                }
            };
            localStorage.setItem('adminPanelState', JSON.stringify(stateToSave));
        } catch (e) {
            console.error('Error saving state:', e);
        }
    }
    
    /**
     * Update invitations
     * @param {Array} invitations - New invitations array
     */
    setInvitations(invitations) {
        this.state.invitations = invitations;
        this.notify('invitations');
        
        // Auto-update stats when invitations change
        this.updateStats();
    }
    
    /**
     * Update invitations (alias for setInvitations for compatibility)
     * @param {Array} invitations - New invitations array
     */
    updateInvitations(invitations) {
        this.setInvitations(invitations);
    }
    
    /**
     * Update stats
     * @param {Object} stats - New stats object
     */
    setStats(stats) {
        this.state.stats = { ...this.state.stats, ...stats };
        this.notify('stats');
    }
    
    /**
     * Calculate and update stats from invitations
     */
    updateStats() {
        const stats = {
            totalInvitations: this.state.invitations.length,
            confirmedPasses: 0,
            pendingPasses: 0,
            cancelledPasses: 0,
            totalPasses: 0,
            adultPasses: 0,
            childPasses: 0,
            staffPasses: 0
        };
        
        this.state.invitations.forEach(invitation => {
            stats.totalPasses += invitation.numberOfPasses;
            
            if (invitation.confirmed) {
                if (invitation.confirmationDetails?.willAttend === false) {
                    stats.cancelledPasses += invitation.numberOfPasses;
                } else {
                    stats.confirmedPasses += invitation.confirmedPasses || 0;
                    stats.cancelledPasses += (invitation.numberOfPasses - (invitation.confirmedPasses || 0));
                }
            } else {
                stats.pendingPasses += invitation.numberOfPasses;
            }
            
            // Calculate pass types
            if (invitation.adultPasses) stats.adultPasses += invitation.adultPasses;
            if (invitation.childPasses) stats.childPasses += invitation.childPasses;
            if (invitation.invitationType === 'staff') {
                stats.staffPasses += invitation.numberOfPasses;
            }
        });
        
        this.setStats(stats);
    }
    
    /**
     * Update filters
     * @param {Object} filters - New filter values
     */
    setFilters(filters) {
        this.state.filters = { ...this.state.filters, ...filters };
        this.notify('filters');
    }
    
    /**
     * Update UI state
     * @param {Object} ui - New UI state values
     */
    setUI(ui) {
        this.state.ui = { ...this.state.ui, ...ui };
        this.notify('ui');
    }
    
    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return this.state;
    }
    
    /**
     * Get filtered invitations based on current filters
     * @returns {Array} Filtered invitations
     */
    getFilteredInvitations() {
        let filtered = [...this.state.invitations];
        
        // Apply search filter
        if (this.state.filters.search) {
            const searchTerm = this.state.filters.search.toLowerCase();
            filtered = filtered.filter(invitation => {
                return invitation.code.toLowerCase().includes(searchTerm) ||
                       invitation.guestNames.some(name => name.toLowerCase().includes(searchTerm)) ||
                       (invitation.phone && invitation.phone.includes(searchTerm)) ||
                       (invitation.email && invitation.email.toLowerCase().includes(searchTerm));
            });
        }
        
        // Apply status filters
        filtered = filtered.filter(invitation => {
            if (invitation.confirmed) {
                if (invitation.confirmationDetails?.willAttend === false) {
                    return this.state.filters.status.rejected;
                } else {
                    return this.state.filters.status.confirmed;
                }
            } else {
                return this.state.filters.status.pending;
            }
        });
        
        // Apply type filters
        if (invitation.invitationType) {
            filtered = filtered.filter(invitation => {
                switch (invitation.invitationType) {
                    case 'adults':
                        return this.state.filters.type.adults;
                    case 'family':
                        return this.state.filters.type.family;
                    case 'staff':
                        return this.state.filters.type.staff;
                    default:
                        return true;
                }
            });
        }
        
        return filtered;
    }
    
    /**
     * Get paginated invitations
     * @param {number} page - Page number (1-based)
     * @returns {Object} Paginated data
     */
    getPaginatedInvitations(page = 1) {
        const filtered = this.getFilteredInvitations();
        const itemsPerPage = this.state.ui.itemsPerPage;
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        const currentPage = Math.min(Math.max(1, page), totalPages || 1);
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        return {
            invitations: filtered.slice(startIndex, endIndex),
            currentPage,
            totalPages,
            totalCount: filtered.length,
            showingFrom: filtered.length > 0 ? startIndex + 1 : 0,
            showingTo: Math.min(endIndex, filtered.length)
        };
    }
    
    /**
     * Reset filters to default
     */
    resetFilters() {
        this.setFilters({
            search: '',
            status: {
                confirmed: true,
                pending: true,
                rejected: true
            },
            type: {
                adults: true,
                family: true,
                staff: true
            }
        });
    }
    
    /**
     * Clear all state
     */
    clear() {
        this.state = {
            invitations: [],
            stats: {
                totalInvitations: 0,
                confirmedPasses: 0,
                pendingPasses: 0,
                cancelledPasses: 0,
                totalPasses: 0,
                adultPasses: 0,
                childPasses: 0,
                staffPasses: 0
            },
            filters: {
                search: '',
                status: {
                    confirmed: true,
                    pending: true,
                    rejected: true
                },
                type: {
                    adults: true,
                    family: true,
                    staff: true
                }
            },
            ui: {
                currentSection: 'dashboard',
                currentPage: 1,
                itemsPerPage: 5,
                loading: false,
                error: null
            }
        };
        
        // Notify all listeners
        this.notify('invitations');
        this.notify('stats');
        this.notify('filters');
        this.notify('ui');
        
        // Clear localStorage
        localStorage.removeItem('adminPanelState');
    }
}

// Create singleton instance
export const store = new InvitationStore();

// Helper functions for common operations
export const storeHelpers = {
    /**
     * Load invitations and update store
     * @param {Function} apiCall - API function to fetch invitations
     */
    async loadInvitations(apiCall) {
        store.setUI({ loading: true, error: null });
        
        try {
            const result = await apiCall();
            if (result.success) {
                store.setInvitations(result.invitations || []);
            } else {
                throw new Error(result.error || 'Error loading invitations');
            }
        } catch (error) {
            store.setUI({ error: error.message });
            console.error('Error loading invitations:', error);
        } finally {
            store.setUI({ loading: false });
        }
    },
    
    /**
     * Load stats and update store
     * @param {Function} apiCall - API function to fetch stats
     */
    async loadStats(apiCall) {
        try {
            const result = await apiCall();
            if (result.success) {
                store.setStats(result.stats);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
};
