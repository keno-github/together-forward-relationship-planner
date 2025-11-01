import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Check } from 'lucide-react';

const AIAnalysisModal = ({ milestone, userContext }) => {
  const analysisSteps = [
    { text: `Analyzing ${userContext.partner1} & ${userContext.partner2}'s situation...`, delay: 0 },
    { text: `Checking costs and requirements in ${userContext.location}...`, delay: 0.5 },
    { text: `Calculating realistic timeline for ${milestone.title}...`, delay: 1.0 },
    { text: 'Identifying potential challenges and solutions...', delay: 1.5 },
    { text: 'Generating personalized recommendations...', delay: 2.0 }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
              scale: { duration: 1, repeat: Infinity }
            }}
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            🧠 AI is analyzing your situation...
          </h2>
          <p className="text-gray-600">
            Creating your personalized deep dive
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 h-2 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.5, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* Analysis steps */}
        <div className="space-y-3">
          {analysisSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.delay }}
              className="flex items-center gap-3"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: step.delay + 0.2 }}
                className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
              <span className="text-sm text-gray-700">{step.text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AIAnalysisModal;
