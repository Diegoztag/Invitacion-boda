const EventEmitter = require('events');

class MessageQueue extends EventEmitter {
    constructor() {
        super();
        this.queue = [];
        this.isProcessing = false;
        this.batchSize = 5; // Mensajes por lote
        this.delayBetweenMessages = 3000; // 3 segundos entre mensajes
        this.delayBetweenBatches = 30000; // 30 segundos entre lotes
        this.processedCount = 0;
        this.failedMessages = [];
    }

    // Add message to queue
    addToQueue(message) {
        this.queue.push({
            ...message,
            id: Date.now() + Math.random(),
            addedAt: new Date(),
            status: 'pending'
        });
        
        this.emit('messageAdded', message);
        
        // Start processing if not already running
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    // Add multiple messages to queue
    addBatchToQueue(messages) {
        messages.forEach(message => {
            this.queue.push({
                ...message,
                id: Date.now() + Math.random(),
                addedAt: new Date(),
                status: 'pending'
            });
        });
        
        this.emit('batchAdded', messages.length);
        
        // Start processing if not already running
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    // Process queue
    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;
        this.emit('processingStarted');

        while (this.queue.length > 0) {
            // Get next batch
            const batch = this.queue.splice(0, this.batchSize);
            
            console.log(`\n📦 Procesando lote de ${batch.length} mensajes...`);
            this.emit('batchStarted', batch.length);

            // Process each message in the batch
            for (let i = 0; i < batch.length; i++) {
                const message = batch[i];
                
                try {
                    // Update status
                    message.status = 'sending';
                    this.emit('messageSending', message);
                    
                    // Send message
                    await message.sendFunction();
                    
                    // Update status
                    message.status = 'sent';
                    message.sentAt = new Date();
                    this.processedCount++;
                    
                    console.log(`✅ Mensaje ${i + 1}/${batch.length} enviado`);
                    this.emit('messageSent', message);
                    
                    // Delay between messages (except for the last one)
                    if (i < batch.length - 1) {
                        console.log(`⏳ Esperando ${this.delayBetweenMessages / 1000} segundos...`);
                        await this.delay(this.delayBetweenMessages);
                    }
                } catch (error) {
                    // Handle error
                    message.status = 'failed';
                    message.error = error.message;
                    this.failedMessages.push(message);
                    
                    console.error(`❌ Error enviando mensaje:`, error.message);
                    this.emit('messageFailed', message, error);
                }
            }

            // If there are more messages, wait before next batch
            if (this.queue.length > 0) {
                console.log(`\n⏰ Esperando ${this.delayBetweenBatches / 1000} segundos antes del siguiente lote...`);
                console.log(`📊 Mensajes restantes en cola: ${this.queue.length}`);
                this.emit('batchCompleted', batch.length, this.queue.length);
                await this.delay(this.delayBetweenBatches);
            }
        }

        this.isProcessing = false;
        console.log(`\n✅ Cola de mensajes procesada completamente`);
        console.log(`📊 Total enviados: ${this.processedCount}`);
        if (this.failedMessages.length > 0) {
            console.log(`❌ Mensajes fallidos: ${this.failedMessages.length}`);
        }
        
        this.emit('processingCompleted', {
            processed: this.processedCount,
            failed: this.failedMessages.length
        });
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get queue status
    getStatus() {
        return {
            queueLength: this.queue.length,
            isProcessing: this.isProcessing,
            processedCount: this.processedCount,
            failedCount: this.failedMessages.length,
            batchSize: this.batchSize,
            delayBetweenMessages: this.delayBetweenMessages,
            delayBetweenBatches: this.delayBetweenBatches
        };
    }

    // Update configuration
    updateConfig(config) {
        if (config.batchSize) this.batchSize = config.batchSize;
        if (config.delayBetweenMessages) this.delayBetweenMessages = config.delayBetweenMessages;
        if (config.delayBetweenBatches) this.delayBetweenBatches = config.delayBetweenBatches;
        
        this.emit('configUpdated', this.getConfig());
    }

    // Get current configuration
    getConfig() {
        return {
            batchSize: this.batchSize,
            delayBetweenMessages: this.delayBetweenMessages,
            delayBetweenBatches: this.delayBetweenBatches
        };
    }

    // Clear queue
    clearQueue() {
        const removed = this.queue.length;
        this.queue = [];
        this.emit('queueCleared', removed);
        return removed;
    }

    // Get failed messages
    getFailedMessages() {
        return [...this.failedMessages];
    }

    // Retry failed messages
    retryFailed() {
        const failed = [...this.failedMessages];
        this.failedMessages = [];
        
        failed.forEach(message => {
            message.status = 'pending';
            delete message.error;
            delete message.sentAt;
            this.queue.push(message);
        });
        
        this.emit('failedRetried', failed.length);
        
        if (!this.isProcessing && this.queue.length > 0) {
            this.processQueue();
        }
        
        return failed.length;
    }

    // Get queue items
    getQueueItems() {
        return [...this.queue];
    }
}

// Export singleton instance
module.exports = new MessageQueue();
