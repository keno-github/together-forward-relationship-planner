import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Heart,
  Sparkles,
  CheckCircle,
  MessageCircle,
  ChevronDown,
  TrendingUp,
  Target,
  ArrowRight,
  Quote,
  Clock,
  Users,
  Star,
  Zap
} from 'lucide-react';

// Premium Unsplash images for authentic feel
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&q=80', // Couple hands
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80', // Couple walking
  'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80', // Couple laughing
];

const CATEGORY_IMAGES = {
  finances: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&q=80',
  financial: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&q=80',
  communication: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80',
  lifestyle: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
  values: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&q=80',
  family: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&q=80',
  travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80',
  home: 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=400&q=80',
  career: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&q=80',
  moving: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  wedding: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80',
  future: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80',
  parenting: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=400&q=80',
  general: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80',
};

// Category labels (mature, not cartoonish)
const CATEGORY_INFO = {
  finances: { label: 'Financial Alignment' },
  financial: { label: 'Financial Alignment' },
  communication: { label: 'Communication Style' },
  lifestyle: { label: 'Lifestyle Vision' },
  values: { label: 'Core Values' },
  future: { label: 'Future Planning' },
  parenting: { label: 'Parenting Philosophy' },
  family: { label: 'Family Dynamics' },
  timeline: { label: 'Life Timeline' },
  travel: { label: 'Adventure & Travel' },
  home: { label: 'Home & Living' },
  career: { label: 'Career & Ambition' },
  moving: { label: 'Relocation Plans' },
  wedding: { label: 'Wedding Vision' },
  general: { label: 'General Compatibility' }
};

