// Load configuration from config.js
const CONFIG = {
    backendUrl: WEDDING_CONFIG.api.backendUrl
};

// Global variables
let allInvitations = [];
let confirmationChart = null;

// Initialize Admin Panel
document.addEventListener('DOMContentLoaded', () => {
    // Update wedding title
    document.getElementById('weddingTitle').textContent = `Boda ${WEDDING_CONFIG.couple.displayName}`;
    
    initNavigation();
    loadDashboardData();
    loadInvitations();
    initCreateForm();
    initModal();
    initSearch();
});

// Navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('href').substring(1);
            
            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Update active section
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
            
            // Load data for specific sections
            if (targetId === 'dashboard') {
                loadDashboardData();
            } else if (targetId === 'invitations') {
                loadInvitations();
            } else if (targetId === 'confirmations') {
                loadConfirmations();
            }
        });
    });
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        const response = await fetch(`${CONFIG.backendUrl}/stats`);
        if (response.ok) {
            const data = await response.json();
            const stats = data.stats;
            
            // Update stats cards
            document.getElementById('totalInvitations').textContent = stats.totalInvitations;
            document.getElementById('totalPasses').textContent = stats.totalPasses;
            document.getElementById('confirmedPasses').textContent = stats.confirmedPasses;
            document.getElementById('pendingInvitations').textContent = stats.pendingInvitations;
            
            // Update chart
            updateConfirmationChart(stats);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Update Confirmation Chart
function updateConfirmationChart(stats) {
    const ctx = document.getElementById('confirmationChart').getContext('2d');
    
    if (confirmationChart) {
        confirmationChart.destroy();
    }
    
    confirmationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Confirmados', 'Pendientes'],
            datasets: [{
                data: [stats.confirmedPasses, stats.pendingPasses],
                backgroundColor: ['#4caf50', '#ff9800'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

// Load Invitations
async function loadInvitations() {
    try {
        const response = await fetch(`${CONFIG.backendUrl}/invitations`);
        if (response.ok) {
            const data = await response.json();
            allInvitations = data.invitations || [];
            displayInvitations(allInvitations);
        }
    } catch (error) {
        console.error('Error loading invitations:', error);
        // For demo purposes, show sample data
        allInvitations = [
            {
                code: 'abc123',
                guestNames: ['Juan Pérez', 'María García'],
                numberOfPasses: 2,
                confirmed: false,
                confirmedPasses: 0
            }
        ];
        displayInvitations(allInvitations);
    }
}

// Display Invitations
function displayInvitations(invitations) {
    const tbody = document.getElementById('invitationsTableBody');
    tbody.innerHTML = '';
    
    invitations.forEach(invitation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="code-cell">${invitation.code}</td>
            <td>${invitation.guestNames.join(' y ')}</td>
            <td>${invitation.numberOfPasses}</td>
            <td>
                <span class="status-badge ${invitation.confirmed ? 'confirmed' : 'pending'}">
                    ${invitation.confirmed ? 'Confirmado' : 'Pendiente'}
                </span>
            </td>
            <td>${invitation.confirmedPasses || 0}</td>
            <td>
                <button class="btn-icon" onclick="viewInvitation('${invitation.code}')" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="copyInvitationLink('${invitation.code}')" title="Copiar enlace">
                    <i class="fas fa-link"></i>
                </button>
                <button class="btn-icon" onclick="sendInvitation('${invitation.code}')" title="Enviar por WhatsApp">
                    <i class="fab fa-whatsapp"></i>
                </button>
                ${!invitation.confirmed && invitation.invitationSentAt ? `
                    <button class="btn-icon" onclick="sendReminder('${invitation.code}')" title="Enviar recordatorio">
                        <i class="fas fa-bell"></i>
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// View Invitation Details
function viewInvitation(code) {
    const invitation = allInvitations.find(inv => inv.code === code);
    if (!invitation) return;
    
    const modal = document.getElementById('invitationModal');
    const details = document.getElementById('invitationDetails');
    
    const invitationUrl = `${window.location.origin}/?invitation=${code}`;
    
    details.innerHTML = `
        <div class="invitation-detail">
            <p><strong>Código:</strong> ${invitation.code}</p>
            <p><strong>Invitados:</strong> ${invitation.guestNames.join(' y ')}</p>
            <p><strong>Número de pases:</strong> ${invitation.numberOfPasses}</p>
            <p><strong>Estado:</strong> ${invitation.confirmed ? 'Confirmado' : 'Pendiente'}</p>
            ${invitation.confirmed ? `
                <p><strong>Pases confirmados:</strong> ${invitation.confirmedPasses}</p>
                <p><strong>Asistentes:</strong> ${invitation.confirmationDetails?.attendingNames?.join(', ') || 'N/A'}</p>
            ` : ''}
            <p><strong>Email:</strong> ${invitation.email || 'No proporcionado'}</p>
            <p><strong>Teléfono:</strong> ${invitation.phone || 'No proporcionado'}</p>
            <div class="invitation-link">
                <p><strong>Enlace de invitación:</strong></p>
                <input type="text" value="${invitationUrl}" readonly class="link-input">
                <button class="btn btn-secondary" onclick="copyToClipboard('${invitationUrl}')">
                    <i class="fas fa-copy"></i> Copiar
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Copy Invitation Link
function copyInvitationLink(code) {
    const invitationUrl = `${window.location.origin}/?invitation=${code}`;
    copyToClipboard(invitationUrl);
}

// Copy to Clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Enlace copiado al portapapeles');
    }).catch(err => {
        console.error('Error al copiar:', err);
    });
}

// Send Invitation via WhatsApp
async function sendInvitation(code) {
    const invitation = allInvitations.find(inv => inv.code === code);
    if (!invitation) return;
    
    if (!invitation.phone) {
        showNotification('Esta invitación no tiene número de teléfono', 'error');
        return;
    }
    
    // Check WhatsApp status first
    try {
        const statusResponse = await fetch(`${CONFIG.backendUrl}/whatsapp-status`);
        const statusData = await statusResponse.json();
        
        if (!statusData.connected) {
            showNotification('WhatsApp no está conectado. Por favor verifica la consola del servidor.', 'error');
            return;
        }
        
        // Send invitation via backend
        const response = await fetch(`${CONFIG.backendUrl}/send-invitation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invitationCode: code })
        });
        
        if (response.ok) {
            showNotification('Invitación enviada por WhatsApp exitosamente');
        } else {
            const error = await response.json();
            showNotification(error.error || 'Error al enviar invitación', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al enviar invitación por WhatsApp', 'error');
    }
}

// Initialize Create Form
function initCreateForm() {
    const form = document.getElementById('createInvitationForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const guestNamesInput = formData.get('guestNames');
        
        // Parse guest names
        const guestNames = guestNamesInput
            .split(/[,y]/)
            .map(name => name.trim())
            .filter(name => name);
        
        const invitationData = {
            guestNames: guestNames,
            numberOfPasses: parseInt(formData.get('numberOfPasses')),
            email: formData.get('email'),
            phone: formData.get('phone')
        };
        
        try {
            const response = await fetch(`${CONFIG.backendUrl}/invitation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(invitationData)
            });
            
            if (response.ok) {
                const data = await response.json();
                showNotification('Invitación creada exitosamente');
                form.reset();
                
                // Show invitation details
                const invitationUrl = data.invitationUrl;
                alert(`Invitación creada!\n\nCódigo: ${data.invitation.code}\nEnlace: ${invitationUrl}`);
                
                // Navigate to invitations list
                document.querySelector('a[href="#invitations"]').click();
            } else {
                throw new Error('Error al crear invitación');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al crear la invitación', 'error');
        }
    });
}

// Load Confirmations
async function loadConfirmations() {
    try {
        const response = await fetch(`${CONFIG.backendUrl}/invitations`);
        if (response.ok) {
            const data = await response.json();
            const confirmedInvitations = data.invitations.filter(inv => inv.confirmed);
            displayConfirmations(confirmedInvitations);
        }
    } catch (error) {
        console.error('Error loading confirmations:', error);
    }
}

// Display Confirmations
function displayConfirmations(invitations) {
    const tbody = document.getElementById('confirmationsTableBody');
    tbody.innerHTML = '';
    
    invitations.forEach(invitation => {
        const details = invitation.confirmationDetails;
        if (!details) return;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${invitation.guestNames.join(' y ')}</td>
            <td>${details.willAttend ? 'Sí' : 'No'}</td>
            <td>${details.attendingGuests} de ${invitation.numberOfPasses}</td>
            <td>${details.email || '-'}</td>
            <td>${details.phone || '-'}</td>
            <td>${details.dietaryRestrictions || '-'}</td>
            <td>${details.message || '-'}</td>
            <td>${new Date(details.confirmedAt).toLocaleDateString('es-MX')}</td>
        `;
        tbody.appendChild(row);
    });
}

// Export to Excel
function exportToExcel() {
    // This would typically use a library like SheetJS
    // For now, we'll create a CSV
    const headers = ['Invitados', 'Asistirá', 'Confirmados', 'Email', 'Teléfono', 'Restricciones', 'Mensaje', 'Fecha'];
    const rows = [];
    
    const tbody = document.getElementById('confirmationsTableBody');
    const trs = tbody.querySelectorAll('tr');
    
    trs.forEach(tr => {
        const row = [];
        tr.querySelectorAll('td').forEach(td => {
            row.push(td.textContent);
        });
        rows.push(row);
    });
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `confirmaciones_boda_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Initialize Modal
function initModal() {
    const modal = document.getElementById('invitationModal');
    const closeBtn = modal.querySelector('.modal-close');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Initialize Search
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        const filteredInvitations = allInvitations.filter(invitation => {
            return invitation.code.toLowerCase().includes(searchTerm) ||
                   invitation.guestNames.some(name => name.toLowerCase().includes(searchTerm)) ||
                   (invitation.email && invitation.email.toLowerCase().includes(searchTerm)) ||
                   (invitation.phone && invitation.phone.includes(searchTerm));
        });
        
        displayInvitations(filteredInvitations);
    });
}

// Show Create Form
function showCreateForm() {
    document.querySelector('a[href="#create"]').click();
}

// Show Notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Batch Send Functions
function showBatchSendModal() {
    const modal = document.getElementById('batchSendModal');
    const listContainer = document.getElementById('batchInvitationsList');
    
    // Clear previous list
    listContainer.innerHTML = '';
    
    // Filter invitations with phone numbers
    const invitationsWithPhone = allInvitations.filter(inv => inv.phone);
    
    if (invitationsWithPhone.length === 0) {
        listContainer.innerHTML = '<p>No hay invitaciones con número de teléfono.</p>';
    } else {
        invitationsWithPhone.forEach(invitation => {
            const item = document.createElement('div');
            item.className = 'batch-item';
            item.innerHTML = `
                <label>
                    <input type="checkbox" value="${invitation.code}" 
                           ${!invitation.confirmed ? 'checked' : ''}>
                    <span>${invitation.guestNames.join(' y ')}</span>
                    <small>${invitation.phone} - ${invitation.confirmed ? 'Confirmado' : 'Pendiente'}</small>
                </label>
            `;
            listContainer.appendChild(item);
        });
    }
    
    modal.style.display = 'block';
}

function closeBatchModal() {
    document.getElementById('batchSendModal').style.display = 'none';
}

function selectAllPending() {
    const checkboxes = document.querySelectorAll('#batchInvitationsList input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const invitation = allInvitations.find(inv => inv.code === checkbox.value);
        if (invitation && !invitation.confirmed) {
            checkbox.checked = true;
        }
    });
}

function deselectAll() {
    const checkboxes = document.querySelectorAll('#batchInvitationsList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

function updateBatchSize() {
    const value = document.getElementById('batchSize').value;
    document.getElementById('batchSizeValue').textContent = value;
}

function updateDelayMessages() {
    const value = document.getElementById('delayMessages').value;
    document.getElementById('delayMessagesValue').textContent = value;
}

function updateDelayBatches() {
    const value = document.getElementById('delayBatches').value;
    document.getElementById('delayBatchesValue').textContent = value;
}

async function sendBatchInvitations() {
    const checkboxes = document.querySelectorAll('#batchInvitationsList input[type="checkbox"]:checked');
    const selectedCodes = Array.from(checkboxes).map(cb => cb.value);
    
    if (selectedCodes.length === 0) {
        showNotification('Por favor selecciona al menos una invitación', 'error');
        return;
    }
    
    // Get configuration values
    const batchSize = parseInt(document.getElementById('batchSize').value);
    const delayMessages = parseInt(document.getElementById('delayMessages').value) * 1000;
    const delayBatches = parseInt(document.getElementById('delayBatches').value) * 1000;
    
    try {
        // Update queue configuration
        await fetch(`${CONFIG.backendUrl}/queue-config`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                batchSize,
                delayBetweenMessages: delayMessages,
                delayBetweenBatches: delayBatches
            })
        });
        
        // Send batch
        const response = await fetch(`${CONFIG.backendUrl}/send-invitations-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invitationCodes: selectedCodes })
        });
        
        if (response.ok) {
            const data = await response.json();
            showNotification(data.message);
            closeBatchModal();
            
            // Show queue status
            setTimeout(() => {
                showQueueStatus();
            }, 500);
        } else {
            const error = await response.json();
            showNotification(error.error || 'Error al enviar invitaciones', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al enviar invitaciones por lote', 'error');
    }
}

// Queue Status Functions
async function showQueueStatus() {
    const modal = document.getElementById('queueStatusModal');
    modal.style.display = 'block';
    await refreshQueueStatus();
}

function closeQueueModal() {
    document.getElementById('queueStatusModal').style.display = 'none';
}

async function refreshQueueStatus() {
    try {
        const response = await fetch(`${CONFIG.backendUrl}/queue-status`);
        if (response.ok) {
            const data = await response.json();
            updateQueueDisplay(data);
        }
    } catch (error) {
        console.error('Error fetching queue status:', error);
    }
}

function updateQueueDisplay(data) {
    const content = document.getElementById('queueStatusContent');
    
    const statusClass = data.isProcessing ? 'processing' : 'idle';
    const statusText = data.isProcessing ? 'Procesando' : 'Inactiva';
    
    content.innerHTML = `
        <div class="queue-status ${statusClass}">
            <h3>Estado: ${statusText}</h3>
            <div class="queue-stats">
                <div class="stat">
                    <span class="label">En cola:</span>
                    <span class="value">${data.queueLength}</span>
                </div>
                <div class="stat">
                    <span class="label">Enviados:</span>
                    <span class="value">${data.processedCount}</span>
                </div>
                <div class="stat">
                    <span class="label">Fallidos:</span>
                    <span class="value">${data.failedCount}</span>
                </div>
            </div>
            <div class="queue-config">
                <h4>Configuración Actual</h4>
                <p>Tamaño de lote: ${data.batchSize} mensajes</p>
                <p>Delay entre mensajes: ${data.delayBetweenMessages / 1000} segundos</p>
                <p>Delay entre lotes: ${data.delayBetweenBatches / 1000} segundos</p>
            </div>
            ${data.isProcessing ? `
                <div class="queue-progress">
                    <p>⏳ Procesando mensajes...</p>
                    <small>La cola se actualiza automáticamente</small>
                </div>
            ` : ''}
        </div>
    `;
    
    // Auto-refresh if processing
    if (data.isProcessing) {
        setTimeout(() => {
            if (document.getElementById('queueStatusModal').style.display === 'block') {
                refreshQueueStatus();
            }
        }, 2000);
    }
}

// Send Reminder
async function sendReminder(code) {
    const invitation = allInvitations.find(inv => inv.code === code);
    if (!invitation) return;
    
    if (!invitation.phone) {
        showNotification('Esta invitación no tiene número de teléfono', 'error');
        return;
    }
    
    if (invitation.confirmed) {
        showNotification('Esta invitación ya está confirmada', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.backendUrl}/send-reminder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invitationCode: code })
        });
        
        if (response.ok) {
            showNotification('Recordatorio enviado exitosamente');
            // Reload invitations to update status
            loadInvitations();
        } else {
            const error = await response.json();
            showNotification(error.error || 'Error al enviar recordatorio', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al enviar recordatorio', 'error');
    }
}

// Show Reminders Modal
async function showRemindersModal() {
    try {
        // Get invitations needing reminder
        const response = await fetch(`${CONFIG.backendUrl}/invitations-needing-reminder`);
        if (!response.ok) throw new Error('Error fetching invitations');
        
        const data = await response.json();
        const invitations = data.invitations;
        
        // Create modal content
        const modalHtml = `
            <div id="remindersModal" class="modal" style="display: block;">
                <div class="modal-content">
                    <span class="modal-close" onclick="closeRemindersModal()">&times;</span>
                    <h2>Enviar Recordatorios</h2>
                    <div class="batch-send-content">
                        <p>Invitaciones que necesitan recordatorio (${invitations.length}):</p>
                        <div class="batch-filters">
                            <button class="btn btn-sm" onclick="selectAllReminders()">Seleccionar Todos</button>
                            <button class="btn btn-sm" onclick="deselectAllReminders()">Deseleccionar Todo</button>
                        </div>
                        <div id="remindersList" class="batch-list">
                            ${invitations.length === 0 ? '<p>No hay invitaciones pendientes de recordatorio.</p>' : 
                                invitations.map(inv => `
                                    <div class="batch-item">
                                        <label>
                                            <input type="checkbox" value="${inv.code}" checked>
                                            <span>${inv.guestNames.join(' y ')}</span>
                                            <small>${inv.phone} - Enviada hace ${Math.floor((new Date() - new Date(inv.invitationSentAt)) / (1000 * 60 * 60 * 24))} días</small>
                                        </label>
                                    </div>
                                `).join('')
                            }
                        </div>
                        <div class="batch-actions">
                            <button class="btn btn-primary" onclick="sendBatchReminders()">
                                <i class="fas fa-bell"></i> Enviar Recordatorios
                            </button>
                            <button class="btn btn-secondary" onclick="closeRemindersModal()">Cancelar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer.firstElementChild);
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar invitaciones para recordatorio', 'error');
    }
}

function closeRemindersModal() {
    const modal = document.getElementById('remindersModal');
    if (modal) modal.remove();
}

function selectAllReminders() {
    const checkboxes = document.querySelectorAll('#remindersList input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
}

function deselectAllReminders() {
    const checkboxes = document.querySelectorAll('#remindersList input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
}

async function sendBatchReminders() {
    const checkboxes = document.querySelectorAll('#remindersList input[type="checkbox"]:checked');
    const selectedCodes = Array.from(checkboxes).map(cb => cb.value);
    
    if (selectedCodes.length === 0) {
        showNotification('Por favor selecciona al menos una invitación', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.backendUrl}/send-reminders-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invitationCodes: selectedCodes })
        });
        
        if (response.ok) {
            const data = await response.json();
            showNotification(data.message);
            closeRemindersModal();
            
            // Show queue status
            setTimeout(() => {
                showQueueStatus();
            }, 500);
            
            // Reload invitations
            loadInvitations();
        } else {
            const error = await response.json();
            showNotification(error.error || 'Error al enviar recordatorios', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al enviar recordatorios por lote', 'error');
    }
}

// Update modal close handlers
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});
