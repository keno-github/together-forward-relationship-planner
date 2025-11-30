import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, Check, ArrowRight,
  HeartHandshake, Heart, Gem, Home, Key, Baby, Compass, Target, Layers,
  Sprout, Flower, TreeDeciduous, TreePine, Clock, Building2, Plane,
  KeyRound, DoorOpen, Users, UserPlus, CalendarHeart, HelpCircle, X,
  Wallet, Briefcase, Sparkles, MessageCircle, Star, MapPin, TrendingUp,
  PiggyBank, Truck, Search, Zap, BarChart3, Microscope
} from 'lucide-react';
import { getVisibleQuestions, isPrescreeningComplete } from '../../data/prescreeningQuestions';

// Icon component lookup
const IconComponents = {
  HeartHandshake, Heart, Gem, Home, Key, Baby, Compass, Target, Layers,
  Sprout, Flower, TreeDeciduous, TreePine, Clock, Building2, Plane,
  KeyRound, DoorOpen, Users, UserPlus, CalendarHeart, HelpCircle, X,
  Wallet, Briefcase, Sparkles, MessageCircle, Star, MapPin, TrendingUp,
  PiggyBank, Truck, Search, Zap, BarChart3, Microscope, Check
};

// Helper to render icon by name
const LucideIcon = ({ name, size = 24, className = '' }) => {
  const IconComponent = IconComponents[name];
  if (!IconComponent) return null;
  return <IconComponent size={size} className={className} />;
};

// Premium styles matching the design system
const styles = `
  .prescreening {
    --color-bg: #faf8f5;
    --color-bg-alt: #f5f2ed;
    --color-text: #2d2926;
    --color-text-muted: #6b635b;
    --color-accent: #c9a68a;
    --color-accent-dark: #a88968;
    --color-success: #7d8c75;
    --color-border: #e8e4de;
    --color-card: #ffffff;
    --font-display: 'Playfair Display', Georgia, serif;
    --font-body: 'DM Sans', -apple-system, sans-serif;

    font-family: var(--font-body);
    color: var(--color-text);
  }

  .prescreening * {
    box-sizing: border-box;
  }

  /* Header */
  .prescreening-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .prescreening-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.875rem;
    background: rgba(201, 166, 138, 0.15);
    border: 1px solid rgba(201, 166, 138, 0.3);
    border-radius: 100px;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-accent-dark);
    margin-bottom: 1.5rem;
  }

  .prescreening-title {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 500;
    margin-bottom: 0.75rem;
  }

  /* Progress Bar */
  .progress-container {
    margin-bottom: 2.5rem;
  }

  .progress-bar {
    height: 3px;
    background: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-accent), var(--color-accent-dark));
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  /* Question Card */
  .question-container {
    min-height: 350px;
  }

  .question-card {
    text-align: center;
  }

  .question-icon-container {
    width: 80px;
    height: 80px;
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    color: white;
    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.2);
  }

  .question-icon {
    font-size: 3rem;
    margin-bottom: 1.5rem;
    display: block;
  }

  .question-text {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 500;
    line-height: 1.35;
    margin-bottom: 0.75rem;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }

  .question-description {
    font-size: 0.9375rem;
    color: var(--color-text-muted);
    margin-bottom: 0.5rem;
  }

  .question-hint {
    font-size: 0.75rem;
    color: var(--color-accent-dark);
    font-weight: 500;
    margin-bottom: 1.5rem;
  }

  /* Options */
  .options-grid {
    display: grid;
    gap: 0.75rem;
    margin-top: 2rem;
  }

  .options-grid.multiselect {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 500px) {
    .options-grid.multiselect {
      grid-template-columns: 1fr;
    }
  }

  .option-btn {
    position: relative;
    width: 100%;
    padding: 1rem 1.25rem;
    background: var(--color-card);
    border: 2px solid var(--color-border);
    border-radius: 14px;
    font-family: var(--font-body);
    font-size: 0.9375rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.25s ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .option-btn:hover:not(:disabled) {
    border-color: var(--color-accent);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.08);
  }

  .option-btn.selected {
    border-color: var(--color-accent);
    background: linear-gradient(135deg, rgba(201, 166, 138, 0.08), rgba(201, 166, 138, 0.04));
  }

  .option-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .option-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f8f6f3 0%, #f0ece6 100%);
    color: var(--color-accent-dark);
    flex-shrink: 0;
    transition: all 0.25s ease;
  }

  .option-btn.selected .option-icon-wrapper {
    background: linear-gradient(135deg, var(--color-accent), var(--color-accent-dark));
    color: white;
  }

  .option-content {
    flex: 1;
  }

  .option-label {
    font-weight: 500;
    color: var(--color-text);
  }

  .option-btn.selected .option-label {
    color: var(--color-accent-dark);
  }

  .option-description {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    margin-top: 0.25rem;
  }

  .option-check {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-accent), var(--color-accent-dark));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  /* Navigation */
  .nav-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);
  }

  .nav-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 10px;
  }

  .nav-btn:hover:not(:disabled) {
    color: var(--color-text);
    background: var(--color-bg-alt);
  }

  .nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .nav-btn.primary {
    background: linear-gradient(135deg, #2d2926 0%, #3d3633 100%);
    color: white;
    padding: 0.875rem 1.5rem;
  }

  .nav-btn.primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.2);
  }

  .nav-btn.accent {
    background: linear-gradient(135deg, var(--color-accent), var(--color-accent-dark));
    color: white;
  }

  /* Handoff Screen */
  .handoff-screen {
    text-align: center;
    padding: 3rem 1.5rem;
  }

  .handoff-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-success), #5a6b54);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 2rem;
    color: white;
  }

  .handoff-title {
    font-family: var(--font-display);
    font-size: 1.75rem;
    font-weight: 500;
    margin-bottom: 0.75rem;
  }

  .handoff-subtitle {
    font-size: 1rem;
    color: var(--color-text-muted);
    margin-bottom: 2rem;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  .handoff-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #2d2926 0%, #3d3633 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-family: var(--font-body);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .handoff-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
  }
`;

