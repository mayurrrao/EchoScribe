import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const writeFile = promisify(fs.writeFile)
const unlink = promisify(fs.unlink)
const mkdir = promisify(fs.mkdir)

export interface MediaInfo {
  duration: number
  format: string
  hasAudio: boolean
  hasVideo: boolean
  sampleRate?: number
  channels?: number
}

export class MediaProcessingService {
  private tempDir: string

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp')
    this.ensureTempDir()
  }

  /**
   * Extract audio from video file and convert to optimal format for transcription
   */
  async extractAudio(inputBuffer: Buffer, originalFileName: string): Promise<Buffer> {
    const inputPath = await this.saveBufferToTemp(inputBuffer, `input_${Date.now()}_${originalFileName}`)
    const outputPath = path.join(this.tempDir, `audio_${Date.now()}.wav`)

    try {
      console.log('Extracting audio from:', originalFileName)
      
      await this.runFFmpeg(inputPath, outputPath, {
        audioOnly: true,
        sampleRate: 16000, // Optimal for speech recognition
        channels: 1, // Mono
        format: 'wav',
        bitrate: '64k' // Lower bitrate to reduce file size
      })

      const audioBuffer = fs.readFileSync(outputPath)
      console.log('Audio extraction completed')
      
      return audioBuffer
    } finally {
      // Cleanup temp files
      await this.cleanup([inputPath, outputPath])
    }
  }

  /**
   * Convert audio to optimal format for transcription
   */
  async optimizeAudio(inputBuffer: Buffer, originalFileName: string): Promise<Buffer> {
    const inputPath = await this.saveBufferToTemp(inputBuffer, `input_${Date.now()}_${originalFileName}`)
    const outputPath = path.join(this.tempDir, `optimized_${Date.now()}.wav`)

    try {
      console.log('Optimizing audio:', originalFileName)
      
      await this.runFFmpeg(inputPath, outputPath, {
        audioOnly: true,
        sampleRate: 16000,
        channels: 1,
        format: 'wav',
        normalize: true,
        bitrate: '64k' // Lower bitrate to reduce file size
      })

      const optimizedBuffer = fs.readFileSync(outputPath)
      console.log('Audio optimization completed')
      
      return optimizedBuffer
    } finally {
      await this.cleanup([inputPath, outputPath])
    }
  }

  /**
   * Get media file information
   */
  async getMediaInfo(inputBuffer: Buffer, fileName: string): Promise<MediaInfo> {
    const inputPath = await this.saveBufferToTemp(inputBuffer, `info_${Date.now()}_${fileName}`)

    return new Promise((resolve, reject) => {
      // Verify file exists before calling ffprobe
      if (!fs.existsSync(inputPath)) {
        this.cleanup([inputPath]) // Clean up just in case
        reject(new Error('Temporary file was not created successfully'))
        return
      }

      console.log('Analyzing media file at:', inputPath)
      
      ffmpeg.ffprobe(inputPath, async (err, metadata) => {
        // Always clean up the temp file after analysis
        try {
          await this.cleanup([inputPath])
        } catch (cleanupError) {
          console.warn('Cleanup failed:', cleanupError)
        }

        if (err) {
          console.error('FFprobe error:', err.message)
          reject(new Error(`Failed to analyze media: ${err.message}`))
          return
        }

        try {
          const videoStream = metadata.streams.find(s => s.codec_type === 'video')
          const audioStream = metadata.streams.find(s => s.codec_type === 'audio')

          const mediaInfo: MediaInfo = {
            duration: metadata.format.duration || 0,
            format: metadata.format.format_name || 'unknown',
            hasAudio: !!audioStream,
            hasVideo: !!videoStream,
            sampleRate: audioStream?.sample_rate,
            channels: audioStream?.channels
          }

          console.log('Media info extracted:', mediaInfo)
          resolve(mediaInfo)
        } catch (parseError) {
          reject(new Error(`Failed to parse media metadata: ${parseError}`))
        }
      })
    })
  }

  /**
   * Split large audio files into chunks for processing
   */
  async splitAudio(inputBuffer: Buffer, fileName: string, chunkDurationMinutes: number = 10): Promise<Buffer[]> {
    const mediaInfo = await this.getMediaInfo(inputBuffer, fileName)
    const totalDuration = mediaInfo.duration
    
    if (totalDuration <= chunkDurationMinutes * 60) {
      // File is small enough, return as single chunk
      return [inputBuffer]
    }

    const inputPath = await this.saveBufferToTemp(inputBuffer, `split_input_${Date.now()}_${fileName}`)
    const chunks: Buffer[] = []
    const tempFiles: string[] = []

    try {
      console.log(`Splitting audio into ${chunkDurationMinutes}-minute chunks`)
      
      const chunkDuration = chunkDurationMinutes * 60
      const numChunks = Math.ceil(totalDuration / chunkDuration)

      for (let i = 0; i < numChunks; i++) {
        const startTime = i * chunkDuration
        const outputPath = path.join(this.tempDir, `chunk_${i}_${Date.now()}.wav`)
        tempFiles.push(outputPath)

        await this.runFFmpeg(inputPath, outputPath, {
          audioOnly: true,
          sampleRate: 16000,
          channels: 1,
          format: 'wav',
          startTime,
          duration: chunkDuration
        })

        const chunkBuffer = fs.readFileSync(outputPath)
        chunks.push(chunkBuffer)
      }

      console.log(`Split into ${chunks.length} chunks`)
      return chunks
    } finally {
      await this.cleanup([inputPath, ...tempFiles])
    }
  }

  /**
   * Run FFmpeg with specified options
   */
  private runFFmpeg(inputPath: string, outputPath: string, options: any): Promise<void> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath)

      if (options.audioOnly) {
        command = command.noVideo()
      }

      if (options.sampleRate) {
        command = command.audioFrequency(options.sampleRate)
      }

      if (options.channels) {
        command = command.audioChannels(options.channels)
      }

      if (options.bitrate) {
        command = command.audioBitrate(options.bitrate)
      }

      if (options.format) {
        command = command.format(options.format)
      }

      if (options.startTime !== undefined) {
        command = command.seekInput(options.startTime)
      }

      if (options.duration !== undefined) {
        command = command.duration(options.duration)
      }

      if (options.normalize) {
        command = command.audioFilters('dynaudnorm')
      }

      command
        .output(outputPath)
        .on('end', () => {
          console.log('FFmpeg processing completed')
          resolve()
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err)
          reject(new Error(`FFmpeg processing failed: ${err.message}`))
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`Processing: ${Math.round(progress.percent)}%`)
          }
        })
        .run()
    })
  }

  /**
   * Save buffer to temporary file
   */
  private async saveBufferToTemp(buffer: Buffer, fileName: string): Promise<string> {
    await this.ensureTempDir()
    
    const filePath = path.join(this.tempDir, fileName)
    
    try {
      await writeFile(filePath, buffer)
      console.log('Temporary file created:', filePath, 'Size:', buffer.length)
      
      // Verify the file was created and has content
      if (!fs.existsSync(filePath)) {
        throw new Error('Failed to create temporary file')
      }
      
      const stats = fs.statSync(filePath)
      if (stats.size === 0) {
        throw new Error('Temporary file is empty')
      }
      
      console.log('Temporary file verified, size:', stats.size)
      return filePath
    } catch (error) {
      console.error('Failed to save buffer to temp file:', error)
      throw new Error(`Failed to create temporary file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Ensure temp directory exists
   */
  private async ensureTempDir(): Promise<void> {
    try {
      await mkdir(this.tempDir, { recursive: true })
      console.log('Temp directory ensured:', this.tempDir)
    } catch (error) {
      console.error('Failed to create temp directory:', error)
      throw new Error(`Failed to create temp directory: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Clean up temporary files
   */
  private async cleanup(filePaths: string[]): Promise<void> {
    await Promise.all(
      filePaths.map(async (filePath) => {
        try {
          if (fs.existsSync(filePath)) {
            await unlink(filePath)
          }
        } catch (error) {
          console.warn('Failed to cleanup temp file:', filePath, error)
        }
      })
    )
  }
}
