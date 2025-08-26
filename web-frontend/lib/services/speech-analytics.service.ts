import { SpeechAnalytics, PaceAnalysis, FillerWordAnalysis, VocabularyAnalysis, ConfidenceAnalysis } from '../types/transcription'

export class SpeechAnalyticsService {
  private readonly OPTIMAL_WPM_MIN = 140
  private readonly OPTIMAL_WPM_MAX = 180
  // Pure filler sounds (always fillers)
  private readonly PURE_FILLER_SOUNDS = [
    'um', 'uh', 'ah', 'er', 'eh', 'hmm', 'mm', 'mhm', 'uhm'
  ]

  // Discourse markers that become fillers when overused or in wrong context
  private readonly DISCOURSE_MARKERS = [
    'well', 'okay', 'right', 'now', 'alright', 'yeah'
  ]

  // Words that become fillers when used excessively or as hesitation
  private readonly HEDGE_WORDS = [
    'basically', 'actually', 'literally', 'totally', 'really'
  ]

  // Context-sensitive patterns for common filler usage
  private readonly FILLER_PATTERNS = [
    // "like" as filler (not comparison)
    { 
      pattern: /\blike\s+(um|uh|ah|er|so|and|i|you|we|they|it|this|that|when|where|what)\b/gi,
      word: 'like',
      description: 'like as hesitation marker'
    },
    // "so" as filler (not conclusion)  
    { 
      pattern: /\b(um|uh|ah|er|like|yeah|well|okay)\s+so\b/gi,
      word: 'so',
      description: 'so after hesitation'
    },
    { 
      pattern: /\bso\s+(um|uh|ah|er|like|yeah)\b/gi,
      word: 'so',
      description: 'so before hesitation'
    },
    // Always filler phrases
    { 
      pattern: /\byou know\b/gi,
      word: 'you know',
      description: 'filler phrase'
    },
    { 
      pattern: /\bi mean\b/gi,
      word: 'i mean',
      description: 'filler phrase'
    },
    { 
      pattern: /\bsort of\b(?!\s+(like|similar|the same))/gi,
      word: 'sort of',
      description: 'sort of not in comparison'
    },
    { 
      pattern: /\bkind of\b(?!\s+(like|similar|the same|person|thing))/gi,
      word: 'kind of',
      description: 'kind of not in comparison'
    },
    // Stalling phrases
    { 
      pattern: /\blet me think\b/gi,
      word: 'let me think',
      description: 'stalling phrase'
    },
    { 
      pattern: /\bhow do i say\b/gi,
      word: 'how do i say',
      description: 'stalling phrase'
    },
    { 
      pattern: /\bwhat do you call it\b/gi,
      word: 'what do you call it',
      description: 'stalling phrase'
    }
  ]
  
  private readonly CONFIDENCE_WORDS = [
    'definitely', 'certainly', 'absolutely', 'clearly', 'obviously',
    'without doubt', 'undoubtedly', 'precisely', 'exactly', 'specifically',
    'conclusively', 'positively', 'unquestionably', 'confident', 'sure',
    'convinced', 'guarantee', 'promise', 'assure', 'affirm'
  ]
  
  private readonly UNCERTAINTY_WORDS = [
    'maybe', 'perhaps', 'possibly', 'might', 'could be', 'i think',
    'i believe', 'i guess', 'probably', 'likely', 'seems like',
    'appears to', 'i suppose', 'presumably', 'apparently', 'unsure',
    'uncertain', 'not sure', 'hard to say', 'difficult to tell'
  ]

  /**
   * Analyze speech from transcription text
   */
  analyzeSpeech(text: string, durationMinutes: number): SpeechAnalytics {
    console.log('Starting speech analysis...')
    
    const words = this.extractWords(text)
    const sentences = this.extractSentences(text)
    const totalWords = words.length
    const wordsPerMinute = durationMinutes > 0 ? totalWords / durationMinutes : 0

    // Perform individual analyses
    const paceAnalysis = this.analyzePace(wordsPerMinute)
    const fillerWordAnalysis = this.analyzeFillerWords(words)
    const vocabularyAnalysis = this.analyzeVocabulary(words)
    const confidenceAnalysis = this.analyzeConfidence(text.toLowerCase())

    // Calculate overall score
    const overallScore = this.calculateOverallScore(
      paceAnalysis,
      fillerWordAnalysis,
      vocabularyAnalysis,
      confidenceAnalysis
    )

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      paceAnalysis,
      fillerWordAnalysis,
      vocabularyAnalysis,
      confidenceAnalysis
    )

