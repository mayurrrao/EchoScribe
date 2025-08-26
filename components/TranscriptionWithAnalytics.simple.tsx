import React, { useState } from 'react'

interface TranscriptionWithAnalyticsProps {
  transcription: string
  rawTranscription?: string
  fillerWordsRemoved?: boolean
  fileName?: string
  duration?: number
}

export default function TranscriptionWithAnalytics({ 
  transcription,
  rawTranscription,
  fillerWordsRemoved = false,
  fileName = "audio-file", 
  duration = 2.5 
}: TranscriptionWithAnalyticsProps) {
  const [copied, setCopied] = useState(false)
  const [showFillerWords, setShowFillerWords] = useState(false)

  // Determine which transcription to show
  const displayTranscription = (showFillerWords && rawTranscription) ? rawTranscription : transcription

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(displayTranscription)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const downloadTranscription = () => {
    const file = new Blob([displayTranscription], { type: 'text/plain' })
    const element = document.createElement('a')
    element.href = URL.createObjectURL(file)
    element.download = `${fileName}-transcription.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Transcription Results</h2>
        <p className="text-gray-600 mt-1">File: {fileName} • Duration: {duration.toFixed(1)} minutes</p>
      </div>

      {/* Filler Words Toggle (show only if we have both versions) */}
      {fillerWordsRemoved && rawTranscription && (
        <div className="mb-4 flex items-center justify-between bg-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-blue-900">
              {showFillerWords ? 'Showing original transcript with filler words' : 'Showing cleaned transcript'}
            </span>
            <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
              Analytics use original transcript
            </div>
          </div>
          <button
            onClick={() => setShowFillerWords(!showFillerWords)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {showFillerWords ? 'Hide Filler Words' : 'Show Filler Words'}
          </button>
        </div>
      )}

      {/* Transcription Text */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="max-h-96 overflow-y-auto">
          <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
            {displayTranscription || 'No transcription available.'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={copyToClipboard}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <span>{copied ? '✓ Copied!' : '📋 Copy'}</span>
        </button>
        <button
          onClick={downloadTranscription}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <span>💾 Download</span>
        </button>
      </div>

      {/* Basic Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {displayTranscription.split(/\s+/).filter(word => word.length > 0).length}
          </div>
          <div className="text-sm text-blue-800">Total Words</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {Math.round((displayTranscription.split(/\s+/).filter(word => word.length > 0).length) / duration)}
          </div>
          <div className="text-sm text-green-800">Words/Min</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {duration.toFixed(1)}
          </div>
          <div className="text-sm text-purple-800">Duration (min)</div>
        </div>
      </div>
    </div>
  )
}
