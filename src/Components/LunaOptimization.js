import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, ArrowLeft, Sparkles, CheckCircle2, Loader } from 'lucide-react';
import {
  buildOptimizationContext,
  generateSystemPrompt,
  generateOptimizedMilestones
} from '../services/agents/goalOptimizationAgent';

/**
 * LunaOptimization: Conversation with Luna for multi-goal optimization
 *
 * Features:
 * - Rich context with all goal analysis
 * - Smart questioning to understand priorities
 * - Real-time conversation
 * - Optimized milestone generation
 */
const LunaOptimization = ({ orchestrator, userData, onComplete, onBack }) => {
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLunaTyping, setIsLunaTyping] = useState(false);
  const [context, setContext] = useState(null);
  const [optimizationStage, setOptimizationStage] = useState('initial'); // initial, clarifying, optimizing, ready
  const [isCreatingRoadmaps, setIsCreatingRoadmaps] = useState(false); // NEW: Loading state for finalization
  const [creationProgress, setCreationProgress] = useState({ current: 0, total: 0 }); // NEW: Progress tracking
  const [error, setError] = useState(null); // NEW: Error state
  const chatEndRef = useRef(null);

  // API call timeout (15 seconds)
  const API_TIMEOUT = 15000;

  // Build context on mount
  useEffect(() => {
    const ctx = buildOptimizationContext(orchestrator, userData);
    setContext(ctx);

    // Start conversation automatically
    initiateConversation(ctx);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  /**
   * Initiate conversation with Luna
   */
  const initiateConversation = async (ctx) => {
    setIsLunaTyping(true);

    try {
      const systemPrompt = generateSystemPrompt(ctx);

      // Call Luna API
      const response = await callLunaAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Hi Luna! Please help us optimize our roadmap.' }
      ], ctx);

      setConversation([
        { role: 'assistant', content: response.message }
      ]);

      // Update stage if Luna is asking questions
      if (response.message.includes('?')) {
        setOptimizationStage('clarifying');
      }
    } catch (error) {
      console.error('Error initiating Luna conversation:', error);
      setConversation([
        {
          role: 'assistant',
          content: `Hi! 👋 I'm Luna. I can see you want to achieve ${ctx.analysis.totalGoals} amazing goals together! Let me help you create an optimized roadmap.\n\nBefore I create your plan, I have a few questions:\n\n1. Which goal is most important to complete first?\n2. Are you open to adjusting timelines to avoid conflicts?\n3. Do you have existing savings, or should we include financial planning?\n\nLet me know your thoughts!`
        }
      ]);
      setOptimizationStage('clarifying');
    }

    setIsLunaTyping(false);
  };

  /**
   * Send user message to Luna
   */
  const handleSendMessage = async () => {
    if (!userInput.trim() || isLunaTyping) return;

    const userMessage = { role: 'user', content: userInput };
    const newConversation = [...conversation, userMessage];
    setConversation(newConversation);
    setUserInput('');
    setIsLunaTyping(true);

    try {
      // Build messages for API
      const systemPrompt = generateSystemPrompt(context);
      const messages = [
        { role: 'system', content: systemPrompt },
        ...newConversation.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      // Call Luna
      const response = await callLunaAPI(messages, context);

      setConversation([...newConversation, { role: 'assistant', content: response.message }]);

      // Check if Luna is ready to generate roadmap
      if (
        response.message.includes('OPTIMIZED ROADMAP READY') ||
        response.message.includes('create your roadmap') ||
        response.message.includes("Let's finalize") ||
        optimizationStage === 'optimizing'
      ) {
        setOptimizationStage('ready');
      } else if (optimizationStage === 'clarifying' && !response.message.includes('?')) {
        setOptimizationStage('optimizing');
      }
    } catch (error) {
      console.error('Error in Luna conversation:', error);
      setConversation([...newConversation, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Could you tell me again what's most important to you?"
      }]);
    }

    setIsLunaTyping(false);
  };

  /**
   * Call Luna API with timeout (backend)
   */
  const callLunaAPI = async (messages, ctx) => {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch('/api/luna/optimize-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          context: ctx
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Luna API error');
      }

      const data = await response.json();
      return { message: data.message };
    } catch (error) {
      clearTimeout(timeoutId);

      // Log but don't crash - use fallback
      if (error.name === 'AbortError') {
        console.warn('Luna API timed out, using fallback');
      } else {
        console.warn('Luna API unavailable, using fallback:', error.message);
      }

      // Fallback: Simulate Luna response (works offline/demo)
      return simulateLunaResponse(messages, ctx);
    }
  };

  /**
   * Simulate Luna response (fallback for demo)
   */
  const simulateLunaResponse = (messages, ctx) => {
    const lastUserMessage = messages[messages.length - 1]?.content.toLowerCase() || '';

    // If this is the initial message
    if (messages.length <= 2) {
      return {
        message: `Hi! 👋 I can see you want to achieve ${ctx.analysis.totalGoals} amazing goals together:\n\n${ctx.goals.map(g => `• ${g.title} (€${g.estimatedCost.toLocaleString()})`).join('\n')}\n\nI've analyzed your roadmap and found ${ctx.analysis.conflictCount} potential conflicts and ${ctx.analysis.synergyCount} exciting synergies!\n\n**Quick questions to optimize your plan:**\n\n1. Which goal is most urgent for you both?\n2. Are you open to overlapping some goals to save time?\n3. Do you have savings started, or should we build that in?\n\nTell me your thoughts! 💭`
      };
    }

    // If user is answering questions
    if (optimizationStage === 'clarifying') {
      return {
        message: `Perfect! Based on what you've shared, here's my recommendation:\n\n**OPTIMIZED SEQUENCE:**\n${ctx.analysis.optimalOrder.map((g, i) => `${i + 1}. ${g.title} - Start month ${Math.round((i * 12) / ctx.analysis.totalGoals)}`).join('\n')}\n\n**WHY THIS WORKS:**\n• Addresses dependencies (prerequisites completed first)\n• Leverages synergies where goals overlap\n• Spreads budget over time (€${Math.round(ctx.analysis.totalBudget / (ctx.analysis.maxEndMonth / 12)).toLocaleString()}/year average)\n• Reduces ${ctx.analysis.riskLevel} risk through smart phasing\n\n**SHARED MILESTONES:**\nI'll create interconnected tasks where your goals benefit each other!\n\nReady to create your optimized roadmap? 🚀`
      };
    }

    // If ready to generate
    return {
      message: `**OPTIMIZED ROADMAP READY** ✨\n\nI've created a smart roadmap with:\n• ${ctx.analysis.totalGoals} optimized milestones\n• ${ctx.analysis.totalDependencies} interconnected dependencies\n• Timeline-specific insights for each goal\n• Budget allocation strategy\n• Risk mitigation plans\n\nLet's make your dreams happen! 🎯`
    };
  };

  /**
   * Finalize and generate optimized roadmap
   * FAANG-level: Loading state, error handling, progress tracking
   */
  const handleFinalize = async () => {
    setIsCreatingRoadmaps(true);
    setError(null);

    try {
      // Generate optimized milestones with error handling
      let milestones;
      try {
        milestones = generateOptimizedMilestones(context, conversation);
      } catch (genError) {
        console.error('Error generating milestones:', genError);
        // Fallback: Use original goals as milestones
        milestones = context?.goals?.map(goal => ({
          ...goal,
          aiGenerated: true,
          lunaOptimized: true,
          completed: false,
          tasks: goal.tasks || [],
          deepDiveData: {}
        })) || [];
      }

      if (!milestones || milestones.length === 0) {
        throw new Error('No milestones were generated. Please try again.');
      }

      setCreationProgress({ current: 0, total: milestones.length });

      // Add a small delay so user sees the loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      // Return to parent with optimized roadmap
      // Parent (App.js) handles the actual database operations
      await onComplete({
        milestones,
        context,
        conversationHistory: conversation,
        lunaOptimized: true
      });

    } catch (err) {
      console.error('Error finalizing roadmap:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setIsCreatingRoadmaps(false);
    }
    // Note: Don't setIsCreatingRoadmaps(false) on success - component will unmount
  };

  /**
   * Retry after error
   */
  const handleRetry = () => {
    setError(null);
    setOptimizationStage('ready');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Goal Builder
          </button>

          <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 font-serif">
                  Luna - AI Optimization
                </h2>
                <p className="text-sm text-gray-600">
                  {optimizationStage === 'initial' && 'Analyzing your goals...'}
                  {optimizationStage === 'clarifying' && 'Understanding your priorities'}
                  {optimizationStage === 'optimizing' && 'Creating optimized plan'}
                  {optimizationStage === 'ready' && 'Ready to finalize!'}
                </p>
              </div>

              {/* Stage indicator */}
              <div className="flex gap-2">
                {['clarifying', 'optimizing', 'ready'].map((stage, index) => (
                  <div
                    key={stage}
                    className={`w-2 h-2 rounded-full ${
                      optimizationStage === stage || (index === 0 && optimizationStage === 'initial')
                        ? 'bg-purple-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg"
          style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {conversation.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-gray-50 border-2 border-gray-200 text-gray-900'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-semibold text-purple-600">Luna</span>
                      </div>
                    )}
                    <div className="whitespace-pre-line">{message.content}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isLunaTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 text-purple-500 animate-spin" />
                    <span className="text-sm text-gray-600">Luna is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          {optimizationStage !== 'ready' && (
            <div className="border-t-2 border-gray-200 p-4 bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your response..."
                  className="flex-1 bg-white border-2 border-gray-200 rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  disabled={isLunaTyping}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={isLunaTyping || !userInput.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="border-t-2 border-red-200 p-4 bg-red-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-500 text-xl">⚠️</span>
                </div>
                <div>
                  <p className="font-semibold text-red-800">Something went wrong</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading State - Creating Roadmaps */}
          {isCreatingRoadmaps && !error && (
            <div className="border-t-2 border-purple-200 p-6 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-purple-200 border-t-purple-500 animate-spin" />
                  <Sparkles className="w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-purple-800 text-lg">Creating Your Dreams...</p>
                  <p className="text-sm text-purple-600 mt-1">
                    Setting up {creationProgress.total} optimized roadmaps
                  </p>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-purple-100 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3, ease: 'linear' }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  />
                </div>
                <p className="text-xs text-purple-500">This may take a few seconds...</p>
              </div>
            </div>
          )}

          {/* Finalize Button */}
          {optimizationStage === 'ready' && !isCreatingRoadmaps && !error && (
            <div className="border-t-2 border-gray-200 p-4 bg-gradient-to-r from-purple-50 to-pink-50">
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFinalize}
                disabled={isCreatingRoadmaps}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-6 h-6" />
                Create Optimized Roadmap
              </motion.button>
            </div>
          )}
        </div>

        {/* Context Display (for debugging - can be hidden) */}
        {context && (
          <div className="mt-4 text-xs text-gray-500 text-center">
            Optimizing {context.analysis.totalGoals} goals • €{context.analysis.totalBudget.toLocaleString()} total •
            {' '}{context.analysis.conflictCount} conflicts • {context.analysis.synergyCount} synergies
          </div>
        )}
      </div>
    </div>
  );
};

export default LunaOptimization;
