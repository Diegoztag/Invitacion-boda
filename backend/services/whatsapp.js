const twilio = require('twilio');

class WhatsAppService {
    constructor() {
        this.client = null;
        this.connected = false;
        this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio Sandbox number
        this.initialize();
    }

    initialize() {
        try {
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;

            if (!accountSid || !authToken) {
                console.warn('Twilio credentials not found. WhatsApp service will be disabled.');
                return;
            }

            this.client = twilio(accountSid, authToken);
            this.connected = true;
            console.log('WhatsApp service initialized successfully');
        } catch (error) {
            console.error('Error initializing WhatsApp service:', error);
            this.connected = false;
        }
    }

    async sendConfirmation(phoneNumber, name) {
        if (!this.connected) {
            console.log('WhatsApp service not connected. Skipping message.');
            return false;
        }

        try {
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            
            const message = `¡Hola ${name}! 🎉

Hemos recibido tu confirmación de asistencia a nuestra boda. ¡Estamos muy emocionados de celebrar este día tan especial contigo!

📅 Fecha: 15 de Junio de 2024
⏰ Hora: 4:00 PM (Ceremonia)
📍 Lugar: Iglesia San José

No olvides:
• Llegar con tiempo
• Código de vestimenta: Formal (colores pasteles preferidos)
• Traer muchas ganas de celebrar 🥳

Si tienes alguna pregunta, no dudes en contactarnos.

¡Nos vemos pronto!
Con amor,
Nombre & Pareja 💕`;

            const response = await this.client.messages.create({
                body: message,
                from: this.fromNumber,
                to: `whatsapp:${formattedPhone}`
            });

            console.log(`Confirmation message sent to ${phoneNumber}:`, response.sid);
            return true;
        } catch (error) {
            console.error('Error sending confirmation message:', error);
            return false;
        }
    }

    async sendReminder(phoneNumber, name) {
        if (!this.connected) {
            console.log('WhatsApp service not connected. Skipping reminder.');
            return false;
        }

        try {
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            
            const message = `Hola ${name} 👋

¡Te recordamos que nuestra boda es el próximo 15 de Junio! 

Aún no hemos recibido tu confirmación de asistencia. Tu presencia es muy importante para nosotros. 💕

Por favor, confirma tu asistencia en:
🔗 [Link a la invitación]

O responde a este mensaje con:
✅ "SÍ" si asistirás
❌ "NO" si no podrás acompañarnos

¡Esperamos poder celebrar contigo!
Nombre & Pareja`;

            const response = await this.client.messages.create({
                body: message,
                from: this.fromNumber,
                to: `whatsapp:${formattedPhone}`
            });

            console.log(`Reminder sent to ${phoneNumber}:`, response.sid);
            return true;
        } catch (error) {
            console.error('Error sending reminder:', error);
            return false;
        }
    }

    async sendCustomMessage(phoneNumber, message) {
        if (!this.connected) {
            console.log('WhatsApp service not connected. Skipping message.');
            return false;
        }

        try {
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            
            const response = await this.client.messages.create({
                body: message,
                from: this.fromNumber,
                to: `whatsapp:${formattedPhone}`
            });

            console.log(`Custom message sent to ${phoneNumber}:`, response.sid);
            return true;
        } catch (error) {
            console.error('Error sending custom message:', error);
            return false;
        }
    }

    async sendPhotoNotification(phoneNumber, photoCount) {
        if (!this.connected) {
            console.log('WhatsApp service not connected. Skipping notification.');
            return false;
        }

        try {
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            
            const message = `¡Nuevas fotos de la boda! 📸

Se han subido ${photoCount} nueva(s) foto(s) de nuestra boda.

Puedes verlas y descargarlas en:
🔗 [Link al álbum de fotos]

¡Gracias por compartir estos momentos especiales con nosotros!

Nombre & Pareja 💕`;

            const response = await this.client.messages.create({
                body: message,
                from: this.fromNumber,
                to: `whatsapp:${formattedPhone}`
            });

            console.log(`Photo notification sent to ${phoneNumber}:`, response.sid);
            return true;
        } catch (error) {
            console.error('Error sending photo notification:', error);
            return false;
        }
    }

    formatPhoneNumber(phoneNumber) {
        // Remove any non-numeric characters
        let cleaned = phoneNumber.replace(/\D/g, '');
        
        // If the number doesn't start with country code, assume Mexico (+52)
        if (!cleaned.startsWith('52') && cleaned.length === 10) {
            cleaned = '52' + cleaned;
        }
        
        // Add + if not present
        if (!cleaned.startsWith('+')) {
            cleaned = '+' + cleaned;
        }
        
        return cleaned;
    }

    isConnected() {
        return this.connected;
    }

    async validatePhoneNumber(phoneNumber) {
        if (!this.connected) {
            return { valid: false, error: 'Service not connected' };
        }

        try {
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            const phoneNumberInfo = await this.client.lookups.v1
                .phoneNumbers(formattedPhone)
                .fetch();
            
            return {
                valid: true,
                formatted: phoneNumberInfo.phoneNumber,
                countryCode: phoneNumberInfo.countryCode
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }
}

module.exports = new WhatsAppService();
