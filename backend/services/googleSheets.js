const { google } = require('googleapis');
const path = require('path');

class GoogleSheetsService {
    constructor() {
        this.sheets = null;
        this.spreadsheetId = process.env.GOOGLE_SHEETS_ID;
        this.auth = null;
        this.connected = false;
        this.initialize();
    }

    async initialize() {
        try {
            // Try different authentication methods
            const fs = require('fs');
            const keyFile = path.join(__dirname, '../credentials/google-service-account.json');
            
            // First, check if service account file exists
            if (fs.existsSync(keyFile)) {
                // Use service account if available
                this.auth = new google.auth.GoogleAuth({
                    keyFile: keyFile,
                    scopes: ['https://www.googleapis.com/auth/spreadsheets']
                });
                console.log('✅ Using Google Sheets with Service Account');
            } else if (process.env.GOOGLE_API_KEY) {
                // Use API Key if available (for public sheets or sheets shared with "anyone with link")
                this.auth = process.env.GOOGLE_API_KEY;
                console.log('✅ Using Google Sheets with API Key');
            } else {
                // Try without authentication (for public sheets)
                console.log('⚠️  Attempting to connect without authentication...');
                console.log('   Make sure your Google Sheet is set to "Anyone with the link can edit"');
                this.auth = null;
            }

            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            
            // Test connection
            await this.createSheetIfNotExists();
            this.connected = true;
            console.log('✅ Google Sheets connected successfully!');
        } catch (error) {
            console.error('❌ Error initializing Google Sheets:', error.message);
            console.log('\n📝 Para que funcione Google Sheets:');
            console.log('   1. Abre tu hoja de Google Sheets');
            console.log('   2. Click en "Compartir" (arriba a la derecha)');
            console.log('   3. En "Acceso general", selecciona "Cualquier persona con el enlace"');
            console.log('   4. Cambia de "Lector" a "Editor"');
            console.log('   5. Copia el ID de la URL y ponlo en el archivo .env\n');
            this.connected = false;
        }
    }

    async createSheetIfNotExists() {
        try {
            // Check if spreadsheet exists
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });

            // Check if our sheets exist
            const sheets = response.data.sheets.map(sheet => sheet.properties.title);
            
            if (!sheets.includes('Confirmaciones')) {
                await this.createConfirmationsSheet();
            }
            
            if (!sheets.includes('Invitados')) {
                await this.createGuestsSheet();
            }
            
