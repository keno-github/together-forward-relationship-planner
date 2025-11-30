import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Brain, Heart, Lightbulb,
  Check, Loader2, Stars, Compass, Users, TrendingUp
} from 'lucide-react';

// Loading stages for question generation
const QUESTION_STAGES = [
  { id: 1, label: 'Understanding your journey together', icon: Heart, duration: 3500 },
  { id: 2, label: 'Analyzing your priorities', icon: Compass, duration: 4000 },
  { id: 3, label: 'Crafting personalized questions', icon: Lightbulb, duration: 4500 },
  { id: 4, label: 'Preparing your assessment', icon: Stars, duration: 3000 }
];

// Loading stages for analysis
const ANALYSIS_STAGES = [
  { id: 1, label: 'Comparing perspectives', icon: Users, duration: 3500 },
  { id: 2, label: 'Identifying relationship patterns', icon: Brain, duration: 4000 },
  { id: 3, label: 'Discovering your alignments', icon: Heart, duration: 3500 },
  { id: 4, label: 'Finding growth opportunities', icon: TrendingUp, duration: 4000 },
  { id: 5, label: 'Crafting personalized insights', icon: Sparkles, duration: 3000 }
];

// Relationship insights organized by focus area
const INSIGHTS_BY_CATEGORY = {
  finances: [
    { stat: "40%", text: "of couples who discuss finances openly report higher relationship satisfaction" },
    { stat: "70%", text: "of couples argue about money more than any other topic" },
    { stat: "3x", text: "more likely to stay together: couples who budget jointly" },
    { stat: "85%", text: "of financial stress in relationships comes from different spending habits" },
    { stat: "50%", text: "of divorces cite financial problems as a major contributing factor" },
    { stat: "2x", text: "more savings accumulated by couples who set shared financial goals" },
    { stat: "78%", text: "of happy couples have regular money conversations" },
    { stat: "65%", text: "of couples feel closer after creating a budget together" },
    { stat: "4x", text: "more likely to reach goals: couples who track spending together" },
    { stat: "90%", text: "of financial advisors recommend couples align on money values first" },
    { stat: "33%", text: "of relationship stress reduces when finances are transparent" },
    { stat: "82%", text: "of successful couples agree on saving vs. spending priorities" },
    { stat: "6 mo", text: "of emergency savings is the recommended goal for couples" },
    { stat: "55%", text: "of couples wish they discussed money earlier in their relationship" },
    { stat: "3x", text: "faster debt payoff for couples with aligned financial strategies" }
  ],
  travel: [
    { stat: "86%", text: "of couples say traveling together strengthened their relationship" },
    { stat: "3x", text: "more shared memories created through travel experiences" },
    { stat: "72%", text: "of couples feel more connected after vacationing together" },
    { stat: "91%", text: "of travelers say exploring new places with a partner is more fulfilling" },
    { stat: "2x", text: "more likely to stay together: couples who travel annually" },
    { stat: "68%", text: "of couples discover new things about each other while traveling" },
    { stat: "45%", text: "of couples say their best conversations happen during trips" },
    { stat: "80%", text: "of relationship experts recommend travel for building intimacy" },
    { stat: "4 days", text: "is the minimum trip length for maximum relationship benefits" },
    { stat: "77%", text: "of couples feel travel planning together improves teamwork" },
    { stat: "93%", text: "of couples cherish travel memories more than material purchases" },
    { stat: "58%", text: "of couples say overcoming travel challenges made them stronger" },
    { stat: "2x", text: "more romantic connection reported by couples who prioritize travel" },
    { stat: "65%", text: "of couples agree that shared adventures create lasting bonds" },
    { stat: "89%", text: "of couples recommend traveling together before major commitments" }
  ],
  home: [
    { stat: "76%", text: "of couples feel buying a home together strengthens commitment" },
    { stat: "2x", text: "more important than location: agreeing on home priorities together" },
    { stat: "84%", text: "of homeowners say the purchase brought them closer as a couple" },
    { stat: "3x", text: "smoother home buying when couples discuss must-haves early" },
    { stat: "67%", text: "of couples wish they aligned on neighborhood preferences sooner" },
    { stat: "90%", text: "of real estate agents say unified couples find homes faster" },
    { stat: "45%", text: "of home-related stress comes from unspoken expectations" },
    { stat: "5 yr", text: "is the average time couples live in their first home together" },
    { stat: "78%", text: "of couples feel proud achieving homeownership as a team" },
    { stat: "2x", text: "more satisfaction when both partners love the home equally" },
    { stat: "82%", text: "of couples say decorating together revealed their compatibility" },
    { stat: "60%", text: "of arguments about homes are actually about lifestyle differences" },
    { stat: "73%", text: "of couples recommend renting together before buying" },
    { stat: "88%", text: "of homeowners say compromise was key to finding the right place" },
    { stat: "4x", text: "more likely to love your home when you choose it together" }
  ],
  career: [
    { stat: "79%", text: "of successful couples actively support each other's career goals" },
    { stat: "2x", text: "more career satisfaction when partners encourage professional growth" },
    { stat: "85%", text: "of couples say discussing work-life balance improved their relationship" },
    { stat: "67%", text: "of dual-career couples thrive when they coordinate schedules" },
    { stat: "3x", text: "more resilient: couples who navigate career changes together" },
    { stat: "71%", text: "of partners say emotional support matters most during job stress" },
    { stat: "90%", text: "of successful relocations happen when both careers are considered" },
    { stat: "58%", text: "of couples feel closer after supporting a partner's career transition" },
    { stat: "4x", text: "more likely to succeed: career changes with partner buy-in" },
    { stat: "82%", text: "of couples benefit from discussing career ambitions early" },
    { stat: "75%", text: "of work-from-home couples say boundaries improved their relationship" },
    { stat: "2x", text: "more work-life balance when couples plan careers together" },
    { stat: "68%", text: "of couples say celebrating career wins strengthens their bond" },
    { stat: "45%", text: "of relationship stress links to unaligned career expectations" },
    { stat: "88%", text: "of couples recommend having a career vision as a team" }
  ],
  family: [
    { stat: "92%", text: "of couples who discuss parenting styles early report less conflict" },
    { stat: "3x", text: "smoother parenting transitions when expectations are aligned" },
    { stat: "78%", text: "of new parents wish they discussed parenting philosophy sooner" },
    { stat: "85%", text: "of strong families credit early conversations about values" },
    { stat: "2x", text: "more prepared: couples who discuss family planning openly" },
    { stat: "67%", text: "of parenting disagreements stem from different upbringings" },
    { stat: "4x", text: "more teamwork when couples align on discipline approaches" },
    { stat: "81%", text: "of couples feel discussing family roles reduced future stress" },
    { stat: "73%", text: "of happy parents agreed on childcare arrangements beforehand" },
    { stat: "90%", text: "of family therapists recommend discussing kids before marriage" },
    { stat: "56%", text: "of couples change their minds about family size over time" },
    { stat: "2x", text: "more harmony in extended family relationships with clear boundaries" },
    { stat: "88%", text: "of couples say agreeing on family involvement matters greatly" },
    { stat: "65%", text: "of new parents say financial planning for kids was crucial" },
    { stat: "3x", text: "better co-parenting outcomes when values are discussed early" }
  ],
  lifestyle: [
    { stat: "87%", text: "of couples who share daily routines report higher satisfaction" },
    { stat: "2x", text: "more connected: couples who have regular quality time rituals" },
    { stat: "71%", text: "of relationship happiness links to compatible social preferences" },
    { stat: "3x", text: "more fulfilling: relationships where both partners pursue hobbies" },
    { stat: "68%", text: "of couples say aligning sleep schedules improved their bond" },
    { stat: "82%", text: "of happy couples respect each other's need for alone time" },
    { stat: "4x", text: "more intimacy when couples prioritize health together" },
    { stat: "75%", text: "of couples feel closer when they exercise together regularly" },
    { stat: "2x", text: "more relationship satisfaction with shared meal times" },
    { stat: "89%", text: "of couples say weekend routines define their relationship quality" },
    { stat: "63%", text: "of couples bond over trying new activities together" },
    { stat: "77%", text: "of introverts in relationships value understanding partners" },
    { stat: "3x", text: "stronger bonds when couples balance togetherness and independence" },
    { stat: "84%", text: "of couples say lifestyle compatibility matters as much as love" },
    { stat: "5:1", text: "ratio of shared to solo activities recommended for couples" }
  ],
  communication: [
    { stat: "5:1", text: "is the ideal ratio of positive to negative interactions" },
    { stat: "93%", text: "of relationship success depends on communication quality" },
    { stat: "2x", text: "more likely to resolve conflicts: couples who listen actively" },
    { stat: "69%", text: "of couples say learning their partner's love language transformed them" },
    { stat: "4x", text: "faster conflict resolution with 'I' statements instead of 'you'" },
    { stat: "86%", text: "of therapists say communication is the #1 relationship skill" },
    { stat: "78%", text: "of happy couples have daily check-in conversations" },
    { stat: "3x", text: "more trust built through vulnerable, honest conversations" },
    { stat: "91%", text: "of lasting couples say they can discuss anything openly" },
    { stat: "45%", text: "of arguments escalate due to tone, not content" },
    { stat: "2x", text: "more satisfaction when partners feel truly heard" },
    { stat: "72%", text: "of couples benefit from cooling off before difficult talks" },
    { stat: "88%", text: "of relationship experts recommend weekly relationship check-ins" },
    { stat: "67%", text: "of misunderstandings resolve when partners ask clarifying questions" },
    { stat: "3x", text: "more intimacy when couples share fears and dreams openly" }
  ],
  values: [
    { stat: "94%", text: "of long-term couples share core life values" },
    { stat: "3x", text: "more likely to last: couples aligned on fundamental beliefs" },
    { stat: "87%", text: "of successful marriages cite shared values as the foundation" },
    { stat: "2x", text: "more harmony when couples agree on what matters most" },
    { stat: "76%", text: "of couples say discussing values early prevented major conflicts" },
    { stat: "91%", text: "of relationship coaches prioritize values alignment first" },
    { stat: "68%", text: "of couples feel more secure when life priorities match" },
    { stat: "4x", text: "more fulfilling: relationships built on shared purpose" },
    { stat: "82%", text: "of couples say values alignment matters more than common interests" },
    { stat: "55%", text: "of relationship issues trace back to unspoken value differences" },
    { stat: "3x", text: "more resilience in couples who share spiritual or life philosophies" },
    { stat: "89%", text: "of happy couples regularly discuss what gives their life meaning" },
    { stat: "73%", text: "of couples feel values conversations deepen their connection" },
    { stat: "2x", text: "more trust when partners understand each other's core beliefs" },
    { stat: "95%", text: "of couples recommend discussing deal-breakers early" }
  ],
  general: [
    { stat: "40%", text: "of couples who discuss goals openly report higher satisfaction" },
    { stat: "3x", text: "more likely to achieve goals when partners share a clear vision" },
    { stat: "87%", text: "of successful couples regularly express gratitude to each other" },
    { stat: "5:1", text: "is the ideal ratio of positive to negative interactions" },
    { stat: "2x", text: "more resilient: couples who understand each other's perspectives" },
    { stat: "91%", text: "of lasting relationships are built on friendship first" },
    { stat: "78%", text: "of couples say laughter is essential to their relationship" },
    { stat: "4x", text: "more connected: couples who maintain curiosity about each other" },
    { stat: "85%", text: "of happy couples continue dating each other" },
    { stat: "67%", text: "of relationship success comes from small daily gestures" },
    { stat: "3x", text: "more intimacy when couples prioritize quality time" },
    { stat: "92%", text: "of couples say trust is the most important relationship element" },
    { stat: "73%", text: "of long-term couples credit mutual respect for their success" },
    { stat: "2x", text: "more satisfaction when both partners feel appreciated daily" },
    { stat: "88%", text: "of couples recommend regular relationship check-ins" }
  ]
};

