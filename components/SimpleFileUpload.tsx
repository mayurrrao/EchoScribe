import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface SimpleFileUploadProps {
  onUpload: (file: File) => void
  isLoading: boolean
  progress: number
}

export default function SimpleFileUpload({ onUpload, isLoading, progress }: SimpleFileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0])
    }
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'],
      'video/*': ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.webm']
    },
    multiple: false,
    disabled: isLoading
  })

  return (
    <div className="w-full max-w-md mx-auto">
      <div {...getRootProps()}>
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {isLoading ? (
            <div className="space-y-4">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">Processing your file...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              {isDragActive ? (
                <p className="text-blue-600 font-medium">Drop your file here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 font-medium mb-2">
                    Drop your audio or video file here
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Supports MP3, WAV, MP4, and more
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