const PreScreeningForm = ({
  partnerName,
  partnerNumber,
  onComplete,
  onBack,
  initialAnswers = {}
}) => {
  const [answers, setAnswers] = useState(initialAnswers || {});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);

  const visibleQuestions = getVisibleQuestions(answers);
  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const isComplete = isPrescreeningComplete(answers);
  const progress = (Object.keys(answers).length / Math.max(visibleQuestions.length, 1)) * 100;

  // Handle answer selection
  const handleAnswer = (questionId, value) => {
    const question = visibleQuestions.find(q => q.id === questionId);

    if (question?.type === 'multiselect') {
      setAnswers(prev => {
        const currentSelection = prev[questionId] || [];
        const isAlreadySelected = currentSelection.includes(value);
        const newSelection = isAlreadySelected
          ? currentSelection.filter(v => v !== value)
          : [...currentSelection, value];
        return { ...prev, [questionId]: newSelection };
      });
      return;
    }

    setIsAnimating(true);
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentQuestionIndex < visibleQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
      setIsAnimating(false);
    }, 400);
  };

  // Check if current question is answered
  const isCurrentAnswered = () => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type === 'multiselect') {
      return Array.isArray(answer) && answer.length > 0;
    }
    return answer !== undefined;
  };

  // Navigation
  const goNext = () => {
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Handle completion
  const handleComplete = () => {
    if (isComplete) {
      setShowHandoff(true);
    }
  };

  const handleHandoff = () => {
    onComplete(answers);
  };

  // Update visible questions when answers change
  useEffect(() => {
    const newVisibleQuestions = getVisibleQuestions(answers);
    if (currentQuestionIndex >= newVisibleQuestions.length) {
      setCurrentQuestionIndex(Math.max(0, newVisibleQuestions.length - 1));
    }
  }, [answers, currentQuestionIndex]);

  if (!currentQuestion && !showHandoff) return null;

  // Show handoff screen
  if (showHandoff) {
    return (
      <div className="prescreening">
        <style>{styles}</style>
        <motion.div
          className="handoff-screen"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="handoff-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <Check size={36} />
          </motion.div>
          <h2 className="handoff-title">{partnerName}'s Context Complete</h2>
          <p className="handoff-subtitle">
            Great! Luna now has the context needed to personalize your assessment experience.
          </p>
          <motion.button
            className="handoff-btn"
            onClick={handleHandoff}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Continue
            <ArrowRight size={18} />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="prescreening">
      <style>{styles}</style>

      {/* Header */}
      <div className="prescreening-header">
        <motion.div
          className="prescreening-badge"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span>Quick Context · {partnerName}</span>
        </motion.div>
      </div>

      {/* Progress */}
      <div className="progress-container">
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <div className="progress-info">
          <span>Question {currentQuestionIndex + 1} of {visibleQuestions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
      </div>

      {/* Question */}
      <div className="question-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            className="question-card"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            {/* Question Icon with gradient background */}
            <motion.div
              className={`question-icon-container bg-gradient-to-br ${currentQuestion.iconColor || 'from-indigo-500 to-purple-600'}`}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
            >
              <LucideIcon name={currentQuestion.lucideIcon} size={36} />
            </motion.div>
            <h3 className="question-text">{currentQuestion.question}</h3>
            {currentQuestion.description && (
              <p className="question-description">{currentQuestion.description}</p>
            )}
            {currentQuestion.type === 'multiselect' && (
              <p className="question-hint">Select all that apply</p>
            )}

            {/* Options */}
            <div className={`options-grid ${currentQuestion.type === 'multiselect' ? 'multiselect' : ''}`}>
              {currentQuestion.options.map((option, index) => {
                const isMultiselect = currentQuestion.type === 'multiselect';
                const currentAnswers = answers[currentQuestion.id];
                const isSelected = isMultiselect
                  ? (Array.isArray(currentAnswers) && currentAnswers.includes(option.value))
                  : currentAnswers === option.value;

                return (
                  <motion.button
                    key={option.value.toString()}
                    onClick={() => handleAnswer(currentQuestion.id, option.value)}
                    className={`option-btn ${isSelected ? 'selected' : ''}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={isAnimating && !isMultiselect}
                  >
                    {/* Option Icon */}
                    {option.lucideIcon && (
                      <div className="option-icon-wrapper">
                        <LucideIcon name={option.lucideIcon} size={20} />
                      </div>
                    )}
                    <div className="option-content">
                      <span className="option-label">{option.label}</span>
                      {option.description && (
                        <p className="option-description">{option.description}</p>
                      )}
                    </div>
                    {isSelected && (
                      <motion.div
                        className="option-check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      >
                        <Check size={14} />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="nav-container">
        <button
          className="nav-btn"
          onClick={currentQuestionIndex === 0 ? onBack : goPrev}
        >
          <ChevronLeft size={18} />
          {currentQuestionIndex === 0 ? 'Back' : 'Previous'}
        </button>

        {currentQuestionIndex === visibleQuestions.length - 1 && isComplete ? (
          <motion.button
            onClick={handleComplete}
            className="nav-btn primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Continue
            <ArrowRight size={18} />
          </motion.button>
        ) : (
          <button
            onClick={goNext}
            disabled={!isCurrentAnswered() || currentQuestionIndex === visibleQuestions.length - 1}
            className="nav-btn"
          >
            Next
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default PreScreeningForm;
