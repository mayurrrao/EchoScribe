import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-medium-gray-900 text-white py-12">
      <div className="medium-container">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-medium-green rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <span className="text-xl font-semibold">EchoScribe</span>
          </div>
          <p className="text-medium-gray-300 mb-8 max-w-md mx-auto">
            AI-powered transcription with comprehensive speech analytics
          </p>
          
          <div className="medium-divider border-medium-gray-700 mb-6"></div>
          
          <p className="text-medium-gray-400 text-sm">
            &copy; 2025 EchoScribe. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
