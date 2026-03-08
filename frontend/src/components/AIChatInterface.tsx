import { v4 as uuidv4 } from 'uuid';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Sparkles, X, FileText, AlertCircle, Trash2, Plus, Menu, Eye } from 'lucide-react';

interface MessageMetadata {
  model?: string;
  processingTime?: number;
  tokens?: number;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  metadata?: MessageMetadata;
  error?: boolean;
}

interface ChatSession {
  id: string;
  session_id: string;
  title: string;
  message_count: number;
  last_message_at: string;
  created_at: string;
}

interface AIChatInterfaceProps {
  onClose: () => void;
  onPostGenerated: (post: {
    final_post: string;
    hashtags?: string[];
    word_count: number;
    character_count: number;
  }) => void;
  initialMessage?: string;
  onConfigureClick?: () => void;
  configContext?: {
    topic?: string;
    context?: string;
    targetAudience?: string;
    tonePreference?: string;
    postStyle?: string;
    includeStory?: boolean;
    viralPostReference?: string;
  };
}

const API_BASE_URL = 'http://localhost:8000';
const REQUEST_TIMEOUT = 120000;

const AIChatInterface = ({ onClose, onPostGenerated, onConfigureClick, configContext }: AIChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [connectionError, setConnectionError] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [userIdentifier, setUserIdentifier] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let identifier = localStorage.getItem('user_identifier');
    if (!identifier) {
      identifier = `user_${uuidv4()}`;
      localStorage.setItem('user_identifier', identifier);
    }
    setUserIdentifier(identifier);
  }, []);

  const fetchUserSessions = useCallback(async () => {
    if (!userIdentifier) return;

    try {
      setIsLoadingSessions(true);
      const response = await fetch(
        `${API_BASE_URL}/api/v1/new_post/sessions/user/?user_identifier=${userIdentifier}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Fetched sessions:', data);
        if (data.success && data.sessions) {
          setSessions(data.sessions);
          console.log('✅ Sessions set:', data.sessions.length, 'total');
          console.log('📊 Sessions with messages:', data.sessions.filter((s: any) => s.message_count > 0).length);
          console.log('🔍 Session details:', data.sessions.map((s: any) => ({
            id: s.session_id,
            title: s.title,
            message_count: s.message_count
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [userIdentifier]);

  const loadSession = useCallback(async (sessionIdToLoad: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/v1/new_post/sessions/${sessionIdToLoad}/messages/?user_identifier=${userIdentifier}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.session) {
          const formattedMessages = data.session.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            isUser: msg.role === 'user',
            timestamp: new Date(msg.created_at),
            error: false,
          }));

          setMessages(formattedMessages);
          setSessionId(sessionIdToLoad);
          localStorage.setItem('ai_writer_session_id', sessionIdToLoad);
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userIdentifier]);

  const deleteSession = useCallback(async (sessionIdToDelete: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/new_post/sessions/${sessionIdToDelete}/?user_identifier=${userIdentifier}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        setSessions(prev => prev.filter(s => s.session_id !== sessionIdToDelete));
        if (sessionId === sessionIdToDelete) {
          handleNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }, [userIdentifier, sessionId]);

  const loadPreview = useCallback(async (sessionIdToPreview: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/new_post/sessions/${sessionIdToPreview}/messages/?user_identifier=${userIdentifier}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.session) {
          const formattedMessages = data.session.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            isUser: msg.role === 'user',
            timestamp: new Date(msg.created_at),
            error: false,
          }));

          // Find the last AI message (non-user message)
          const lastAIMessage = formattedMessages.reverse().find((msg: Message) => !msg.isUser);

          if (lastAIMessage && onPostGenerated) {
            // Load the AI message content into the main editor
            onPostGenerated({
              final_post: lastAIMessage.content,
              hashtags: lastAIMessage.content.match(/#\w+/g) || [],
              word_count: lastAIMessage.content.split(/\s+/).length,
              character_count: lastAIMessage.content.length,
            });
            onClose(); // Close the AI chat interface
          }
        }
      }
    } catch (error) {
      console.error('Error loading preview:', error);
    }
  }, [userIdentifier, onPostGenerated, onClose]);


  useEffect(() => {
    if (userIdentifier) {
      fetchUserSessions();

      // Auto-create a session if none exists
      if (!sessionId) {
        const newSessionId = `session_${uuidv4()}`;
        setSessionId(newSessionId);
        localStorage.setItem('ai_writer_session_id', newSessionId);
      }
    }
  }, [userIdentifier, fetchUserSessions, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = () => {
    const newSessionId = `session_${uuidv4()}`;
    setSessionId(newSessionId);
    localStorage.setItem('ai_writer_session_id', newSessionId);
    setMessages([]);
    setGeneratedPost(null);
    setInput('');
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const now = Date.now();

    if (isProcessing || !input.trim() || (now - lastMessageTime < 1000) || !sessionId) {
      return;
    }

    setLastMessageTime(now);
    setIsProcessing(true);
    setConnectionError(false);

    const messageToSend = input.trim();

    // Build context from configuration
    let contextPrompt = '';
    if (configContext) {
      const contextParts = [];
      if (configContext.topic) contextParts.push(`Topic: ${configContext.topic}`);
      if (configContext.postStyle) contextParts.push(`Style: ${configContext.postStyle}`);
      if (configContext.tonePreference) contextParts.push(`Tone: ${configContext.tonePreference}`);
      if (configContext.targetAudience) contextParts.push(`Target Audience: ${configContext.targetAudience}`);
      if (configContext.context) contextParts.push(`Additional Context: ${configContext.context}`);
      if (configContext.includeStory) contextParts.push('Include a personal story or anecdote');

      if (contextParts.length > 0) {
        contextPrompt = `[Configuration: ${contextParts.join(', ')}]\n\n`;
      }

      // Add viral post reference if provided (for pattern/style only)
      if (configContext.viralPostReference) {
        const viralPostSnippet = configContext.viralPostReference.substring(0, 500);
        contextPrompt += `[VIRAL POST PATTERN REFERENCE - Use ONLY for style/structure/tone, NOT for content]\n${viralPostSnippet}${configContext.viralPostReference.length > 500 ? '...' : ''}\n\n`;
      }
    }

    // Combine context with user message
    const fullMessage = contextPrompt + messageToSend;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: messageToSend, // Show only user's message in UI
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/new_post/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          message: fullMessage, // Send full message with context to backend
          session_id: sessionId,
          user_id: userIdentifier,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response from AI');
      }

      const data = await response.json();

      if (!data || !data.response) {
        throw new Error('Empty response from server');
      }

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: data.response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      console.log('💬 Message sent, fetching sessions...');
      await fetchUserSessions();
      console.log('✅ Sessions refreshed after message send');

      if (data.response.length > 50 && (
        data.response.includes('#') ||
        data.response.includes('?') ||
        data.response.split('\n').length > 5
      )) {
        setGeneratedPost(data.response);
      }

    } catch (error: any) {
      console.error('Error:', error);

      let errorMessageText = 'Sorry, I encountered an error. Please try again.';

      if (error.name === 'AbortError') {
        errorMessageText = 'Request timed out. Please try again.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessageText = 'Cannot connect to the server.';
        setConnectionError(true);
      }

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: errorMessageText,
        isUser: false,
        timestamp: new Date(),
        error: true,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      clearTimeout(timeoutId);
      abortControllerRef.current = null;
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  const handleViewPost = () => {
    if (generatedPost && onPostGenerated) {
      onPostGenerated({
        final_post: generatedPost,
        hashtags: generatedPost.match(/#\w+/g) || [],
        word_count: generatedPost.split(/\s+/).length,
        character_count: generatedPost.length,
      });
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex overflow-hidden">
        {isSidebarOpen && (
          <div className="w-64 bg-gray-50 border-r flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">Chat History</h3>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2">
              <button
                onClick={handleNewChat}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {isLoadingSessions ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : sessions.filter((session) => session.message_count > 0).length === 0 ? (
                <p className="text-sm text-gray-500 text-center p-4">No chat history yet</p>
              ) : (
                sessions
                  .filter((session) => session.message_count > 0)
                  .map((session) => (
                    <div
                      key={session.session_id}
                      className={`p-3 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors ${sessionId === session.session_id ? 'bg-gray-200' : 'bg-white'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          onClick={() => loadSession(session.session_id)}
                          className="flex-1 min-w-0"
                        >
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {session.title || 'Untitled Chat'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.message_count} messages
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              loadPreview(session.session_id);
                            }}
                            className="p-1 hover:bg-blue-100 rounded text-blue-600"
                            title="Preview in editor"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.session_id);
                            }}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div>
                <h2 className="text-xl font-semibold">AI Post Assistant</h2>
                {sessionId && (
                  <p className="text-xs text-gray-500">Session: {sessionId.slice(0, 12)}...</p>
                )}
              </div>
              {connectionError && (
                <span className="flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Connection issue
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onConfigureClick && (
                <button
                  onClick={onConfigureClick}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                  title="Configure post settings"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <Sparkles className="w-10 h-10 mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Start a Conversation</h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Ask me to create a LinkedIn post, or chat about your content ideas!
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${message.isUser
                      ? 'bg-blue-600 text-white'
                      : message.error
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : 'bg-white text-gray-900 shadow-sm'
                      }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    <div className={`text-xs mt-2 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {generatedPost && (
            <div className="bg-blue-50 border-t border-blue-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Post generated!</span>
                </div>
                <button
                  onClick={handleViewPost}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Use This Post
                </button>
              </div>
            </div>
          )}

          <div className="border-t p-4 bg-white">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatInterface;
