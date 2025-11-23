# Comprehensive Solution: Intelligent Adaptive Onboarding System

**Date:** 2025-11-17
**Status:** Architecture Designed - Ready for Implementation
**Philosophy:** "Smart gates, not hard limits" - Intelligence over hardcoded paths

---

## Executive Summary

This document outlines the complete architecture for an intelligent, adaptive onboarding system that:

1. **Eliminates the speed vs flexibility tradeoff** - Users get fast roadmaps without sacrificing personalization
2. **Uses AI agents for decision-making** - Not hardcoded logic, but intelligent adaptation
3. **Preserves Luna everywhere** - She never disappears, always available for refinement
4. **Learns from user patterns** - Gets smarter over time
5. **Handles multi-goal complexity** - Intelligent orchestration of competing objectives

---

## Core Problems Solved

### Problem 1: Slow Time-to-Roadmap ❌
**Current:** 5-10 minutes of back-and-forth before seeing roadmap
**Root Cause:** Luna asks questions sequentially even when user provides comprehensive info upfront
**Solution:** Onboarding Orchestrator Agent analyzes input richness and routes intelligently

### Problem 2: Binary Mode Thinking ❌
**Current:** Either "fast templates" OR "slow Luna chat"
**Root Cause:** No intelligence layer to adapt based on user's information richness
**Solution:** Three adaptive paths (Express/Hybrid/Conversational) chosen automatically

### Problem 3: Roadmap Not Saved ❌
**Current:** `finalize_roadmap()` doesn't persist to database
**Root Cause:** Function only returns success message, no database operation
**Solution:** Enhanced function that saves complete roadmap with all milestones

### Problem 4: Luna Disappears ❌
**Current:** After roadmap creation, Luna is gone
**Root Cause:** No persistent chat widget in roadmap view
**Solution:** LunaWidget component embedded in all roadmap views with full context

