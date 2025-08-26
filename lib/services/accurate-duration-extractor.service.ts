import { parseBuffer } from 'music-metadata'

/**
 * Reliable media duration extraction optimized for serverless environments
 * Uses music-metadata with intelligent fallbacks - NO estimation, only real metadata
 */
export class AccurateDurationExtractor {
  
  /**
   * Extract exact duration from media file using metadata parsing
   * @param buffer - Media file buffer  
   * @param fileName - Original filename
   * @returns Exact duration in seconds or throws error
   */
  static async extractDuration(buffer: Buffer, fileName: string): Promise<number> {
    console.log(`🎯 Extracting duration for: ${fileName} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`)
    
    try {
      // Use music-metadata with more permissive options for better compatibility
      const metadata = await parseBuffer(buffer, undefined, { 
        duration: true,
        skipCovers: true,
        skipPostHeaders: false, // Enable for better MOV support
        includeChapters: false
      })
      
      const duration = metadata.format.duration
      const bitrate = metadata.format.bitrate
      const codec = metadata.format.codec
      
      console.log(`📊 Metadata: codec=${codec}, bitrate=${bitrate}, duration=${duration}`)
      
      if (duration && duration > 0) {
        const roundedDuration = Math.round(duration)
        console.log(`✅ EXACT duration extracted: ${roundedDuration} seconds (${duration.toFixed(2)}s precise)`)
        return roundedDuration
      }
      
      // If no duration but we have other metadata, try alternative approaches
      if (metadata.format && (bitrate || codec)) {
        console.log('⚠️ No duration in metadata, but file format detected - this may be a complex container')
        return this.handleComplexContainer(buffer, fileName, metadata)
      }
      
      throw new Error('No duration information found in file metadata')
      
    } catch (error) {
      console.error('❌ Metadata extraction failed:', error instanceof Error ? error.message : 'Unknown error')
      
      // Instead of estimation, throw an error with helpful message
      throw new Error(`Cannot extract duration from ${fileName}. This file format may not be supported for duration extraction. Please try converting to MP4, MP3, or WAV format.`)
    }
  }
  
  /**
   * Handle complex container formats that might need special handling
   */
  private static handleComplexContainer(buffer: Buffer, fileName: string, metadata: any): number {
    console.log('🔧 Attempting complex container analysis...')
    
    // For now, we refuse to estimate and ask for a supported format instead
    const extension = fileName.toLowerCase().split('.').pop()
    throw new Error(`Complex ${extension} container detected. Please convert to a standard format (MP4, MP3, WAV) for accurate duration extraction.`)
  }
}
