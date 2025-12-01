import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
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
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load Luna conversation:', err);
      setMessages([]);
    }
  };

  // Save conversation to database
  const saveConversation = async (newMessages) => {
    if (!currentMilestone?.id) return;
    try {
      const messagesToSave = newMessages.slice(-50);
      await saveMilestoneConversation(currentMilestone.id, messagesToSave);
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
    } catch (err) {
      console.error('Failed to clear Luna conversation:', err);
    }
  };

  // Send message to Luna
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

    try {
      let fullResponse = '';
      const collectedChanges = [];

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
        onDone: () => {
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

          saveConversation(finalMessages);
        },
        onError: (error) => {
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
      console.error('Luna chat error:', error);
      setIsLoading(false);
      setStreamingContent('');
    }
  }, [messages, isLoading, currentMilestone, currentTasks, userContext]);

  // Confirm all pending changes
  const confirmAllChanges = useCallback(async () => {
    setIsApplyingChanges(true);
    const results = [];

    for (const change of pendingChanges) {
      if (change.status === 'error') continue;

      try {
        if (change.requiresRegeneration) {
          results.push({ change, success: true, requiresRegeneration: true });
        } else if (change.applyFn) {
          const supabaseService = { updateMilestone, createTask, updateTask, deleteTask };
          const result = await change.applyFn(supabaseService);
          results.push({ change, success: !result.error, result });
        }
      } catch (err) {
        console.error(`Failed to apply change ${change.id}:`, err);
        results.push({ change, success: false, error: err });
      }
    }

    const successfulChanges = results.filter(r => r.success);

    // Trigger refresh callbacks
    if (successfulChanges.length > 0) {
      if (refreshCallbacks.current.onRefreshMilestone) {
        refreshCallbacks.current.onRefreshMilestone();
      }
      if (refreshCallbacks.current.onTasksUpdate) {
        refreshCallbacks.current.onTasksUpdate();
      }
    }

    // Add confirmation message
    const confirmMessage = {
      role: 'assistant',
      content: successfulChanges.length === pendingChanges.length
        ? `Done! I've applied all ${successfulChanges.length} changes. Your milestone has been updated.`
        : `I applied ${successfulChanges.length} of ${pendingChanges.length} changes. Some changes couldn't be applied.`
    };
    const newMessages = [...messages, confirmMessage];
    setMessages(newMessages);
    saveConversation(newMessages);

    setPendingChanges([]);
    setIsApplyingChanges(false);
  }, [pendingChanges, messages]);

  // Confirm single change
  const confirmChange = useCallback(async (change) => {
    setIsApplyingChanges(true);

    try {
      if (change.applyFn) {
        const supabaseService = { updateMilestone, createTask, updateTask, deleteTask };
        await change.applyFn(supabaseService);

        if (refreshCallbacks.current.onMilestoneUpdate) {
          refreshCallbacks.current.onMilestoneUpdate();
        }
        if (refreshCallbacks.current.onTasksUpdate) {
          refreshCallbacks.current.onTasksUpdate();
        }
      }

      setPendingChanges(prev => prev.filter(c => c.id !== change.id));

      const confirmMessage = {
        role: 'assistant',
        content: `Done! ${change.summary.replace(':', ' has been updated:')}`
      };
      const newMessages = [...messages, confirmMessage];
      setMessages(newMessages);
      saveConversation(newMessages);
    } catch (err) {
      console.error('Failed to apply change:', err);
    }

    setIsApplyingChanges(false);
  }, [messages]);

  // Reject all changes
  const rejectAllChanges = useCallback(() => {
    setPendingChanges([]);

    const rejectMessage = {
      role: 'assistant',
      content: "No problem! I've cancelled those changes. Is there something else you'd like me to help with?"
    };
    const newMessages = [...messages, rejectMessage];
    setMessages(newMessages);
    saveConversation(newMessages);
  }, [messages]);

  // Reject single change
  const rejectChange = useCallback((change) => {
    setPendingChanges(prev => prev.filter(c => c.id !== change.id));
  }, []);

  /**
   * Add pending changes from any component (including LunaOverviewChat)
   * This enables shared pending changes state across all Luna interfaces
   * FAANG-level: Deduplication, validation, and merge logic
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