const styles = `
  .luna-loading-premium {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: linear-gradient(165deg, #faf8f5 0%, #f5f2ed 40%, #faf8f5 100%);
    position: relative;
    overflow: hidden;
  }

  /* Animated background orbs */
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.5;
    animation: float-orb 20s ease-in-out infinite;
  }

  .orb-1 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(201, 166, 138, 0.25) 0%, transparent 70%);
    top: -10%;
    right: -10%;
    animation-delay: 0s;
  }

  .orb-2 {
    width: 350px;
    height: 350px;
    background: radial-gradient(circle, rgba(125, 140, 117, 0.2) 0%, transparent 70%);
    bottom: -5%;
    left: -5%;
    animation-delay: -7s;
  }

  .orb-3 {
    width: 250px;
    height: 250px;
    background: radial-gradient(circle, rgba(201, 166, 138, 0.15) 0%, transparent 70%);
    top: 50%;
    left: 20%;
    animation-delay: -14s;
  }

  @keyframes float-orb {
    0%, 100% {
      transform: translate(0, 0) scale(1);
    }
    25% {
      transform: translate(30px, -30px) scale(1.05);
    }
    50% {
      transform: translate(-20px, 20px) scale(0.95);
    }
    75% {
      transform: translate(20px, 30px) scale(1.02);
    }
  }

  /* Floating particles */
  .particles {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .particle {
    position: absolute;
    width: 6px;
    height: 6px;
    background: linear-gradient(135deg, #c9a68a, #a88968);
    border-radius: 50%;
    opacity: 0;
    animation: rise 8s ease-in infinite;
  }

  .particle:nth-child(1) { left: 10%; animation-delay: 0s; }
  .particle:nth-child(2) { left: 20%; animation-delay: 1s; }
  .particle:nth-child(3) { left: 30%; animation-delay: 2s; }
  .particle:nth-child(4) { left: 40%; animation-delay: 3s; }
  .particle:nth-child(5) { left: 50%; animation-delay: 4s; }
  .particle:nth-child(6) { left: 60%; animation-delay: 5s; }
  .particle:nth-child(7) { left: 70%; animation-delay: 6s; }
  .particle:nth-child(8) { left: 80%; animation-delay: 7s; }
  .particle:nth-child(9) { left: 90%; animation-delay: 0.5s; }
  .particle:nth-child(10) { left: 15%; animation-delay: 2.5s; }

  @keyframes rise {
    0% {
      bottom: -10%;
      opacity: 0;
      transform: scale(0.5);
    }
    10% {
      opacity: 0.6;
    }
    90% {
      opacity: 0.6;
    }
    100% {
      bottom: 110%;
      opacity: 0;
      transform: scale(1);
    }
  }

  .loading-content {
    position: relative;
    z-index: 1;
    text-align: center;
    max-width: 480px;
    width: 100%;
  }

  /* Luna Avatar with glow */
  .luna-avatar-container {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto 2.5rem;
  }

  .luna-avatar-glow {
    position: absolute;
    inset: -20px;
    background: radial-gradient(circle, rgba(201, 166, 138, 0.4) 0%, transparent 70%);
    animation: glow-pulse 3s ease-in-out infinite;
  }

  @keyframes glow-pulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.1); }
  }

  .luna-avatar {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(145deg, #c9a68a 0%, #a88968 50%, #8a7256 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      0 20px 60px -15px rgba(201, 166, 138, 0.5),
      inset 0 -4px 20px rgba(0, 0, 0, 0.1),
      inset 0 4px 20px rgba(255, 255, 255, 0.2);
  }

  .luna-avatar::before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), transparent 50%);
    z-index: -1;
  }

  .avatar-icon {
    color: white;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  /* Ring animation */
  .ring {
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    border: 2px solid rgba(201, 166, 138, 0.3);
    animation: ring-expand 2.5s ease-out infinite;
  }

  .ring-2 {
    animation-delay: 0.8s;
  }

  .ring-3 {
    animation-delay: 1.6s;
  }

  @keyframes ring-expand {
    0% {
      transform: scale(1);
      opacity: 0.6;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }

  .loading-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2rem;
    font-weight: 600;
    color: #2d2926;
    margin-bottom: 0.75rem;
    letter-spacing: -0.02em;
  }

  .loading-subtitle {
    font-size: 1.0625rem;
    color: #6b635b;
    margin-bottom: 3rem;
    line-height: 1.5;
  }

  /* Progress stages - more elegant */
  .stages-container {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    margin-bottom: 2.5rem;
  }

  .stage-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .stage-item.active {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(201, 166, 138, 0.3);
    box-shadow:
      0 8px 32px rgba(201, 166, 138, 0.15),
      0 2px 8px rgba(0, 0, 0, 0.04);
    transform: translateX(4px);
  }

  .stage-item.completed {
    background: linear-gradient(135deg, rgba(125, 140, 117, 0.08) 0%, rgba(125, 140, 117, 0.03) 100%);
    border-color: rgba(125, 140, 117, 0.2);
  }

  .stage-item.pending {
    opacity: 0.5;
  }

  .stage-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f5f2ed, #ebe7e0);
    color: #8a8279;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
  }

  .stage-item.active .stage-icon-wrapper {
    background: linear-gradient(145deg, #c9a68a, #a88968);
    color: white;
    box-shadow: 0 6px 20px -4px rgba(201, 166, 138, 0.5);
  }

  .stage-item.completed .stage-icon-wrapper {
    background: linear-gradient(145deg, #7d8c75, #6a7a63);
    color: white;
  }

  .stage-label {
    flex: 1;
    font-size: 0.9375rem;
    color: #8a8279;
    text-align: left;
    transition: all 0.3s ease;
  }

  .stage-item.active .stage-label {
    color: #2d2926;
    font-weight: 500;
  }

  .stage-item.completed .stage-label {
    color: #6a7a63;
  }

  .stage-status {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Insight card - premium design */
  .insight-card {
    background: white;
    border-radius: 20px;
    padding: 1.75rem;
    box-shadow:
      0 4px 24px rgba(0, 0, 0, 0.04),
      0 1px 4px rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.04);
    position: relative;
    overflow: hidden;
  }

  .insight-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #c9a68a, #7d8c75);
  }

  .insight-label {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    background: linear-gradient(135deg, rgba(201, 166, 138, 0.1), rgba(201, 166, 138, 0.05));
    border-radius: 20px;
    color: #a88968;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 1rem;
  }

  .insight-content {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
  }

  .insight-stat {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #c9a68a, #a88968);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
  }

  .insight-text {
    font-size: 1rem;
    color: #4a453f;
    line-height: 1.5;
    text-align: left;
  }

  /* Progress bar */
  .progress-container {
    margin-top: 2rem;
    padding: 0 1rem;
  }

  .progress-bar {
    height: 6px;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #c9a68a, #7d8c75, #c9a68a);
    background-size: 200% 100%;
    border-radius: 3px;
    animation: shimmer 2s linear infinite;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .progress-text {
    margin-top: 0.75rem;
    font-size: 0.8125rem;
    color: #8a8279;
  }
`;