            if (!sheets.includes('Invitaciones')) {
                await this.createInvitationsSheet();
            }
        } catch (error) {
            console.error('Error checking sheets:', error);
            // If spreadsheet doesn't exist, create it
            if (error.code === 404) {
                await this.createSpreadsheet();
            }
        }
    }

    async createConfirmationsSheet() {
        const headers = [
            ['Nombre', 'Email', 'Teléfono', 'Asistirá', 'Acompañantes', 'Restricciones Alimentarias', 'Mensaje', 'Fecha de Confirmación']
        ];

        await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: 'Confirmaciones!A1:H1',
            valueInputOption: 'RAW',
            resource: { values: headers }
        });

        // Format headers
        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            resource: {
                requests: [{
                    repeatCell: {
                        range: {
                            sheetId: 0,
                            startRowIndex: 0,
                            endRowIndex: 1
                        },
                        cell: {
                            userEnteredFormat: {
                                backgroundColor: { red: 0.82, green: 0.65, blue: 0.45 },
                                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
                            }
                        },
                        fields: 'userEnteredFormat(backgroundColor,textFormat)'
                    }
                }]
            }
        });
    }

    async createGuestsSheet() {
        const headers = [
            ['Nombre', 'Teléfono', 'Email', 'Confirmado', 'Última Notificación']
        ];

        await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: 'Invitados!A1:E1',
            valueInputOption: 'RAW',
            resource: { values: headers }
        });
    }

    async createInvitationsSheet() {
        const headers = [
            ['Código', 'Nombres Invitados', 'Número de Pases', 'Email', 'Teléfono', 
             'Fecha Creación', 'Confirmado', 'Pases Confirmados', 'Asistirá', 
             'Nombres Asistentes', 'Email Confirmación', 'Teléfono Confirmación',
             'Restricciones Alimentarias', 'Mensaje', 'Fecha Confirmación']
        ];

        await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: 'Invitaciones!A1:O1',
            valueInputOption: 'RAW',
            resource: { values: headers }
        });

        // Format headers
        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            resource: {
                requests: [{
                    repeatCell: {
                        range: {
                            sheetId: 2, // Assuming this is the third sheet
                            startRowIndex: 0,
                            endRowIndex: 1
                        },
                        cell: {
                            userEnteredFormat: {
                                backgroundColor: { red: 0.82, green: 0.65, blue: 0.45 },
                                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
                            }
                        },
                        fields: 'userEnteredFormat(backgroundColor,textFormat)'
                    }
                }]
            }
        });
    }

    async saveRSVP(data) {
        if (!this.connected) {
            throw new Error('Google Sheets service not connected');
        }

        const values = [[
            data.name,
            data.email,
            data.phone,
            data.attendance === 'si' ? 'Sí' : 'No',
            data.guests || '0',
            data.dietary || '',
            data.message || '',
            new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })
        ]];

        try {
            // Append to Confirmaciones sheet
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Confirmaciones!A:H',
                valueInputOption: 'USER_ENTERED',
                resource: { values }
            });

            // Update Invitados sheet
            await this.updateGuestStatus(data.phone, true);

            return true;
        } catch (error) {
            console.error('Error saving RSVP:', error);
            throw error;
        }
    }

    async updateGuestStatus(phone, confirmed) {
        try {
            // Get all guests
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Invitados!A:E'
            });

            const rows = response.data.values || [];
            let rowIndex = -1;

            // Find guest by phone
            for (let i = 1; i < rows.length; i++) {
                if (rows[i][1] === phone) {
                    rowIndex = i + 1; // Sheet rows are 1-indexed
                    break;
                }
            }

            if (rowIndex > 0) {
                // Update confirmation status
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: `Invitados!D${rowIndex}`,
                    valueInputOption: 'USER_ENTERED',
                    resource: { values: [[confirmed ? 'Sí' : 'No']] }
                });
            }
        } catch (error) {
            console.error('Error updating guest status:', error);
        }
    }

    async getAllRSVPs() {
        if (!this.connected) {
            throw new Error('Google Sheets service not connected');
        }

        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Confirmaciones!A:H'
            });

            const rows = response.data.values || [];
            if (rows.length <= 1) return [];

            // Convert to objects
            const headers = rows[0];
            return rows.slice(1).map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] || '';
                });
                return obj;
            });
        } catch (error) {
            console.error('Error getting RSVPs:', error);
            throw error;
        }
    }

    async getPendingConfirmations() {
        if (!this.connected) {
            throw new Error('Google Sheets service not connected');
        }

        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Invitados!A:E'
            });

            const rows = response.data.values || [];
            if (rows.length <= 1) return [];

            // Filter guests who haven't confirmed
            const pendingGuests = [];
            for (let i = 1; i < rows.length; i++) {
                const [name, phone, email, confirmed, lastNotification] = rows[i];
                if (confirmed !== 'Sí') {
                    pendingGuests.push({
                        name,
                        phone,
                        email,
                        lastNotification
                    });
                }
            }

            return pendingGuests;
        } catch (error) {
            console.error('Error getting pending confirmations:', error);
            throw error;
        }
    }

    async updateLastNotification(phone) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Invitados!A:E'
            });

            const rows = response.data.values || [];
            let rowIndex = -1;

            for (let i = 1; i < rows.length; i++) {
                if (rows[i][1] === phone) {
                    rowIndex = i + 1;
                    break;
                }
            }

            if (rowIndex > 0) {
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: `Invitados!E${rowIndex}`,
                    valueInputOption: 'USER_ENTERED',
                    resource: { 
                        values: [[new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })]] 
                    }
                });
            }
        } catch (error) {
            console.error('Error updating last notification:', error);
        }
    }

    async saveInvitation(invitation) {
        if (!this.connected) {
            throw new Error('Google Sheets service not connected');
        }

        const values = [[
            invitation.code,
            invitation.guestNames.join(', '),
            invitation.numberOfPasses,
            invitation.email,
            invitation.phone,
            invitation.createdAt,
            invitation.confirmed ? 'Sí' : 'No',
            invitation.confirmedPasses || 0,
            '', // Asistirá
            '', // Nombres Asistentes
            '', // Email Confirmación
            '', // Teléfono Confirmación
            '', // Restricciones Alimentarias
            '', // Mensaje
            ''  // Fecha Confirmación
        ]];

        try {
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Invitaciones!A:O',
                valueInputOption: 'USER_ENTERED',
                resource: { values }
            });
            return true;
        } catch (error) {
            console.error('Error saving invitation:', error);
            throw error;
        }
    }

    async getAllInvitations() {
        if (!this.connected) {
            throw new Error('Google Sheets service not connected');
        }

        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Invitaciones!A:O'
            });

            const rows = response.data.values || [];
            if (rows.length <= 1) return [];

            // Convert to objects
            return rows.slice(1).map(row => ({
                code: row[0] || '',
                guestNames: (row[1] || '').split(', ').filter(n => n),
                numberOfPasses: parseInt(row[2]) || 0,
                email: row[3] || '',
                phone: row[4] || '',
                createdAt: row[5] || '',
                confirmed: row[6] === 'Sí',
                confirmedPasses: parseInt(row[7]) || 0,
                confirmationDetails: row[8] ? {
                    willAttend: row[8] === 'Sí',
                    attendingGuests: parseInt(row[7]) || 0,
                    attendingNames: (row[9] || '').split(', ').filter(n => n),
                    email: row[10] || '',
                    phone: row[11] || '',
                    dietaryRestrictions: row[12] || '',
                    message: row[13] || '',
                    confirmedAt: row[14] || ''
                } : null
            }));
        } catch (error) {
            console.error('Error getting invitations:', error);
            throw error;
        }
    }

    async updateInvitationConfirmation(code, invitation) {
        if (!this.connected) {
            throw new Error('Google Sheets service not connected');
        }

        try {
            // Get all invitations to find the row
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Invitaciones!A:A'
            });

            const codes = response.data.values || [];
            let rowIndex = -1;

            // Find invitation by code
            for (let i = 1; i < codes.length; i++) {
                if (codes[i][0] === code) {
                    rowIndex = i + 1; // Sheet rows are 1-indexed
                    break;
                }
            }

            if (rowIndex > 0) {
                const details = invitation.confirmationDetails;
                const values = [[
                    invitation.confirmed ? 'Sí' : 'No',
                    invitation.confirmedPasses,
                    details.willAttend ? 'Sí' : 'No',
                    details.attendingNames.join(', '),
                    details.email,
                    details.phone,
                    details.dietaryRestrictions,
                    details.message,
                    details.confirmedAt
                ]];

                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: `Invitaciones!G${rowIndex}:O${rowIndex}`,
                    valueInputOption: 'USER_ENTERED',
                    resource: { values }
                });

                // Also save to Confirmaciones sheet for backward compatibility
                await this.saveRSVP({
                    name: invitation.guestNames.join(' y '),
                    email: details.email,
                    phone: details.phone,
                    attendance: details.willAttend ? 'si' : 'no',
                    guests: details.attendingGuests.toString(),
                    dietary: details.dietaryRestrictions,
                    message: details.message
                });
            }
        } catch (error) {
            console.error('Error updating invitation confirmation:', error);
            throw error;
        }
    }

    async updateInvitation(code, invitation) {
        if (!this.connected) {
            throw new Error('Google Sheets service not connected');
        }

        try {
            // Get all invitations to find the row
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Invitaciones!A:A'
            });

            const codes = response.data.values || [];
            let rowIndex = -1;

            // Find invitation by code
            for (let i = 1; i < codes.length; i++) {
                if (codes[i][0] === code) {
                    rowIndex = i + 1; // Sheet rows are 1-indexed
                    break;
                }
            }

            if (rowIndex > 0) {
                // Update the entire row with all invitation data
                const values = [[
                    invitation.code,
                    invitation.guestNames.join(', '),
                    invitation.numberOfPasses,
                    invitation.email,
                    invitation.phone,
                    invitation.createdAt,
                    invitation.confirmed ? 'Sí' : 'No',
                    invitation.confirmedPasses || 0,
                    invitation.confirmationDetails?.willAttend ? 'Sí' : '',
                    invitation.confirmationDetails?.attendingNames?.join(', ') || '',
                    invitation.confirmationDetails?.email || '',
                    invitation.confirmationDetails?.phone || '',
                    invitation.confirmationDetails?.dietaryRestrictions || '',
                    invitation.confirmationDetails?.message || '',
                    invitation.confirmationDetails?.confirmedAt || '',
                    invitation.invitationSentAt || '',
                    invitation.reminderSentAt || ''
                ]];

                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: `Invitaciones!A${rowIndex}:Q${rowIndex}`,
                    valueInputOption: 'USER_ENTERED',
                    resource: { values }
                });
            }
        } catch (error) {
            console.error('Error updating invitation:', error);
            throw error;
        }
    }

    isConnected() {
        return this.connected;
    }
}

module.exports = new GoogleSheetsService();
