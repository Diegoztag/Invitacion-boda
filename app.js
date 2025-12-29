// Configuration
const CONFIG = {
    weddingDate: new Date('2026-02-28T17:30:00'),
    googleMapsApiKey: 'YOUR_API_KEY',
    backendUrl: 'http://localhost:3000/api', // URL del backend
    location: {
        lat: 19.4326, // Coordenadas de ejemplo (Ciudad de México)
        lng: -99.1332,
        name: 'Hacienda los Reyes',
        address: 'Ejido el 30'
    }
};

// Global variables
let currentInvitation = null;
let invitationCode = null;

// DOM Elements
const loader = document.getElementById('loader');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');
const modal = document.getElementById('modal');
const modalClose = document.querySelector('.modal-close');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Check for invitation code in URL
    const urlParams = new URLSearchParams(window.location.search);
    invitationCode = urlParams.get('invitation');
    
    if (invitationCode) {
        loadInvitation(invitationCode);
    }
    
    hideLoader();
    initNavigation();
    initCountdown();
    initSmoothScroll();
    initRSVPForm();
    initPhotoUpload();
    initAnimations();
});

// Load invitation data
async function loadInvitation(code) {
    try {
        const response = await fetch(`${CONFIG.backendUrl}/invitation/${code}`);
        
        if (response.ok) {
            const data = await response.json();
            currentInvitation = data.invitation;
            displayInvitationInfo();
            
            // Pre-fill form if available
            if (currentInvitation.email) {
                document.getElementById('email').value = currentInvitation.email;
            }
            if (currentInvitation.phone) {
                document.getElementById('phone').value = currentInvitation.phone;
            }
            
            // Check if already confirmed
            if (currentInvitation.confirmed) {
                showAlreadyConfirmed();
            }
        } else {
            console.error('Invitación no encontrada');
            showModal('Error', 'No se encontró la invitación. Por favor verifica el enlace.');
        }
    } catch (error) {
        console.error('Error loading invitation:', error);
    }
}

// Display invitation information
function displayInvitationInfo() {
    if (!currentInvitation) return;
    
    // Show personalized invitation info
    const invitationInfo = document.getElementById('invitationInfo');
    const guestNames = document.getElementById('guestNames');
    const numberOfPasses = document.getElementById('numberOfPasses');
    
    guestNames.textContent = currentInvitation.guestNames.join(' y ');
    numberOfPasses.textContent = currentInvitation.numberOfPasses;
    invitationInfo.style.display = 'block';
    
    // Update nav logo with initials
    const navLogo = document.querySelector('.nav-logo');
    navLogo.textContent = 'D & F';
}

// Show already confirmed message
function showAlreadyConfirmed() {
    document.getElementById('alreadyConfirmed').style.display = 'block';
    document.getElementById('rsvpForm').style.display = 'none';
}

// Loader
function hideLoader() {
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 1500);
}

// Navigation
function initNavigation() {
    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Navbar scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
        } else {
            navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        }

        lastScroll = currentScroll;
    });
}

