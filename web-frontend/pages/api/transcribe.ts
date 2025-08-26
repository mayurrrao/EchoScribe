import { NextApiRequest, NextApiResponse } from 'next'
import { GeminiTranscriptionService } from '../../lib/services/transcription.service'
import { GoogleDriveService } from '../../lib/services/google-drive.service'
import { SpeechAnalyticsService } from '../../lib/services/speech-analytics.service'
import { AccurateDurationExtractor } from '../../lib/services/accurate-duration-extractor.service'
import formidable from 'formidable'
import { readFileSync } from 'fs'

export const config = {
  api: {
    bodyParser: false,
    responseLimit: '100mb',
  },
}

// Helper to parse form data
async function parseForm(req: NextApiRequest): Promise<{ files: formidable.Files; fields: formidable.Fields }> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 20 * 1024 * 1024,
      keepExtensions: true,
    })

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Form parsing error:', err)
        reject(err)
      } else {
        console.log('Form parsed successfully')
        console.log('Fields:', Object.keys(fields))
        console.log('Files:', Object.keys(files))
        resolve({ fields, files })
      }
    })
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/transcribe`)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Initialize services
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return res.status(500).json({ success: false, error: 'API configuration error' })
    }

    const transcriptionService = new GeminiTranscriptionService(geminiApiKey)
    const googleDriveService = new GoogleDriveService()
    const analyticsService = new SpeechAnalyticsService()

    const contentType = req.headers['content-type'] || ''

    // Handle URL downloads (Google Drive, etc.)
    if (contentType.includes('application/json')) {
      const body = JSON.parse(await getRawBody(req))
      const { url } = body

      if (!url || typeof url !== 'string') {
        return res.status(400).json({ success: false, error: 'URL is required' })
      }

      console.log('Processing URL:', url)

      try {
        // Download file from URL
        console.log('Downloading file from URL...')
        const downloadResult = await GoogleDriveService.downloadFile(url)
        const buffer = Buffer.from(downloadResult.buffer)
        const fileName = downloadResult.filename
        console.log(`Downloaded: ${fileName} (${buffer.length} bytes)`)

        // Check file size before transcription (Gemini limit: ~20MB)
        const maxFileSize = 20 * 1024 * 1024 // 20MB
        if (buffer.length > maxFileSize) {
          const fileSizeMB = (buffer.length / (1024 * 1024)).toFixed(1)
          const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(1)
          
          console.error(`File too large: ${fileSizeMB}MB (max: ${maxSizeMB}MB)`)
          return res.status(413).json({
            success: false,
            error: `File too large for transcription`,
            message: `The downloaded file is ${fileSizeMB}MB, but the maximum supported size is ${maxSizeMB}MB. Please try a smaller file or compress the video before uploading.`,
            details: {
              fileSize: buffer.length,
              maxSize: maxFileSize,
              fileName: fileName
            }
          })
        }

        // Since we can't process media on server-side, we'll accept any file type
        // but recommend users to process video files client-side first

        // Get actual media duration (with fallback)
        
        // Transcribe the audio directly
        const result = await transcriptionService.transcribeWithRetry(buffer, fileName)
        
        // Try to get accurate duration, but don't fail if we can't
        let actualDuration = 60 // Default fallback (1 minute)
        try {
          actualDuration = await AccurateDurationExtractor.extractDuration(buffer, fileName)
          console.log(`✅ Final duration: ${actualDuration} seconds`)
        } catch (durationError) {
          console.warn('⚠️ Duration extraction failed:', durationError instanceof Error ? durationError.message : 'Unknown error')
          console.log('📝 Using word-count estimation as fallback...')
          
          // Use word-count estimation as last resort
          const wordCount = result.text.split(/\s+/).filter((word: string) => word.length > 0).length
          if (wordCount > 0) {
            actualDuration = Math.max(10, Math.round(wordCount * 60 / 150)) // 150 WPM
            console.log(`📊 Word-count estimate: ${actualDuration} seconds (${wordCount} words)`)
          }
        }
        
        // Perform analytics (convert seconds to minutes for analytics service)
        const durationInMinutes = actualDuration / 60
        const analytics = analyticsService.analyzeSpeech(result.text, durationInMinutes)

        console.log('URL processing completed successfully')
        return res.status(200).json({
          success: true,
          transcription: result.text,
          fileName,
          duration: actualDuration,
          analytics
        })

      } catch (downloadError) {
        console.error('URL processing failed:', downloadError)
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to download or process file from URL' 
        })
      }
    }

    // Handle file uploads
    if (contentType.includes('multipart/form-data')) {
      console.log('Processing file upload...')
      
      const { files } = await parseForm(req)
      const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file

      if (!uploadedFile) {
        console.error('No file uploaded')
        return res.status(400).json({ success: false, error: 'No file uploaded' })
      }

      console.log('File details:', {
        originalFilename: uploadedFile.originalFilename,
        mimetype: uploadedFile.mimetype,
        size: uploadedFile.size,
        filepath: uploadedFile.filepath
      })

      try {
        // Read the uploaded file
        const fileBuffer = readFileSync(uploadedFile.filepath)
        console.log(`File read successfully: ${fileBuffer.length} bytes`)

        // Check file size before transcription (Gemini limit: ~20MB)
        const maxFileSize = 20 * 1024 * 1024 // 20MB
        if (fileBuffer.length > maxFileSize) {
          const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(1)
          const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(1)
          
          console.error(`File too large: ${fileSizeMB}MB (max: ${maxSizeMB}MB)`)
          return res.status(413).json({
            success: false,
            error: `File too large for transcription`,
            message: `The uploaded file is ${fileSizeMB}MB, but the maximum supported size is ${maxSizeMB}MB. Please compress your file or try a shorter audio/video clip.`,
            details: {
              fileSize: fileBuffer.length,
              maxSize: maxFileSize,
              fileName: uploadedFile.originalFilename
            }
          })
        }

        const fileName = uploadedFile.originalFilename || 'audio.wav'
        const mimeType = uploadedFile.mimetype || ''
        
        // Validate that it's a media file
        const isValidMediaFile = mimeType.startsWith('audio/') || mimeType.startsWith('video/') || 
                                fileName.match(/\.(mp3|wav|mp4|avi|mov|mkv|m4a|aac|ogg|flac|webm)$/i)
        
        if (!isValidMediaFile && mimeType !== 'text/plain') { // Allow text files for testing
          console.error('Invalid file type:', mimeType, fileName)
          return res.status(400).json({ 
            success: false, 
            error: 'Invalid file type. Please upload an audio or video file.',
            details: `Received: ${mimeType || 'unknown'} - ${fileName}`
          })
        }
        
        console.log('Starting transcription for:', fileName, 'MIME type:', mimeType)
        
        // Transcribe the audio
        const result = await transcriptionService.transcribeWithRetry(fileBuffer, fileName)
        console.log('Transcription completed successfully')

        // Try to get accurate duration, but don't fail if we can't
        let actualDuration = 60 // Default fallback (1 minute)
        try {
          actualDuration = await AccurateDurationExtractor.extractDuration(fileBuffer, fileName)
          console.log(`✅ Final duration: ${actualDuration} seconds`)
        } catch (durationError) {
          console.warn('⚠️ Duration extraction failed:', durationError instanceof Error ? durationError.message : 'Unknown error')
          console.log('📝 Using word-count estimation as fallback...')
          
          // Use word-count estimation as last resort
          const wordCount = result.text.split(/\s+/).filter((word: string) => word.length > 0).length
          if (wordCount > 0) {
            actualDuration = Math.max(10, Math.round(wordCount * 60 / 150)) // 150 WPM
            console.log(`📊 Word-count estimate: ${actualDuration} seconds (${wordCount} words)`)
          }
        }

        // Perform analytics (convert seconds to minutes for analytics service)
        const durationInMinutes = actualDuration / 60
        const analytics = analyticsService.analyzeSpeech(result.text, durationInMinutes)
        console.log('Analytics completed')

        return res.status(200).json({
          success: true,
          transcription: result.text,
          fileName,
          duration: actualDuration,
          analytics
        })

      } catch (transcriptionError) {
        console.error('Transcription failed:', transcriptionError)
        return res.status(500).json({ 
          success: false, 
          error: 'Transcription failed',
          message: transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'
        })
      }
    }

    // Unsupported content type
    console.error('Unsupported content type:', contentType)
    return res.status(400).json({ success: false, error: 'Unsupported content type' })

  } catch (error) {
    console.error('API handler error:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Helper to get raw body for JSON parsing
function getRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      resolve(body)
    })
    req.on('error', reject)
  })
}
