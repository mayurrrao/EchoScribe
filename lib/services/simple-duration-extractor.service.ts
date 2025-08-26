/**
 * Simple media duration extraction using buffer analysis
 * Lightweight alternative to FFmpeg for serverless environments
 */

export interface MediaDurationInfo {
  duration: number // in seconds
  isEstimated: boolean
}

export class SimpleDurationExtractor {
  /**
   * Extract duration from common media formats using header analysis
   */
  static extractDuration(buffer: Buffer, fileName: string): MediaDurationInfo {
    const extension = fileName.toLowerCase().split('.').pop() || ''
    
    try {
      switch (extension) {
        case 'wav':
          return this.extractWavDuration(buffer)
        case 'mp3':
          return this.extractMp3Duration(buffer)
        case 'mp4':
        case 'm4a':
          return this.extractMp4Duration(buffer)
        default:
          // Fallback to file size estimation (rough)
          const estimatedDuration = Math.max(1, Math.round(buffer.length / 32000)) // Assume 32kbps bitrate
          return { duration: estimatedDuration, isEstimated: true }
      }
    } catch (error) {
      console.error('Duration extraction failed:', error)
      // Ultra-conservative fallback
      return { duration: 60, isEstimated: true } // Default to 1 minute
    }
  }

  /**
   * Extract duration from WAV files using header information
   */
  private static extractWavDuration(buffer: Buffer): MediaDurationInfo {
    try {
      // WAV header structure
      if (buffer.length < 44) throw new Error('Invalid WAV file')
      
      // Check for RIFF header
      const riffHeader = buffer.toString('ascii', 0, 4)
      if (riffHeader !== 'RIFF') throw new Error('Not a RIFF file')
      
      // Check for WAVE format
      const waveHeader = buffer.toString('ascii', 8, 12)
      if (waveHeader !== 'WAVE') throw new Error('Not a WAVE file')
      
      // Find fmt chunk
      let offset = 12
      while (offset < buffer.length - 8) {
        const chunkId = buffer.toString('ascii', offset, offset + 4)
        const chunkSize = buffer.readUInt32LE(offset + 4)
        
        if (chunkId === 'fmt ') {
          // Parse format chunk
          const sampleRate = buffer.readUInt32LE(offset + 12)
          const byteRate = buffer.readUInt32LE(offset + 16)
          
          if (sampleRate > 0 && byteRate > 0) {
            // Find data chunk to get file size
            let dataOffset = offset + 8 + chunkSize
            while (dataOffset < buffer.length - 8) {
              const dataChunkId = buffer.toString('ascii', dataOffset, dataOffset + 4)
              const dataSize = buffer.readUInt32LE(dataOffset + 4)
              
              if (dataChunkId === 'data') {
                const duration = dataSize / byteRate
                return { duration: Math.round(duration), isEstimated: false }
              }
              
              dataOffset += 8 + dataSize
            }
          }
        }
        
        offset += 8 + chunkSize
      }
      
      throw new Error('Could not parse WAV duration')
    } catch (error) {
      // Fallback estimation for WAV files
      const estimatedDuration = Math.max(1, Math.round(buffer.length / 176400)) // 44.1kHz 16-bit stereo
      return { duration: estimatedDuration, isEstimated: true }
    }
  }

  /**
   * Extract duration from MP3 files using frame analysis
   */
  private static extractMp3Duration(buffer: Buffer): MediaDurationInfo {
    try {
      // Simple MP3 duration estimation
      // This is a simplified approach - full MP3 parsing is complex
      
      // Look for TLEN frame in ID3v2 tag
      if (buffer.length > 10) {
        const id3Header = buffer.toString('ascii', 0, 3)
        if (id3Header === 'ID3') {
          // Try to find TLEN frame (duration in milliseconds)
          const id3Size = ((buffer[6] & 0x7F) << 21) | 
                         ((buffer[7] & 0x7F) << 14) | 
                         ((buffer[8] & 0x7F) << 7) | 
                         (buffer[9] & 0x7F)
          
          // Simple search for TLEN frame
          for (let i = 10; i < Math.min(id3Size + 10, buffer.length - 10); i++) {
            if (buffer.toString('ascii', i, i + 4) === 'TLEN') {
              // Found TLEN frame, parse duration
              const frameSize = buffer.readUInt32BE(i + 4)
              if (frameSize > 0 && frameSize < 20) {
                const durationMs = parseInt(buffer.toString('ascii', i + 11, i + 11 + frameSize - 1))
                if (!isNaN(durationMs) && durationMs > 0) {
                  return { duration: Math.round(durationMs / 1000), isEstimated: false }
                }
              }
            }
          }
        }
      }
      
      // Fallback: estimate based on typical MP3 bitrate
      const estimatedDuration = Math.max(1, Math.round(buffer.length / 16000)) // Assume 128kbps
      return { duration: estimatedDuration, isEstimated: true }
    } catch (error) {
      const estimatedDuration = Math.max(1, Math.round(buffer.length / 16000))
      return { duration: estimatedDuration, isEstimated: true }
    }
  }

  /**
   * Extract duration from MP4/M4A files using atom parsing
   */
  private static extractMp4Duration(buffer: Buffer): MediaDurationInfo {
    try {
      // Look for mvhd atom which contains duration information
      let offset = 0
      
      while (offset < buffer.length - 8) {
        const atomSize = buffer.readUInt32BE(offset)
        const atomType = buffer.toString('ascii', offset + 4, offset + 8)
        
        if (atomType === 'mvhd') {
          // Found movie header atom
          const version = buffer.readUInt8(offset + 8)
          let timeScale: number
          let duration: number
          
          if (version === 0) {
            // 32-bit values
            timeScale = buffer.readUInt32BE(offset + 20)
            duration = buffer.readUInt32BE(offset + 24)
          } else {
            // 64-bit values
            timeScale = buffer.readUInt32BE(offset + 28)
            // For simplicity, just read lower 32 bits of duration
            duration = buffer.readUInt32BE(offset + 36)
          }
          
          if (timeScale > 0) {
            const durationInSeconds = Math.round(duration / timeScale)
            return { duration: durationInSeconds, isEstimated: false }
          }
        }
        
        if (atomSize === 0 || atomSize > buffer.length - offset) break
        offset += atomSize
      }
      
      throw new Error('Could not find mvhd atom')
    } catch (error) {
      // Fallback estimation for MP4 files
      const estimatedDuration = Math.max(1, Math.round(buffer.length / 125000)) // Assume 1Mbps
      return { duration: estimatedDuration, isEstimated: true }
    }
  }
}
