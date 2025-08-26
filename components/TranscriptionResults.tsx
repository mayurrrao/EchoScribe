import React, { useState } from 'react'

interface TranscriptionResultsProps {
  transcription: string
}

export default function TranscriptionResults({ transcription }: TranscriptionResultsProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcription)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const downloadTxt = () => {
    const element = document.createElement('a')
    const file = new Blob([transcription], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `transcription-${Date.now()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="medium-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-medium-text">
          Transcription Results
        </h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={copyToClipboard}
            className="medium-button-secondary text-sm"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
          <button
            onClick={downloadTxt}
            className="medium-button-primary text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download
          </button>
        </div>
      </div>

      <div className="medium-divider"></div>

      <div className="bg-medium-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
        <div className="medium-prose">
          <p className="text-medium-text leading-relaxed whitespace-pre-wrap">
            {transcription}
          </p>
        </div>
      </div>

      <div className="mt-6 text-sm text-medium-light">
        <div className="flex items-center space-x-6">
          <span>Word count: {transcription.split(' ').length}</span>
          <span>Character count: {transcription.length}</span>
          <span>Estimated reading time: {Math.ceil(transcription.split(' ').length / 200)} min</span>
        </div>
      </div>
    </div>
  )
}
