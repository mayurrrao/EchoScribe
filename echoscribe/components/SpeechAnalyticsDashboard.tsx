'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface SpeechAnalyticsProps {
  analytics: {
    overallScore: number;
    totalWords: number;
    duration: string;
    wordsPerMinute: number;
    paceAnalysis: {
      paceCategory: string;
      paceScore: number;
      paceRecommendation: string;
    };
    fillerWordAnalysis: {
      totalFillerWords: number;
      fillerWordPercentage: number;
      fillerWordScore: number;
      fillerWordFeedback: string;
      fillerWordCounts: Record<string, number>;
    };
    vocabularyAnalysis: {
      uniqueWords: number;
      vocabularyDiversity: number;
      vocabularyScore: number;
      vocabularyFeedback: string;
      wordComplexityDistribution: Record<string, number>;
    };
    confidenceAnalysis: {
      confidenceScore: number;
      confidenceFeedback: string;
      confidenceWords: number;
      uncertaintyWords: number;
    };
    recommendations: string[];
  };
  historicalData?: Array<{
    date: string;
    overallScore: number;
    paceScore: number;
    fillerWordScore: number;
    vocabularyScore: number;
    confidenceScore: number;
  }>;
}

const SpeechAnalyticsDashboard: React.FC<SpeechAnalyticsProps> = ({ analytics, historicalData = [] }) => {
  const getScoreColor = (score: number) => {
    if (score >= 8) return '#10B981'; // Green
    if (score >= 6) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getScoreGrade = (score: number) => {
    if (score >= 9) return 'A+';
    if (score >= 8) return 'A';
    if (score >= 7) return 'B+';
    if (score >= 6) return 'B';
    if (score >= 5) return 'C+';
    if (score >= 4) return 'C';
    return 'D';
  };

  // Prepare data for charts
  const radarData = [
    { subject: 'Pace', score: analytics.paceAnalysis.paceScore, fullMark: 10 },
    { subject: 'Filler Words', score: analytics.fillerWordAnalysis.fillerWordScore, fullMark: 10 },
    { subject: 'Vocabulary', score: analytics.vocabularyAnalysis.vocabularyScore, fullMark: 10 },
    { subject: 'Confidence', score: analytics.confidenceAnalysis.confidenceScore, fullMark: 10 },
  ];

  const fillerWordData = Object.entries(analytics.fillerWordAnalysis.fillerWordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const vocabularyDistributionData = Object.entries(analytics.vocabularyAnalysis.wordComplexityDistribution)
    .map(([complexity, count]) => ({ complexity, count }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Speech Analytics Dashboard</h1>
          <p className="text-gray-600">Analyze your speaking patterns and improve your communication skills</p>
        </div>

        {/* Overall Score Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Overall Speaking Score</h2>
              <p className="text-gray-600 mt-1">Your comprehensive speaking assessment</p>
            </div>
            <div className="text-center">
              <div 
                className="text-6xl font-bold mb-2"
                style={{ color: getScoreColor(analytics.overallScore) }}
              >
                {analytics.overallScore.toFixed(1)}
              </div>
              <div 
                className="text-2xl font-semibold px-4 py-2 rounded-lg text-white"
                style={{ backgroundColor: getScoreColor(analytics.overallScore) }}
              >
                {getScoreGrade(analytics.overallScore)}
              </div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{analytics.totalWords}</div>
              <div className="text-sm text-gray-600">Total Words</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{analytics.duration}</div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{Math.round(analytics.wordsPerMinute)}</div>
              <div className="text-sm text-gray-600">Words per Minute</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{analytics.vocabularyAnalysis.uniqueWords}</div>
              <div className="text-sm text-gray-600">Unique Words</div>
            </div>
          </div>
        </div>

        {/* Performance Radar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Performance Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 10]} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Historical Progress */}
          {historicalData.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Progress Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="overallScore" stroke="#3B82F6" strokeWidth={2} name="Overall Score" />
                  <Line type="monotone" dataKey="paceScore" stroke="#10B981" strokeWidth={2} name="Pace Score" />
                  <Line type="monotone" dataKey="confidenceScore" stroke="#8B5CF6" strokeWidth={2} name="Confidence Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Detailed Analysis Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pace Analysis */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Speaking Pace</h3>
              <div 
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: getScoreColor(analytics.paceAnalysis.paceScore) }}
              >
                {analytics.paceAnalysis.paceCategory}
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Pace Score</span>
                <span className="text-sm font-medium">{analytics.paceAnalysis.paceScore}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full"
                  style={{ 
                    width: `${(analytics.paceAnalysis.paceScore / 10) * 100}%`,
                    backgroundColor: getScoreColor(analytics.paceAnalysis.paceScore)
                  }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{analytics.paceAnalysis.paceRecommendation}</p>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{Math.round(analytics.wordsPerMinute)}</div>
                <div className="text-sm text-blue-800">Words per Minute</div>
                <div className="text-xs text-gray-600 mt-1">Optimal range: 140-180 WPM</div>
              </div>
            </div>
          </div>

          {/* Confidence Analysis */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Confidence Level</h3>
              <div 
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: getScoreColor(analytics.confidenceAnalysis.confidenceScore) }}
              >
                Score: {analytics.confidenceAnalysis.confidenceScore.toFixed(1)}/10
              </div>
            </div>
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full"
                  style={{ 
                    width: `${(analytics.confidenceAnalysis.confidenceScore / 10) * 100}%`,
                    backgroundColor: getScoreColor(analytics.confidenceAnalysis.confidenceScore)
                  }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{analytics.confidenceAnalysis.confidenceFeedback}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">{analytics.confidenceAnalysis.confidenceWords}</div>
                <div className="text-xs text-green-800">Confidence Words</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-xl font-bold text-red-600">{analytics.confidenceAnalysis.uncertaintyWords}</div>
                <div className="text-xs text-red-800">Uncertainty Words</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filler Words Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Filler Word Analysis</h3>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Filler Word Score</span>
                <span className="text-sm font-medium">{analytics.fillerWordAnalysis.fillerWordScore}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full"
                  style={{ 
                    width: `${(analytics.fillerWordAnalysis.fillerWordScore / 10) * 100}%`,
                    backgroundColor: getScoreColor(analytics.fillerWordAnalysis.fillerWordScore)
                  }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{analytics.fillerWordAnalysis.fillerWordFeedback}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-xl font-bold text-orange-600">{analytics.fillerWordAnalysis.totalFillerWords}</div>
                <div className="text-xs text-orange-800">Total Filler Words</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-xl font-bold text-purple-600">{analytics.fillerWordAnalysis.fillerWordPercentage.toFixed(1)}%</div>
                <div className="text-xs text-purple-800">of Total Words</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Most Used Filler Words</h3>
            {fillerWordData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={fillerWordData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="word" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎉</div>
                  <div>Excellent! No filler words detected.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vocabulary Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Vocabulary Analysis</h3>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Vocabulary Score</span>
                <span className="text-sm font-medium">{analytics.vocabularyAnalysis.vocabularyScore}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full"
                  style={{ 
                    width: `${(analytics.vocabularyAnalysis.vocabularyScore / 10) * 100}%`,
                    backgroundColor: getScoreColor(analytics.vocabularyAnalysis.vocabularyScore)
                  }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{analytics.vocabularyAnalysis.vocabularyFeedback}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <div className="text-xl font-bold text-indigo-600">{analytics.vocabularyAnalysis.uniqueWords}</div>
                <div className="text-xs text-indigo-800">Unique Words</div>
              </div>
              <div className="text-center p-3 bg-teal-50 rounded-lg">
                <div className="text-xl font-bold text-teal-600">{(analytics.vocabularyAnalysis.vocabularyDiversity * 100).toFixed(1)}%</div>
                <div className="text-xs text-teal-800">Vocabulary Diversity</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Word Complexity Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={vocabularyDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ complexity, percent }: any) => `${complexity}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {vocabularyDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🚀 Personalized Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.recommendations.map((recommendation, index) => (
              <div key={index} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-blue-800">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white mt-8">
          <h3 className="text-xl font-semibold mb-4">🎯 Next Steps to Improve</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl mb-2">📝</div>
              <div className="font-medium">Practice Daily</div>
              <div className="text-sm opacity-90">Record 5-minute sessions daily</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📚</div>
              <div className="font-medium">Expand Vocabulary</div>
              <div className="text-sm opacity-90">Learn 3 new words weekly</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎤</div>
              <div className="font-medium">Join Speaking Groups</div>
              <div className="text-sm opacity-90">Practice with others regularly</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechAnalyticsDashboard;
