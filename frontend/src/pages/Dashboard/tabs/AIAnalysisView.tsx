import React from 'react';
import {
  ArrowLeftIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  HashtagIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { AIAnalysisData, optimizePost } from '../../../services/postAnalyzer.service';
import { Zap } from 'lucide-react';

interface AIAnalysisViewProps {
  analysisData: AIAnalysisData;
  postContent: string;
  onBack: () => void;
}

export const AIAnalysisView: React.FC<AIAnalysisViewProps> = ({
  analysisData,
  postContent,
  onBack
}) => {
  const [copySuccess, setCopySuccess] = React.useState(false);
  const [optimizedPost, setOptimizedPost] = React.useState<string | null>(null);
  const [improvementsMade, setImprovementsMade] = React.useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [optimizeError, setOptimizeError] = React.useState<string | null>(null);
  const [isCached, setIsCached] = React.useState(false);

  // Debug: Log the analysis data to see what we're receiving
  React.useEffect(() => {
    console.log('AI Analysis Data:', analysisData);
    console.log('Has keywords?', !!analysisData.keywords);
    console.log('Has virality_score?', analysisData.virality_score !== undefined);
  }, [analysisData]);

  const getScoreColor = (score: string) => {
    const lowerScore = score.toLowerCase();
    if (lowerScore.includes('excellent')) return 'text-green-600 bg-green-100';
    if (lowerScore.includes('good')) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreBarWidth = (score: string) => {
    const lowerScore = score.toLowerCase();
    if (lowerScore.includes('excellent')) return '90%';
    if (lowerScore.includes('good')) return '70%';
    if (lowerScore.includes('fair')) return '50%';
    return '30%';
  };

  const getScoreBarColor = (score: string) => {
    const lowerScore = score.toLowerCase();
    if (lowerScore.includes('excellent')) return 'bg-green-500';
    if (lowerScore.includes('good')) return 'bg-yellow-500';
    return 'bg-red-500';
  };


  const handleCopyOptimizedPost = async () => {
    try {
      // Create a comprehensive optimized post suggestion
      const optimizedSuggestion = `Based on AI Analysis - Optimized LinkedIn Post

${postContent}

---
Priority Actions:
${analysisData.priority_actions.map((action, i) => `${i + 1}. ${action}`).join('\n')}

Key Improvements:
- Structure Score: ${analysisData.structure.structure_score}
- Hashtags: ${analysisData.hashtags.hashtag_count} found (${analysisData.hashtags.relevance_score} relevance)
- Engagement Potential: ${analysisData.analytics.engagement_potential}
`;

      await navigator.clipboard.writeText(optimizedSuggestion);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleOptimizePost = async () => {
    setIsOptimizing(true);
    setOptimizeError(null);
    setIsCached(false);

    try {
      // Generate a consistent post_id based on content hash
      const postId = `:${Math.abs(postContent.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0))}`;

      const result = await optimizePost(
        postContent,
        analysisData,
        postId  // Use consistent hash-based ID for caching
      );

      setOptimizedPost(result.optimized_post);
      setImprovementsMade(result.improvements_made);

      // Check if response was from cache
      if (result.cached) {
        setIsCached(true);
        console.log('✓ Loaded optimized post from cache');
      } else {
        setIsCached(false);
        console.log('✓ Generated new optimized post');
      }
    } catch (error: any) {
      console.error('Optimization error:', error);
      setOptimizeError(error.message || 'Failed to optimize post');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopyOptimized = async () => {
    if (!optimizedPost) return;

    try {
      await navigator.clipboard.writeText(optimizedPost);
      // You could add a success toast here
    } catch (err) {
      console.error('Failed to copy optimized post:', err);
    }
  };

  const handleCopyPost = async () => {
    try {
      await navigator.clipboard.writeText(postContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy post:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="font-medium">Back to Post Analysis</span>
        </button>
      </div>

      {/* AI Analysis Header */}
      <div className="bg-gradient-to-r from-[#ff6700] to-[#0d569e] rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <SparklesIcon className="w-8 h-8" />
          <h2 className="text-2xl font-bold">AI Post Analysis</h2>
        </div>
        <p className="text-purple-100">
          Comprehensive analysis of your LinkedIn post with actionable insights and recommendations
        </p>
      </div>

      {/* Overall Score */}
      {/* <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Overall Post Score</h3>
          <div className={`px-4 py-2 rounded-lg font-bold text-xl ${getScoreColor(analysisData.overall_score)}`}>
            {analysisData.overall_score}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${getScoreBarColor(analysisData.overall_score)}`}
            style={{ width: getScoreBarWidth(analysisData.overall_score) }}
          ></div>
        </div>
      </div> */}



      {/* Virality Score (Half Donut) and Tone of Voice (Full Donut) - Side by Side */}
      {analysisData.virality_score !== undefined && analysisData.keywords && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Speedometer Gauge - Virality Score */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-bold">Post Virality Score</h2>
                <p className="text-sm text-[#847E8B]">Analyze the potential reach and engagement</p>
              </div>

              <div className="relative mx-auto h-[11rem] w-full">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 348 176"
                  style={{ maxWidth: '348px', maxHeight: '176px', margin: '0 auto' }}
                >
                  <g transform="translate(174, 104.6)">
                    {/* Create 8 segments in a semicircle */}
                    {(() => {
                      const segments = 10;
                      const gapAngle = 3; // Gap between segments in degrees
                      const totalGapAngle = gapAngle * (segments - 1);
                      const segmentAngle = (180 - totalGapAngle) / segments;
                      const outerRadius = 90;
                      const innerRadius = 60;
                      const percentage = analysisData.virality_score / 100;
                      const activeSegments = Math.ceil(percentage * segments);

                      const createSegment = (index: number) => {
                        // Draw from 180° (left) to 0° (right) in the UPPER semicircle
                        // This means angles go from 180° down to 0° (counterclockwise in upper half)
                        const startAngle = 180 + (index * (segmentAngle + gapAngle));
                        const endAngle = startAngle + segmentAngle;

                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = (endAngle * Math.PI) / 180;

                        const x1 = outerRadius * Math.cos(startRad);
                        const y1 = outerRadius * Math.sin(startRad);
                        const x2 = outerRadius * Math.cos(endRad);
                        const y2 = outerRadius * Math.sin(endRad);
                        const x3 = innerRadius * Math.cos(endRad);
                        const y3 = innerRadius * Math.sin(endRad);
                        const x4 = innerRadius * Math.cos(startRad);
                        const y4 = innerRadius * Math.sin(startRad);

                        const isActive = index < activeSegments;
                        const color = isActive ? '#00BCD4' : '#E0E0E0';

                        return (
                          <path
                            key={index}
                            d={`M ${x1},${y1} A ${outerRadius},${outerRadius},0,0,1,${x2},${y2} L ${x3},${y3} A ${innerRadius},${innerRadius},0,0,0,${x4},${y4} Z`}
                            fill={color}
                            stroke="#fff"
                            strokeWidth="2"
                          />
                        );
                      };

                      return Array.from({ length: segments }, (_, i) => createSegment(i));
                    })()}

                    {/* Indicator needle/arrow */}
                    {(() => {
                      const percentage = analysisData.virality_score / 100;
                      // Needle goes from 180° (0%) to 360°/0° (100%) in upper semicircle
                      const angle = 180 + (180 * percentage);
                      const angleRad = (angle * Math.PI) / 180;
                      const needleLength = 55;

                      const needleX = needleLength * Math.cos(angleRad);
                      const needleY = needleLength * Math.sin(angleRad);

                      // Triangle arrow pointing outward
                      const arrowSize = 8;
                      const perpAngle = angleRad + Math.PI / 2;

                      const tipX = needleX;
                      const tipY = needleY;
                      const base1X = -arrowSize * Math.cos(perpAngle);
                      const base1Y = -arrowSize * Math.sin(perpAngle);
                      const base2X = arrowSize * Math.cos(perpAngle);
                      const base2Y = arrowSize * Math.sin(perpAngle);

                      return (
                        <g>
                          {/* Needle line */}
                          <line
                            x1="0"
                            y1="0"
                            x2={needleX}
                            y2={needleY}
                            stroke="#D32F2F"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          {/* Arrow head */}
                          <polygon
                            points={`${tipX},${tipY} ${base1X},${base1Y} ${base2X},${base2Y}`}
                            fill="#D32F2F"
                          />
                          {/* Center circle */}
                          <circle
                            cx="0"
                            cy="0"
                            r="5"
                            fill="#D32F2F"
                            stroke="#fff"
                            strokeWidth="2"
                          />
                        </g>
                      );
                    })()}
                  </g>
                </svg>

                {/* Center text overlay */}
                <div className="absolute top-[6.7rem] left-1/2 -translate-x-1/2 flex flex-col gap-2 text-center justify-center">
                  <span className="text-3xl font-semibold" style={{ color: '#D32F2F' }}>
                    {analysisData.virality_score}%
                  </span>
                  <div
                    className="inline-flex items-center border my-0 px-2.5 py-0.5 text-xs font-semibold rounded-full w-fit mx-auto space-x-1"
                    style={{
                      color: '#00BCD4',
                      backgroundColor: 'rgba(0, 188, 212, 0.1)',
                      borderColor: 'transparent'
                    }}
                  >
                    <span>🌟</span>
                    <span className="text-lg font-bold">
                      {analysisData.virality_score >= 80 ? 'Excellent' :
                        analysisData.virality_score >= 60 ? 'Good' :
                          analysisData.virality_score >= 40 ? 'Fair' : 'Needs Work'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-center">
                <span className="font-bold">Explanation: </span>
                <span className="text-[#847E8B]">
                  The content effectively highlights an important event and the involvement of industry leaders, which is valuable for professional networks on LinkedIn.
                  The use of relevant hashtags and keywords is appropriate, but the content could be more engaging with direct calls to action or questions to the audience.
                </span>
              </div>
            </div>
          </div>

          {/* Full Donut Chart - Tone of Voice */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-lg font-bold">Tone of Voice</h2>
                <p className="text-sm text-[#847E8B]">Analyze the emotions and tone of voice</p>
              </div>

              <div className="relative mx-auto h-[180px] w-[180px]">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 180 180"
                >
                  <defs>
                    <clipPath id="recharts-tone-clip">
                      <rect x="5" y="5" height="170" width="170"></rect>
                    </clipPath>
                  </defs>
                  <g className="recharts-layer recharts-pie">
                    {(() => {
                      const cx = 90;
                      const cy = 90;
                      const outerRadius = 90;
                      const innerRadius = 50;

                      const friendly = analysisData.keywords.tone_analysis.friendly_score;
                      const persuasive = analysisData.keywords.tone_analysis.persuasive_score;
                      const formal = analysisData.keywords.tone_analysis.formal_score;
                      const total = friendly + persuasive + formal;

                      const friendlyPercent = friendly / total;
                      const persuasivePercent = persuasive / total;
                      const formalPercent = formal / total;

                      let currentAngle = 0;

                      const createArc = (startAngle: number, percentage: number, color: string) => {
                        const angle = percentage * 360;
                        const endAngle = startAngle + angle;

                        const startAngleRad = (startAngle - 90) * Math.PI / 180;
                        const endAngleRad = (endAngle - 90) * Math.PI / 180;

                        const x1 = cx + outerRadius * Math.cos(startAngleRad);
                        const y1 = cy + outerRadius * Math.sin(startAngleRad);
                        const x2 = cx + outerRadius * Math.cos(endAngleRad);
                        const y2 = cy + outerRadius * Math.sin(endAngleRad);
                        const x3 = cx + innerRadius * Math.cos(endAngleRad);
                        const y3 = cy + innerRadius * Math.sin(endAngleRad);
                        const x4 = cx + innerRadius * Math.cos(startAngleRad);
                        const y4 = cy + innerRadius * Math.sin(startAngleRad);

                        const largeArcFlag = angle > 180 ? 1 : 0;

                        return (
                          <path
                            key={color}
                            d={`M ${x1},${y1} A ${outerRadius},${outerRadius},0,${largeArcFlag},1,${x2},${y2} L ${x3},${y3} A ${innerRadius},${innerRadius},0,${largeArcFlag},0,${x4},${y4} Z`}
                            fill={color}
                            stroke="#fff"
                            strokeWidth="2"
                          />
                        );
                      };

                      const arcs = [];
                      arcs.push(createArc(currentAngle, friendlyPercent, '#344BFD'));
                      currentAngle += friendlyPercent * 360;
                      arcs.push(createArc(currentAngle, persuasivePercent, '#F4A79D'));
                      currentAngle += persuasivePercent * 360;
                      arcs.push(createArc(currentAngle, formalPercent, '#F68D2B'));

                      return arcs;
                    })()}
                  </g>
                </svg>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#344BFD' }}></span>
                    <span className="text-sm" style={{ color: '#344BFD' }}>Friendly</span>
                  </div>
                  <span className="text-sm">{analysisData.keywords.tone_analysis.friendly_score}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#F4A79D' }}></span>
                    <span className="text-sm" style={{ color: '#F4A79D' }}>Persuasive</span>
                  </div>
                  <span className="text-sm">{analysisData.keywords.tone_analysis.persuasive_score}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#F68D2B' }}></span>
                    <span className="text-sm" style={{ color: '#F68D2B' }}>Formal</span>
                  </div>
                  <span className="text-sm">{analysisData.keywords.tone_analysis.formal_score}%</span>
                </div>
              </div>

              <div className="text-sm text-center">
                <span className="font-bold">Tone Suggestion: </span>
                <span className="text-[#847E8B]">
                  {analysisData.keywords.tone_analysis.tone_recommendation}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* create here the full donut tone of voice */}

      {/* Priority Actions */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
        <div className="flex items-start space-x-3">
          <LightBulbIcon className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Priority Actions</h3>
            <ul className="space-y-2">
              {analysisData.priority_actions.map((action, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Structure Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <DocumentTextIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Structure Analysis</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Hook Length</p>
            <p className="text-lg font-bold text-gray-900">{analysisData.structure.hook_length} chars</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Content Length</p>
            <p className="text-lg font-bold text-gray-900">{analysisData.structure.main_content_length} chars</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Structure Score</p>
            <p className="text-lg font-bold text-blue-600">{analysisData.structure.structure_score}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className={`w-5 h-5 ${analysisData.structure.has_cta ? 'text-green-500' : 'text-gray-300'}`} />
            <span className="text-sm text-gray-700">Has Call-to-Action</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className={`w-5 h-5 ${analysisData.structure.has_wrap_up ? 'text-green-500' : 'text-gray-300'}`} />
            <span className="text-sm text-gray-700">Has Wrap-up</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className={`w-5 h-5 ${analysisData.structure.rehook_present ? 'text-green-500' : 'text-gray-300'}`} />
            <span className="text-sm text-gray-700">Re-hook Present</span>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Hook Quality</h4>
          <p className="text-sm text-gray-700">{analysisData.structure.hook_quality}</p>
        </div>
        {analysisData.structure.recommendations.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
            <ul className="space-y-2">
              {analysisData.structure.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                  <span className="text-sm text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Hashtag Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <HashtagIcon className="w-6 h-6 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Hashtag Analysis</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Count</p>
            <p className="text-lg font-bold text-gray-900">{analysisData.hashtags.hashtag_count}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Relevance</p>
            <p className="text-sm font-bold text-indigo-600">{analysisData.hashtags.relevance_score}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Spam Risk</p>
            <p className="text-sm font-bold text-gray-900">{analysisData.hashtags.spam_risk}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Placement</p>
            <p className="text-sm font-bold text-gray-900">{analysisData.hashtags.placement_quality}</p>
          </div>
        </div>
        {analysisData.hashtags.hashtags_found.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Current Hashtags</h4>
            <div className="flex flex-wrap gap-2">
              {analysisData.hashtags.hashtags_found.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className={`w-5 h-5 ${analysisData.hashtags.has_broad_hashtags ? 'text-green-500' : 'text-gray-300'}`} />
            <span className="text-sm text-gray-700">Broad Hashtags</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className={`w-5 h-5 ${analysisData.hashtags.has_niche_hashtags ? 'text-green-500' : 'text-gray-300'}`} />
            <span className="text-sm text-gray-700">Niche Hashtags</span>
          </div>
        </div>
        {analysisData.hashtags.recommendations.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
            <ul className="space-y-2">
              {analysisData.hashtags.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-1" />
                  <span className="text-sm text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Engagement Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ChartBarIcon className="w-6 h-6 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">Engagement Analysis</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-emerald-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-1">Engagement Potential</h4>
            <p className="text-lg font-bold text-emerald-600">{analysisData.analytics.engagement_potential}</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-1">Sentiment</h4>
            <p className="text-lg font-bold text-emerald-600">{analysisData.analytics.overall_sentiment}</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-1">Expected Impressions</h4>
            <p className="text-sm text-gray-700">{analysisData.analytics.expected_impressions}</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-1">Expected Engagement Rate</h4>
            <p className="text-sm text-gray-700">{analysisData.analytics.expected_engagement_rate}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysisData.analytics.strengths.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {analysisData.analytics.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-gray-700">• {strength}</li>
                ))}
              </ul>
            </div>
          )}
          {analysisData.analytics.weaknesses.length > 0 && (
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                Weaknesses
              </h4>
              <ul className="space-y-1">
                {analysisData.analytics.weaknesses.map((weakness, index) => (
                  <li key={index} className="text-sm text-gray-700">• {weakness}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {analysisData.analytics.improvement_suggestions.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Improvement Suggestions</h4>
            <ul className="space-y-2">
              {analysisData.analytics.improvement_suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <LightBulbIcon className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-1" />
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Tagging Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <UserGroupIcon className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Tagging Analysis</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Tags Found</p>
            <p className="text-lg font-bold text-gray-900">{analysisData.tagging.tag_count}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Quality</p>
            <p className="text-sm font-bold text-purple-600">{analysisData.tagging.tagging_quality}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Spam Risk</p>
            <p className="text-sm font-bold text-gray-900">{analysisData.tagging.spam_risk}</p>
          </div>
        </div>
        {analysisData.tagging.tags_found.length > 0 && (
          <div className="mb-4 p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Tags Found</h4>
            <ul className="space-y-1">
              {analysisData.tagging.tags_found.map((tag, index) => (
                <li key={index} className="text-sm text-gray-700">• {tag}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex items-center space-x-2 mb-4">
          <CheckCircleIcon className={`w-5 h-5 ${analysisData.tagging.has_context ? 'text-green-500' : 'text-gray-300'}`} />
          <span className="text-sm text-gray-700">Has Context for Tags</span>
        </div>
        {analysisData.tagging.recommendations.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
            <ul className="space-y-2">
              {analysisData.tagging.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-purple-600 flex-shrink-0 mt-1" />
                  <span className="text-sm text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Keyword Optimization - Only show if keywords data exists */}
      {analysisData.keywords && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <SparklesIcon className="w-6 h-6 text-pink-600" />
              <h3 className="text-lg font-semibold text-gray-900">Keyword Optimization</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-pink-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">SEO Score</p>
                <p className="text-lg font-bold text-pink-600">{analysisData.keywords.seo_score}</p>
              </div>
              <div className="p-3 bg-pink-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Keyword Relevance</p>
                <p className="text-lg font-bold text-pink-600">{analysisData.keywords.keyword_relevance}</p>
              </div>
              <div className="p-3 bg-pink-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Placement Quality</p>
                <p className="text-sm font-bold text-gray-900">{analysisData.keywords.keyword_placement_quality}</p>
              </div>
            </div>
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Search Visibility Score</h4>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-pink-500 transition-all duration-500"
                  style={{ width: `${analysisData.keywords.search_visibility_score}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">{analysisData.keywords.search_visibility_score}/100</p>
            </div>
            {analysisData.keywords.primary_keywords.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Primary Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisData.keywords.primary_keywords.map((keyword, index) => (
                    <span key={index} className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {analysisData.keywords.trending_keywords.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Trending Keywords ({analysisData.keywords.trending_keyword_count})</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisData.keywords.trending_keywords.map((keyword, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      🔥 {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {analysisData.keywords.missing_keywords.length > 0 && (
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Missing Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisData.keywords.missing_keywords.map((keyword, index) => (
                    <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {analysisData.keywords.recommendations.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {analysisData.keywords.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <ExclamationTriangleIcon className="w-4 h-4 text-pink-600 flex-shrink-0 mt-1" />
                      <span className="text-sm text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Tone Analysis */}
          {/* <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ChartBarIcon className="w-6 h-6 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">Tone Analysis</h3>
            </div>
            <div className="space-y-4 mb-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Friendly Score</span>
                  <span className="text-sm font-bold text-teal-600">{analysisData.keywords.tone_analysis.friendly_score}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-teal-500 transition-all duration-500"
                    style={{ width: `${analysisData.keywords.tone_analysis.friendly_score}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Persuasive Score</span>
                  <span className="text-sm font-bold text-purple-600">{analysisData.keywords.tone_analysis.persuasive_score}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${analysisData.keywords.tone_analysis.persuasive_score}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Formal Score</span>
                  <span className="text-sm font-bold text-blue-600">{analysisData.keywords.tone_analysis.formal_score}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${analysisData.keywords.tone_analysis.formal_score}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-teal-50 rounded-lg mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Tone Recommendation</h4>
              <p className="text-sm text-gray-700">{analysisData.keywords.tone_analysis.tone_recommendation}</p>
            </div>
            {analysisData.keywords.tone_analysis.needs_simplification && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start space-x-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Simplification Needed</h4>
                    <p className="text-sm text-gray-700 mt-1">Your content may be too complex. Consider simplifying language for better engagement.</p>
                  </div>
                </div>
              </div>
            )}
          </div> */}
        </>
      )}

      {/* Copy Analysis Button */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
        <div className="flex items-start space-x-3">
          <SparklesIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Export Analysis</h3>
            <p className="text-sm text-gray-600 mb-4">
              Copy this analysis along with priority actions to improve your post
            </p>
            <button
              onClick={handleCopyOptimizedPost}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-2"
            >
              {copySuccess ? (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <span>Copy Analysis Summary</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Original Post Reference */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Original Post</h3>
          <button
            onClick={handleCopyPost}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Copy Post
          </button>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{postContent}</p>
        </div>
      </div>

      {/* Optimize with AI Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-green-100 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Optimize?</h3>
            <p className="text-gray-600">Get AI-generated improvements based on your post analysis</p>
          </div>
          <button
            onClick={handleOptimizePost}
            disabled={isOptimizing || optimizedPost !== null}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isOptimizing ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Optimizing...
              </>
            ) : optimizedPost ? (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                Optimized
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Optimize with AI
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {optimizeError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{optimizeError}</p>
          </div>
        )}

        {/* Optimized Post Display */}
        {optimizedPost && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Original Post */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Original Post</h4>
                  <button
                    onClick={handleCopyPost}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{postContent}</p>
                </div>
              </div>

              {/* Optimized Post */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">Optimized Post</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isCached ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {isCached ? '⚡ Cached' : '✨ AI Enhanced'}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyOptimized}
                    className="text-xs text-green-700 hover:text-green-800 font-medium px-3 py-1 border border-green-300 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-white rounded-lg p-4 max-h-96 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{optimizedPost}</p>
                </div>
              </div>
            </div>

            {/* Improvements Made */}
            {improvementsMade.length > 0 && (
              <div className="bg-white rounded-xl border border-green-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <LightBulbIcon className="w-5 h-5 text-green-600" />
                  Improvements Applied
                </h4>
                <ul className="space-y-2">
                  {improvementsMade.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
