// SKSU Interactive Kiosk JavaScript - Optimized for Touch Interface

class SKSUKiosk {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.startIdleTimer();
    }

    init() {
        console.log('SKSU Interactive Kiosk initialized');
        this.idleTimeout = null;
        this.idleTime = 300000; // 5 minutes in milliseconds
        this.currentTime = new Date();
        this.updateDateTime();
        
        // Update time every minute
        setInterval(() => {
            this.updateDateTime();
        }, 60000);
    }

    setupEventListeners() {
        // Menu item click handlers
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleMenuClick(e);
                this.resetIdleTimer();
            });
            
            // Touch feedback
            item.addEventListener('touchstart', (e) => {
                item.style.transform = 'scale(0.95)';
            });
            
            item.addEventListener('touchend', (e) => {
                setTimeout(() => {
                    item.style.transform = '';
                }, 150);
            });
        });

        // Reset idle timer on any interaction
        document.addEventListener('click', () => this.resetIdleTimer());
        document.addEventListener('touchstart', () => this.resetIdleTimer());
        document.addEventListener('mousemove', () => this.resetIdleTimer());
        document.addEventListener('keypress', () => this.resetIdleTimer());

        // Prevent context menu on long press (mobile/touch)
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Prevent text selection for cleaner kiosk experience
        document.addEventListener('selectstart', (e) => {
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
        
        // Simulate navigation (replace with actual navigation logic)
        setTimeout(() => {
            this.hideLoadingState();
            this.displaySectionContent(section);
        }, 1000);
    }

    displaySectionContent(section) {
        const sectionData = this.getSectionData(section);
        
        // Create modal or page content
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
        // You can add a clock display if needed
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
        
        // Show idle message briefly
        this.showIdleMessage();
    }

    showIdleMessage() {
        const message = document.createElement('div');
        message.className = 'idle-message';
        message.textContent = 'Welcome! Touch anywhere to begin.';
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(40, 167, 69, 0.9);
            color: white;
            padding: 2rem 3rem;
            border-radius: 20px;
            font-size: 1.5rem;
            z-index: 1001;
            animation: pulse 2s infinite;
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (document.body.contains(message)) {
                document.body.removeChild(message);
            }
        }, 5000);
        
        // Add pulse animation
        if (!document.querySelector('.pulse-animation')) {
            const style = document.createElement('style');
            style.className = 'pulse-animation';
            style.textContent = `
                @keyframes pulse {
                    0% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.05); }
                    100% { transform: translate(-50%, -50%) scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize the kiosk when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SKSUKiosk();
});

// Prevent zoom on double tap (mobile)
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Prevent pinch zoom
document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

document.addEventListener('gesturechange', (e) => {
    e.preventDefault();
});

document.addEventListener('gestureend', (e) => {
    e.preventDefault();
});