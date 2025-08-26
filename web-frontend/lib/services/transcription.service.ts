import { GoogleGenerativeAI } from '@google/generative-ai'
import { TranscriptionConfig, TranscriptionResult } from '../types/transcription'

export class GeminiTranscriptionService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required')
    }
    
    console.log('Initializing Gemini API with key:', apiKey.substring(0, 10) + '...')
    this.genAI = new GoogleGenerativeAI(apiKey)
    
    // Use gemini-1.5-pro for better audio handling
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.1, // Lower temperature for more consistent transcription
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      }
    })
    
    console.log('Gemini model initialized successfully')
  }

  /**
   * Transcribe audio file buffer using Gemini API
   */
  async transcribe(
    audioBuffer: Buffer, 
    fileName: string, 
    config: TranscriptionConfig = {}
  ): Promise<TranscriptionResult> {
    try {
      console.log('Starting Gemini transcription for file:', fileName)
      console.log('Audio buffer size:', audioBuffer.length, 'bytes')
      
      // Check file size limit (Gemini has a 20MB limit)
      const maxSize = 20 * 1024 * 1024 // 20MB
      if (audioBuffer.length > maxSize) {
        throw new Error(`Audio file too large: ${audioBuffer.length} bytes (max: ${maxSize} bytes)`)
      }
      
      // Convert buffer to base64
      const base64Audio = audioBuffer.toString('base64')
      console.log('Base64 audio length:', base64Audio.length)
      
      // Determine MIME type from file name and buffer
      const mimeType = this.detectMimeType(fileName, audioBuffer)
      console.log('Using MIME type:', mimeType)
      
      // Check if the format is supported by Gemini
      if (!this.isGeminiSupportedFormat(mimeType)) {
        throw new Error(`Unsupported file format: ${mimeType}. Supported formats: WAV, MP3, AAC, OGG, FLAC, MP4, MOV, AVI, WebM`)
      }
      
      // Create the prompt
      const prompt = this.buildPrompt(config)
      console.log('Transcription prompt:', prompt)
      
      // Prepare the request - use the same format as working C# version
      const requestBody = {
        contents: [{
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Audio
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 8192
        }
      }

      console.log('Sending request to Gemini API with proper format...')
      
      try {
        const result = await this.model.generateContent(requestBody)
        const response = await result.response
        const transcriptionText = response.text()

        console.log('Gemini transcription completed successfully')
        console.log('Raw transcription length:', transcriptionText.length)

        // Create result object (no filtering here - done at orchestrator level)
        const transcriptionResult: TranscriptionResult = {
          text: transcriptionText, // Keep original text
          confidence: 0.95, // Gemini doesn't provide confidence scores
          wordCount: this.countWords(transcriptionText),
          originalFileName: fileName,
          processedAt: new Date()
        }

        return transcriptionResult
      } catch (apiError: any) {
        console.error('Gemini API specific error:', {
          message: apiError.message,
          status: apiError.status,
          statusText: apiError.statusText
        })
        throw apiError
      }

    } catch (error) {
      console.error('Gemini transcription error:', error)
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Transcribe with retry logic
   */
  async transcribeWithRetry(
    audioBuffer: Buffer,
    fileName: string,
    config: TranscriptionConfig = {}
  ): Promise<TranscriptionResult> {
    const maxRetries = config.maxRetries || 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Transcription attempt ${attempt}/${maxRetries}`)
        return await this.transcribe(audioBuffer, fileName, config)
      } catch (error) {
        lastError = error as Error
        console.warn(`Attempt ${attempt} failed:`, error)
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000
          console.log(`Waiting ${delay}ms before retry...`)
          await this.sleep(delay)
        }
      }
    }

    throw lastError || new Error('All transcription attempts failed')
  }

  /**
   * Build the transcription prompt based on config
   */
  private buildPrompt(config: TranscriptionConfig): string {
    let prompt = 'Transcribe the audio content from this file. Provide an accurate word-for-word transcription.'
    
    if (config.language && config.language !== 'auto') {
      prompt += ` The spoken language is ${config.language}.`
    }
    
    if (config.includeTimestamps) {
      prompt += ' Include timestamps in the format [MM:SS] where possible.'
    }
    
    prompt += ' Rules:'
    prompt += ' - Provide only the transcribed text'
    prompt += ' - Use proper punctuation and capitalization' 
    prompt += ' - Do not include any commentary, analysis, or explanations'
    prompt += ' - If multiple speakers, distinguish them with labels like "Speaker 1:", "Speaker 2:", etc.'
    prompt += ' - If audio is unclear, use [inaudible] for unclear portions'
    
    return prompt
  }

  /**
   * Get MIME type based on file extension
   */
  private getMimeType(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop()
    
    const mimeTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'mkv': 'video/x-matroska',
      'webm': 'video/webm'
    }
    
    return mimeTypes[extension || ''] || 'audio/mpeg'
  }

  /**
   * Detect MIME type from file name and buffer content
   */
  /**
   * Check if the MIME type is supported by Gemini
   */
  private isGeminiSupportedFormat(mimeType: string): boolean {
    const supportedFormats = [
      'audio/wav',
      'audio/mpeg',
      'audio/aac',
      'audio/ogg',
      'audio/flac',
      'audio/mp4',
      'video/mp4',
      'video/mpeg',
      'video/quicktime', // .mov
      'video/x-msvideo', // .avi
      'video/webm'
    ]
    
    return supportedFormats.includes(mimeType)
  }

  /**
   * Detect MIME type from file name and buffer
   */
  private detectMimeType(fileName: string, buffer: Buffer): string {
    // Check file extension first - use Gemini-supported MIME types
    const extension = fileName.toLowerCase().split('.').pop()
    
    switch (extension) {
      case 'wav':
        return 'audio/wav'
      case 'mp3':
        return 'audio/mpeg'  // Correct MIME type for MP3
      case 'mp4':
        return 'video/mp4'   // For video files with audio
      case 'm4a':
        return 'audio/mp4'   // M4A is audio/mp4
      case 'aac':
        return 'audio/aac'
      case 'ogg':
        return 'audio/ogg'
      case 'flac':
        return 'audio/flac'
      case 'webm':
        return 'audio/webm'
      case 'avi':
        return 'video/x-msvideo'  // Standard MIME type for AVI
      case 'mov':
        return 'video/quicktime'
      case 'mkv':
        return 'video/x-matroska'
      case 'wmv':
        return 'video/x-ms-wmv'
      default:
        // Try to detect from buffer content
        return this.detectMimeFromBuffer(buffer)
    }
  }

  /**
   * Detect MIME type from buffer content using magic bytes
   */
  private detectMimeFromBuffer(buffer: Buffer): string {
    if (buffer.length < 12) return 'audio/wav' // Default fallback
    
    const header = buffer.subarray(0, 12)
    
    // WAV file signature
    if (header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WAVE') {
      return 'audio/wav'
    }
    
    // MP3 file signature
    if (header[0] === 0xFF && (header[1] & 0xE0) === 0xE0) {
      return 'audio/mpeg'  // Correct MIME type for MP3
    }
    
    // MP4/M4A file signature
    if (header.subarray(4, 8).toString() === 'ftyp') {
      // Check if it's video or audio based on next 4 bytes
      const subtype = header.subarray(8, 12).toString()
      if (subtype.includes('M4A') || subtype.includes('mp41')) {
        return 'audio/mp4'
      }
      return 'video/mp4'
    }
    
    // OGG file signature
    if (header.subarray(0, 4).toString() === 'OggS') {
      return 'audio/ogg'
    }
    
    // FLAC file signature
    if (header.subarray(0, 4).toString() === 'fLaC') {
      return 'audio/flac'
    }
    
    // Default fallback
    console.warn('Could not detect MIME type from buffer, using audio/wav as fallback')
    return 'audio/wav'
  }

  /**
   * Remove filler words from transcription
   */
  private removeFillerWords(text: string): string {
    const fillerWords = [
      'um', 'uh', 'ah', 'er', 'eh', 'hmm', 'mm', 'mhm',
      'like', 'you know', 'so', 'well', 'okay', 'right',
      'basically', 'actually', 'literally', 'i mean'
    ]

    let cleanText = text
    fillerWords.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi')
      cleanText = cleanText.replace(regex, '')
    })

    // Clean up extra spaces
    cleanText = cleanText.replace(/\s+/g, ' ').trim()
    
    return cleanText
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
