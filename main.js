// SKSU Interactive Kiosk JavaScript - Google Sheets Integration & Slideshow

class SKSUKiosk {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.startIdleTimer();
        this.initializeSlideshow();
    }

    init() {
        console.log('SKSU Interactive Kiosk initialized');
        this.idleTimeout = null;
        this.idleTime = 300000; // 5 minutes in milliseconds
        this.currentTime = new Date();
        this.updateDateTime();
        
        // Slideshow properties
        this.slides = [];
        this.currentSlide = 0;
        this.slideInterval = null;
        this.slideTimer = 5000; // 5 seconds per slide
        
        // Google Sheets configuration
        this.spreadsheetId = '1f74bbovZFgzWKTJnha4XEESEu6qWfBVLmMVu0XZvdYw';
        this.sheetName = 'Main';
        this.apiKey = 'YOUR_API_KEY'; // You'll need to get this from Google Cloud Console
        
        // Update time every minute
        setInterval(() => {
            this.updateDateTime();
        }, 60000);
    }

    async initializeSlideshow() {
        console.log('Initializing slideshow...');
        try {
            await this.fetchSlideshowData();
            this.setupSlideshow();
            this.startSlideshow();
        } catch (error) {
            console.error('Error initializing slideshow:', error);
            this.showSlideshowError();
        }
    }

    async fetchSlideshowData() {
        // For now, we'll use sample data since we need an API key for Google Sheets
        // To use real Google Sheets data, uncomment the fetch code below and add your API key
        
        /*
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.sheetName}?key=${this.apiKey}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.values && data.values.length > 1) {
                const headers = data.values[0];
                const rows = data.values.slice(1);
                
                this.slides = rows.map(row => {
                    const slide = {};
                    headers.forEach((header, index) => {
                        slide[header.toLowerCase().replace(' ', '_')] = row[index] || '';
                    });
                    return slide;
                }).filter(slide => slide.image_url && slide.title);
            }
        } catch (error) {
            console.error('Error fetching Google Sheets data:', error);
            throw error;
        }
        */
        
        // Sample data for demonstration (replace with actual Google Sheets data)
        this.slides = [
            {
                image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop',
                title: 'Electronics Engineers Licensure Exam Success',
                description: 'Congratulations to ENGR. MON NATHANIEL L. BESANA for achieving TOP 2 (94.00%) in the April 2025 Electronics Engineers Licensure Examination! We are proud of our outstanding graduates.',
                campus_id: 'SKSU Main Campus'
            },
            {
                image_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=400&fit=crop',
                title: 'New Academic Year 2025-2026 Enrollment',
                description: 'Enrollment for Academic Year 2025-2026 is now open! Join Sultan Kudarat State University and be part of our growing community of scholars and innovators.',
                campus_id: 'SKSU Main Campus'
            },
            {
                image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
                title: 'Research Excellence Awards 2025',
                description: 'SKSU faculty and students receive recognition for outstanding research contributions in agriculture, engineering, and social sciences. Innovation continues to drive our mission.',
                campus_id: 'SKSU Research Center'
            },
            {
                image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=400&fit=crop',
                title: 'Community Extension Program Launch',
                description: 'SKSU launches new community extension programs focusing on sustainable agriculture and skills development for local communities in Sultan Kudarat province.',
                campus_id: 'SKSU Extension Office'
            },
            {
                image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
                title: 'New Laboratory Facilities Opened',
                description: 'State-of-the-art computer and engineering laboratories now available for student use. Enhanced learning facilities support our commitment to quality education.',
                campus_id: 'SKSU College of Engineering'
            }
        ];
    }

    setupSlideshow() {
        const container = document.getElementById('slideshowContainer');
        const loading = document.getElementById('slideshowLoading');
        
        if (this.slides.length === 0) {
            this.showSlideshowError();
            return;
        }

        // Hide loading
        loading.style.display = 'none';

        // Create slides HTML
        this.slides.forEach((slide, index) => {
            const slideElement = this.createSlideElement(slide, index);
            container.appendChild(slideElement);
        });

        // Show navigation if multiple slides
        if (this.slides.length > 1) {
            this.setupNavigation();
        }

        // Show first slide
        this.showSlide(0);
    }

    createSlideElement(slide, index) {
        const slideDiv = document.createElement('div');
        slideDiv.className = 'slide';
        slideDiv.id = `slide-${index}`;
        
        slideDiv.innerHTML = `
            <img src="${slide.image_url}" alt="${slide.title}" onerror="this.src='https://via.placeholder.com/800x400/28a745/ffffff?text=SKSU+Image'">
            <div class="slide-content">
                <h3>${slide.title}</h3>
                <p>${slide.description}</p>
                <div class="campus-info">${slide.campus_id}</div>
            </div>
        `;

        return slideDiv;
    }

    setupNavigation() {
        const container = document.getElementById('slideshowContainer');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const navContainer = document.getElementById('slideshowNav');

        // Show controls
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';
        navContainer.style.display = 'flex';

        // Create navigation dots
        this.slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'nav-dot';
            dot.addEventListener('click', () => {
                this.goToSlide(index);
            });
            navContainer.appendChild(dot);
        });

        // Add button event listeners
        prevBtn.addEventListener('click', () => {
            this.previousSlide();
        });

        nextBtn.addEventListener('click', () => {
            this.nextSlide();
        });
    }

    showSlide(index) {
        // Hide all slides
        document.querySelectorAll('.slide').forEach(slide => {
            slide.classList.remove('active');
        });

        // Show current slide
        const currentSlideElement = document.getElementById(`slide-${index}`);
        if (currentSlideElement) {
            currentSlideElement.classList.add('active');
        }

        // Update navigation dots
        document.querySelectorAll('.nav-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });

        this.currentSlide = index;
    }

    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }

    previousSlide() {
        const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prevIndex);
    }

    goToSlide(index) {
        this.showSlide(index);
        this.resetSlideTimer();
    }

    startSlideshow() {
        if (this.slides.length > 1) {
            this.slideInterval = setInterval(() => {
                this.nextSlide();
            }, this.slideTimer);
        }
    }

    resetSlideTimer() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.startSlideshow();
        }
    }

    showSlideshowError() {
        const container = document.getElementById('slideshowContainer');
        container.innerHTML = `
            <div class="slideshow-loading">
                <span style="color: #dc3545;">⚠️ Unable to load announcements. Please check your connection.</span>
            </div>
        `;
    }

    setupEventListeners() {
        // Menu item click handlers
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleMenuClick(e);
                this.resetIdleTimer();
            });
        });

        // Reset idle timer on any interaction
        document.addEventListener('click', () => this.resetIdleTimer());
        document.addEventListener('mousemove', () => this.resetIdleTimer());
        document.addEventListener('keypress', () => this.resetIdleTimer());

        // Prevent context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    handleMenuClick(e) {
        const menuItem = e.currentTarget;
        const section = menuItem.getAttribute('data-section');
        
        // Add click animation
        menuItem.style.transform = 'scale(0.95)';
        setTimeout(() => {
            menuItem.style.transform = '';
        }, 150);

        // Handle navigation based on section
        this.navigateToSection(section);
    }

    navigateToSection(section) {
        console.log(`Navigating to section: ${section}`);
        
        // Show loading state
        this.showLoadingState();
        
        // Simulate navigation
        setTimeout(() => {
            this.hideLoadingState();
            this.displaySectionContent(section);
        }, 1000);
    }

    displaySectionContent(section) {
        const sectionData = this.getSectionData(section);
        
        // Create modal
        const modal = this.createModal(sectionData);
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    getSectionData(section) {
        const data = {
            about: {
                title: 'About SKSU',
                content: `
                    <h3>Sultan Kudarat State University</h3>
                    <p>Sultan Kudarat State University (SKSU) is a state university in the Philippines. It was established in 2001 through the integration of three existing institutions in the province of Sultan Kudarat.</p>
                    <h4>Mission</h4>
                    <p>To provide quality and relevant education, conduct research and extension services for the development of Sultan Kudarat and neighboring provinces.</p>
                    <h4>Vision</h4>
                    <p>A premier state university in SOCCSKSARGEN producing globally competitive graduates and technologies for sustainable development.</p>
                `
            },
            academics: {
                title: 'Academic Programs',
                content: `
                    <h3>Colleges and Programs</h3>
                    <ul>
                        <li><strong>College of Engineering and Technology</strong></li>
                        <li><strong>College of Education</strong></li>
                        <li><strong>College of Agriculture</strong></li>
                        <li><strong>College of Arts and Sciences</strong></li>
                        <li><strong>College of Business and Management</strong></li>
                        <li><strong>College of Computer Studies</strong></li>
                    </ul>
                    <p>For detailed program information, please visit the Registrar's Office or check our official website.</p>
                `
            },
            admissions: {
                title: 'Admissions Information',
                content: `
                    <h3>Admission Requirements</h3>
                    <ul>
                        <li>Completed application form</li>
                        <li>Original and photocopy of high school diploma</li>
                        <li>Certificate of Good Moral Character</li>
                        <li>Medical Certificate</li>
                        <li>2x2 ID pictures</li>
                    </ul>
                    <h4>Important Dates</h4>
                    <p>Enrollment periods are typically held at the beginning of each semester. Please check with the Admissions Office for specific dates.</p>
                `
            },
            services: {
                title: 'Student Services',
                content: `
                    <h3>Available Services</h3>
                    <ul>
                        <li>Library Services</li>
                        <li>Guidance and Counseling</li>
                        <li>Medical and Dental Services</li>
                        <li>Student Affairs</li>
                        <li>Scholarship Programs</li>
                        <li>Food Services</li>
                        <li>Dormitory Facilities</li>
                    </ul>
                `
            },
            research: {
                title: 'Research & Extension',
                content: `
                    <h3>Research Centers</h3>
                    <p>SKSU is committed to advancing knowledge through research and community engagement.</p>
                    <h4>Extension Programs</h4>
                    <ul>
                        <li>Community Outreach Programs</li>
                        <li>Agricultural Extension Services</li>
                        <li>Technology Transfer Programs</li>
                        <li>Skills Training Programs</li>
                    </ul>
                `
            },
            news: {
                title: 'News & Events',
                content: `
                    <h3>Latest Updates</h3>
                    <div class="news-item">
                        <h4>Electronics Engineers Licensure Exam Results</h4>
                        <p>Congratulations to our successful examinees in the April 2025 Electronics Engineers and Electronics Technicians Licensure Examinations!</p>
                    </div>
                    <p>For more updates, visit our official website and social media pages.</p>
                `
            },
            directory: {
                title: 'Directory',
                content: `
                    <h3>Important Contacts</h3>
                    <ul>
                        <li><strong>Main Office:</strong> (064) 200 7336</li>
                        <li><strong>Email:</strong> info@sksu.edu.ph</li>
                        <li><strong>Registrar:</strong> registrar@sksu.edu.ph</li>
                        <li><strong>Admissions:</strong> admissions@sksu.edu.ph</li>
                    </ul>
                    <h4>Office Hours</h4>
                    <p>Monday to Friday: 8:00 AM - 5:00 PM</p>
                `
            },
            map: {
                title: 'Campus Map',
                content: `
                    <h3>Campus Location</h3>
                    <p><strong>Address:</strong> EJC Montilla, 9800, Province of Sultan Kudarat, Philippines</p>
                    <p>Our campus features modern facilities including academic buildings, laboratories, library, gymnasium, and student dormitories.</p>
                    <p>For detailed campus maps, please visit the Information Desk or Security Office.</p>
                `
            }
        };
        
        return data[section] || { title: 'Information', content: '<p>Content not available.</p>' };
    }

    createModal(data) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${data.title}</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    ${data.content}
                </div>
                <div class="modal-footer">
                    <button class="back-btn">Back to Main Menu</button>
                </div>
            </div>
        `;

        // Add modal styles if not already added
        if (!document.querySelector('.modal-styles')) {
            this.addModalStyles();
        }

        // Add event listeners
        const closeBtn = modal.querySelector('.close-btn');
        const backBtn = modal.querySelector('.back-btn');
        
        closeBtn.addEventListener('click', () => this.closeModal(modal));
        backBtn.addEventListener('click', () => this.closeModal(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });

        return modal;
    }

    closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }

    addModalStyles() {
        const style = document.createElement('style');
        style.className = 'modal-styles';
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .modal-overlay.show {
                opacity: 1;
            }
            
            .modal-content {
                background: white;
                border-radius: 20px;
                max-width: 800px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                transform: scale(0.8);
                transition: transform 0.3s ease;
            }
            
            .modal-overlay.show .modal-content {
                transform: scale(1);
            }
            
            .modal-header {
                padding: 2rem;
                border-bottom: 2px solid #28a745;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                border-radius: 20px 20px 0 0;
            }
            
            .modal-header h2 {
                margin: 0;
                font-size: 2rem;
            }
            
            .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 2rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.3s ease;
            }
            
            .close-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .modal-body {
                padding: 2rem;
                font-size: 1.1rem;
                line-height: 1.6;
            }
            
            .modal-body h3 {
                color: #1e7e34;
                margin-bottom: 1rem;
            }
            
            .modal-body h4 {
                color: #28a745;
                margin: 1.5rem 0 0.5rem 0;
            }
            
            .modal-body ul {
                margin: 1rem 0;
                padding-left: 2rem;
            }
            
            .modal-body li {
                margin-bottom: 0.5rem;
            }
            
            .modal-footer {
                padding: 1.5rem 2rem;
                border-top: 1px solid #eee;
                text-align: center;
            }
            
            .back-btn {
                background: #28a745;
                color: white;
                border: none;
                padding: 1rem 2rem;
                border-radius: 25px;
                font-size: 1.1rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .back-btn:hover {
                background: #1e7e34;
                transform: translateY(-2px);
            }
            
            .news-item {
                background: #f8f9fa;
                padding: 1.5rem;
                border-radius: 10px;
                margin: 1rem 0;
                border-left: 4px solid #28a745;
            }
        `;
        document.head.appendChild(style);
    }

    showLoadingState() {
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
        document.body.appendChild(loading);
        
        // Add loading styles
        if (!document.querySelector('.loading-styles')) {
            const style = document.createElement('style');
            style.className = 'loading-styles';
            style.textContent = `
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 255, 255, 0.9);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 999;
                }
                
                .loading-content {
                    text-align: center;
                    color: #28a745;
                }
                
                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 5px solid #e3f2fd;
                    border-top: 5px solid #28a745;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    hideLoadingState() {
        const loading = document.querySelector('.loading-overlay');
        if (loading) {
            document.body.removeChild(loading);
        }
    }

    updateDateTime() {
        this.currentTime = new Date();
        console.log('Current time:', this.currentTime.toLocaleString());
    }

    startIdleTimer() {
        this.resetIdleTimer();
    }

    resetIdleTimer() {
        clearTimeout(this.idleTimeout);
        this.idleTimeout = setTimeout(() => {
            this.handleIdleTimeout();
        }, this.idleTime);
    }

    handleIdleTimeout() {
        console.log('Kiosk idle timeout - returning to home');
        // Close any open modals
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            this.closeModal(modal);
        });
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Restart slideshow if paused
        this.resetSlideTimer();
    }

    // Method to refresh slideshow data (can be called periodically)
    async refreshSlideshow() {
        try {
            await this.fetchSlideshowData();
            const container = document.getElementById('slideshowContainer');
            
            // Clear existing slides
            const existingSlides = container.querySelectorAll('.slide');
            existingSlides.forEach(slide => slide.remove());
            
            // Clear navigation
            const navContainer = document.getElementById('slideshowNav');
            navContainer.innerHTML = '';
            
            // Reset slideshow
            this.currentSlide = 0;
            clearInterval(this.slideInterval);
            
            // Setup new slideshow
            this.setupSlideshow();
            this.startSlideshow();
            
            console.log('Slideshow refreshed successfully');
        } catch (error) {
            console.error('Error refreshing slideshow:', error);
        }
    }
}

// Initialize the kiosk when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const kiosk = new SKSUKiosk();
    
    // Refresh slideshow data every 10 minutes
    setInterval(() => {
        kiosk.refreshSlideshow();
    }, 600000); // 10 minutes
});

// Prevent zoom on double click
let lastClickTime = 0;
document.addEventListener('click', (event) => {
    const now = new Date().getTime();
    if (now - lastClickTime <= 300) {
        event.preventDefault();
    }
    lastClickTime = now;
}, false);