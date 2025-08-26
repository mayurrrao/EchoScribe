import React, { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

interface TranscriptionWithAnalyticsProps {
  transcription: string
  rawTranscription?: string // Original with filler words
  fillerWordsRemoved?: boolean
  fileName?: string
  duration?: number // in minutes
  analytics?: SpeechAnalytics
}

interface SpeechAnalytics {
  overallScore: number
  totalWords: number
  wordsPerMinute: number
  paceAnalysis: {
    paceCategory: string
    paceScore: number
    paceRecommendation: string
  }
  fillerWordAnalysis: {
    totalFillerWords: number
    fillerWordPercentage: number
    fillerWordScore: number
    fillerWordFeedback: string
    fillerWordCounts: Record<string, number>
  }
  vocabularyAnalysis: {
    uniqueWords: number
    vocabularyDiversity: number
    vocabularyScore: number
    vocabularyFeedback: string
  }
  confidenceAnalysis: {
    confidenceScore: number
    confidenceFeedback: string
  }
  recommendations: string[]
}

export default function TranscriptionWithAnalytics({ 
  transcription, 
  rawTranscription, 
  fillerWordsRemoved = false, 
  fileName = "audio-file",
  duration = 5,
  analytics 
}: TranscriptionWithAnalyticsProps) {
  const [copied, setCopied] = useState(false)
  const [showFillerWords, setShowFillerWords] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTranscription, setEditedTranscription] = useState(transcription)
  const [activeTab, setActiveTab] = useState<'transcription' | 'analytics'>('transcription')

  // Helper function to format duration from seconds to "XmYs" format
  const formatDuration = (seconds: number): string => {
    const totalSeconds = Math.round(seconds)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}m${secs}s`
  }

  // Calculate Speech Clarity Rating based on multiple factors
  const calculateSpeechClarity = (analytics: SpeechAnalytics): number => {
    if (!analytics) return 0

    // 1. Filler Word Impact (40% weight) - Lower filler words = higher clarity
    const fillerWordScore = Math.max(0, 10 - (analytics.fillerWordAnalysis.fillerWordPercentage * 2))
    
    // 2. Speech Pace Consistency (30% weight) - Optimal range: 120-180 WPM
    let paceScore = 10
    if (analytics.wordsPerMinute < 120) {
      paceScore = Math.max(0, 10 - ((120 - analytics.wordsPerMinute) / 10))
    } else if (analytics.wordsPerMinute > 180) {
      paceScore = Math.max(0, 10 - ((analytics.wordsPerMinute - 180) / 15))
    }
    
    // 3. Pause Pattern Analysis (20% weight) - Based on confidence score
    const pauseScore = analytics.confidenceAnalysis.confidenceScore
    
    // 4. Repetition Factor (10% weight) - Estimate from filler word frequency
    const repetitionScore = Math.max(0, 10 - (analytics.fillerWordAnalysis.totalFillerWords / analytics.totalWords * 100))
    
    // Weighted average
    const clarityScore = (
      fillerWordScore * 0.4 + 
      paceScore * 0.3 + 
      pauseScore * 0.2 + 
      repetitionScore * 0.1
    )
    
    return Math.round(clarityScore * 10) / 10 // Round to 1 decimal place
  }

  // Calculate Confidence Level based on speech patterns
  const calculateConfidenceLevel = (analytics: SpeechAnalytics, transcript: string): number => {
    if (!analytics || !transcript) return 0

    // Hedging words that indicate uncertainty
    const hedgingWords = ['maybe', 'i think', 'kind of', 'sort of', 'perhaps', 'possibly', 'probably', 'i guess', 'i suppose', 'i believe']
    const correctiveWords = ['i mean', 'actually', 'well', 'you know', 'like i said']
    
    const words = transcript.toLowerCase().split(/\s+/)
    const totalWords = words.length
    
    // Count hedging patterns
    let hedgingCount = 0
    hedgingWords.forEach(phrase => {
      const regex = new RegExp(phrase.replace(/\s+/g, '\\s+'), 'gi')
      const matches = transcript.match(regex)
      hedgingCount += matches ? matches.length : 0
    })
    
    // Count corrective patterns
    let correctiveCount = 0
    correctiveWords.forEach(phrase => {
      const regex = new RegExp(phrase.replace(/\s+/g, '\\s+'), 'gi')
      const matches = transcript.match(regex)
      correctiveCount += matches ? matches.length : 0
    })
    
    // Base confidence score
    let confidenceScore = 7.0
    
    // Apply penalties and bonuses
    const hedgingPenalty = (hedgingCount / totalWords) * 30
    const correctivePenalty = (correctiveCount / totalWords) * 25
    const fillerPenalty = (analytics.fillerWordAnalysis.fillerWordPercentage / 100) * 20
    
    // Pace consistency bonus (steady pace indicates confidence)
    const paceBonus = analytics.paceAnalysis.paceScore >= 7 ? 1.0 : 0
    
    confidenceScore = confidenceScore - hedgingPenalty - correctivePenalty - fillerPenalty + paceBonus
    
    return Math.max(0, Math.min(10, Math.round(confidenceScore * 10) / 10))
  }

  // Calculate Engagement Score based on speech dynamics
  const calculateEngagementScore = (analytics: SpeechAnalytics, transcript: string): number => {
    if (!analytics || !transcript) return 0

    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = transcript.toLowerCase().split(/\s+/)
    const totalWords = words.length
    
    // 1. Sentence Variety (30%) - Mix of short and long sentences
    const avgSentenceLength = totalWords / sentences.length
    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length)
    const sentenceVariety = sentenceLengths.length > 1 ? 
      (Math.max(...sentenceLengths) - Math.min(...sentenceLengths)) / avgSentenceLength : 0
    const varietyScore = Math.min(10, sentenceVariety * 2)
    
    // 2. Dynamic Vocabulary (25%) - Action and descriptive words
    const actionWords = ['create', 'build', 'develop', 'achieve', 'discover', 'transform', 'improve', 'enhance', 'generate', 'implement']
    const descriptiveWords = ['amazing', 'incredible', 'outstanding', 'excellent', 'remarkable', 'significant', 'powerful', 'effective']
    
    let dynamicWordCount = 0
    actionWords.concat(descriptiveWords).forEach(word => {
      dynamicWordCount += words.filter(w => w.includes(word)).length
    })
    const vocabularyScore = Math.min(10, (dynamicWordCount / totalWords) * 100)
    
    // 3. Storytelling Elements (20%) - Narrative connectors
    const narrativeWords = ['then', 'however', 'suddenly', 'because', 'therefore', 'meanwhile', 'furthermore', 'consequently']
    let narrativeCount = 0
    narrativeWords.forEach(word => {
      narrativeCount += words.filter(w => w === word).length
    })
    const narrativeScore = Math.min(10, (narrativeCount / totalWords) * 50)
    
    // 4. Question Usage (15%) - Engagement through questions
    const questionCount = (transcript.match(/\?/g) || []).length
    const questionScore = Math.min(10, (questionCount / sentences.length) * 20)
    
    // 5. Energy Words (10%) - Power words that create excitement
    const energyWords = ['breakthrough', 'innovation', 'revolutionary', 'extraordinary', 'phenomenal', 'cutting-edge']
    let energyWordCount = 0
    energyWords.forEach(word => {
      energyWordCount += words.filter(w => w.includes(word)).length
    })
    const energyScore = Math.min(10, (energyWordCount / totalWords) * 200)
    
    // Weighted average
    const engagementScore = (
      varietyScore * 0.3 + 
      vocabularyScore * 0.25 + 
      narrativeScore * 0.2 + 
      questionScore * 0.15 + 
      energyScore * 0.1
    )
    
    return Math.round(engagementScore * 10) / 10
  }

  // Generate clarity feedback based on score
  const getClarityFeedback = (score: number): string => {
    if (score >= 8.5) return "Excellent clarity with minimal filler words"
    if (score >= 7.0) return "Very good clarity with natural speech flow"
    if (score >= 5.5) return "Good clarity, some hesitations detected"
    if (score >= 4.0) return "Moderate clarity, frequent filler words affect flow"
    return "Needs improvement - many interruptions and unclear speech"
  }

  // Generate confidence feedback based on score
  const getConfidenceFeedback = (score: number): string => {
    if (score >= 8.5) return "High confidence: Clear, decisive speech patterns"
    if (score >= 7.0) return "Good confidence with occasional uncertainty"
    if (score >= 5.5) return "Moderate confidence: Some hesitation detected"
    if (score >= 4.0) return "Lower confidence with frequent hedging"
    return "Low confidence: Excessive uncertainty and self-doubt"
  }

  // Generate personalized recommendations based on user's specific scores
  const generatePersonalizedRecommendations = (analytics: SpeechAnalytics, transcript: string): string[] => {
    if (!analytics) return []

    const recommendations: string[] = []
    const speechClarity = calculateSpeechClarity(analytics)
    const confidenceLevel = calculateConfidenceLevel(analytics, transcript)
    const engagementScore = calculateEngagementScore(analytics, transcript)

    // Pace-based recommendations
    if (analytics.wordsPerMinute < 120) {
      recommendations.push(`Your speaking pace is ${analytics.wordsPerMinute.toFixed(0)} WPM, which is quite slow. Try to speak more confidently and increase your pace to 120-150 WPM for better engagement.`)
    } else if (analytics.wordsPerMinute > 180) {
      recommendations.push(`Your speaking pace is ${analytics.wordsPerMinute.toFixed(0)} WPM, which is very fast. Slow down to 150-170 WPM to improve clarity and allow listeners to follow better.`)
    } else if (analytics.paceAnalysis.paceScore >= 8) {
      recommendations.push(`Excellent speaking pace of ${analytics.wordsPerMinute.toFixed(0)} WPM! This is optimal for audience comprehension.`)
    }

    // Filler words recommendations
    if (analytics.fillerWordAnalysis.fillerWordPercentage > 5) {
      recommendations.push(`You used ${analytics.fillerWordAnalysis.totalFillerWords} filler words (${analytics.fillerWordAnalysis.fillerWordPercentage.toFixed(1)}%). Practice pausing instead of saying "um" or "uh" to sound more confident.`)
    } else if (analytics.fillerWordAnalysis.fillerWordPercentage < 2) {
      recommendations.push(`Excellent filler word control at ${analytics.fillerWordAnalysis.fillerWordPercentage.toFixed(1)}%! Your speech sounds very polished and professional.`)
    }

    // Speech clarity recommendations
    if (speechClarity < 6) {
      recommendations.push(`Your speech clarity score is ${speechClarity}/10. Focus on articulation, reduce filler words, and maintain consistent pacing to improve clarity.`)
    } else if (speechClarity >= 8) {
      recommendations.push(`Outstanding speech clarity of ${speechClarity}/10! Your message comes across very clearly to listeners.`)
    }

    // Confidence recommendations
    if (confidenceLevel < 6) {
      recommendations.push(`Your confidence level is ${confidenceLevel}/10. Reduce hedge words like "maybe" and "I think". Make definitive statements to sound more authoritative.`)
    } else if (confidenceLevel >= 8) {
      recommendations.push(`High confidence level of ${confidenceLevel}/10! You speak with authority and conviction, which builds trust with your audience.`)
    }

    // Engagement recommendations
    if (engagementScore < 5) {
      recommendations.push(`Your engagement score is ${engagementScore}/10. Add more variety in sentence structure, use descriptive words, and include rhetorical questions to captivate your audience.`)
    } else if (engagementScore >= 7) {
      recommendations.push(`Great engagement score of ${engagementScore}/10! Your dynamic vocabulary and varied sentence structure keeps listeners interested.`)
    }

    // Duration-specific recommendations
    if (duration < 1) {
      recommendations.push(`This was a short ${formatDuration(duration)} recording. For longer presentations, maintain this energy and clarity throughout.`)
    } else if (duration > 10) {
      recommendations.push(`In longer speeches like this ${formatDuration(duration)} recording, vary your pace and energy to maintain audience attention.`)
    }

    // Overall performance recommendations
    const overallScore = analytics.overallScore
    if (overallScore >= 8.5) {
      recommendations.push(`Exceptional overall performance of ${overallScore}/10! You demonstrate excellent speaking skills across all metrics.`)
    } else if (overallScore < 6) {
      const weakestAreas = []
      if (analytics.paceAnalysis.paceScore < 6) weakestAreas.push('speaking pace')
      if (speechClarity < 6) weakestAreas.push('speech clarity')  
      if (confidenceLevel < 6) weakestAreas.push('confidence')
      if (engagementScore < 6) weakestAreas.push('engagement')

      if (weakestAreas.length > 0) {
        recommendations.push(`Focus on improving: ${weakestAreas.join(', ')}. These are your primary areas for development.`)
      }
    }

    return recommendations.length > 0 ? recommendations : ['Keep practicing! Regular speech analysis will help you track your improvement over time.']
  }

  // Generate engagement feedback based on score
  const getEngagementFeedback = (score: number): string => {
    if (score >= 8.5) return "Highly engaging with dynamic vocabulary and structure"
    if (score >= 7.0) return "Good engagement with varied expression"
    if (score >= 5.5) return "Moderately engaging with some variety"
    if (score >= 4.0) return "Somewhat monotonous delivery"
    return "Low engagement: Repetitive patterns and flat delivery"
  }

  // Use appropriate transcript based on user preference
  const displayTranscription = showFillerWords && rawTranscription ? rawTranscription : transcription
  const finalTranscription = isEditing ? editedTranscription : displayTranscription

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(finalTranscription)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleSaveEdit = () => {
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedTranscription(displayTranscription)
    setIsEditing(false)
  }

  // Generate export text with analytics
  const generateFullExport = () => {
    const analyticsText = rawTranscription || transcription
    
    if (!analytics) {
      return `TRANSCRIPTION
============
${analyticsText}`
    }

    const speechClarity = calculateSpeechClarity(analytics)
    const confidenceLevel = calculateConfidenceLevel(analytics, analyticsText)
    const engagementScore = calculateEngagementScore(analytics, analyticsText)

    return `SPEECH ANALYSIS REPORT
=====================

Overall Score: ${analytics.overallScore}/10

TRANSCRIPTION DETAILS
--------------------
File: ${fileName}
Duration: ${formatDuration(duration)}
Total Words: ${analytics.totalWords}
Speaking Pace: ${analytics.wordsPerMinute.toFixed(2)} words/minute (${analytics.paceAnalysis.paceCategory})

KEY METRICS
-----------
• Total Words: ${analytics.totalWords}
• Words per Minute: ${analytics.wordsPerMinute.toFixed(2)}
• Speech Clarity: ${speechClarity}/10
• Confidence Level: ${confidenceLevel}/10  
• Engagement Score: ${engagementScore}/10
• Filler Words: ${analytics.fillerWordAnalysis.totalFillerWords}

DETAILED SPEECH ANALYSIS
------------------------
Speaking Pace: ${analytics.paceAnalysis.paceScore}/10
- ${analytics.paceAnalysis.paceRecommendation}

Speech Clarity: ${speechClarity}/10
- ${getClarityFeedback(speechClarity)}

Confidence Level: ${confidenceLevel}/10
- ${getConfidenceFeedback(confidenceLevel)}

Engagement Score: ${engagementScore}/10  
- ${getEngagementFeedback(engagementScore)}

Filler Word Analysis: ${analytics.fillerWordAnalysis.fillerWordScore}/10
- Filler words: ${analytics.fillerWordAnalysis.totalFillerWords} (${analytics.fillerWordAnalysis.fillerWordPercentage.toFixed(1)}%)
- ${analytics.fillerWordAnalysis.fillerWordFeedback}

Vocabulary Analysis: ${analytics.vocabularyAnalysis.vocabularyScore}/10
- Unique words: ${analytics.vocabularyAnalysis.uniqueWords}
- Diversity: ${(analytics.vocabularyAnalysis.vocabularyDiversity * 100).toFixed(1)}%
- ${analytics.vocabularyAnalysis.vocabularyFeedback}

System Confidence: ${analytics.confidenceAnalysis.confidenceScore.toFixed(1)}/10
- ${analytics.confidenceAnalysis.confidenceFeedback}

PERSONALIZED RECOMMENDATIONS
----------------------------
${generatePersonalizedRecommendations(analytics, analyticsText).map(rec => `• ${rec}`).join('\n')}

ORIGINAL TRANSCRIPTION
----------------------
${analyticsText}`
  }

  return (
    <div className="medium-card space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-medium-text">Transcription Results</h2>
        <div className="text-sm text-medium-light">
          File: {fileName} • Duration: {formatDuration(duration)}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-medium-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('transcription')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
            activeTab === 'transcription'
              ? 'bg-white text-medium-text shadow-sm'
              : 'text-medium-light hover:text-medium-text'
          }`}
        >
          Transcription
        </button>
        {analytics && (
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
              activeTab === 'analytics'
                ? 'bg-white text-medium-text shadow-sm'
                : 'text-medium-light hover:text-medium-text'
            }`}
          >
            Speech Analytics
          </button>
        )}
      </div>

      {activeTab === 'transcription' && (
        <div className="space-y-4">
          {/* Editing and Filler Words Controls */}
          <div className="space-y-3">
            {/* Filler Words Toggle (show only if we have both versions) */}
            {fillerWordsRemoved && rawTranscription && (
              <div className="flex items-center justify-between bg-medium-gray-50 rounded-lg p-3 border border-medium-border">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-medium-text">
                    {showFillerWords ? 'Showing original transcript with filler words' : 'Showing cleaned transcript'}
                  </span>
                  <div className="text-xs text-medium-light bg-medium-gray-100 px-2 py-1 rounded-full border">
                    Analytics use original transcript
                  </div>
                </div>
                <button
                  onClick={() => setShowFillerWords(!showFillerWords)}
                  className="px-3 py-1 text-sm bg-medium-green text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  {showFillerWords ? 'Hide Filler Words' : 'Show Filler Words'}
                </button>
              </div>
            )}

            {/* Editing Mode Toggle */}
            {!showFillerWords && (
              <div className="flex items-center justify-between bg-medium-gray-50 rounded-lg p-3 border border-medium-border">
                <div className="flex items-center space-x-3">
                  <svg
                    className="w-5 h-5 text-medium-green"
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
                  <span className="text-sm font-medium text-medium-text">
                    Edit transcription to fix any errors before copying or sharing
                  </span>
                </div>

                {isEditing ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 text-sm bg-medium-green text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-sm bg-medium-gray-200 text-medium-text rounded-md hover:bg-medium-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1 text-sm bg-medium-green text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Transcription Content */}
          <div className="bg-medium-gray-50 rounded-lg p-6 border border-medium-border">
            {isEditing ? (
              <textarea
                value={editedTranscription}
                onChange={(e) => setEditedTranscription(e.target.value)}
                className="w-full h-64 p-4 border border-medium-border rounded-lg resize-none focus:ring-2 focus:ring-medium-green focus:border-transparent outline-none"
                placeholder="Edit your transcription here..."
              />
            ) : (
              <div className="prose prose-lg max-w-none">
                <p className="text-medium-text leading-relaxed whitespace-pre-wrap">
                  {finalTranscription}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={copyToClipboard}
              className="medium-button-primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? 'Copied!' : 'Copy Text'}
            </button>

            {analytics && (
              <button
                onClick={() => copyToClipboard()}
                className="medium-button-secondary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Export Full Report
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="text-center p-6 bg-medium-gray-50 rounded-lg border border-medium-border">
            <h3 className="text-lg font-semibold text-medium-text mb-2">Overall Speech Score</h3>
            <div className="text-4xl font-bold text-medium-green mb-2">
              {analytics.overallScore}/10
            </div>
            <div className="w-full bg-medium-gray-200 rounded-full h-2">
              <div 
                className="bg-medium-green h-2 rounded-full transition-all duration-300"
                style={{ width: `${(analytics.overallScore / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="medium-card text-center">
              <div className="text-2xl font-bold text-medium-green">{analytics.totalWords}</div>
              <div className="text-sm text-medium-light">Total Words</div>
            </div>
            <div className="medium-card text-center">
              <div className="text-2xl font-bold text-medium-green">{analytics.wordsPerMinute.toFixed(2)}</div>
              <div className="text-sm text-medium-light">Words/Min</div>
            </div>
            <div className="medium-card text-center">
              <div className="text-2xl font-bold text-medium-green">{calculateSpeechClarity(analytics)}</div>
              <div className="text-sm text-medium-light">Speech Clarity</div>
            </div>
            <div className="medium-card text-center">
              <div className="text-2xl font-bold text-medium-green">{calculateConfidenceLevel(analytics, rawTranscription || transcription)}</div>
              <div className="text-sm text-medium-light">Confidence Level</div>
            </div>
            <div className="medium-card text-center">
              <div className="text-2xl font-bold text-medium-green">{calculateEngagementScore(analytics, rawTranscription || transcription)}</div>
              <div className="text-sm text-medium-light">Engagement Score</div>
            </div>
            <div className="medium-card text-center">
              <div className="text-2xl font-bold text-medium-green">{analytics.fillerWordAnalysis.totalFillerWords}</div>
              <div className="text-sm text-medium-light">Filler Words</div>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="medium-card">
              <h4 className="text-lg font-semibold text-medium-text mb-3">Speaking Pace</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-medium-light">Category:</span>
                  <span className="text-medium-text font-medium">{analytics.paceAnalysis.paceCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-medium-light">Score:</span>
                  <span className="text-medium-text font-medium">{analytics.paceAnalysis.paceScore}/10</span>
                </div>
                <p className="text-sm text-medium-light mt-2">{analytics.paceAnalysis.paceRecommendation}</p>
              </div>
            </div>

            <div className="medium-card">
              <h4 className="text-lg font-semibold text-medium-text mb-3">Speech Clarity</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-medium-light">Clarity Score:</span>
                  <span className="text-medium-text font-medium">{calculateSpeechClarity(analytics)}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-medium-light">Filler Words:</span>
                  <span className="text-medium-text font-medium">{analytics.fillerWordAnalysis.fillerWordPercentage.toFixed(1)}%</span>
                </div>
                <p className="text-sm text-medium-light mt-2">{getClarityFeedback(calculateSpeechClarity(analytics))}</p>
              </div>
            </div>

            <div className="medium-card">
              <h4 className="text-lg font-semibold text-medium-text mb-3">Confidence Level</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-medium-light">Confidence Score:</span>
                  <span className="text-medium-text font-medium">{calculateConfidenceLevel(analytics, rawTranscription || transcription)}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-medium-light">Base Level:</span>
                  <span className="text-medium-text font-medium">
                    {calculateConfidenceLevel(analytics, rawTranscription || transcription) >= 7 ? 'High' : 
                     calculateConfidenceLevel(analytics, rawTranscription || transcription) >= 5 ? 'Medium' : 'Low'}
                  </span>
                </div>
                <p className="text-sm text-medium-light mt-2">{getConfidenceFeedback(calculateConfidenceLevel(analytics, rawTranscription || transcription))}</p>
              </div>
            </div>

            <div className="medium-card">
              <h4 className="text-lg font-semibold text-medium-text mb-3">Engagement Score</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-medium-light">Engagement Level:</span>
                  <span className="text-medium-text font-medium">{calculateEngagementScore(analytics, rawTranscription || transcription)}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-medium-light">Dynamism:</span>
                  <span className="text-medium-text font-medium">
                    {calculateEngagementScore(analytics, rawTranscription || transcription) >= 7 ? 'High' : 
                     calculateEngagementScore(analytics, rawTranscription || transcription) >= 5 ? 'Medium' : 'Low'}
                  </span>
                </div>
                <p className="text-sm text-medium-light mt-2">{getEngagementFeedback(calculateEngagementScore(analytics, rawTranscription || transcription))}</p>
              </div>
            </div>

            <div className="medium-card">
              <h4 className="text-lg font-semibold text-medium-text mb-3">Vocabulary Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-medium-light">Vocabulary Score:</span>
                  <span className="text-medium-text font-medium">{analytics.vocabularyAnalysis.vocabularyScore}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-medium-light">Diversity:</span>
                  <span className="text-medium-text font-medium">{(analytics.vocabularyAnalysis.vocabularyDiversity * 100).toFixed(1)}%</span>
                </div>
                <p className="text-sm text-medium-light mt-2">{analytics.vocabularyAnalysis.vocabularyFeedback}</p>
              </div>
            </div>

            <div className="medium-card">
              <h4 className="text-lg font-semibold text-medium-text mb-3">System Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-medium-light">System Score:</span>
                  <span className="text-medium-text font-medium">{analytics.confidenceAnalysis.confidenceScore.toFixed(1)}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-medium-light">Status:</span>
                  <span className="text-medium-text font-medium">
                    {analytics.confidenceAnalysis.confidenceScore >= 7 ? 'Good' : 
                     analytics.confidenceAnalysis.confidenceScore >= 5 ? 'Average' : 'Needs Work'}
                  </span>
                </div>
                <p className="text-sm text-medium-light mt-2">{analytics.confidenceAnalysis.confidenceFeedback}</p>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="medium-card">
            <h4 className="text-lg font-semibold text-medium-text mb-3">Personalized Recommendations</h4>
            <ul className="space-y-3">
              {generatePersonalizedRecommendations(analytics, rawTranscription || transcription).map((rec, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-medium-green rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-medium-text leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
