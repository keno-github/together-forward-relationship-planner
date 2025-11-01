import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight, ArrowLeft, Check } from 'lucide-react';

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
  }
];

const VisionCompatibility = ({ onComplete, location }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentPartner, setCurrentPartner] = useState(1); // 1 or 2
  const [partner1Answers, setPartner1Answers] = useState({});
  const [partner2Answers, setPartner2Answers] = useState({});
  const [partner1Name, setPartner1Name] = useState('');
  const [partner2Name, setPartner2Name] = useState('');
  const [stage, setStage] = useState('intro'); // intro, names, questions, complete

  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
  const question = QUESTIONS[currentQuestion];

  // Handle name submission
  const handleNamesSubmit = (e) => {
    e.preventDefault();
    if (partner1Name.trim() && partner2Name.trim()) {
      setStage('questions');
    }
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
    }, 300);
  };

  const completeAssessment = () => {
    // Pass data to parent component
    onComplete({
      partner1Name,
      partner2Name,
      partner1Answers,
      partner2Answers,
      questions: QUESTIONS,
      location
    });
  };

  // Get current partner's answer if they already answered
  const getCurrentAnswer = () => {
    const answers = currentPartner === 1 ? partner1Answers : partner2Answers;
    return answers[question.id];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4">
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
                  You'll both answer <strong>10 quick questions</strong> about:
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4 text-left">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-700">Life priorities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-700">Timeline preferences</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-700">Financial values</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-700">Lifestyle goals</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-8">
                ⏱️ Takes about 5 minutes • 🔒 Your answers are private
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStage('names')}
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 mx-auto"
              >
                Start Alignment Check
                <ArrowRight className="w-6 h-6" />
              </motion.button>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisionCompatibility;
