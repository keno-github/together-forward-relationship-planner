import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Calendar, Baby, MapPin, Sparkles, ArrowRight, SkipForward } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';

const GetToKnowYou = ({ onComplete, onSkip, source = 'ready' }) => {
  const { profile, updateProfile } = useProfile();

  // Initialize with existing profile data if available
  const [formData, setFormData] = useState({
    relationshipStatus: profile.relationshipStatus || null,
    yearsTogethër: profile.yearsTogethër || null,
    ageRange1: profile.ageRange1 || null,
    ageRange2: profile.ageRange2 || null,
    kidsStatus: profile.kidsStatus || null,
    location: profile.location || ''
  });

  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Get appropriate messaging based on source
  const getMessaging = () => {
    if (source === 'compatibility') {
      return {
        title: "Before We Dive In, Let's Get to Know You!",
        subtitle: "This helps us tailor the assessment and recommendations to your life stage.",
        skipText: "Skip for now - I'll add this later"
      };
    } else if (source === 'ready') {
      return {
        title: "Tell Us a Bit About Yourselves!",
        subtitle: "This ensures Luna and our recommendations fit your unique situation.",
        skipText: "Skip - I just want to explore first"
      };
    } else {
      return {
        title: "Complete Your Profile",
        subtitle: "Help us personalize your experience better!",
        skipText: "Maybe later"
      };
    }
  };

  const messaging = getMessaging();

  // Question configurations
  const questions = [
    {
      id: 'relationshipStatus',
      title: 'What best describes your relationship?',
      icon: Heart,
      options: [
        { value: 'dating', label: 'Dating', emoji: '💑', description: 'In a relationship' },
        { value: 'engaged', label: 'Engaged', emoji: '💍', description: 'Planning to marry' },
        { value: 'married', label: 'Married', emoji: '💒', description: 'Already married' },
        { value: 'its_complicated', label: "It's Complicated", emoji: '🤔', description: 'Figuring things out' }
      ]
    },
    {
      id: 'yearsTogethër',
      title: 'How long have you been together?',
      icon: Calendar,
      options: [
        { value: '0-1', label: 'Less than 1 year', emoji: '🌱' },
        { value: '1-3', label: '1-3 years', emoji: '🌿' },
        { value: '3-5', label: '3-5 years', emoji: '🌳' },
        { value: '5-10', label: '5-10 years', emoji: '🌲' },
        { value: '10+', label: '10+ years', emoji: '🏔️' }
      ]
    },
    {
      id: 'ageRanges',
      title: 'What are your age ranges?',
      icon: Users,
      type: 'dual-select',
      options: [
        { value: '18-24', label: '18-24' },
        { value: '25-34', label: '25-34' },
        { value: '35-44', label: '35-44' },
        { value: '45-54', label: '45-54' },
        { value: '55+', label: '55+' }
      ]
    },
    {
      id: 'kidsStatus',
      title: 'What about children?',
      icon: Baby,
      options: [
        { value: 'planning', label: 'Planning to have kids', emoji: '👶', description: 'Future family plans' },
        { value: 'have_kids', label: 'Already have children', emoji: '👨‍👩‍👧‍👦', description: 'Parents now' },
        { value: 'no_kids', label: 'Not planning children', emoji: '🚫', description: 'Childfree by choice' },
        { value: 'unsure', label: "Haven't decided yet", emoji: '🤷', description: 'Still discussing' }
      ]
    },
    {
      id: 'location',
      title: 'Where are you located?',
      icon: MapPin,
      type: 'text',
      placeholder: 'City, State or Country'
    }
  ];

  const currentQ = questions[currentQuestion];
  const Icon = currentQ.icon;

  const handleSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    // Save to profile context
    updateProfile({
      ...formData
    }, source);

    if (onComplete) {
      onComplete(formData);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  const canProceed = () => {
    if (currentQ.id === 'ageRanges') {
      return formData.ageRange1 && formData.ageRange2;
    } else if (currentQ.id === 'location') {
      return formData.location.trim().length > 0;
    } else {
      return formData[currentQ.id] !== null;
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="inline-block p-4 bg-white rounded-full shadow-lg mb-4"
          >
            <Sparkles className="w-8 h-8 text-purple-500" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {messaging.title}
          </h1>
          <p className="text-gray-600">
            {messaging.subtitle}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Question Card */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-3xl shadow-xl p-8 mb-6"
        >
          {/* Question Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
              <Icon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium">
                Question {currentQuestion + 1} of {questions.length}
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                {currentQ.title}
              </h2>
            </div>
          </div>

          {/* Question Content */}
          {currentQ.type === 'dual-select' ? (
            // Age ranges - dual select
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partner 1 Age Range
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {currentQ.options.map((option) => (
                    <motion.button
                      key={`age1-${option.value}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelect('ageRange1', option.value)}
                      className={`p-3 rounded-xl border-2 font-semibold transition-all ${
                        formData.ageRange1 === option.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partner 2 Age Range
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {currentQ.options.map((option) => (
                    <motion.button
                      key={`age2-${option.value}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelect('ageRange2', option.value)}
                      className={`p-3 rounded-xl border-2 font-semibold transition-all ${
                        formData.ageRange2 === option.value
                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          ) : currentQ.type === 'text' ? (
            // Location - text input
            <div>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleSelect('location', e.target.value)}
                placeholder={currentQ.placeholder}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                autoFocus
              />
              <p className="mt-2 text-sm text-gray-500">
                This helps us provide location-specific resources and cost estimates
              </p>
            </div>
          ) : (
            // Regular options
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(currentQ.id, option.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData[currentQ.id] === option.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {option.emoji && (
                      <span className="text-3xl">{option.emoji}</span>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-sm text-gray-500">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Skip Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSkip}
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <SkipForward className="w-5 h-5" />
            {messaging.skipText}
          </motion.button>

          {/* Continue/Finish Button */}
          <motion.button
            whileHover={{ scale: canProceed() ? 1.02 : 1 }}
            whileTap={{ scale: canProceed() ? 0.98 : 1 }}
            onClick={handleNext}
            disabled={!canProceed()}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              canProceed()
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {currentQuestion === questions.length - 1 ? "Let's Go!" : 'Continue'}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Question Counter */}
        <div className="text-center mt-4 text-sm text-gray-500">
          {currentQuestion + 1} of {questions.length} questions
        </div>
      </motion.div>
    </div>
  );
};

export default GetToKnowYou;
