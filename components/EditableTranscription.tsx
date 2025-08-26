import React, { useState, useRef, useEffect } from 'react'

interface EditableTranscriptionProps {
  text: string
  onTextChange: (newText: string) => void
  className?: string
}

interface EditingSegment {
  index: number
  text: string
  isEditing: boolean
}

export default function EditableTranscription({ 
  text, 
  onTextChange, 
  className = '' 
}: EditableTranscriptionProps) {
  const [segments, setSegments] = useState<EditingSegment[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [tempText, setTempText] = useState('')
  const editInputRef = useRef<HTMLTextAreaElement>(null)

  // Initialize segments from text
  useEffect(() => {
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim())
    const newSegments = sentences.map((sentence, index) => ({
      index,
      text: sentence,
      isEditing: false
    }))
    setSegments(newSegments)
  }, [text])

  const handleSegmentClick = (index: number) => {
    if (editingIndex === index) return // Already editing
    
    setEditingIndex(index)
    setTempText(segments[index].text)
  }

  const handleSaveEdit = (index: number) => {
    const newSegments = [...segments]
    newSegments[index].text = tempText.trim()
    setSegments(newSegments)
    
    // Update the full text
    const newFullText = newSegments.map(s => s.text).join(' ')
    onTextChange(newFullText)
    
    setEditingIndex(null)
    setTempText('')
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setTempText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit(index)
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  // Focus the textarea when editing starts
  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingIndex])

  return (
    <div className={`${className} relative`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg
            className="w-5 h-5 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span className="text-sm font-medium text-slate-700">
            Click any sentence to edit it
          </span>
        </div>
        <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full border">
          Press Enter to save • Escape to cancel
        </div>
      </div>

      <div className="space-y-2">
        {segments.map((segment, index) => (
          <div key={index} className="relative">
            {editingIndex === index ? (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
                <textarea
                  ref={editInputRef}
                  value={tempText}
                  onChange={(e) => setTempText(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-full min-h-[60px] p-2 border border-blue-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Edit this sentence..."
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => handleSaveEdit(index)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => handleSegmentClick(index)}
                className="cursor-pointer p-3 rounded-lg transition-all duration-200 hover:bg-blue-50 hover:border-blue-200 border border-transparent"
                title="Click to edit this sentence"
              >
                <span className="text-gray-900 leading-relaxed">
                  {segment.text}
                </span>
                <div className="opacity-0 hover:opacity-100 absolute right-2 top-2 transition-opacity">
                  <svg
                    className="w-4 h-4 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
