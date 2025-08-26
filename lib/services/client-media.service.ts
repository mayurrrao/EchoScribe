import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

export interface MediaInfo {
  duration: number
  hasVideo: boolean
  hasAudio: boolean
  fileType: string
  size: number
}

/**
 * Client-side media processing service using FFmpeg WebAssembly
 * Runs in the browser to process media files before uploading to the server
 */
export class ClientMediaProcessingService {
  private ffmpeg: FFmpeg | null = null
  private isInitialized = false

  /**
   * Initialize FFmpeg WebAssembly in the browser
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && this.ffmpeg) return

    try {
      this.ffmpeg = new FFmpeg()
      
      // Load from jsdelivr CDN (more reliable than unpkg)
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm'
      
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
      })

      this.isInitialized = true
      console.log('FFmpeg initialized successfully')
    } catch (error) {
      console.error('Failed to initialize FFmpeg:', error)
      throw new Error('Failed to initialize media processor')
    }
  }

  /**
   * Get basic media information from a file
   */
  async getMediaInfo(file: File): Promise<MediaInfo> {
    // For now, we'll use basic file info and assume audio presence
    // In a full implementation, we could use FFprobe via FFmpeg
    const isVideo = file.type.startsWith('video/')
    const isAudio = file.type.startsWith('audio/')
    
    return {
      duration: 300, // Default 5 minutes, could be improved with actual duration detection
      hasVideo: isVideo,
      hasAudio: isVideo || isAudio,
      fileType: file.type,
      size: file.size
    }
  }

  /**
   * Extract audio from video file or optimize audio file
   */
  async extractAudio(file: File, onProgress?: (progress: number) => void): Promise<Blob> {
    await this.initialize()
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized')

    try {
      const inputFileName = `input_${Date.now()}_${file.name}`
      const outputFileName = `output_${Date.now()}.wav`

      console.log('Processing media file:', file.name)
      onProgress?.(10)

      // Write input file
      await this.ffmpeg.writeFile(inputFileName, await fetchFile(file))
      onProgress?.(30)

      // Set up progress monitoring
      if (onProgress) {
        this.ffmpeg.on('progress', ({ progress }) => {
          const adjustedProgress = 30 + (progress * 0.6) // Map 0-1 to 30-90
          onProgress(Math.min(90, adjustedProgress))
        })
      }

      // Extract/optimize audio
      if (file.type.startsWith('video/')) {
        console.log('Extracting audio from video...')
        await this.ffmpeg.exec([
          '-i', inputFileName,
          '-vn', // No video
          '-acodec', 'pcm_s16le',
          '-ar', '16000', // 16kHz for speech recognition
          '-ac', '1', // Mono
          '-f', 'wav',
          outputFileName
        ])
      } else {
        console.log('Optimizing audio...')
        // Simplified audio processing - no aggressive normalization
        await this.ffmpeg.exec([
          '-i', inputFileName,
          '-acodec', 'pcm_s16le',
          '-ar', '16000',
          '-ac', '1',
          '-f', 'wav',
          outputFileName
        ])
      }

      onProgress?.(90)

      // Read the output
      const audioData = await this.ffmpeg.readFile(outputFileName)
      const audioBlob = new Blob([new Uint8Array(audioData as Uint8Array)], { type: 'audio/wav' })

      // Clean up
      await this.ffmpeg.deleteFile(inputFileName)
      await this.ffmpeg.deleteFile(outputFileName)

      onProgress?.(100)
      console.log('Media processing completed, output size:', audioBlob.size)
      
      return audioBlob
    } catch (error) {
      console.error('Media processing failed:', error)
      throw new Error('Failed to process media file')
    }
  }

  /**
   * Split large audio files into chunks (client-side)
   */
  async splitAudio(file: File, chunkDurationMinutes: number = 10, onProgress?: (progress: number) => void): Promise<Blob[]> {
    await this.initialize()
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized')

    try {
      const inputFileName = `split_input_${Date.now()}_${file.name}`
      const chunks: Blob[] = []

      console.log(`Splitting audio into ${chunkDurationMinutes}-minute chunks`)
      onProgress?.(5)

      // Write input file
      await this.ffmpeg.writeFile(inputFileName, await fetchFile(file))
      onProgress?.(15)

      // For demo purposes, we'll assume a fixed duration
      // In a full implementation, we'd detect the actual duration first
      const estimatedDuration = Math.max(600, file.size / 1000000 * 10) // Rough estimate
      const chunkDuration = chunkDurationMinutes * 60
      const numChunks = Math.ceil(estimatedDuration / chunkDuration)

      for (let i = 0; i < numChunks; i++) {
        const startTime = i * chunkDuration
        const outputFileName = `chunk_${i}_${Date.now()}.wav`
        
        const chunkProgress = 15 + (70 * (i / numChunks))
        onProgress?.(chunkProgress)

        console.log(`Processing chunk ${i + 1}/${numChunks} (start: ${startTime}s)`)

        // Extract chunk
        await this.ffmpeg.exec([
          '-i', inputFileName,
          '-ss', startTime.toString(),
          '-t', chunkDuration.toString(),
          '-acodec', 'pcm_s16le',
          '-ar', '16000',
          '-ac', '1',
          '-f', 'wav',
          outputFileName
        ])

        // Read chunk
        const chunkData = await this.ffmpeg.readFile(outputFileName)
        chunks.push(new Blob([new Uint8Array(chunkData as Uint8Array)], { type: 'audio/wav' }))

        // Clean up chunk file
        await this.ffmpeg.deleteFile(outputFileName)
      }

      // Clean up input file
      await this.ffmpeg.deleteFile(inputFileName)

      onProgress?.(100)
      console.log(`Audio splitting completed: ${chunks.length} chunks`)
      return chunks
    } catch (error) {
      console.error('Audio splitting failed:', error)
      throw new Error('Failed to split audio file')
    }
  }

  /**
   * Check if file needs processing
   */
  needsProcessing(file: File): boolean {
    // Always process video files
    if (file.type.startsWith('video/')) {
      return true
    }
    
    // Process audio files that are large OR not in optimal format
    const isOptimalFormat = file.type === 'audio/wav' || file.type === 'audio/x-wav'
    return file.size > 10 * 1024 * 1024 || !isOptimalFormat // 10MB threshold
  }

  /**
   * Get recommended processing approach
   */
  getProcessingStrategy(file: File): 'extract' | 'optimize' | 'split' | 'none' {
    if (file.type.startsWith('video/')) {
      return 'extract'
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB
      return 'split'
    }
    
    if (file.size > 20 * 1024 * 1024) { // 20MB
      return 'optimize'
    }
    
    return 'none'
  }
}
