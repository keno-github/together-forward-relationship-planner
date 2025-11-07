import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight, ArrowLeft, Check, Users, UserPlus, Copy, CheckCircle } from 'lucide-react';
import BackButton from './BackButton';

// Compatibility Questions Database
const QUESTIONS = [
  // Timeline & Milestones (4 questions)
  {
    id: 1,
    category: 'timeline',
    question: "When do you see yourself getting married?",
    options: [
      { value: 'within_1_year', label: 'Within the next year', weight: 1 },
      { value: '1_2_years', label: '1-2 years from now', weight: 2 },
      { value: '3_5_years', label: '3-5 years from now', weight: 3 },
      { value: 'no_timeline', label: 'No specific timeline', weight: 4 },
      { value: 'not_sure', label: 'Not sure marriage is for me', weight: 5 }
    ]
  },
  {
    id: 2,
    category: 'timeline',
    question: "How important is owning a home to you?",
    options: [
      { value: 'essential', label: 'Essential - I want to own ASAP', weight: 1 },
      { value: 'important', label: 'Important - but timing is flexible', weight: 2 },
      { value: 'nice_to_have', label: 'Nice to have - but not a priority', weight: 3 },
      { value: 'not_important', label: 'Not important - happy renting', weight: 4 }
    ]
  },
  {
    id: 3,
    category: 'timeline',
    question: "When do you see starting a family?",
    options: [
      { value: 'ready_now', label: 'We\'re ready now', weight: 1 },
      { value: '2_3_years', label: 'Within 2-3 years', weight: 2 },
      { value: '5_plus_years', label: 'In 5+ years', weight: 3 },
      { value: 'maybe', label: 'Maybe someday', weight: 4 },
      { value: 'not_interested', label: 'Not interested in kids', weight: 5 }
    ]
  },
  {
    id: 4,
    category: 'timeline',
    question: "What's your priority for the next 2 years?",
    options: [
      { value: 'career', label: 'Career growth and advancement', weight: 1 },
      { value: 'relationship', label: 'Relationship and family milestones', weight: 2 },
      { value: 'travel', label: 'Travel and life experiences', weight: 3 },
      { value: 'financial', label: 'Building financial stability', weight: 4 },
      { value: 'balanced', label: 'Balanced mix of everything', weight: 5 }
    ]
  },

  // Financial Philosophy (3 questions)
  {
    id: 5,
    category: 'financial',
    question: "How would you describe your approach to saving?",
    options: [
      { value: 'aggressive', label: 'Aggressive saver - save first, spend later', weight: 1 },
      { value: 'balanced', label: 'Balanced - save some, enjoy some', weight: 2 },
      { value: 'yolo', label: 'YOLO - live in the moment', weight: 3 },
      { value: 'figuring_out', label: 'Still figuring it out', weight: 4 }
    ]
  },
  {
    id: 6,
    category: 'financial',
    question: "For expensive purchases like a wedding or home, you'd prefer to:",
    options: [
      { value: 'save_up', label: 'Save up and pay in full', weight: 1 },
      { value: 'finance', label: 'Finance if needed to get it sooner', weight: 2 },
      { value: 'go_all_out', label: 'Go all out - it\'s once in a lifetime', weight: 3 },
      { value: 'minimal', label: 'Keep it minimal and practical', weight: 4 }
    ]
  },
  {
    id: 7,
    category: 'financial',
    question: "How do you prefer to manage finances in a relationship?",
    options: [
      { value: 'everything_joint', label: 'Everything joint - we\'re a team', weight: 1 },
      { value: 'mostly_joint', label: 'Mostly joint with some personal accounts', weight: 2 },
      { value: 'mostly_separate', label: 'Mostly separate - we split expenses', weight: 3 },
      { value: 'independent', label: 'Completely independent', weight: 4 }
    ]
  },

  // Lifestyle & Values (3 questions)
  {
    id: 8,
    category: 'lifestyle',
    question: "Which sounds more like you?",
    options: [
      { value: 'adventure', label: 'Adventure seeker - spontaneity is key', weight: 1 },
      { value: 'balanced', label: 'Balanced - mix of both', weight: 2 },
      { value: 'stability', label: 'Stability lover - I like routine and plans', weight: 3 }
    ]
  },
  {
    id: 9,
    category: 'lifestyle',
    question: "Where do you see yourself living long-term?",
    options: [
      { value: 'big_city', label: 'Big city energy', weight: 1 },
      { value: 'suburbs', label: 'Quiet suburbs', weight: 2 },
      { value: 'small_town', label: 'Small town or rural', weight: 3 },
      { value: 'flexible', label: 'Flexible - wherever life takes us', weight: 4 }
    ]
  },
  {
    id: 10,
    category: 'communication',
    question: "When you disagree on something important:",
    options: [
      { value: 'talk_right_away', label: 'We talk it out right away', weight: 1 },
      { value: 'take_time', label: 'We take time to think, then discuss', weight: 2 },
      { value: 'avoid', label: 'We tend to avoid the topic', weight: 3 },
      { value: 'need_help', label: 'We need help with this', weight: 4 }
    ]
  },

  // Religion & Spirituality
  {
    id: 11,
    category: 'values',
    question: "What role does religion/spirituality play in your life?",
    options: [
      { value: 'very_important', label: 'Very important - central to my identity', weight: 1 },
      { value: 'somewhat_important', label: 'Somewhat important - I practice occasionally', weight: 2 },
      { value: 'not_important', label: 'Not important - but I respect others\' beliefs', weight: 3 },
      { value: 'not_religious', label: 'Not religious/spiritual at all', weight: 4 }
    ]
  },

  // Extended Family Dynamics
  {
    id: 12,
    category: 'family',
    question: "How involved should extended family be in major life decisions?",
    options: [
      { value: 'very_involved', label: 'Very involved - family input is crucial', weight: 1 },
      { value: 'consult_but_decide', label: 'We consult them but make our own decisions', weight: 2 },
      { value: 'inform_after', label: 'We inform them after we\'ve decided', weight: 3 },
      { value: 'private', label: 'Our decisions are private', weight: 4 }
    ]
  },

  // Career Ambitions
  {
    id: 13,
    category: 'career',
    question: "If a dream career opportunity required relocating or long hours:",
    options: [
      { value: 'career_first', label: 'I\'d take it - career is a top priority', weight: 1 },
      { value: 'discuss_together', label: 'We\'d discuss and find compromise', weight: 2 },
      { value: 'relationship_first', label: 'Relationship comes before career', weight: 3 },
      { value: 'depends', label: 'Depends on timing and circumstances', weight: 4 }
    ]
  },

  // Social Life Preferences
  {
    id: 14,
    category: 'lifestyle',
    question: "How do you prefer spending free time?",
    options: [
      { value: 'very_social', label: 'Out with friends - I need social energy', weight: 1 },
      { value: 'balanced_social', label: 'Mix of social and couple time', weight: 2 },
      { value: 'mostly_couple', label: 'Mostly just us two', weight: 3 },
      { value: 'alone_time', label: 'I need significant alone time to recharge', weight: 4 }
    ]
  },

  // Parenting Philosophy
  {
    id: 15,
    category: 'parenting',
    question: "If you have/had kids, what's your parenting philosophy?",
    options: [
      { value: 'structured', label: 'Structured - clear rules and routines', weight: 1 },
      { value: 'balanced', label: 'Balanced - structure with flexibility', weight: 2 },
      { value: 'free_range', label: 'Free-range - lots of independence', weight: 3 },
      { value: 'still_figuring', label: 'Still figuring it out / N/A', weight: 4 }
    ]
  },

  // Household Responsibilities
  {
    id: 16,
    category: 'lifestyle',
    question: "How should household chores and responsibilities be divided?",
    options: [
      { value: 'equal_split', label: '50/50 split - everything equal', weight: 1 },
      { value: 'by_strength', label: 'By strengths - each does what they\'re good at', weight: 2 },
      { value: 'by_schedule', label: 'By schedule - whoever has more time', weight: 3 },
      { value: 'hire_help', label: 'Hire help - outsource what we can', weight: 4 }
    ]
  },

  // Financial Red Flags
  {
    id: 17,
    category: 'financial',
    question: "How do you feel about debt?",
    options: [
      { value: 'no_debt', label: 'Avoid all debt except mortgage', weight: 1 },
      { value: 'strategic_debt', label: 'Strategic debt is okay (education, business)', weight: 2 },
      { value: 'comfortable_debt', label: 'Comfortable with manageable debt', weight: 3 },
      { value: 'not_worried', label: 'Not worried - you have to spend to live', weight: 4 }
    ]
  },

  // Personal Growth vs Relationship Time
  {
    id: 18,
    category: 'values',
    question: "How important is maintaining individual identity vs being a couple?",
    options: [
      { value: 'very_independent', label: 'Very independent - I need my own pursuits', weight: 1 },
      { value: 'balanced', label: 'Balanced - some separate, some together', weight: 2 },
      { value: 'mostly_together', label: 'Mostly together - we\'re a team', weight: 3 },
      { value: 'merged', label: 'Fully merged - "we" over "me"', weight: 4 }
    ]
  },

  // Long-term Vision
  {
    id: 19,
    category: 'future',
    question: "What's your vision for retirement/later life?",
    options: [
      { value: 'active_travel', label: 'Travel & adventure while we\'re still able', weight: 1 },
      { value: 'family_focus', label: 'Near family/grandkids', weight: 2 },
      { value: 'community', label: 'Settled in a community we love', weight: 3 },
      { value: 'no_plan', label: 'Too far away to plan', weight: 4 }
    ]
  },

  // Trust & Boundaries
  {
    id: 20,
    category: 'communication',
    question: "How do you define healthy boundaries in a relationship?",
    options: [
      { value: 'full_transparency', label: 'Full transparency - complete openness', weight: 1 },
      { value: 'mostly_open', label: 'Mostly open with some privacy', weight: 2 },
      { value: 'separate_spaces', label: 'Clear separate spaces (phones, friends)', weight: 3 },
      { value: 'figuring_out', label: 'Still figuring out what works for us', weight: 4 }
    ]
  }
];

