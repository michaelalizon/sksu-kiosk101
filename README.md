# SKSU Interactive Kiosk

A dynamic kiosk system for Sultan Kudarat State University that displays announcements, achievements, and events through an interactive slideshow interface.

## Features

- **Dynamic Slideshow**: Automatically displays content from Google Sheets
- **Interactive Interface**: Mouse-friendly navigation with clickable menu items
- **Google Sheets Integration**: Fetches real-time data from spreadsheet
- **Auto-refresh**: Updates content every 10 minutes
- **Responsive Design**: Works on various screen sizes
- **Kiosk Mode**: Auto-returns to home screen after inactivity

## Setup Instructions

### 1. Google Sheets Configuration

The system fetches data from a Google Sheets document with the following structure in the "Main" sheet:

| Image URL | Description | Title | Campus_ID |
|-----------|-------------|-------|-----------|
| https://example.com/image1.jpg | Description of the announcement | Announcement Title | Campus Location |

### 2. Google API Setup (Required for live data)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API
4. Create credentials (API Key)
5. Restrict the API key to Google Sheets API
6. Update the `apiKey` variable in `main.js` with your API key

### 3. Current Configuration

**Spreadsheet ID**: `1f74bbovZFgzWKTJnha4XEESEu6qWfBVLmMVu0XZvdYw`
**Sheet Name**: `Main`

### 4. Sample Data Structure

The system expects the following columns:
- **Image URL**: Direct link to images (supports various formats)
- **Description**: Detailed description of the announcement/event
- **Title**: Main headline/title
- **Campus_ID**: Campus or office location

### 5. Running the Kiosk

1. Open `main.html` in a web browser
2. For kiosk mode, use full-screen (F11)
3. The slideshow will automatically start and cycle through announcements

### 6. Features

- **Automatic Image Loading**: Displays images from URLs with fallback placeholder
- **Navigation Controls**: Previous/Next buttons and dot indicators
- **Auto-advance**: Slides change every 5 seconds
- **Error Handling**: Graceful handling of missing images or data
- **Mouse Support**: Restored cursor for desktop interaction

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6)
- **API Integration**: Google Sheets API v4
- **Responsive**: Works on desktop monitors and TVs
- **Performance**: Optimized for continuous operation

## Troubleshooting

1. **No slideshow data**: Check API key and internet connection
2. **Images not loading**: Verify image URLs are accessible
3. **Google Sheets access**: Ensure spreadsheet is publicly readable or API key has access

## Development

To modify the kiosk:
1. Edit `main.html` for structure changes
2. Update `main.css` for styling modifications
3. Modify `main.js` for functionality updates

## Future Enhancements

- [ ] Admin panel for content management
- [ ] Multiple sheet support
- [ ] Advanced scheduling for content
- [ ] Analytics and usage tracking
- [ ] Touch gesture support
