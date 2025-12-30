// Use configuration from config.js
const CONFIG = {
    weddingDate: WEDDING_CONFIG.event.date,
    googleMapsApiKey: WEDDING_CONFIG.api.googleMapsApiKey,
    backendUrl: WEDDING_CONFIG.api.backendUrl,
    location: {
        lat: WEDDING_CONFIG.location.coordinates.lat,
        lng: WEDDING_CONFIG.location.coordinates.lng,
        name: WEDDING_CONFIG.location.venue.name,
        address: WEDDING_CONFIG.location.venue.address
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
    // Update all dynamic content from config
    updateDynamicContent();
    
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
    initAnimations();
});

// Update all dynamic content from configuration
function updateDynamicContent() {
    // Update nav logo
    const navLogo = document.querySelector('.nav-logo');
    if (WEDDING_CONFIG.navLogo && WEDDING_CONFIG.navLogo.custom) {
        navLogo.textContent = WEDDING_CONFIG.navLogo.text;
    } else {
        // Generate initials automatically from couple names
        navLogo.textContent = `${WEDDING_CONFIG.couple.bride.name.charAt(0)} & ${WEDDING_CONFIG.couple.groom.name.charAt(0)}`;
    }
    
    // Hero section
    document.getElementById('heroTitle').textContent = WEDDING_CONFIG.couple.displayName;
    document.getElementById('heroSubtitle').textContent = WEDDING_CONFIG.messages.welcome;
    document.getElementById('dateDay').textContent = WEDDING_CONFIG.event.dateDisplay.day;
    document.getElementById('dateMonth').textContent = WEDDING_CONFIG.event.dateDisplay.month;
    document.getElementById('dateYear').textContent = WEDDING_CONFIG.event.dateDisplay.year;
    
    // Event details
    document.getElementById('ceremonyName').textContent = WEDDING_CONFIG.location.ceremony.name;
    document.getElementById('ceremonyTime').textContent = WEDDING_CONFIG.location.ceremony.time;
    document.getElementById('ceremonyVenue').textContent = WEDDING_CONFIG.location.venue.name;
    document.getElementById('ceremonyAddress').textContent = WEDDING_CONFIG.location.venue.address;
    
    document.getElementById('receptionName').textContent = WEDDING_CONFIG.location.reception.name;
    document.getElementById('receptionTime').textContent = WEDDING_CONFIG.location.reception.time;
    document.getElementById('receptionVenue').textContent = WEDDING_CONFIG.location.venue.name;
    document.getElementById('receptionAddress').textContent = WEDDING_CONFIG.location.venue.address;
    
    // Dress code
    document.getElementById('dressCodeTitle').textContent = WEDDING_CONFIG.dressCode.title;
    document.getElementById('dressCodeDescription').textContent = WEDDING_CONFIG.dressCode.description;
    document.getElementById('dressCodeNote').textContent = WEDDING_CONFIG.dressCode.note;
    
    // Itinerary
    const itineraryTimeline = document.getElementById('itineraryTimeline');
    itineraryTimeline.innerHTML = '';
    WEDDING_CONFIG.schedule.forEach(item => {
        const div = document.createElement('div');
        div.className = 'itinerary-item';
        div.innerHTML = `
            <div class="itinerary-time">${item.time}</div>
            <div class="itinerary-content">
                <h4>${item.title}</h4>
                <p>${item.description}</p>
            </div>
        `;
        itineraryTimeline.appendChild(div);
    });
    
    // Location
    document.getElementById('locationVenueName').textContent = WEDDING_CONFIG.location.venue.name;
    document.getElementById('locationAddress').textContent = WEDDING_CONFIG.location.venue.address;
    
    // Map iframe
    document.getElementById('mapIframe').src = WEDDING_CONFIG.map.iframeSrc;
    
    // RSVP section
    document.getElementById('rsvpTitle').textContent = WEDDING_CONFIG.messages.rsvpTitle;
    document.getElementById('rsvpSubtitle').textContent = `${WEDDING_CONFIG.messages.rsvpSubtitle} ${WEDDING_CONFIG.event.confirmationDeadline}`;
    
    // Photo section
    document.getElementById('photoSectionTitle').textContent = WEDDING_CONFIG.messages.photoSectionTitle;
    
    // Instagram hashtag
    document.getElementById('instagramHashtag').textContent = WEDDING_CONFIG.couple.hashtag;
    
    // Footer
    document.getElementById('footerNames').textContent = WEDDING_CONFIG.couple.displayName;
    document.getElementById('footerDate').textContent = `${WEDDING_CONFIG.event.dateDisplay.day} de ${WEDDING_CONFIG.event.dateDisplay.month} del ${WEDDING_CONFIG.event.dateDisplay.year}`;
    document.getElementById('footerHashtag').textContent = WEDDING_CONFIG.couple.hashtag;
    
    // Update page title
    document.title = `${WEDDING_CONFIG.event.type} - ${WEDDING_CONFIG.couple.displayName}`;
    
    // Initialize Gift Registry
    initGiftRegistry();
}

