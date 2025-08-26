import SpeechAnalyticsDashboard from '@/components/SpeechAnalyticsDashboard';

// Mock data for demonstration
const mockAnalytics = {
  overallScore: 7.8,
  totalWords: 245,
  duration: "2:30",
  wordsPerMinute: 156,
  paceAnalysis: {
    paceCategory: "Optimal",
    paceScore: 9,
    paceRecommendation: "Excellent speaking pace! You're in the optimal range for clear communication and audience engagement."
  },
  fillerWordAnalysis: {
    totalFillerWords: 12,
    fillerWordPercentage: 4.9,
    fillerWordScore: 6,
    fillerWordFeedback: "Moderate use of filler words. Consider practicing pauses instead of using fillers.",
    fillerWordCounts: {
      "um": 5,
      "uh": 4,
      "like": 2,
      "you know": 1
    }
  },
  vocabularyAnalysis: {
    uniqueWords: 180,
    vocabularyDiversity: 0.73,
    vocabularyScore: 8,
    vocabularyFeedback: "Good vocabulary usage. You demonstrate variety in your word choice.",
    wordComplexityDistribution: {
      "Simple (1-4 letters)": 89,
      "Medium (5-7 letters)": 64,
      "Complex (8+ letters)": 27
    }
  },
  confidenceAnalysis: {
    confidenceScore: 7.2,
    confidenceFeedback: "Generally confident speaking style with room for improvement in word choice.",
    confidenceWords: 8,
    uncertaintyWords: 5
  },
  recommendations: [
    "🏃‍♂️ Pace: Your speaking pace is excellent! Maintain this optimal range.",
    "🚫 Filler Words: Try replacing 'um' and 'uh' with brief pauses for more professional delivery.",
    "📚 Vocabulary: Great vocabulary diversity! Continue expanding with domain-specific terms.",
    "💪 Confidence: Use more definitive statements. Replace 'I think' with 'I believe' or direct statements.",
    "🎯 Practice Tip: Record yourself daily for 5 minutes to track improvement over time",
    "📖 Study Tip: Read transcripts of great speakers to learn varied vocabulary and sentence structures"
  ]
};

// Mock historical data for progress tracking
const mockHistoricalData = [
  { date: "Jan 1", overallScore: 6.2, paceScore: 7, fillerWordScore: 5, vocabularyScore: 6, confidenceScore: 6 },
  { date: "Jan 8", overallScore: 6.8, paceScore: 8, fillerWordScore: 6, vocabularyScore: 7, confidenceScore: 6.5 },
  { date: "Jan 15", overallScore: 7.1, paceScore: 8, fillerWordScore: 6, vocabularyScore: 7.5, confidenceScore: 7 },
  { date: "Jan 22", overallScore: 7.5, paceScore: 9, fillerWordScore: 6, vocabularyScore: 8, confidenceScore: 7 },
  { date: "Jan 29", overallScore: 7.8, paceScore: 9, fillerWordScore: 6, vocabularyScore: 8, confidenceScore: 7.2 }
];

export default function SpeechAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SpeechAnalyticsDashboard 
        analytics={mockAnalytics} 
        historicalData={mockHistoricalData}
      />
    </div>
  );
}
