# Video Transcriber Web App

A modern web application for transcribing audio and video files using Google's Gemini AI API. Built with Next.js and featuring a clean, Medium.com-inspired design.

## Features

### Core Transcription
- **AI-powered transcription** using Google Gemini 1.5 Pro model
- **20MB file support** for most audio and video formats
- **High accuracy speech-to-text** with automatic punctuation
- **Multi-language support** for global content
- **Real-time progress tracking** during transcription process

### Smart Audio Processing
- **Automatic format conversion** from video to audio
- **Client-side media processing** using FFmpeg.wasm
- **Format optimization** for better transcription accuracy
- **Support for 15+ media formats** including MP4, MP3, WAV, AVI, MKV

### Speech Analytics
- **Filler word analysis** identifying "um", "uh", and verbal pauses
- **Speaking pace measurement** in words per minute
- **Speech clarity scoring** based on articulation patterns
- **Confidence level assessment** using linguistic analysis
- **Engagement score calculation** measuring conversational dynamics
- **Pace consistency tracking** for speaking rhythm evaluation

### User Interface
- **Modern, responsive design** inspired by Medium.com
- **Drag and drop file upload** with visual feedback
- **URL/Google Drive integration** for remote file processing
- **Real-time analytics dashboard** with interactive charts
- **Clean transcript editing** with save functionality
- **Multiple export formats** including TXT and full analysis reports

### Advanced Features
- **Transcript editing capability** with persistent changes
- **Filler word removal toggle** for clean vs. original text
- **Comprehensive analytics export** as downloadable TXT files
- **Interactive progress visualization** during processing
- **Error handling and recovery** with user-friendly messages
- **Cross-platform compatibility** (web-based)

## Tech Stack

### Frontend Framework
- **Next.js 14** - React-based full-stack framework
- **React 18** - Component-based user interface library
- **TypeScript** - Type-safe JavaScript development

### Styling and UI
- **Tailwind CSS** - Utility-first CSS framework
- **CSS Custom Properties** - Medium.com-inspired design system
- **Responsive Design** - Mobile-first approach

### AI and Processing
- **Google Gemini API** - Advanced language model for transcription
- **FFmpeg.wasm** - Client-side media processing
- **WebAssembly** - High-performance audio/video manipulation

### Data Visualization
- **Recharts** - React-based charting library
- **Interactive Analytics** - Real-time data visualization
- **Progress Indicators** - Custom progress tracking components

### File Handling
- **Formidable** - Server-side file upload processing
- **music-metadata** - Audio/video metadata extraction
- **Google Drive API** - Remote file access and processing

### Development Tools
- **ESLint** - Code linting and quality assurance
- **PostCSS** - CSS processing and optimization
- **npm** - Package management and build scripts

### Deployment and Build
- **Vercel/Render** - Hosting platform options
- **Next.js Build System** - Optimized production builds
- **Environment Configuration** - Secure API key management

### Architecture Pattern
- **Server-Side API Routes** - Next.js API endpoints
- **Client-Side Processing** - Browser-based media handling
- **Service Layer Architecture** - Modular business logic
- **React Hooks** - Modern state management
- **Callback-based Communication** - Parent-child component interaction