// Initialize Gift Registry
function initGiftRegistry() {
    if (!WEDDING_CONFIG.giftRegistry || !WEDDING_CONFIG.giftRegistry.enabled) {
        // Hide gift registry section if not enabled
        const giftSection = document.getElementById('mesa-regalos');
        if (giftSection) giftSection.style.display = 'none';
        return;
    }
    
    // Update gift registry text
    const giftTitle = document.getElementById('giftRegistryTitle');
    const giftSubtitle = document.getElementById('giftRegistrySubtitle');
    
    if (giftTitle) giftTitle.textContent = WEDDING_CONFIG.giftRegistry.title;
    if (giftSubtitle) giftSubtitle.textContent = WEDDING_CONFIG.giftRegistry.subtitle;
    
    // Render gift stores
    const giftStoresContainer = document.getElementById('giftStores');
    if (giftStoresContainer && WEDDING_CONFIG.giftRegistry.stores) {
        giftStoresContainer.innerHTML = '';
        
        WEDDING_CONFIG.giftRegistry.stores.forEach(store => {
            const storeCard = document.createElement('a');
            storeCard.href = store.url;
            storeCard.target = '_blank';
            storeCard.rel = 'noopener noreferrer';
            storeCard.className = 'gift-store-card';
            storeCard.innerHTML = `
                <i class="${store.icon} gift-store-icon"></i>
                <h3>${store.name}</h3>
                <p>${store.description}</p>
            `;
            giftStoresContainer.appendChild(storeCard);
        });
    }
    
    // Render bank account info
    const bankInfo = document.getElementById('bankInfo');
    const bankAccount = WEDDING_CONFIG.giftRegistry.bankAccount;
    
    if (bankInfo && bankAccount && bankAccount.enabled) {
        bankInfo.style.display = 'block';
        
        const bankTitle = document.getElementById('bankTitle');
        const bankDescription = document.getElementById('bankDescription');
        const bankDetails = document.getElementById('bankDetails');
        
        if (bankTitle) bankTitle.textContent = bankAccount.title;
        if (bankDescription) bankDescription.textContent = bankAccount.description;
        
        if (bankDetails && bankAccount.details) {
            bankDetails.innerHTML = `
                <div class="bank-detail-item">
                    <span class="bank-detail-label">Banco:</span>
                    <span class="bank-detail-value">${bankAccount.details.bank}</span>
                </div>
                <div class="bank-detail-item">
                    <span class="bank-detail-label">Titular:</span>
                    <span class="bank-detail-value">${bankAccount.details.accountHolder}</span>
                </div>
                <div class="bank-detail-item">
                    <span class="bank-detail-label">Número de cuenta:</span>
                    <div>
                        <span class="bank-detail-value">${bankAccount.details.accountNumber}</span>
                        <button class="copy-button" onclick="copyToClipboard('${bankAccount.details.accountNumber}', this)">
                            <i class="fas fa-copy"></i> Copiar
                        </button>
                    </div>
                </div>
                <div class="bank-detail-item">
                    <span class="bank-detail-label">CLABE:</span>
                    <div>
                        <span class="bank-detail-value">${bankAccount.details.clabe}</span>
                        <button class="copy-button" onclick="copyToClipboard('${bankAccount.details.clabe}', this)">
                            <i class="fas fa-copy"></i> Copiar
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

// Copy to clipboard function
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        // Change button text temporarily
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copiado';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Error al copiar:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Show feedback
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copiado';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('copied');
        }, 2000);
    });
}

// Load invitation data
async function loadInvitation(code) {
    try {
        const response = await fetch(`${CONFIG.backendUrl}/invitation/${code}`);
        
        if (response.ok) {
            const data = await response.json();
            currentInvitation = data.invitation;
            displayInvitationInfo();
            
            // Pre-fill form if available
            if (currentInvitation.phone) {
                const phoneInput = document.getElementById('phone');
                if (phoneInput) phoneInput.value = currentInvitation.phone;
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
    const phoneGroup = document.getElementById('phoneGroup');
    const phoneInput = document.getElementById('phone');
    const phoneRequired = document.getElementById('phoneRequired');
    
    // Configure phone field based on settings
    if (WEDDING_CONFIG.rsvpForm && WEDDING_CONFIG.rsvpForm.showPhoneField) {
        phoneGroup.style.display = 'block';
        if (WEDDING_CONFIG.rsvpForm.requirePhone) {
            phoneInput.required = true;
            phoneRequired.style.display = 'inline';
        } else {
            phoneInput.required = false;
            phoneRequired.style.display = 'none';
        }
    } else {
        // If phone field is not shown, make sure it's not required
        phoneGroup.style.display = 'none';
        phoneInput.required = false;
        phoneInput.value = ''; // Clear any value
    }
    
    // Handle attendance radio change
    attendanceRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'si') {
                attendanceDetails.style.display = 'block';
                // Show dietary restrictions if enabled in config
                if (WEDDING_CONFIG.rsvpForm && WEDDING_CONFIG.rsvpForm.showDietaryRestrictions) {
                    dietaryGroup.style.display = 'block';
                }
                
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
            phone: data.phone || '', // Ensure phone is at least empty string
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
                    ? WEDDING_CONFIG.messages.confirmationThanks
                    : WEDDING_CONFIG.messages.cannotAttend;
                showModal(WEDDING_CONFIG.messages.confirmationReceived, message);
                
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
    window.open(WEDDING_CONFIG.map.directionsUrl, '_blank');
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
