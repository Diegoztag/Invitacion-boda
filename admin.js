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
    initCsvUpload();
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
            document.getElementById('cancelledPasses').textContent = stats.cancelledPasses || 0;
            
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
            labels: ['Confirmados', 'Pendientes', 'Cancelados'],
            datasets: [{
                data: [stats.confirmedPasses, stats.pendingPasses, stats.cancelledPasses || 0],
                backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
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
        // Calculate cancelled passes for this invitation
        let cancelledPasses = 0;
        if (invitation.confirmed && invitation.confirmationDetails && !invitation.confirmationDetails.willAttend) {
            cancelledPasses = invitation.numberOfPasses;
        }
        
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
            <td>${cancelledPasses > 0 ? `<span style="color: #f44336; font-weight: 600;">${cancelledPasses}</span>` : '0'}</td>
            <td>
                <button class="btn-icon" onclick="viewInvitation('${invitation.code}')" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="copyInvitationLink('${invitation.code}')" title="Copiar enlace">
                    <i class="fas fa-link"></i>
                </button>
                <!-- TODO: Futura mejora - Botones de WhatsApp -->
                <!-- <button class="btn-icon" onclick="sendInvitation('${invitation.code}')" title="Enviar por WhatsApp">
                    <i class="fab fa-whatsapp"></i>
                </button> -->
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

// TODO: Futura mejora - Función para enviar invitación por WhatsApp
// async function sendInvitation(code) {
//     // Implementar integración con WhatsApp Business API
// }

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

// TODO: Futura mejora - Funciones de WhatsApp
// Las siguientes funciones se pueden implementar cuando se agregue la integración con WhatsApp:
// - showBatchSendModal() - Mostrar modal para envío por lotes
// - sendBatchInvitations() - Enviar invitaciones en lote
// - showQueueStatus() - Mostrar estado de la cola de mensajes
// - sendReminder() - Enviar recordatorio individual
// - showRemindersModal() - Mostrar modal de recordatorios
// - sendBatchReminders() - Enviar recordatorios en lote

// Por ahora, estas funciones están deshabilitadas para mantener el MVP simple

// Initialize CSV Upload
function initCsvUpload() {
    const csvFile = document.getElementById('csvFile');
    const fileName = document.getElementById('fileName');
    const uploadBtn = document.getElementById('uploadCsvBtn');
    const csvResults = document.getElementById('csvResults');
    
    let selectedFile = null;
    
    csvFile.addEventListener('change', (e) => {
        selectedFile = e.target.files[0];
        if (selectedFile) {
            fileName.textContent = selectedFile.name;
            uploadBtn.style.display = 'inline-block';
        } else {
            fileName.textContent = '';
            uploadBtn.style.display = 'none';
        }
    });
    
    uploadBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        
        csvResults.innerHTML = '<p>Procesando archivo...</p>';
        
        try {
            const text = await selectedFile.text();
            const invitations = parseCSV(text);
            
            if (invitations.length === 0) {
                csvResults.innerHTML = '<p class="error">No se encontraron invitaciones válidas en el archivo</p>';
                return;
            }
            
            csvResults.innerHTML = `<p>Creando ${invitations.length} invitaciones...</p>`;
            
            let created = 0;
            let errors = [];
            const createdInvitations = [];
            
            for (const invitation of invitations) {
                try {
                    const response = await fetch(`${CONFIG.backendUrl}/invitation`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(invitation)
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        created++;
                        createdInvitations.push({
                            ...data.invitation,
                            url: data.invitationUrl
                        });
                    } else {
                        const error = await response.json();
                        errors.push(`${invitation.guestNames.join(' y ')}: ${error.error}`);
                    }
                } catch (error) {
                    errors.push(`${invitation.guestNames.join(' y ')}: Error de conexión`);
                }
            }
            
            // Show results
            let resultsHTML = `<h4>Resultados de la carga:</h4>`;
            resultsHTML += `<p class="success">✅ ${created} invitaciones creadas exitosamente</p>`;
            
            if (errors.length > 0) {
                resultsHTML += `<p class="error">❌ ${errors.length} errores:</p>`;
                resultsHTML += '<ul>';
                errors.forEach(error => {
                    resultsHTML += `<li>${error}</li>`;
                });
                resultsHTML += '</ul>';
            }
            
            if (createdInvitations.length > 0) {
                resultsHTML += '<h4>Enlaces generados:</h4>';
                resultsHTML += '<div class="csv-links">';
                createdInvitations.forEach(inv => {
                    resultsHTML += `
                        <div class="csv-link-item">
                            <strong>${inv.guestNames.join(' y ')}</strong><br>
                            <input type="text" value="${inv.url}" readonly style="width: 100%; margin: 5px 0;">
                            <button class="btn btn-sm" onclick="copyToClipboard('${inv.url}')">
                                <i class="fas fa-copy"></i> Copiar
                            </button>
                        </div>
                    `;
                });
                resultsHTML += '</div>';
                
                // Add export button
                resultsHTML += `
                    <button class="btn btn-secondary" onclick="exportInvitationLinks()" style="margin-top: 20px;">
                        <i class="fas fa-download"></i> Descargar todos los enlaces
                    </button>
                `;
                
                // Store for export
                window.createdInvitations = createdInvitations;
            }
            
            csvResults.innerHTML = resultsHTML;
            
            // Reset form
            csvFile.value = '';
            fileName.textContent = '';
            uploadBtn.style.display = 'none';
            selectedFile = null;
            
            // Reload invitations list
            loadInvitations();
            loadDashboardData();
            
        } catch (error) {
            csvResults.innerHTML = `<p class="error">Error al procesar el archivo: ${error.message}</p>`;
        }
    });
}

// Parse CSV content
function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const invitations = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple CSV parsing (handles basic cases)
        const parts = line.split(',').map(part => part.trim());
        
        if (parts.length >= 2) {
            const names = parts[0].split(/\s+y\s+/i).map(n => n.trim());
            const passes = parseInt(parts[1]);
            
            if (names.length > 0 && !isNaN(passes) && passes > 0) {
                invitations.push({
                    guestNames: names,
                    numberOfPasses: passes,
                    phone: parts[2] || ''
                });
            }
        }
    }
    
    return invitations;
}

// Export invitation links
function exportInvitationLinks() {
    if (!window.createdInvitations || window.createdInvitations.length === 0) return;
    
    let content = 'Nombres,Código,Enlace\n';
    window.createdInvitations.forEach(inv => {
        content += `"${inv.guestNames.join(' y ')}",${inv.code},${inv.url}\n`;
    });
    
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `invitaciones_enlaces_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Update modal close handlers
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});
