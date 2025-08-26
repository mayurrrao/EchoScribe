# Video Transcriber Web Frontend

A modern, Medium.com-inspired web interface for audio and video transcription using Google's Gemini AI.

## 🎨 Design Features

- **Medium.com-inspired design** with clean, minimalist aesthetics
- **Responsive layout** that works on all devices
- **Modern animations** and smooth interactions
- **Intuitive drag-and-drop** file upload
- **Real-time progress tracking** during transcription
- **Professional typography** using Inter font family
- **Accessible color scheme** with proper contrast ratios

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Deploy automatically with zero configuration
4. Custom domain support available

### Option 2: Netlify
1. Build the project: `npm run build`
2. Upload the `out` folder to Netlify
3. Configure custom domain if needed

### Option 3: Traditional Web Server
1. Build the project: `npm run build`
2. Upload the `out` folder to your web server
3. Configure your web server to serve the static files

## 🛠 Setup Instructions

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Local Development

1. **Install dependencies:**
   ```bash
   cd web-frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Production Build

1. **Build for production:**
   ```bash
   npm run build
   npm run start
   ```

2. **Export static files (for static hosting):**
   ```bash
   npm run build
   npm run export
   ```

## 🎯 Key Features

### 🎨 Medium.com Color Scheme
- **Primary Green**: `#1a8917` (Medium's signature green)
- **Text Colors**: `#292929` (primary), `#757575` (secondary)
- **Background**: Clean whites and subtle grays
- **Borders**: `#e6e6e6` for subtle separation

### 📱 Responsive Design
- Mobile-first approach
- Fluid layouts that adapt to any screen size
- Touch-friendly interactive elements
- Optimized for both desktop and mobile usage

### 🌟 User Experience
- **Drag & Drop Upload**: Intuitive file selection
- **Real-time Progress**: Visual feedback during processing
- **Instant Results**: Clean, readable transcription display
- **Export Options**: Download as TXT, SRT, VTT, or JSON
- **Copy to Clipboard**: One-click copying functionality

### ⚡ Performance
- **Static Site Generation**: Ultra-fast loading times
- **Code Splitting**: Optimal bundle sizes
- **Image Optimization**: Automatic image processing
- **Caching**: Intelligent caching strategies

## 🔧 Configuration

### API Integration
The frontend uses Next.js API routes for transcription. The main endpoint is:
- `pages/api/transcribe.ts` - Handles file uploads and Google Drive URLs

### Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
GEMINI_API_KEY=your_gemini_api_key_here
```

### Customization
- **Colors**: Update `tailwind.config.js` for color scheme changes
- **Fonts**: Modify `styles/globals.css` for typography changes
- **Components**: Edit files in the `components/` directory
- **Pages**: Modify files in the `pages/` directory

## 📦 Project Structure

```
web-frontend/
├── components/          # Reusable React components
│   ├── Header.tsx      # Navigation header
│   ├── Footer.tsx      # Site footer
│   ├── FileUpload.tsx  # Drag & drop upload
│   ├── TranscriptionResults.tsx  # Results display
│   └── FeatureSection.tsx  # Features showcase
├── pages/              # Next.js pages
│   ├── _app.tsx       # App configuration
│   ├── _document.tsx  # HTML document structure
│   ├── index.tsx      # Home page
│   └── api/           # API endpoints
│       └── transcribe.ts  # Transcription API
├── styles/            # CSS and styling
│   └── globals.css    # Global styles and Tailwind
├── public/            # Static assets
└── next.config.js     # Next.js configuration
```

## 🌐 Live Demo

Once deployed, your users can:
1. Visit your website URL
2. Drag and drop audio/video files
3. Watch real-time transcription progress
4. Download results in multiple formats
5. Copy text to clipboard instantly

## 🔒 Security Features

- **File Size Limits**: Maximum 100MB upload size
- **File Type Validation**: Only media files accepted
- **Temporary Storage**: Files deleted after processing
- **HTTPS Ready**: SSL/TLS encryption support
- **API Rate Limiting**: Prevents abuse (configure as needed)

## 📈 Analytics & Monitoring

Consider adding:
- Google Analytics for usage tracking
- Error monitoring (Sentry, LogRocket)
- Performance monitoring
- User feedback collection

## 🎯 SEO Optimized

- **Meta Tags**: Proper title and description tags
- **Open Graph**: Social media sharing optimization
- **Structured Data**: Schema markup for search engines
- **Sitemap**: Automatic sitemap generation
- **Fast Loading**: Optimized for Core Web Vitals

Your VideoTranscriber web app is now ready for deployment with a professional, Medium.com-inspired interface! 🚀
