const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CSVStorageService {
    constructor() {
        this.dataDir = path.join(__dirname, '../../data');
        this.invitationsFile = path.join(this.dataDir, 'invitations.csv');
        this.confirmationsFile = path.join(this.dataDir, 'confirmations.csv');
        this.initializeStorage();
    }

    async initializeStorage() {
        try {
            // Create data directory if it doesn't exist
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Initialize invitations file if it doesn't exist
            try {
                await fs.access(this.invitationsFile);
            } catch {
                const headers = 'code,guestNames,numberOfPasses,phone,createdAt,confirmed,confirmedPasses,confirmationDate,adultPasses,childPasses,invitationType\n';
                await fs.writeFile(this.invitationsFile, headers);
            }
            
            // Initialize confirmations file if it doesn't exist
            try {
                await fs.access(this.confirmationsFile);
            } catch {
                const headers = 'code,willAttend,attendingGuests,attendingNames,phone,dietaryRestrictions,message,confirmedAt\n';
                await fs.writeFile(this.confirmationsFile, headers);
            }
            
            console.log('✅ CSV Storage initialized successfully');
        } catch (error) {
            console.error('Error initializing CSV storage:', error);
        }
    }

    // Parse CSV line (handles commas in quoted fields)
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    // Format value for CSV (add quotes if contains comma)
    formatCSVValue(value) {
        if (value === null || value === undefined) return '';
        const strValue = String(value);
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
            return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
    }

    // Generate unique invitation code
    generateInvitationCode() {
        return crypto.randomBytes(4).toString('hex');
    }

    // Save new invitation
    async saveInvitation(invitation) {
        try {
            const code = this.generateInvitationCode();
            const guestNamesStr = Array.isArray(invitation.guestNames) 
                ? invitation.guestNames.join(' y ') 
                : invitation.guestNames;
            
            // Default values for new fields
            const adultPasses = invitation.adultPasses || invitation.numberOfPasses;
            const childPasses = invitation.childPasses || 0;
            const invitationType = invitation.invitationType || 'adults';
            
            const row = [
                code,
                this.formatCSVValue(guestNamesStr),
                invitation.numberOfPasses,
                this.formatCSVValue(invitation.phone || ''),
                new Date().toISOString(),
                'false',
                '0',
                '',
                adultPasses,
                childPasses,
                invitationType
            ].join(',') + '\n';
            
            await fs.appendFile(this.invitationsFile, row);
            
            return {
                code,
                guestNames: invitation.guestNames,
                numberOfPasses: invitation.numberOfPasses,
                phone: invitation.phone || '',
                createdAt: new Date().toISOString(),
                confirmed: false,
                confirmedPasses: 0,
                adultPasses: adultPasses,
                childPasses: childPasses,
                invitationType: invitationType
            };
        } catch (error) {
            console.error('Error saving invitation:', error);
            throw error;
        }
    }

    // Get all invitations
    async getAllInvitations() {
        try {
            const content = await fs.readFile(this.invitationsFile, 'utf-8');
            const lines = content.trim().split('\n');
            const invitations = [];
            const confirmations = await this.getAllConfirmations();
            
            // Skip header
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const parts = this.parseCSVLine(line);
                if (parts.length >= 8) {
                    const invitation = {
                        code: parts[0],
                        guestNames: parts[1].split(' y ').map(n => n.trim()),
                        numberOfPasses: parseInt(parts[2]),
                        phone: parts[3],
                        createdAt: parts[4],
                        confirmed: parts[5] === 'true',
                        confirmedPasses: parseInt(parts[6]) || 0,
                        confirmationDate: parts[7] || null,
                        // Add new fields with defaults for backward compatibility
                        adultPasses: parts[8] ? parseInt(parts[8]) : parseInt(parts[2]),
                        childPasses: parts[9] ? parseInt(parts[9]) : 0,
                        invitationType: parts[10] || 'adults'
                    };
                    
                    // Add confirmation details if available
                    const confirmation = confirmations.find(conf => conf.code === invitation.code);
                    if (confirmation) {
                        invitation.confirmationDetails = confirmation;
                    }
                    
                    invitations.push(invitation);
                }
            }
            
            return invitations;
        } catch (error) {
            console.error('Error reading invitations:', error);
            return [];
        }
    }

    // Get invitation by code
    async getInvitationByCode(code) {
        const invitations = await this.getAllInvitations();
        return invitations.find(inv => inv.code === code);
    }

    // Update invitation confirmation
    async updateInvitationConfirmation(code, confirmationData) {
        try {
            const invitations = await this.getAllInvitations();
            const invitationIndex = invitations.findIndex(inv => inv.code === code);
            
            if (invitationIndex === -1) {
                throw new Error('Invitación no encontrada');
            }
            
            // Update invitation
            invitations[invitationIndex].confirmed = true;
            invitations[invitationIndex].confirmedPasses = confirmationData.attendingGuests;
            invitations[invitationIndex].confirmationDate = new Date().toISOString();
            
            // Save confirmation details
            const confirmationRow = [
                code,
                confirmationData.willAttend ? 'true' : 'false',
                confirmationData.attendingGuests,
                this.formatCSVValue(confirmationData.attendingNames?.join(', ') || ''),
                this.formatCSVValue(confirmationData.phone || ''),
                this.formatCSVValue(confirmationData.dietaryRestrictions || ''),
                this.formatCSVValue(confirmationData.message || ''),
                new Date().toISOString()
            ].join(',') + '\n';
            
            await fs.appendFile(this.confirmationsFile, confirmationRow);
            
            // Rewrite invitations file
            let csvContent = 'code,guestNames,numberOfPasses,phone,createdAt,confirmed,confirmedPasses,confirmationDate,adultPasses,childPasses,invitationType\n';
            
            for (const inv of invitations) {
                const row = [
                    inv.code,
                    this.formatCSVValue(inv.guestNames.join(' y ')),
                    inv.numberOfPasses,
                    this.formatCSVValue(inv.phone),
                    inv.createdAt,
                    inv.confirmed,
                    inv.confirmedPasses,
                    inv.confirmationDate || '',
                    inv.adultPasses || inv.numberOfPasses,
                    inv.childPasses || 0,
                    inv.invitationType || 'adults'
                ].join(',') + '\n';
                csvContent += row;
            }
            
            await fs.writeFile(this.invitationsFile, csvContent);
            
            // Return updated invitation with confirmation details
            const updatedInvitation = invitations[invitationIndex];
            updatedInvitation.confirmationDetails = confirmationData;
            updatedInvitation.confirmationDetails.confirmedAt = new Date().toISOString();
            
            return updatedInvitation;
        } catch (error) {
            console.error('Error updating confirmation:', error);
            throw error;
        }
    }

    // Get all confirmations
    async getAllConfirmations() {
        try {
            const content = await fs.readFile(this.confirmationsFile, 'utf-8');
            const lines = content.trim().split('\n');
            const confirmations = [];
            
            // Skip header
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const parts = this.parseCSVLine(line);
                if (parts.length >= 8) {
                    confirmations.push({
                        code: parts[0],
                        willAttend: parts[1] === 'true',
                        attendingGuests: parseInt(parts[2]),
                        attendingNames: parts[3] ? parts[3].split(',').map(n => n.trim()) : [],
                        phone: parts[4],
                        dietaryRestrictions: parts[5],
                        message: parts[6],
                        confirmedAt: parts[7]
                    });
                }
            }
            
            return confirmations;
        } catch (error) {
            console.error('Error reading confirmations:', error);
            return [];
        }
    }

    // Get statistics
    async getStats() {
        const invitations = await this.getAllInvitations();
        const confirmations = await this.getAllConfirmations();
        
        // Calculate cancelled passes (both not attending and partial confirmations)
        let cancelledPasses = 0;
        let adultPasses = 0;
        let childPasses = 0;
        let staffPasses = 0;
        
        invitations.forEach(invitation => {
            if (invitation.confirmed) {
                const confirmation = confirmations.find(conf => conf.code === invitation.code);
                if (confirmation) {
                    if (!confirmation.willAttend) {
                        // If not attending, all passes are cancelled
                        cancelledPasses += invitation.numberOfPasses;
                    } else if (confirmation.willAttend && invitation.confirmedPasses < invitation.numberOfPasses) {
                        // If attending but not using all passes, count the difference as cancelled
                        cancelledPasses += (invitation.numberOfPasses - invitation.confirmedPasses);
                    }
                }
            }
            
            // Use actual data from invitation if available
            if (invitation.invitationType === 'staff') {
                staffPasses += invitation.numberOfPasses;
            } else if (invitation.adultPasses !== undefined && invitation.childPasses !== undefined) {
                // Use specific adult/child breakdown
                adultPasses += invitation.adultPasses;
                childPasses += invitation.childPasses;
            } else {
                // Fallback for old data without specific breakdown
                adultPasses += invitation.numberOfPasses;
            }
        });
        
        const totalPasses = invitations.reduce((sum, inv) => sum + inv.numberOfPasses, 0);
        
        const stats = {
            totalInvitations: invitations.length,
            totalPasses: totalPasses,
            confirmedInvitations: invitations.filter(inv => inv.confirmed).length,
            confirmedPasses: invitations.reduce((sum, inv) => sum + (inv.confirmedPasses || 0), 0),
            pendingInvitations: invitations.filter(inv => !inv.confirmed).length,
            pendingPasses: invitations.filter(inv => !inv.confirmed)
                .reduce((sum, inv) => sum + inv.numberOfPasses, 0),
            cancelledPasses: cancelledPasses,
            // Add breakdown of pass types
            adultPasses: adultPasses,
            childPasses: childPasses,
            staffPasses: staffPasses
        };
        
        return stats;
    }

    // Export all data (for backup)
    async exportAllData() {
        const invitations = await this.getAllInvitations();
        const confirmations = await this.getAllConfirmations();
        
        return {
            invitations,
            confirmations,
            exportDate: new Date().toISOString()
        };
    }

    // Import invitations from CSV content
    async importInvitations(csvContent) {
        try {
            const lines = csvContent.trim().split('\n');
            const imported = [];
            const errors = [];
            
            // Skip header if present
            const firstLine = lines[0].toLowerCase();
            const startIndex = firstLine.includes('nombres') ? 1 : 0;
            
            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                try {
                    const parts = this.parseCSVLine(line);
                    if (parts.length >= 2) {
                        const invitation = {
                            guestNames: parts[0].split(/\s+y\s+/i).map(n => n.trim()),
                            numberOfPasses: parseInt(parts[1]),
                            phone: parts[2] || '',
                            // Add new fields if present in CSV
                            adultPasses: parts[3] ? parseInt(parts[3]) : undefined,
                            childPasses: parts[4] ? parseInt(parts[4]) : undefined,
                            invitationType: parts[5] || undefined
                        };
                        
                        // Validate pass breakdown if provided
                        if (invitation.adultPasses !== undefined && invitation.childPasses !== undefined) {
                            const totalFromBreakdown = invitation.adultPasses + invitation.childPasses;
                            if (totalFromBreakdown !== invitation.numberOfPasses) {
                                errors.push(`Línea ${i + 1}: La suma de adultos y niños (${totalFromBreakdown}) no coincide con el total de pases (${invitation.numberOfPasses})`);
                                continue;
                            }
                        }
                        
                        if (invitation.guestNames.length > 0 && !isNaN(invitation.numberOfPasses)) {
                            const saved = await this.saveInvitation(invitation);
                            imported.push(saved);
                        } else {
                            errors.push(`Línea ${i + 1}: Datos inválidos`);
                        }
                    }
                } catch (error) {
                    errors.push(`Línea ${i + 1}: ${error.message}`);
                }
            }
            
            return { imported, errors };
        } catch (error) {
            console.error('Error importing invitations:', error);
            throw error;
        }
    }
}

module.exports = new CSVStorageService();