    const analytics: SpeechAnalytics = {
      overallScore,
      totalWords,
      wordsPerMinute,
      paceAnalysis,
      fillerWordAnalysis,
      vocabularyAnalysis,
      confidenceAnalysis,
      recommendations
    }

    console.log('Speech analysis completed:', analytics)
    return analytics
  }

  /**
   * Analyze speaking pace
   */
  private analyzePace(wordsPerMinute: number): PaceAnalysis {
    let paceCategory: string
    let paceScore: number
    let paceRecommendation: string

    if (wordsPerMinute >= this.OPTIMAL_WPM_MIN && wordsPerMinute <= this.OPTIMAL_WPM_MAX) {
      paceCategory = 'Optimal'
      paceScore = 10
      paceRecommendation = 'Excellent speaking pace! You maintain an ideal rhythm for audience comprehension.'
    } else if (wordsPerMinute < 100) {
      paceCategory = 'Too Slow'
      paceScore = 4
      paceRecommendation = 'Consider speaking faster to maintain audience engagement and energy.'
    } else if (wordsPerMinute < this.OPTIMAL_WPM_MIN) {
      paceCategory = 'Slow'
      paceScore = 6
      paceRecommendation = 'Try to increase your speaking pace slightly for better flow and engagement.'
    } else if (wordsPerMinute <= 200) {
      paceCategory = 'Fast'
      paceScore = 7
      paceRecommendation = 'Good pace, but consider slowing down slightly for better clarity.'
    } else {
      paceCategory = 'Too Fast'
      paceScore = 4
      paceRecommendation = 'Slow down to ensure your audience can follow and understand your message.'
    }

    return {
      paceCategory,
      paceScore,
      paceRecommendation
    }
  }

  /**
   * Analyze filler words usage with advanced context awareness
   */
  private analyzeFillerWords(words: string[]): FillerWordAnalysis {
    const fillerWordCounts: Record<string, number> = {}
    let totalFillerWords = 0
    const fullText = words.join(' ').toLowerCase()

    console.log('Analyzing filler words in text:', fullText.substring(0, 100) + '...')

    // 1. Count pure filler sounds (always fillers)
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '')
      if (this.PURE_FILLER_SOUNDS.includes(cleanWord)) {
        fillerWordCounts[cleanWord] = (fillerWordCounts[cleanWord] || 0) + 1
        totalFillerWords++
        console.log(`Found pure filler: "${cleanWord}"`)
      }
    })

    // 2. Count discourse markers and hedge words with frequency threshold
    const wordFrequency: Record<string, number> = {}
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '')
      wordFrequency[cleanWord] = (wordFrequency[cleanWord] || 0) + 1
    })

    // Mark discourse markers as fillers if overused (>2 times in short text, >3 in longer)
    const overuseThreshold = words.length > 100 ? 3 : 2
    const potentialFillers = [...this.DISCOURSE_MARKERS, ...this.HEDGE_WORDS]
    potentialFillers.forEach((word: string) => {
      const count = wordFrequency[word] || 0
      if (count > overuseThreshold) {
        // Count excess usage as filler (keep first few as legitimate)
        const fillerCount = count - overuseThreshold
        if (fillerCount > 0) {
          fillerWordCounts[word] = (fillerWordCounts[word] || 0) + fillerCount
          totalFillerWords += fillerCount
          console.log(`Found overused word "${word}": ${fillerCount} filler instances`)
        }
      }
    })

    // 3. Apply context-sensitive pattern matching
    this.FILLER_PATTERNS.forEach(({ pattern, word, description }) => {
      const matches = fullText.match(pattern) || []
      if (matches.length > 0) {
        fillerWordCounts[word] = (fillerWordCounts[word] || 0) + matches.length
        totalFillerWords += matches.length
        console.log(`Found contextual filler "${word}" (${description}): ${matches.length} times`)
        console.log('Matches:', matches)
      }
    })

    const fillerWordPercentage = words.length > 0 ? (totalFillerWords / words.length) * 100 : 0

    let fillerWordScore: number
    let fillerWordFeedback: string

    if (fillerWordPercentage < 1) {
      fillerWordScore = 10
      fillerWordFeedback = 'Excellent! You maintain very clean speech with minimal filler words.'
    } else if (fillerWordPercentage < 2) {
      fillerWordScore = 8
      fillerWordFeedback = 'Great job keeping filler words to a minimum.'
    } else if (fillerWordPercentage < 4) {
      fillerWordScore = 6
      fillerWordFeedback = 'Good control, but try to reduce filler words for more professional delivery.'
    } else if (fillerWordPercentage < 7) {
      fillerWordScore = 4
      fillerWordFeedback = 'Practice pausing instead of using filler words to improve clarity.'
    } else {
      fillerWordScore = 2
      fillerWordFeedback = 'Focus on reducing filler words significantly. Practice speaking more slowly and deliberately.'
    }

    console.log(`Filler word analysis complete: ${totalFillerWords} fillers (${fillerWordPercentage.toFixed(1)}%)`)

    return {
      totalFillerWords,
      fillerWordPercentage,
      fillerWordScore,
      fillerWordFeedback,
      fillerWordCounts
    }
  }

  /**
   * Analyze vocabulary diversity and complexity
   */
  private analyzeVocabulary(words: string[]): VocabularyAnalysis {
    const cleanWords = words.map(w => w.toLowerCase().replace(/[^\w]/g, '')).filter(w => w.length > 0)
    const uniqueWords = new Set(cleanWords).size
    const vocabularyDiversity = cleanWords.length > 0 ? uniqueWords / cleanWords.length : 0

    // Analyze word complexity distribution
    const wordComplexityDistribution = this.analyzeWordComplexity(cleanWords)

    let vocabularyScore: number
    let vocabularyFeedback: string

    if (vocabularyDiversity > 0.7) {
      vocabularyScore = 10
      vocabularyFeedback = 'Outstanding vocabulary diversity! You use a rich variety of words.'
    } else if (vocabularyDiversity > 0.5) {
      vocabularyScore = 8
      vocabularyFeedback = 'Good vocabulary diversity. Your word choice keeps the content engaging.'
    } else if (vocabularyDiversity > 0.35) {
      vocabularyScore = 6
      vocabularyFeedback = 'Decent vocabulary, but try to vary your word choices more for better engagement.'
    } else if (vocabularyDiversity > 0.2) {
      vocabularyScore = 4
      vocabularyFeedback = 'Limited vocabulary diversity. Practice using more varied expressions and synonyms.'
    } else {
      vocabularyScore = 2
      vocabularyFeedback = 'Very repetitive vocabulary. Focus on expanding your word choices and expressions.'
    }

    return {
      uniqueWords,
      vocabularyDiversity,
      vocabularyScore,
      vocabularyFeedback,
      wordComplexityDistribution
    }
  }

  /**
   * Analyze confidence in speech with improved pattern matching
   */
  private analyzeConfidence(textLower: string): ConfidenceAnalysis {
    let confidenceWords = 0
    let uncertaintyWords = 0

    console.log('Analyzing confidence in text:', textLower.substring(0, 100) + '...')

    // Count confidence indicators with word boundaries
    this.CONFIDENCE_WORDS.forEach(word => {
      const regex = new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`, 'gi')
      const matches = (textLower.match(regex) || []).length
      if (matches > 0) {
        console.log(`Found confidence word "${word}": ${matches} times`)
      }
      confidenceWords += matches
    })

    // Count uncertainty indicators with word boundaries
    this.UNCERTAINTY_WORDS.forEach(word => {
      const regex = new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`, 'gi')
      const matches = (textLower.match(regex) || []).length
      if (matches > 0) {
        console.log(`Found uncertainty word "${word}": ${matches} times`)
      }
      uncertaintyWords += matches
    })

    console.log(`Total confidence indicators: ${confidenceWords}, uncertainty indicators: ${uncertaintyWords}`)

    // Calculate confidence score with improved algorithm
    const totalWords = textLower.split(/\s+/).length
    const confidenceRatio = confidenceWords / Math.max(totalWords / 100, 1) // Per 100 words
    const uncertaintyRatio = uncertaintyWords / Math.max(totalWords / 100, 1) // Per 100 words
    
    // Base score starts at 6 (neutral-positive)
    let confidenceScore = 6
    
    // Add points for confidence words (up to +3)
    confidenceScore += Math.min(confidenceRatio * 2, 3)
    
    // Subtract points for uncertainty words (up to -4)
    confidenceScore -= Math.min(uncertaintyRatio * 2, 4)
    
    // Clamp to 1-10 range
    confidenceScore = Math.max(1, Math.min(10, Math.round(confidenceScore)))

    let confidenceFeedback: string
    if (confidenceScore >= 9) {
      confidenceFeedback = 'You speak with exceptional confidence and authority!'
    } else if (confidenceScore >= 7) {
      confidenceFeedback = 'Good confidence level. Your assertions are clear and strong.'
    } else if (confidenceScore >= 5) {
      confidenceFeedback = 'Moderate confidence. Consider using more definitive language.'
    } else if (confidenceScore >= 3) {
      confidenceFeedback = 'Work on speaking more confidently. Reduce uncertain language.'
    } else {
      confidenceFeedback = 'Focus on building confidence. Use stronger, more assertive statements.'
    }

    console.log(`Final confidence score: ${confidenceScore}/10`)

    return {
      confidenceScore,
      confidenceFeedback,
      confidenceWords,
      uncertaintyWords
    }
  }

  /**
   * Calculate overall speaking score
   */
  private calculateOverallScore(
    pace: PaceAnalysis,
    fillers: FillerWordAnalysis,
    vocabulary: VocabularyAnalysis,
    confidence: ConfidenceAnalysis
  ): number {
    const weights = {
      pace: 0.25,
      fillers: 0.30,
      vocabulary: 0.25,
      confidence: 0.20
    }

    const weightedScore = 
      (pace.paceScore * weights.pace) +
      (fillers.fillerWordScore * weights.fillers) +
      (vocabulary.vocabularyScore * weights.vocabulary) +
      (confidence.confidenceScore * weights.confidence)

    return Math.round(weightedScore * 10) / 10
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    pace: PaceAnalysis,
    fillers: FillerWordAnalysis,
    vocabulary: VocabularyAnalysis,
    confidence: ConfidenceAnalysis
  ): string[] {
    const recommendations: string[] = []

    // Pace recommendations
    if (pace.paceScore < 7) {
      recommendations.push(`🏃‍♂️ Pace Improvement: ${pace.paceRecommendation}`)
    }

    // Filler word recommendations
    if (fillers.fillerWordScore < 7) {
      const topFillers = Object.entries(fillers.fillerWordCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([word]) => word)
      
      if (topFillers.length > 0) {
        recommendations.push(`🚫 Reduce Filler Words: Focus on eliminating "${topFillers.join('", "')}" from your speech`)
      }
    }

    // Vocabulary recommendations
    if (vocabulary.vocabularyScore < 7) {
      recommendations.push(`📚 Expand Vocabulary: ${vocabulary.vocabularyFeedback}`)
    }

    // Confidence recommendations
    if (confidence.confidenceScore < 7) {
      recommendations.push(`💪 Boost Confidence: ${confidence.confidenceFeedback}`)
    }

    // General recommendations
    recommendations.push('🎯 Practice Regularly: Record yourself speaking daily to track improvement')
    recommendations.push('📖 Study Great Speakers: Watch TED talks and note speaking techniques')
    
    if (recommendations.filter(r => r.includes('🏃‍♂️') || r.includes('🚫')).length === 0) {
      recommendations.push('🌟 Keep it Up: Your speaking skills are developing well!')
    }

    return recommendations
  }

  /**
   * Analyze word complexity distribution
   */
  private analyzeWordComplexity(words: string[]): Record<string, number> {
    const distribution = {
      'Simple (1-4 letters)': 0,
      'Medium (5-7 letters)': 0,
      'Complex (8+ letters)': 0
    }

    words.forEach(word => {
      if (word.length <= 4) {
        distribution['Simple (1-4 letters)']++
      } else if (word.length <= 7) {
        distribution['Medium (5-7 letters)']++
      } else {
        distribution['Complex (8+ letters)']++
      }
    })

    return distribution
  }

  /**
   * Extract words from text
   */
  private extractWords(text: string): string[] {
    return text.split(/\s+/).filter(word => word.length > 0)
  }

  /**
   * Extract sentences from text
   */
  private extractSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0)
  }
}
