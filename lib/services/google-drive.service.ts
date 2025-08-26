export class GoogleDriveService {
  /**
   * Convert Google Drive share link to direct download link
   */
  static convertToDirectDownloadLink(driveUrl: string): string {
    console.log('Converting URL:', driveUrl)
    
    // Clean the URL first
    const cleanUrl = driveUrl.trim()
    
    // Handle various Google Drive URL formats with more flexible patterns
    const patterns = [
      // Most common format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
      /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/,
      // Open format: https://drive.google.com/open?id=FILE_ID
      /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]{10,})/,
      // Docs formats
      /https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]{10,})/,
      /https:\/\/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]{10,})/,
      /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]{10,})/,
    ]

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i]
      const match = cleanUrl.match(pattern)
      console.log(`Pattern ${i + 1} testing:`, pattern.toString())
      console.log(`Pattern ${i + 1} result:`, match)
      
      if (match && match[1] && match[1].length >= 10) {
        const fileId = match[1]
        console.log('✅ Extracted file ID:', fileId)
        const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
        console.log('✅ Direct download URL:', directUrl)
        return directUrl
      }
    }

    // If already a direct download link, return as-is
    if (cleanUrl.includes('drive.google.com/uc?') && cleanUrl.includes('export=download')) {
      console.log('✅ Already a direct download link')
      return cleanUrl
    }

    // Log the URL that failed to match for debugging
    console.error('❌ No pattern matched for URL:', cleanUrl)
    console.error('URL length:', cleanUrl.length)
    console.error('URL contains drive.google.com:', cleanUrl.includes('drive.google.com'))
    
    throw new Error(`Invalid Google Drive URL format. Please ensure you're using a valid Google Drive share link like: https://drive.google.com/file/d/FILE_ID/view?usp=sharing`)
  }

  /**
   * Check if URL is a Google Drive link
   */
  static isGoogleDriveUrl(url: string): boolean {
    const cleanUrl = url.trim()
    return /https:\/\/(drive|docs)\.google\.com/.test(cleanUrl)
  }

  /**
   * Download file from Google Drive
   */
  static async downloadFile(driveUrl: string, onProgress?: (progress: number) => void): Promise<{
    buffer: ArrayBuffer
    filename: string
    size: number
  }> {
    try {
      console.log('Downloading from Google Drive:', driveUrl)
      
      const directUrl = this.convertToDirectDownloadLink(driveUrl)
      console.log('Direct download URL:', directUrl)

      const response = await fetch(directUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
      }

      // Check for Google Drive virus scan warning
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('text/html')) {
        // This might be a virus scan warning page
        const text = await response.text()
        if (text.includes('virus scan warning') || text.includes('Google Drive - Virus scan warning')) {
          // Try to extract the direct download link from the warning page
          const confirmMatch = text.match(/href="([^"]*&amp;confirm=[^"]*)"/)
          if (confirmMatch) {
            const confirmUrl = confirmMatch[1].replace(/&amp;/g, '&')
            console.log('Retrying with confirmation URL:', confirmUrl)
            return this.downloadFile(confirmUrl, onProgress)
          }
        }
        throw new Error('Unable to download file - it may be too large or require manual download')
      }

      const contentLength = response.headers.get('content-length')
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0

      // Get filename from Content-Disposition header or URL
      let filename = 'download'
      const contentDisposition = response.headers.get('content-disposition')
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '')
        }
      }

      // If no filename from headers, try to extract from original URL
      if (filename === 'download') {
        const urlMatch = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
        filename = urlMatch ? `drive_file_${urlMatch[1]}` : 'drive_download'
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Unable to read response stream')
      }

      const chunks: Uint8Array[] = []
      let receivedLength = 0

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        if (value) {
          chunks.push(value)
          receivedLength += value.length
          
          if (onProgress && totalSize > 0) {
            onProgress((receivedLength / totalSize) * 100)
          }
        }
      }

      // Combine chunks into single ArrayBuffer
      const buffer = new ArrayBuffer(receivedLength)
      const uint8Array = new Uint8Array(buffer)
      let position = 0
      
      for (const chunk of chunks) {
        uint8Array.set(chunk, position)
        position += chunk.length
      }

      console.log(`Google Drive download complete: ${filename} (${receivedLength} bytes)`)

      return {
        buffer,
        filename,
        size: receivedLength
      }

    } catch (error) {
      console.error('Google Drive download failed:', error)
      throw new Error(
        error instanceof Error 
          ? `Google Drive download failed: ${error.message}`
          : 'Google Drive download failed'
      )
    }
  }

  /**
   * Extract file ID from Google Drive URL
   */
  static extractFileId(driveUrl: string): string | null {
    const patterns = [
      /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
      /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
      /https:\/\/docs\.google\.com\/(?:document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]+)/,
    ]

    for (const pattern of patterns) {
      const match = driveUrl.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }
}
