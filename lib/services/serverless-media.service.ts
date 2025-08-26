import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

export interface MediaInfo {
  duration: number
  format: string
  hasAudio: boolean
  hasVideo: boolean
  sampleRate?: number
  channels?: number
}

export class ServerlessMediaProcessingService {
  private ffmpeg: FFmpeg | null = null
  private initialized = false

  constructor() {
    this.ffmpeg = new FFmpeg()
  }

  /**
   * Initialize FFmpeg WebAssembly
   */
  private async initialize(): Promise<void> {
    if (this.initialized || !this.ffmpeg) return

    console.log('Initializing FFmpeg WebAssembly...')
    
    try {
      // Load FFmpeg WebAssembly from reliable CDN
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      
      this.ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg log:', message)
      })

      this.ffmpeg.on('progress', ({ progress, time }) => {
        console.log(`FFmpeg progress: ${Math.round(progress * 100)}% (${time / 1000000}s)`)
      })

      // Use direct URLs instead of toBlobURL for better Vercel compatibility
      await this.ffmpeg.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
        workerURL: `${baseURL}/ffmpeg-core.worker.js`,
      })
      
      this.initialized = true
      console.log('FFmpeg WebAssembly initialized successfully')
    } catch (error) {
      console.error('Failed to initialize FFmpeg:', error)
      throw new Error('Failed to initialize media processing')
    }
  }

  /**
   * Get media file information using FFmpeg probe
   */
  async getMediaInfo(inputBuffer: Buffer, fileName: string): Promise<MediaInfo> {
    await this.initialize()
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized')

    try {
      const inputFileName = `input_${Date.now()}_${fileName}`
      
      // Write input file to FFmpeg virtual file system
      await this.ffmpeg.writeFile(inputFileName, new Uint8Array(inputBuffer))
      
      // Run ffprobe to get media information
      await this.ffmpeg.exec([
        '-i', inputFileName,
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        'info.json'
      ])

      // Read the probe result
      const data = await this.ffmpeg.readFile('info.json')
      const probeResult = JSON.parse(new TextDecoder().decode(data as Uint8Array))

      // Parse the result
      const format = probeResult.format
      const streams = probeResult.streams || []
      
      const videoStream = streams.find((s: any) => s.codec_type === 'video')
      const audioStream = streams.find((s: any) => s.codec_type === 'audio')

      const mediaInfo: MediaInfo = {
        duration: parseFloat(format.duration) || 0,
        format: format.format_name || 'unknown',
        hasAudio: !!audioStream,
        hasVideo: !!videoStream,
        sampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate) : undefined,
        channels: audioStream?.channels ? parseInt(audioStream.channels) : undefined
      }

      // Clean up
      await this.ffmpeg.deleteFile(inputFileName)
      await this.ffmpeg.deleteFile('info.json')

      console.log('Media info extracted:', mediaInfo)
      return mediaInfo
    } catch (error) {
      console.error('Failed to get media info:', error)
      throw new Error('Failed to analyze media file')
    }
  }

  /**
   * Extract audio from video file
   */
  async extractAudio(inputBuffer: Buffer, originalFileName: string): Promise<Buffer> {
    await this.initialize()
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized')

    try {
      const inputFileName = `input_${Date.now()}_${originalFileName}`
      const outputFileName = `audio_${Date.now()}.wav`

      console.log('Extracting audio from:', originalFileName)

      // Write input file
      await this.ffmpeg.writeFile(inputFileName, new Uint8Array(inputBuffer))

      // Extract audio with optimal settings for speech recognition
      await this.ffmpeg.exec([
        '-i', inputFileName,
        '-vn', // No video
        '-acodec', 'pcm_s16le', // Uncompressed audio
        '-ar', '16000', // 16kHz sample rate
        '-ac', '1', // Mono
        '-f', 'wav',
        outputFileName
      ])

      // Read the output
      const audioData = await this.ffmpeg.readFile(outputFileName)
      const audioBuffer = Buffer.from(audioData as Uint8Array)

      // Clean up
      await this.ffmpeg.deleteFile(inputFileName)
      await this.ffmpeg.deleteFile(outputFileName)

      console.log('Audio extraction completed, size:', audioBuffer.length)
      return audioBuffer
    } catch (error) {
      console.error('Audio extraction failed:', error)
      throw new Error('Failed to extract audio from video')
    }
  }

  /**
   * Optimize audio for transcription
   */
  async optimizeAudio(inputBuffer: Buffer, originalFileName: string): Promise<Buffer> {
    await this.initialize()
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized')

    try {
      const inputFileName = `input_${Date.now()}_${originalFileName}`
      const outputFileName = `optimized_${Date.now()}.wav`

      console.log('Optimizing audio:', originalFileName)

      // Write input file
      await this.ffmpeg.writeFile(inputFileName, new Uint8Array(inputBuffer))

      // Optimize audio for speech recognition
      await this.ffmpeg.exec([
        '-i', inputFileName,
        '-acodec', 'pcm_s16le',
        '-ar', '16000', // 16kHz sample rate
        '-ac', '1', // Mono
        '-af', 'dynaudnorm', // Dynamic audio normalization
        '-f', 'wav',
        outputFileName
      ])

      // Read the output
      const audioData = await this.ffmpeg.readFile(outputFileName)
      const audioBuffer = Buffer.from(audioData as Uint8Array)

      // Clean up
      await this.ffmpeg.deleteFile(inputFileName)
      await this.ffmpeg.deleteFile(outputFileName)

      console.log('Audio optimization completed, size:', audioBuffer.length)
      return audioBuffer
    } catch (error) {
      console.error('Audio optimization failed:', error)
      throw new Error('Failed to optimize audio')
    }
  }

  /**
   * Split large audio files into chunks
   */
  async splitAudio(inputBuffer: Buffer, fileName: string, chunkDurationMinutes: number = 10): Promise<Buffer[]> {
    const mediaInfo = await this.getMediaInfo(inputBuffer, fileName)
    const totalDuration = mediaInfo.duration
    
    if (totalDuration <= chunkDurationMinutes * 60) {
      // File is small enough, return as single chunk
      return [inputBuffer]
    }

    await this.initialize()
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized')

    try {
      const inputFileName = `split_input_${Date.now()}_${fileName}`
      const chunks: Buffer[] = []

      console.log(`Splitting audio into ${chunkDurationMinutes}-minute chunks`)

      // Write input file
      await this.ffmpeg.writeFile(inputFileName, new Uint8Array(inputBuffer))

      const chunkDuration = chunkDurationMinutes * 60
      const numChunks = Math.ceil(totalDuration / chunkDuration)

      for (let i = 0; i < numChunks; i++) {
        const startTime = i * chunkDuration
        const outputFileName = `chunk_${i}_${Date.now()}.wav`

        console.log(`Processing chunk ${i + 1}/${numChunks} (start: ${startTime}s)`)

        // Split chunk
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
        chunks.push(Buffer.from(chunkData as Uint8Array))

        // Clean up chunk file
        await this.ffmpeg.deleteFile(outputFileName)
      }

      // Clean up input file
      await this.ffmpeg.deleteFile(inputFileName)

      console.log(`Audio splitting completed: ${chunks.length} chunks`)
      return chunks
    } catch (error) {
      console.error('Audio splitting failed:', error)
      throw new Error('Failed to split audio file')
    }
  }
}
