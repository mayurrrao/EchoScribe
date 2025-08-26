// Transcription Configuration Types
export interface TranscriptionConfig {
  language?: string
  includeTimestamps?: boolean
  removeFillerWords?: boolean
  chunkDuration?: number
  maxRetries?: number
}

// Transcription Result Types
export interface TranscriptionResult {
  text: string
  confidence?: number
  duration?: number
  segments?: TranscriptionSegment[]
  wordCount: number
  originalFileName: string
  processedAt: Date
}

export interface TranscriptionSegment {
  text: string
  startTime: number
  endTime: number
  confidence?: number
}

// Speech Analytics Types
export interface SpeechAnalytics {
  overallScore: number
  totalWords: number
  wordsPerMinute: number
  paceAnalysis: PaceAnalysis
  fillerWordAnalysis: FillerWordAnalysis
  vocabularyAnalysis: VocabularyAnalysis
  confidenceAnalysis: ConfidenceAnalysis
  recommendations: string[]
}

export interface PaceAnalysis {
  paceCategory: string
  paceScore: number
  paceRecommendation: string
}

export interface FillerWordAnalysis {
  totalFillerWords: number
  fillerWordPercentage: number
  fillerWordScore: number
  fillerWordFeedback: string
  fillerWordCounts: Record<string, number>
}

export interface VocabularyAnalysis {
  uniqueWords: number
  vocabularyDiversity: number
  vocabularyScore: number
  vocabularyFeedback: string
  wordComplexityDistribution: Record<string, number>
}

export interface ConfidenceAnalysis {
  confidenceScore: number
  confidenceFeedback: string
  confidenceWords: number
  uncertaintyWords: number
}

// API Response Types
export interface TranscriptionApiResponse {
  success: boolean
  transcription: string
  rawTranscription?: string // Original transcription before filtering
  fileName: string
  duration?: number
  analytics?: SpeechAnalytics
  fillerWordsRemoved?: boolean // Flag to indicate if filtering was applied
  error?: string
}

// File Processing Types
export interface ProcessingProgress {
  stage: 'uploading' | 'processing' | 'transcribing' | 'analyzing' | 'completed'
  progress: number
  message?: string
}