### Problem 5: Limited Customization ❌
**Current:** Once roadmap is created, hard to modify
**Root Cause:** No agent designed for roadmap refinement
**Solution:** Persistent Luna with roadmap modification tools

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  NEW AGENT: Onboarding Orchestrator (Meta-Agent)       │
│  ────────────────────────────────────────────────────   │
│  • Analyzes user input for information richness         │
│  • Calculates completeness score (0-100%)              │
│  • Determines optimal path (Express/Hybrid/Converse)   │
│  • Extracts goals, budget, timeline, preferences       │
│  • Makes AI-driven routing decisions                   │
└─────────────────────────────────────────────────────────┘
                         ↓
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ EXPRESS PATH │  │ HYBRID PATH  │  │ CONVERSE PATH│
│              │  │              │  │              │
│ 90%+ info    │  │ 50-90% info  │  │ <50% info    │
│ Complete     │  │ Some gaps    │  │ Exploratory  │
│              │  │              │  │              │
│ Skip to gen  │  │ 2-3 targeted │  │ Full Luna    │
│ ~30 seconds  │  │ questions    │  │ discovery    │
│              │  │ ~2 minutes   │  │ ~5 minutes   │
└──────────────┘  └──────────────┘  └──────────────┘
                         ↓
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
┌──────────────────────────────────────────────────┐
│  ENHANCED: Roadmap Architect Agent               │
│  ────────────────────────────────────────────    │
│  • Validation-First Hybrid approach (existing)   │
│  • Multi-goal orchestration with Claude         │
│  • Conflict detection & resolution              │
│  • Budget allocation optimization               │
│  • Timeline compression analysis                │
│  • DATABASE SAVE (NEW)                          │
└──────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────┐
│  NEW: Persistent Luna Widget in Roadmap View    │
│  ────────────────────────────────────────────    │
│  • Floating chat button (bottom-right)          │
│  • Full roadmap context awareness               │
│  • Conversation history persisted to DB         │
│  • Can modify roadmap, adjust timeline/budget   │
│  • Available in ALL views (overview, tasks,     │
│    budget, milestone details)                   │
└──────────────────────────────────────────────────┘
```

---

## NEW AGENT: Onboarding Orchestrator

### File Location
`src/services/agents/onboardingOrchestratorAgent.js`

### Purpose
Meta-agent that intelligently analyzes user input and routes to the optimal onboarding path. **This eliminates hardcoded if/else logic** in favor of AI-driven decision-making.

### Core Functions

#### 1. `analyzeOnboardingContext(userInput, existingContext)`

**Input:**
```javascript
{
  userInput: "Alex and Sam want to buy home in Seattle for $800k, timeline 18 months",
  existingContext: {
    partner1: "Alex",
    partner2: "Sam"
  }
}
```

**Output:**
```javascript
{
  informationCompleteness: 0.92, // 92% complete

  detectedGoals: [
    {
      description: "Buy a home in Seattle",
      goalType: "home",
      budget: { amount: 800000, currency: "USD", confidence: 0.95 },
      timeline: { months: 18, confidence: 0.9 },
      location: { text: "Seattle", confidence: 1.0 },
      priority: "critical"
    }
  ],

  extractedContext: {
    budget: { amount: 800000, confidence: 0.95 },
    timeline: { months: 18, confidence: 0.9 },
    location: { text: "Seattle", confidence: 1.0 },
    preferences: [] // None detected
  },

  missingInfo: ["down payment target", "neighborhood preferences"],
  missingInfoImpact: [
    {
      item: "down payment target",
      impact: "low",
      canAssume: true,
      defaultValue: 160000, // 20% of price
      reasoning: "Standard 20% down payment is industry norm"
    }
  ],

  recommendedPath: "express", // express | hybrid | conversational

  reasoning: "User provided comprehensive information upfront: specific goal, location, budget, and timeline. Missing information (down payment) has low impact and reasonable defaults exist. Recommend express path with smart assumptions.",

  confidence: 0.92,

  estimatedTimeToRoadmap: "30 seconds"
}
```

**Implementation:**
```javascript
export const analyzeOnboardingContext = async (userInput, existingContext = {}) => {
  // Use Claude to analyze the richness of information
  const analysis = await analyzeWithClaude(userInput, existingContext);

  // Calculate completeness score
  const completeness = calculateCompleteness(analysis.extractedContext);

  // Determine path
  const path = determineOptimalPath(completeness, analysis);

  return {
    informationCompleteness: completeness,
    detectedGoals: analysis.goals,
    extractedContext: analysis.context,
    missingInfo: analysis.gaps,
    missingInfoImpact: analysis.gapImpact,
    recommendedPath: path,
    reasoning: analysis.reasoning,
    confidence: analysis.confidence,
    estimatedTimeToRoadmap: estimateTime(path)
  };
};
```

#### 2. `determineOptimalPath(completeness, analysis)`

**Logic (AI-driven, not hardcoded):**
```javascript
export const determineOptimalPath = (completeness, analysis) => {
  // Use Claude to make nuanced decision
  // Not just "if completeness > 0.9" but contextual

  const factors = {
    completeness,
    goalComplexity: analysis.goals.length > 1 ? 'high' : 'low',
    userHistory: analysis.userPreferences?.preferredPath,
    gapSeverity: analysis.missingInfoImpact.filter(g => g.impact === 'high').length,
    canMakeAssumptions: analysis.missingInfoImpact.every(g => g.canAssume)
  };

  // Call Claude for decision
  const decision = await claudeDecideOnPath(factors);

  return decision.path; // 'express' | 'hybrid' | 'conversational'
};
```

#### 3. `generateSmartQuestions(missingInfo, context)`

**For Hybrid Path:**
```javascript
export const generateSmartQuestions = async (missingInfo, context) => {
  // NOT generic questions
  // CONTEXTUAL questions based on what's missing and why it matters

  const questions = await claudeGenerateQuestions({
    missing: missingInfo,
    context: context,
    maxQuestions: 3, // Keep it short
    prioritize: 'impact' // Ask about high-impact gaps first
  });

  return questions.map(q => ({
    question: q.text,
    reason: q.impact,
    suggestedAnswers: q.options,
    canSkip: q.optional,
    defaultValue: q.smartDefault
  }));
};
```

---

## Enhanced: Goal Discovery Agent

### File Location
`src/services/agents/goalDiscoveryAgent.js`

### Enhancements

#### 1. Information Richness Detector

**NEW FUNCTION:**
```javascript
export const analyzeInformationRichness = (message) => {
  const patterns = {
    multipleGoals: /(?:and|also|then|plus|,)/gi,
    specificNumbers: /\$\d+|€\d+|£\d+|\d+\s*months?/gi,
    specificLocations: /in [A-Z][a-z]+/g,
    temporalMarkers: /by|in|within|before|after/gi,
    priorities: /important|critical|must|need|priority/gi,
    constraints: /budget|limited|maximum|minimum/gi
  };

  const detailScore = Object.entries(patterns).reduce((score, [key, pattern]) => {
    const matches = message.match(pattern);
    return score + (matches ? matches.length : 0);
  }, 0);

  return {
    score: Math.min(detailScore / 10, 1), // Normalize to 0-1
    hasNumbers: patterns.specificNumbers.test(message),
    hasLocation: patterns.specificLocations.test(message),
    hasTiming: patterns.temporalMarkers.test(message),
    complexity: detailScore > 5 ? 'high' : detailScore > 2 ? 'medium' : 'low'
  };
};
```

#### 2. Adaptive Question Generation

**ENHANCED FUNCTION:**
```javascript
export const determineNextQuestions = async (context, userPreferences = {}) => {
  const readiness = calculateReadiness(context);

  // NEW: Use Claude to assess if we can proceed
  const claudeAssessment = await assessReadinessWithClaude(context);

  // NEW: Consider user preference for speed
  const userWantsSpeed = userPreferences.preferExpressPath;

  if (readiness >= 0.9 || (readiness >= 0.7 && userWantsSpeed)) {
    return {
      ready: true,
      confidence: claudeAssessment.confidence,
      message: "I have everything I need to create your roadmap!"
    };
  }

  // If not ready, generate TARGETED questions (not generic)
  const gaps = identifyHighImpactGaps(context);
  const smartQuestions = await generateContextualQuestions(gaps, context);

  return {
    ready: false,
    questions: smartQuestions.slice(0, 3), // Max 3 questions
    canSkipToGeneration: readiness >= 0.5, // Allow user to proceed anyway
    missingInfoWarning: claudeAssessment.warnings
  };
};
```

---

## Enhanced: Roadmap Architect Agent

### File Location
`src/services/agents/roadmapArchitectAgent.js`

### Critical Enhancement: Database Save

**CURRENT BUG (line 1119 in lunaService.js):**
```javascript
function handleFinalizeRoadmap(input, context) {
  return {
    success: true,
    ready: true,
    // NO DATABASE SAVE! ❌
  };
}
```

**FIXED VERSION:**
```javascript
async function handleFinalizeRoadmap(input, context) {
  const { createRoadmap, createMilestones } = await import('./supabaseService');

  try {
    // Prepare roadmap data
    const roadmapData = {
      user_id: context.userId,
      partner1_name: context.partner1,
      partner2_name: context.partner2,
      goal_type: context.goalType,
      title: input.roadmap_title,
      location: context.location,
      budget: input.total_cost,
      timeline_months: input.total_timeline_months,
      status: 'active',
      onboarding_path: context.onboardingPath, // Track which path was used
      metadata: {
        generationMethod: context.generationMethod,
        validationInsights: context.validationInsights,
        questionCount: context.questionCount || 0
      }
    };

    // Save roadmap to database
    const savedRoadmap = await createRoadmap(roadmapData);

    // Save all milestones
    if (context.generatedMilestones && context.generatedMilestones.length > 0) {
      await createMilestones(savedRoadmap.id, context.generatedMilestones);
    }

    // Create initial conversation record
    const { createConversation } = await import('./supabaseService');
    const conversation = await createConversation(
      savedRoadmap.id,
      'onboarding',
      context
    );

    return {
      success: true,
      ready: true,
      roadmap_id: savedRoadmap.id,
      conversation_id: conversation.id,
      roadmap_url: `/roadmap/${savedRoadmap.id}`,
      summary: input.summary,
      milestones_created: context.generatedMilestones?.length || 0
    };
  } catch (error) {
    console.error('Error saving roadmap:', error);
    return {
      success: false,
      error: error.message,
      // Still return data so Luna can inform user
      summary: input.summary
    };
  }
}
```

### Multi-Goal Orchestration

**NEW FUNCTION:**
```javascript
export const analyzeMultiGoalWithClaude = async (goals, totalBudget, location) => {
  const prompt = `Analyze these multiple goals for a couple:

GOALS:
${goals.map((g, i) => `${i + 1}. ${g.description} (${g.timeline} months, $${g.budget})`).join('\n')}

Total Budget: $${totalBudget}
Location: ${location}

Analyze for:
1. Timeline conflicts (can goals run in parallel or must be sequential?)
2. Budget competition (is $${totalBudget} sufficient for all goals?)
3. Dependencies (must one goal complete before another starts?)
4. Resource conflicts (attention, money, time)
5. Optimal sequencing strategy

Return JSON:
{
  "conflicts": [
    {
      "type": "timeline" | "budget" | "dependency" | "resource",
      "severity": "low" | "medium" | "high",
      "description": "...",
      "resolution": "..."
    }
  ],
  "budgetAnalysis": {
    "total": ${totalBudget},
    "allocated": { "goal1": 50000, "goal2": 30000 },
    "buffer": 20000,
    "feasibility": "feasible" | "tight" | "insufficient"
  },
  "timelineStrategy": {
    "approach": "parallel" | "sequential" | "hybrid",
    "reasoning": "...",
    "criticalPath": "..."
  },
  "recommendations": [
    "..."
  ]
}`;

  const analysis = await callClaudeForAnalysis(prompt);
  return analysis;
};
```

---

## NEW Component: Persistent Luna Widget

### File Location
`src/Components/LunaWidget.js`

### Features
1. **Floating button** when collapsed (bottom-right corner)
2. **Expandable chat panel** when active
3. **Full roadmap context** passed to Luna
4. **Conversation persistence** to database
5. **Real-time roadmap updates** when Luna makes changes

### Implementation

```javascript
import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { converseWithLuna } from '../services/lunaService';
import { getActiveConversation, addMessageToConversation } from '../services/supabaseService';

