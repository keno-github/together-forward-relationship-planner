import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Lightbulb, RefreshCw, Sparkles, Loader2, Shield
} from 'lucide-react';
import { callClaude } from '../services/claudeAPI';

const AIChallenges = ({ milestone, userContext }) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    generateChallenges();
  }, [milestone?.id]);

  const generateChallenges = async () => {
    if (!milestone) return;

    setLoading(true);
    try {
      const systemPrompt = `You are an expert life planning advisor helping couples anticipate and overcome challenges. Generate realistic, specific challenges they might face.

CRITICAL: You must respond with ONLY valid JSON. No other text, explanations, or markdown. Just the JSON array.

Format your response as a JSON array of objects with this EXACT structure:
[
  {
    "challenge": "Specific challenge name",
    "likelihood": "high",
    "description": "Detailed explanation of why this challenge occurs",
    "solution": "Practical, actionable solution strategy",
    "preventionTips": ["Tip 1", "Tip 2"]
  }
]

likelihood must be exactly one of: "very high", "high", "medium", "low"`;

      const userMessage = `Generate 5-7 realistic challenges specific to this milestone:

Milestone: "${milestone.title}"
${milestone.description ? `Description: ${milestone.description}` : ''}
${milestone.budget_amount ? `Budget: $${milestone.budget_amount}` : ''}
${milestone.duration ? `Timeline: ${milestone.duration}` : ''}
Partners: ${userContext?.partner1 || 'Partner 1'} and ${userContext?.partner2 || 'Partner 2'}
Location: ${userContext?.location || 'Not specified'}

Generate challenges that are:
1. SPECIFIC to this exact milestone (not "staying motivated" - that's too generic)
2. REALISTIC and likely to actually occur
3. Include both practical and emotional/relationship challenges
4. Provide concrete, actionable solutions
5. Include prevention tips to avoid the challenge entirely

Examples of GOOD challenges:
- For a wedding: "Guest list disagreements between families", "Vendor suddenly cancels 2 months before wedding"
- For home buying: "Losing bidding wars in competitive market", "Inspection reveals foundation issues"
- For travel: "Flight cancellations during peak season", "Currency exchange rates shift dramatically"

Examples of BAD (too generic) challenges:
- "Staying motivated"
- "Communication issues"
- "Time management"

Respond with ONLY the JSON array, nothing else.`;

      const response = await callClaude(
        [{ role: 'user', content: userMessage }],
        {
          systemPrompt,
          maxTokens: 3000,
          temperature: 0.7
        }
      );

      // Parse AI response
      try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('No JSON array found in response');
        }

        const parsedChallenges = JSON.parse(jsonMatch[0]);

        if (!Array.isArray(parsedChallenges)) {
          throw new Error('Response is not an array');
        }

        setChallenges(parsedChallenges);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.log('Raw response:', response);
        setChallenges(generateFallbackChallenges());
      }
    } catch (error) {
      console.error('Error generating challenges:', error);
      setChallenges(generateFallbackChallenges());
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  const generateFallbackChallenges = () => {
    return [
      {
        challenge: 'Budget overruns',
        likelihood: 'high',
        description: 'Costs may exceed your initial budget due to unexpected expenses or scope creep',
        solution: 'Set aside a 15-20% buffer fund and track all expenses meticulously',
        preventionTips: [
          'Get multiple quotes for major expenses',
          'Review budget weekly',
          'Prioritize must-haves vs nice-to-haves'
        ]
      },
      {
        challenge: 'Timeline delays',
        likelihood: 'medium',
        description: 'Things often take longer than expected, especially with dependencies on others',
        solution: 'Build buffer time into your schedule and have contingency plans',
        preventionTips: [
          'Start earlier than you think necessary',
          'Identify critical path dependencies',
          'Have backup options ready'
        ]
      },
      {
        challenge: 'Decision fatigue',
        likelihood: 'medium',
        description: 'Making many decisions can lead to stress and conflict between partners',
        solution: 'Decide together what decisions require both partners vs individual judgment calls',
        preventionTips: [
          'Set decision-making rules upfront',
          'Take breaks between major decisions',
          'Use decision frameworks or pros/cons lists'
        ]
      }
    ];
  };

  const handleRegenerate = () => {
    setRegenerating(true);
    generateChallenges();
  };

  const getLikelihoodColor = (likelihood) => {
    switch (likelihood) {
      case 'very high':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' };
      case 'high':
        return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' };
      case 'medium':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' };
      case 'low':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-orange-500 animate-spin" />
          <h3 className="text-lg font-semibold mb-2" style={{color: '#2B2B2B'}}>
            Luna is analyzing potential challenges...
          </h3>
          <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>
            Identifying specific obstacles and preparing solutions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
        style={{background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(239, 68, 68, 0.1))'}}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{color: '#2B2B2B'}}>
                AI-Generated Challenge Analysis
              </h3>
              <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>
                Luna has identified specific challenges you might face and how to overcome them
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card-light hover:glass-card font-semibold transition-all disabled:opacity-50"
            style={{color: '#F97316'}}
          >
            <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </motion.button>
        </div>
      </motion.div>

      {/* Challenges List */}
      <div className="grid grid-cols-1 gap-4">
        {challenges.map((challenge, index) => {
          const colors = getLikelihoodColor(challenge.likelihood);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card rounded-2xl p-6 border-l-4 ${colors.border}`}
            >
              {/* Challenge Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    <AlertTriangle className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-bold" style={{color: '#2B2B2B'}}>
                        {challenge.challenge}
                      </h4>
                    </div>
                    <p className="text-sm mb-3" style={{color: '#2B2B2B', opacity: 0.7}}>
                      {challenge.description}
                    </p>
                  </div>
                </div>

                <span className={`${colors.bg} ${colors.text} text-xs px-3 py-1.5 rounded-full font-semibold whitespace-nowrap`}>
                  {challenge.likelihood} likelihood
                </span>
              </div>

              {/* Solution */}
              <div className="bg-green-50 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-semibold text-green-900 mb-1">
                      Solution Strategy
                    </h5>
                    <p className="text-sm text-green-800">
                      {challenge.solution}
                    </p>
                  </div>
                </div>
              </div>

              {/* Prevention Tips */}
              {challenge.preventionTips && challenge.preventionTips.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-blue-900 mb-2">
                        Prevention Tips
                      </h5>
                      <ul className="space-y-1.5">
                        {challenge.preventionTips.map((tip, i) => (
                          <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                            <span className="text-blue-500 flex-shrink-0">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: challenges.length * 0.1 }}
        className="glass-card rounded-2xl p-6"
        style={{background: 'linear-gradient(135deg, rgba(192, 132, 252, 0.1), rgba(248, 198, 208, 0.1))'}}
      >
        <div className="text-center">
          <h3 className="text-lg font-bold mb-2" style={{color: '#2B2B2B'}}>
            💪 You're Prepared!
          </h3>
          <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>
            Knowing these challenges ahead of time gives you a huge advantage. Use the Chat tab to discuss specific scenarios with Luna!
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AIChallenges;
