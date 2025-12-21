import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
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

/**
 * Luna Context
 *
 * Provides global state for Luna chat across the entire app.
 * Manages conversations, pending changes, and panel visibility.
 *
 * FIX: Added visibility change handler to preserve conversation state
 * when the user switches tabs. This prevents data loss during:
 * - Supabase token refresh (triggered by tab focus)
 * - Browser background throttling
 * - Any unexpected component remounts
 */
const LunaContext = createContext(null);

export const useLuna = () => {
  const context = useContext(LunaContext);
  if (!context) {
    throw new Error('useLuna must be used within a LunaProvider');
  }
  return context;
};

export const LunaProvider = ({ children }) => {
  // Panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  // Pending changes
  const [pendingChanges, setPendingChanges] = useState([]);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);

  // Current context (milestone, tasks, user)
  const [currentMilestone, setCurrentMilestone] = useState(null);
  const [currentTasks, setCurrentTasks] = useState([]);
  const [userContext, setUserContext] = useState(null);

  // Callbacks for refreshing data after changes
  const refreshCallbacks = useRef({
    onMilestoneUpdate: null,
    onTasksUpdate: null,
    onRefreshMilestone: null
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // VISIBILITY CHANGE HANDLER - Preserve conversation on tab switch
  //
  // This is CRITICAL for preventing conversation loss when:
  // 1. User switches to another app/tab
  // 2. Supabase refreshes the auth token on tab focus
  // 3. Browser throttles the tab in background
  //
  // Strategy:
  // - Save messages to database when tab becomes hidden (proactive save)
  // - Use refs to track state across potential remounts
  // - Restore from database if state is lost
  // ═══════════════════════════════════════════════════════════════════════════

  // Refs to preserve state across potential remounts
  const messagesRef = useRef(messages);
  const currentMilestoneRef = useRef(currentMilestone);
  const pendingChangesRef = useRef(pendingChanges);
  const lastSavedRef = useRef(null); // Track when we last saved
  const isHiddenRef = useRef(false); // Track if tab is hidden

  // Keep refs in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    currentMilestoneRef.current = currentMilestone;
  }, [currentMilestone]);

  useEffect(() => {
    pendingChangesRef.current = pendingChanges;
  }, [pendingChanges]);

  // Visibility change handler
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Tab is becoming hidden - save conversation state proactively
        isHiddenRef.current = true;

        if (currentMilestoneRef.current?.id && messagesRef.current.length > 0) {
          // Only save if we have unsaved changes (messages changed since last save)
          const messagesJson = JSON.stringify(messagesRef.current);
          if (lastSavedRef.current !== messagesJson) {
            console.log('🔒 Tab hidden - saving Luna conversation to database');
            try {
              const messagesToSave = messagesRef.current.slice(-50);
              await saveMilestoneConversation(currentMilestoneRef.current.id, messagesToSave);
              lastSavedRef.current = messagesJson;
              console.log('✅ Luna conversation saved before tab switch');
            } catch (err) {
              console.error('❌ Failed to save Luna conversation on tab switch:', err);
            }
          }
        }
      } else {
        // Tab is becoming visible again
        const wasHidden = isHiddenRef.current;
        isHiddenRef.current = false;

        if (wasHidden && currentMilestoneRef.current?.id) {
          console.log('👁️ Tab visible again - verifying Luna conversation state');

          // Check if state might have been lost (messages array empty but we had messages before)
          // This can happen if Supabase token refresh caused a remount
          if (messagesRef.current.length === 0 && lastSavedRef.current) {
            console.log('⚠️ Potential state loss detected - reloading conversation from database');
            try {
              const { data, error } = await getMilestoneConversation(currentMilestoneRef.current.id);
              if (data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
                const validMessages = data.messages
                  .filter(m => m.content && m.content.trim() !== '')
                  .slice(-50);
                setMessages(validMessages);
                console.log('✅ Luna conversation restored from database');
              }
            } catch (err) {
              console.error('❌ Failed to restore Luna conversation:', err);
            }
          }
        }
      }
    };

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also handle page unload/beforeunload for additional safety
    const handleBeforeUnload = () => {
      if (currentMilestoneRef.current?.id && messagesRef.current.length > 0) {
        // Use sendBeacon for reliable async save during unload
        // Note: This is a best-effort save, may not always succeed
        const messagesToSave = messagesRef.current.slice(-50);
        console.log('🚪 Page unloading - attempting to save Luna conversation');
        // We can't use async functions in beforeunload, so we just log
        // The visibility change handler should have already saved
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // Empty deps - we use refs to access current state

  // ═══════════════════════════════════════════════════════════════════════════
  // PERIODIC AUTO-SAVE - Save conversation every 30 seconds during active chat
  //
  // This provides additional protection for long conversations.
  // Only saves if there are unsaved changes (messages changed since last save).
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      // Only auto-save if we have messages and a milestone
      if (currentMilestoneRef.current?.id && messagesRef.current.length > 0) {
        const messagesJson = JSON.stringify(messagesRef.current);
        // Only save if messages have changed since last save
        if (lastSavedRef.current !== messagesJson) {
          console.log('💾 Auto-saving Luna conversation...');
          try {
            const messagesToSave = messagesRef.current.slice(-50);
            await saveMilestoneConversation(currentMilestoneRef.current.id, messagesToSave);
            lastSavedRef.current = messagesJson;
            console.log('✅ Luna conversation auto-saved');
          } catch (err) {
            console.error('❌ Auto-save failed:', err);
          }
        }
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, []);

  // Open Luna panel
  const openPanel = useCallback(() => {
    setIsPanelOpen(true);
    setIsMinimized(false);
  }, []);

  // Close Luna panel
  const closePanel = useCallback(() => {
    // If there are pending changes, don't close automatically
    if (pendingChanges.length > 0) {
      return false; // Indicate that close was prevented
    }
    setIsPanelOpen(false);
    return true;
  }, [pendingChanges]);

  // Force close (with pending changes warning handled externally)
  const forceClosePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  // Toggle panel
  const togglePanel = useCallback(() => {
    if (isPanelOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }, [isPanelOpen, closePanel, openPanel]);

  // Set Luna context (called when viewing a milestone)
  const setLunaContext = useCallback((milestone, tasks, user, callbacks = {}) => {
    setCurrentMilestone(milestone);
    setCurrentTasks(tasks || []);
    setUserContext(user);
    refreshCallbacks.current = {
      onMilestoneUpdate: callbacks.onMilestoneUpdate || null,
      onTasksUpdate: callbacks.onTasksUpdate || null,
      onRefreshMilestone: callbacks.onRefreshMilestone || null
    };

    // Load conversation for this milestone
    if (milestone?.id) {
      loadConversation(milestone.id);
    }
  }, []);

  // Clear Luna context (when leaving milestone view)
  const clearLunaContext = useCallback(() => {
    // Don't clear if there are pending changes
    if (pendingChanges.length > 0) {
      return false;
    }
    setCurrentMilestone(null);
    setCurrentTasks([]);
    setMessages([]);
    setPendingChanges([]);
    lastSavedRef.current = null; // Reset last saved tracking
    return true;
  }, [pendingChanges]);

  // Load conversation from database
  const loadConversation = async (milestoneId) => {
    try {
      const { data, error } = await getMilestoneConversation(milestoneId);
      if (data?.messages && Array.isArray(data.messages)) {
        const validMessages = data.messages
          .filter(m => m.content && m.content.trim() !== '')
          .slice(-50);
        setMessages(validMessages);
        // Set lastSavedRef to the loaded messages so we don't immediately try to save
        lastSavedRef.current = JSON.stringify(validMessages);
      } else {
        setMessages([]);
        lastSavedRef.current = null;
      }
    } catch (err) {
      console.error('Failed to load Luna conversation:', err);
      setMessages([]);
      lastSavedRef.current = null;
    }
  };

  // Save conversation to database
  const saveConversation = async (newMessages) => {
    if (!currentMilestone?.id) return;
    try {
      const messagesToSave = newMessages.slice(-50);
      await saveMilestoneConversation(currentMilestone.id, messagesToSave);
      // Update lastSavedRef to track that we saved these messages
      lastSavedRef.current = JSON.stringify(messagesToSave);
    } catch (err) {
      console.error('Failed to save Luna conversation:', err);
    }
  };

  // Clear conversation
  const clearConversation = async () => {
    if (!currentMilestone?.id) return;
    try {
      await clearMilestoneConversation(currentMilestone.id);
      setMessages([]);
      setPendingChanges([]);
      lastSavedRef.current = null; // Reset last saved tracking
    } catch (err) {
      console.error('Failed to clear Luna conversation:', err);
    }
  };

  // Send message to Luna with timeout protection
  const sendMessage = useCallback(async (content) => {
    if (!content?.trim() || isLoading || !currentMilestone) return;

    const userMessage = { role: 'user', content: content.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    setStreamingContent('');

    const context = {
      milestone: currentMilestone,
      tasks: currentTasks,
      userContext
    };

    const apiMessages = updatedMessages
      .filter(m => m.content && m.content.trim() !== '')
      .map(m => ({ role: m.role, content: m.content }));

    // Timeout protection - 45 seconds max for streaming
    const STREAMING_TIMEOUT = 45000;
    let timeoutId = null;
    let streamingCompleted = false;

    const handleTimeout = () => {
      if (!streamingCompleted) {
        console.error('Luna streaming timeout - forcing recovery');
        setIsLoading(false);
        setStreamingContent('');
        const errorMessage = {
          role: 'assistant',
          content: "I'm sorry, the response took too long. Please try again."
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    };

    try {
      let fullResponse = '';
      const collectedChanges = [];

      // Set timeout
      timeoutId = setTimeout(handleTimeout, STREAMING_TIMEOUT);

      await callLunaOverviewStreaming(apiMessages, context, {
        onChunk: (text) => {
          fullResponse += text;
          setStreamingContent(prev => prev + text);
        },
        onToolCall: (pendingChange) => {
          const isDuplicate = collectedChanges.some(c =>
            c.type === pendingChange.type && c.summary === pendingChange.summary
          );
          if (!isDuplicate) {
            collectedChanges.push(pendingChange);
          }
        },
        onDone: async () => {
          streamingCompleted = true;
          if (timeoutId) clearTimeout(timeoutId);

          const assistantMessage = { role: 'assistant', content: fullResponse };
          const finalMessages = [...updatedMessages, assistantMessage];
          setMessages(finalMessages);
          setStreamingContent('');
          setIsLoading(false);

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

          await saveConversation(finalMessages);
        },
        onError: (error) => {
          streamingCompleted = true;
          if (timeoutId) clearTimeout(timeoutId);

          console.error('Luna streaming error:', error);
          setIsLoading(false);
          setStreamingContent('');

          const errorMessage = {
            role: 'assistant',
            content: "I'm sorry, I had trouble connecting. Could you try again?"
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      });
    } catch (error) {
      streamingCompleted = true;
      if (timeoutId) clearTimeout(timeoutId);

      console.error('Luna chat error:', error);
      setIsLoading(false);
      setStreamingContent('');
    }
  }, [messages, isLoading, currentMilestone, currentTasks, userContext]);

  // Confirm all pending changes
  const confirmAllChanges = useCallback(async () => {
    setIsApplyingChanges(true);
    const results = [];
    const failedChangeDescriptions = [];

    for (const change of pendingChanges) {
      // Record error-type changes as failed instead of silently skipping
      if (change.status === 'error') {
        results.push({ change, success: false, error: 'Validation error' });
        failedChangeDescriptions.push(change.summary || 'Unknown error');
        continue;
      }

      try {
        if (change.requiresRegeneration) {
          results.push({ change, success: true, requiresRegeneration: true });
        } else if (change.applyFn) {
          const supabaseService = { updateMilestone, createTask, updateTask, deleteTask };
          const result = await change.applyFn(supabaseService);
          // Fix: Check both result existence and error property properly
          const hasError = !result || result.error;
          if (hasError) {
            failedChangeDescriptions.push(change.summary || 'Unknown change');
          }
          results.push({ change, success: !hasError, result });
        } else {
          // Handle changes without applyFn - don't silently skip
          results.push({ change, success: false, error: 'No apply function defined' });
          failedChangeDescriptions.push(change.summary || 'Unknown change');
        }
      } catch (err) {
        console.error(`Failed to apply change ${change.id}:`, err);
        results.push({ change, success: false, error: err });
        failedChangeDescriptions.push(change.summary || 'Unknown change');
      }
    }

    const successfulChanges = results.filter(r => r.success);

    // Trigger refresh callbacks
    if (successfulChanges.length > 0) {
      // Check if any changes were local-only (demo mode)
      const hasLocalOnlyChanges = successfulChanges.some(r => r.result?.isLocalOnly);

      if (hasLocalOnlyChanges) {
        // For local-only changes (non-authenticated users), update state directly
        // Merge all successful changes into the current milestone
        let updatedMilestone = { ...currentMilestone };
        for (const r of successfulChanges) {
          if (r.result?.data) {
            updatedMilestone = { ...updatedMilestone, ...r.result.data };
          }
        }
        // Call onMilestoneUpdate directly with merged data
        if (refreshCallbacks.current.onMilestoneUpdate) {
          refreshCallbacks.current.onMilestoneUpdate(updatedMilestone);
        }
        // Also update local context
        setCurrentMilestone(updatedMilestone);
      } else {
        // For authenticated users, refresh from database
        if (refreshCallbacks.current.onRefreshMilestone) {
          refreshCallbacks.current.onRefreshMilestone();
        }
      }

      if (refreshCallbacks.current.onTasksUpdate) {
        refreshCallbacks.current.onTasksUpdate();
      }
    }

    // Add confirmation message with details about failures
    let confirmContent;
    if (successfulChanges.length === pendingChanges.length) {
      confirmContent = `Done! I've applied all ${successfulChanges.length} changes. Your milestone has been updated.`;
    } else if (successfulChanges.length === 0) {
      confirmContent = `I couldn't apply any of the ${pendingChanges.length} changes. ${failedChangeDescriptions.length > 0 ? 'Issues: ' + failedChangeDescriptions.join(', ') : 'Please try again.'}`;
    } else {
      confirmContent = `I applied ${successfulChanges.length} of ${pendingChanges.length} changes. Some couldn't be applied: ${failedChangeDescriptions.join(', ')}`;
    }

    const confirmMessage = {
      role: 'assistant',
      content: confirmContent
    };
    const newMessages = [...messages, confirmMessage];
    setMessages(newMessages);
    await saveConversation(newMessages);

    setPendingChanges([]);
    setIsApplyingChanges(false);
  }, [pendingChanges, messages, currentMilestone]);

  // Confirm single change
  const confirmChange = useCallback(async (change) => {
    setIsApplyingChanges(true);

    try {
      if (change.applyFn) {
        const supabaseService = { updateMilestone, createTask, updateTask, deleteTask };
        const result = await change.applyFn(supabaseService);

        // Check if the operation failed
        if (!result || result.error) {
          throw new Error(result?.error?.message || 'Database operation failed');
        }

        // Check if this was a local-only change (demo mode)
        if (result.isLocalOnly) {
          // For local-only changes, update state directly
          if (result.data && refreshCallbacks.current.onMilestoneUpdate) {
            const updatedMilestone = { ...currentMilestone, ...result.data };
            refreshCallbacks.current.onMilestoneUpdate(updatedMilestone);
            setCurrentMilestone(updatedMilestone);
          }
        } else {
          // For authenticated users, refresh from database
          if (refreshCallbacks.current.onRefreshMilestone) {
            refreshCallbacks.current.onRefreshMilestone();
          }
        }

        if (refreshCallbacks.current.onTasksUpdate) {
          refreshCallbacks.current.onTasksUpdate();
        }
      } else {
        throw new Error('This change cannot be applied');
      }

      setPendingChanges(prev => prev.filter(c => c.id !== change.id));

      const confirmMessage = {
        role: 'assistant',
        content: `Done! ${change.summary.replace(':', ' has been updated:')}`
      };
      const newMessages = [...messages, confirmMessage];
      setMessages(newMessages);
      await saveConversation(newMessages);
    } catch (err) {
      console.error('Failed to apply change:', err);
      // Add error message to chat so user sees feedback
      const errorMessage = {
        role: 'assistant',
        content: `I couldn't apply that change: ${err.message || 'Unknown error'}. Please try again or ask me to help in a different way.`
      };
      const newMessages = [...messages, errorMessage];
      setMessages(newMessages);
      await saveConversation(newMessages);
    }

    setIsApplyingChanges(false);
  }, [messages, currentMilestone]);

  // Reject all changes
  const rejectAllChanges = useCallback(async () => {
    setPendingChanges([]);

    const rejectMessage = {
      role: 'assistant',
      content: "No problem! I've cancelled those changes. Is there something else you'd like me to help with?"
    };
    const newMessages = [...messages, rejectMessage];
    setMessages(newMessages);
    await saveConversation(newMessages);
  }, [messages]);

  // Reject single change
  const rejectChange = useCallback((change) => {
    setPendingChanges(prev => prev.filter(c => c.id !== change.id));
  }, []);

  /**
   * Add pending changes from any component (LunaChatPanel, etc.)
   * This enables shared pending changes state across all Luna interfaces
   * Includes deduplication, validation, and merge logic
   */
  const addPendingChanges = useCallback((newChanges) => {
    if (!Array.isArray(newChanges) || newChanges.length === 0) return;

    setPendingChanges(prev => {
      // Filter out duplicates by checking type + summary
      const uniqueNewChanges = newChanges.filter(newChange =>
        !prev.some(existing =>
          existing.type === newChange.type && existing.summary === newChange.summary
        )
      );
      return [...prev, ...uniqueNewChanges];
    });
  }, []);

  /**
   * Clear all pending changes (used when conversation is cleared)
   */
  const clearPendingChanges = useCallback(() => {
    setPendingChanges([]);
    setIsApplyingChanges(false);
  }, []);

  // Quick action - send a pre-built message
  const sendQuickAction = useCallback((action) => {
    const quickMessages = {
      'add-task': "I'd like to add a new task to my milestone.",
      'update-budget': "Can you help me review and update my budget?",
      'show-progress': "How am I doing with my progress?",
      'whats-next': "What should I focus on next?",
      'help-prioritize': "Can you help me prioritize my tasks?"
    };

    const message = quickMessages[action];
    if (message) {
      sendMessage(message);
    }
  }, [sendMessage]);

  // Open Luna panel and send a message
  const openWithMessage = useCallback((message) => {
    openPanel();
    // Small delay to ensure panel is open before sending
    setTimeout(() => {
      if (message) {
        sendMessage(message);
      }
    }, 300);
  }, [openPanel, sendMessage]);

  // Expose global function for components that can't use the hook
  React.useEffect(() => {
    window.openLunaWithMessage = openWithMessage;
    return () => {
      delete window.openLunaWithMessage;
    };
  }, [openWithMessage]);

  const value = {
    // Panel state
    isPanelOpen,
    isMinimized,
    openPanel,
    closePanel,
    forceClosePanel,
    togglePanel,
    setIsMinimized,

    // Chat state
    messages,
    inputValue,
    setInputValue,
    isLoading,
    streamingContent,
    sendMessage,
    clearConversation,
    sendQuickAction,

    // Pending changes (shared across all Luna components)
    pendingChanges,
    isApplyingChanges,
    addPendingChanges,
    clearPendingChanges,
    confirmAllChanges,
    confirmChange,
    rejectAllChanges,
    rejectChange,

    // Context
    currentMilestone,
    currentTasks,
    userContext,
    setLunaContext,
    clearLunaContext,
    hasContext: !!currentMilestone
  };

  return (
    <LunaContext.Provider value={value}>
      {children}
    </LunaContext.Provider>
  );
};

export default LunaContext;
