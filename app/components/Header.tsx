import React from 'react'

export default function Header() {
  return (
    <header className="border-b border-medium-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="medium-container">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center space-x-2">
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
            <span className="text-xl font-semibold text-medium-text">
              EchoScribe
            </span>
          </a>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="#about" className="text-medium-light hover:text-medium-text transition-colors">
              About
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}
