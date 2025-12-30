const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const googleSheetsService = require('./services/googleSheets');
// TODO: Futura mejora - Integración con WhatsApp
// const whatsappService = require('./services/whatsapp');
const invitationService = require('./services/invitationService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);


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

// Legacy RSVP endpoint (for backward compatibility)
app.post('/api/rsvp', async (req, res) => {
    try {
        const rsvpData = req.body;
        
        // Validate required fields
        if (!rsvpData.name || !rsvpData.email || !rsvpData.phone || !rsvpData.attendance) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        
        // Add submission date
        rsvpData.submittedAt = new Date().toISOString();
        
        // Save to Google Sheets
        await googleSheetsService.saveRSVP(rsvpData);
        
        // TODO: Futura mejora - Enviar confirmación por WhatsApp
        // if (rsvpData.attendance === 'si') {
        //     await whatsappService.sendConfirmation(rsvpData.phone, rsvpData.name);
        // }
        
        res.json({ 
            success: true, 
            message: 'Confirmación recibida exitosamente' 
        });
        
    } catch (error) {
        console.error('Error processing RSVP:', error);
        res.status(500).json({ 
            error: 'Error al procesar la confirmación',
            details: error.message 
        });
    }
});


// Get all RSVPs (for admin)
app.get('/api/rsvps', async (req, res) => {
    try {
        const rsvps = await googleSheetsService.getAllRSVPs();
        res.json({ success: true, data: rsvps });
    } catch (error) {
        console.error('Error fetching RSVPs:', error);
        res.status(500).json({ 
            error: 'Error al obtener las confirmaciones',
            details: error.message 
        });
    }
});

// Get pending confirmations (for reminders)
app.get('/api/pending-confirmations', async (req, res) => {
    try {
        const pending = await googleSheetsService.getPendingConfirmations();
        res.json({ success: true, data: pending });
    } catch (error) {
        console.error('Error fetching pending confirmations:', error);
        res.status(500).json({ 
            error: 'Error al obtener confirmaciones pendientes',
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
            googleSheets: googleSheetsService.isConnected()
            // TODO: Futura mejora - Agregar estado de WhatsApp
            // whatsapp: whatsappService.isConnected()
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
    // TODO: Futura mejora - Desconectar WhatsApp
    // await whatsappService.disconnect();
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend available at http://localhost:${PORT}`);
    console.log(`🔌 API available at http://localhost:${PORT}/api`);
});
