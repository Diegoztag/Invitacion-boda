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
    initPhotoCarousel();
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
    
    // Only show dress code note if it has content
    const dressCodeNoteElement = document.getElementById('dressCodeNote');
    if (WEDDING_CONFIG.dressCode.note && WEDDING_CONFIG.dressCode.note.trim() !== '') {
        dressCodeNoteElement.textContent = WEDDING_CONFIG.dressCode.note;
        dressCodeNoteElement.style.display = 'block';
    } else {
        dressCodeNoteElement.style.display = 'none';
    }
    
    // Show no children note if configured
    const noChildrenNote = document.getElementById('noChildrenNote');
    const noChildrenMessage = document.getElementById('noChildrenMessage');
    
    if (noChildrenNote && noChildrenMessage && WEDDING_CONFIG.guests) {
        // Show only if: children not allowed AND showNoChildrenNote is true
        if (WEDDING_CONFIG.guests.allowChildren === false && 
            WEDDING_CONFIG.guests.showNoChildrenNote === true) {
            noChildrenMessage.textContent = WEDDING_CONFIG.guests.noChildrenMessage || 
                "Esperamos contar con su comprensión para que este sea un evento solo para adultos";
            noChildrenNote.style.display = 'flex';
        } else {
            noChildrenNote.style.display = 'none';
        }
    }
    
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
    
    // Carousel Section - Check if enabled
    const carouselSection = document.getElementById('carousel');
    if (WEDDING_CONFIG.carouselSection && WEDDING_CONFIG.carouselSection.enabled) {
        // Update carousel section content
        const carouselTitle = document.getElementById('carouselSectionTitle');
        if (carouselTitle) {
            carouselTitle.textContent = WEDDING_CONFIG.carouselSection.title;
        }
        
        const carouselSubtitle = document.getElementById('carouselSectionSubtitle');
        if (carouselSubtitle) {
            carouselSubtitle.textContent = WEDDING_CONFIG.carouselSection.subtitle;
        }
        
        // Show the section
        if (carouselSection) {
            carouselSection.style.display = 'block';
        }
    } else {
        // Hide carousel section if not enabled
        if (carouselSection) {
            carouselSection.style.display = 'none';
        }
    }
    
    // Photo/Hashtag Section - Check if enabled
    const photoSection = document.getElementById('fotos');
    if (WEDDING_CONFIG.photoSection && WEDDING_CONFIG.photoSection.enabled) {
        // Update photo section content
        const photoTitle = document.getElementById('photoSectionTitle');
        if (photoTitle) {
            photoTitle.textContent = WEDDING_CONFIG.photoSection.title;
        }
        
        const photoSubtitle = document.getElementById('photoSectionSubtitle');
        if (photoSubtitle) {
            photoSubtitle.textContent = WEDDING_CONFIG.photoSection.subtitle;
        }
        
        // Update hashtag if enabled
        if (WEDDING_CONFIG.photoSection.showHashtag) {
            const instagramHashtag = document.getElementById('instagramHashtag');
            if (instagramHashtag) {
                instagramHashtag.textContent = WEDDING_CONFIG.couple.hashtag;
            }
            
            const hashtagDescription = document.getElementById('hashtagDescription');
            if (hashtagDescription && WEDDING_CONFIG.photoSection.hashtagDescription) {
                hashtagDescription.textContent = WEDDING_CONFIG.photoSection.hashtagDescription;
            }
        } else {
            // Hide hashtag container if not enabled
            const hashtagContainer = document.querySelector('.hashtag-container');
            if (hashtagContainer) {
                hashtagContainer.style.display = 'none';
            }
        }
        
        // Show the section
        if (photoSection) {
            photoSection.style.display = 'block';
        }
    } else {
        // Hide photo section if not enabled
        if (photoSection) {
            photoSection.style.display = 'none';
        }
        
        // Also hide the navigation link to photos
        const photoNavLink = document.querySelector('a[href="#fotos"]');
        if (photoNavLink && photoNavLink.parentElement) {
            photoNavLink.parentElement.style.display = 'none';
        }
    }
    
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
        const isActive = navToggle.classList.contains('active');
        
        if (!isActive) {
            // Opening menu
            navToggle.classList.add('active');
            navMenu.classList.add('active');
            document.body.classList.add('menu-open');
            document.body.style.overflow = 'hidden';
        } else {
            // Closing menu
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
            document.body.style.overflow = '';
        }
    });

    // Close menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
            document.body.style.overflow = '';
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('active') && 
            !navMenu.contains(e.target) && 
            !navToggle.contains(e.target)) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
            document.body.style.overflow = '';
        }
    });

    // Close menu when clicking on overlay
    document.body.addEventListener('click', (e) => {
        if (e.target === document.body && document.body.classList.contains('menu-open')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
            document.body.style.overflow = '';
        }
    });

    // Add scroll effect to navbar
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Highlight active section in navigation
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-link');

    function highlightNavigation() {
        const scrollY = window.pageYOffset;
        const navbar = document.getElementById('navbar');
        const navbarHeight = navbar ? navbar.offsetHeight : 80;
        
        // Add buffer for better detection
        const buffer = 20;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - navbarHeight - buffer;
            const sectionBottom = sectionTop + sectionHeight;
            const sectionId = section.getAttribute('id');

            // More tolerant detection: check if scroll position is within section bounds
            if (scrollY >= sectionTop && scrollY < sectionBottom) {
                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${sectionId}`) {
                        item.classList.add('active');
                    }
                });
            }
        });
        
        // Special case for the last section
        const lastSection = sections[sections.length - 1];
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // If we're at the bottom of the page, activate the last section
        if (scrollY + windowHeight >= documentHeight - 10) {
            navItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('href') === `#${lastSection.getAttribute('id')}`) {
                    item.classList.add('active');
                }
            });
        }
    }

    window.addEventListener('scroll', highlightNavigation);
    highlightNavigation(); // Call on load

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
                // Immediately activate the clicked nav link
                if (this.classList.contains('nav-link')) {
                    document.querySelectorAll('.nav-link').forEach(link => {
                        link.classList.remove('active');
                    });
                    this.classList.add('active');
                }
                
                // Get the actual navbar height dynamically
                const navbar = document.getElementById('navbar');
                const navbarHeight = navbar ? navbar.offsetHeight : 80;
                // Calculate the exact position without extra buffer that might show hero
                const offsetTop = target.offsetTop - navbarHeight;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // After scroll completes, ensure the correct item is highlighted
                // This handles edge cases where the scroll position might be slightly off
                setTimeout(() => {
                    const event = new Event('scroll');
                    window.dispatchEvent(event);
                }, 1000);
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
            // Remove pattern validation when not required
            phoneInput.removeAttribute('pattern');
        }
    } else {
        // If phone field is not shown, make sure it's not required
        phoneGroup.style.display = 'none';
        phoneInput.required = false;
        phoneInput.value = ''; // Clear any value
        // Remove pattern validation when hidden
        phoneInput.removeAttribute('pattern');
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
        
        // Custom phone validation only if field is visible and required
        if (WEDDING_CONFIG.rsvpForm && WEDDING_CONFIG.rsvpForm.showPhoneField && WEDDING_CONFIG.rsvpForm.requirePhone) {
            if (!data.phone || data.phone.trim() === '') {
                phoneInput.focus();
                phoneInput.setCustomValidity('Por favor ingrese su número de teléfono');
                phoneInput.reportValidity();
                return;
            }
            // Validate phone format only if provided and required
            const phonePattern = /^[+]?[0-9]{10,15}$/;
            if (!phonePattern.test(data.phone)) {
                phoneInput.focus();
                phoneInput.setCustomValidity('Por favor ingrese un número válido (10-15 dígitos)');
                phoneInput.reportValidity();
                return;
            }
        }
        
        // Clear any custom validity
        phoneInput.setCustomValidity('');
        
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

    // Special observer for itinerary items with staggered animation
    const itineraryObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add animate-in class for CSS animations
                entry.target.classList.add('animate-in');
                
                // Remove observer after animation
                itineraryObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observe timeline and event cards
    document.querySelectorAll('.timeline-item, .event-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });

    // Observe itinerary items with special animation
    document.querySelectorAll('.itinerary-item').forEach((el, index) => {
        // Set staggered animation delay
        el.style.transitionDelay = `${index * 0.1}s`;
        itineraryObserver.observe(el);
    });

    // Add dynamic zoom effect for itinerary items based on scroll position
    const itineraryItems = document.querySelectorAll('.itinerary-item');
    if (itineraryItems.length > 0) {
        // Use requestAnimationFrame for smoother animations
        let ticking = false;
        let currentFocusedItem = null;
        
        function updateItineraryZoom() {
            const windowHeight = window.innerHeight;
            const centerY = windowHeight / 2;
            let closestItem = null;
            let closestDistance = Infinity;

            // First, find the item closest to center
            itineraryItems.forEach(item => {
                const rect = item.getBoundingClientRect();
                const itemCenterY = rect.top + rect.height / 2;
                const distanceFromCenter = Math.abs(centerY - itemCenterY);
                
                if (distanceFromCenter < closestDistance) {
                    closestDistance = distanceFromCenter;
                    closestItem = item;
                }
            });

            // Only update if the focused item has changed
            if (closestItem !== currentFocusedItem) {
                // Remove focus from all items
                itineraryItems.forEach(item => {
                    item.classList.remove('in-focus');
                });
                
                // Add focus to closest item if it's within threshold
                if (closestDistance < 200) { // Threshold for considering an item "in focus"
                    closestItem.classList.add('in-focus');
                    currentFocusedItem = closestItem;
                } else {
                    currentFocusedItem = null;
                }
            }
            
            ticking = false;
        }
        
        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(updateItineraryZoom);
                ticking = true;
            }
        }
        
        // Initial call
        updateItineraryZoom();
        
        // Throttled scroll event
        window.addEventListener('scroll', requestTick, { passive: true });
        window.addEventListener('resize', requestTick, { passive: true });
    }

    // Add parallax effect to hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxSpeed = 0.5;
            hero.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
        });
    }

    // Animate section titles on scroll
    const sectionTitles = document.querySelectorAll('.section-title');
    const titleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Animate the decorative line after title
                const afterElement = entry.target.querySelector('::after');
                if (afterElement) {
                    setTimeout(() => {
                        entry.target.classList.add('animated');
                    }, 300);
                }
            }
        });
    }, {
        threshold: 0.5
    });

    sectionTitles.forEach(title => {
        title.style.opacity = '0';
        title.style.transform = 'translateY(30px)';
        title.style.transition = 'all 0.8s ease';
        titleObserver.observe(title);
    });
}

