import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Trash2, Sparkles, Check, Loader2,
  ArrowRight, AlertTriangle, ChevronDown, ChevronUp,
  MessageCircle, Zap
} from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

/**
 * Luna Chat Panel
 *
 * A beautiful slide-out panel for chatting with Luna.
 * Design: Warm editorial aesthetic - cream backgrounds,
 * deep charcoal text, golden accents, soft shadows.
 */
const LunaChatPanel = () => {
  const {
    isPanelOpen,
    forceClosePanel,
    closePanel,
    messages,
    inputValue,
    setInputValue,
    isLoading,
    streamingContent,
    sendMessage,
    clearConversation,
    sendQuickAction,
    pendingChanges,
    isApplyingChanges,
    confirmAllChanges,
    confirmChange,
    rejectAllChanges,
    rejectChange,
    currentMilestone,
    hasContext
  } = useLuna();

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [pendingExpanded, setPendingExpanded] = useState(true);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent]);

  // Focus input when panel opens
  useEffect(() => {
    if (isPanelOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isPanelOpen]);

  // Handle close attempt
  const handleClose = () => {
    if (pendingChanges.length > 0) {
      setShowCloseWarning(true);
    } else {
      forceClosePanel();
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle send
  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
    }
  };

  // Escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isPanelOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isPanelOpen, pendingChanges.length]);

  if (!hasContext) return null;

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-stone-900/20 z-[9990]"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#FDFCF8] shadow-2xl z-[9995] flex flex-col"
            style={{
              boxShadow: '-20px 0 60px -20px rgba(28, 25, 23, 0.15)'
            }}
          >
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-stone-200 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>
                      Luna
                    </h2>
                    <p className="text-xs text-stone-500">
                      {currentMilestone?.title ? `Helping with: ${currentMilestone.title.slice(0, 30)}...` : 'Your AI assistant'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {messages.length > 0 && (
                    <button
                      onClick={clearConversation}
                      disabled={isLoading || isApplyingChanges}
                      className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors disabled:opacity-50"
                      title="Clear conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                    title="Close (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Pending Changes Section - Collapsible */}
            <AnimatePresence>
              {pendingChanges.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex-shrink-0 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 overflow-hidden"
                >
                  {/* Header */}
                  <button
                    onClick={() => setPendingExpanded(!pendingExpanded)}
                    className="w-full px-5 py-3 flex items-center justify-between hover:bg-amber-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-stone-900">
                        {pendingChanges.length} Pending {pendingChanges.length === 1 ? 'Change' : 'Changes'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!pendingExpanded && (
                        <span className="text-xs text-amber-700">Click to review</span>
                      )}
                      {pendingExpanded ? (
                        <ChevronUp className="w-4 h-4 text-stone-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-stone-500" />
                      )}
                    </div>
                  </button>

                  {/* Changes List */}
                  <AnimatePresence>
                    {pendingExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 space-y-2 max-h-[200px] overflow-y-auto">
                          {pendingChanges.map((change, idx) => (
                            <PendingChangeItem
                              key={change.id}
                              change={change}
                              index={idx}
                              onConfirm={() => confirmChange(change)}
                              onReject={() => rejectChange(change)}
                              isApplying={isApplyingChanges}
                            />
                          ))}
                        </div>

                        {/* Bulk Actions */}
                        <div className="px-5 pb-4 flex gap-2">
                          <button
                            onClick={confirmAllChanges}
                            disabled={isApplyingChanges}
                            className="flex-1 px-4 py-2.5 bg-stone-900 text-white font-medium rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                          >
                            {isApplyingChanges ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Applying...
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                Confirm All
                              </>
                            )}
                          </button>
                          <button
                            onClick={rejectAllChanges}
                            disabled={isApplyingChanges}
                            className="px-4 py-2.5 bg-stone-200 text-stone-700 font-medium rounded-xl hover:bg-stone-300 disabled:opacity-50 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.length === 0 && !streamingContent && (
                <EmptyState onQuickAction={sendQuickAction} />
              )}

              {messages.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} />
              ))}

              {streamingContent && (
                <ChatMessage
                  message={{ role: 'assistant', content: streamingContent }}
                  isStreaming
                />
              )}

              {isLoading && !streamingContent && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-stone-100">
                    <div className="flex gap-1.5">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-amber-400 rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                        className="w-2 h-2 bg-amber-500 rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                        className="w-2 h-2 bg-amber-600 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 bg-white border-t border-stone-200 px-5 py-4">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Luna anything..."
                  disabled={isLoading || isApplyingChanges}
                  className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-stone-900 placeholder-stone-400 disabled:opacity-50 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading || isApplyingChanges}
                  className="px-4 py-3 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* Quick hint */}
              <p className="text-xs text-stone-400 mt-2 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-stone-100 rounded text-stone-500 font-mono">Enter</kbd> to send
              </p>
            </div>
          </motion.div>

          {/* Close Warning Modal */}
          <AnimatePresence>
            {showCloseWarning && (
              <CloseWarningModal
                pendingCount={pendingChanges.length}
                onStay={() => setShowCloseWarning(false)}
                onDiscard={() => {
                  rejectAllChanges();
                  setShowCloseWarning(false);
                  forceClosePanel();
                }}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Empty State Component
 */
const EmptyState = ({ onQuickAction }) => {
  const quickActions = [
    { id: 'add-task', label: 'Add a task', icon: '✓' },
    { id: 'update-budget', label: 'Review budget', icon: '💰' },
    { id: 'whats-next', label: "What's next?", icon: '🎯' },
    { id: 'help-prioritize', label: 'Prioritize', icon: '📊' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full py-8"
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-4">
        <MessageCircle className="w-7 h-7 text-amber-600" />
      </div>

      <h3 className="text-lg font-semibold text-stone-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
        How can I help?
      </h3>
      <p className="text-sm text-stone-500 text-center max-w-[260px] mb-6">
        Ask me anything about your goal, or try one of these:
      </p>

      <div className="grid grid-cols-2 gap-2 w-full max-w-[280px]">
        {quickActions.map((action) => (
          <motion.button
            key={action.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onQuickAction(action.id)}
            className="px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-left hover:border-amber-300 hover:bg-amber-50 transition-all group"
          >
            <span className="text-base mr-2">{action.icon}</span>
            <span className="text-sm text-stone-700 group-hover:text-stone-900">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

/**
 * Typewriter Text Component
 * Progressively reveals text character by character for a natural typing effect
 */
const TypewriterText = ({ text, isStreaming }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef(null);

  // Typing speed: characters per interval (faster = more chars per tick)
  const CHARS_PER_TICK = 2; // Type 2 characters at a time for smooth speed
  const TICK_INTERVAL = 20; // 20ms between ticks = ~100 chars/second

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // If we have more text to reveal
    if (currentIndex < text.length) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          const nextIndex = Math.min(prev + CHARS_PER_TICK, text.length);
          setDisplayedText(text.slice(0, nextIndex));

          // Stop interval when we've caught up
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

  // When text grows (new chunk), we already have the right currentIndex
  // The effect will start typing from where we left off
  useEffect(() => {
    // Only update if text has grown (streaming)
    if (text.length > currentIndex) {
      // Continue typing - effect above handles this
    }
  }, [text.length]);

  // When streaming ends, ensure we show all text
  useEffect(() => {
    if (!isStreaming && text.length > 0) {
      setDisplayedText(text);
      setCurrentIndex(text.length);
    }
  }, [isStreaming, text]);

  return (
    <>
      {displayedText}
      {isStreaming && currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0.4] }}
          transition={{ duration: 0.4, repeat: Infinity }}
          className="inline-block w-0.5 h-4 bg-amber-500 ml-0.5 align-middle"
        />
      )}
      {isStreaming && currentIndex >= text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-0.5 h-4 bg-amber-500 ml-0.5 align-middle"
        />
      )}
    </>
  );
};

/**
 * Chat Message Component
 */
const ChatMessage = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`max-w-[80%] px-4 py-3 ${
          isUser
            ? 'bg-stone-900 text-white rounded-2xl rounded-tr-md shadow-lg'
            : 'bg-white text-stone-800 rounded-2xl rounded-tl-md shadow-sm border border-stone-100'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {isUser ? (
            // User messages: show immediately
            message.content
          ) : isStreaming ? (
            // Assistant streaming: use typewriter effect
            <TypewriterText text={message.content} isStreaming={isStreaming} />
          ) : (
            // Assistant completed: show full text
            message.content
          )}
        </p>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-9 h-9 rounded-xl bg-stone-200 flex items-center justify-center flex-shrink-0">
          <span className="text-stone-600 text-sm font-semibold">You</span>
        </div>
      )}
    </motion.div>
  );
};

/**
 * Pending Change Item
 */
const PendingChangeItem = ({ change, index, onConfirm, onReject, isApplying }) => {
  const getTypeStyle = (type) => {
    const styles = {
      title_update: 'bg-rose-100 text-rose-700',
      description_update: 'bg-violet-100 text-violet-700',
      budget_update: 'bg-emerald-100 text-emerald-700',
      date_update: 'bg-sky-100 text-sky-700',
      add_phase: 'bg-teal-100 text-teal-700',
      modify_phase: 'bg-amber-100 text-amber-700',
      remove_phase: 'bg-red-100 text-red-700',
      add_task: 'bg-green-100 text-green-700',
      update_task: 'bg-blue-100 text-blue-700',
      delete_task: 'bg-rose-100 text-rose-700',
      regenerate_roadmap: 'bg-indigo-100 text-indigo-700'
    };
    return styles[type] || 'bg-stone-100 text-stone-700';
  };

  const getTypeLabel = (type) => {
    const labels = {
      title_update: 'Title',
      description_update: 'Description',
      budget_update: 'Budget',
      date_update: 'Date',
      add_phase: 'New Phase',
      modify_phase: 'Edit Phase',
      remove_phase: 'Remove Phase',
      add_task: 'New Task',
      update_task: 'Edit Task',
      delete_task: 'Delete Task',
      regenerate_roadmap: 'Regenerate'
    };
    return labels[type] || type;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl p-3 border border-amber-100 hover:border-amber-200 transition-colors"
    >
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0">{change.icon}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getTypeStyle(change.type)}`}>
              {getTypeLabel(change.type)}
            </span>
          </div>
          <p className="text-sm text-stone-800 font-medium truncate">{change.summary}</p>
          {change.reason && (
            <p className="text-xs text-stone-500 mt-0.5 truncate">{change.reason}</p>
          )}
        </div>

        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={onConfirm}
            disabled={isApplying}
            className="p-1.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors"
            title="Confirm"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onReject}
            disabled={isApplying}
            className="p-1.5 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 disabled:opacity-50 transition-colors"
            title="Reject"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Close Warning Modal
 */
const CloseWarningModal = ({ pendingCount, onStay, onDiscard }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-stone-900/50 z-[9999] flex items-center justify-center p-4"
    onClick={onStay}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Pending Changes</h3>
          <p className="text-sm text-stone-500">
            {pendingCount} {pendingCount === 1 ? 'change' : 'changes'} awaiting approval
          </p>
        </div>
      </div>

      <p className="text-stone-600 mb-6">
        You have pending changes that haven't been confirmed. Would you like to review them before closing?
      </p>

      <div className="flex gap-3">
        <button
          onClick={onStay}
          className="flex-1 px-4 py-3 bg-stone-900 text-white font-medium rounded-xl hover:bg-stone-800 transition-colors"
        >
          Review Changes
        </button>
        <button
          onClick={onDiscard}
          className="px-4 py-3 bg-stone-100 text-stone-700 font-medium rounded-xl hover:bg-stone-200 transition-colors"
        >
          Discard
        </button>
      </div>
    </motion.div>
  </motion.div>
);

export default LunaChatPanel;
