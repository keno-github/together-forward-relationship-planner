import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Sparkles, ArrowRight } from 'lucide-react';
import { saveAnswer } from '../../services/assessmentService';

// Premium styles matching the design system
const styles = `
  .luna-questions {
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
    min-height: 100%;
  }

  .luna-questions * {
    box-sizing: border-box;
  }

  /* Header */
  .lq-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .lq-badge {
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
  }

  .lq-counter {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  /* Progress Bar */
  .lq-progress {
    height: 4px;
    background: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 2.5rem;
  }

  .lq-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-accent), var(--color-accent-dark));
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  /* Question Card */
  .lq-card {
    background: var(--color-card);
    border-radius: 20px;
    padding: 2rem;
    border: 1px solid var(--color-border);
    box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.06);
  }

  /* Category & Importance */
  .lq-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .lq-category {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.875rem;
    background: var(--color-bg-alt);
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .lq-importance {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .lq-importance.critical {
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
  }

  .lq-importance.important {
    background: rgba(212, 165, 116, 0.2);
    color: #b8860b;
  }

  .lq-importance.normal {
    background: rgba(125, 140, 117, 0.15);
    color: #5a6b54;
  }

  /* Luna Avatar & Question */
  .lq-question-container {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .lq-avatar {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-accent), var(--color-accent-dark));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .lq-question-wrapper {
    flex: 1;
  }

  .lq-asks {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-accent-dark);
    margin-bottom: 0.5rem;
  }

  .lq-question-text {
    font-family: var(--font-display);
    font-size: 1.375rem;
    font-weight: 500;
    line-height: 1.4;
    color: var(--color-text);
  }

  /* Options */
  .lq-options {
    display: grid;
    gap: 0.75rem;
  }

  .lq-option {
    position: relative;
    width: 100%;
    padding: 1.125rem 1.25rem;
    background: var(--color-bg-alt);
    border: 2px solid transparent;
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

  .lq-option:hover:not(:disabled) {
    background: var(--color-card);
    border-color: var(--color-accent);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.08);
  }

  .lq-option.selected {
    background: var(--color-card);
    border-color: var(--color-accent);
    box-shadow: 0 4px 16px -4px rgba(201, 166, 138, 0.3);
  }

  .lq-option:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .lq-option-label {
    font-weight: 500;
    color: var(--color-text);
  }

  .lq-option.selected .lq-option-label {
    color: var(--color-accent-dark);
  }

  .lq-option-check {
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
  .lq-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);
  }

  .lq-nav-btn {
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

  .lq-nav-btn:hover:not(:disabled) {
    color: var(--color-text);
    background: var(--color-bg-alt);
  }

  .lq-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .lq-nav-btn.primary {
    background: linear-gradient(135deg, #2d2926 0%, #3d3633 100%);
    color: white;
    padding: 0.875rem 1.5rem;
  }

  .lq-nav-btn.primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.2);
  }

  /* Handoff Screen */
  .lq-handoff {
    text-align: center;
    padding: 3rem 1.5rem;
  }

  .lq-handoff-icon {
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

  .lq-handoff-title {
    font-family: var(--font-display);
    font-size: 1.75rem;
    font-weight: 500;
    margin-bottom: 0.75rem;
  }

  .lq-handoff-subtitle {
    font-size: 1rem;
    color: var(--color-text-muted);
    margin-bottom: 2rem;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.6;
  }

  .lq-handoff-btn {
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

  .lq-handoff-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
  }

  /* Select hint */
  .lq-hint {
    text-align: center;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    margin-top: 0.75rem;
  }
`;


const LunaQuestions = ({
  sessionId,
  partnerName,
  partnerNumber,
  questions,
  onComplete
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const currentAnswer = answers[currentQuestion?.id];
  const allAnswered = questions.every(q => answers[q.id]);

  // Handle answer selection
  const handleSelectAnswer = async (value, weight) => {
    if (isAnimating) return;

    setIsAnimating(true);

    // Save locally
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: { value, weight }
    }));

    // Save to database
    try {
      await saveAnswer(
        sessionId,
        currentQuestion.id,
        partnerNumber,
        value,
        weight,
        false
      );
    } catch (error) {
      console.error('Error saving answer:', error);
    }

    // Auto-advance after a short delay
    setTimeout(() => {
      if (!isLastQuestion) {
        setCurrentIndex(prev => prev + 1);
      }
      setIsAnimating(false);
    }, 400);
  };

  // Navigation
  const goNext = () => {
    if (currentIndex < questions.length - 1 && currentAnswer) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Handle completion
  const handleComplete = () => {
    if (allAnswered) {
      setShowHandoff(true);
    }
  };

  const handleHandoff = () => {
    onComplete();
  };

  if (!currentQuestion) return null;

  // Show handoff screen
  if (showHandoff) {
    return (
      <div className="luna-questions">
        <style>{styles}</style>
        <motion.div
          className="lq-handoff"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="lq-handoff-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <Check size={36} />
          </motion.div>
          <h2 className="lq-handoff-title">{partnerName}'s Answers Complete</h2>
          <p className="lq-handoff-subtitle">
            Excellent work! All {questions.length} questions answered.
            Your responses have been saved securely.
          </p>
          <motion.button
            className="lq-handoff-btn"
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
    <div className="luna-questions">
      <style>{styles}</style>

      {/* Header */}
      <div className="lq-header">
        <div className="lq-badge">
          <Sparkles size={12} />
          <span>{partnerName}'s Turn</span>
        </div>
        <span className="lq-counter">{currentIndex + 1} of {questions.length}</span>
      </div>

      {/* Progress */}
      <div className="lq-progress">
        <motion.div
          className="lq-progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="lq-card"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          {/* Meta - only show importance if critical/important */}
          {currentQuestion.importance && currentQuestion.importance !== 'NORMAL' && (
            <div className="lq-meta">
              <span className={`lq-importance ${currentQuestion.importance.toLowerCase()}`}>
                {currentQuestion.importance === 'CRITICAL' ? 'Important Question' :
                 currentQuestion.importance === 'IMPORTANT' ? 'Key Question' : ''}
              </span>
            </div>
          )}

          {/* Question */}
          <div className="lq-question-container">
            <div className="lq-avatar">
              <Sparkles size={20} />
            </div>
            <div className="lq-question-wrapper">
              <p className="lq-asks">Luna asks</p>
              <h3 className="lq-question-text">{currentQuestion.question}</h3>
            </div>
          </div>

          {/* Options */}
          <div className="lq-options">
            {currentQuestion.options.map((option, index) => {
              const isSelected = currentAnswer?.value === option.value;

              return (
                <motion.button
                  key={option.value}
                  onClick={() => handleSelectAnswer(option.value, option.weight)}
                  className={`lq-option ${isSelected ? 'selected' : ''}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={isAnimating}
                >
                  <span className="lq-option-label">{option.label}</span>
                  {isSelected && (
                    <motion.div
                      className="lq-option-check"
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

      {/* Navigation */}
      <div className="lq-nav">
        <button
          className="lq-nav-btn"
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={18} />
          Previous
        </button>

        {isLastQuestion && currentAnswer ? (
          <motion.button
            onClick={handleComplete}
            disabled={!allAnswered}
            className="lq-nav-btn primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Complete
            <Check size={18} />
          </motion.button>
        ) : (
          <button
            onClick={goNext}
            disabled={!currentAnswer || isLastQuestion}
            className="lq-nav-btn"
          >
            Next
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Hint */}
      {!currentAnswer && (
        <p className="lq-hint">Select an option to continue</p>
      )}
    </div>
  );
};

export default LunaQuestions;