// Photo Carousel
function initPhotoCarousel() {
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const indicatorsContainer = document.getElementById('carouselIndicators');
    
    if (!track) return;
    
    // Load photos from configuration
    if (WEDDING_CONFIG.carouselSection && WEDDING_CONFIG.carouselSection.photos) {
        track.innerHTML = ''; // Clear existing content
        
        WEDDING_CONFIG.carouselSection.photos.forEach((photo, index) => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            slide.innerHTML = `
                <img src="${photo.url}" alt="${photo.alt || `Foto ${index + 1}`}">
                <div class="slide-caption">${photo.caption || ''}</div>
            `;
            track.appendChild(slide);
        });
    }
    
    const slides = track.querySelectorAll('.carousel-slide');
    let currentSlide = 0;
    
    // Get carousel configuration from the correct section
    const carouselConfig = WEDDING_CONFIG.carouselSection?.carousel || {};
    const showNavigationButtons = carouselConfig.showNavigationButtons !== false;
    const showIndicators = carouselConfig.showIndicators !== false;
    const autoPlayDelay = carouselConfig.autoPlayDelay || 5000;
    const enableAutoPlay = carouselConfig.enableAutoPlay !== false;
    const enableSwipe = carouselConfig.enableSwipe !== false;
    const enableKeyboard = carouselConfig.enableKeyboard !== false;
    
    // Show/hide navigation buttons based on config
    if (prevBtn && nextBtn) {
        if (!showNavigationButtons) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        }
    }
    
    // Create indicators if enabled
    if (showIndicators && indicatorsContainer) {
        slides.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.classList.add('carousel-indicator');
            if (index === 0) indicator.classList.add('active');
            indicator.addEventListener('click', () => goToSlide(index));
            indicatorsContainer.appendChild(indicator);
        });
    } else if (indicatorsContainer) {
        indicatorsContainer.style.display = 'none';
    }
    
    const indicators = indicatorsContainer?.querySelectorAll('.carousel-indicator') || [];
    
    function updateCarousel() {
        // Move track
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Update indicators
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentSlide);
        });
        
        // Update button states if navigation buttons are shown
        if (showNavigationButtons && prevBtn && nextBtn) {
            prevBtn.style.opacity = currentSlide === 0 ? '0.5' : '1';
            nextBtn.style.opacity = currentSlide === slides.length - 1 ? '0.5' : '1';
        }
    }
    
    function goToSlide(slideIndex) {
        currentSlide = slideIndex;
        updateCarousel();
    }
    
    function nextSlide() {
        if (currentSlide < slides.length - 1) {
            currentSlide++;
            updateCarousel();
        }
    }
    
    function prevSlide() {
        if (currentSlide > 0) {
            currentSlide--;
            updateCarousel();
        }
    }
    
    // Event listeners
    if (prevBtn && nextBtn && showNavigationButtons) {
        nextBtn.addEventListener('click', nextSlide);
        prevBtn.addEventListener('click', prevSlide);
    }
    
    // Touch support for mobile
    if (enableSwipe) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        track.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        track.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
    }
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    }
    
    // Keyboard navigation
    if (enableKeyboard) {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'ArrowRight') nextSlide();
        });
    }
    
    // Auto-play (optional)
    let autoPlayInterval;
    
    function startAutoPlay() {
        autoPlayInterval = setInterval(() => {
            if (currentSlide < slides.length - 1) {
                nextSlide();
            } else {
                goToSlide(0);
            }
        }, autoPlayDelay);
    }
    
    function stopAutoPlay() {
        clearInterval(autoPlayInterval);
    }
    
    // Start auto-play if enabled
    if (enableAutoPlay) {
        startAutoPlay();
        
        // Pause on hover
        track.addEventListener('mouseenter', stopAutoPlay);
        track.addEventListener('mouseleave', startAutoPlay);
        
        // Pause on touch
        track.addEventListener('touchstart', stopAutoPlay);
        track.addEventListener('touchend', () => {
            setTimeout(startAutoPlay, 2000);
        });
    }
}

// Service Worker for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('ServiceWorker registered'))
            .catch(err => console.log('ServiceWorker registration failed'));
    });
}
