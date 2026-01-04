const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Live reload setup
const livereload = require('livereload');
const connectLivereload = require('connect-livereload');

// Use CSV storage instead of Google Sheets
const csvStorage = require('./services/csvStorage');
const invitationService = require('./services/invitationService');

const app = express();
const PORT = process.env.PORT || 3000;

// Create a livereload server
const liveReloadServer = livereload.createServer({
    exts: ['html', 'css', 'js', 'png', 'gif', 'jpg', 'jpeg'],
    delay: 100
});

// Watch the parent directory (where frontend files are)
liveReloadServer.watch(path.join(__dirname, '..'));

// Middleware
app.use(connectLivereload()); // Add livereload script to all HTML responses
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use('/api/', limiter);

// Serve admin panel at root - MUST BE BEFORE static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

// Serve invitation page at /invitacion
app.get('/invitacion', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Serve static files AFTER specific routes
app.use(express.static(path.join(__dirname, '../')));


// Routes

// Get invitation by code
app.get('/api/invitation/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const invitation = await invitationService.getInvitationByCode(code);
        res.json({ success: true, invitation });
    } catch (error) {
        console.error('Error fetching invitation:', error);
        res.status(404).json({ 
            error: error.message || 'Invitación no encontrada'
        });
    }
});

// Create new invitation (admin only)
app.post('/api/invitation', async (req, res) => {
    try {
        const invitation = await invitationService.createInvitation(req.body);
        const invitationUrl = invitationService.generateInvitationUrl(
            invitation.code, 
            `${req.protocol}://${req.get('host')}`
        );
        res.json({ 
            success: true, 
            invitation,
            invitationUrl 
        });
    } catch (error) {
        console.error('Error creating invitation:', error);
        res.status(500).json({ 
            error: 'Error al crear la invitación',
            details: error.message 
        });
    }
});

// Confirm attendance for specific invitation
app.post('/api/invitation/:code/confirm', async (req, res) => {
    try {
        const { code } = req.params;
        const confirmationData = req.body;
        
        const updatedInvitation = await invitationService.confirmAttendance(code, confirmationData);
        
        // TODO: Futura mejora - Enviar confirmación por WhatsApp
        // if (confirmationData.willAttend && confirmationData.phone) {
        //     const message = `¡Gracias por confirmar tu asistencia! Has confirmado ${confirmationData.attendingGuests} de ${updatedInvitation.numberOfPasses} pases disponibles.`;
        //     await whatsappService.sendMessage(confirmationData.phone, message);
        // }
        
        res.json({ 
            success: true, 
            message: 'Confirmación recibida exitosamente',
            invitation: updatedInvitation
        });
    } catch (error) {
        console.error('Error confirming attendance:', error);
        res.status(400).json({ 
            error: error.message || 'Error al confirmar asistencia'
        });
    }
});

// Get all invitations (admin)
app.get('/api/invitations', async (req, res) => {
    try {
        const invitations = await invitationService.getAllInvitations();
        res.json({ success: true, invitations });
    } catch (error) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({ 
            error: 'Error al obtener invitaciones',
            details: error.message 
        });
    }
});

// Get confirmation statistics (admin)
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await invitationService.getConfirmationStats();
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ 
            error: 'Error al obtener estadísticas',
            details: error.message 
        });
    }
});

// Import invitations from CSV
app.post('/api/import-csv', async (req, res) => {
    try {
        const { csvContent } = req.body;
        
        if (!csvContent) {
            return res.status(400).json({ error: 'No se proporcionó contenido CSV' });
        }
        
        const result = await csvStorage.importInvitations(csvContent);
        
        // Add URLs to each imported invitation
        const invitationsWithUrls = result.imported.map(invitation => ({
            ...invitation,
            url: invitationService.generateInvitationUrl(
                invitation.code, 
                `${req.protocol}://${req.get('host')}`
            )
        }));
        
        res.json({ 
            success: true, 
            imported: result.imported.length,
            errors: result.errors,
            invitations: invitationsWithUrls
        });
    } catch (error) {
        console.error('Error importing CSV:', error);
        res.status(500).json({ 
            error: 'Error al importar invitaciones',
            details: error.message 
        });
    }
});

// Export all data
app.get('/api/export', async (req, res) => {
    try {
        const data = await csvStorage.exportAllData();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ 
            error: 'Error al exportar datos',
            details: error.message 
        });
    }
});

// TODO: Futura mejora - Endpoints de WhatsApp
// Los siguientes endpoints se pueden implementar en el futuro:
// - POST /api/send-invitation - Enviar invitación por WhatsApp
// - POST /api/send-reminder - Enviar recordatorio individual
// - POST /api/send-invitations-batch - Enviar invitaciones en lote
// - POST /api/send-reminders-batch - Enviar recordatorios en lote
// - GET /api/whatsapp-status - Estado de conexión de WhatsApp
// - GET /api/queue-status - Estado de la cola de mensajes
// - PUT /api/queue-config - Configurar cola de mensajes
// - GET /api/invitations-needing-reminder - Invitaciones pendientes de recordatorio

// TODO: Futura mejora - Sistema de recordatorios automáticos
// Se puede implementar un sistema de cron jobs para enviar recordatorios
// automáticamente a los invitados que no han confirmado asistencia

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        services: {
            csvStorage: true // CSV storage is always available
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    res.status(500).json({ error: error.message });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    liveReloadServer.close();
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend with live reload at http://localhost:${PORT}`);
    console.log(`🔌 API available at http://localhost:${PORT}/api`);
    console.log(`🔄 Live reload enabled - changes will auto-refresh the browser`);
});