const VisionCompatibility = ({ onComplete, location, onBack = null }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentPartner, setCurrentPartner] = useState(1); // 1 or 2
  const [partner1Answers, setPartner1Answers] = useState({});
  const [partner2Answers, setPartner2Answers] = useState({});
  const [partner1Name, setPartner1Name] = useState('');
  const [partner2Name, setPartner2Name] = useState('');
  const [stage, setStage] = useState('intro'); // intro, modeSelection, names, questions, waiting, complete
  const [assessmentMode, setAssessmentMode] = useState(null); // 'together' or 'separate'
  const [sessionId, setSessionId] = useState(null);
  const [partner2Email, setPartner2Email] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
  const question = QUESTIONS[currentQuestion];

  // Generate unique session ID
  const generateSessionId = () => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  // Check if we're loading an existing separate session
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const existingSessionId = urlParams.get('sessionId');

    if (existingSessionId) {
      // Partner 2 is joining via link
      const sessionData = localStorage.getItem(existingSessionId);
      if (sessionData) {
        const data = JSON.parse(sessionData);
        setSessionId(existingSessionId);
        setAssessmentMode('separate');
        setPartner1Name(data.partner1Name);
        setPartner2Name(data.partner2Name);
        setCurrentPartner(2);
        setStage('questions');
      }
    }
  }, []);

  // Handle mode selection
  const handleModeSelect = (mode) => {
    setAssessmentMode(mode);
    setStage('names');
  };

  // Handle name submission
  const handleNamesSubmit = (e) => {
    e.preventDefault();
    if (partner1Name.trim() && partner2Name.trim()) {
      if (assessmentMode === 'separate') {
        // Generate session and create link for partner 2
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);

        // Store session data
        localStorage.setItem(newSessionId, JSON.stringify({
          partner1Name,
          partner2Name,
          partner1Answers: {},
          createdAt: new Date().toISOString()
        }));

        setStage('questions');
      } else {
        // Together mode - proceed normally
        setStage('questions');
      }
    }
  };

  // Copy partner link to clipboard
  const copyPartnerLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?sessionId=${sessionId}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  // Handle answer selection
  const handleAnswer = (optionValue) => {
    if (currentPartner === 1) {
      setPartner1Answers({ ...partner1Answers, [question.id]: optionValue });
    } else {
      setPartner2Answers({ ...partner2Answers, [question.id]: optionValue });
    }

    // Wait a moment before advancing
    setTimeout(() => {
      if (assessmentMode === 'separate') {
        // In separate mode, only advance current partner through questions
        if (currentQuestion < QUESTIONS.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
        } else {
          // This partner is done
          setStage('complete');
          completeAssessment();
        }
      } else {
        // Together mode - alternate between partners
        if (currentPartner === 1) {
          // Switch to partner 2
          setCurrentPartner(2);
        } else {
          // Both partners answered, move to next question
          if (currentQuestion < QUESTIONS.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setCurrentPartner(1);
          } else {
            // All questions complete!
            setStage('complete');
            // Calculate results and send to parent
            completeAssessment();
          }
        }
      }
    }, 300);
  };

  // Handle going back to previous question/partner
  const handlePrevious = () => {
    if (assessmentMode === 'separate') {
      // In separate mode, just go back one question
      if (currentQuestion > 0) {
        setCurrentQuestion(currentQuestion - 1);
      }
    } else {
      // Together mode - alternate between partners
      if (currentPartner === 2) {
        // Go back to partner 1 of same question
        setCurrentPartner(1);
      } else if (currentQuestion > 0) {
        // Go back to partner 2 of previous question
        setCurrentQuestion(currentQuestion - 1);
        setCurrentPartner(2);
      }
    }
  };

  // Check if we can go back
  const canGoBack = assessmentMode === 'separate'
    ? currentQuestion > 0
    : (currentQuestion > 0 || currentPartner === 2);

  const completeAssessment = () => {
    if (assessmentMode === 'separate') {
      // Save this partner's answers to localStorage
      const sessionData = JSON.parse(localStorage.getItem(sessionId));

      if (currentPartner === 1) {
        sessionData.partner1Answers = partner1Answers;
        sessionData.partner1Complete = true;
        localStorage.setItem(sessionId, JSON.stringify(sessionData));

        // Partner 1 done - show waiting screen
        setStage('waiting');
      } else {
        sessionData.partner2Answers = partner2Answers;
        sessionData.partner2Complete = true;
        localStorage.setItem(sessionId, JSON.stringify(sessionData));

        // Check if partner 1 is also done
        if (sessionData.partner1Complete) {
          // Both done! Calculate results
          onComplete({
            partner1Name: sessionData.partner1Name,
            partner2Name: sessionData.partner2Name,
            partner1Answers: sessionData.partner1Answers,
            partner2Answers,
            questions: QUESTIONS,
            location
          });
        } else {
          // Partner 2 done first - show waiting screen
          setStage('waiting');
        }
      }
    } else {
      // Together mode - pass data directly to parent
      onComplete({
        partner1Name,
        partner2Name,
        partner1Answers,
        partner2Answers,
        questions: QUESTIONS,
        location
      });
    }
  };

  // Get current partner's answer if they already answered
  const getCurrentAnswer = () => {
    const answers = currentPartner === 1 ? partner1Answers : partner2Answers;
    return answers[question.id];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 relative">
      {/* Back Button */}
      {onBack && stage === 'intro' && (
        <div className="absolute top-4 left-4 z-50">
          <BackButton onClick={onBack} label="Back" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Intro Stage */}
        {stage === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto mt-20"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-6"
              >
                🤝
              </motion.div>

              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                Vision Alignment Journey
              </h1>

              <p className="text-xl text-gray-600 mb-8">
                Before you plan the big milestones, let's make sure you're on the same page.
              </p>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-8">
                <p className="text-gray-700 leading-relaxed">
                  You'll both answer <strong>20 important questions</strong> about:
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4 text-left">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-700">Life priorities & values</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-700">Timeline preferences</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-700">Financial philosophy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-700">Family & career goals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-700">Communication styles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-700">Long-term vision</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-8">
                ⏱️ Takes about 10 minutes • 🔒 Your answers are private
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStage('modeSelection')}
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 mx-auto"
              >
                Start Alignment Check
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Mode Selection Stage */}
        {stage === 'modeSelection' && (
          <motion.div
            key="modeSelection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto mt-20"
          >
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-800 mb-3">
                How would you like to take the assessment?
              </h2>
              <p className="text-gray-600 text-lg">
                Choose the option that works best for you both
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Together Mode */}
              <motion.div
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleModeSelect('together')}
                className="bg-white rounded-3xl shadow-xl p-8 cursor-pointer border-2 border-transparent hover:border-purple-300 transition-all"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    Answer Together
                  </h3>

                  <p className="text-gray-600 mb-6 leading-relaxed">
                    You're both here now and can answer questions side by side, taking turns
                  </p>

                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-green-700 mb-2">✅ Best for:</p>
                    <ul className="text-sm text-gray-700 text-left space-y-1">
                      <li>• Couples in the same room</li>
                      <li>• Quick completion (10 min)</li>
                      <li>• Immediate results</li>
                    </ul>
                  </div>

                  <div className="text-purple-600 font-semibold text-sm">
                    Takes ~10 minutes
                  </div>
                </div>
              </motion.div>

              {/* Separate Mode */}
              <motion.div
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleModeSelect('separate')}
                className="bg-white rounded-3xl shadow-xl p-8 cursor-pointer border-2 border-transparent hover:border-blue-300 transition-all"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserPlus className="w-10 h-10 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    Answer Separately
                  </h3>

                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Each partner answers privately on their own time, then results are combined
                  </p>

                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-blue-700 mb-2">✅ Best for:</p>
                    <ul className="text-sm text-gray-700 text-left space-y-1">
                      <li>• Busy schedules</li>
                      <li>• More honest responses</li>
                      <li>• Flexible timing</li>
                    </ul>
                  </div>

                  <div className="text-blue-600 font-semibold text-sm">
                    Each takes ~10 minutes
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => setStage('intro')}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mx-auto transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </motion.div>
        )}

        {/* Names Stage */}
        {stage === 'names' && (
          <motion.div
            key="names"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-xl mx-auto mt-20"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">💕</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Let's Get To Know You!
                </h2>
                <p className="text-gray-600">
                  What are your names?
                </p>
              </div>

              <form onSubmit={handleNamesSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Partner 1
                  </label>
                  <input
                    type="text"
                    value={partner1Name}
                    onChange={(e) => setPartner1Name(e.target.value)}
                    placeholder="Enter first name"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Partner 2
                  </label>
                  <input
                    type="text"
                    value={partner2Name}
                    onChange={(e) => setPartner2Name(e.target.value)}
                    placeholder="Enter first name"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!partner1Name.trim() || !partner2Name.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Questions Stage */}
        {stage === 'questions' && (
          <motion.div
            key="questions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto mt-10"
          >
            {/* Progress Bar */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-600">
                  Question {currentQuestion + 1} of {QUESTIONS.length}
                </span>
                <span className="text-sm font-semibold text-purple-600">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Question Card */}
            <motion.div
              key={`q${currentQuestion}-p${currentPartner}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
            >
              {/* Current Partner Indicator */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className={`px-6 py-2 rounded-full ${
                  currentPartner === 1
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {partner1Name}
                </div>
                <Heart className="w-5 h-5 text-pink-400" fill="currentColor" />
                <div className={`px-6 py-2 rounded-full ${
                  currentPartner === 2
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {partner2Name}
                </div>
              </div>

              {/* Question */}
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-8">
                {currentPartner === 1 ? partner1Name : partner2Name}, {question.question.toLowerCase()}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {question.options.map((option) => {
                  const isSelected = getCurrentAnswer() === option.value;

                  return (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswer(option.value)}
                      className={`w-full p-4 rounded-xl text-left font-medium transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        {isSelected && <Check className="w-5 h-5" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Helper text */}
              <p className="text-center text-gray-500 text-sm mt-6">
                {currentPartner === 1
                  ? `Next: ${partner2Name} will answer the same question`
                  : `Both answered! Moving to next question...`}
              </p>

              {/* Previous Button */}
              {canGoBack && (
                <div className="flex justify-center mt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrevious}
                    className="flex items-center gap-2 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                  </motion.button>
                </div>
              )}
            </motion.div>

            {/* Share Link Banner (Separate Mode only, Partner 1) */}
            {assessmentMode === 'separate' && currentPartner === 1 && sessionId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6"
              >
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  Share with {partner2Name}
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Send this link to {partner2Name} so they can answer separately:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}?sessionId=${sessionId}`}
                    className="flex-1 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyPartnerLink}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
                  >
                    {linkCopied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Waiting Stage (Separate Mode) */}
        {stage === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto mt-20"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="text-6xl mb-6"
              >
                ⏰
              </motion.div>

              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Great Job, {currentPartner === 1 ? partner1Name : partner2Name}!
              </h2>

              <p className="text-xl text-gray-600 mb-8">
                You've completed your part of the assessment.
              </p>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-8">
                <p className="text-gray-700 leading-relaxed">
                  {currentPartner === 1 ? (
                    <>
                      Waiting for <strong>{partner2Name}</strong> to complete their answers.
                      <br />
                      Once they're done, you'll both see your results!
                    </>
                  ) : (
                    <>
                      Waiting for <strong>{partner1Name}</strong> to complete their answers.
                      <br />
                      Once they're done, you'll both see your results!
                    </>
                  )}
                </p>
              </div>

              {currentPartner === 1 && sessionId && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    💌 Remind {partner2Name} to complete the assessment:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}${window.location.pathname}?sessionId=${sessionId}`}
                      className="flex-1 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={copyPartnerLink}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2"
                    >
                      {linkCopied ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Link
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500 mt-8">
                💡 Tip: Keep this page open or check back later to see results
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisionCompatibility;
