import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Target, TrendingUp, CheckCircle, Clock,
  DollarSign, FileText, Lightbulb, AlertTriangle, MessageCircle, Calendar
} from 'lucide-react';
import OverviewSection from './OverviewSection';
import BudgetAllocation from './BudgetAllocation';
import StepsList from '../StepsList';
import AIActionSteps from './AIActionSteps';
import TipsSection from '../TipsSection';
import ChallengesSection from '../ChallengesSection';
import AIChallenges from './AIChallenges';
import CostBreakdown from '../CostBreakdown';
import IntelligentCostBreakdown from './IntelligentCostBreakdown';
import ChatPanel from '../ChatPanel';
import TimelineView from './TimelineView';
import { callClaude } from '../services/claudeAPI';

const DeepDivePage = ({
  milestone,
  onBack,
  onUpdateMilestone,
  roadmapId,
  chatProps,
  userContext
}) => {
  const [activeSection, setActiveSection] = useState('overview');

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Send chat message to Claude
  const sendChatMessage = async (userMessage) => {
    // Add user message to chat
    const newUserMessage = { role: 'user', content: userMessage };
    setChatMessages(prev => [...prev, newUserMessage]);
    setIsChatLoading(true);

    try {
      // Build context-aware system prompt
      const systemPrompt = `You are Luna, an empathetic and intelligent AI relationship advisor helping couples achieve their milestones.

CURRENT MILESTONE CONTEXT:
- Goal: ${milestone?.title || 'Unknown'}
- Description: ${milestone?.description || 'Not provided'}
- Budget: ${milestone?.budget_amount ? `$${milestone?.budget_amount}` : 'Not set'}
- Timeline: ${milestone?.duration || 'Not specified'}
- Partners: ${userContext?.partner1 || 'Partner 1'} and ${userContext?.partner2 || 'Partner 2'}
- Location: ${userContext?.location || 'Not specified'}

Your role is to:
1. Provide specific, actionable advice tailored to THIS milestone
2. Ask thoughtful follow-up questions to understand their situation better
3. Help them overcome challenges and make decisions
4. Be empathetic, encouraging, and supportive
5. Draw connections between their goals and practical next steps

Keep responses concise but helpful (2-4 paragraphs max).`;

      // Call Claude with conversation history
      const response = await callClaude(
        [...chatMessages, newUserMessage],
        {
          systemPrompt,
          maxTokens: 1500,
          temperature: 0.8
        }
      );

      // Add Luna's response to chat
      const lunaMessage = { role: 'assistant', content: response };
      setChatMessages(prev => [...prev, lunaMessage]);
    } catch (error) {
      console.error('Error calling Claude:', error);
      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please make sure the backend server is running (npm run backend) and try again."
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Navigation items
  const navItems = [
    { id: 'overview', icon: Target, label: 'Overview', color: '#C084FC' },
    { id: 'timeline', icon: Calendar, label: 'Timeline & Roadmap', color: '#EC4899' },
    { id: 'budget', icon: DollarSign, label: 'Budget & Savings', color: '#10B981' },
    { id: 'cost', icon: FileText, label: 'Cost Breakdown', color: '#F59E0B' },
    { id: 'steps', icon: CheckCircle, label: 'Action Steps', color: '#3B82F6' },
    { id: 'tips', icon: Lightbulb, label: 'Expert Tips', color: '#F59E0B' },
    { id: 'challenges', icon: AlertTriangle, label: 'Challenges', color: '#EF4444' },
    { id: 'chat', icon: MessageCircle, label: 'Chat with Luna', color: '#8B5CF6' }
  ];

  // Calculate progress
  const calculateProgress = () => {
    if (!milestone) return 0;

    // Multi-dimensional progress
    const taskProgress = milestone.tasks?.length > 0
      ? (milestone.tasks.filter(t => t.completed).length / milestone.tasks.length) * 100
      : 0;

    const budgetProgress = milestone.budget_amount > 0
      ? ((milestone.allocated || 0) / milestone.budget_amount) * 100
      : 0;

    // Weighted average (50% tasks, 50% budget)
    return ((taskProgress + budgetProgress) / 2).toFixed(0);
  };

  const progress = calculateProgress();

  // Get active nav item
  const activeNav = navItems.find(item => item.id === activeSection);

  return (
    <div className="min-h-screen animated-gradient-bg">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 glass-card-strong border-b border-white/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button and title */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card-light hover:glass-card transition-all"
                style={{color: '#2B2B2B'}}
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">Back</span>
              </motion.button>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{color: '#2B2B2B'}}>
                  {milestone?.title}
                </h1>
                {milestone?.description && (
                  <p className="text-sm mt-1" style={{color: '#2B2B2B', opacity: 0.7}}>
                    {milestone.description}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Progress indicator */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <div className="text-sm font-medium" style={{color: '#2B2B2B', opacity: 0.7}}>
                  Overall Progress
                </div>
                <div className="text-3xl font-bold" style={{color: '#C084FC'}}>
                  {progress}%
                </div>
              </div>

              {/* Circular progress */}
              <div className="relative w-16 h-16">
                <svg className="transform -rotate-90 w-16 h-16">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="rgba(192, 132, 252, 0.2)"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="url(#gradient)"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${(progress / 100) * 176} 176`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#C084FC" />
                      <stop offset="100%" stopColor="#F8C6D0" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold" style={{color: '#C084FC'}}>
                    {progress}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar Navigation */}
          <div className="w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-32 space-y-2">
              <div className="glass-card rounded-2xl p-4 mb-6">
                <h3 className="text-sm font-semibold mb-3" style={{color: '#2B2B2B', opacity: 0.7}}>
                  NAVIGATE
                </h3>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all ${
                        isActive
                          ? 'glass-card shadow-lg'
                          : 'glass-card-light hover:glass-card'
                      }`}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{color: isActive ? item.color : '#2B2B2B'}}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{color: isActive ? '#2B2B2B' : '#2B2B2B', opacity: isActive ? 1 : 0.7}}
                      >
                        {item.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Quick Stats */}
              <div className="glass-card rounded-2xl p-4">
                <h3 className="text-sm font-semibold mb-3" style={{color: '#2B2B2B', opacity: 0.7}}>
                  QUICK STATS
                </h3>
                <div className="space-y-3">
                  {milestone?.budget_amount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{color: '#2B2B2B', opacity: 0.7}}>Budget</span>
                      <span className="text-sm font-bold" style={{color: '#10B981'}}>
                        ${milestone.budget_amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {milestone?.duration && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{color: '#2B2B2B', opacity: 0.7}}>Timeline</span>
                      <span className="text-sm font-semibold" style={{color: '#2B2B2B'}}>
                        {milestone.duration}
                      </span>
                    </div>
                  )}
                  {milestone?.tasks && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{color: '#2B2B2B', opacity: 0.7}}>Tasks</span>
                      <span className="text-sm font-semibold" style={{color: '#2B2B2B'}}>
                        {milestone.tasks.filter(t => t.completed).length} / {milestone.tasks.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Navigation - Horizontal Tabs */}
          <div className="lg:hidden w-full mb-6">
            <div className="glass-card rounded-2xl p-2 overflow-x-auto">
              <div className="flex gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveSection(item.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                        isActive
                          ? 'text-white'
                          : 'glass-card-light'
                      }`}
                      style={isActive ? {background: 'linear-gradient(135deg, #C084FC, #F8C6D0)'} : {color: '#2B2B2B'}}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Section Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                {activeNav && (
                  <>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{background: `${activeNav.color}20`}}
                    >
                      <activeNav.icon className="w-6 h-6" style={{color: activeNav.color}} />
                    </div>
                    <h2 className="text-3xl font-bold" style={{color: '#2B2B2B'}}>
                      {activeNav.label}
                    </h2>
                  </>
                )}
              </div>
            </div>

            {/* Content with Animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeSection === 'overview' && (
                  <OverviewSection
                    deepDiveData={milestone}
                    userContext={userContext}
                    onCustomize={() => console.log('Customize')}
                  />
                )}

                {activeSection === 'timeline' && (
                  <TimelineView
                    milestone={milestone}
                    onUpdateProgress={(progress) => {
                      console.log('Timeline progress updated:', progress);
                    }}
                  />
                )}

                {activeSection === 'budget' && roadmapId && (
                  <BudgetAllocation
                    milestone={milestone}
                    roadmapId={roadmapId}
                    onProgressUpdate={(progress) => {
                      console.log('Progress updated:', progress);
                    }}
                  />
                )}

                {activeSection === 'cost' && (
                  <IntelligentCostBreakdown
                    milestone={milestone}
                    roadmapId={roadmapId}
                    userLocation={userContext?.location}
                  />
                )}

                {activeSection === 'steps' && (
                  <AIActionSteps
                    milestone={milestone}
                    userContext={userContext}
                  />
                )}

                {activeSection === 'tips' && (
                  <TipsSection
                    expertTips={milestone?.expertTips}
                    commonMistakes={milestone?.commonMistakes}
                    successMetrics={milestone?.successMetrics}
                  />
                )}

                {activeSection === 'challenges' && (
                  <AIChallenges
                    milestone={milestone}
                    userContext={userContext}
                  />
                )}

                {activeSection === 'chat' && (
                  <div className="glass-card rounded-2xl p-6">
                    <ChatPanel
                      chatMessages={chatMessages}
                      sendChatMessage={sendChatMessage}
                      isChatLoading={isChatLoading}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepDivePage;
