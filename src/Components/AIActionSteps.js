import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Circle, Clock, AlertCircle, Sparkles, RefreshCw,
  ChevronDown, Target, Loader2
} from 'lucide-react';
import { callClaude } from '../services/claudeAPI';

const AIActionSteps = ({ milestone, userContext }) => {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    generateActionSteps();
  }, [milestone?.id]); // Regenerate when milestone changes

  const generateActionSteps = async () => {
    if (!milestone) return;

    setLoading(true);
    try {
      const systemPrompt = `You are an expert life planning advisor helping couples achieve their goals. Generate a detailed, step-by-step action plan.

CRITICAL: You must respond with ONLY valid JSON. No other text, explanations, or markdown. Just the JSON array.

Format your response as a JSON array of objects with this EXACT structure:
[
  {
    "step": 1,
    "title": "Step title",
    "description": "What this step involves",
    "duration": "1-2 weeks",
    "difficulty": "easy",
    "actionItems": ["Sub-task 1", "Sub-task 2"],
    "considerations": ["Key question to think about"],
    "resources": ["Tool or website name"],
    "dependencies": []
  }
]

difficulty must be exactly one of: "easy", "medium", "hard"
dependencies is an array of step numbers that must be completed first (can be empty array)`;

      const userMessage = `Generate 6-8 detailed action steps for this milestone:

Milestone: "${milestone.title}"
${milestone.description ? `Description: ${milestone.description}` : ''}
${milestone.budget_amount ? `Budget: $${milestone.budget_amount}` : ''}
${milestone.duration ? `Timeline: ${milestone.duration}` : ''}
Partners: ${userContext?.partner1 || 'Partner 1'} and ${userContext?.partner2 || 'Partner 2'}
Location: ${userContext?.location || 'Not specified'}

Make the steps:
1. SPECIFIC to this exact milestone (not generic advice)
2. ACTIONABLE with clear sub-tasks
3. REALISTIC with accurate time estimates
4. SEQUENCED logically (use dependencies)
5. Include thoughtful considerations (decision frameworks, questions to ask yourselves)
6. Suggest helpful resources (real tools, websites, apps)

Respond with ONLY the JSON array, nothing else.`;

      const response = await callClaude(
        [{ role: 'user', content: userMessage }],
        {
          systemPrompt,
          maxTokens: 4000,
          temperature: 0.7
        }
      );

      // Parse the AI response
      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('No JSON array found in response');
        }

        const parsedSteps = JSON.parse(jsonMatch[0]);

        // Validate structure
        if (!Array.isArray(parsedSteps)) {
          throw new Error('Response is not an array');
        }

        setSteps(parsedSteps);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.log('Raw response:', response);

        // Fallback to basic steps if parsing fails
        setSteps(generateFallbackSteps());
      }
    } catch (error) {
      console.error('Error generating action steps:', error);
      setSteps(generateFallbackSteps());
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  const generateFallbackSteps = () => {
    return [
      {
        step: 1,
        title: 'Define your goal clearly',
        description: 'Sit down together and clarify exactly what you want to achieve',
        duration: '1-2 days',
        difficulty: 'easy',
        actionItems: [
          'Write down your vision for this goal',
          'Discuss why this matters to both of you',
          'Set a target completion date'
        ],
        considerations: [
          'What does success look like for this milestone?',
          'Are both partners equally committed to this goal?'
        ],
        resources: ['Shared document or journal'],
        dependencies: []
      },
      {
        step: 2,
        title: 'Research and gather information',
        description: 'Learn what this milestone typically involves',
        duration: '1 week',
        difficulty: 'easy',
        actionItems: [
          'Read articles and guides about this goal',
          'Talk to friends who have achieved this',
          'Join online communities for advice'
        ],
        considerations: [
          'What have others learned from this experience?',
          'What unexpected challenges should we prepare for?'
        ],
        resources: ['Google search', 'Reddit communities', 'YouTube tutorials'],
        dependencies: [1]
      },
      {
        step: 3,
        title: 'Create your action plan',
        description: 'Break down the milestone into manageable tasks',
        duration: '2-3 days',
        difficulty: 'medium',
        actionItems: [
          'List all major tasks needed',
          'Assign responsibilities between partners',
          'Set deadlines for each task'
        ],
        considerations: [
          'Who is best suited for each task?',
          'How will you handle disagreements?'
        ],
        resources: ['Project management app', 'Shared calendar'],
        dependencies: [1, 2]
      }
    ];
  };

  const handleRegenerate = () => {
    setRegenerating(true);
    generateActionSteps();
  };

  const toggleStep = (stepNumber) => {
    setExpandedStep(expandedStep === stepNumber ? null : stepNumber);
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-500 animate-spin" />
          <h3 className="text-lg font-semibold mb-2" style={{color: '#2B2B2B'}}>
            Luna is creating your personalized action plan...
          </h3>
          <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>
            Analyzing your milestone and generating tailored steps
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
        style={{background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))'}}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{color: '#2B2B2B'}}>
                AI-Generated Action Plan
              </h3>
              <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>
                Personalized steps created by Luna based on your specific milestone
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card-light hover:glass-card font-semibold transition-all disabled:opacity-50"
            style={{color: '#8B5CF6'}}
          >
            <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </motion.button>
        </div>
      </motion.div>

      {/* Steps List */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isExpanded = expandedStep === step.step;
          const isCompleted = step.completed || false;

          return (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6 cursor-pointer hover:glass-card-strong transition-all"
              onClick={() => toggleStep(step.step)}
            >
              {/* Step Header */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  ) : (
                    <Circle className="w-8 h-8" style={{color: '#C084FC'}} />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="text-sm font-bold px-3 py-1 rounded-full"
                      style={{background: 'rgba(192, 132, 252, 0.2)', color: '#C084FC'}}
                    >
                      Step {step.step}
                    </span>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        step.difficulty === 'easy'
                          ? 'bg-green-100 text-green-700'
                          : step.difficulty === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {step.difficulty}
                    </span>
                    <span className="text-xs flex items-center gap-1" style={{color: '#2B2B2B', opacity: 0.6}}>
                      <Clock className="w-3 h-3" />
                      {step.duration}
                    </span>
                    {step.dependencies && step.dependencies.length > 0 && (
                      <span className="text-xs flex items-center gap-1" style={{color: '#2B2B2B', opacity: 0.6}}>
                        <AlertCircle className="w-3 h-3" />
                        Requires Step {step.dependencies.join(', ')}
                      </span>
                    )}
                  </div>

                  <h4 className="text-lg font-bold mb-2" style={{color: '#2B2B2B'}}>
                    {step.title}
                  </h4>
                  <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>
                    {step.description}
                  </p>
                </div>

                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5" style={{color: '#C084FC'}} />
                </motion.div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 pt-6 border-t border-white/20 space-y-4">
                      {/* Action Items */}
                      {step.actionItems && step.actionItems.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{color: '#2B2B2B'}}>
                            <Target className="w-4 h-4" style={{color: '#C084FC'}} />
                            Action Items
                          </h5>
                          <div className="space-y-2">
                            {step.actionItems.map((item, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 text-sm glass-card-light rounded-lg p-3"
                              >
                                <input
                                  type="checkbox"
                                  className="mt-0.5 w-4 h-4 rounded"
                                  style={{accentColor: '#C084FC'}}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span style={{color: '#2B2B2B'}}>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Considerations */}
                      {step.considerations && step.considerations.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold mb-3" style={{color: '#2B2B2B'}}>
                            💡 Key Considerations
                          </h5>
                          <ul className="space-y-2 text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>
                            {step.considerations.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-purple-500 flex-shrink-0">→</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Resources */}
                      {step.resources && step.resources.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold mb-3" style={{color: '#2B2B2B'}}>
                            🔗 Helpful Resources
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {step.resources.map((resource, i) => (
                              <span
                                key={i}
                                className="text-xs px-3 py-1.5 rounded-full glass-card-light font-medium"
                                style={{color: '#8B5CF6'}}
                              >
                                {resource}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AIActionSteps;
