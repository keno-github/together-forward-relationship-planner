import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Heart, CheckCircle, Sparkles, Copy, Check, MessageCircle } from 'lucide-react';
import { subscribeToAssessment } from '../../services/assessmentService';

// Premium styles
const styles = `
  .waiting-screen {
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
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: var(--color-bg);
  }

  .waiting-screen * {
    box-sizing: border-box;
  }

  /* Animated pulse rings */
  .pulse-container {
    position: relative;
    margin-bottom: 3rem;
  }

  .pulse-ring {
    position: absolute;
    inset: -20px;
    border-radius: 50%;
    border: 2px solid var(--color-accent);
    opacity: 0;
  }

  .pulse-ring.one {
    animation: pulseRing 3s ease-out infinite;
  }

  .pulse-ring.two {
    animation: pulseRing 3s ease-out infinite 1s;
  }

  .pulse-ring.three {
    animation: pulseRing 3s ease-out infinite 2s;
  }

  @keyframes pulseRing {
    0% {
      transform: scale(1);
      opacity: 0.6;
    }
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }

  .pulse-icon {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-accent), var(--color-accent-dark));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 10px 40px -10px rgba(201, 166, 138, 0.5);
  }

  .pulse-icon svg {
    animation: heartbeat 2s ease-in-out infinite;
  }

  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    14% { transform: scale(1.15); }
    28% { transform: scale(1); }
    42% { transform: scale(1.15); }
    70% { transform: scale(1); }
  }

  /* Content */
  .waiting-content {
    text-align: center;
    max-width: 480px;
    margin-bottom: 2.5rem;
  }

  .waiting-title {
    font-family: var(--font-display);
    font-size: 1.75rem;
    font-weight: 500;
    margin-bottom: 0.75rem;
    line-height: 1.3;
  }

  .waiting-subtitle {
    font-size: 1rem;
    color: var(--color-text-muted);
    line-height: 1.6;
  }

  /* Session code card */
  .code-card {
    background: var(--color-card);
    border: 2px solid var(--color-border);
    border-radius: 20px;
    padding: 2rem;
    max-width: 420px;
    width: 100%;
    margin-bottom: 1.5rem;
  }

  .code-label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-muted);
    text-align: center;
    margin-bottom: 0.75rem;
  }

  .code-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .code-value {
    font-family: var(--font-display);
    font-size: 2.5rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: var(--color-text);
  }

  .copy-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 12px;
    background: var(--color-bg-alt);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .copy-button:hover {
    background: var(--color-accent);
    color: white;
  }

  .copy-button.copied {
    background: var(--color-success);
    color: white;
  }

  /* Link section */
  .link-section {
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);
  }

  .link-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin-bottom: 0.5rem;
    text-align: center;
  }

  .link-container {
    display: flex;
    gap: 0.75rem;
  }

  .link-input {
    flex: 1;
    padding: 0.875rem 1rem;
    border: 2px solid var(--color-border);
    border-radius: 10px;
    font-family: var(--font-body);
    font-size: 0.8125rem;
    background: var(--color-bg-alt);
    color: var(--color-text-muted);
    outline: none;
  }

  .link-copy-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.25rem;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #2d2926 0%, #3d3633 100%);
    color: white;
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .link-copy-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px -8px rgba(0, 0, 0, 0.3);
  }

  .link-copy-btn.copied {
    background: var(--color-success);
  }

  /* Instructions card */
  .instructions-card {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(201, 166, 138, 0.1);
    border: 1px solid rgba(201, 166, 138, 0.2);
    border-radius: 12px;
    max-width: 420px;
    width: 100%;
  }

  .instructions-icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--color-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .instructions-text {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    line-height: 1.5;
  }

  .instructions-text strong {
    color: var(--color-text);
  }

  /* Progress card (for prescreening/questions waiting) */
  .progress-card {
    background: var(--color-card);
    border: 2px solid var(--color-border);
    border-radius: 20px;
    padding: 2rem;
    max-width: 420px;
    width: 100%;
    margin-bottom: 1.5rem;
  }

  .progress-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .progress-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-accent), var(--color-accent-dark));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .progress-info h3 {
    font-family: var(--font-display);
    font-size: 1.125rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .progress-info p {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  /* Progress steps */
  .progress-steps {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .progress-step {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.875rem 1rem;
    border-radius: 12px;
    transition: all 0.2s ease;
  }

  .progress-step.current {
    background: rgba(201, 166, 138, 0.1);
  }

  .step-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .step-icon.complete {
    background: rgba(125, 140, 117, 0.15);
    color: var(--color-success);
  }

  .step-icon.current {
    background: rgba(201, 166, 138, 0.2);
    color: var(--color-accent-dark);
    animation: pulse 2s ease-in-out infinite;
  }

  .step-icon.pending {
    background: var(--color-bg-alt);
    color: #b5ada5;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .step-label {
    flex: 1;
    font-size: 0.9375rem;
  }

  .step-label.pending {
    color: #b5ada5;
  }

  .step-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-accent);
    animation: blink 1.5s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  /* Tip */
  .tip-text {
    max-width: 380px;
    text-align: center;
    font-size: 0.8125rem;
    color: #b5ada5;
    margin-top: 1.5rem;
    line-height: 1.5;
  }
`;

