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
        this.apiKey = 'AIzaSyBJJtGIUt90NVLXGydJ8EH63_WaQdfvmEk';
        
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
        console.log('🔄 Attempting to fetch data from Google Sheets...');
        
        // Method 1: Try API key method first (most reliable for private sheets)
        const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Main?key=${this.apiKey}`;
        
        try {
            console.log('� Trying API key method:', apiUrl);
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Google Sheets API response:', data);
                
                if (data.values && data.values.length > 1) {
                    const headers = data.values[0];
                    const rows = data.values.slice(1);
                    
                    console.log('📋 Headers found:', headers);
                    console.log('📊 Data rows:', rows.length);
                    
                    this.slides = rows.map((row, rowIndex) => {
                        const slide = {};
                        headers.forEach((header, index) => {
                            const key = header.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '');
                            slide[key] = row[index] || '';
                        });
                        console.log(`📊 Processed slide ${rowIndex + 1}:`, slide);
                        return slide;
                    }).filter(slide => slide.title && slide.title.trim() !== '');
                    
                    console.log('✅ Final processed slides:', this.slides);
                    
                    // Check for slides with missing images
                    const slidesWithoutImages = this.slides.filter(slide => !slide.imageurl || slide.imageurl.trim() === '');
                    if (slidesWithoutImages.length > 0) {
                        console.warn(`⚠️ ${slidesWithoutImages.length} slides have missing image URLs`);
                        slidesWithoutImages.forEach((slide, index) => {
                            console.warn(`Slide "${slide.title}" has no image URL - will use placeholder`);
                        });
                    }
                    
                    if (this.slides.length === 0) {
                        console.warn('⚠️ No valid slides found (missing title)');
                        throw new Error('No valid slides found in spreadsheet');
                    }
                    return;
                } else {
                    throw new Error('No data found in spreadsheet');
                }
            } else {
                const errorData = await response.json();
                console.error('❌ API Error:', errorData);
                throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ API key method failed:', error);
        }
        
        // Method 2: Try to find the correct sheet ID
        try {
            console.log('🔍 Trying to get sheet metadata...');
            const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}?key=${this.apiKey}`;
            const metaResponse = await fetch(metadataUrl);
            
            if (metaResponse.ok) {
                const metadata = await metaResponse.json();
                console.log('📋 Spreadsheet metadata:', metadata);
                
                // Find the "Main" sheet
                const mainSheet = metadata.sheets?.find(sheet => 
                    sheet.properties?.title?.toLowerCase() === 'main'
                );
                
                if (mainSheet) {
                    const sheetId = mainSheet.properties.sheetId;
                    console.log('✅ Found Main sheet with ID:', sheetId);
                    
                    // Try CSV export with correct sheet ID
                    const csvUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv&gid=${sheetId}`;
                    console.log('📄 Trying CSV with correct sheet ID:', csvUrl);
                    
                    const csvResponse = await fetch(csvUrl);
                    if (csvResponse.ok) {
                        const csvText = await csvResponse.text();
                        console.log('✅ CSV data received:', csvText.substring(0, 200));
                        
                        if (this.parseCSVData(csvText)) {
                            console.log('✅ Successfully parsed CSV data');
                            return;
                        }
                    }
                }
            }
        } catch (error) {
            console.log('❌ Metadata method failed:', error);
        }
        
        console.error('❌ All connection methods failed');
        throw new Error('Unable to connect to Google Sheets');
    }

    parseCSVData(csvText) {
        try {
            const lines = csvText.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                console.log('❌ Not enough data in CSV');
                return false;
            }
            
            const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
            console.log('📋 CSV Headers found:', headers);
            
            const dataRows = lines.slice(1);
            console.log('📊 CSV Data rows:', dataRows.length);
            
            this.slides = dataRows.map((line, rowIndex) => {
                const values = this.parseCSVLine(line);
                const slide = {};
                
                headers.forEach((header, index) => {
                    const key = header.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '');
                    slide[key] = values[index] || '';
                });
                
                console.log(`📊 CSV Slide ${rowIndex + 1}:`, slide);
                return slide;
            }).filter(slide => slide.title && slide.title.trim() !== '');
            
            console.log('✅ Successfully parsed', this.slides.length, 'slides from CSV');
            return this.slides.length > 0;
        } catch (error) {
            console.error('❌ Error parsing CSV:', error);
            return false;
        }
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    parseGoogleSheetsData(data) {
        try {
            const rows = data.table.rows;
            if (rows.length < 2) {
                console.warn('Not enough data rows');
                this.loadSampleData();
                return;
            }
            
            // First row contains headers
            const headers = rows[0].c.map(cell => cell ? cell.v : '');
            console.log('Headers from public access:', headers);
            
            // Subsequent rows contain data
            const dataRows = rows.slice(1);
            
            this.slides = dataRows.map((row, rowIndex) => {
                const slide = {};
                row.c.forEach((cell, index) => {
                    if (headers[index]) {
                        const key = headers[index].toLowerCase().replace(/\s+/g, '_');
                        slide[key] = cell ? cell.v : '';
                    }
                });
                console.log(`Slide ${rowIndex} from public access:`, slide);
                return slide;
            }).filter(slide => slide.image_url && slide.title);
            
            console.log('Processed slides from public access:', this.slides);
            console.log('Successfully fetched', this.slides.length, 'slides from Google Sheets (public)');
            
            if (this.slides.length === 0) {
                console.warn('No valid slides found from public access');
                this.loadSampleData();
            }
        } catch (error) {
            console.error('Error parsing public Google Sheets data:', error);
            this.loadSampleData();
        }
    }

    loadSampleData() {
        // No sample data - force connection to Google Sheets
        console.log('❌ Sample data disabled - must connect to Google Sheets');
        this.slides = [];
        this.showSlideshowError();
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

        // Test image URLs for debugging
        this.testImageUrls();

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
        
        // Process image URL to handle different URL types
        let imageUrl = this.processImageUrl(slide.imageurl || slide.image_url);
        
        // If no image URL, use a default SKSU placeholder
        if (!imageUrl || imageUrl.includes('No+Image')) {
            imageUrl = 'https://via.placeholder.com/800x400/28a745/ffffff?text=SKSU+Announcement';
        }
        
        slideDiv.innerHTML = `
            <div class="image-container" style="position: relative; background: #f0f0f0;">
                <div class="image-loading" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1;">
                    <div style="width: 40px; height: 40px; border: 4px solid #e3f2fd; border-top: 4px solid #28a745; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                </div>
                <img src="${imageUrl}" 
                     alt="${slide.title}" 
                     style="width: 100%; height: 400px; object-fit: cover; border-radius: 20px 20px 0 0; position: relative; z-index: 2;"
                     onload="
                         console.log('✅ Image loaded successfully:', '${imageUrl}');
                         this.previousElementSibling.style.display = 'none';
                         this.style.opacity = '1';
                     "
                     onerror="
                         console.log('❌ Image failed to load:', '${imageUrl}');
                         this.src='https://via.placeholder.com/800x400/28a745/ffffff?text=SKSU+Image+Not+Available';
                         this.previousElementSibling.style.display = 'none';
                         this.style.opacity = '1';
                     "
                     style="opacity: 0; transition: opacity 0.3s ease;">
            </div>
            <div class="slide-content">
                <h3>${slide.title}</h3>
                <p>${slide.description}</p>
                <div class="campus-info">${slide.campusid || slide.campus_id}</div>
            </div>
        `;

        return slideDiv;
    }

    processImageUrl(url) {
        if (!url || url.trim() === '') {
            console.log('⚠️ Empty image URL provided');
            return 'https://via.placeholder.com/800x400/28a745/ffffff?text=No+Image';
        }
        
        url = url.trim();
        console.log('🔍 Processing image URL:', url);
        
        // Handle Yahoo image search URLs
        if (url.includes('images.search.yahoo.com')) {
            try {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                let imageUrl = '';
                
                if (urlParams.has('imgurl')) {
                    imageUrl = decodeURIComponent(urlParams.get('imgurl'));
                } else if (urlParams.has('p')) {
                    const pParam = urlParams.get('p');
                    if (pParam && pParam.startsWith('http')) {
                        imageUrl = pParam;
                    }
                }
                
                if (imageUrl && this.isValidImageUrl(imageUrl)) {
                    console.log('✅ Extracted image URL from Yahoo search:', imageUrl);
                    return imageUrl;
                }
            } catch (error) {
                console.log('❌ Error processing Yahoo search URL:', error);
            }
        }
        
        // Handle Google image search URLs
        if (url.includes('images.google.com') || url.includes('www.google.com/imgres')) {
            try {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                let imageUrl = '';
                
                if (urlParams.has('imgurl')) {
                    imageUrl = decodeURIComponent(urlParams.get('imgurl'));
                } else if (urlParams.has('url')) {
                    imageUrl = decodeURIComponent(urlParams.get('url'));
                }
                
                if (imageUrl && this.isValidImageUrl(imageUrl)) {
                    console.log('✅ Extracted image URL from Google search:', imageUrl);
                    return imageUrl;
                }
            } catch (error) {
                console.log('❌ Error processing Google search URL:', error);
            }
        }
        
        // Handle Bing image search URLs
        if (url.includes('bing.com/images')) {
            try {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                if (urlParams.has('mediaurl')) {
                    const imageUrl = decodeURIComponent(urlParams.get('mediaurl'));
                    if (this.isValidImageUrl(imageUrl)) {
                        console.log('✅ Extracted image URL from Bing search:', imageUrl);
                        return imageUrl;
                    }
                }
            } catch (error) {
                console.log('❌ Error processing Bing search URL:', error);
            }
        }
        
        // Enhanced Google Drive handling - multiple formats
        if (url.includes('drive.google.com')) {
            let fileId = '';
            
            // Method 1: Extract from /file/d/FILE_ID/view format
            let match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
            if (match) {
                fileId = match[1];
            }
            
            // Method 2: Extract from /open?id=FILE_ID format
            if (!fileId) {
                match = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
                if (match) {
                    fileId = match[1];
                }
            }
            
            // Method 3: Extract from /uc?id=FILE_ID format
            if (!fileId) {
                match = url.match(/\/uc\?.*id=([a-zA-Z0-9-_]+)/);
                if (match) {
                    fileId = match[1];
                }
            }
            
            // Method 4: Extract from sharing URL format
            if (!fileId) {
                match = url.match(/\/d\/([a-zA-Z0-9-_]+)\/view/);
                if (match) {
                    fileId = match[1];
                }
            }
            
            if (fileId) {
                const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
                console.log('✅ Converted Google Drive URL:', directUrl);
                return directUrl;
            } else {
                console.log('❌ Could not extract Google Drive file ID from:', url);
            }
        }
        
        // Handle Google Photos links
        if (url.includes('photos.google.com') || url.includes('photos.app.goo.gl')) {
            console.log('⚠️ Google Photos sharing URL detected - may require public access');
            // Try to extract direct photo URL if available
            if (url.includes('googleusercontent.com')) {
                return url.includes('=') ? url : url + '=w800-h400-c';
            }
            return url;
        }
        
        // Enhanced Dropbox handling
        if (url.includes('dropbox.com')) {
            // Convert sharing URL to direct URL
            if (url.includes('/s/') && !url.includes('?dl=1')) {
                const directUrl = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '').replace(/\?.*$/, '');
                console.log('✅ Converted Dropbox sharing URL:', directUrl);
                return directUrl;
            } else if (url.includes('?dl=0')) {
                const directUrl = url.replace('?dl=0', '?dl=1');
                console.log('✅ Converted Dropbox URL to direct download:', directUrl);
                return directUrl;
            }
        }
        
        // Handle OneDrive/SharePoint links
        if (url.includes('onedrive.live.com') || url.includes('1drv.ms') || url.includes('sharepoint.com')) {
            // Convert OneDrive sharing URL to direct thumbnail
            if (url.includes('onedrive.live.com')) {
                try {
                    const directUrl = url.replace('view.aspx', 'download.aspx').replace('redir?', 'download?');
                    console.log('✅ Converted OneDrive URL:', directUrl);
                    return directUrl;
                } catch (error) {
                    console.log('❌ Error converting OneDrive URL:', error);
                }
            }
        }
        
        // Handle iCloud shared links
        if (url.includes('icloud.com')) {
            console.log('⚠️ iCloud sharing URL detected - may require manual download');
            return url;
        }
        
        // Handle Imgur links
        if (url.includes('imgur.com') && !url.includes('i.imgur.com')) {
            // Convert imgur page URL to direct image URL
            const imgurMatch = url.match(/imgur\.com\/([a-zA-Z0-9]+)/);
            if (imgurMatch) {
                const directUrl = `https://i.imgur.com/${imgurMatch[1]}.jpg`;
                console.log('✅ Converted Imgur URL:', directUrl);
                return directUrl;
            }
        }
        
        // Handle Instagram image URLs
        if (url.includes('instagram.com')) {
            console.log('⚠️ Instagram URL detected - may require special handling');
            // Instagram URLs usually need to be accessed differently due to their API restrictions
            return this.generatePlaceholderImage('Instagram image - please use direct image URL');
        }
        
        // Handle Facebook image URLs
        if (url.includes('facebook.com') || url.includes('fbcdn.net')) {
            console.log('⚠️ Facebook URL detected');
            if (url.includes('fbcdn.net')) {
                console.log('✅ Direct Facebook CDN URL detected');
                return url;
            } else {
                return this.generatePlaceholderImage('Facebook image - please use direct image URL');
            }
        }
        
        // Handle WeTransfer links
        if (url.includes('wetransfer.com')) {
            console.log('⚠️ WeTransfer URL detected - temporary download link');
            return this.generatePlaceholderImage('WeTransfer - please use permanent image URL');
        }
        
        // Handle MediaFire links
        if (url.includes('mediafire.com')) {
            console.log('⚠️ MediaFire URL detected - may need direct link');
            return url;
        }
        
        // Handle GitHub raw content
        if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
            // Convert GitHub file URL to raw content URL
            const rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
            console.log('✅ Converted GitHub URL to raw content:', rawUrl);
            return rawUrl;
        }
        
        // Handle Unsplash images
        if (url.includes('unsplash.com')) {
            // Extract Unsplash photo ID and create optimized URL
            const unsplashMatch = url.match(/photos\/([a-zA-Z0-9_-]+)/);
            if (unsplashMatch) {
                const directUrl = `https://images.unsplash.com/photo-${unsplashMatch[1]}?w=800&h=400&fit=crop`;
                console.log('✅ Converted Unsplash URL:', directUrl);
                return directUrl;
            }
        }
        
        // Handle Flickr images
        if (url.includes('flickr.com')) {
            console.log('⚠️ Flickr URL detected - may need API access for high-res images');
            return url;
        }
        
        // Handle Pinterest images
        if (url.includes('pinterest.com')) {
            console.log('⚠️ Pinterest URL detected - extracting image if possible');
            // Pinterest URLs often contain the actual image URL in parameters
            const match = url.match(/url=([^&]+)/);
            if (match) {
                const decodedUrl = decodeURIComponent(match[1]);
                if (this.isValidImageUrl(decodedUrl)) {
                    console.log('✅ Extracted image from Pinterest URL:', decodedUrl);
                    return decodedUrl;
                }
            }
        }
        
        // Check if it's already a direct image URL
        if (this.isValidImageUrl(url)) {
            console.log('✅ Direct image URL detected:', url);
            return url;
        }
        
        // For URLs that might be web pages with images, generate placeholder
        if (url.startsWith('http') && !this.isValidImageUrl(url)) {
            console.log('⚠️ Web page URL detected, generating placeholder');
            return this.generatePlaceholderImage(url);
        }
        
        // For regular URLs, return as is
        console.log('✅ Using URL as-is:', url);
        return url;
    }
    
    isValidImageUrl(url) {
        if (!url) return false;
        
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.ico'];
        const urlLower = url.toLowerCase();
        
        // Check for direct image file extensions
        if (imageExtensions.some(ext => urlLower.includes(ext))) {
            return true;
        }
        
        // Check for image hosting domains and CDNs
        const imageHosts = [
            // Image hosting services
            'imgur.com',
            'i.imgur.com',
            'images.unsplash.com',
            'pixabay.com',
            'pexels.com',
            'flickr.com',
            'staticflickr.com',
            
            // Google services
            'googleusercontent.com',
            'drive.google.com',
            'lh3.googleusercontent.com',
            'lh4.googleusercontent.com',
            'lh5.googleusercontent.com',
            'lh6.googleusercontent.com',
            
            // Social media CDNs
            'fbcdn.net',
            'twimg.com',
            'cdninstagram.com',
            'scontent.xx.fbcdn.net',
            
            // Cloud storage
            'dropbox.com',
            'dl.dropboxusercontent.com',
            'onedrive.live.com',
            '1drv.ms',
            
            // CDNs and hosting
            'cloudinary.com',
            'amazonaws.com',
            'cloudfront.net',
            'fastly.com',
            'jsdelivr.net',
            'github.com',
            'raw.githubusercontent.com',
            
            // Other image services
            'tinypic.com',
            'photobucket.com',
            'imageshack.us',
            'postimg.cc',
            'imgbb.com',
            'ibb.co',
            'via.placeholder.com',
            'placeholder.com',
            'picsum.photos',
            
            // Stock photo sites
            'shutterstock.com',
            'gettyimages.com',
            'istockphoto.com',
            'alamy.com',
            
            // Blog/CMS image URLs
            'wordpress.com',
            'blogger.com',
            'medium.com',
            'squarespace.com',
            'wix.com',
            'weebly.com'
        ];
        
        const hasImageHost = imageHosts.some(host => urlLower.includes(host));
        
        // Additional checks for URLs that look like images
        const hasImageParams = urlLower.includes('image') || urlLower.includes('photo') || urlLower.includes('picture');
        const hasImageFormat = /\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff|ico)(\?|$|#)/i.test(url);
        
        return hasImageHost || hasImageFormat || hasImageParams;
    }
    
    generatePlaceholderImage(originalUrl) {
        // Create a more informative placeholder
        const shortUrl = originalUrl.length > 30 ? originalUrl.substring(0, 30) + '...' : originalUrl;
        const encodedText = encodeURIComponent(`SKSU - Image from: ${shortUrl}`);
        return `https://via.placeholder.com/800x400/28a745/ffffff?text=${encodedText}`;
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
                <div style="text-align: center; padding: 2rem;">
                    <h3 style="color: #dc3545; margin-bottom: 1rem;">⚠️ Unable to Connect to Google Sheets</h3>
                    <p style="margin-bottom: 1rem;">Please ensure:</p>
                    <ul style="text-align: left; display: inline-block;">
                        <li>Your spreadsheet is public (anyone with link can view)</li>
                        <li>The "Main" sheet exists with data</li>
                        <li>Column headers: Image URL | Description | Title | Campus_ID</li>
                    </ul>
                    <p style="margin-top: 1rem;">
                        <a href="https://docs.google.com/spreadsheets/d/1f74bbovZFgzWKTJnha4XEESEu6qWfBVLmMVu0XZvdYw/edit" 
                           target="_blank" style="color: #28a745;">Open Your Spreadsheet</a>
                    </p>
                    <button onclick="kioskDebug.testConnection()" style="background: #28a745; color: white; padding: 0.5rem 1rem; border: none; border-radius: 5px; margin-top: 1rem; cursor: pointer;">
                        Test Connection
                    </button>
                </div>
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

    // Test function to check image URLs
    testImageUrls() {
        console.log('Testing image URLs...');
        this.slides.forEach((slide, index) => {
            const img = new Image();
            img.onload = () => console.log(`✅ Image ${index} loaded successfully:`, slide.image_url);
            img.onerror = () => console.log(`❌ Image ${index} failed to load:`, slide.image_url);
            img.src = this.processImageUrl(slide.image_url);
        });
    }
}

