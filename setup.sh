#!/bin/bash

# VideoTranscriber Web Frontend Setup Script
echo "🚀 Setting up VideoTranscriber Web Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p tmp
mkdir -p public

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "⚙️ Creating environment configuration..."
    cat > .env.local << EOL
# VideoTranscriber Web Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=VideoTranscriber
NEXT_PUBLIC_MAX_FILE_SIZE=104857600
EOL
    echo "✅ Environment file created (.env.local)"
fi

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Create start script
cat > start.sh << 'EOL'
#!/bin/bash
echo "🌟 Starting VideoTranscriber Web Frontend..."
echo "🌐 Open http://localhost:3000 in your browser"
npm run start
EOL

chmod +x start.sh

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Update your Gemini API key in the .env.local file"
echo "2. Start the development server: npm run dev"
echo "3. Or start production server: ./start.sh"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "🚀 To deploy online:"
echo "1. Push to GitHub repository"
echo "2. Connect to Vercel/Netlify for instant deployment"
echo "3. Your app will be live with a public URL!"
echo ""
