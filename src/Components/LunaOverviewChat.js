import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Send, Loader2, Trash2, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import PendingChangesCard from './PendingChangesCard';
import {
  getMilestoneConversation,
  saveMilestoneConversation,
  clearMilestoneConversation,
  updateMilestone,
  createTask,
  updateTask,
  deleteTask
} from '../services/supabaseService';
import { callLunaOverviewStreaming, processToolCall, buildSystemPrompt } from '../services/lunaOverviewService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

/**
 * LunaOverviewChat
 *
 * Embedded chat component for the Goal Overview section.
 * Allows users to chat with Luna about their milestone and
 * have Luna propose modifications with confirmation flow.
 */
const LunaOverviewChat = ({
  milestone,
  tasks = [],
  userContext,
  onMilestoneUpdate,
  onTasksUpdate,
  onRefreshMilestone
}) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load conversation on mount
  useEffect(() => {
    loadConversation();
  }, [milestone?.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const loadConversation = async () => {
    if (!milestone?.id) return;

    try {
      const { data, error } = await getMilestoneConversation(milestone.id);
      if (data?.messages && Array.isArray(data.messages)) {
        // Filter out empty messages and limit to last 50
        const validMessages = data.messages
          .filter(m => m.content && m.content.trim() !== '')
          .slice(-50);
        setMessages(validMessages);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const saveConversation = async (newMessages) => {
    if (!milestone?.id) return;

    try {
      // Keep only last 50 messages
      const messagesToSave = newMessages.slice(-50);
      await saveMilestoneConversation(milestone.id, messagesToSave);
    } catch (err) {
      console.error('Failed to save conversation:', err);
    }
  };

  const handleClearConversation = async () => {
    if (!window.confirm('Clear conversation history with Luna?')) return;

    try {
      await clearMilestoneConversation(milestone.id);
      setMessages([]);
      setPendingChanges([]);
    } catch (err) {
      console.error('Failed to clear conversation:', err);
    }
  };

  const handleSendMessage = async () => {
    const content = inputValue.trim();
    if (!content || isLoading) return;

    // Add user message
    const userMessage = { role: 'user', content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    setStreamingContent('');

    // Build context for tool handlers
    const context = {
      milestone,
      tasks,
      userContext
    };

    // Prepare messages for API (convert to Claude format, filter empty)
    const apiMessages = updatedMessages
      .filter(m => m.content && m.content.trim() !== '')
      .map(m => ({
        role: m.role,
        content: m.content
      }));

    try {
      let fullResponse = '';
      const collectedChanges = [];

      // Use streaming API
      await callLunaOverviewStreaming(apiMessages, context, {
        onChunk: (text) => {
          fullResponse += text;
          setStreamingContent(prev => prev + text);
        },
        onToolCall: (pendingChange) => {
          console.log('Tool call received:', pendingChange);
          // Prevent duplicates by checking type + summary combination
          const isDuplicate = collectedChanges.some(c =>
            c.type === pendingChange.type && c.summary === pendingChange.summary
          );
          if (!isDuplicate) {
            collectedChanges.push(pendingChange);
          }
        },
        onDone: () => {
          // Finalize message
          const assistantMessage = { role: 'assistant', content: fullResponse };
          const finalMessages = [...updatedMessages, assistantMessage];
          setMessages(finalMessages);
          setStreamingContent('');
          setIsLoading(false);

          // Add any pending changes (avoiding duplicates with existing state)
          if (collectedChanges.length > 0) {
            setPendingChanges(prev => {
              const newChanges = collectedChanges.filter(newChange =>
                !prev.some(existing =>
                  existing.type === newChange.type && existing.summary === newChange.summary
                )
              );
              return [...prev, ...newChanges];
            });
          }

          // Save conversation
          saveConversation(finalMessages);
        },
        onError: (error) => {
          console.error('Streaming error:', error);
          setIsLoading(false);
          setStreamingContent('');

          // Add error message
          const errorMessage = {
            role: 'assistant',
            content: "I'm sorry, I had trouble connecting. Could you try again?"
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      });
    } catch (error) {
      console.error('Chat error:', error);
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Confirmation handlers
  const handleConfirmAll = async () => {
    setIsApplyingChanges(true);

    const results = [];
    const TIMEOUT_MS = 15000; // 15 second timeout per operation

    for (const change of pendingChanges) {
      if (change.status === 'error') continue;

      try {
        if (change.requiresRegeneration) {
          // Handle roadmap regeneration specially
          results.push({ change, success: true, requiresRegeneration: true });
        } else if (change.applyFn) {
          // Execute the apply function with timeout
          const supabaseService = { updateMilestone, createTask, updateTask, deleteTask };

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Operation timed out')), TIMEOUT_MS)
          );

          try {
            const result = await Promise.race([
              change.applyFn(supabaseService),
              timeoutPromise
            ]);
            results.push({ change, success: !result?.error, result });
          } catch (timeoutErr) {
            console.error(`Change ${change.id} timed out or failed:`, timeoutErr);
            results.push({ change, success: false, error: timeoutErr });
          }
        }
      } catch (err) {
        console.error(`Failed to apply change ${change.id}:`, err);
        results.push({ change, success: false, error: err });
      }
    }

    // Update parent state based on results
    const successfulChanges = results.filter(r => r.success);
    if (successfulChanges.length > 0) {
      // Refresh milestone data from database
      if (onRefreshMilestone) {
        try {
          onRefreshMilestone();
        } catch (err) {
          console.error('Failed to refresh milestone:', err);
        }
      }
      // Refresh tasks
      if (onTasksUpdate) {
        try {
          onTasksUpdate();
        } catch (err) {
          console.error('Failed to refresh tasks:', err);
        }
      }
    }

    // Add confirmation message
    const confirmMessage = {
      role: 'assistant',
      content: successfulChanges.length === pendingChanges.length
        ? `Great! I've applied all ${successfulChanges.length} changes. Your milestone has been updated!`
        : `I applied ${successfulChanges.length} of ${pendingChanges.length} changes. Some changes couldn't be applied.`
    };
    const newMessages = [...messages, confirmMessage];
    setMessages(newMessages);
    saveConversation(newMessages);

    // Clear pending changes and reset state
    setPendingChanges([]);
    setIsApplyingChanges(false);
  };

  const handleConfirmOne = async (change) => {
    setIsApplyingChanges(true);
    const TIMEOUT_MS = 15000; // 15 second timeout

    try {
      if (change.applyFn) {
        const supabaseService = { updateMilestone, createTask, updateTask, deleteTask };

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Operation timed out')), TIMEOUT_MS)
        );

        await Promise.race([
          change.applyFn(supabaseService),
          timeoutPromise
        ]);

        // Refresh parent state
        if (onMilestoneUpdate) {
          try { onMilestoneUpdate(); } catch (e) { console.error(e); }
        }
        if (onTasksUpdate) {
          try { onTasksUpdate(); } catch (e) { console.error(e); }
        }
      }

      // Remove this change from pending
      setPendingChanges(prev => prev.filter(c => c.id !== change.id));

      // Add confirmation message
      const confirmMessage = {
        role: 'assistant',
        content: `Done! ${change.summary.replace(':', ' has been updated:')}`
      };
      const newMessages = [...messages, confirmMessage];
      setMessages(newMessages);
      saveConversation(newMessages);
    } catch (err) {
      console.error('Failed to apply change:', err);
      // Remove the failed change and notify user
      setPendingChanges(prev => prev.filter(c => c.id !== change.id));
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I couldn't apply that change. ${err.message === 'Operation timed out' ? 'The operation took too long.' : 'Please try again.'}`
      };
      const newMessages = [...messages, errorMessage];
      setMessages(newMessages);
      saveConversation(newMessages);
    }

    setIsApplyingChanges(false);
  };

  const handleRejectAll = () => {
    setPendingChanges([]);
    // Also reset applying state in case it was stuck
    setIsApplyingChanges(false);
    setIsLoading(false);

    // Add rejection message
    const rejectMessage = {
      role: 'assistant',
      content: "No problem! I've cancelled those changes. Is there something else you'd like me to help with?"
    };
    const newMessages = [...messages, rejectMessage];
    setMessages(newMessages);
    saveConversation(newMessages);
  };

  const handleRejectOne = (change) => {
    setPendingChanges(prev => prev.filter(c => c.id !== change.id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 overflow-hidden"
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900">Chat with Luna</h3>
            <p className="text-xs text-gray-600">Ask about your goal or request changes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingChanges.length > 0 && (
            <span className="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
              {pendingChanges.length} pending
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4">
              {/* Pending Changes Card */}
              <PendingChangesCard
                pendingChanges={pendingChanges}
                onConfirmAll={handleConfirmAll}
                onConfirmOne={handleConfirmOne}
                onRejectAll={handleRejectAll}
                onRejectOne={handleRejectOne}
                isApplying={isApplyingChanges}
              />

              {/* Messages Container */}
              <div className="bg-white rounded-xl p-3 max-h-[350px] min-h-[200px] overflow-y-auto mb-3 border border-purple-100">
                {messages.length === 0 && !streamingContent && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <MessageCircle className="w-10 h-10 text-purple-300 mb-3" />
                    <p className="text-gray-600 text-sm">
                      Ask Luna anything about your goal!
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Try: "How am I doing on my budget?" or "Add a task for venue research"
                    </p>
                  </div>
                )}

                {/* Message List */}
                {messages.map((msg, idx) => (
                  <ChatMessage key={idx} message={msg} />
                ))}

                {/* Streaming Message */}
                {streamingContent && (
                  <ChatMessage
                    message={{ role: 'assistant', content: streamingContent }}
                    isStreaming
                  />
                )}

                {/* Loading indicator (before streaming starts) */}
                {isLoading && !streamingContent && (
                  <div className="flex gap-2 py-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-purple-50 rounded-xl px-3 py-2">
                      <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Luna anything..."
                  disabled={isLoading || isApplyingChanges}
                  className="flex-1 px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading || isApplyingChanges}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-sm transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
                {messages.length > 0 && (
                  <button
                    onClick={handleClearConversation}
                    disabled={isLoading || isApplyingChanges}
                    className="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Clear conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Typewriter Text Component for natural typing effect
 */
const TypewriterText = ({ text, isStreaming }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef(null);

  const CHARS_PER_TICK = 2;
  const TICK_INTERVAL = 20;

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (currentIndex < text.length) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          const nextIndex = Math.min(prev + CHARS_PER_TICK, text.length);
          setDisplayedText(text.slice(0, nextIndex));
          if (nextIndex >= text.length) {
            clearInterval(intervalRef.current);
          }
          return nextIndex;
        });
      }, TICK_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, currentIndex]);

  useEffect(() => {
    if (!isStreaming && text.length > 0) {
      setDisplayedText(text);
      setCurrentIndex(text.length);
    }
  }, [isStreaming, text]);

  return (
    <>
      {displayedText}
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 ml-0.5 bg-purple-500 animate-pulse rounded-sm" />
      )}
    </>
  );
};

/**
 * Individual chat message component
 */
const ChatMessage = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 py-2 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[80%] px-3 py-2 rounded-xl ${
          isUser
            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
            : 'bg-purple-50 border border-purple-100'
        }`}
      >
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'text-white' : 'text-gray-800'}`}>
          {isUser ? (
            message.content
          ) : isStreaming ? (
            <TypewriterText text={message.content} isStreaming={isStreaming} />
          ) : (
            message.content
          )}
        </p>
      </div>
      {isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
};

export default LunaOverviewChat;
