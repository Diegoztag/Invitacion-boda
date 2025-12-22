// Admin Panel JavaScript
const API_URL = 'http://localhost:3000/api';
let isAuthenticated = false;
let confirmationChart = null;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    initializeEventListeners();
});

// Authentication
function checkAuthentication() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        isAuthenticated = true;
        showDashboard();
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Simple authentication (in production, this should be handled by the backend)
    if (username === 'admin' && password === 'admin123') {
        isAuthenticated = true;
        localStorage.setItem('adminToken', 'dummy-token');
        showDashboard();
    } else {
        alert('Credenciales incorrectas');
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    isAuthenticated = false;
    loginScreen.style.display = 'flex';
    adminDashboard.style.display = 'none';
});

function showDashboard() {
    loginScreen.style.display = 'none';
    adminDashboard.style.display = 'flex';
    loadDashboardData();
}

// Navigation
function initializeEventListeners() {
    // Navigation links
    document.querySelectorAll('.admin-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            showSection(section);
            
            // Update active state
            document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Search functionality
    document.getElementById('searchConfirmations').addEventListener('input', (e) => {
        filterTable('confirmationsTable', e.target.value);
    });

    // Export functionality
    document.getElementById('exportConfirmations').addEventListener('click', exportToExcel);

    // Add guest
    document.getElementById('addGuest').addEventListener('click', showAddGuestModal);

    // Send reminders
    document.getElementById('sendAllReminders').addEventListener('click', sendAllReminders);

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('show');
        });
    });

    // Add guest form
    document.getElementById('addGuestForm').addEventListener('submit', handleAddGuest);
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(`${sectionName}Section`).classList.add('active');
    
    // Load section data
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'confirmations':
            loadConfirmations();
            break;
        case 'guests':
            loadGuests();
            break;
        case 'reminders':
            loadReminders();
            break;
        case 'photos':
            loadPhotos();
            break;
    }
}

// Dashboard
async function loadDashboardData() {
    try {
        // Simulated data for demo
        const stats = {
            total: 150,
            confirmed: 85,
            declined: 15,
            pending: 50
        };
        
        // Update stats
        document.getElementById('totalGuests').textContent = stats.total;
        document.getElementById('confirmedGuests').textContent = stats.confirmed;
        document.getElementById('declinedGuests').textContent = stats.declined;
        document.getElementById('pendingGuests').textContent = stats.pending;
        
        // Update chart
        updateChart(stats);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateChart(stats) {
    const ctx = document.getElementById('confirmationChart').getContext('2d');
    
    if (confirmationChart) {
        confirmationChart.destroy();
    }
    
    confirmationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Confirmados', 'No Asistirán', 'Pendientes'],
            datasets: [{
                data: [stats.confirmed, stats.declined, stats.pending],
                backgroundColor: [
                    '#4CAF50',
                    '#f44336',
                    '#FFC107'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Estado de Confirmaciones',
                    font: {
                        size: 18
                    }
                }
            }
        }
    });
}

// Confirmations
async function loadConfirmations() {
    try {
        const response = await fetch(`${API_URL}/rsvps`);
        const data = await response.json();
        
        if (data.success) {
            displayConfirmations(data.data);
        }
    } catch (error) {
        console.error('Error loading confirmations:', error);
        // Display demo data
        displayConfirmations(getDemoConfirmations());
    }
}

