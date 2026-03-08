import { AlertCircle, ArrowLeft, Check, ChevronDown, FileText, Image, Link2, Loader2, MessageSquare, Plus, Smile, Sparkles, TrendingUp, X, Bold, Italic, Underline, Type, Palette, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, BarChart3, ThumbsUp, ImagePlus, Quote, Film, Copy, Download, GitCompareIcon } from 'lucide-react';
import AIChatInterface from '@/components/AIChatInterface';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { AIAnalysisView } from '../tabs/AIAnalysisView';
import { analyzePost, AIAnalysisData } from '../../../services/postAnalyzer.service';
import LinkedInViralityAnalyzer from '../tabs/ViralpostAnalysis';
import { draftService } from '../../../services/draftService';
import api from '../../../services/api';

interface LinkedInPostEditorProps {
  editPostData?: {
    content: string;
    media_files?: any[];
    id?: string;
  } | null;
}

const LinkedInPostEditor: React.FC<LinkedInPostEditorProps> = ({ editPostData }) => {
  const [showAIWriter, setShowAIWriter] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [hasError, setHasError] = useState(false);
  const maxChars = 3000;
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  // AI Writer States
  type GeneratedPost = {
    hook: string;
    main_content: string;
    cta: string;
    hashtags: string[];
    final_post: string;
    engagement_score: string;
    algorithm_compliance: string;
    improvement_suggestions: string[];
  };

  const [isGenerating, setIsGenerating] = useState(false);
  // Keep the state but don't show warning
  const [, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [topic, setTopic] = useState('');
  
  const [context, setContext] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tonePreference, setTonePreference] = useState('professional');
  const [includeStory, setIncludeStory] = useState(false);
  const [postStyle, setPostStyle] = useState('insight');
  const [showConfig, setShowConfig] = useState(false);

  // Viral post selection states
  const [selectedViralPost, setSelectedViralPost] = useState<any>(null);
  const [showViralPostsModal, setShowViralPostsModal] = useState(false);
  const [viralPosts, setViralPosts] = useState<any[]>([]);
  const [isLoadingViralPosts, setIsLoadingViralPosts] = useState(false);

  // Rich editor states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);

  // Quote Image Creator states
  const [showQuoteImageModal, setShowQuoteImageModal] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [authorText, setAuthorText] = useState('');
  const [titleText, setTitleText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('gradient1');

  // Customization states
  const [useCustomization, setUseCustomization] = useState(false);
  const [customTextColor, setCustomTextColor] = useState('#ffffff');
  const [customFontFamily, setCustomFontFamily] = useState('Arial');
  const [customFontSize, setCustomFontSize] = useState(48);
  const [customBorderStyle, setCustomBorderStyle] = useState('none');
  const [customBorderWidth, setCustomBorderWidth] = useState(0);
  const [customBorderColor, setCustomBorderColor] = useState('#000000');
  const [customBorderRadius, setCustomBorderRadius] = useState(0);
  const [customTextAlign, setCustomTextAlign] = useState<'left' | 'center' | 'right'>('center');

  const [uploadedMedia, setUploadedMedia] = useState<File[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const [pollData, setPollData] = useState<{ question: string; options: string[] } | null>(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showFormattingTools, setShowFormattingTools] = useState(false);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Virality Check Modal States
  const [showViralityModal, setShowViralityModal] = useState(false);
  const [viralityAnalysisData, setViralityAnalysisData] = useState<AIAnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Viral Post Comparison Modal States
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [recommendedPosts, setRecommendedPosts] = useState<any[]>([]);
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);
  const [generatedSearchQuery, setGeneratedSearchQuery] = useState<string>('');

  // Load edit post data when provided
  useEffect(() => {
    if (editPostData) {
      setPostContent(editPostData.content || '');
      // Note: media_files from backend are URLs, not File objects
      // We'll need to handle this differently - for now just load the content
      console.log('Editing post:', editPostData);
    }
  }, [editPostData]);

  const handlePostGenerated = (post: any) => {
    if (post && post.final_post) {
      setPostContent(post.final_post);
      setShowAIWriter(false); // Close the modal after generating the post
    }
  };

  const handleSaveDraft = async () => {
    try {
      // Upload media files first and get URLs
      const uploadedMediaUrls = [];

      if (uploadedMedia.length > 0) {
        console.log('📤 Uploading', uploadedMedia.length, 'media files...');

        for (const file of uploadedMedia) {
          console.log('Uploading file:', file.name, 'Type:', file.type, 'Size:', file.size);

          const formData = new FormData();
          formData.append('file', file);

          try {
            const response = await api.post('/new_post/drafts/upload/', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });

            if (response.data.success) {
              console.log('✅ Upload successful:', response.data.file);
              uploadedMediaUrls.push(response.data.file);
            } else {
              console.error('❌ Upload failed for:', file.name);
            }
          } catch (uploadError) {
            console.error('Error uploading file:', file.name, uploadError);
            // Continue with other files even if one fails
          }
        }

        console.log('📦 Total uploaded:', uploadedMediaUrls.length, 'files');
        console.log('Media URLs:', uploadedMediaUrls);
      }

      // Save draft with post content and uploaded media URLs
      const result = await draftService.saveDraft({
        content: postContent,
        media_files: uploadedMediaUrls.length > 0 ? uploadedMediaUrls : undefined,
        scheduled_time: scheduleDate && scheduleTime ? `${scheduleDate}T${scheduleTime}` : undefined,
        poll_data: pollData || undefined,
      });

      if (result.success) {
        alert(`Draft saved successfully!${uploadedMediaUrls.length > 0 ? ` (${uploadedMediaUrls.length} media files uploaded)` : ''}`);
      }
    } catch (error: any) {
      console.error('Error saving draft:', error);

      // Check if it's an authentication error
      if (error.message && error.message.includes('401')) {
        alert('Please log in to save drafts. You need to be authenticated to save posts to your account.');
      } else {
        alert('Failed to save draft. Please try again.');
      }
    }
  };

  useEffect(() => {
    setCharCount(postContent.length);
  }, [postContent]);

  useEffect(() => {
    // Check if schedule date is in the past
    if (scheduleDate && scheduleTime) {
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      const now = new Date();
      setHasError(scheduledDateTime < now);
    } else {
      setHasError(false);
    }
  }, [scheduleDate, scheduleTime]);

  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'conversational', label: 'Conversational' },
    { value: 'inspirational', label: 'Inspirational' },
    { value: 'thought-provoking', label: 'Thought-Provoking' },
    { value: 'analytical', label: 'Analytical' },
    { value: 'casual', label: 'Casual' }
  ];

  const styleOptions = [
    { value: 'story', label: 'Personal Story', icon: '📖', desc: 'Share a personal experience with lessons' },
    { value: 'insight', label: 'Professional Insight', icon: '💡', desc: 'Share expertise and observations' },
    { value: 'announcement', label: 'Announcement', icon: '📢', desc: 'Share news or updates' },
    { value: 'question', label: 'Question', icon: '❓', desc: 'Spark discussion with a question' },
    { value: 'tips', label: 'Tips & Advice', icon: '✨', desc: 'Share actionable advice' },
    { value: 'viral', label: 'Choose a Viral Post', icon: '📖', desc: 'Select a viral post to generate your post in the same style.' },
  ];

  const generatePost = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/new_post/generate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic,
          context: context,
          target_audience: targetAudience,
          tone: tonePreference,
          include_story: includeStory,
          post_style: postStyle,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedPost(data);
      setPostContent(data.final_post || '');
      setShowAIWriter(false);
    } catch (error) {
      console.error('Generation failed:', error);
      // Optionally show error to user
      alert('Failed to generate post. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Fetch viral posts when 'viral' style is selected
  const fetchViralPosts = async () => {
    setIsLoadingViralPosts(true);
    try {
      const response = await fetch(`${API_BASE_URL}/v1/viralpost-scraping/linkedin-posts/`);

      if (!response.ok) {
        throw new Error('Failed to load viral posts');
      }

      const postsData = await response.json();
      const processedPosts = postsData.map((post: any, index: number) => ({
        ...post,
        id: post.id || String(index),
        likes: post.likes || '0',
        comments: post.comments || 0,
        shares: post.shares || 0,
        engagement_rate: post.engagement_rate || 'High'
      }));

      setViralPosts(processedPosts);
      setShowViralPostsModal(true);
    } catch (error) {
      console.error('Error fetching viral posts:', error);
      alert('Failed to load viral posts. Please try again.');
    } finally {
      setIsLoadingViralPosts(false);
    }
  };

  // Handler for Check Virality button
  const handleCheckVirality = async () => {
    if (!postContent.trim()) return;

    setShowViralityModal(true);
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Generate consistent post ID from content hash
      const postId = `:${Math.abs(postContent.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0))}`;

      console.log('🔍 Analyzing post for virality...');
      const analysisData = await analyzePost(postId, postContent, false);

      setViralityAnalysisData(analysisData);
      console.log('✓ Virality analysis complete');
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze post');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler for Compare with Viral Posts button
  const handleCompareWithViralPosts = async () => {
    if (!postContent.trim()) return;

    try {
      // Dynamically import the similarity service
      const { findSimilarPosts } = await import('../../../services/similarity.service');

      console.log('🔍 Finding similar viral posts...');
      const result = await findSimilarPosts(postContent, 3);

      // Set the recommended data
      if (result.recommendations) {
        setRecommendedPosts(result.recommendations);
        console.log(`✓ Found ${result.recommendations.length} recommended posts`);
      }
      if (result.keywords) {
        setExtractedKeywords(result.keywords);
        console.log('✓ Extracted keywords:', result.keywords);
      }
      if (result.search_query) {
        setGeneratedSearchQuery(result.search_query);
        console.log('✓ Generated search query:', result.search_query);
      }
    } catch (error) {
      console.error('Error fetching similarity data:', error);
      // Still open the modal even if similarity fetch fails
    }

    setShowComparisonModal(true);
  };

  const configPanelJSX = useMemo(() => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Configure Post Generation</h2>
          <button onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Post Style Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Post Style</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {styleOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setPostStyle(option.value)}
                  className={`p-4 rounded-lg border-2 text-left transition ${postStyle === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{option.desc}</div>
                    </div>
                    {postStyle === option.value && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience
              <span className="text-gray-400 text-xs ml-2">(Optional)</span>
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g., startup founders, marketing professionals"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tone Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tone Preference</label>
            <select
              value={tonePreference}
              onChange={(e) => setTonePreference(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {toneOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Additional Context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Context
              <span className="text-gray-400 text-xs ml-2">(Optional)</span>
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Add any background information or specific points..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Include Personal Story */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="includeStory"
              checked={includeStory}
              onChange={(e) => setIncludeStory(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeStory" className="flex-1 text-sm text-gray-700 cursor-pointer">
              Include personal story or anecdotely
            </label>
          </div>

          {/* Viral Post Selection (only show when 'viral' style is selected) */}
          {postStyle === 'viral' && (
            <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Viral Post Reference
                <span className="text-gray-500 text-xs ml-2">(Pattern/Style Only)</span>
              </label>

              {selectedViralPost ? (
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {selectedViralPost.author_name?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{selectedViralPost.author_name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">{selectedViralPost.time_posted || 'Recently'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedViralPost(null)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mb-2" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedViralPost.post_content}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {selectedViralPost.likes || '0'}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {selectedViralPost.engagement_rate || 'High'} Engagement
                    </span>
                  </div>
                  <button
                    onClick={fetchViralPosts}
                    disabled={isLoadingViralPosts}
                    className="mt-3 w-full px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                  >
                    {isLoadingViralPosts ? 'Loading...' : 'Change Selection'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={fetchViralPosts}
                  disabled={isLoadingViralPosts}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoadingViralPosts ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading Viral Posts...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Select Viral Post
                    </>
                  )}
                </button>
              )}

              <p className="text-xs text-gray-600 mt-2">
                💡 The AI will use this post's style and pattern as reference while generating content based on your topic.
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setShowConfig(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setShowConfig(false);
              // generatePost();
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Save your settings
          </button>
        </div>
      </div>
    </div>
  ), [targetAudience, tonePreference, context, postStyle, includeStory, topic, selectedViralPost, isLoadingViralPosts]);

  // Helper Functions for Rich Editor
  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = postContent.substring(start, end);
    const newText = postContent.substring(0, start) + before + selectedText + after + postContent.substring(end);

    setPostContent(newText);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const handleEmojiSelect = (emoji: any) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = postContent.substring(0, start) + emoji.native + postContent.substring(start);
    setPostContent(newText);
    setShowEmojiPicker(false);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.native.length, start + emoji.native.length);
    }, 0);
  };

  // GIF Picker Functions
  const GIPHY_API_KEY = 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65';

  const searchGifs = async (query: string) => {
    setIsLoadingGifs(true);
    try {
      const endpoint = query
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`;

      const response = await fetch(endpoint);
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
      setGifs([]);
    } finally {
      setIsLoadingGifs(false);
    }
  };

  const handleGifSelect = (gif: any) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const gifUrl = gif.images.fixed_height.url;
    const start = textarea.selectionStart;
    const newText = postContent.substring(0, start) + `\n[GIF: ${gifUrl}]\n` + postContent.substring(start);
    setPostContent(newText);
    setShowGifPicker(false);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + gifUrl.length + 8; // 8 for "\n[GIF: " and "]\n"
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Copy post to clipboard
  const handleCopyPost = async () => {
    try {
      // Remove GIF placeholders but keep the URLs in a readable format
      let cleanedContent = postContent;

      // Extract GIF URLs and append them at the end
      const gifMatches = postContent.match(/\[GIF: (.+?)\]/g);
      if (gifMatches && gifMatches.length > 0) {
        // Remove GIF placeholders from content
        cleanedContent = postContent.replace(/\[GIF: .+?\]/g, '').trim();

        // Add GIF URLs at the end
        cleanedContent += '\n\n--- GIF URLs (paste these in LinkedIn) ---\n';
        gifMatches.forEach((match, index) => {
          const urlMatch = match.match(/\[GIF: (.+?)\]/);
          if (urlMatch) {
            cleanedContent += `${urlMatch[1]}\n`;
          }
        });
      }

      await navigator.clipboard.writeText(cleanedContent);
      alert('Post copied to clipboard with GIF URLs!');
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy post');
    }
  };

  // Download post as text file
  const handleDownloadPost = () => {
    try {
      // Create formatted content
      let content = '=== LinkedIn Post ===\n\n';
      content += postContent.replace(/\[GIF: .+?\]/g, '[GIF]').trim();
      content += '\n\n';

      // Add media info
      if (uploadedMedia.length > 0) {
        content += '\n=== Media ===\n';
        uploadedMedia.forEach((file, index) => {
          content += `${index + 1}. ${file.name}\n`;
        });
      }

      // Add GIF info
      const gifMatches = postContent.match(/\[GIF: (.+?)\]/g);
      if (gifMatches && gifMatches.length > 0) {
        content += '\n=== GIFs ===\n';
        gifMatches.forEach((match, index) => {
          const urlMatch = match.match(/\[GIF: (.+?)\]/);
          if (urlMatch) {
            content += `${index + 1}. ${urlMatch[1]}\n`;
          }
        });
      }

      // Add documents info
      if (uploadedDocuments.length > 0) {
        content += '\n=== Documents ===\n';
        uploadedDocuments.forEach((file, index) => {
          content += `${index + 1}. ${file.name}\n`;
        });
      }

      // Add poll info
      if (pollData) {
        content += '\n=== Poll ===\n';
        content += `Question: ${pollData.question}\n`;
        content += 'Options:\n';
        pollData.options.forEach((option, index) => {
          content += `${index + 1}. ${option}\n`;
        });
      }

      // Create and download file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `linkedin-post-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download:', error);
      alert('Failed to download post');
    }
  };

  // Download all media files (GIFs, images, documents)
  const handleDownloadAllMedia = async () => {
    try {
      let downloadCount = 0;

      // Download GIF files
      const gifMatches = postContent.match(/\[GIF: (.+?)\]/g);
      if (gifMatches && gifMatches.length > 0) {
        for (let i = 0; i < gifMatches.length; i++) {
          const urlMatch = gifMatches[i].match(/\[GIF: (.+?)\]/);
          if (urlMatch) {
            const gifUrl = urlMatch[1];
            try {
              const response = await fetch(gifUrl);
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `gif-${i + 1}.gif`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              downloadCount++;
              // Small delay between downloads
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
              console.error(`Failed to download GIF ${i + 1}:`, error);
            }
          }
        }
      }

      // Download uploaded media files
      for (let i = 0; i < uploadedMedia.length; i++) {
        const file = uploadedMedia[i];
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        downloadCount++;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Download documents
      for (let i = 0; i < uploadedDocuments.length; i++) {
        const file = uploadedDocuments[i];
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        downloadCount++;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (downloadCount > 0) {
        alert(`Downloaded ${downloadCount} file(s) successfully!`);
      } else {
        alert('No media files to download');
      }
    } catch (error) {
      console.error('Failed to download media:', error);
      alert('Failed to download some media files');
    }
  };

  // Load trending GIFs when GIF picker opens
  useEffect(() => {
    if (showGifPicker && gifs.length === 0) {
      searchGifs('');
    }
  }, [showGifPicker]);

  // Quote Image Creator
  const quoteTemplates = [
    // Vibrant Gradients
    {
      id: 'gradient1',
      name: 'Ocean Breeze',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#ffffff',
      authorColor: '#e0e7ff',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },
    {
      id: 'gradient2',
      name: 'Sunset Glow',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      textColor: '#ffffff',
      authorColor: '#ffe0e6',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },
    {
      id: 'gradient3',
      name: 'Tropical Sky',
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      textColor: '#ffffff',
      authorColor: '#d4f1f9',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },
    {
      id: 'gradient4',
      name: 'Golden Hour',
      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      textColor: '#ffffff',
      authorColor: '#fff5e0',
      fontFamily: 'Georgia',
      fontWeight: 'bold',
    },
    {
      id: 'gradient5',
      name: 'Northern Lights',
      background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
      textColor: '#ffffff',
      authorColor: '#d4e9ff',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },
    {
      id: 'gradient6',
      name: 'Purple Dream',
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      textColor: '#2d3748',
      authorColor: '#4a5568',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },
    {
      id: 'gradient7',
      name: 'Fire & Ice',
      background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)',
      textColor: '#ffffff',
      authorColor: '#e8f8f7',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },
    {
      id: 'gradient8',
      name: 'Emerald City',
      background: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
      textColor: '#ffffff',
      authorColor: '#e8f5e0',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },

    // Professional & Corporate
    {
      id: 'linkedin',
      name: 'LinkedIn Blue',
      background: '#0077b5',
      textColor: '#ffffff',
      authorColor: '#cce7f5',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },
    {
      id: 'corporate',
      name: 'Corporate Navy',
      background: '#1e3a8a',
      textColor: '#ffffff',
      authorColor: '#bfdbfe',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },
    {
      id: 'professional',
      name: 'Professional Gray',
      background: '#4b5563',
      textColor: '#ffffff',
      authorColor: '#d1d5db',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },

    // Minimalist & Clean
    {
      id: 'minimal',
      name: 'Pure White',
      background: '#ffffff',
      textColor: '#1a202c',
      authorColor: '#718096',
      fontFamily: 'Arial',
      fontWeight: 'normal',
    },
    {
      id: 'minimal-border',
      name: 'Bordered',
      background: '#f9fafb',
      textColor: '#111827',
      authorColor: '#6b7280',
      fontFamily: 'Georgia',
      fontWeight: 'normal',
    },
    {
      id: 'soft-gray',
      name: 'Soft Gray',
      background: '#e5e7eb',
      textColor: '#1f2937',
      authorColor: '#4b5563',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },

    // Dark Themes
    {
      id: 'dark',
      name: 'Dark Mode',
      background: '#1a202c',
      textColor: '#ffffff',
      authorColor: '#a0aec0',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },
    {
      id: 'midnight',
      name: 'Midnight',
      background: '#0f172a',
      textColor: '#f1f5f9',
      authorColor: '#94a3b8',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },
    {
      id: 'charcoal',
      name: 'Charcoal',
      background: '#2d3748',
      textColor: '#ffffff',
      authorColor: '#cbd5e0',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },

    // Bold & Vibrant
    {
      id: 'electric-blue',
      name: 'Electric Blue',
      background: '#3b82f6',
      textColor: '#ffffff',
      authorColor: '#dbeafe',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },
    {
      id: 'vibrant-purple',
      name: 'Royal Purple',
      background: '#7c3aed',
      textColor: '#ffffff',
      authorColor: '#ede9fe',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },
    {
      id: 'energetic-orange',
      name: 'Energy Orange',
      background: '#f97316',
      textColor: '#ffffff',
      authorColor: '#ffedd5',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },
    {
      id: 'fresh-green',
      name: 'Fresh Green',
      background: '#10b981',
      textColor: '#ffffff',
      authorColor: '#d1fae5',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },
    {
      id: 'bold-red',
      name: 'Bold Red',
      background: '#ef4444',
      textColor: '#ffffff',
      authorColor: '#fee2e2',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },

    // Elegant & Sophisticated
    {
      id: 'rose-gold',
      name: 'Rose Gold',
      background: 'linear-gradient(135deg, #ed6ea0 0%, #ec8c69 100%)',
      textColor: '#ffffff',
      authorColor: '#ffe8f0',
      fontFamily: 'Georgia',
      fontWeight: 'normal',
    },
    {
      id: 'champagne',
      name: 'Champagne',
      background: 'linear-gradient(135deg, #f5e6d3 0%, #d4a574 100%)',
      textColor: '#3e2723',
      authorColor: '#5d4037',
      fontFamily: 'Georgia',
      fontWeight: 'normal',
    },
  ];

  const generateQuoteImage = async (): Promise<File | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    const template = quoteTemplates.find(t => t.id === selectedTemplate) || quoteTemplates[0];

    // Determine values based on customization toggle
    const textColor = useCustomization ? customTextColor : template.textColor;
    const fontFamily = useCustomization ? customFontFamily : template.fontFamily;
    const baseFontSize = useCustomization ? customFontSize : (template.fontWeight === 'normal' ? 44 : 48);
    const fontWeight = useCustomization ? 'bold' : template.fontWeight;
    const textAlign = useCustomization ? customTextAlign : 'center';

    // Draw background
    if (template.background.startsWith('linear-gradient')) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);

      // Extract colors from gradient string
      const colorMatches = template.background.match(/#[0-9a-fA-F]{6}/g);
      if (colorMatches && colorMatches.length >= 2) {
        gradient.addColorStop(0, colorMatches[0]);
        gradient.addColorStop(1, colorMatches[1]);
      }

      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = template.background;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border if customization is enabled
    if (useCustomization && customBorderStyle !== 'none' && customBorderWidth > 0) {
      ctx.strokeStyle = customBorderColor;
      ctx.lineWidth = customBorderWidth;

      // Set border style
      if (customBorderStyle === 'dashed') {
        ctx.setLineDash([20, 10]);
      } else if (customBorderStyle === 'dotted') {
        ctx.setLineDash([5, 5]);
      } else if (customBorderStyle === 'double') {
        // Draw double border
        ctx.setLineDash([]);
        const offset = customBorderWidth * 2;
        ctx.strokeRect(offset, offset, canvas.width - offset * 2, canvas.height - offset * 2);
        ctx.strokeRect(offset + customBorderWidth * 2, offset + customBorderWidth * 2,
          canvas.width - (offset + customBorderWidth * 2) * 2,
          canvas.height - (offset + customBorderWidth * 2) * 2);
      } else {
        ctx.setLineDash([]);
      }

      // Draw border with rounded corners if radius is set
      if (customBorderRadius > 0 && customBorderStyle !== 'double') {
        const x = customBorderWidth / 2;
        const y = customBorderWidth / 2;
        const width = canvas.width - customBorderWidth;
        const height = canvas.height - customBorderWidth;
        const radius = customBorderRadius;

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.stroke();
      } else if (customBorderStyle !== 'double') {
        ctx.strokeRect(customBorderWidth / 2, customBorderWidth / 2,
          canvas.width - customBorderWidth, canvas.height - customBorderWidth);
      }

      ctx.setLineDash([]); // Reset
    }

    // Add subtle pattern/texture (lighter for light backgrounds)
    const isLightBackground = template.background === '#ffffff' || template.background === '#f9fafb' || template.background === '#e5e7eb';
    ctx.globalAlpha = isLightBackground ? 0.02 : 0.05;
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = isLightBackground ? '#000000' : '#ffffff';
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 3,
        Math.random() * 3
      );
    }
    ctx.globalAlpha = 1;

    // Add title if provided
    if (titleText) {
      ctx.fillStyle = textColor;
      ctx.font = `${fontWeight} 36px ${fontFamily}, sans-serif`;
      ctx.textAlign = textAlign as CanvasTextAlign;
      const titleX = textAlign === 'left' ? 100 : textAlign === 'right' ? canvas.width - 100 : canvas.width / 2;
      ctx.fillText(titleText, titleX, 80);
    }

    // Draw quote text
    ctx.fillStyle = textColor;
    ctx.font = `${fontWeight} ${baseFontSize}px ${fontFamily}, sans-serif`;
    ctx.textAlign = textAlign as CanvasTextAlign;
    ctx.textBaseline = 'middle';

    // Word wrap for quote
    const maxWidth = 1000;
    const lineHeight = baseFontSize + 22;
    const words = quoteText.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    });
    lines.push(currentLine);

    // Draw decorative quote mark (only for center alignment)
    if (textAlign === 'center') {
      ctx.font = `${fontWeight} 120px Georgia, serif`;
      ctx.fillStyle = textColor;
      ctx.globalAlpha = 0.2;
      ctx.fillText('"', 150, titleText ? 220 : 200);
      ctx.globalAlpha = 1;
    }

    // Draw lines
    ctx.font = `${fontWeight} ${baseFontSize}px ${fontFamily}, sans-serif`;
    const startY = titleText
      ? 250 + (canvas.height - 250) / 2 - (lines.length * lineHeight) / 2
      : canvas.height / 2 - (lines.length * lineHeight) / 2;

    lines.forEach((line, index) => {
      const lineX = textAlign === 'left' ? 100 : textAlign === 'right' ? canvas.width - 100 : canvas.width / 2;
      ctx.fillText(line.trim(), lineX, startY + index * lineHeight);
    });

    // Draw author
    if (authorText) {
      ctx.font = `italic 32px Georgia, serif`;
      ctx.fillStyle = useCustomization ? textColor : template.authorColor;
      const authorX = textAlign === 'left' ? 100 : textAlign === 'right' ? canvas.width - 100 : canvas.width / 2;
      ctx.fillText(`— ${authorText}`, authorX, startY + lines.length * lineHeight + 60);
    }

    // Convert canvas to blob then to File
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `quote-${Date.now()}.png`, { type: 'image/png' });
          resolve(file);
        } else {
          resolve(null);
        }
      }, 'image/png');
    });
  };

  const handleCreateQuoteImage = async () => {
    if (!quoteText.trim()) {
      alert('Please enter a quote!');
      return;
    }

    const imageFile = await generateQuoteImage();
    if (imageFile) {
      setUploadedMedia(prev => [...prev, imageFile]);
      setShowQuoteImageModal(false);
      // Reset form
      setQuoteText('');
      setAuthorText('');
      setTitleText('');
      setSelectedTemplate('gradient1');
    }
  };



  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedMedia(prev => [...prev, ...Array.from(files)]);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedDocuments(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeMedia = (index: number) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const PollModal = () => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);

    const addOption = () => {
      if (options.length < 4) {
        setOptions([...options, '']);
      }
    };

    const updateOption = (index: number, value: string) => {
      const newOptions = [...options];
      newOptions[index] = value;
      setOptions(newOptions);
    };

    const removeOption = (index: number) => {
      if (options.length > 2) {
        setOptions(options.filter((_, i) => i !== index));
      }
    };

    const savePoll = () => {
      if (question.trim() && options.filter(o => o.trim()).length >= 2) {
        setPollData({ question, options: options.filter(o => o.trim()) });
        setShowPollModal(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Create a Poll</h3>
            <button onClick={() => setShowPollModal(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {options.length > 2 && (
                      <button onClick={() => removeOption(index)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 4 && (
                <button onClick={addOption} className="mt-2 text-sm text-blue-600 hover:text-blue-700">
                  + Add option
                </button>
              )}
            </div>
          </div>
          <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
            <button onClick={() => setShowPollModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900">
              Cancel
            </button>
            <button onClick={savePoll} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Add Poll
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Viral Posts Selection Modal
  const ViralPostsModal = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [tempSelected, setTempSelected] = useState<any>(selectedViralPost);
    const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

    const filteredPosts = viralPosts.filter(post =>
      post.post_content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleConfirmSelection = () => {
      setSelectedViralPost(tempSelected);
      setShowViralPostsModal(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Select a Viral Post</h2>
              <p className="text-sm text-gray-500 mt-1">Choose a post to use as style/pattern reference</p>
            </div>
            <button onClick={() => setShowViralPostsModal(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-6 py-4 border-b">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by content or author..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Posts List */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingViralPosts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Loading viral posts...</span>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No posts found. Try a different search term.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setTempSelected(post)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${tempSelected?.id === post.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {post.profile_image_url ? (
                          <img
                            src={post.profile_image_url}
                            alt={post.author_name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const nextSibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                              if (nextSibling) {
                                nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ display: post.profile_image_url ? 'none' : 'flex' }}
                        >
                          {post.author_name?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{post.author_name || 'Anonymous'}</p>
                          <p className="text-xs text-gray-500">{post.time_posted || 'Recently'}</p>
                        </div>
                      </div>
                      {tempSelected?.id === post.id && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>

                    {/* Post Content - Expandable */}
                    <div className="mb-3">
                      <p className={`text-sm text-gray-700 whitespace-pre-wrap ${expandedPostId === post.id ? '' : 'line-clamp-3'}`}>
                        {post.post_content}
                      </p>
                      {post.post_content && post.post_content.length > 150 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedPostId(expandedPostId === post.id ? null : post.id);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                        >
                          {expandedPostId === post.id ? '▲ Show Less' : '▼ View Full Post'}
                        </button>
                      )}
                    </div>

                    {/* Engagement Metrics */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {post.likes || '0'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {post.comments || 0}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {post.engagement_rate || 'High'} Engagement
                      </span>
                      {post.linkedin_url && (
                        <a
                          href={post.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                          View on LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {tempSelected ? `Selected: ${tempSelected.author_name}'s post` : 'No post selected'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowViralPostsModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={!tempSelected}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (showAIWriter) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full h-full max-w-7xl max-h-[98vh] flex flex-col">
            <div className="flex-1 min-h-0 overflow-hidden relative">
              <AIChatInterface
                onClose={() => setShowAIWriter(false)}
                onPostGenerated={handlePostGenerated}
                initialMessage={topic}
                onConfigureClick={() => setShowConfig(true)}
                configContext={{
                  topic,
                  context,
                  targetAudience,
                  tonePreference,
                  postStyle,
                  includeStory,
                  viralPostReference: selectedViralPost?.post_content,
                }}
              />
            </div>
          </div>
        </div>
        {showConfig && configPanelJSX}
        {showViralPostsModal && <ViralPostsModal />}
      </>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50">
      {showConfig && configPanelJSX}
      {/* Main Editor */}
      <div className="max-w-8xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Editor */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Header */}
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">Create new post</h1>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Post Type Selector */}
              <div className="px-6 py-3 border-b flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </div>
                  <button className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded-lg">
                    <span className="text-sm font-medium">POST</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Editor Area */}
              <div className="p-6">
                <textarea
                  ref={textareaRef}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="What do you want to talk about?"
                  rows={10}
                  className="w-full text-gray-900 placeholder-gray-400 resize-none focus:outline-none text-base leading-relaxed"
                  style={{ minHeight: '300px' }}
                />

                {/* Uploaded Media Preview */}
                {uploadedMedia.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {uploadedMedia.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeMedia(index)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Uploaded Documents Preview */}
                {uploadedDocuments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedDocuments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <span className="flex-1 text-sm text-gray-700 truncate">{file.name}</span>
                        <button
                          onClick={() => removeDocument(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Poll Preview */}
                {pollData && (
                  <div className="mt-4 p-4 border border-gray-300 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{pollData.question}</h4>
                      <button
                        onClick={() => setPollData(null)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {pollData.options.map((option, index) => (
                        <div key={index} className="p-2 border border-gray-200 rounded text-sm text-gray-700">
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Toolbar */}
              <div className="px-6 pb-4 border-t pt-4">
                {/* Main Toolbar Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {/* AI Writer */}
                    <button
                      onClick={() => setShowAIWriter(true)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition group"
                      title="AI Writer"
                    >
                      <Sparkles className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
                    </button>

                    {/* Media Upload with Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowMediaMenu(!showMediaMenu)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Add media"
                      >
                        <Image className="w-5 h-5 text-gray-600" />
                      </button>

                      {/* Media Menu Dropdown */}
                      {showMediaMenu && (
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowMediaMenu(false)}
                          />

                          {/* Menu */}
                          <div className="absolute left-0 top-full mt-2 z-20 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden min-w-[220px]">
                            <div className="py-1">
                              {/* Create AI Image */}
                              <button
                                onClick={() => {
                                  setShowMediaMenu(false);
                                  // TODO: Implement AI Image generation
                                  alert('AI Image generation coming soon!');
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                              >
                                <Sparkles className="w-4 h-4" />
                                <span>Create AI Image</span>
                              </button>

                              {/* Create Quote Image */}
                              <button
                                onClick={() => {
                                  setShowMediaMenu(false);
                                  setShowQuoteImageModal(true);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                              >
                                <Quote className="w-4 h-4" />
                                <span>Create Quote Image</span>
                              </button>

                              {/* Select GIF */}
                              <button
                                onClick={() => {
                                  setShowMediaMenu(false);
                                  setShowGifPicker(true);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                              >
                                <Film className="w-4 h-4" />
                                <span>Select GIF</span>
                              </button>

                              {/* Divider */}
                              <div className="border-t border-gray-200 my-1" />

                              {/* Upload Image/Video */}
                              <button
                                onClick={() => {
                                  setShowMediaMenu(false);
                                  mediaInputRef.current?.click();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <ImagePlus className="w-4 h-4" />
                                <span>Upload Image/Video</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Hidden file input */}
                      <input
                        ref={mediaInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleMediaUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Document Upload */}
                    <button
                      onClick={() => documentInputRef.current?.click()}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Add document"
                    >
                      <FileText className="w-5 h-5 text-gray-600" />
                    </button>
                    <input
                      ref={documentInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      multiple
                      onChange={handleDocumentUpload}
                      className="hidden"
                    />

                    {/* Emoji Picker */}
                    <div className="relative">
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Add emoji"
                      >
                        <Smile className="w-5 h-5 text-gray-600" />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-full left-0 mb-2 z-50">
                          <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="light" />
                        </div>
                      )}
                    </div>

                    {/* GIF Picker */}
                    {showGifPicker && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowGifPicker(false)}
                        />

                        {/* GIF Picker Modal */}
                        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 w-[500px] max-h-[500px] flex flex-col">
                          {/* Header */}
                          <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">Select a GIF</h3>
                              <button
                                onClick={() => setShowGifPicker(false)}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <X className="w-5 h-5 text-gray-500" />
                              </button>
                            </div>

                            {/* Search Input */}
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Search for GIFs..."
                                value={gifSearchQuery}
                                onChange={(e) => {
                                  setGifSearchQuery(e.target.value);
                                  searchGifs(e.target.value);
                                }}
                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              {gifSearchQuery && (
                                <button
                                  onClick={() => {
                                    setGifSearchQuery('');
                                    searchGifs('');
                                  }}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* GIF Grid */}
                          <div className="flex-1 overflow-y-auto p-4">
                            {isLoadingGifs ? (
                              <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                              </div>
                            ) : gifs.length > 0 ? (
                              <div className="grid grid-cols-2 gap-2">
                                {gifs.map((gif) => (
                                  <button
                                    key={gif.id}
                                    onClick={() => handleGifSelect(gif)}
                                    className="relative aspect-video rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all group"
                                  >
                                    <img
                                      src={gif.images.fixed_height.url}
                                      alt={gif.title}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <Film className="w-12 h-12 mb-2 text-gray-400" />
                                <p className="text-sm">No GIFs found</p>
                                <p className="text-xs mt-1">Try a different search term</p>
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="p-3 border-t border-gray-200 bg-gray-50">
                            <p className="text-xs text-gray-500 text-center">
                              Powered by <span className="font-semibold">GIPHY</span>
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Quote Image Creator Modal */}
                    {showQuoteImageModal && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-40 bg-black bg-opacity-50"
                          onClick={() => setShowQuoteImageModal(false)}
                        />

                        {/* Modal */}
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                              <h2 className="text-2xl font-bold text-gray-900">Create Quote Image</h2>
                              <button
                                onClick={() => setShowQuoteImageModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <X className="w-5 h-5 text-gray-500" />
                              </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Panel - Configuration */}
                                <div className="space-y-6">
                                  {/* Quote Text */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Quote Text *
                                    </label>
                                    <textarea
                                      value={quoteText}
                                      onChange={(e) => setQuoteText(e.target.value)}
                                      placeholder="Enter your inspirational quote..."
                                      rows={4}
                                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                  </div>

                                  {/* Author */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Author (Optional)
                                    </label>
                                    <input
                                      type="text"
                                      value={authorText}
                                      onChange={(e) => setAuthorText(e.target.value)}
                                      placeholder="e.g., Albert Einstein"
                                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>

                                  {/* Title */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Title (Optional)
                                    </label>
                                    <input
                                      type="text"
                                      value={titleText}
                                      onChange={(e) => setTitleText(e.target.value)}
                                      placeholder="e.g., Feedisight"
                                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>

                                  {/* Template Selector */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                      Choose Template ({quoteTemplates.length} available)
                                    </label>
                                    <div className="max-h-[400px] overflow-y-auto pr-2">
                                      <div className="grid grid-cols-4 gap-2">
                                        {quoteTemplates.map((template) => (
                                          <button
                                            key={template.id}
                                            onClick={() => setSelectedTemplate(template.id)}
                                            className={`relative h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedTemplate === template.id
                                              ? 'border-blue-500 ring-2 ring-blue-200'
                                              : 'border-gray-200 hover:border-gray-300'
                                              }`}
                                            style={{ background: template.background }}
                                          >
                                            <div className="absolute inset-0 flex items-center justify-center">
                                              <span
                                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                                style={{
                                                  color: template.textColor,
                                                  backgroundColor: 'rgba(0,0,0,0.2)',
                                                }}
                                              >
                                                {template.name}
                                              </span>
                                            </div>
                                            {selectedTemplate === template.id && (
                                              <div className="absolute top-1 right-1">
                                                <Check className="w-3 h-3 text-white bg-blue-500 rounded-full p-0.5" />
                                              </div>
                                            )}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Customization Section */}
                                  <div className="border-t pt-4 mt-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <label className="block text-sm font-medium text-gray-700">
                                        Custom Styling
                                      </label>
                                      <button
                                        onClick={() => setUseCustomization(!useCustomization)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useCustomization ? 'bg-blue-600' : 'bg-gray-200'
                                          }`}
                                      >
                                        <span
                                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useCustomization ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                      </button>
                                    </div>

                                    {useCustomization && (
                                      <div className="space-y-4 pl-2">
                                        {/* Text Color */}
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Text Color
                                          </label>
                                          <input
                                            type="color"
                                            value={customTextColor}
                                            onChange={(e) => setCustomTextColor(e.target.value)}
                                            className="h-10 w-full rounded cursor-pointer"
                                          />
                                        </div>

                                        {/* Font Family */}
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Font Family
                                          </label>
                                          <select
                                            value={customFontFamily}
                                            onChange={(e) => setCustomFontFamily(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          >
                                            <option value="Arial">Arial</option>
                                            <option value="Georgia">Georgia</option>
                                            <option value="Courier New">Courier New</option>
                                            <option value="Times New Roman">Times New Roman</option>
                                            <option value="Verdana">Verdana</option>
                                          </select>
                                        </div>

                                        {/* Font Size */}
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Font Size: {customFontSize}px
                                          </label>
                                          <input
                                            type="range"
                                            min="32"
                                            max="72"
                                            value={customFontSize}
                                            onChange={(e) => setCustomFontSize(Number(e.target.value))}
                                            className="w-full"
                                          />
                                        </div>

                                        {/* Text Alignment */}
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-2">
                                            Text Alignment
                                          </label>
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => setCustomTextAlign('left')}
                                              className={`flex-1 px-3 py-2 text-xs rounded border-2 transition ${customTextAlign === 'left'
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                              <AlignLeft className="w-4 h-4 mx-auto" />
                                            </button>
                                            <button
                                              onClick={() => setCustomTextAlign('center')}
                                              className={`flex-1 px-3 py-2 text-xs rounded border-2 transition ${customTextAlign === 'center'
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                              <AlignCenter className="w-4 h-4 mx-auto" />
                                            </button>
                                            <button
                                              onClick={() => setCustomTextAlign('right')}
                                              className={`flex-1 px-3 py-2 text-xs rounded border-2 transition ${customTextAlign === 'right'
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                              <AlignRight className="w-4 h-4 mx-auto" />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Border Style */}
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-2">
                                            Border Style
                                          </label>
                                          <div className="grid grid-cols-5 gap-1">
                                            {['none', 'solid', 'dashed', 'dotted', 'double'].map((style) => (
                                              <button
                                                key={style}
                                                onClick={() => setCustomBorderStyle(style)}
                                                className={`px-2 py-1.5 text-[10px] rounded border-2 transition capitalize ${customBorderStyle === style
                                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                  : 'border-gray-200 hover:border-gray-300'
                                                  }`}
                                              >
                                                {style}
                                              </button>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Border Width */}
                                        {customBorderStyle !== 'none' && (
                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                              Border Width: {customBorderWidth}px
                                            </label>
                                            <input
                                              type="range"
                                              min="0"
                                              max="20"
                                              value={customBorderWidth}
                                              onChange={(e) => setCustomBorderWidth(Number(e.target.value))}
                                              className="w-full"
                                            />
                                          </div>
                                        )}

                                        {/* Border Color */}
                                        {customBorderStyle !== 'none' && customBorderWidth > 0 && (
                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                              Border Color
                                            </label>
                                            <input
                                              type="color"
                                              value={customBorderColor}
                                              onChange={(e) => setCustomBorderColor(e.target.value)}
                                              className="h-10 w-full rounded cursor-pointer"
                                            />
                                          </div>
                                        )}

                                        {/* Shape (Border Radius) */}
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-2">
                                            Shape
                                          </label>
                                          <div className="grid grid-cols-3 gap-2">
                                            <button
                                              onClick={() => setCustomBorderRadius(0)}
                                              className={`px-3 py-2 text-xs rounded border-2 transition ${customBorderRadius === 0
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                              Sharp
                                            </button>
                                            <button
                                              onClick={() => setCustomBorderRadius(20)}
                                              className={`px-3 py-2 text-xs rounded border-2 transition ${customBorderRadius === 20
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                              Rounded
                                            </button>
                                            <button
                                              onClick={() => setCustomBorderRadius(50)}
                                              className={`px-3 py-2 text-xs rounded border-2 transition ${customBorderRadius === 50
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                              Pill
                                            </button>
                                          </div>
                                        </div>

                                        {/* Reset Button */}
                                        <button
                                          onClick={() => {
                                            setUseCustomization(false);
                                            setCustomTextColor('#ffffff');
                                            setCustomFontFamily('Arial');
                                            setCustomFontSize(48);
                                            setCustomBorderStyle('none');
                                            setCustomBorderWidth(0);
                                            setCustomBorderColor('#000000');
                                            setCustomBorderRadius(0);
                                            setCustomTextAlign('center');
                                          }}
                                          className="w-full px-3 py-2 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                        >
                                          Reset to Template Defaults
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Right Panel - Preview */}
                                <div className="space-y-4">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Preview
                                  </label>
                                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                                    <div
                                      className="w-full aspect-[1200/630] flex flex-col items-center justify-center p-8 relative"
                                      style={{
                                        background: quoteTemplates.find(t => t.id === selectedTemplate)?.background,
                                        border: useCustomization && customBorderStyle !== 'none' && customBorderWidth > 0
                                          ? `${customBorderWidth}px ${customBorderStyle} ${customBorderColor}`
                                          : undefined,
                                        borderRadius: useCustomization ? `${customBorderRadius}px` : undefined,
                                      }}
                                    >
                                      {/* Title */}
                                      {titleText && (
                                        <div
                                          className={`absolute top-6 ${useCustomization && customTextAlign === 'left' ? 'left-8' :
                                            useCustomization && customTextAlign === 'right' ? 'right-8' :
                                              'left-0 right-0 text-center'
                                            } text-xl font-semibold`}
                                          style={{
                                            color: useCustomization ? customTextColor : quoteTemplates.find(t => t.id === selectedTemplate)?.textColor,
                                            fontFamily: useCustomization ? customFontFamily : quoteTemplates.find(t => t.id === selectedTemplate)?.fontFamily,
                                          }}
                                        >
                                          {titleText}
                                        </div>
                                      )}

                                      {/* Decorative quote mark (only for center alignment) */}
                                      {(!useCustomization || customTextAlign === 'center') && (
                                        <div
                                          className="absolute top-8 left-8 text-8xl font-serif opacity-20"
                                          style={{
                                            color: useCustomization ? customTextColor : quoteTemplates.find(t => t.id === selectedTemplate)?.textColor,
                                          }}
                                        >
                                          "
                                        </div>
                                      )}

                                      {/* Quote text */}
                                      <div className={`flex-1 flex items-center ${useCustomization && customTextAlign === 'left' ? 'justify-start pl-12' :
                                        useCustomization && customTextAlign === 'right' ? 'justify-end pr-12' :
                                          'justify-center px-12'
                                        }`}>
                                        <p
                                          className="leading-relaxed"
                                          style={{
                                            color: useCustomization ? customTextColor : quoteTemplates.find(t => t.id === selectedTemplate)?.textColor,
                                            fontFamily: useCustomization ? customFontFamily : quoteTemplates.find(t => t.id === selectedTemplate)?.fontFamily,
                                            fontWeight: useCustomization ? 'bold' : quoteTemplates.find(t => t.id === selectedTemplate)?.fontWeight,
                                            fontSize: useCustomization ? `${Math.round(customFontSize * 0.5)}px` : '1.875rem',
                                            textAlign: useCustomization ? customTextAlign : 'center',
                                          }}
                                        >
                                          {quoteText || 'Your quote will appear here...'}
                                        </p>
                                      </div>

                                      {/* Author */}
                                      {authorText && (
                                        <p
                                          className={`text-lg italic mt-4 ${useCustomization && customTextAlign === 'left' ? 'self-start ml-12' :
                                            useCustomization && customTextAlign === 'right' ? 'self-end mr-12' :
                                              ''
                                            }`}
                                          style={{
                                            color: useCustomization ? customTextColor : quoteTemplates.find(t => t.id === selectedTemplate)?.authorColor,
                                            textAlign: useCustomization ? customTextAlign : 'center',
                                          }}
                                        >
                                          — {authorText}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-500 text-center">
                                    Image size: 1200 x 630 px (LinkedIn optimized)
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                              <p className="text-sm text-gray-600">
                                The image will be added to your post media
                              </p>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => setShowQuoteImageModal(false)}
                                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleCreateQuoteImage}
                                  disabled={!quoteText.trim()}
                                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  <ImagePlus className="w-4 h-4" />
                                  Create Image
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Poll */}
                    <button
                      onClick={() => setShowPollModal(true)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Create poll"
                    >
                      <BarChart3 className="w-5 h-5 text-gray-600" />
                    </button>

                    {/* Formatting Tools Toggle */}
                    <button
                      onClick={() => setShowFormattingTools(!showFormattingTools)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Text formatting"
                    >
                      <Type className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{charCount} / {maxChars}</span>
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </div>
                </div>

                {/* Formatting Toolbar (Conditional) */}
                {showFormattingTools && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <button
                      onClick={() => insertMarkdown('**', '**')}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Bold"
                    >
                      <Bold className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => insertMarkdown('*', '*')}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Italic"
                    >
                      <Italic className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => insertMarkdown('<u>', '</u>')}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Underline"
                    >
                      <Underline className="w-4 h-4 text-gray-600" />
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    <button
                      onClick={() => insertMarkdown('- ', '\n')}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Bullet list"
                    >
                      <List className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => insertMarkdown('1. ', '\n')}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Numbered list"
                    >
                      <ListOrdered className="w-4 h-4 text-gray-600" />
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    <button
                      onClick={() => insertMarkdown('<div style="text-align: left;">', '</div>')}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Align left"
                    >
                      <AlignLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => insertMarkdown('<div style="text-align: center;">', '</div>')}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Align center"
                    >
                      <AlignCenter className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => insertMarkdown('<div style="text-align: right;">', '</div>')}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Align right"
                    >
                      <AlignRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                )}
              </div>

              {/* Additional Options */}
              <div className="px-6 pb-4 space-y-3">
                {/* Global Presets */}
                {/* <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Global presets</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button> */}

                {/* LinkedIn Presets */}
                {/* <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">LinkedIn presets</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button> */}

                {/* Error Message */}
                {/* {hasError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">1 error</p>
                      <p className="text-sm text-red-700 mt-1">Publish date can't be a past date.</p>
                    </div>
                  </div>
                )} */}
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <button className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium">
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <button
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    onClick={() => setShowSchedule(!showSchedule)}
                  >
                    Schedule
                  </button>


                  <button
                    onClick={handleSaveDraft}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!postContent.trim() || hasError}
                  >
                    Save Draft
                  </button>
                  <button
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    // disabled={!postContent.trim() || hasError}
                    onClick={() => alert('We are implementing this feature. Coming soon, right now you can click Save Draft button!')}
                  >
                    Post
                  </button>
                  {/* <button
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    onClick={() => alert('We are implementing this feature. Coming soon!')}
                  >
                    Schedule
                  </button> */}

                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border sticky top-4">
              <div className="px-10 py-3 border-b flex items-center justify-between">
                <button className="flex items-center gap-2 text-sm text-gray-600">
                  <MessageSquare className="w-4 h-4" />
                  Notes
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyPost}
                    disabled={!postContent.trim()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Copy post text"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={handleDownloadPost}
                    disabled={!postContent.trim()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Download post as text"
                  >
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={handleDownloadAllMedia}
                    disabled={uploadedMedia.length === 0 && uploadedDocuments.length === 0 && !postContent.match(/\[GIF: .+?\]/g)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
                    title={`Download all media files (${uploadedMedia.length + uploadedDocuments.length + (postContent.match(/\[GIF: .+?\]/g)?.length || 0)} files)`}
                  >
                    <Film className="w-4 h-4 text-gray-600" />
                    {(uploadedMedia.length + uploadedDocuments.length + (postContent.match(/\[GIF: .+?\]/g)?.length || 0)) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                        {uploadedMedia.length + uploadedDocuments.length + (postContent.match(/\[GIF: .+?\]/g)?.length || 0)}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleCheckVirality}
                    disabled={!postContent.trim()}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Check virality of your post"
                  >
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={handleCompareWithViralPosts}
                    disabled={!postContent.trim()}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Compare your post with viral posts"
                  >
                    <GitCompareIcon className="w-4 h-4 text-blue-600" />
                  </button>

                </div>
              </div>

              {/* Preview Card */}
              <div className="p-4">
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      IIT
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">IIT Mandi iHub and HCi Foundation</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span>followers</span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span>25min</span>
                        <span>•</span>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM.5 8a7.5 7.5 0 1 0 15 0 7.5 7.5 0 0 0-15 0z" />
                          <path d="M8 3.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5H4a.5.5 0 0 1 0-1h3.5V4a.5.5 0 0 1 .5-.5z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-900 mb-3 leading-relaxed prose prose-sm max-w-none">
                    {postContent ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {postContent.replace(/\[GIF: .+?\]/g, '')}
                      </ReactMarkdown>
                    ) : (
                      <span className="text-gray-400">Your post preview will appear here...</span>
                    )}
                  </div>

                  {/* GIF Preview - Extract from post content */}
                  {(() => {
                    const gifMatches = postContent.match(/\[GIF: (.+?)\]/g);
                    if (gifMatches && gifMatches.length > 0) {
                      const gifUrls = gifMatches.map(match => {
                        const urlMatch = match.match(/\[GIF: (.+?)\]/);
                        return urlMatch ? urlMatch[1] : null;
                      }).filter(Boolean);

                      return (
                        <div className={`mb-3 ${gifUrls.length === 1 ? '' : 'grid grid-cols-2 gap-1'}`}>
                          {gifUrls.map((url, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={url as string}
                                alt="GIF"
                                className="w-full h-48 object-cover rounded"
                              />
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Uploaded Media Preview */}
                  {uploadedMedia.length > 0 && (
                    <div className={`mb-3 ${uploadedMedia.length === 1 ? '' : 'grid grid-cols-2 gap-1'}`}>
                      {uploadedMedia.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-48 object-cover rounded"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Uploaded Documents Preview */}
                  {uploadedDocuments.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {uploadedDocuments.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                          <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                          <span className="flex-1 text-xs text-gray-700 truncate">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Poll Preview */}
                  {pollData && (
                    <div className="mb-3 p-3 border border-gray-300 rounded">
                      <h4 className="font-medium text-sm text-gray-900 mb-2">{pollData.question}</h4>
                      <div className="space-y-2">
                        {pollData.options.map((option, index) => (
                          <div key={index} className="p-2 border border-gray-200 rounded text-xs text-gray-700">
                            {option}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {postContent && (
                    <button className="text-sm text-blue-600 hover:underline">
                      ...see more
                    </button>
                  )}
                </div>

                {postContent && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <div className="flex items-center">
                        <span className="mr-1">👍</span>
                        <span className="mr-1">❤️</span>
                        <span className="mr-1">💡</span>
                      </div>
                    </div>

                    <div className="border-t pt-2 flex items-center justify-between">
                      <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-xs">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        Like
                      </button>
                      <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-xs">
                        <MessageSquare className="w-4 h-4" />
                        Comment
                      </button>
                      <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-xs">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share
                      </button>
                      <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-xs">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Info Banner */}
              <div className="px-4 pb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-blue-800">
                    Previews are an approximation of how your post will look when published. The final post may look slightly different.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Poll Modal */}
      {showPollModal && <PollModal />}

      {/* Viral Posts Modal */}
      {showViralPostsModal && <ViralPostsModal />}

      {/* Virality Check Modal */}
      {showViralityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#ff6700] to-[#0d569e] rounded-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">AI Post Virality Analysis</h2>
                  <p className="text-sm text-gray-600">Comprehensive analysis of your LinkedIn post</p>
                </div>
              </div>
              <button
                onClick={() => setShowViralityModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                  <p className="text-lg font-medium text-gray-900">Analyzing your post...</p>
                  <p className="text-sm text-gray-600 mt-2">This may take a few seconds</p>
                </div>
              ) : analysisError ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
                  <p className="text-lg font-medium text-gray-900">Analysis Failed</p>
                  <p className="text-sm text-gray-600 mt-2">{analysisError}</p>
                  <button
                    onClick={handleCheckVirality}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : viralityAnalysisData ? (
                <AIAnalysisView
                  analysisData={viralityAnalysisData}
                  postContent={postContent}
                  onBack={() => setShowViralityModal(false)}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Viral Post Comparison Modal */}
      {showComparisonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#ff6700] to-[#0d569e] rounded-lg">
                  <GitCompareIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Compare with Viral Posts</h2>
                  <p className="text-sm text-gray-600">Analyze your post against viral LinkedIn content</p>
                </div>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <LinkedInViralityAnalyzer
                initialUserPost={postContent}
                recommendedPosts={recommendedPosts}
                extractedKeywords={extractedKeywords}
                generatedSearchQuery={generatedSearchQuery}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkedInPostEditor;