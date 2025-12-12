import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check, X, Sparkles, Heart, Target, Brain, Shield,
  Zap, TrendingUp, Users, ArrowRight, Star, ArrowLeft
} from 'lucide-react';

/**
 * PricingPage - World-class pricing page for TwogetherForward
 *
 * Designed to convert. Every element is intentional.
 * Brand: Warm, sophisticated, couples-focused
 */
const PricingPage = ({ onUpgrade, onClose }) => {
  const [billingPeriod, setBillingPeriod] = useState('annual'); // 'monthly' or 'annual'
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (tier) => {
    setLoading(true);
    if (onUpgrade) {
      await onUpgrade(tier, billingPeriod);
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundColor: '#FAF7F2',
        fontFamily: "'DM Sans', sans-serif"
      }}
    >
      {/* Subtle background texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[60%] rounded-full bg-gradient-to-b from-[#C4785A]/10 to-transparent blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[50%] rounded-full bg-gradient-to-t from-[#7d8c75]/8 to-transparent blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">

        {/* Back Button */}
        {onClose && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onClose}
            className="flex items-center gap-2 mb-8 text-sm font-medium transition-colors"
            style={{ color: '#6B5E54' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#C4785A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#6B5E54';
            }}
          >
            <ArrowLeft size={18} />
            Back
          </motion.button>
        )}

        {/* Hero Section */}
        <div className="text-center mb-16">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{
              backgroundColor: 'white',
              border: '1px solid #E8E2DA',
              boxShadow: '0 2px 8px rgba(45, 41, 38, 0.08)'
            }}
          >
            <Heart size={14} style={{ color: '#C4785A' }} fill="#C4785A" />
            <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#6B5E54' }}>
              AI-Powered Dream Planning for Couples
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl mb-6 font-light italic leading-tight"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: '#2D2926'
            }}
          >
            Build Your Future,<br />
            <span style={{ color: '#C4785A', fontWeight: 500 }}>Together</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
            style={{ color: '#6B5E54' }}
          >
            From your first date night planning to buying your dream home—Luna helps you navigate every milestone with clarity, confidence, and joy.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4 mt-8"
          >
            <span
              className="text-sm font-medium"
              style={{ color: billingPeriod === 'monthly' ? '#2D2926' : '#8B8178' }}
            >
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
              className="relative w-14 h-7 rounded-full transition-colors"
              style={{ backgroundColor: billingPeriod === 'annual' ? '#C4785A' : '#D4CEC6' }}
            >
              <div
                className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform"
                style={{
                  transform: billingPeriod === 'annual' ? 'translateX(30px)' : 'translateX(4px)'
                }}
              />
            </button>
            <span
              className="text-sm font-medium"
              style={{ color: billingPeriod === 'annual' ? '#2D2926' : '#8B8178' }}
            >
              Annual
            </span>
            {billingPeriod === 'annual' && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: '#7d8c75',
                  color: 'white'
                }}
              >
                Save $24
              </motion.span>
            )}
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">

          {/* FREE PLAN */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-8"
            style={{
              backgroundColor: 'white',
              border: '1px solid #E8E2DA',
              boxShadow: '0 2px 12px rgba(45, 41, 38, 0.06)'
            }}
          >
            <div className="mb-6">
              <h3 className="text-2xl font-semibold mb-2" style={{ color: '#2D2926' }}>
                Together Starter
              </h3>
              <p className="text-sm mb-4" style={{ color: '#6B5E54' }}>
                Perfect for couples just beginning their journey
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold" style={{ color: '#2D2926' }}>$0</span>
                <span className="text-sm" style={{ color: '#8B8178' }}>/month</span>
              </div>
            </div>

            <button
              className="w-full py-3 rounded-xl font-semibold mb-6 transition-all"
              style={{
                backgroundColor: '#F5F1EC',
                color: '#6B5E54',
                border: '1px solid #E8E2DA'
              }}
            >
              Current Plan
            </button>

            <div className="space-y-3">
              <FeatureItem icon={Check} text="2 Active Dreams" included />
              <FeatureItem icon={Check} text="Unlimited Milestones & Tasks" included />
              <FeatureItem icon={Check} text="Partner Collaboration" included />
              <FeatureItem icon={Check} text="10 Luna AI Questions/Month" included />
              <FeatureItem icon={Check} text="Basic Activity Tracking" included />
              <FeatureItem icon={Check} text="Compatibility Assessment (Once)" included />
              <FeatureItem icon={X} text="Unlimited Dreams" />
              <FeatureItem icon={X} text="Unlimited Luna Conversations" />
              <FeatureItem icon={X} text="AI-Powered PDF Reports" />
              <FeatureItem icon={X} text="Portfolio Intelligence" />
              <FeatureItem icon={X} text="Advanced Budget Tools" />
              <FeatureItem icon={X} text="Priority Support" />
            </div>
          </motion.div>

          {/* PREMIUM PLAN */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl p-8 relative"
            style={{
              backgroundColor: 'white',
              border: '2px solid #C4785A',
              boxShadow: '0 8px 32px rgba(196, 120, 90, 0.15)'
            }}
          >
            {/* Popular Badge */}
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: '#C4785A',
                color: 'white',
                boxShadow: '0 4px 12px rgba(196, 120, 90, 0.3)'
              }}
            >
              MOST POPULAR
            </div>

            <div className="mb-6 mt-2">
              <h3 className="text-2xl font-semibold mb-2" style={{ color: '#2D2926' }}>
                Together Pro
              </h3>
              <p className="text-sm mb-4" style={{ color: '#6B5E54' }}>
                For couples serious about building their future
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold" style={{ color: '#C4785A' }}>
                  ${billingPeriod === 'annual' ? '10' : '12'}
                </span>
                <span className="text-sm" style={{ color: '#8B8178' }}>/month</span>
              </div>
              {billingPeriod === 'annual' && (
                <p className="text-xs mt-1" style={{ color: '#7d8c75' }}>
                  Billed annually at $120/year
                </p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleUpgrade('premium')}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold mb-6 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #2D2926 0%, #463f3a 100%)',
                color: 'white',
                boxShadow: '0 4px 16px rgba(45, 41, 38, 0.3)'
              }}
            >
              {loading ? 'Processing...' : 'Upgrade to Twogether Pro'}
              <ArrowRight size={18} />
            </motion.button>

            <div className="space-y-3">
              <FeatureItem icon={Check} text="Everything in Free, plus:" included bold />
              <FeatureItem icon={Sparkles} text="Unlimited Dreams & Roadmaps" included premium />
              <FeatureItem icon={Brain} text="Unlimited Luna AI Conversations" included premium />
              <FeatureItem icon={Target} text="AI-Powered PDF Reports" included premium />
              <FeatureItem icon={TrendingUp} text="Portfolio Intelligence" included premium />
              <FeatureItem icon={Zap} text="Advanced Budget & Timeline Tools" included premium />
              <FeatureItem icon={Heart} text="Unlimited Compatibility Assessments" included premium />
              <FeatureItem icon={Shield} text="Priority Support (24hr response)" included premium />
              <FeatureItem icon={Star} text="Early Access to New Features" included premium />
            </div>

            {/* Money-Back Guarantee */}
            <div
              className="mt-6 p-4 rounded-xl text-center"
              style={{
                backgroundColor: '#FEF7ED',
                border: '1px solid #F4E4D0'
              }}
            >
              <p className="text-xs font-semibold" style={{ color: '#C4785A' }}>
                14-Day Money-Back Guarantee
              </p>
              <p className="text-xs mt-1" style={{ color: '#8B8178' }}>
                Try Twogether Pro risk-free. Cancel anytime.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-20"
        >
          <h2
            className="text-3xl font-light italic text-center mb-12"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: '#2D2926'
            }}
          >
            What You Can Accomplish Together
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureHighlight
              icon={<Target className="w-8 h-8" style={{ color: '#C4785A' }} />}
              title="Plan Life's Big Moments"
              description="Weddings, homes, career changes—organize every dream with clarity and confidence."
            />
            <FeatureHighlight
              icon={<Heart className="w-8 h-8" style={{ color: '#C4785A' }} />}
              title="Deepen Your Connection"
              description="Discover what matters most to both of you through guided conversations and insights."
            />
            <FeatureHighlight
              icon={<TrendingUp className="w-8 h-8" style={{ color: '#C4785A' }} />}
              title="Make Smarter Decisions"
              description="Luna's AI helps you optimize budgets, timelines, and priorities for better outcomes."
            />
          </div>
        </motion.div>

        {/* Value Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-20 text-center"
        >
          <h3 className="text-2xl font-semibold mb-8" style={{ color: '#2D2926' }}>
            Put It in Perspective
          </h3>
          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <ComparisonCard
              label="Wedding Planner"
              price="$2,000+"
              description="One-time service"
            />
            <ComparisonCard
              label="Couples Therapy"
              price="$200/session"
              description="Per session"
            />
            <ComparisonCard
              label="Financial Advisor"
              price="$150/hr"
              description="Per consultation"
            />
            <ComparisonCard
              label="TwogetherForward"
              price="$12/month"
              description="All your dreams, one platform"
              highlighted
            />
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <h2
            className="text-3xl font-light italic text-center mb-12"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: '#2D2926'
            }}
          >
            Questions? We've Got Answers
          </h2>

          <div className="space-y-4">
            <FAQItem
              question="Can I cancel anytime?"
              answer="Yes! Cancel anytime with one click. No questions asked. If you're on an annual plan, you'll have access until the end of your billing period."
            />
            <FAQItem
              question="What if we're not ready for Twogether Pro yet?"
              answer="No problem! Start with our free plan. You can upgrade whenever you hit limitations or want more features. Your data carries over seamlessly."
            />
            <FAQItem
              question="How does the 14-day guarantee work?"
              answer="Try Twogether Pro risk-free for 14 days. If you're not completely satisfied, email us and we'll refund you in full—no questions asked."
            />
            <FAQItem
              question="Do we both need Twogether Pro accounts?"
              answer="Nope! Only one partner needs Twogether Pro to unlock all features for both of you. Share one account or invite your partner—they get all Pro features too."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards (Visa, Mastercard, Amex, Discover) through our secure Stripe integration. Your payment information is never stored on our servers."
            />
            <FAQItem
              question="Will Luna really help us save money?"
              answer="Luna's budget optimization tools help you make informed financial decisions by analyzing costs, suggesting alternatives, and creating realistic timelines. Many couples find that better planning leads to smarter spending on major life events."
            />
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-center mt-20"
        >
          <h2
            className="text-4xl font-light italic mb-6"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: '#2D2926'
            }}
          >
            Ready to Plan Your Future Together?
          </h2>
          <p className="text-lg mb-8" style={{ color: '#6B5E54' }}>
            Start building your future together today.
          </p>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleUpgrade('premium')}
            disabled={loading}
            className="px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-3 mx-auto disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #C4785A 0%, #d4916f 100%)',
              color: 'white',
              boxShadow: '0 8px 24px rgba(196, 120, 90, 0.4)'
            }}
          >
            Start Your Twogether Pro Journey
            <Heart size={20} fill="currentColor" />
          </motion.button>
          <p className="text-xs mt-4" style={{ color: '#8B8178' }}>
            No credit card required for free plan • Cancel anytime
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// Helper Components
const FeatureItem = ({ icon: Icon, text, included = false, bold = false, premium = false }) => (
  <div className="flex items-start gap-3">
    <Icon
      size={18}
      className="shrink-0 mt-0.5"
      style={{ color: included ? (premium ? '#C4785A' : '#7d8c75') : '#D4CEC6' }}
    />
    <span
      className={`text-sm ${bold ? 'font-semibold' : ''}`}
      style={{ color: included ? '#2D2926' : '#8B8178' }}
    >
      {text}
    </span>
  </div>
);

const FeatureHighlight = ({ icon, title, description }) => (
  <div
    className="rounded-xl p-6 text-center"
    style={{
      backgroundColor: 'white',
      border: '1px solid #E8E2DA'
    }}
  >
    <div className="flex justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2" style={{ color: '#2D2926' }}>
      {title}
    </h3>
    <p className="text-sm leading-relaxed" style={{ color: '#6B5E54' }}>
      {description}
    </p>
  </div>
);

const ComparisonCard = ({ label, price, description, highlighted = false }) => (
  <div
    className="rounded-xl p-4 text-center"
    style={{
      backgroundColor: highlighted ? '#FEF7ED' : 'white',
      border: highlighted ? '2px solid #C4785A' : '1px solid #E8E2DA'
    }}
  >
    <p className="text-xs font-semibold mb-2" style={{ color: '#8B8178' }}>{label}</p>
    <p className="text-2xl font-bold mb-1" style={{ color: highlighted ? '#C4785A' : '#2D2926' }}>
      {price}
    </p>
    <p className="text-xs" style={{ color: '#6B5E54' }}>{description}</p>
  </div>
);

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="rounded-xl p-6 cursor-pointer transition-all"
      style={{
        backgroundColor: 'white',
        border: '1px solid #E8E2DA'
      }}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex items-center justify-between">
        <h4 className="font-semibold" style={{ color: '#2D2926' }}>{question}</h4>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ArrowRight size={18} style={{ color: '#C4785A', transform: 'rotate(90deg)' }} />
        </motion.div>
      </div>
      {isOpen && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 text-sm leading-relaxed"
          style={{ color: '#6B5E54' }}
        >
          {answer}
        </motion.p>
      )}
    </div>
  );
};

export default PricingPage;