// Initialize the kiosk when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const kiosk = new SKSUKiosk();
    
    // Make kiosk globally accessible for debugging
    window.kioskDebug = {
        kiosk: kiosk,
        testConnection: async () => {
            console.log('\n🔧 TESTING CONNECTION TO GOOGLE SHEETS...');
            console.log('📋 Spreadsheet ID:', kiosk.spreadsheetId);
            console.log('📋 API Key:', kiosk.apiKey ? 'Provided ✅' : 'Missing ❌');
            
            // Test 1: Check spreadsheet URL
            const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${kiosk.spreadsheetId}/edit`;
            console.log('🌐 Spreadsheet URL:', spreadsheetUrl);
            console.log('👆 Please verify this URL is accessible');
            
            // Test 2: Try API key method (most reliable)
            const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${kiosk.spreadsheetId}/values/Main?key=${kiosk.apiKey}`;
            console.log('\n🧪 Testing API Key Method...');
            try {
                const response = await fetch(apiUrl);
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ API Key SUCCESS!');
                    console.log('📋 Headers:', data.values[0]);
                    console.log('📊 Total rows:', data.values.length);
                    console.log('📄 Sample data:', data.values.slice(0, 3));
                } else {
                    const errorData = await response.json();
                    console.log('❌ API Key FAILED:', errorData);
                }
            } catch (error) {
                console.log('❌ API Key ERROR:', error);
            }
            
            // Test 3: Force refresh to see if it works
            console.log('\n🔄 Forcing data refresh...');
            try {
                await kiosk.fetchSlideshowData();
                console.log('✅ Data fetch completed, slides:', kiosk.slides.length);
                kiosk.slides.forEach((slide, index) => {
                    console.log(`Slide ${index + 1}:`, {
                        title: slide.title,
                        imageurl: slide.imageurl,
                        description: slide.description?.substring(0, 50) + '...'
                    });
                });
            } catch (error) {
                console.log('❌ Data fetch failed:', error);
            }
            
            console.log('\n📝 TROUBLESHOOTING CHECKLIST:');
            console.log('1. ✅ Spreadsheet is shared publicly');
            console.log('2. ✅ Sheet name is "Main"');
            console.log('3. ✅ Headers: Image URL | Description | Title | Campus_ID');
            console.log('4. ✅ API key is valid');
            console.log('5. 🔄 Try: kioskDebug.refreshData()');
        },
        refreshData: async () => {
            console.log('\n🔄 FORCING DATA REFRESH...');
            kiosk.slides = [];
            await kiosk.init();
            console.log('✅ Refresh complete');
        },
        showCurrentSlides: () => {
            console.log('\n📊 CURRENT SLIDES DATA:');
            console.log('Total slides:', kiosk.slides.length);
            kiosk.slides.forEach((slide, index) => {
                console.log(`Slide ${index + 1}:`, slide);
            });
        },
        checkSpreadsheetFormat: () => {
            console.log('\n📋 EXPECTED SPREADSHEET FORMAT:');
            console.log('Sheet Name: Main');
            console.log('Headers (Row 1): Image URL | Description | Title | Campus_ID');
            console.log('Example Data Row: https://drive.google.com/... | Event description | Event Title | 001');
            console.log('\n🌐 Your Spreadsheet URL:');
            console.log(`https://docs.google.com/spreadsheets/d/${kiosk.spreadsheetId}/edit`);
        },
        
        testImageUrl: (url) => {
            console.log('\n🧪 TESTING IMAGE URL CONVERSION:');
            console.log('📥 Original URL:', url);
            
            const convertedUrl = kiosk.processImageUrl(url);
            console.log('📤 Converted URL:', convertedUrl);
            
            const isValid = kiosk.isValidImageUrl(convertedUrl);
            console.log('✅ Is Valid Image:', isValid);
            
            // Test the image by creating a temporary image element
            const testImg = new Image();
            testImg.onload = () => {
                console.log('🖼️ Image loads successfully!');
                console.log('📏 Image dimensions:', testImg.naturalWidth + 'x' + testImg.naturalHeight);
            };
            testImg.onerror = () => {
                console.log('❌ Image failed to load');
                console.log('🔍 Try checking if the URL requires authentication or has CORS restrictions');
            };
            testImg.src = convertedUrl;
            
            return {
                original: url,
                converted: convertedUrl,
                isValid: isValid
            };
        },
        
        testAllImages: () => {
            console.log('\n🧪 TESTING ALL CURRENT SLIDE IMAGES:');
            if (kiosk.slides.length === 0) {
                console.log('❌ No slides loaded. Try kioskDebug.refreshData() first.');
                return;
            }
            
            kiosk.slides.forEach((slide, index) => {
                console.log(`\n--- Slide ${index + 1}: ${slide.title} ---`);
                const imageUrl = slide.imageurl || slide.image_url;
                if (imageUrl) {
                    kioskDebug.testImageUrl(imageUrl);
                } else {
                    console.log('❌ No image URL found for this slide');
                }
            });
        },
        
        testUrlTypes: () => {
            console.log('\n🧪 TESTING VARIOUS URL TYPES:');
            
            const testUrls = [
                // Google Drive examples
                {
                    name: 'Google Drive - /file/d/ format',
                    url: 'https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing'
                },
                {
                    name: 'Google Drive - /open?id= format', 
                    url: 'https://drive.google.com/open?id=1ABC123xyz'
                },
                {
                    name: 'Google Drive - uc export format (already correct)',
                    url: 'https://drive.google.com/uc?export=view&id=1_eyhbQb8nYXUOU9FZzU_Kx_Q3f_Z-vZ0'
                },
                
                // Dropbox examples
                {
                    name: 'Dropbox - sharing link',
                    url: 'https://www.dropbox.com/s/abc123/image.jpg?dl=0'
                },
                {
                    name: 'Dropbox - direct link',
                    url: 'https://dropbox.com/s/abc123/photo.png'
                },
                
                // OneDrive examples
                {
                    name: 'OneDrive - view link',
                    url: 'https://onedrive.live.com/view.aspx?resid=ABC123&ithint=file%2cjpg'
                },
                {
                    name: 'OneDrive - short link',
                    url: 'https://1drv.ms/i/s!ABC123'
                },
                
                // Imgur examples
                {
                    name: 'Imgur - page link',
                    url: 'https://imgur.com/ABC123'
                },
                {
                    name: 'Imgur - direct image',
                    url: 'https://i.imgur.com/ABC123.jpg'
                },
                
                // GitHub examples
                {
                    name: 'GitHub - blob link',
                    url: 'https://github.com/user/repo/blob/main/image.png'
                },
                {
                    name: 'GitHub - raw link',
                    url: 'https://raw.githubusercontent.com/user/repo/main/image.png'
                },
                
                // Search engine examples
                {
                    name: 'Yahoo Image Search',
                    url: 'https://images.search.yahoo.com/images/view?back=...&imgurl=https%3A%2F%2Fexample.com%2Fimage.jpg'
                },
                {
                    name: 'Google Image Search',
                    url: 'https://www.google.com/imgres?imgurl=https%3A%2F%2Fexample.com%2Fimage.jpg'
                },
                
                // Direct image examples
                {
                    name: 'Direct Image - JPG',
                    url: 'https://example.com/image.jpg'
                },
                {
                    name: 'Direct Image - CDN',
                    url: 'https://cdn.example.com/photos/12345.png'
                }
            ];
            
            testUrls.forEach(testCase => {
                console.log(`\n🔗 ${testCase.name}:`);
                console.log('   Input:', testCase.url);
                const result = kiosk.processImageUrl(testCase.url);
                console.log('   Output:', result);
                console.log('   Valid:', kiosk.isValidImageUrl(result));
            });
        }
    };
    
    console.log('Debug functions available:');
    console.log('🔧 kioskDebug.testConnection() - Comprehensive connection test');
    console.log('🔄 kioskDebug.refreshData() - Force refresh slideshow data');
    console.log('📊 kioskDebug.showCurrentSlides() - Show current slides data');
    console.log('📋 kioskDebug.checkSpreadsheetFormat() - Show expected format');
    console.log('🖼️ kioskDebug.testImageUrl(url) - Test image URL conversion');
    console.log('🖼️ kioskDebug.testAllImages() - Test all current slide images');
    console.log('🧪 kioskDebug.testUrlTypes() - Test various URL conversion examples');
    
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