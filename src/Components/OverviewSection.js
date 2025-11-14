import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, MapPin, Clock, DollarSign, TrendingUp, AlertTriangle,
  Lightbulb, Shield, Sparkles, ChevronDown, ChevronUp, Target,
  Users, Heart, CheckCircle2, Loader2
} from 'lucide-react';

const OverviewSection = ({ deepDiveData, userContext, onCustomize }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [enhancedData, setEnhancedData] = useState(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementError, setEnhancementError] = useState(null);

  // AUTO-ENHANCE: If Claude data is missing, fetch it automatically
  useEffect(() => {
    const needsEnhancement = deepDiveData && !deepDiveData.personalizedInsights;

    if (needsEnhancement && !isEnhancing && !enhancedData && !enhancementError) {
      console.log('🔄 Claude insights missing, auto-enhancing deep dive...');
      enhanceDeepDive();
    }
  }, [deepDiveData]);

  const enhanceDeepDive = async () => {
    setIsEnhancing(true);
    setEnhancementError(null);

    try {
      // Build the enhancement request
      const prompt = `Generate personalized insights for this couple's goal:

**Partners:** ${userContext.partner1} and ${userContext.partner2}
**Location:** ${userContext.location}
**Goal:** ${deepDiveData.title}
**Budget:** €${deepDiveData.totalBudget || 'Not specified'}
**Timeline:** ${deepDiveData.timeline_months || deepDiveData.duration}
**Description:** ${deepDiveData.description}

Generate a JSON object with these fields:
- insights: { confidence: "High/Medium/Low", assessment: "overall assessment", strength: "their key strength", challenge: "main challenge they face" }
- tips: Array of 3-5 tips, each with { title, content, impact, priority: "critical/high/medium" }
- risks: Array of 2-4 risks, each with { risk, probability: "high/medium/low", impact: "description", mitigation: "how to prevent" }
- savings: Array of 2-4 opportunities, each with { opportunity, amount: "€X-Y", effort: "easy/medium/hard", description }
- coupleAdvice: { commonConflict, yourSituation, framework, checkIn }

Be specific to ${userContext.location}, use their names, and give actionable advice.`;

      const systemPrompt = `You are Luna, a warm and intelligent planning assistant. Generate ONLY valid JSON with no markdown, no explanations, no extra text. Just the JSON object.`;

      const response = await fetch('http://localhost:3001/api/claude-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemPrompt,
          maxTokens: 4096,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      let jsonContent = data.content;

      // Clean up the response (remove markdown, extract JSON)
      if (jsonContent.includes('```')) {
        jsonContent = jsonContent.replace(/^```(?:json)?\s*/i, '');
        const closingIndex = jsonContent.indexOf('```');
        if (closingIndex !== -1) {
          jsonContent = jsonContent.substring(0, closingIndex);
        }
      }

      const firstBrace = jsonContent.indexOf('{');
      const lastBrace = jsonContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
      }

      const enhancedContent = JSON.parse(jsonContent.trim());

      console.log('✅ Successfully enhanced deep dive with Claude intelligence!',jsonContent);

      // Merge with existing deep dive data
      setEnhancedData({
        ...deepDiveData,
        personalizedInsights: enhancedContent.insights,
        intelligentTips: enhancedContent.tips,
        riskAnalysis: enhancedContent.risks,
        smartSavings: enhancedContent.savings,
        coupleAdvice: enhancedContent.coupleAdvice,
        aiGenerated: true,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Failed to enhance deep dive:', error);
      setEnhancementError(error.message);
      // Fall back to using base deep dive data
      setEnhancedData(deepDiveData);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Use enhanced data if available, otherwise use original
  const displayData = enhancedData || deepDiveData;

  if (!displayData) {
    return null;
  }

  const {
    personalizedInsights,
    intelligentTips,
    riskAnalysis,
    smartSavings,
    coupleAdvice,
    totalBudget,
    timeline_months,
    location,
    detailedSteps
  } = displayData;

  // Calculate monthly savings
  const monthlySavings = totalBudget && timeline_months
    ? Math.round(totalBudget / timeline_months)
    : 0;

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Show loading state while enhancing
  if (isEnhancing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center animate-pulse">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
          <p className="text-lg text-gray-600 font-medium">
            Luna is generating your personalized insights...
          </p>
        </div>
        <p className="text-sm text-gray-500">This takes about 10 seconds</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HERO: Luna's Assessment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 border border-purple-100"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Your Personalized Journey
              </h2>
              <p className="text-lg text-gray-600">
                {userContext?.partner1} & {userContext?.partner2} → {location || userContext?.location}
              </p>
            </div>
          </div>

          {personalizedInsights ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                  personalizedInsights.confidence === 'High'
                    ? 'bg-green-100 text-green-700'
                    : personalizedInsights.confidence === 'Medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {personalizedInsights.confidence} Confidence
                </div>
              </div>

              <p className="text-lg text-gray-700 leading-relaxed">
                {personalizedInsights.assessment}
              </p>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="bg-white/80 backdrop-blur rounded-2xl p-4 border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-700">Your Strength</span>
                  </div>
                  <p className="text-gray-600">{personalizedInsights.strength}</p>
                </div>

                <div className="bg-white/80 backdrop-blur rounded-2xl p-4 border border-orange-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-orange-600" />
                    <span className="font-semibold text-gray-700">Your Challenge</span>
                  </div>
                  <p className="text-gray-600">{personalizedInsights.challenge}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/60 backdrop-blur rounded-2xl p-6 border border-purple-200">
              <p className="text-gray-600 text-center">
                {displayData.description || displayData.aiAnalysis?.summary || 'Analyzing your goal...'}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* KEY STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border-2 border-purple-100 hover:border-purple-300 transition-all">
          <DollarSign className="w-6 h-6 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">€{totalBudget?.toLocaleString() || '—'}</p>
          <p className="text-sm text-gray-600">Total Budget</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-indigo-100 hover:border-indigo-300 transition-all">
          <Clock className="w-6 h-6 text-indigo-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{timeline_months || '—'} mo</p>
          <p className="text-sm text-gray-600">Timeline</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-pink-100 hover:border-pink-300 transition-all">
          <TrendingUp className="w-6 h-6 text-pink-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">€{monthlySavings?.toLocaleString() || '—'}</p>
          <p className="text-sm text-gray-600">Per Month</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-green-100 hover:border-green-300 transition-all">
          <MapPin className="w-6 h-6 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{location || userContext?.location || '—'}</p>
          <p className="text-sm text-gray-600">Location</p>
        </div>
      </div>

      {/* INTELLIGENT SECTIONS (Accordions) */}
      <div className="space-y-3">
        {/* Smart Moves */}
        {intelligentTips && (
          <AccordionSection
            icon={Lightbulb}
            title="Smart Moves"
            subtitle={`${intelligentTips.length} personalized tips`}
            color="purple"
            isExpanded={expandedSection === 'tips'}
            onToggle={() => toggleSection('tips')}
          >
            <div className="space-y-3">
              {intelligentTips.map((tip, idx) => (
                <div key={idx} className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-start gap-3 mb-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      tip.priority === 'critical' ? 'bg-red-100 text-red-700' :
                      tip.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {tip.priority}
                    </span>
                    <h4 className="font-semibold text-gray-900 flex-1">{tip.title}</h4>
                  </div>
                  <p className="text-gray-700 mb-2">{tip.content}</p>
                  <p className="text-sm text-purple-600 italic">💡 {tip.impact}</p>
                </div>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Risk Intelligence */}
        {riskAnalysis && (
          <AccordionSection
            icon={Shield}
            title="Risk Intelligence"
            subtitle={`${riskAnalysis.length} potential challenges`}
            color="orange"
            isExpanded={expandedSection === 'risks'}
            onToggle={() => toggleSection('risks')}
          >
            <div className="space-y-3">
              {riskAnalysis.map((risk, idx) => (
                <div key={idx} className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      risk.probability === 'high' ? 'bg-red-100 text-red-700' :
                      risk.probability === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {risk.probability} probability
                    </span>
                    <h4 className="font-semibold text-gray-900 flex-1">{risk.risk}</h4>
                  </div>
                  <p className="text-gray-700 mb-2">{risk.impact}</p>
                  <div className="bg-white rounded-lg p-3 mt-2">
                    <p className="text-sm font-medium text-gray-900 mb-1">✓ Mitigation:</p>
                    <p className="text-sm text-gray-600">{risk.mitigation}</p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Save Money & Time */}
        {smartSavings && (
          <AccordionSection
            icon={Sparkles}
            title="Save Money & Time"
            subtitle={`${smartSavings.length} smart opportunities`}
            color="green"
            isExpanded={expandedSection === 'savings'}
            onToggle={() => toggleSection('savings')}
          >
            <div className="space-y-3">
              {smartSavings.map((saving, idx) => (
                <div key={idx} className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900 flex-1">{saving.opportunity}</h4>
                    <span className="text-lg font-bold text-green-600 whitespace-nowrap">{saving.amount}</span>
                  </div>
                  <p className="text-gray-700 mb-2">{saving.description}</p>
                  <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${
                    saving.effort === 'easy' ? 'bg-green-100 text-green-700' :
                    saving.effort === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {saving.effort} effort
                  </span>
                </div>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Planning Together */}
        {coupleAdvice && (
          <AccordionSection
            icon={Heart}
            title="Planning Together"
            subtitle="Couple-specific guidance"
            color="pink"
            isExpanded={expandedSection === 'couple'}
            onToggle={() => toggleSection('couple')}
          >
            <div className="space-y-4">
              <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-pink-600" />
                  Common Conflict
                </h4>
                <p className="text-gray-700">{coupleAdvice.commonConflict}</p>
              </div>

              <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-600" />
                  Your Situation
                </h4>
                <p className="text-gray-700">{coupleAdvice.yourSituation}</p>
              </div>

              <div className="bg-white rounded-xl p-4 border-2 border-pink-200">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Framework for Success
                </h4>
                <p className="text-gray-700">{coupleAdvice.framework}</p>
              </div>

              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-200">
                <h4 className="font-semibold text-gray-900 mb-2">💬 Regular Check-In</h4>
                <p className="text-gray-700">{coupleAdvice.checkIn}</p>
              </div>
            </div>
          </AccordionSection>
        )}

        {/* Start Today */}
        {detailedSteps && detailedSteps.length > 0 && (
          <AccordionSection
            icon={Target}
            title="Start Today"
            subtitle={`${detailedSteps.length} action steps`}
            color="indigo"
            isExpanded={expandedSection === 'steps'}
            onToggle={() => toggleSection('steps')}
          >
            <div className="space-y-2">
              {detailedSteps.map((step, idx) => (
                <div key={idx} className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{step.title}</h4>
                    <p className="text-gray-700 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionSection>
        )}
      </div>

      {/* Customize Button */}
      {onCustomize && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCustomize}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          ✨ Customize This Plan
        </motion.button>
      )}
    </div>
  );
};

// Accordion Section Component
const AccordionSection = ({ icon: Icon, title, subtitle, color, isExpanded, onToggle, children }) => {
  const colorClasses = {
    purple: 'from-purple-500 to-indigo-500 border-purple-200',
    orange: 'from-orange-500 to-red-500 border-orange-200',
    green: 'from-green-500 to-emerald-500 border-green-200',
    pink: 'from-pink-500 to-rose-500 border-pink-200',
    indigo: 'from-indigo-500 to-blue-500 border-indigo-200'
  };

  return (
    <div className={`bg-white rounded-2xl border-2 ${colorClasses[color].split(' ')[1]} overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors"
      >
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color].split(' ')[0]} rounded-xl flex items-center justify-center shadow-md flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-6 h-6 text-gray-400" />
        ) : (
          <ChevronDown className="w-6 h-6 text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-0 border-t border-gray-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OverviewSection;