function displayConfirmations(confirmations) {
    const tbody = document.querySelector('#confirmationsTable tbody');
    tbody.innerHTML = '';
    
    if (confirmations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No hay confirmaciones aún</h3>
                </td>
            </tr>
        `;
        return;
    }
    
    confirmations.forEach(confirmation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${confirmation.Nombre || confirmation.name}</td>
            <td>${confirmation.Email || confirmation.email}</td>
            <td>${confirmation.Teléfono || confirmation.phone}</td>
            <td>
                <span class="badge ${confirmation.Asistirá === 'Sí' || confirmation.attendance === 'si' ? 'badge-success' : 'badge-danger'}">
                    ${confirmation.Asistirá || (confirmation.attendance === 'si' ? 'Sí' : 'No')}
                </span>
            </td>
            <td>${confirmation.Acompañantes || confirmation.guests || '0'}</td>
            <td>${confirmation['Restricciones Alimentarias'] || confirmation.dietary || '-'}</td>
            <td>${confirmation['Fecha de Confirmación'] || confirmation.date || new Date().toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-whatsapp" onclick="sendWhatsApp('${confirmation.Teléfono || confirmation.phone}')">
                        <i class="fas fa-comment"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteConfirmation('${confirmation.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Guests
async function loadGuests() {
    try {
        const response = await fetch(`${API_URL}/pending-confirmations`);
        const data = await response.json();
        
        if (data.success) {
            displayGuests(data.data);
        }
    } catch (error) {
        console.error('Error loading guests:', error);
        // Display demo data
        displayGuests(getDemoGuests());
    }
}

function displayGuests(guests) {
    const tbody = document.querySelector('#guestsTable tbody');
    tbody.innerHTML = '';
    
    guests.forEach(guest => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${guest.name}</td>
            <td>${guest.phone}</td>
            <td>${guest.email || '-'}</td>
            <td>
                <span class="badge ${guest.confirmed ? 'badge-success' : 'badge-warning'}">
                    ${guest.confirmed ? 'Confirmado' : 'Pendiente'}
                </span>
            </td>
            <td>${guest.lastNotification || 'Nunca'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-whatsapp" onclick="sendReminder('${guest.phone}', '${guest.name}')">
                        <i class="fas fa-bell"></i>
                    </button>
                    <button class="btn-icon btn-edit" onclick="editGuest('${guest.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteGuest('${guest.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Reminders
async function loadReminders() {
    try {
        const response = await fetch(`${API_URL}/pending-confirmations`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('pendingReminders').textContent = data.data.length;
            displayReminderHistory();
        }
    } catch (error) {
        console.error('Error loading reminders:', error);
        document.getElementById('pendingReminders').textContent = '0';
    }
}

function displayReminderHistory() {
    const history = document.getElementById('reminderHistory');
    history.innerHTML = `
        <div class="reminder-item">
            <strong>10 recordatorios enviados</strong>
            <p>Hace 2 días - 10:00 AM</p>
        </div>
        <div class="reminder-item">
            <strong>15 recordatorios enviados</strong>
            <p>Hace 5 días - 10:00 AM</p>
        </div>
        <div class="reminder-item">
            <strong>8 recordatorios enviados</strong>
            <p>Hace 7 días - 10:00 AM</p>
        </div>
    `;
}

async function sendAllReminders() {
    if (!confirm('¿Enviar recordatorios a todos los invitados pendientes?')) return;
    
    try {
        // Show loading state
        const btn = document.getElementById('sendAllReminders');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        
        // Simulate sending
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Recordatorios a Pendientes';
            alert('Recordatorios enviados exitosamente');
            loadReminders();
        }, 2000);
        
    } catch (error) {
        console.error('Error sending reminders:', error);
        alert('Error al enviar recordatorios');
    }
}

// Photos
async function loadPhotos() {
    const photoGrid = document.getElementById('adminPhotoGrid');
    
    // Demo photos
    const photos = [
        'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400'
    ];
    
    document.getElementById('totalPhotos').textContent = photos.length;
    
    photoGrid.innerHTML = photos.map((photo, index) => `
        <div class="admin-photo-item">
            <img src="${photo}" alt="Foto ${index + 1}">
            <div class="photo-actions">
                <button class="btn-icon btn-delete" onclick="deletePhoto('${index}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Helper Functions
function filterTable(tableId, searchTerm) {
    const table = document.getElementById(tableId);
    const rows = table.getElementsByTagName('tr');
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    }
}

function exportToExcel() {
    alert('Función de exportación a Excel - Por implementar');
}

function showAddGuestModal() {
    document.getElementById('addGuestModal').classList.add('show');
}

async function handleAddGuest(e) {
    e.preventDefault();
    
    const guestData = {
        name: document.getElementById('guestName').value,
        phone: document.getElementById('guestPhone').value,
        email: document.getElementById('guestEmail').value
    };
    
    // Here you would send to backend
    console.log('Adding guest:', guestData);
    
    // Close modal and refresh
    document.getElementById('addGuestModal').classList.remove('show');
    e.target.reset();
    loadGuests();
}

async function sendReminder(phone, name) {
    if (!confirm(`¿Enviar recordatorio a ${name}?`)) return;
    
    try {
        const response = await fetch(`${API_URL}/send-reminder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone, name })
        });
        
        if (response.ok) {
            alert('Recordatorio enviado exitosamente');
        }
    } catch (error) {
        console.error('Error sending reminder:', error);
        alert('Error al enviar recordatorio');
    }
}

function sendWhatsApp(phone) {
    const message = encodeURIComponent('Hola! Gracias por confirmar tu asistencia a nuestra boda.');
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
}

function deleteConfirmation(id) {
    if (confirm('¿Eliminar esta confirmación?')) {
        console.log('Deleting confirmation:', id);
        loadConfirmations();
    }
}

function editGuest(id) {
    console.log('Editing guest:', id);
}

function deleteGuest(id) {
    if (confirm('¿Eliminar este invitado?')) {
        console.log('Deleting guest:', id);
        loadGuests();
    }
}

function deletePhoto(id) {
    if (confirm('¿Eliminar esta foto?')) {
        console.log('Deleting photo:', id);
        loadPhotos();
    }
}

// Demo Data Functions
function getDemoConfirmations() {
    return [
        {
            name: 'María García',
            email: 'maria@email.com',
            phone: '+52 555 123 4567',
            attendance: 'si',
            guests: '2',
            dietary: 'Vegetariana',
            date: '15/12/2023',
            id: '1'
        },
        {
            name: 'Juan Pérez',
            email: 'juan@email.com',
            phone: '+52 555 234 5678',
            attendance: 'si',
            guests: '1',
            dietary: '',
            date: '16/12/2023',
            id: '2'
        },
        {
            name: 'Ana López',
            email: 'ana@email.com',
            phone: '+52 555 345 6789',
            attendance: 'no',
            guests: '0',
            dietary: '',
            date: '17/12/2023',
            id: '3'
        }
    ];
}

function getDemoGuests() {
    return [
        {
            name: 'Carlos Rodríguez',
            phone: '+52 555 456 7890',
            email: 'carlos@email.com',
            confirmed: false,
            lastNotification: 'Hace 3 días',
            id: '4'
        },
        {
            name: 'Laura Martínez',
            phone: '+52 555 567 8901',
            email: 'laura@email.com',
            confirmed: false,
            lastNotification: 'Nunca',
            id: '5'
        },
        {
            name: 'Pedro Sánchez',
            phone: '+52 555 678 9012',
            email: '',
            confirmed: true,
            lastNotification: 'Hace 1 semana',
            id: '6'
        }
    ];
}