// Animated counter component
const AnimatedNumber = ({ value, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return <span ref={ref}>{count}</span>;
};

// Section reveal animation wrapper
const RevealSection = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

const LunaAnalysisResults = ({
  results,
  partner1Name,
  partner2Name,
  onStartConversation,
  onNewAssessment
}) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedMisalignment, setExpandedMisalignment] = useState(null);
  const [heroImageIndex] = useState(() => Math.floor(Math.random() * HERO_IMAGES.length));

  if (!results) return null;

  // Map the analysis output
  const alignmentScore = results.alignmentScore ?? results.overallScore ?? 0;
  const categoryScores = results.categoryScores || {};
  const strongAlignments = results.strongAlignments || results.strengths || [];
  const misalignments = results.misalignments || results.growthAreas || [];
  const lunaAnalysis = results.lunaAnalysis || results.lunaInsights || '';
  const discussionPrompts = results.discussionPrompts || results.conversationStarters || [];
  const recommendedGoals = results.recommendedGoals || results.nextSteps || [];
  const questionsAsked = results.questionsAsked || 0;

  // Score interpretation
  const getScoreData = () => {
    if (alignmentScore >= 80) return {
      title: 'Exceptional Alignment',
      subtitle: 'You\'re remarkably in sync',
      color: '#7d8c75',
      message: `${partner1Name} and ${partner2Name}, your alignment is in the top 15% of couples we've assessed. This level of compatibility is rare and worth celebrating.`
    };
    if (alignmentScore >= 60) return {
      title: 'Strong Foundation',
      subtitle: 'A relationship built to last',
      color: '#c9a68a',
      message: 'You share core values with room for growth. The areas where you differ often become sources of strength when explored together.'
    };
    if (alignmentScore >= 40) return {
      title: 'Growth Opportunity',
      subtitle: 'Different perspectives, shared journey',
      color: '#d4a574',
      message: 'Your differences aren\'t obstacles—they\'re invitations to deeper understanding. Many strong couples started exactly where you are.'
    };
    return {
      title: 'Starting Point',
      subtitle: 'Every journey begins with awareness',
      color: '#d4a574',
      message: 'Awareness is the first step to alignment. The insights ahead will help you bridge gaps and build understanding.'
    };
  };

  const scoreData = getScoreData();
  const sortedCategories = Object.entries(categoryScores).sort((a, b) => {
    const scoreA = typeof a[1] === 'object' ? a[1].score : a[1];
    const scoreB = typeof b[1] === 'object' ? b[1].score : b[1];
    return scoreB - scoreA;
  });

  return (
    <div className="luna-results">
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />

      <style>{`
        .luna-results {
          --color-bg: #faf8f5;
          --color-bg-alt: #f5f2ed;
          --color-text: #2d2926;
          --color-text-muted: #6b635b;
          --color-accent: #c9a68a;
          --color-accent-dark: #a88968;
          --color-success: #7d8c75;
          --color-warning: #d4a574;
          --color-border: #e8e4de;
          --color-card: #ffffff;
          --font-display: 'Playfair Display', Georgia, serif;
          --font-body: 'DM Sans', -apple-system, sans-serif;

          font-family: var(--font-body);
          background: var(--color-bg);
          color: var(--color-text);
          min-height: 100vh;
          overflow-x: hidden;
        }

        .luna-results * {
          box-sizing: border-box;
        }

        /* Hero Section */
        .hero-section {
          position: relative;
          min-height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .hero-bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.3);
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(45, 41, 38, 0.85) 0%,
            rgba(45, 41, 38, 0.7) 50%,
            rgba(45, 41, 38, 0.85) 100%
          );
        }

        .hero-content {
          position: relative;
          z-index: 10;
          max-width: 800px;
          text-align: center;
          color: #fff;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 100px;
          font-size: 0.875rem;
          margin-bottom: 2rem;
          color: var(--color-accent);
        }

        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 500;
          line-height: 1.1;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-family: var(--font-display);
          font-size: clamp(1.25rem, 3vw, 1.75rem);
          font-weight: 400;
          font-style: italic;
          color: var(--color-accent);
          margin-bottom: 2rem;
        }

        .score-ring {
          position: relative;
          width: 200px;
          height: 200px;
          margin: 3rem auto;
        }

        .score-ring svg {
          transform: rotate(-90deg);
          width: 100%;
          height: 100%;
        }

        .score-ring-bg {
          fill: none;
          stroke: rgba(255, 255, 255, 0.15);
          stroke-width: 8;
        }

        .score-ring-progress {
          fill: none;
          stroke: var(--color-accent);
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dasharray 2s ease-out;
        }

        .score-number {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .score-value {
          font-family: var(--font-display);
          font-size: 4rem;
          font-weight: 600;
          line-height: 1;
        }

        .score-label {
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 0.5rem;
        }

        .hero-message {
          font-size: 1.125rem;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.8);
          max-width: 600px;
          margin: 0 auto;
        }

        .scroll-indicator {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
        }

        .scroll-indicator::after {
          content: '';
          width: 1px;
          height: 40px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.5), transparent);
          animation: scrollPulse 2s ease-in-out infinite;
        }

        @keyframes scrollPulse {
          0%, 100% { transform: scaleY(1); opacity: 1; }
          50% { transform: scaleY(0.6); opacity: 0.5; }
        }

        /* Content Container */
        .content-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 4rem 1.5rem;
        }

        /* Section Styles */
        .section-header {
          margin-bottom: 2.5rem;
        }

        .section-label {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--color-accent-dark);
          margin-bottom: 0.75rem;
        }

        .section-title {
          font-family: var(--font-display);
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 500;
          line-height: 1.2;
          margin-bottom: 0.75rem;
        }

        .section-subtitle {
          font-size: 1.125rem;
          color: var(--color-text-muted);
          line-height: 1.6;
        }

        /* Category Cards */
        .category-grid {
          display: grid;
          gap: 1rem;
        }

        .category-card {
          position: relative;
          background: var(--color-card);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--color-border);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .category-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.1);
        }

        .category-card-inner {
          display: grid;
          grid-template-columns: 100px 1fr auto;
          align-items: center;
          gap: 1.25rem;
          padding: 1rem;
        }

        @media (max-width: 600px) {
          .category-card-inner {
            grid-template-columns: 60px 1fr auto;
            gap: 1rem;
          }
        }

        .category-image {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
        }

        .category-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .category-card:hover .category-image img {
          transform: scale(1.05);
        }

        .category-info {
          min-width: 0;
        }

        .category-name {
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .category-score-bar {
          height: 4px;
          background: var(--color-bg-alt);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 0.5rem;
        }

        .category-score-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 1s ease-out;
        }

        .category-score-value {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .category-expanded {
          padding: 1.25rem;
          background: var(--color-bg-alt);
          border-top: 1px solid var(--color-border);
        }

        .category-insight {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .category-insight-icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          color: var(--color-accent-dark);
        }

        .category-insight-text {
          font-size: 0.9375rem;
          line-height: 1.6;
          color: var(--color-text-muted);
        }

        /* Alignment Cards */
        .alignment-section {
          margin-top: 4rem;
        }

        .alignment-grid {
          display: grid;
          gap: 1rem;
        }

        .alignment-card {
          background: var(--color-card);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid var(--color-border);
          transition: all 0.3s ease;
        }

        .alignment-card:hover {
          border-color: var(--color-success);
        }

        .alignment-card.strength {
          border-left: 3px solid var(--color-success);
        }

        .alignment-card.growth {
          border-left: 3px solid var(--color-warning);
          cursor: pointer;
        }

        .alignment-quote {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .alignment-quote-icon {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          color: var(--color-success);
          opacity: 0.5;
        }

        .alignment-card.growth .alignment-quote-icon {
          color: var(--color-warning);
        }

        .alignment-question {
          font-family: var(--font-display);
          font-size: 1.0625rem;
          font-style: italic;
          line-height: 1.5;
        }

        .alignment-answer {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(125, 140, 117, 0.1);
          border-radius: 100px;
          font-size: 0.875rem;
          color: var(--color-success);
          margin-top: 0.75rem;
        }

        .alignment-expanded {
          margin-top: 1.25rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--color-border);
        }

        .partner-answer {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          margin-bottom: 0.5rem;
          font-size: 0.9375rem;
        }

        .partner-answer.p1 {
          background: rgba(201, 166, 138, 0.1);
        }

        .partner-answer.p2 {
          background: rgba(125, 140, 117, 0.1);
        }

        .partner-name {
          font-weight: 600;
          margin-right: 0.5rem;
        }

        .discussion-prompt {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          background: var(--color-bg-alt);
          border-radius: 12px;
          font-size: 0.875rem;
          color: var(--color-text-muted);
          font-style: italic;
        }

        .priority-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: rgba(212, 165, 116, 0.2);
          color: var(--color-warning);
          border-radius: 4px;
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-left: 0.5rem;
        }

        /* Luna's Analysis */
        .luna-section {
          margin-top: 4rem;
          background: linear-gradient(135deg, #2d2926 0%, #3d3633 100%);
          border-radius: 24px;
          padding: 2.5rem;
          color: #fff;
          position: relative;
          overflow: hidden;
        }

        .luna-section::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(201, 166, 138, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .luna-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .luna-avatar svg {
          width: 28px;
          height: 28px;
          color: #fff;
        }

        .luna-title {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        .luna-text {
          font-size: 1.0625rem;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.85);
          white-space: pre-wrap;
        }

        /* Discussion Prompts Section */
        .prompts-section {
          margin-top: 4rem;
        }

        .prompts-grid {
          display: grid;
          gap: 1rem;
        }

        .prompt-card {
          background: var(--color-card);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid var(--color-border);
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          transition: all 0.3s ease;
        }

        .prompt-card:hover {
          transform: translateX(4px);
          border-color: var(--color-accent);
        }

        .prompt-number {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-bg-alt);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 0.875rem;
        }

        .prompt-text {
          font-family: var(--font-display);
          font-size: 1.0625rem;
          font-style: italic;
          line-height: 1.5;
        }

        /* Goals Section */
        .goals-section {
          margin-top: 4rem;
        }

        .goal-card {
          background: var(--color-card);
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          border: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .goal-card:hover {
          background: var(--color-bg-alt);
          border-color: var(--color-accent);
        }

        .goal-icon {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }

        .goal-text {
          flex: 1;
          font-weight: 500;
        }

        .goal-arrow {
          color: var(--color-accent);
          transition: transform 0.3s ease;
        }

        .goal-card:hover .goal-arrow {
          transform: translateX(4px);
        }

        /* Social Proof */
        .social-proof {
          margin-top: 4rem;
          padding: 2rem;
          background: var(--color-bg-alt);
          border-radius: 16px;
          text-align: center;
        }

        .social-stats {
          display: flex;
          justify-content: center;
          gap: 3rem;
          flex-wrap: wrap;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 600;
          color: var(--color-text);
        }

        .stat-label {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          margin-top: 0.25rem;
        }

        /* CTA Section */
        .cta-section {
          margin-top: 4rem;
          text-align: center;
          padding: 3rem 2rem;
          background: linear-gradient(180deg, transparent 0%, var(--color-bg-alt) 100%);
          border-radius: 24px;
        }

        .cta-title {
          font-family: var(--font-display);
          font-size: clamp(1.5rem, 4vw, 2rem);
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .cta-subtitle {
          font-size: 1rem;
          color: var(--color-text-muted);
          margin-bottom: 2rem;
        }

        .cta-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-width: 400px;
          margin: 0 auto;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #2d2926 0%, #3d3633 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-family: var(--font-body);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          background: transparent;
          color: var(--color-text-muted);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          font-family: var(--font-body);
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          border-color: var(--color-accent);
          color: var(--color-text);
        }

        .urgency-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1.5rem;
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }

        /* Chevron Animation */
        .chevron-animated {
          transition: transform 0.3s ease;
        }

        .chevron-animated.open {
          transform: rotate(180deg);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .content-container {
            padding: 3rem 1rem;
          }

          .luna-section {
            padding: 1.5rem;
          }

          .social-stats {
            gap: 2rem;
          }
        }
      `}</style>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg">
          <img src={HERO_IMAGES[heroImageIndex]} alt="" />
          <div className="hero-overlay" />
        </div>

        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Sparkles size={14} />
            <span>Assessment Complete · {questionsAsked} Questions Analyzed</span>
          </motion.div>

          <h1 className="hero-title">{scoreData.title}</h1>
          <p className="hero-subtitle">{scoreData.subtitle}</p>

          <div className="score-ring">
            <svg viewBox="0 0 200 200">
              <circle className="score-ring-bg" cx="100" cy="100" r="85" />
              <motion.circle
                className="score-ring-progress"
                cx="100"
                cy="100"
                r="85"
                strokeDasharray="534"
                initial={{ strokeDashoffset: 534 }}
                animate={{ strokeDashoffset: 534 - (alignmentScore / 100) * 534 }}
                transition={{ duration: 2, delay: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="score-number">
              <span className="score-value">
                <AnimatedNumber value={alignmentScore} duration={2000} />%
              </span>
              <span className="score-label">Alignment</span>
            </div>
          </div>

          <p className="hero-message">{scoreData.message}</p>
        </motion.div>

        <motion.div
          className="scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          Explore Your Results
        </motion.div>
      </section>

      {/* Main Content */}
      <div className="content-container">

        {/* Category Breakdown */}
        {Object.keys(categoryScores).length > 0 && (
          <RevealSection>
            <section className="category-section">
              <div className="section-header">
                <div className="section-label">
                  <Target size={14} />
                  Area Breakdown
                </div>
                <h2 className="section-title">Where You Align</h2>
                <p className="section-subtitle">
                  See exactly where your perspectives meet and where they diverge.
                  Each area reveals opportunities for deeper connection.
                </p>
              </div>

              <div className="category-grid">
                {sortedCategories.map(([category, score], index) => {
                  const categoryScore = typeof score === 'object' ? score.score : score;
                  const isExpanded = expandedCategory === category;
                  const catInfo = CATEGORY_INFO[category] || { label: category };
                  const catImage = CATEGORY_IMAGES[category] || CATEGORY_IMAGES.general;

                  const getScoreColor = (s) => {
                    if (s >= 80) return '#7d8c75';
                    if (s >= 60) return '#c9a68a';
                    return '#d4a574';
                  };

                  const getInsight = (s, label) => {
                    if (s >= 80) return `Your ${label.toLowerCase()} alignment is exceptional. This shared perspective will serve as a strong foundation for decisions ahead.`;
                    if (s >= 60) return `You have solid common ground on ${label.toLowerCase()}, with some nuances worth exploring together.`;
                    return `Different perspectives on ${label.toLowerCase()} offer an opportunity to understand each other more deeply.`;
                  };

                  return (
                    <motion.div
                      key={category}
                      className="category-card"
                      onClick={() => setExpandedCategory(isExpanded ? null : category)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="category-card-inner">
                        <div className="category-image">
                          <img src={catImage} alt={catInfo.label} loading="lazy" />
                        </div>
                        <div className="category-info">
                          <div className="category-name">{catInfo.label}</div>
                          <div className="category-score-bar">
                            <motion.div
                              className="category-score-fill"
                              style={{ background: getScoreColor(categoryScore) }}
                              initial={{ width: 0 }}
                              animate={{ width: `${categoryScore}%` }}
                              transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                            />
                          </div>
                        </div>
                        <div className="category-score-value" style={{ color: getScoreColor(categoryScore) }}>
                          {categoryScore}%
                        </div>
                        <ChevronDown
                          size={20}
                          className={`chevron-animated ${isExpanded ? 'open' : ''}`}
                          style={{ color: '#6b635b' }}
                        />
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            className="category-expanded"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="category-insight">
                              {categoryScore >= 80 ? (
                                <CheckCircle className="category-insight-icon" />
                              ) : categoryScore >= 60 ? (
                                <MessageCircle className="category-insight-icon" />
                              ) : (
                                <TrendingUp className="category-insight-icon" />
                              )}
                              <p className="category-insight-text">
                                {getInsight(categoryScore, catInfo.label)}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          </RevealSection>
        )}

        {/* Strengths Section */}
        {strongAlignments.length > 0 && (
          <RevealSection delay={0.2}>
            <section className="alignment-section">
              <div className="section-header">
                <div className="section-label">
                  <Heart size={14} />
                  Shared Ground
                </div>
                <h2 className="section-title">Where You Connect</h2>
                <p className="section-subtitle">
                  These are the values and perspectives you both share.
                  Celebrate these—they're the bedrock of your partnership.
                </p>
              </div>

              <div className="alignment-grid">
                {strongAlignments.slice(0, 5).map((alignment, index) => {
                  const question = typeof alignment === 'string' ? alignment : alignment.question;
                  const answer = typeof alignment === 'object' ? alignment.sharedAnswer : null;
                  const insight = typeof alignment === 'object' ? alignment.insight : null;

                  return (
                    <motion.div
                      key={index}
                      className="alignment-card strength"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="alignment-quote">
                        <Quote className="alignment-quote-icon" />
                        <p className="alignment-question">{question}</p>
                      </div>
                      {answer && (
                        <div className="alignment-answer">
                          <Users size={14} />
                          <span>You both: "{answer}"</span>
                        </div>
                      )}
                      {insight && (
                        <p style={{ fontSize: '0.875rem', color: '#6b635b', marginTop: '0.75rem' }}>
                          {insight}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </section>
          </RevealSection>
        )}

        {/* Growth Areas */}
        {misalignments.length > 0 && (
          <RevealSection delay={0.2}>
            <section className="alignment-section">
              <div className="section-header">
                <div className="section-label">
                  <TrendingUp size={14} />
                  Growth Opportunities
                </div>
                <h2 className="section-title">Topics to Explore</h2>
                <p className="section-subtitle">
                  Different perspectives aren't problems—they're doorways to deeper understanding.
                  Tap any topic to see both perspectives.
                </p>
              </div>

              <div className="alignment-grid">
                {misalignments.slice(0, 5).map((misalignment, index) => {
                  const isExpanded = expandedMisalignment === index;
                  const question = typeof misalignment === 'string' ? misalignment : misalignment.question;
                  const p1Answer = typeof misalignment === 'object' ? misalignment.partner1Answer : null;
                  const p2Answer = typeof misalignment === 'object' ? misalignment.partner2Answer : null;
                  const discussionPrompt = typeof misalignment === 'object' ? misalignment.discussionPrompt : null;
                  const isHighPriority = typeof misalignment === 'object' ? misalignment.isHighPriority : false;

                  return (
                    <motion.div
                      key={index}
                      className="alignment-card growth"
                      onClick={() => setExpandedMisalignment(isExpanded ? null : index)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="alignment-quote">
                        <Quote className="alignment-quote-icon" />
                        <div style={{ flex: 1 }}>
                          <p className="alignment-question">
                            {question}
                            {isHighPriority && (
                              <span className="priority-badge">
                                <Zap size={10} />
                                Priority
                              </span>
                            )}
                          </p>
                        </div>
                        <ChevronDown
                          size={18}
                          className={`chevron-animated ${isExpanded ? 'open' : ''}`}
                          style={{ color: '#6b635b', flexShrink: 0 }}
                        />
                      </div>

                      <AnimatePresence>
                        {isExpanded && (p1Answer || p2Answer) && (
                          <motion.div
                            className="alignment-expanded"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {p1Answer && (
                              <div className="partner-answer p1">
                                <span className="partner-name">{partner1Name}:</span>
                                "{p1Answer}"
                              </div>
                            )}
                            {p2Answer && (
                              <div className="partner-answer p2">
                                <span className="partner-name">{partner2Name}:</span>
                                "{p2Answer}"
                              </div>
                            )}
                            {discussionPrompt && (
                              <div className="discussion-prompt">
                                <MessageCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                                <span>{discussionPrompt}</span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          </RevealSection>
        )}

        {/* Luna's Analysis */}
        {lunaAnalysis && (
          <RevealSection delay={0.2}>
            <section className="luna-section">
              <div className="luna-avatar">
                <Sparkles />
              </div>
              <h3 className="luna-title">Luna's Reflection</h3>
              <p className="luna-text">{lunaAnalysis}</p>
            </section>
          </RevealSection>
        )}

        {/* Discussion Prompts */}
        {discussionPrompts.length > 0 && (
          <RevealSection delay={0.2}>
            <section className="prompts-section">
              <div className="section-header">
                <div className="section-label">
                  <MessageCircle size={14} />
                  Start the Conversation
                </div>
                <h2 className="section-title">Questions to Ask Each Other</h2>
                <p className="section-subtitle">
                  These prompts are designed to open meaningful dialogue.
                  Take your time with each one.
                </p>
              </div>

              <div className="prompts-grid">
                {discussionPrompts.map((prompt, index) => (
                  <motion.div
                    key={index}
                    className="prompt-card"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="prompt-number">{index + 1}</span>
                    <p className="prompt-text">"{prompt}"</p>
                  </motion.div>
                ))}
              </div>
            </section>
          </RevealSection>
        )}

        {/* Recommended Goals */}
        {recommendedGoals.length > 0 && (
          <RevealSection delay={0.2}>
            <section className="goals-section">
              <div className="section-header">
                <div className="section-label">
                  <Target size={14} />
                  Your Next Steps
                </div>
                <h2 className="section-title">Recommended Actions</h2>
                <p className="section-subtitle">
                  Based on your assessment, these are the most impactful steps you can take together.
                </p>
              </div>

              {recommendedGoals.map((goal, index) => (
                <motion.div
                  key={index}
                  className="goal-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="goal-icon">
                    {index === 0 ? <Star size={20} /> : <Target size={20} />}
                  </div>
                  <span className="goal-text">{goal}</span>
                  <ArrowRight size={18} className="goal-arrow" />
                </motion.div>
              ))}
            </section>
          </RevealSection>
        )}

        {/* Social Proof */}
        <RevealSection delay={0.2}>
          <div className="social-proof">
            <div className="social-stats">
              <div className="stat-item">
                <div className="stat-value">12,847</div>
                <div className="stat-label">Couples Assessed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">94%</div>
                <div className="stat-label">Report Better Understanding</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">4.9</div>
                <div className="stat-label">Average Rating</div>
              </div>
            </div>
          </div>
        </RevealSection>

        {/* CTA Section */}
        <RevealSection delay={0.2}>
          <section className="cta-section">
            <h2 className="cta-title">Ready to Turn Insights Into Action?</h2>
            <p className="cta-subtitle">
              Your assessment revealed {strongAlignments.length} strengths and {misalignments.length} growth areas.
              Let's create a plan to strengthen your partnership.
            </p>

            <div className="cta-buttons">
              {onStartConversation && (
                <motion.button
                  className="btn-primary"
                  onClick={onStartConversation}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Target size={18} />
                  Continue to Goal Planning
                  <ArrowRight size={18} />
                </motion.button>
              )}

              {onNewAssessment && (
                <button className="btn-secondary" onClick={onNewAssessment}>
                  Take Another Assessment
                </button>
              )}
            </div>

            <div className="urgency-note">
              <Clock size={14} />
              <span>Your results are saved and will be available for 30 days</span>
            </div>
          </section>
        </RevealSection>

      </div>
    </div>
  );
};

export default LunaAnalysisResults;