const WaitingForPartner = ({
  sessionId,
  sessionCode,
  partnerName,
  waitingFor,
  onPartnerReady
}) => {
  const [copied, setCopied] = useState(false);
  const [dots, setDots] = useState('');

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = subscribeToAssessment(sessionId, (payload) => {
      const { eventType, new: data } = payload;

      if (eventType === 'UPDATE' && data) {
        if (waitingFor === 'join' && data.partner2_name) {
          onPartnerReady();
        } else if (waitingFor === 'prescreening' && data.partner2_prescreening_complete) {
          onPartnerReady();
        } else if (waitingFor === 'questions' && data.partner2_completed) {
          onPartnerReady();
        }
      }
    });

    return () => unsubscribe?.();
  }, [sessionId, waitingFor, onPartnerReady]);

  // Copy handlers
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(sessionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareLink = `${window.location.origin}/assessment/join/${sessionCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Messages
  const getWaitingMessage = () => {
    switch (waitingFor) {
      case 'join':
        return `Waiting for ${partnerName}${dots}`;
      case 'prescreening':
        return `${partnerName} is Setting Up${dots}`;
      case 'questions':
        return `${partnerName} is Answering${dots}`;
      default:
        return `Waiting${dots}`;
    }
  };

  const getSubMessage = () => {
    switch (waitingFor) {
      case 'join':
        return 'Share the code below so they can join your session';
      case 'prescreening':
        return 'They\'re providing context so Luna can personalize your experience';
      case 'questions':
        return 'Almost there! Luna will analyze your responses together';
      default:
        return '';
    }
  };

  return (
    <div className="waiting-screen">
      <style>{styles}</style>

      {/* Animated icon with pulse */}
      <motion.div
        className="pulse-container"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
      >
        <div className="pulse-ring one" />
        <div className="pulse-ring two" />
        <div className="pulse-ring three" />
        <div className="pulse-icon">
          <Heart size={40} />
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="waiting-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="waiting-title">{getWaitingMessage()}</h2>
        <p className="waiting-subtitle">{getSubMessage()}</p>
      </motion.div>

      {/* Session code card (when waiting for join) */}
      {waitingFor === 'join' && sessionCode && (
        <>
          <motion.div
            className="code-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="code-label">Session Code</p>
            <div className="code-display">
              <span className="code-value">{sessionCode}</span>
              <button
                onClick={handleCopyCode}
                className={`copy-button ${copied ? 'copied' : ''}`}
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>

            <div className="link-section">
              <p className="link-label">Or share this link directly</p>
              <div className="link-container">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="link-input"
                />
                <button
                  onClick={handleCopyLink}
                  className={`link-copy-btn ${copied ? 'copied' : ''}`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="instructions-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="instructions-icon">
              <MessageCircle size={18} />
            </div>
            <p className="instructions-text">
              <strong>Send to your partner.</strong> Once they join,
              you'll both proceed through the assessment together.
            </p>
          </motion.div>
        </>
      )}

      {/* Progress card (when waiting for prescreening/questions) */}
      {(waitingFor === 'prescreening' || waitingFor === 'questions') && (
        <>
          <motion.div
            className="progress-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="progress-header">
              <div className="progress-avatar">
                <Sparkles size={22} />
              </div>
              <div className="progress-info">
                <h3>Luna is with {partnerName}</h3>
                <p>Guiding through the assessment</p>
              </div>
            </div>

            <div className="progress-steps">
              <div className="progress-step">
                <div className="step-icon complete">
                  <CheckCircle size={16} />
                </div>
                <span className="step-label">Your responses saved</span>
              </div>

              <div className="progress-step current">
                <div className="step-icon current">
                  <Clock size={16} />
                </div>
                <span className="step-label">{partnerName} is answering</span>
                <div className="step-dot" />
              </div>

              <div className="progress-step">
                <div className="step-icon pending">
                  <Heart size={16} />
                </div>
                <span className="step-label pending">Luna analyzes together</span>
              </div>
            </div>
          </motion.div>

          <motion.p
            className="tip-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            While you wait, think about the topics that matter most to you.
            Luna will help you explore them together.
          </motion.p>
        </>
      )}
    </div>
  );
};

export default WaitingForPartner;
