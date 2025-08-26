import React, { useState, useCallback } from 'react'
import Head from 'next/head'
import FileUpload from '../components/FileUpload'
import TranscriptionWithAnalytics from '../components/TranscriptionWithAnalytics'
import Header from '../components/Header'
import FeatureSection from '../components/FeatureSection'
import Footer from '../components/Footer'
import { SpeechAnalytics } from '../lib/types/transcription'
import { ClientMediaProcessingService } from '../lib/services/client-media.service'

export default function Home() {
  const [transcription, setTranscription] = useState('')
  const [rawTranscription, setRawTranscription] = useState('')
  const [fillerWordsRemoved, setFillerWordsRemoved] = useState(false)
  const [fileName, setFileName] = useState('')
  const [duration, setDuration] = useState(2.5)
  const [analytics, setAnalytics] = useState<SpeechAnalytics | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<{
    title: string
    message: string
    suggestions?: string[]
  } | null>(null)

  const handleTranscriptionStart = useCallback(async (file: File) => {
    setIsLoading(true)
    setProgress(0)
    setTranscription('')
    setFileName(file.name)
    setError(null)

    try {
      const mediaService = new ClientMediaProcessingService()
      let fileToUpload: File | Blob = file
      
      const maxUploadSize = 20 * 1024 * 1024
      
      if (file.size > maxUploadSize || mediaService.needsProcessing(file)) {
        setProgress(5)

        try {
          if (file.type.startsWith('video/') || file.size > maxUploadSize) {
            fileToUpload = await mediaService.extractAudio(file, (progress: number) => {
              setProgress(5 + (progress * 0.6))
            })
            
            if (fileToUpload.size > maxUploadSize) {
              const chunks = await mediaService.splitAudio(file, 2, (progress: number) => {
                setProgress(65 + (progress * 0.2))
              })
              
              if (chunks.length > 0) {
                fileToUpload = chunks[0]
              }
            }
          } else {
            fileToUpload = await mediaService.extractAudio(file, (progress: number) => {
              setProgress(5 + (progress * 0.6))
            })
          }
        } catch (processingError) {
          if (file.size > maxUploadSize) {
            throw new Error(`File too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum supported size is ${Math.round(maxUploadSize / 1024 / 1024)}MB.`)
          }
          
          fileToUpload = file
        }
      }

      setProgress(70)

      const finalSize = fileToUpload.size
      
      if (finalSize > maxUploadSize) {
        throw new Error(`Processed file still too large (${Math.round(finalSize / 1024 / 1024)}MB). Please use a smaller file.`)
      }

      if (fileToUpload instanceof Blob && !(fileToUpload instanceof File)) {
        fileToUpload = new File([fileToUpload], `processed_${file.name.replace(/\.[^/.]+$/, '.wav')}`, { 
          type: 'audio/wav' 
        })
      }

      const formData = new FormData()
      formData.append('file', fileToUpload)

      setProgress(80)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      setProgress(90)

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        
        if (response.status === 413 || errorText.includes('Too Large')) {
          throw new Error('File too large for processing. Please use a smaller file or try again.')
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || data.error || 'Transcription failed')
      }
      
      setProgress(100)
      
      setTranscription(data.transcription)
      setRawTranscription(data.rawTranscription || data.transcription)
      setFillerWordsRemoved(data.fillerWordsRemoved || false)
      setFileName(data.fileName || file.name)
      setDuration(data.duration || 5)
      setAnalytics(data.analytics)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      setError({
        title: 'Transcription Failed',
        message: errorMessage,
        suggestions: [
          'Try converting your file to MP3, MP4, or WAV format',
          'Ensure your file is under 20MB in size',
          'Check that your file contains clear audio',
          'Try uploading a different file'
        ]
      })
    } finally {
      setIsLoading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }, [])

  const handleUrlUpload = useCallback(async (url: string) => {
    setIsLoading(true)
    setProgress(0)
    setTranscription('')
    setAnalytics(undefined)
    setError(null)

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'URL processing failed')
      }
      
      setTranscription(data.transcription)
      setRawTranscription(data.rawTranscription || data.transcription)
      setFillerWordsRemoved(data.fillerWordsRemoved || false)
      setFileName(data.fileName || 'Downloaded Audio')
      setDuration(data.duration || 5)
      setAnalytics(data.analytics)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      let errorTitle = 'URL Processing Failed'
      let suggestions = [
        'Check that your URL is accessible and public',
        'Try downloading the file and uploading it directly',
        'Ensure the file is a supported audio/video format'
      ]
      
      if (errorMessage.includes('File too large')) {
        errorTitle = 'File Too Large'
        suggestions = [
          'Compress your video file to reduce size',
          'Extract audio only (much smaller than video)',
          'Try a shorter video clip',
          'Upload the file directly instead of using URL'
        ]
      } else if (errorMessage.includes('HTTP 4')) {
        errorTitle = 'File Access Error'
        suggestions = [
          'Make sure the file is publicly accessible',
          'Check that the Google Drive link has sharing enabled',
          'Try copying the file link again'
        ]
      }
      
      setError({
        title: errorTitle,
        message: errorMessage,
        suggestions
      })
    } finally {
      setIsLoading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>EchoScribe - AI-Powered Audio Transcription & Analytics</title>
        <meta name="description" content="Transform your audio and video files into accurate transcriptions with advanced speech analytics powered by Google's Gemini AI." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      
      <main className="medium-container py-16">
        <section className="text-center mb-20">
          <h1 className="text-6xl font-bold text-medium-text mb-8 leading-tight">
            Transform Audio into 
            <span className="text-medium-green"> Actionable Insights</span>
          </h1>
          <p className="text-xl text-medium-light mb-12 max-w-3xl mx-auto leading-relaxed">
            Upload your audio or video files and get accurate transcriptions with comprehensive speech analytics. 
            Powered by Google's advanced Gemini AI technology.
          </p>
        </section>

        <section className="mb-20">
          <FileUpload 
            onUpload={handleTranscriptionStart}
            onUrlUpload={handleUrlUpload}
            isLoading={isLoading}
            progress={progress}
          />
        </section>

        {/* Error Display */}
        {error && (
          <section className="mb-20">
            <div className="max-w-3xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-red-800 mb-2">
                      {error.title}
                    </h3>
                    <p className="text-red-700 mb-4 leading-relaxed">
                      {error.message}
                    </p>
                    {error.suggestions && error.suggestions.length > 0 && (
                      <div>
                        <h4 className="text-lg font-medium text-red-800 mb-2">
                          💡 Suggestions to fix this:
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-red-700">
                          {error.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button
                      onClick={() => setError(null)}
                      className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-medium transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {transcription && (
          <section className="mb-20">
            <TranscriptionWithAnalytics
              transcription={transcription}
              rawTranscription={rawTranscription}
              fillerWordsRemoved={fillerWordsRemoved}
              fileName={fileName}
              duration={duration}
              analytics={analytics}
            />
          </section>
        )}

        <FeatureSection />

      </main>

      <Footer />
    </div>
  )
}
