import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'

interface FileUploadProps {
  onUpload: (file: File) => void
  onUrlUpload: (url: string) => void
  isLoading: boolean
  progress: number
}

export default function FileUpload({ onUpload, onUrlUpload, isLoading, progress }: FileUploadProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file')
  const [urlInput, setUrlInput] = useState('')
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles)
    if (acceptedFiles.length > 0) {
      console.log('Calling onUpload with file:', acceptedFiles[0].name)
      onUpload(acceptedFiles[0])
    }
  }, [onUpload])

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (urlInput.trim() && !isLoading) {
      onUrlUpload(urlInput.trim())
      setUrlInput('')
    }
  }

  const isGoogleDriveUrl = (url: string) => {
    return url.includes('drive.google.com') || url.includes('docs.google.com')
  }

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
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex mb-6 bg-medium-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('file')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
            activeTab === 'file'
              ? 'bg-white text-medium-text shadow-sm'
              : 'text-medium-light hover:text-medium-text'
          }`}
          disabled={isLoading}
        >
          Upload File
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
            activeTab === 'url'
              ? 'bg-white text-medium-text shadow-sm'
              : 'text-medium-light hover:text-medium-text'
          }`}
          disabled={isLoading}
        >
          Google Drive URL
        </button>
      </div>

      {activeTab === 'file' ? (
        /* File Upload Section */
        <div {...getRootProps()}>
          <motion.div
            className={`upload-area cursor-pointer ${
              isDragActive ? 'drag-over' : ''
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={!isLoading ? { scale: 1.02 } : {}}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
            transition={{ duration: 0.2 }}
          >
          <input {...getInputProps()} />
          
          {isLoading ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 border-4 border-medium-green border-t-transparent rounded-full animate-spin"></div>
              <div className="text-center">
                <p className="text-lg font-medium text-medium-text mb-2">
                  Processing your file...
                </p>
                <div className="w-64 bg-medium-gray-200 rounded-full h-2 mx-auto">
                  <div 
                    className="bg-medium-green h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-medium-light mt-2">
                  {Math.round(progress)}% complete
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-medium-gray-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-medium-light"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-semibold text-medium-text mb-2">
                  {isDragActive ? 'Drop your file here' : 'Upload your audio or video file'}
                </h3>
                <p className="text-medium-light mb-4">
                  Drag and drop, or click to browse. Supports MP3, WAV, MP4, and more.
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-medium-light">
                  <span className="px-2 py-1 bg-medium-gray-100 rounded-md">MP3</span>
                  <span className="px-2 py-1 bg-medium-gray-100 rounded-md">WAV</span>
                  <span className="px-2 py-1 bg-medium-gray-100 rounded-md">MP4</span>
                  <span className="px-2 py-1 bg-medium-gray-100 rounded-md">M4A</span>
                  <span className="px-2 py-1 bg-medium-gray-100 rounded-md">AVI</span>
                  <span className="px-2 py-1 bg-medium-gray-100 rounded-md">MOV</span>
                </div>
              </div>
            </div>
          )}
          </motion.div>
        </div>
      ) : (
        /* URL Upload Section */
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center space-y-4 py-8">
              <div className="w-16 h-16 border-4 border-medium-green border-t-transparent rounded-full animate-spin"></div>
              <div className="text-center">
                <p className="text-lg font-medium text-medium-text mb-2">
                  Downloading from Google Drive...
                </p>
                <div className="w-64 bg-medium-gray-200 rounded-full h-2 mx-auto">
                  <div 
                    className="bg-medium-green h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-medium-light mt-2">
                  {Math.round(progress)}% complete
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-medium-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-medium-green"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-medium-text mb-2">
                  Upload from Google Drive
                </h3>
                <p className="text-medium-light">
                  Paste a Google Drive share link to transcribe files directly from the cloud.
                </p>
              </div>

              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div>
                  <label htmlFor="drive-url" className="block text-sm font-medium text-medium-text mb-2">
                    Google Drive Share Link
                  </label>
                  <input
                    id="drive-url"
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="medium-input"
                    disabled={isLoading}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!urlInput.trim() || isLoading}
                  className="medium-button-primary w-full"
                >
                  {isGoogleDriveUrl(urlInput) ? 'Download & Transcribe' : 'Process URL'}
                </button>
              </form>

              <div className="mt-6 p-4 bg-medium-gray-50 border border-medium-border rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-medium-green mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-medium-text">
                    <p className="font-medium mb-1">Google Drive Requirements:</p>
                    <ul className="space-y-1 text-amber-700">
                      <li>• File must be shared publicly or accessible via link</li>
                      <li>• Supports the same formats as file upload (MP3, MP4, etc.)</li>
                      <li>• Maximum file size: 20MB</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {!isLoading && (
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Maximum file size: 20MB • Supported formats: Audio and Video files
          </p>
        </div>
      )}
    </div>
  )
}