// Shuffle array helper
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const LunaLoadingExperience = ({ type = 'questions', focusAreas = [] }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [completedStages, setCompletedStages] = useState([]);
  const [currentInsight, setCurrentInsight] = useState(0);

  const stages = type === 'questions' ? QUESTION_STAGES : ANALYSIS_STAGES;
  const title = type === 'questions'
    ? 'Luna is Preparing Your Questions'
    : 'Luna is Analyzing Your Responses';
  const subtitle = type === 'questions'
    ? 'Creating a personalized assessment tailored to your unique relationship...'
    : 'Discovering meaningful insights about your connection...';

  // Build insights list based on focus areas
  const insights = useMemo(() => {
    let selectedInsights = [];

    if (focusAreas && focusAreas.length > 0) {
      // Get insights from each selected focus area
      focusAreas.forEach(area => {
        const areaInsights = INSIGHTS_BY_CATEGORY[area] || [];
        selectedInsights.push(...areaInsights);
      });
    }

    // If no focus areas or not enough insights, add general ones
    if (selectedInsights.length < 10) {
      selectedInsights.push(...INSIGHTS_BY_CATEGORY.general);
    }

    // Shuffle and return
    return shuffleArray(selectedInsights);
  }, [focusAreas]);

  // Progress through stages
  useEffect(() => {
    if (currentStage >= stages.length) return;

    const timer = setTimeout(() => {
      setCompletedStages(prev => [...prev, stages[currentStage].id]);
      setCurrentStage(prev => prev + 1);
    }, stages[currentStage].duration);

    return () => clearTimeout(timer);
  }, [currentStage, stages]);

  // Cycle through insights
  useEffect(() => {
    const insightInterval = setInterval(() => {
      setCurrentInsight(prev => (prev + 1) % insights.length);
    }, 5000);

    return () => clearInterval(insightInterval);
  }, [insights.length]);

  const progress = (completedStages.length / stages.length) * 100;

  return (
    <div className="luna-loading-premium">
      <style>{styles}</style>

      {/* Animated background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Floating particles */}
      <div className="particles">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>

      <div className="loading-content">
        {/* Luna Avatar with glow effect */}
        <motion.div
          className="luna-avatar-container"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        >
          <div className="luna-avatar-glow" />
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="ring ring-3" />
          <div className="luna-avatar">
            <Sparkles size={44} className="avatar-icon" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          className="loading-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {title}
        </motion.h2>

        <motion.p
          className="loading-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {subtitle}
        </motion.p>

        {/* Progress Stages */}
        <motion.div
          className="stages-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {stages.map((stage, index) => {
            const isCompleted = completedStages.includes(stage.id);
            const isActive = currentStage === index && !isCompleted;
            const isPending = index > currentStage;
            const StageIcon = stage.icon;

            return (
              <motion.div
                key={stage.id}
                className={`stage-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isPending ? 'pending' : ''}`}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.08, duration: 0.4 }}
              >
                <div className="stage-icon-wrapper">
                  <StageIcon size={20} strokeWidth={1.75} />
                </div>
                <span className="stage-label">{stage.label}</span>
                <div className="stage-status">
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <Check size={18} color="#6a7a63" strokeWidth={2.5} />
                    </motion.div>
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 size={18} color="#c9a68a" strokeWidth={2} />
                    </motion.div>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Insight Card */}
        <motion.div
          className="insight-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="insight-label">
            <Lightbulb size={12} />
            <span>Relationship Insight</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentInsight}
              className="insight-content"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              <span className="insight-stat">{insights[currentInsight]?.stat}</span>
              <p className="insight-text">{insights[currentInsight]?.text}</p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(progress, 5)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <p className="progress-text">
            {completedStages.length < stages.length
              ? `Step ${completedStages.length + 1} of ${stages.length}`
              : 'Almost ready...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LunaLoadingExperience;
