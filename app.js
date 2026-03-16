// Firebase Configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDfg9Dlit4NsZBmQ0pDWFtP-n1cEOHtOts",
  authDomain: "blitzmed-cd65a.firebaseapp.com",
  projectId: "blitzmed-cd65a",
  storageBucket: "blitzmed-cd65a.firebasestorage.app",
  messagingSenderId: "412932265993",
  appId: "1:412932265993:web:27aac467669f7dc93080d8",
  measurementId: "G-C010LRESQ8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Admin emails - users with these emails will have admin access
const ADMIN_EMAILS = ['admin@blitzmed.com', 'admin@example.com'];

// Global variables
let currentUser = null;
let isAdmin = false;
let currentBookingStep = 1;
let map = null;
let routeMap = null;
let selectedLocationMarker = null;
let currentMapTarget = null;
let bangladeshBounds = null;

// DOM Elements
const elements = {
    // Navigation
    navbar: document.getElementById('navbar'),
    hamburger: document.getElementById('hamburger'),
    navMenu: document.getElementById('navMenu'),
    authBtn: document.getElementById('authBtn'),

    // Modals
    authModal: document.getElementById('authModal'),
    bookingModal: document.getElementById('bookingModal'),
    dashboardModal: document.getElementById('dashboardModal'),
    mapModal: document.getElementById('mapModal'),
    loadingOverlay: document.getElementById('loadingOverlay'),

    // Auth forms
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    loginFormEl: document.getElementById('loginFormEl'),
    registerFormEl: document.getElementById('registerFormEl'),
    showRegister: document.getElementById('showRegister'),
    showLogin: document.getElementById('showLogin'),

    // Booking form
    bookingForm: document.getElementById('bookingForm'),
    bookNowBtn: document.getElementById('bookNowBtn'),
    nextStepBtn: document.getElementById('nextStepBtn'),
    prevStepBtn: document.getElementById('prevStepBtn'),
    submitBookingBtn: document.getElementById('submitBookingBtn'),
    pickupMapBtn: document.getElementById('pickupMapBtn'),
    destinationMapBtn: document.getElementById('destinationMapBtn'),

    // Map elements
    mapModalTitle: document.getElementById('mapModalTitle'),
    map: document.getElementById('map'),
    mapSearch: document.getElementById('mapSearch'),
    mapSearchBtn: document.getElementById('mapSearchBtn'),
    confirmLocationBtn: document.getElementById('confirmLocationBtn'),

    // Dashboard
    myBookingsTab: document.getElementById('myBookingsTab'),
    routesTab: document.getElementById('routesTab'),
    adminPanelTab: document.getElementById('adminPanelTab'),
    logoutBtn: document.getElementById('logoutBtn'),
    myBookings: document.getElementById('myBookings'),
    routes: document.getElementById('routes'),
    adminPanel: document.getElementById('adminPanel'),
    bookingsList: document.getElementById('bookingsList'),
    allBookingsList: document.getElementById('allBookingsList'),
    statusFilter: document.getElementById('statusFilter'),
    refreshDataBtn: document.getElementById('refreshDataBtn'),
    routeBookingSelect: document.getElementById('routeBookingSelect'),
    routeMap: document.getElementById('routeMap'),
    routeDistance: document.getElementById('routeDistance'),
    routeTime: document.getElementById('routeTime'),
    routeStatus: document.getElementById('routeStatus'),

    // Toast container
    toastContainer: document.getElementById('toastContainer')
};

