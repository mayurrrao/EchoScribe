import React, { useState } from 'react'

interface SimpleTranscriptionProps {
  transcription: string
  fileName?: string
}

export default function SimpleTranscription({ transcription, fileName = "audio-file" }: SimpleTranscriptionProps) {
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
    element.download = `transcription-${fileName}-${Date.now()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (!transcription) return null

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Transcription</h2>
        <div className="flex space-x-2">
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={downloadTxt}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
          >
            Download
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {transcription}
        </p>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        File: {fileName} • Words: {transcription.split(' ').length}
      </div>
    </div>
  )
}
