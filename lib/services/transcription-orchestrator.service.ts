import { GeminiTranscriptionService } from './transcription.service'
import { GoogleDriveService } from './google-drive.service'
import { ServerlessMediaProcessingService } from './serverless-media.service'
import { SpeechAnalyticsService } from './speech-analytics.service'
import { TranscriptionConfig, TranscriptionApiResponse } from '../types/transcription'

export class TranscriptionOrchestrator {
  private transcriptionService: GeminiTranscriptionService
  private mediaService: ServerlessMediaProcessingService
  private analyticsService: SpeechAnalyticsService

  constructor(geminiApiKey: string) {
    this.transcriptionService = new GeminiTranscriptionService(geminiApiKey)
    this.mediaService = new ServerlessMediaProcessingService()
    this.analyticsService = new SpeechAnalyticsService()
  }

  /**
   * Process uploaded file: extract audio, transcribe, and analyze
   */
  async processFile(
    fileBuffer: Buffer,
    fileName: string,
    config: TranscriptionConfig = {}
  ): Promise<TranscriptionApiResponse> {
    try {
      console.log('Starting file processing pipeline for:', fileName)
      
      // Step 1: Analyze the media file
      const mediaInfo = await this.mediaService.getMediaInfo(fileBuffer, fileName)
      console.log('Media info:', mediaInfo)

      if (!mediaInfo.hasAudio) {
        throw new Error('File does not contain audio that can be transcribed')
      }

      // Step 2: Extract/optimize audio
      let audioBuffer: Buffer
      if (mediaInfo.hasVideo) {
        console.log('Extracting audio from video file...')
        audioBuffer = await this.mediaService.extractAudio(fileBuffer, fileName)
      } else {
        console.log('Optimizing audio file...')
        audioBuffer = await this.mediaService.optimizeAudio(fileBuffer, fileName)
      }

      // Check if processed audio is within Gemini limits (20MB)
      const maxSize = 20 * 1024 * 1024
      if (audioBuffer.length > maxSize) {
        console.log(`Audio file too large (${audioBuffer.length} bytes), splitting required`)
        // Force chunk processing for large files
        const maxDurationMinutes = 5 // Smaller chunks for large files
        const chunks = await this.mediaService.splitAudio(audioBuffer, fileName, maxDurationMinutes)
        
        let transcriptionText = ''
        for (let i = 0; i < chunks.length; i++) {
          console.log(`Processing chunk ${i + 1}/${chunks.length} (size: ${chunks[i].length} bytes)...`)
          
          if (chunks[i].length > maxSize) {
            console.warn(`Chunk ${i + 1} still too large, skipping`)
            transcriptionText += `[Chunk ${i + 1} too large to process] `
            continue
          }
          
          const chunkFileName = `${fileName}_chunk_${i + 1}`
          const result = await this.transcriptionService.transcribeWithRetry(
            chunks[i],
            chunkFileName,
            config
          )
          transcriptionText += (i > 0 ? ' ' : '') + result.text
        }
        
        // Return early with chunked results
        const response: TranscriptionApiResponse = {
          success: true,
          transcription: transcriptionText,
          fileName,
          duration: mediaInfo.duration / 60,
          analytics: this.analyticsService.analyzeSpeech(transcriptionText, mediaInfo.duration / 60)
        }
        
        console.log('Large file processing completed successfully')
        return response
      }

      // Step 3: Handle large files by splitting if necessary
      const maxDurationMinutes = 10 // Split files longer than 10 minutes
      let transcriptionText = ''

      if (mediaInfo.duration > maxDurationMinutes * 60) {
        console.log('File is large, splitting into chunks...')
        transcriptionText = await this.processLargeFile(
          audioBuffer,
          fileName,
          config,
          maxDurationMinutes
        )
      } else {
        console.log('Processing single file...')
        const result = await this.transcriptionService.transcribeWithRetry(
          audioBuffer,
          fileName,
          config
        )
        transcriptionText = result.text
      }

      // Step 4: Perform speech analytics on RAW transcription (with filler words)
      console.log('Performing speech analytics on raw transcription...')
      const durationMinutes = mediaInfo.duration / 60
      const analytics = this.analyticsService.analyzeSpeech(transcriptionText, durationMinutes)

      // Step 5: Apply text filtering AFTER analytics if requested
      let displayText = transcriptionText
      if (config.removeFillerWords) {
        console.log('Applying filler word removal for display...')
        displayText = this.removeFillerWords(transcriptionText)
        console.log('Display text length after filtering:', displayText.length)
      }

      // Step 6: Return complete result with both raw and filtered transcriptions
      const response: TranscriptionApiResponse = {
        success: true,
        transcription: displayText, // Filtered for display
        rawTranscription: transcriptionText, // Raw for reference/further analysis
        fileName,
        duration: durationMinutes,
        analytics,
        fillerWordsRemoved: config.removeFillerWords || false
      }

      console.log('File processing completed successfully')
      return response

    } catch (error) {
      console.error('File processing failed:', error)
      return {
        success: false,
        transcription: '',
        fileName,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Process large files by splitting them into chunks
   */
  private async processLargeFile(
    audioBuffer: Buffer,
    fileName: string,
    config: TranscriptionConfig,
    chunkDurationMinutes: number
  ): Promise<string> {
    console.log('Processing large file in chunks...')
    
    // Split the audio file
    const chunks = await this.mediaService.splitAudio(
      audioBuffer,
      fileName,
      chunkDurationMinutes
    )

    console.log(`Processing ${chunks.length} chunks...`)

    // Process each chunk
    const chunkResults: string[] = []
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}...`)
      
      try {
        const chunkFileName = `${fileName}_chunk_${i + 1}`
        const result = await this.transcriptionService.transcribeWithRetry(
          chunks[i],
          chunkFileName,
          config
        )
        chunkResults.push(result.text)
      } catch (error) {
        console.error(`Failed to process chunk ${i + 1}:`, error)
        chunkResults.push(`[Chunk ${i + 1} transcription failed]`)
      }
    }

    // Combine all chunk results
    const combinedTranscription = chunkResults.join(' ')
    console.log('Large file processing completed')
    
    return combinedTranscription
  }

  /**
   * Process file with progress callback
   */
  async processFileWithProgress(
    fileBuffer: Buffer,
    fileName: string,
    config: TranscriptionConfig = {},
    onProgress?: (stage: string, progress: number, message?: string) => void
  ): Promise<TranscriptionApiResponse> {
    const updateProgress = (stage: string, progress: number, message?: string) => {
      if (onProgress) {
        onProgress(stage, progress, message)
      }
    }

    try {
      updateProgress('processing', 10, 'Analyzing media file...')
      
      const mediaInfo = await this.mediaService.getMediaInfo(fileBuffer, fileName)
      if (!mediaInfo.hasAudio) {
        throw new Error('File does not contain audio that can be transcribed')
      }

      updateProgress('processing', 25, 'Optimizing audio...')
      
      let audioBuffer: Buffer
      if (mediaInfo.hasVideo) {
        audioBuffer = await this.mediaService.extractAudio(fileBuffer, fileName)
      } else {
        audioBuffer = await this.mediaService.optimizeAudio(fileBuffer, fileName)
      }

      updateProgress('transcribing', 40, 'Starting transcription...')
      
      let transcriptionText = ''
      const maxDurationMinutes = 10

      if (mediaInfo.duration > maxDurationMinutes * 60) {
        const chunks = await this.mediaService.splitAudio(
          audioBuffer,
          fileName,
          maxDurationMinutes
        )

        for (let i = 0; i < chunks.length; i++) {
          const chunkProgress = 40 + (40 * (i / chunks.length))
          updateProgress('transcribing', chunkProgress, `Processing chunk ${i + 1}/${chunks.length}...`)
          
          const chunkFileName = `${fileName}_chunk_${i + 1}`
          const result = await this.transcriptionService.transcribeWithRetry(
            chunks[i],
            chunkFileName,
            config
          )
          transcriptionText += (i > 0 ? ' ' : '') + result.text
        }
      } else {
        const result = await this.transcriptionService.transcribeWithRetry(
          audioBuffer,
          fileName,
          config
        )
        transcriptionText = result.text
      }

      updateProgress('analyzing', 85, 'Analyzing speech patterns...')
      
      const durationMinutes = mediaInfo.duration / 60
      // Perform analytics on raw transcription (with filler words)
      const analytics = this.analyticsService.analyzeSpeech(transcriptionText, durationMinutes)

      // Apply text filtering after analytics if requested
      let displayText = transcriptionText
      if (config.removeFillerWords) {
        displayText = this.removeFillerWords(transcriptionText)
      }

      updateProgress('completed', 100, 'Processing complete!')

      return {
        success: true,
        transcription: displayText,
        rawTranscription: transcriptionText,
        fileName,
        duration: durationMinutes,
        analytics,
        fillerWordsRemoved: config.removeFillerWords || false
      }

    } catch (error) {
      console.error('File processing failed:', error)
      return {
        success: false,
        transcription: '',
        fileName,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Remove filler words from transcription text with advanced context awareness
   */
  private removeFillerWords(text: string): string {
    let cleanText = text

    // 1. Remove pure filler sounds (always safe to remove)
    const pureFillers = [
      'um', 'uh', 'ah', 'er', 'eh', 'hmm', 'mm', 'mhm', 'uhm'
    ]

    pureFillers.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi')
      cleanText = cleanText.replace(regex, '')
    })

    // 2. Remove contextual filler patterns
    const fillerPatterns = [
      // "like" as filler (not comparison) - more conservative
      /\blike\s+(um|uh|ah|er|and then|when i|so i)\b/gi,
      
      // "so" as filler (not conclusion) - very conservative
      /\b(um|uh|ah|er|like|well)\s+so\b/gi, // "um so", "like so"
      /\bso\s+(um|uh|ah|er)\b/gi, // "so um", "so uh"
      
      // Always safe to remove phrases
      /\byou know\b/gi,
      /\bi mean\b/gi,
      /\blet me think\b/gi,
      /\bhow do i say\b/gi,
      /\bwhat do you call it\b/gi,
      
      // Conservative pattern for "sort of" and "kind of"
      /\bsort of\s+(like|um|uh)\b/gi, // Only when followed by clear fillers
      /\bkind of\s+(like|um|uh)\b/gi  // Only when followed by clear fillers
    ]

    fillerPatterns.forEach(pattern => {
      cleanText = cleanText.replace(pattern, (match, ...groups) => {
        // Keep any meaningful parts, remove only the filler portion
        if (groups.length > 0) {
          return groups[groups.length - 1] || '' // Keep the last captured group if meaningful
        }
        return '' // Remove the whole match if it's all filler
      })
    })

    // 3. Remove overused discourse markers more selectively
    // Only remove if they appear very frequently (>4 times) and are clearly redundant
    const discourseMarkers = ['well', 'okay', 'right', 'actually', 'basically']
    discourseMarkers.forEach(marker => {
      const globalRegex = new RegExp(`\\b${marker}\\b`, 'gi')
      const matches = cleanText.match(globalRegex) || []
      
      if (matches.length > 4) {
        // Remove excess instances, keep some for natural flow
        let removeCount = matches.length - 2
        cleanText = cleanText.replace(globalRegex, (match) => {
          if (removeCount > 0) {
            removeCount--
            return '' // Remove this instance
          }
          return match // Keep this instance
        })
      }
    })

    // 4. Clean up spacing and punctuation
    cleanText = cleanText
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/\s+([,.!?;:])/g, '$1') // Remove space before punctuation
      .replace(/([,.!?;:])\s*([,.!?;:])/g, '$1$2') // Remove duplicate punctuation
      .replace(/^\s*[,.!?;:]\s*/g, '') // Remove leading punctuation
      .trim()
    
    return cleanText
  }
}
