const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const googleSheetsService = require('./services/googleSheets');
const googleDriveService = require('./services/googleDrive');
const whatsappService = require('./services/whatsapp');
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

// Multer configuration for photo uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'wedding-photo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'));
        }
    }
});

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
        
        // Send WhatsApp confirmation if attending
        if (confirmationData.willAttend && confirmationData.phone) {
            const message = `¡Gracias por confirmar tu asistencia! Has confirmado ${confirmationData.attendingGuests} de ${updatedInvitation.numberOfPasses} pases disponibles.`;
            await whatsappService.sendMessage(confirmationData.phone, message);
        }
        
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
        
        // Send confirmation WhatsApp message
        if (rsvpData.attendance === 'si') {
            await whatsappService.sendConfirmation(rsvpData.phone, rsvpData.name);
        }
        
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

// Photo upload endpoint
app.post('/api/upload-photos', upload.array('photos', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No se recibieron fotos' });
        }
        
        const uploadedFiles = [];
        
        // Upload each file to Google Drive
        for (const file of req.files) {
            const driveFileId = await googleDriveService.uploadPhoto(file.path, file.filename);
            uploadedFiles.push({
                filename: file.filename,
                driveFileId: driveFileId,
                uploadedAt: new Date().toISOString()
            });
            
            // Delete local file after upload
            await fs.unlink(file.path);
        }
        
        res.json({ 
            success: true, 
            message: 'Fotos subidas exitosamente',
            files: uploadedFiles 
        });
        
    } catch (error) {
        console.error('Error uploading photos:', error);
        res.status(500).json({ 
            error: 'Error al subir las fotos',
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

// Send reminder endpoint
app.post('/api/send-reminder', async (req, res) => {
    try {
        const { phone, name } = req.body;
        
        if (!phone || !name) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }
        
        await whatsappService.sendReminder(phone, name);
        
        res.json({ 
            success: true, 
            message: 'Recordatorio enviado exitosamente' 
        });
        
    } catch (error) {
        console.error('Error sending reminder:', error);
        res.status(500).json({ 
            error: 'Error al enviar recordatorio',
            details: error.message 
        });
    }
});

// Send invitation via WhatsApp
app.post('/api/send-invitation', async (req, res) => {
    try {
        const { invitationCode } = req.body;
        
        if (!invitationCode) {
            return res.status(400).json({ error: 'Código de invitación requerido' });
        }
        
        // Get invitation details
        const invitation = await invitationService.getInvitationByCode(invitationCode);
        
        if (!invitation.phone) {
            return res.status(400).json({ error: 'La invitación no tiene número de teléfono' });
        }
        
        // Generate invitation URL
        const invitationUrl = invitationService.generateInvitationUrl(
            invitation.code, 
            `${req.protocol}://${req.get('host')}`
        );
        
        // Send WhatsApp message
        await whatsappService.sendInvitation(
            invitation.phone, 
            invitation.guestNames.join(' y '), 
            invitationUrl
        );
        
        // Mark invitation as sent
        await invitationService.markInvitationAsSent(invitationCode);
        
        res.json({ 
            success: true, 
            message: 'Invitación enviada exitosamente por WhatsApp' 
        });
        
    } catch (error) {
        console.error('Error sending invitation:', error);
        res.status(500).json({ 
            error: 'Error al enviar invitación',
            details: error.message 
        });
    }
});

// Get WhatsApp connection status
app.get('/api/whatsapp-status', (req, res) => {
    const status = whatsappService.getStatus();
    const queueStatus = whatsappService.getQueueStatus();
    res.json({ 
        success: true, 
        ...status,
        queue: queueStatus
    });
});

// Send invitations in batch
app.post('/api/send-invitations-batch', async (req, res) => {
    try {
        const { invitationCodes } = req.body;
        
        if (!invitationCodes || !Array.isArray(invitationCodes)) {
            return res.status(400).json({ error: 'Se requiere un array de códigos de invitación' });
        }
        
        // Get all invitations
        const invitations = [];
        const codesToMarkAsSent = [];
        
        for (const code of invitationCodes) {
            try {
                const invitation = await invitationService.getInvitationByCode(code);
                if (invitation.phone) {
                    const invitationUrl = invitationService.generateInvitationUrl(
                        invitation.code, 
                        `${req.protocol}://${req.get('host')}`
                    );
                    invitations.push({
                        phone: invitation.phone,
                        name: invitation.guestNames.join(' y '),
                        url: invitationUrl
                    });
                    codesToMarkAsSent.push(code);
                }
            } catch (error) {
                console.error(`Error getting invitation ${code}:`, error);
            }
        }
        
        if (invitations.length === 0) {
            return res.status(400).json({ error: 'No se encontraron invitaciones válidas con teléfono' });
        }
        
        // Send batch
        const result = await whatsappService.sendInvitationsBatch(invitations);
        
        // Mark invitations as sent
        for (const code of codesToMarkAsSent) {
            await invitationService.markInvitationAsSent(code);
        }
        
        res.json({ 
            success: true, 
            message: `${result.queued} invitaciones agregadas a la cola`,
            ...result
        });
        
    } catch (error) {
        console.error('Error sending batch invitations:', error);
        res.status(500).json({ 
            error: 'Error al enviar invitaciones por lote',
            details: error.message 
        });
    }
});

// Get message queue status
app.get('/api/queue-status', (req, res) => {
    const status = whatsappService.getQueueStatus();
    res.json({ 
        success: true, 
        ...status
    });
});

// Update queue configuration
app.put('/api/queue-config', (req, res) => {
    try {
        const config = whatsappService.updateQueueConfig(req.body);
        res.json({ 
            success: true, 
            message: 'Configuración actualizada',
            config
        });
    } catch (error) {
        res.status(400).json({ 
            error: 'Error al actualizar configuración',
            details: error.message 
        });
    }
});

// Get invitations needing reminder
app.get('/api/invitations-needing-reminder', async (req, res) => {
    try {
        const invitations = await invitationService.getInvitationsNeedingReminder();
        res.json({ 
            success: true, 
            invitations,
            count: invitations.length
        });
    } catch (error) {
        console.error('Error getting invitations needing reminder:', error);
        res.status(500).json({ 
            error: 'Error al obtener invitaciones pendientes de recordatorio',
            details: error.message 
        });
    }
});

// Send reminder for single invitation
app.post('/api/send-reminder', async (req, res) => {
    try {
        const { invitationCode } = req.body;
        
        if (!invitationCode) {
            return res.status(400).json({ error: 'Código de invitación requerido' });
        }
        
        const invitation = await invitationService.getInvitationByCode(invitationCode);
        
        if (!invitation.phone) {
            return res.status(400).json({ error: 'La invitación no tiene número de teléfono' });
        }
        
        if (invitation.confirmed) {
            return res.status(400).json({ error: 'Esta invitación ya está confirmada' });
        }
        
        const invitationUrl = invitationService.generateInvitationUrl(
            invitation.code, 
            `${req.protocol}://${req.get('host')}`
        );
        
        await whatsappService.sendReminder(
            invitation.phone, 
            invitation.guestNames.join(' y '),
            invitationUrl
        );
        
        await invitationService.markReminderAsSent(invitationCode);
        
        res.json({ 
            success: true, 
            message: 'Recordatorio enviado exitosamente' 
        });
        
    } catch (error) {
        console.error('Error sending reminder:', error);
        res.status(500).json({ 
            error: 'Error al enviar recordatorio',
            details: error.message 
        });
    }
});

// Send reminders in batch
app.post('/api/send-reminders-batch', async (req, res) => {
    try {
        const { invitationCodes } = req.body;
        
        if (!invitationCodes || !Array.isArray(invitationCodes)) {
            return res.status(400).json({ error: 'Se requiere un array de códigos de invitación' });
        }
        
        const reminders = [];
        const codesToMarkAsSent = [];
        
        for (const code of invitationCodes) {
            try {
                const invitation = await invitationService.getInvitationByCode(code);
                if (invitation.phone && !invitation.confirmed) {
                    const invitationUrl = invitationService.generateInvitationUrl(
                        invitation.code, 
                        `${req.protocol}://${req.get('host')}`
                    );
                    reminders.push({
                        phone: invitation.phone,
                        name: invitation.guestNames.join(' y '),
                        url: invitationUrl,
                        code: invitation.code
                    });
                    codesToMarkAsSent.push(code);
                }
            } catch (error) {
                console.error(`Error getting invitation ${code}:`, error);
            }
        }
        
        if (reminders.length === 0) {
            return res.status(400).json({ error: 'No se encontraron invitaciones válidas para recordatorio' });
        }
        
        const result = await whatsappService.sendRemindersBatch(reminders);
        
        // Mark reminders as sent
        for (const code of codesToMarkAsSent) {
            await invitationService.markReminderAsSent(code);
        }
        
        res.json({ 
            success: true, 
            message: `${result.queued} recordatorios agregados a la cola`,
            ...result
        });
        
    } catch (error) {
        console.error('Error sending batch reminders:', error);
        res.status(500).json({ 
            error: 'Error al enviar recordatorios por lote',
            details: error.message 
        });
    }
});

// Schedule automatic reminders
if (process.env.ENABLE_AUTO_REMINDERS === 'true') {
    const reminderHour = parseInt(process.env.REMINDER_HOUR || '10');
    const cronExpression = `0 ${reminderHour} * * *`;
    
    cron.schedule(cronExpression, async () => {
        console.log('Running scheduled reminder task...');
        try {
            const invitations = await invitationService.getInvitationsNeedingReminder();
            
            if (invitations.length > 0) {
                const reminders = invitations.map(invitation => ({
                    phone: invitation.phone,
                    name: invitation.guestNames.join(' y '),
                    url: invitationService.generateInvitationUrl(invitation.code, process.env.BASE_URL || 'http://localhost:3000'),
                    code: invitation.code
                }));
                
                const result = await whatsappService.sendRemindersBatch(reminders);
                
                // Mark reminders as sent
                for (const invitation of invitations) {
                    await invitationService.markReminderAsSent(invitation.code);
                }
                
                console.log(`Sent ${result.queued} reminders`);
            } else {
                console.log('No invitations need reminders');
            }
        } catch (error) {
            console.error('Error in scheduled reminder task:', error);
        }
    });
    
    console.log(`⏰ Automatic reminders scheduled for ${reminderHour}:00 daily`);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        services: {
            googleSheets: googleSheetsService.isConnected(),
            googleDrive: googleDriveService.isConnected(),
            whatsapp: whatsappService.isConnected()
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 10MB.' });
        }
    }
    res.status(500).json({ error: error.message });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await whatsappService.disconnect();
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend available at http://localhost:${PORT}`);
    console.log(`🔌 API available at http://localhost:${PORT}/api`);
    console.log(`\n⚠️  IMPORTANTE: Si es la primera vez que usas WhatsApp Web:`);
    console.log(`   1. Espera a que aparezca el código QR en la consola`);
    console.log(`   2. Escanea el código con WhatsApp en tu teléfono`);
    console.log(`   3. La sesión se guardará automáticamente para futuros usos\n`);
});