// Utility Functions
const utils = {
    // Show loading overlay
    showLoading() {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.add('active');
        }
    },

    // Hide loading overlay
    hideLoading() {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.remove('active');
        }
    },

    // Open modal with animation
    openModal(modal) {
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    // Close modal with animation
    closeModal(modal) {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    // Create and show toast notification
    showToast(message, type = 'info', title = '') {
        if (!elements.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const iconMap = {
            success: 'fas fa-check',
            error: 'fas fa-times',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info'
        };

        const titleMap = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${iconMap[type] || iconMap.info}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title || titleMap[type] || titleMap.info}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
            <div class="toast-progress"></div>
        `;

        elements.toastContainer.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    },

    // Format timestamp
    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },

    // Validate email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validate phone number
    validatePhone(phone) {
        const re = /^[\+]?[1-9][\d]{0,15}$/;
        return re.test(phone.replace(/[\s\-\(\)]/g, ''));
    },

    // Get error message for Firebase auth errors
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters long.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'default': 'An unexpected error occurred. Please try again.'
        };

        return errorMessages[errorCode] || errorMessages.default;
    },

    // Smooth scroll to section
    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
            // Close mobile menu if open
            if (elements.navMenu) elements.navMenu.classList.remove('active');
            if (elements.hamburger) elements.hamburger.classList.remove('active');
        }
    },

    // Calculate distance between two coordinates (Haversine formula)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km
        return distance;
    },

    // Convert degrees to radians
    deg2rad(deg) {
        return deg * (Math.PI / 180);
    },

    // Format time from minutes
    formatTime(minutes) {
        if (minutes < 60) {
            return `${Math.round(minutes)} minutes`;
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = Math.round(minutes % 60);
            return `${hours}h ${mins}m`;
        }
    }
};

// Map Functions
const mapFunctions = {
    // Initialize map for location selection
    initMap() {
        if (!elements.map) return;

        // Initialize map centered on Bangladesh
        map = L.map('map').setView([23.6850, 90.3563], 7);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Set Bangladesh bounds (approximate)
        bangladeshBounds = L.latLngBounds(
            [20.670, 88.028], // Southwest
            [26.634, 92.673]  // Northeast
        );

        // Add click event to map
        map.on('click', (e) => {
            this.handleMapClick(e);
        });

        // Add Bangladesh boundary layer (using GeoJSON)
        this.loadBangladeshBoundaries();
    },

    // Load Bangladesh boundaries from GeoJSON
    loadBangladeshBoundaries() {
        fetch('https://raw.githubusercontent.com/hasanshahriar/bangladesh-geojson/master/bd-divisions.json')
            .then(response => response.json())
            .then(data => {
                L.geoJSON(data, {
                    style: {
                        color: '#dc2626',
                        weight: 2,
                        fillOpacity: 0.1
                    }
                }).addTo(map);
            })
            .catch(error => {
                console.error('Error loading Bangladesh boundaries:', error);
            });
    },

    // Handle map click event
    handleMapClick(e) {
        const { lat, lng } = e.latlng;

        // Check if clicked within Bangladesh bounds
        if (!bangladeshBounds.contains(e.latlng)) {
            utils.showToast('Please select a location within Bangladesh', 'warning');
            return;
        }

        // Remove existing marker
        if (selectedLocationMarker) {
            map.removeLayer(selectedLocationMarker);
        }

        // Add new marker
        selectedLocationMarker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'route-marker',
                html: '<i class="fas fa-map-marker-alt" style="color: white; font-size: 16px; margin-top: 8px;"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            })
        }).addTo(map);

        // Reverse geocode to get address
        this.reverseGeocode(lat, lng);
    },

    // Reverse geocode coordinates to address
    reverseGeocode(lat, lng) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
                const address = data.display_name;
                elements.mapSearch.value = address;
            })
            .catch(error => {
                console.error('Reverse geocoding error:', error);
                elements.mapSearch.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            });
    },

    // Search for location
    searchLocation() {
        const query = elements.mapSearch.value.trim();
        if (!query) return;

        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=bd&limit=1`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const { lat, lon, display_name } = data[0];

                    // Pan map to location
                    map.panTo([lat, lon]);

                    // Remove existing marker
                    if (selectedLocationMarker) {
                        map.removeLayer(selectedLocationMarker);
                    }

                    // Add new marker
                    selectedLocationMarker = L.marker([lat, lon], {
                        icon: L.divIcon({
                            className: 'route-marker',
                            html: '<i class="fas fa-map-marker-alt" style="color: white; font-size: 16px; margin-top: 8px;"></i>',
                            iconSize: [30, 30],
                            iconAnchor: [15, 30]
                        })
                    }).addTo(map);

                    // Update search field with full address
                    elements.mapSearch.value = display_name;
                } else {
                    utils.showToast('Location not found in Bangladesh', 'warning');
                }
            })
            .catch(error => {
                console.error('Geocoding error:', error);
                utils.showToast('Error searching for location', 'error');
            });
    },

    // Confirm selected location
    confirmLocation() {
        if (!selectedLocationMarker || !currentMapTarget) return;

        const latlng = selectedLocationMarker.getLatLng();
        const address = elements.mapSearch.value;

        // Set the value in the target input field
        const targetInput = document.getElementById(currentMapTarget);
        if (targetInput) {
            targetInput.value = address;

            // Also store coordinates in data attributes for routing
            targetInput.dataset.lat = latlng.lat;
            targetInput.dataset.lng = latlng.lng;
        }

        // Close map modal
        utils.closeModal(elements.mapModal);
        utils.showToast('Location selected successfully', 'success');
    },

    // Open map for location selection
    openMapForSelection(target) {
        currentMapTarget = target;

        // Set modal title based on target
        elements.mapModalTitle.textContent = `Select ${target === 'pickupLocation' ? 'Pickup' : 'Destination'} Location`;

        // Reset map state
        elements.mapSearch.value = '';
        if (selectedLocationMarker) {
            map.removeLayer(selectedLocationMarker);
            selectedLocationMarker = null;
        }

        // Open modal
        utils.openModal(elements.mapModal);

        // Initialize map if not already done
        if (!map) {
            this.initMap();
        } else {
            // Recenter map on Bangladesh
            map.setView([23.6850, 90.3563], 7);
        }
    },

    // Initialize route map in dashboard
    initRouteMap() {
        if (!elements.routeMap) return;

        // Initialize map centered on Bangladesh
        routeMap = L.map('routeMap').setView([23.6850, 90.3563], 7);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(routeMap);

        // Load Bangladesh boundaries
        this.loadRouteMapBoundaries();
    },

    // Load Bangladesh boundaries for route map
    loadRouteMapBoundaries() {
        fetch('https://raw.githubusercontent.com/hasanshahriar/bangladesh-geojson/master/bd-divisions.json')
            .then(response => response.json())
            .then(data => {
                L.geoJSON(data, {
                    style: {
                        color: '#dc2626',
                        weight: 2,
                        fillOpacity: 0.1
                    }
                }).addTo(routeMap);
            })
            .catch(error => {
                console.error('Error loading Bangladesh boundaries:', error);
            });
    },

    // Show route on map
    showRoute(pickupLat, pickupLng, destLat, destLng, pickupAddress, destAddress) {
        if (!routeMap) this.initRouteMap();

        // Clear existing layers
        routeMap.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                routeMap.removeLayer(layer);
            }
        });

        // Add pickup marker
        const pickupMarker = L.marker([pickupLat, pickupLng], {
            icon: L.divIcon({
                className: 'route-marker',
                html: '<i class="fas fa-map-marker-alt" style="color: white; font-size: 16px; margin-top: 8px;"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            })
        }).addTo(routeMap);
        pickupMarker.bindPopup(`<strong>Pickup:</strong> ${pickupAddress}`).openPopup();

        // Add destination marker
        const destMarker = L.marker([destLat, destLng], {
            icon: L.divIcon({
                className: 'route-marker',
                html: '<i class="fas fa-hospital" style="color: white; font-size: 16px; margin-top: 8px;"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            })
        }).addTo(routeMap);
        destMarker.bindPopup(`<strong>Destination:</strong> ${destAddress}`);

        // Add route line
        const routeLine = L.polyline([[pickupLat, pickupLng], [destLat, destLng]], {
            color: '#dc2626',
            weight: 4,
            opacity: 0.7,
            dashArray: '10, 10'
        }).addTo(routeMap);

        // Fit map to show both markers
        routeMap.fitBounds([[pickupLat, pickupLng], [destLat, destLng]], { padding: [50, 50] });

        // Calculate distance and time
        const distance = utils.calculateDistance(pickupLat, pickupLng, destLat, destLng);
        const timeMinutes = (distance / 40) * 60; // Assuming 40 km/h average speed

        // Update route info
        elements.routeDistance.textContent = `${distance.toFixed(1)} km`;
        elements.routeTime.textContent = utils.formatTime(timeMinutes);
    }
};

// Form Validation
const validation = {
    // Validate single field
    validateField(field, rules = {}) {
        if (!field) return false;

        const value = field.value.trim();
        const fieldName = field.id || field.name;
        const errorElement = field.closest('.input-group')?.querySelector('.field-error');

        let isValid = true;
        let errorMessage = '';

        // Required validation
        if (rules.required && !value) {
            isValid = false;
            errorMessage = `${rules.label || fieldName} is required`;
        }

        // Email validation
        if (value && rules.email && !utils.validateEmail(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }

        // Phone validation
        if (value && rules.phone && !utils.validatePhone(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number';
        }

        // Min length validation
        if (value && rules.minLength && value.length < rules.minLength) {
            isValid = false;
            errorMessage = `Minimum ${rules.minLength} characters required`;
        }

        // Update UI
        if (errorElement) {
            errorElement.textContent = errorMessage;
        }

        const inputField = field.closest('.input-field');
        if (inputField) {
            inputField.classList.toggle('error', !isValid);
        }

        return isValid;
    },

    // Validate entire form
    validateForm(form, rules) {
        if (!form || !rules) return false;

        let isValid = true;

        Object.keys(rules).forEach(fieldId => {
            const field = form.querySelector(`#${fieldId}`);
            if (field) {
                const fieldValid = this.validateField(field, rules[fieldId]);
                if (!fieldValid) isValid = false;
            }
        });

        return isValid;
    }
};

// Authentication Functions
const authFunctions = {
    // Initialize auth state listener
    initAuthStateListener() {
        auth.onAuthStateChanged((user) => {
            currentUser = user;
            isAdmin = user && ADMIN_EMAILS.includes(user.email);
            this.updateUI();
        });
    },

    // Update UI based on auth state
    updateUI() {
        if (elements.authBtn) {
            if (currentUser) {
                elements.authBtn.innerHTML = `
                    <i class="fas fa-user-circle"></i>
                    <span>${currentUser.displayName || 'Dashboard'}</span>
                `;
            } else {
                elements.authBtn.innerHTML = `
                    <i class="fas fa-user"></i>
                    <span>Login</span>
                `;
            }
        }

        // Show/hide admin panel tab
        if (elements.adminPanelTab) {
            elements.adminPanelTab.style.display = isAdmin ? 'flex' : 'none';
        }
    },

    // Login user
    async login(email, password) {
        try {
            utils.showLoading();
            await auth.signInWithEmailAndPassword(email, password);
            utils.closeModal(elements.authModal);
            utils.showToast('Successfully logged in!', 'success');
        } catch (error) {
            utils.showToast(utils.getErrorMessage(error.code), 'error');
        } finally {
            utils.hideLoading();
        }
    },

    // Register user
    async register(name, email, password) {
        try {
            utils.showLoading();
            const result = await auth.createUserWithEmailAndPassword(email, password);

            // Update profile with display name
            await result.user.updateProfile({
                displayName: name
            });

            // Save user data to database
            await database.ref(`users/${result.user.uid}`).set({
                name: name,
                email: email,
                createdAt: Date.now()
            });

            utils.closeModal(elements.authModal);
            utils.showToast('Account created successfully!', 'success');
        } catch (error) {
            utils.showToast(utils.getErrorMessage(error.code), 'error');
        } finally {
            utils.hideLoading();
        }
    },

    // Logout user
    async logout() {
        try {
            await auth.signOut();
            utils.closeModal(elements.dashboardModal);
            utils.showToast('Successfully logged out!', 'info');
        } catch (error) {
            utils.showToast('Error logging out. Please try again.', 'error');
        }
    },

    // Switch between login and register forms
    switchForm(showRegister = true) {
        if (elements.loginForm && elements.registerForm) {
            if (showRegister) {
                elements.loginForm.classList.remove('active');
                elements.registerForm.classList.add('active');
                document.querySelector('#authTitle').textContent = 'Create Account';
            } else {
                elements.registerForm.classList.remove('active');
                elements.loginForm.classList.add('active');
                document.querySelector('#authTitle').textContent = 'Welcome Back';
            }
        }
    }
};

// Booking Functions
const bookingFunctions = {
    // Initialize booking modal
    initBookingModal() {
        this.updateBookingStep(1);
    },

    // Update booking step
    updateBookingStep(step) {
        currentBookingStep = step;

        // Update progress indicators
        document.querySelectorAll('.progress-step').forEach((stepEl, index) => {
            const stepNumber = index + 1;
            stepEl.classList.toggle('active', stepNumber === step);
            stepEl.classList.toggle('completed', stepNumber < step);
        });

        // Show/hide steps
        document.querySelectorAll('.booking-step').forEach((stepEl, index) => {
            const stepNumber = index + 1;
            stepEl.classList.toggle('active', stepNumber === step);
        });

        // Update buttons
        if (elements.prevStepBtn) {
            elements.prevStepBtn.style.display = step > 1 ? 'flex' : 'none';
        }
        if (elements.nextStepBtn) {
            elements.nextStepBtn.style.display = step < 4 ? 'flex' : 'none';
        }
        if (elements.submitBookingBtn) {
            elements.submitBookingBtn.style.display = step === 4 ? 'flex' : 'none';
        }

        // Update summary on step 4
        if (step === 4) {
            this.updateBookingSummary();
        }
    },

    // Validate current step
    validateCurrentStep() {
        const currentStepEl = document.querySelector(`.booking-step[data-step="${currentBookingStep}"]`);
        if (!currentStepEl) return false;

        const requiredFields = currentStepEl.querySelectorAll('input[required], select[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                const inputField = field.closest('.input-field');
                if (inputField) {
                    inputField.classList.add('error');
                }
                const errorElement = field.closest('.input-group')?.querySelector('.field-error');
                if (errorElement) {
                    errorElement.textContent = 'This field is required';
                }
            }
        });

        // Validate radio buttons
        const radioGroups = currentStepEl.querySelectorAll('input[type="radio"]');
        const radioGroupNames = [...new Set([...radioGroups].map(r => r.name))];

        radioGroupNames.forEach(name => {
            const selectedRadio = currentStepEl.querySelector(`input[name="${name}"]:checked`);
            if (!selectedRadio) {
                isValid = false;
                utils.showToast('Please make a selection', 'warning');
            }
        });

        return isValid;
    },

    // Go to next step
    nextStep() {
        if (this.validateCurrentStep() && currentBookingStep < 4) {
            this.updateBookingStep(currentBookingStep + 1);
        }
    },

    // Go to previous step
    prevStep() {
        if (currentBookingStep > 1) {
            this.updateBookingStep(currentBookingStep - 1);
        }
    },

    // Update booking summary
    updateBookingSummary() {
        const form = elements.bookingForm;
        if (!form) return;

        const summaryElements = {
            summaryPatient: document.getElementById('summaryPatient'),
            summaryContact: document.getElementById('summaryContact'),
            summaryEmergencyContact: document.getElementById('summaryEmergencyContact'),
            summaryPickup: document.getElementById('summaryPickup'),
            summaryDestination: document.getElementById('summaryDestination'),
            summaryService: document.getElementById('summaryService'),
            summaryUrgency: document.getElementById('summaryUrgency')
        };

        // Update summary values
        if (summaryElements.summaryPatient) {
            summaryElements.summaryPatient.textContent = form.patientName?.value || 'N/A';
        }
        if (summaryElements.summaryContact) {
            summaryElements.summaryContact.textContent = form.contactNumber?.value || 'N/A';
        }
        if (summaryElements.summaryEmergencyContact) {
            const emergencyName = form.emergencyContactName?.value || '';
            const emergencyPhone = form.emergencyContactPhone?.value || '';
            const contactInfo = emergencyName && emergencyPhone ? `${emergencyName} (${emergencyPhone})` : 'Not provided';
            summaryElements.summaryEmergencyContact.textContent = contactInfo;
        }
        if (summaryElements.summaryPickup) {
            summaryElements.summaryPickup.textContent = form.pickupLocation?.value || 'N/A';
        }
        if (summaryElements.summaryDestination) {
            summaryElements.summaryDestination.textContent = form.destination?.value || 'N/A';
        }
        if (summaryElements.summaryService) {
            const selectedService = form.querySelector('input[name="serviceType"]:checked');
            summaryElements.summaryService.textContent = selectedService?.value || 'N/A';
        }
        if (summaryElements.summaryUrgency) {
            const selectedUrgency = form.querySelector('input[name="urgencyLevel"]:checked');
            summaryElements.summaryUrgency.textContent = selectedUrgency?.value || 'N/A';
        }
    },

    // Submit booking
    async submitBooking() {
        if (!currentUser) {
            utils.showToast('Please login to book an ambulance', 'warning');
            return;
        }

        const form = elements.bookingForm;
        if (!form) return;

        try {
            utils.showLoading();

            // Geocode addresses to get coordinates
            const pickupCoords = await this.geocodeAddress(form.pickupLocation.value);
            const destCoords = await this.geocodeAddress(form.destination.value);

            const bookingData = {
                patientName: form.patientName?.value || '',
                contactNumber: form.contactNumber?.value || '',
                pickupLocation: form.pickupLocation?.value || '',
                pickupLat: pickupCoords.lat || '',
                pickupLng: pickupCoords.lng || '',
                destination: form.destination?.value || '',
                destLat: destCoords.lat || '',
                destLng: destCoords.lng || '',
                serviceType: form.querySelector('input[name="serviceType"]:checked')?.value || '',
                urgencyLevel: form.querySelector('input[name="urgencyLevel"]:checked')?.value || '',
                medicalNotes: form.medicalNotes?.value || '',
                userId: currentUser.uid,
                userEmail: currentUser.email,
                status: 'pending',
                createdAt: Date.now()
            };

            // Save to database
            const bookingRef = database.ref('bookings').push();
            await bookingRef.set(bookingData);

            utils.closeModal(elements.bookingModal);
            utils.showToast('Booking submitted successfully! You will receive confirmation shortly.', 'success');

            // Reset form
            form.reset();
            this.updateBookingStep(1);

        } catch (error) {
            console.error('Booking submission error:', error);
            utils.showToast('Failed to submit booking. Please try again.', 'error');
        } finally {
            utils.hideLoading();
        }
    },

    // Geocode address to coordinates
    async geocodeAddress(address) {
        if (!address) return { lat: null, lng: null };

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=bd&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        }

        return { lat: null, lng: null };
    }
};

// Dashboard Functions
const dashboardFunctions = {
    // Load user bookings
    async loadUserBookings() {
        if (!currentUser || !elements.bookingsList) return;

        try {
            const snapshot = await database.ref('bookings')
                .orderByChild('userId')
                .equalTo(currentUser.uid)
                .once('value');

            const bookings = [];
            snapshot.forEach(childSnapshot => {
                bookings.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });

            this.displayBookings(bookings, elements.bookingsList);
            this.populateRouteDropdown(bookings);
        } catch (error) {
            console.error('Error loading user bookings:', error);
            utils.showToast('Failed to load bookings', 'error');
        }
    },

    // Load all bookings (admin only)
    async loadAllBookings() {
        if (!isAdmin || !elements.allBookingsList) return;

        try {
            const snapshot = await database.ref('bookings').once('value');
            const bookings = [];

            snapshot.forEach(childSnapshot => {
                bookings.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });

            // Apply status filter
            const statusFilter = elements.statusFilter?.value;
            const filteredBookings = statusFilter
                ? bookings.filter(booking => booking.status === statusFilter)
                : bookings;

            this.displayBookings(filteredBookings, elements.allBookingsList, true);
        } catch (error) {
            console.error('Error loading all bookings:', error);
            utils.showToast('Failed to load bookings', 'error');
        }
    },

    // Display bookings in list
    displayBookings(bookings, container, isAdmin = false) {
        if (!container) return;

        if (bookings.length === 0) {
            container.innerHTML = `
                <div class="no-bookings">
                    <i class="fas fa-calendar-times"></i>
                    <h4>No bookings found</h4>
                    <p>${isAdmin ? 'No bookings match the current filter.' : 'You haven\'t made any ambulance bookings yet.'}</p>
                </div>
            `;
            return;
        }

        // Sort bookings by creation date (newest first)
        bookings.sort((a, b) => b.createdAt - a.createdAt);

        container.innerHTML = bookings.map(booking => `
            <div class="booking-item">
                <div class="booking-header">
                    <div class="booking-info">
                        <h4>${booking.patientName}</h4>
                        <p>Booking ID: ${booking.id}</p>
                    </div>
                    <span class="booking-status ${booking.status}">${booking.status}</span>
                </div>
                <div class="booking-details">
                    <div class="detail-item">
                        <span class="detail-label">Contact</span>
                        <span class="detail-value">${booking.contactNumber}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">From</span>
                        <span class="detail-value">${booking.pickupLocation}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">To</span>
                        <span class="detail-value">${booking.destination}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Service</span>
                        <span class="detail-value">${booking.serviceType}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Urgency</span>
                        <span class="detail-value">${booking.urgencyLevel}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Created</span>
                        <span class="detail-value">${utils.formatDate(booking.createdAt)}</span>
                    </div>
                    ${isAdmin ? `
                        <div class="detail-item">
                            <span class="detail-label">User</span>
                            <span class="detail-value">${booking.userEmail}</span>
                        </div>
                    ` : ''}
                </div>
                ${isAdmin ? `
                    <div class="booking-actions">
                        <select onchange="dashboardFunctions.updateBookingStatus('${booking.id}', this.value)" class="filter-select">
                            <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="in-progress" ${booking.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                            <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                ` : ''}
            </div>
        `).join('');
    },

    // Populate route dropdown with bookings
    populateRouteDropdown(bookings) {
        if (!elements.routeBookingSelect) return;

        // Clear existing options except the first one
        elements.routeBookingSelect.innerHTML = '<option value="">Select a booking</option>';

        // Add bookings to dropdown
        bookings.forEach(booking => {
            const option = document.createElement('option');
            option.value = booking.id;
            option.textContent = `${booking.patientName} - ${booking.pickupLocation} to ${booking.destination}`;
            elements.routeBookingSelect.appendChild(option);
        });
    },

    // Load route for selected booking
    async loadRoute(bookingId) {
        if (!bookingId) return;

        try {
            const snapshot = await database.ref(`bookings/${bookingId}`).once('value');
            const booking = snapshot.val();

            if (!booking) {
                utils.showToast('Booking not found', 'error');
                return;
            }

            // Update route status
            elements.routeStatus.textContent = booking.status;

            // Show route on map if coordinates are available
            if (booking.pickupLat && booking.pickupLng && booking.destLat && booking.destLng) {
                mapFunctions.showRoute(
                    booking.pickupLat,
                    booking.pickupLng,
                    booking.destLat,
                    booking.destLng,
                    booking.pickupLocation,
                    booking.destination
                );
            } else {
                // Try to geocode addresses if coordinates are missing
                try {
                    const pickupCoords = await bookingFunctions.geocodeAddress(booking.pickupLocation);
                    const destCoords = await bookingFunctions.geocodeAddress(booking.destination);

                    if (pickupCoords.lat && destCoords.lat) {
                        // Update booking with coordinates
                        await database.ref(`bookings/${bookingId}`).update({
                            pickupLat: pickupCoords.lat,
                            pickupLng: pickupCoords.lng,
                            destLat: destCoords.lat,
                            destLng: destCoords.lng
                        });

                        // Show route
                        mapFunctions.showRoute(
                            pickupCoords.lat,
                            pickupCoords.lng,
                            destCoords.lat,
                            destCoords.lng,
                            booking.pickupLocation,
                            booking.destination
                        );
                    } else {
                        utils.showToast('Could not calculate route for this booking', 'warning');
                    }
                } catch (error) {
                    console.error('Error geocoding addresses:', error);
                    utils.showToast('Could not calculate route for this booking', 'warning');
                }
            }
        } catch (error) {
            console.error('Error loading booking:', error);
            utils.showToast('Failed to load booking details', 'error');
        }
    },

    // Update booking status (admin only)
    async updateBookingStatus(bookingId, newStatus) {
        if (!isAdmin) return;

        try {
            await database.ref(`bookings/${bookingId}`).update({
                status: newStatus,
                updatedAt: Date.now()
            });

            utils.showToast('Booking status updated successfully', 'success');
            this.loadAllBookings(); // Refresh the list
        } catch (error) {
            console.error('Error updating booking status:', error);
            utils.showToast('Failed to update booking status', 'error');
        }
    },

    // Switch dashboard tabs
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`)?.classList.add('active');

        // Update tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName)?.classList.add('active');

        // Load data for active tab
        if (tabName === 'myBookings') {
            this.loadUserBookings();
        } else if (tabName === 'routes') {
            this.loadUserBookings();
        } else if (tabName === 'adminPanel' && isAdmin) {
            this.loadAllBookings();
        }
    }
};

// Toggle password visibility
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const toggle = field?.nextElementSibling;

    if (field && toggle) {
        const isPassword = field.type === 'password';
        field.type = isPassword ? 'text' : 'password';
        toggle.innerHTML = `<i class="fas fa-eye${isPassword ? '-slash' : ''}"></i>`;
    }
}

// Event Listeners
function initializeEventListeners() {
    // Navigation scroll effect
    window.addEventListener('scroll', () => {
        if (elements.navbar) {
            if (window.scrollY > 100) {
                elements.navbar.classList.add('scrolled');
            } else {
                elements.navbar.classList.remove('scrolled');
            }
        }
    });

    // Mobile navigation toggle
    if (elements.hamburger) {
        elements.hamburger.addEventListener('click', () => {
            elements.navMenu?.classList.toggle('active');
            elements.hamburger.classList.toggle('active');
        });
    }

    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href?.startsWith('#')) {
                utils.scrollToSection(href.substring(1));
            }

            // Update active state
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Auth button
    if (elements.authBtn) {
        elements.authBtn.addEventListener('click', () => {
            if (currentUser) {
                utils.openModal(elements.dashboardModal);
                dashboardFunctions.switchTab('myBookings');
            } else {
                utils.openModal(elements.authModal);
            }
        });
    }

    // Book now button
    if (elements.bookNowBtn) {
        elements.bookNowBtn.addEventListener('click', () => {
            if (currentUser) {
                utils.openModal(elements.bookingModal);
                bookingFunctions.initBookingModal();
            } else {
                utils.showToast('Please login to book an ambulance', 'warning');
                utils.openModal(elements.authModal);
            }
        });
    }

    // Map selection buttons
    if (elements.pickupMapBtn) {
        elements.pickupMapBtn.addEventListener('click', () => {
            mapFunctions.openMapForSelection('pickupLocation');
        });
    }
    if (elements.destinationMapBtn) {
        elements.destinationMapBtn.addEventListener('click', () => {
            mapFunctions.openMapForSelection('destination');
        });
    }

    // Map search button
    if (elements.mapSearchBtn) {
        elements.mapSearchBtn.addEventListener('click', () => {
            mapFunctions.searchLocation();
        });
    }

    // Map search enter key
    if (elements.mapSearch) {
        elements.mapSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                mapFunctions.searchLocation();
            }
        });
    }

    // Confirm location button
    if (elements.confirmLocationBtn) {
        elements.confirmLocationBtn.addEventListener('click', () => {
            mapFunctions.confirmLocation();
        });
    }

    // Route booking selection
    if (elements.routeBookingSelect) {
        elements.routeBookingSelect.addEventListener('change', (e) => {
            dashboardFunctions.loadRoute(e.target.value);
        });
    }

    // Auth form switches
    if (elements.showRegister) {
        elements.showRegister.addEventListener('click', () => {
            authFunctions.switchForm(true);
        });
    }
    if (elements.showLogin) {
        elements.showLogin.addEventListener('click', () => {
            authFunctions.switchForm(false);
        });
    }

    // Auth form submissions
    if (elements.loginFormEl) {
        elements.loginFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value;
            const password = document.getElementById('loginPassword')?.value;
            if (email && password) {
                await authFunctions.login(email, password);
            }
        });
    }

    if (elements.registerFormEl) {
        elements.registerFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName')?.value;
            const email = document.getElementById('registerEmail')?.value;
            const password = document.getElementById('registerPassword')?.value;
            if (name && email && password) {
                await authFunctions.register(name, email, password);
            }
        });
    }

    // Booking form navigation
    if (elements.nextStepBtn) {
        elements.nextStepBtn.addEventListener('click', () => {
            bookingFunctions.nextStep();
        });
    }
    if (elements.prevStepBtn) {
        elements.prevStepBtn.addEventListener('click', () => {
            bookingFunctions.prevStep();
        });
    }
    if (elements.submitBookingBtn) {
        elements.submitBookingBtn.addEventListener('click', () => {
            bookingFunctions.submitBooking();
        });
    }

    // Dashboard tabs
    if (elements.myBookingsTab) {
        elements.myBookingsTab.addEventListener('click', () => {
            dashboardFunctions.switchTab('myBookings');
        });
    }
    if (elements.routesTab) {
        elements.routesTab.addEventListener('click', () => {
            dashboardFunctions.switchTab('routes');
        });
    }
    if (elements.adminPanelTab) {
        elements.adminPanelTab.addEventListener('click', () => {
            dashboardFunctions.switchTab('adminPanel');
        });
    }
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', () => {
            authFunctions.logout();
        });
    }

    // Status filter
    if (elements.statusFilter) {
        elements.statusFilter.addEventListener('change', () => {
            if (isAdmin) {
                dashboardFunctions.loadAllBookings();
            }
        });
    }

    // Refresh data button
    if (elements.refreshDataBtn) {
        elements.refreshDataBtn.addEventListener('click', () => {
            dashboardFunctions.loadUserBookings();
            if (isAdmin) {
                dashboardFunctions.loadAllBookings();
            }
        });
    }

    // Service card click handlers
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', () => {
            const serviceType = card.getAttribute('data-service');
            openBookingWithService(serviceType);
        });
    });

    // Emergency contact sharing handlers
    const autoFillContactBtn = document.getElementById('autoFillContactBtn');
    const shareContactBtn = document.getElementById('shareContactBtn');

    if (autoFillContactBtn) {
        autoFillContactBtn.addEventListener('click', () => {
            autoFillEmergencyContact();
        });
    }

    if (shareContactBtn) {
        shareContactBtn.addEventListener('click', () => {
            shareEmergencyContact();
        });
    }

    // Close modals when clicking backdrop
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                utils.closeModal(modal);
            }
        });
    });

    // Clear form errors on input
    document.querySelectorAll('input, textarea').forEach(field => {
        field.addEventListener('input', () => {
            const inputField = field.closest('.input-field');
            const errorElement = field.closest('.input-group')?.querySelector('.field-error');

            if (inputField) {
                inputField.classList.remove('error');
            }
            if (errorElement) {
                errorElement.textContent = '';
            }
        });
    });
}

// Function to open booking modal with pre-selected service
function openBookingWithService(serviceType) {
    if (!currentUser) {
        utils.openModal(elements.authModal);
        utils.showToast('Please login to book an ambulance', 'info');
        return;
    }

    utils.openModal(elements.bookingModal);
    bookingFunctions.initBookingModal();

    // Pre-select the service type
    setTimeout(() => {
        const serviceRadios = document.querySelectorAll('input[name="serviceType"]');
        serviceRadios.forEach(radio => {
            const serviceOption = radio.closest('.service-option');
            if (serviceOption && serviceOption.getAttribute('data-service') === serviceType) {
                radio.checked = true;
            }
        });
    }, 100); // Small delay to ensure modal is fully rendered
}

// Emergency contact sharing functions
function autoFillEmergencyContact() {
    if (!currentUser) {
        utils.showToast('Please login to use this feature', 'warning');
        return;
    }

    const emergencyContactName = document.getElementById('emergencyContactName');
    const emergencyContactPhone = document.getElementById('emergencyContactPhone');

    if (emergencyContactName && emergencyContactPhone) {
        // Use the current user's name as default
        emergencyContactName.value = currentUser.displayName || currentUser.email.split('@')[0];

        utils.showToast('Please update emergency contact phone number', 'info');
        emergencyContactPhone.focus();
    }
}

function shareEmergencyContact() {
    const emergencyContactName = document.getElementById('emergencyContactName');
    const emergencyContactPhone = document.getElementById('emergencyContactPhone');
    const patientName = document.getElementById('patientName');

    if (!emergencyContactName?.value || !emergencyContactPhone?.value) {
        utils.showToast('Please fill in emergency contact details first', 'warning');
        return;
    }

    const contactInfo = `Emergency Contact for ${patientName?.value || 'Patient'}:
Name: ${emergencyContactName.value}
Phone: ${emergencyContactPhone.value}
Time: ${new Date().toLocaleString()}`;

    // Use Web Share API if available, otherwise copy to clipboard
    if (navigator.share) {
        navigator.share({
            title: 'Emergency Contact Information',
            text: contactInfo
        }).then(() => {
            utils.showToast('Contact information shared successfully', 'success');
        }).catch(() => {
            copyToClipboard(contactInfo);
        });
    } else {
        copyToClipboard(contactInfo);
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            utils.showToast('Contact information copied to clipboard', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        utils.showToast('Contact information copied to clipboard', 'success');
    } catch (err) {
        utils.showToast('Unable to copy contact information', 'error');
    }
    document.body.removeChild(textArea);
}

// Initialize the application
function initializeApp() {
    // Initialize Firebase auth state listener
    authFunctions.initAuthStateListener();

    // Initialize event listeners
    initializeEventListeners();

    // Hide loading overlay
    utils.hideLoading();

    console.log('BlitzMed application initialized successfully');
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    utils.showToast('An unexpected error occurred. Please refresh the page.', 'error');
});

// Handle Firebase connection state
database.ref('.info/connected').on('value', (snapshot) => {
    if (snapshot.val() === false) {
        utils.showToast('BlitzMed successfully connected to internet.', 'success');
    }
});