const LunaWidget = ({ roadmapId, roadmapContext, onRoadmapUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load conversation history on mount
  useEffect(() => {
    loadConversationHistory();
  }, [roadmapId]);

  const loadConversationHistory = async () => {
    try {
      const { data: conversation } = await getActiveConversation(roadmapId);
      if (conversation) {
        setConversationId(conversation.id);
        setMessages(conversation.messages || []);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = { role: 'user', content: input.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Build context for Luna
      const lunaContext = {
        ...roadmapContext,
        mode: 'assistant', // vs 'onboarding'
        roadmap_id: roadmapId,
        conversation_id: conversationId
      };

      // Call Luna with full roadmap context
      const response = await converseWithLuna(
        [...messages, userMessage],
        lunaContext
      );

      const assistantMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: Date.now(),
        metadata: response.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Persist to database
      if (conversationId) {
        await addMessageToConversation(conversationId, userMessage);
        await addMessageToConversation(conversationId, assistantMessage);
      }

      // If Luna made changes to roadmap, trigger refresh
      if (response.roadmap_updated) {
        onRoadmapUpdate();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {!isExpanded ? (
          // Floating Button
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsExpanded(true)}
            className="relative bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all"
          >
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </motion.button>
        ) : (
          // Expanded Chat Panel
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold">Chat with Luna</span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="hover:bg-white/20 rounded p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <p className="mb-2">👋 Hi! I'm here to help with your roadmap.</p>
                  <p className="text-sm">Ask me anything or request changes!</p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask Luna anything..."
                  className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isTyping}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className="bg-purple-500 text-white rounded-lg px-4 py-2 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LunaWidget;
```

### Integration in TogetherForward

```javascript
// In TogetherForward.js
import LunaWidget from './LunaWidget';

// Inside component
const [roadmapContext, setRoadmapContext] = useState(null);

useEffect(() => {
  // Build context for Luna
  setRoadmapContext({
    milestones: roadmap,
    totalBudget: calculateTotalBudget(roadmap),
    spentBudget: calculateSpentBudget(expenses),
    completionPercentage: calculateCompletion(roadmap),
    currentStage: getCurrentStage(roadmap),
    recentActivity: getRecentActivity(),
    partner1: coupleData.partner1,
    partner2: coupleData.partner2,
    location: coupleData.location
  });
}, [roadmap, expenses]);

// In render
return (
  <div className="min-h-screen">
    {/* Existing roadmap UI */}

    {/* NEW: Persistent Luna */}
    {roadmapContext && (
      <LunaWidget
        roadmapId={currentRoadmapId}
        roadmapContext={roadmapContext}
        onRoadmapUpdate={refreshRoadmap}
      />
    )}
  </div>
);
```

---

## Database Schema Changes

### Migration File
`supabase_migrations/005_conversation_persistence.sql`

```sql
-- =====================================================
-- MIGRATION 005: Conversation Persistence System
-- =====================================================

-- 1. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  -- Type and Stage
  conversation_type TEXT CHECK (conversation_type IN (
    'onboarding', 'roadmap_refinement', 'milestone_detail', 'general'
  )) DEFAULT 'general',
  stage TEXT DEFAULT 'active', -- 'onboarding', 'roadmap_creation', 'active_roadmap'

  -- Messages stored as JSONB array
  messages JSONB DEFAULT '[]'::jsonb,

  -- Context Snapshot
  context JSONB,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Preferences Table (for learning)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,

  -- Onboarding Patterns
  preferred_onboarding_path TEXT CHECK (preferred_onboarding_path IN (
    'express', 'hybrid', 'conversational', 'auto'
  )) DEFAULT 'auto',

  average_information_richness NUMERIC DEFAULT 0.5,
  prefers_skip_questions BOOLEAN DEFAULT false,

  -- Interaction Patterns
  luna_usage_frequency TEXT DEFAULT 'medium',
  preferred_communication_style TEXT DEFAULT 'conversational',

  -- Context Preferences
  default_currency TEXT DEFAULT 'USD',
  default_location TEXT,

  -- Metadata
  onboarding_count INTEGER DEFAULT 0,
  last_onboarding_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enhance Roadmaps Table
ALTER TABLE public.roadmaps
ADD COLUMN IF NOT EXISTS active_conversation_id UUID REFERENCES public.conversations(id),
ADD COLUMN IF NOT EXISTS onboarding_path TEXT,
ADD COLUMN IF NOT EXISTS onboarding_metadata JSONB;

-- 4. Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Conversations
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE
  USING (user_id = auth.uid());

-- 6. RLS Policies for User Preferences
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- 7. Indexes for Performance
CREATE INDEX idx_conversations_roadmap_id ON public.conversations(roadmap_id);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_active ON public.conversations(is_active) WHERE is_active = true;
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX idx_conversations_type ON public.conversations(conversation_type);

-- 8. Updated_at Trigger for Conversations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Function to get active conversation
CREATE OR REPLACE FUNCTION get_active_conversation(p_roadmap_id UUID)
RETURNS TABLE (
  id UUID,
  messages JSONB,
  context JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.messages, c.context, c.created_at
  FROM public.conversations c
  WHERE c.roadmap_id = p_roadmap_id
    AND c.is_active = true
    AND c.user_id = auth.uid()
  ORDER BY c.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Function to create conversation
CREATE OR REPLACE FUNCTION create_conversation(
  p_roadmap_id UUID,
  p_type TEXT,
  p_context JSONB
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  INSERT INTO public.conversations (
    roadmap_id,
    user_id,
    conversation_type,
    context
  ) VALUES (
    p_roadmap_id,
    auth.uid(),
    p_type,
    p_context
  )
  RETURNING id INTO v_conversation_id;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.conversations IS 'Stores Luna conversation history for roadmaps';
COMMENT ON TABLE public.user_preferences IS 'Tracks user patterns for adaptive onboarding';
```

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1) - PRIORITY

**Day 1-2: Fix Database Save Bug**
- [ ] Update `handleFinalizeRoadmap()` in lunaService.js
- [ ] Add Supabase service functions for roadmap creation
- [ ] Test roadmap persistence
- [ ] Verify milestones are saved correctly

**Day 3-4: Database Schema**
- [ ] Create migration 005_conversation_persistence.sql
- [ ] Run migration on development database
- [ ] Test RLS policies
- [ ] Verify indexes are working

**Day 5: Create Onboarding Orchestrator Agent**
- [ ] File: `src/services/agents/onboardingOrchestratorAgent.js`
- [ ] Implement `analyzeOnboardingContext()`
- [ ] Implement `determineOptimalPath()`
- [ ] Test with various input scenarios

### Phase 2: Adaptive Paths (Week 2)

**Day 1-2: Enhance Goal Discovery Agent**
- [ ] Add `analyzeInformationRichness()`
- [ ] Update `determineNextQuestions()` to be adaptive
- [ ] Add Claude assessment for readiness
- [ ] Test with express/hybrid/conversational scenarios

**Day 3-4: Landing Page Integration**
- [ ] Hook Onboarding Orchestrator into LandingPageNew.js
- [ ] Implement path routing logic
- [ ] Add UI for express path ("Generating now...")
- [ ] Add UI for hybrid path ("Just 2 questions...")
- [ ] Test user flows

**Day 5: Express Mode Testing**
- [ ] Test with comprehensive input
- [ ] Test with moderate input
- [ ] Test with sparse input
- [ ] Verify path selection accuracy

### Phase 3: Persistent Luna (Week 3)

**Day 1-2: Create LunaWidget Component**
- [ ] File: `src/Components/LunaWidget.js`
- [ ] Floating button UI
- [ ] Expandable chat panel
- [ ] Message display and input
- [ ] Styling and animations

**Day 3: Conversation Persistence**
- [ ] Supabase functions for conversations
- [ ] Load conversation history on mount
- [ ] Save messages on send
- [ ] Context snapshot management

**Day 4-5: TogetherForward Integration**
- [ ] Embed LunaWidget in TogetherForward.js
- [ ] Build roadmap context object
- [ ] Pass context to Luna
- [ ] Handle roadmap updates
- [ ] Test in all views (overview, tasks, budget)

### Phase 4: Multi-Goal Intelligence (Week 4)

**Day 1-2: Roadmap Architect Enhancements**
- [ ] Implement `analyzeMultiGoalWithClaude()`
- [ ] Add conflict detection
- [ ] Budget allocation optimization
- [ ] Timeline orchestration

**Day 3-4: Luna Tools for Roadmap Modification**
- [ ] Add `modify_roadmap` tool
- [ ] Add `adjust_timeline` tool
- [ ] Add `adjust_budget` tool
- [ ] Test roadmap refinement flows

**Day 5: End-to-End Testing**
- [ ] Test complete onboarding flows
- [ ] Test roadmap creation and persistence
- [ ] Test Luna refinement capabilities
- [ ] Bug fixes and polish

---

## Success Metrics

### User Experience
- **Time to First Roadmap**
  - Express path: <60 seconds (target: 30 seconds)
  - Hybrid path: <3 minutes (target: 2 minutes)
  - Conversational path: <10 minutes (target: 5 minutes)

- **Path Distribution**
  - Express: 30-40% of users
  - Hybrid: 40-50% of users
  - Conversational: 10-20% of users

- **Refinement Rate**
  - <20% of users need major roadmap changes (indicates good initial generation)

- **Luna Widget Engagement**
  - >60% of users interact with Luna after roadmap creation
  - Average messages per session: 3-5

### Technical Metrics
- **Orchestrator Accuracy**: >85% correct path selection (validated by user satisfaction)
- **Database Save Success**: 100% (critical)
- **Conversation Persistence**: 99.9% reliable
- **Claude API Latency**: <3s for roadmap generation

---

## Next Steps

1. **Review this comprehensive solution**
2. **Get approval to proceed**
3. **Start with Phase 1, Day 1: Fix database save bug**
4. **Implement in order of priority**
5. **Test thoroughly at each phase**

Ready to implement? 🚀
