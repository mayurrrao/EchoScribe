# Koyeb Deployment for Video Transcriber

## 🚀 Deploy to Koyeb in 3 Steps

### Step 1: Create GitHub Repository

```bash
cd /Users/mayur/Desktop/vidtranscribe/web-frontend
git add .
git commit -m "Initial Video Transcriber web app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/video-transcriber.git
git push -u origin main
```

### Step 2: Deploy on Koyeb

1. **Sign up:** Go to [koyeb.com](https://www.koyeb.com) and create an account
2. **Create new app:** Click "Create App"
3. **Connect GitHub:** Link your GitHub repository
4. **Configure settings:**
   - **Name:** `video-transcriber`
   - **Region:** Europe (Frankfurt) for best performance
   - **Build command:** `npm install && npm run build`
   - **Run command:** `npm start`
   - **Port:** `3000`

### Step 3: Set Environment Variables

In Koyeb dashboard, add these environment variables:

```
NODE_ENV=production
GEMINI_API_KEY=your-actual-gemini-api-key-here
```

### Your app will be live at:
```
https://video-transcriber-YOUR-USERNAME.koyeb.app
```

## Why Koyeb is Perfect for This App

- ✅ **Larger file uploads** - Up to 100MB (vs Vercel's 4.5MB limit)
- ✅ **Better media processing** - More CPU/RAM for FFmpeg operations
- ✅ **European hosting** - GDPR compliant, global CDN
- ✅ **Generous free tier** - 2 apps, always-on instances
- ✅ **Docker support** - Custom environments if needed

## Troubleshooting

If deployment fails:
1. Check build logs in Koyeb dashboard
2. Ensure `package.json` has correct start script
3. Verify environment variables are set
4. Check that port 3000 is configured

## Custom Domain (Optional)

1. Buy a domain (GoDaddy, Namecheap, etc.)
2. In Koyeb dashboard, go to "Domains"
3. Add your custom domain
4. Update DNS records as shown
5. SSL certificate is automatically provisioned