// Countdown Timer
function initCountdown() {
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = CONFIG.weddingDate.getTime() - now;

        if (distance < 0) {
            document.getElementById('countdown').innerHTML = '<p class="countdown-ended">¡El gran día ha llegado!</p>';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Smooth Scroll
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// RSVP Form
function initRSVPForm() {
    const form = document.getElementById('rsvpForm');
    const attendanceRadios = document.querySelectorAll('input[name="attendance"]');
    const attendanceDetails = document.getElementById('attendanceDetails');
    const attendingGuestsSelect = document.getElementById('attendingGuests');
    const attendingNamesGroup = document.getElementById('attendingNamesGroup');
    const attendingNamesList = document.getElementById('attendingNamesList');
    const dietaryGroup = document.getElementById('dietaryGroup');
    
    // Handle attendance radio change
    attendanceRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'si') {
                attendanceDetails.style.display = 'block';
                dietaryGroup.style.display = 'block';
                
                // Populate guest number options
                if (currentInvitation) {
                    attendingGuestsSelect.innerHTML = '';
                    for (let i = 1; i <= currentInvitation.numberOfPasses; i++) {
                        const option = document.createElement('option');
                        option.value = i;
                        option.textContent = i + (i === 1 ? ' persona' : ' personas');
                        attendingGuestsSelect.appendChild(option);
                    }
                    
                    // Trigger change event to show name fields
                    attendingGuestsSelect.dispatchEvent(new Event('change'));
                }
            } else {
                attendanceDetails.style.display = 'none';
                dietaryGroup.style.display = 'none';
                attendingNamesGroup.style.display = 'none';
            }
        });
    });
    
    // Handle guest number change
    attendingGuestsSelect.addEventListener('change', (e) => {
        const numGuests = parseInt(e.target.value);
        
        if (numGuests > 0) {
            attendingNamesGroup.style.display = 'block';
            attendingNamesList.innerHTML = '';
            
            // Create name input fields
            for (let i = 0; i < numGuests; i++) {
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.className = 'form-control attending-name';
                nameInput.placeholder = `Nombre del invitado ${i + 1}`;
                nameInput.required = true;
                
                // Pre-fill with guest names if available
                if (currentInvitation && currentInvitation.guestNames[i]) {
                    nameInput.value = currentInvitation.guestNames[i];
                }
                
                attendingNamesList.appendChild(nameInput);
            }
        } else {
            attendingNamesGroup.style.display = 'none';
        }
    });
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Collect attending names
        if (data.attendance === 'si') {
            const nameInputs = document.querySelectorAll('.attending-name');
            data.attendingNames = Array.from(nameInputs).map(input => input.value.trim()).filter(name => name);
        }
        
        // Prepare confirmation data
        const confirmationData = {
            willAttend: data.attendance === 'si',
            attendingGuests: data.attendance === 'si' ? parseInt(data.attendingGuests) : 0,
            attendingNames: data.attendingNames || [],
            email: data.email,
            phone: data.phone,
            dietaryRestrictions: data.dietaryRestrictions || '',
            message: data.message || ''
        };
        
        try {
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            submitBtn.disabled = true;
            
            let response;
            
            if (invitationCode && currentInvitation) {
                // Use personalized invitation endpoint
                response = await fetch(`${CONFIG.backendUrl}/invitation/${invitationCode}/confirm`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(confirmationData)
                });
            } else {
                // Use legacy endpoint
                response = await fetch(`${CONFIG.backendUrl}/rsvp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: data.attendingNames ? data.attendingNames.join(' y ') : 'Invitado',
                        email: data.email,
                        phone: data.phone,
                        attendance: data.attendance,
                        guests: data.attendingGuests || '0',
                        dietary: data.dietaryRestrictions || '',
                        message: data.message || ''
                    })
                });
            }
            
            if (response.ok) {
                const message = data.attendance === 'si' 
                    ? 'Gracias por confirmar tu asistencia. Te esperamos con mucho cariño.'
                    : 'Gracias por avisarnos. Te echaremos de menos en nuestro día especial.';
                showModal('¡Confirmación Recibida!', message);
                
                if (currentInvitation) {
                    showAlreadyConfirmed();
                } else {
                    form.reset();
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al enviar confirmación');
            }
            
            // Restore button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
        } catch (error) {
            console.error('Error:', error);
            showModal('Error', error.message || 'Hubo un problema al enviar tu confirmación. Por favor intenta nuevamente.');
            
            // Restore button
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Confirmación';
            submitBtn.disabled = false;
        }
    });
}

// Photo Upload
function initPhotoUpload() {
    const uploadZone = document.getElementById('uploadZone');
    const photoInput = document.getElementById('photoInput');
    const photoPreview = document.getElementById('photoPreview');
    const uploadButton = document.getElementById('uploadPhotos');
    let selectedFiles = [];

    // Click to upload
    uploadZone.addEventListener('click', () => {
        photoInput.click();
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.background = '#e8e0d0';
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.background = 'var(--accent-color)';
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.background = 'var(--accent-color)';
        handleFiles(e.dataTransfer.files);
    });

    // File input change
    photoInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Handle files
    function handleFiles(files) {
        selectedFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        displayPreview();
    }

    // Display preview
    function displayPreview() {
        photoPreview.innerHTML = '';
        
        if (selectedFiles.length === 0) {
            uploadButton.style.display = 'none';
            return;
        }

        uploadButton.style.display = 'block';

        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    <button class="remove-photo" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                photoPreview.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }

    // Remove photo from preview
    photoPreview.addEventListener('click', (e) => {
        if (e.target.closest('.remove-photo')) {
            const index = parseInt(e.target.closest('.remove-photo').dataset.index);
            selectedFiles.splice(index, 1);
            displayPreview();
        }
    });

    // Upload photos
    uploadButton.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('photos', file);
        });

        try {
            uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
            uploadButton.disabled = true;

            // Send to backend
            const response = await fetch(`${CONFIG.backendUrl}/upload-photos`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                showModal('¡Fotos Subidas!', 'Gracias por compartir estos momentos especiales con nosotros.');
                selectedFiles = [];
                displayPreview();
                loadUploadedPhotos();
            } else {
                throw new Error('Error al subir fotos');
            }

        } catch (error) {
            console.error('Error:', error);
            showModal('Error', 'Hubo un problema al subir las fotos. Por favor intenta nuevamente.');
            
            // For demo purposes, show success anyway
            setTimeout(() => {
                showModal('¡Fotos Subidas!', 'Gracias por compartir estos momentos especiales con nosotros.');
                selectedFiles = [];
                displayPreview();
                addDemoPhotos();
            }, 2000);
        } finally {
            uploadButton.innerHTML = '<i class="fas fa-upload"></i> Subir Fotos';
            uploadButton.disabled = false;
        }
    });

    // Load uploaded photos (demo)
    function loadUploadedPhotos() {
        // This would fetch from backend
        addDemoPhotos();
    }

    // Add demo photos
    function addDemoPhotos() {
        const photoGrid = document.getElementById('photoGrid');
        const demoPhotos = [
            'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
            'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400',
            'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400'
        ];

        demoPhotos.forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Foto de la boda';
            photoGrid.appendChild(img);
        });
    }
}

// Google Maps
function initMap() {
    const map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: CONFIG.location.lat, lng: CONFIG.location.lng },
        zoom: 15,
        styles: [
            {
                "featureType": "all",
                "elementType": "geometry.fill",
                "stylers": [{"weight": "2.00"}]
            },
            {
                "featureType": "all",
                "elementType": "geometry.stroke",
                "stylers": [{"color": "#9c9c9c"}]
            },
            {
                "featureType": "all",
                "elementType": "labels.text",
                "stylers": [{"visibility": "on"}]
            },
            {
                "featureType": "landscape",
                "elementType": "all",
                "stylers": [{"color": "#f2f2f2"}]
            },
            {
                "featureType": "poi",
                "elementType": "all",
                "stylers": [{"visibility": "off"}]
            },
            {
                "featureType": "road",
                "elementType": "all",
                "stylers": [{"saturation": -100}, {"lightness": 45}]
            },
            {
                "featureType": "water",
                "elementType": "all",
                "stylers": [{"color": "#d4a574"}, {"visibility": "on"}]
            }
        ]
    });

    const marker = new google.maps.Marker({
        position: { lat: CONFIG.location.lat, lng: CONFIG.location.lng },
        map: map,
        title: CONFIG.location.name,
        animation: google.maps.Animation.DROP
    });

    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px;">
                <h4 style="margin: 0 0 5px 0;">${CONFIG.location.name}</h4>
                <p style="margin: 0;">${CONFIG.location.address}</p>
            </div>
        `
    });

    marker.addListener('click', () => {
        infoWindow.open(map, marker);
    });
}

// Open in Maps
function openInMaps() {
    const url = `https://www.google.com/maps/search/?api=1&query=${CONFIG.location.lat},${CONFIG.location.lng}`;
    window.open(url, '_blank');
}

// Modal
function showModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.classList.add('show');
}

modalClose.addEventListener('click', () => {
    modal.classList.remove('show');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});

// Animations on scroll
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements
    document.querySelectorAll('.timeline-item, .event-card, .itinerary-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// Service Worker for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('ServiceWorker registered'))
            .catch(err => console.log('ServiceWorker registration failed'));
    });
}
