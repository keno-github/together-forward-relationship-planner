import React from 'react';
import { motion } from 'framer-motion';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import WelcomeHeader from './WelcomeHeader';
import LunaDailyBrief from './LunaDailyBrief';
import ContinueCard from './ContinueCard';
import ActivityPreview from './ActivityPreview';
import MomentumCard from './MomentumCard';
import { useWelcomeBrief } from '../../hooks/useWelcomeBrief';
import { useAggregatedActivity } from '../../hooks/useAggregatedActivity';

/**
 * HomeHub - Stunning welcome home experience
 *
 * Design: High-end editorial with warm, sophisticated aesthetics
 */
const HomeHub = ({
  dashboardData,
  user,
  onClose,
  onNavigateToDream,
  onCreateNew,
}) => {
  // Get welcome brief data
  const {
    hasPartner,
    focusTask,
    upcomingMilestone,
    lunaSuggestion,
    lastPartnerActivity,
    streak,
    overallProgress,
    continueData,
    preferences,
    markAsSeen,
    dreams,
  } = useWelcomeBrief(dashboardData);

  // Get aggregated activities
  const {
    activities,
    loading: activitiesLoading,
    error: activitiesError,
  } = useAggregatedActivity(dreams, { limit: 5, enabled: preferences.showActivityFeed !== false });

  // Handle close - mark as seen and transition to dashboard
  const handleClose = () => {
    markAsSeen();
    onClose?.();
  };

  // Handle continue - navigate to dream and close
  const handleContinue = (dreamId) => {
    markAsSeen();
    onNavigateToDream?.(dreamId);
  };

  // Handle navigate to dream from brief
  const handleNavigateToDream = (dreamId) => {
    markAsSeen();
    onNavigateToDream?.(dreamId);
  };

  // Empty state - no dreams yet
  const isEmpty = !dreams || dreams.length === 0;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #faf8f5 0%, #f5f2ed 50%, #faf8f5 100%)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Background imagery - subtle romantic/planning context */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04]">
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0"
             style={{
               backgroundImage: `
                 radial-gradient(circle at 20% 30%, rgba(196, 154, 108, 0.15) 0%, transparent 50%),
                 radial-gradient(circle at 80% 70%, rgba(125, 140, 117, 0.12) 0%, transparent 50%),
                 radial-gradient(circle at 50% 50%, rgba(212, 196, 168, 0.1) 0%, transparent 40%)
               `,
             }}
        />

        {/* Subtle texture */}
        <div className="absolute inset-0"
             style={{
               backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23c49a6c" fill-opacity="0.03"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
               opacity: 0.3,
             }}
        />
      </div>

      {/* Close button */}
      <motion.button
        onClick={handleClose}
        className="fixed top-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(196, 154, 108, 0.15)',
          boxShadow: '0 4px 12px -2px rgba(45, 41, 38, 0.08)',
        }}
        whileHover={{ scale: 1.05, backgroundColor: '#FFFFFF' }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <X className="w-4 h-4" style={{ color: '#6b635b' }} />
      </motion.button>

      {/* Main content */}
      <div className="relative max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16">
        {/* Welcome Header */}
        <WelcomeHeader dreams={dreams} user={user} />

        {/* Two Column Layout */}
        {!isEmpty ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Main Content (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Luna's Daily Brief */}
              {preferences.showDailyBrief !== false && (
                <LunaDailyBrief
                  focusTask={focusTask}
                  upcomingMilestone={upcomingMilestone}
                  lunaSuggestion={lunaSuggestion}
                  lastPartnerActivity={lastPartnerActivity}
                  hasPartner={hasPartner}
                  onNavigateToDream={handleNavigateToDream}
                  preferences={preferences}
                />
              )}

              {/* Continue Where You Left Off */}
              {preferences.showContinueCard !== false && continueData && (
                <ContinueCard
                  continueData={continueData}
                  onContinue={handleContinue}
                />
              )}
            </div>

            {/* Right Sidebar (1/3 width) */}
            <div className="space-y-6">
              {/* Activity Preview */}
              {preferences.showActivityFeed !== false && (
                <ActivityPreview
                  activities={activities}
                  loading={activitiesLoading}
                  error={activitiesError}
                  maxItems={3}
                />
              )}

              {/* Momentum Tracker */}
              {preferences.showMomentumTracker !== false && (
                <MomentumCard
                  streak={streak}
                  overallProgress={overallProgress}
                />
              )}
            </div>
          </div>
        ) : (
          <EmptyState onCreateNew={onCreateNew} onClose={handleClose} />
        )}

        {/* Enter Dashboard CTA */}
        <motion.div
          className="mt-12 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.button
            onClick={handleClose}
            className="group px-8 py-3.5 rounded-full font-semibold flex items-center gap-3 transition-all relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #c49a6c 0%, #d4b08a 100%)',
              color: 'white',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              boxShadow: '0 4px 16px -4px rgba(196, 154, 108, 0.4)',
            }}
            whileHover={{ scale: 1.02, y: -2, boxShadow: '0 8px 24px -8px rgba(196, 154, 108, 0.5)' }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10">Enter Dashboard</span>
            <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

/**
 * EmptyState - Elegant empty state
 */
const EmptyState = ({ onCreateNew, onClose }) => {
  return (
    <motion.div
      className="rounded-3xl p-12 text-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF9F5 100%)',
        boxShadow: '0 20px 60px -15px rgba(196, 120, 90, 0.15)',
      }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <div className="relative z-10">
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center"
             style={{
               background: 'linear-gradient(135deg, #C4785A 0%, #E8997A 100%)',
               boxShadow: '0 12px 40px -12px rgba(196, 120, 90, 0.4)',
             }}>
          <Sparkles className="w-10 h-10 text-white" />
        </div>

        <h3
          className="text-3xl font-light mb-4"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: '#2D2926',
          }}
        >
          Ready to Begin?
        </h3>

        <p
          className="text-lg mb-8 max-w-md mx-auto leading-relaxed"
          style={{
            color: '#6B5E54',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Create your first dream and let's build a roadmap to make it happen together.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            onClick={onCreateNew}
            className="px-8 py-4 rounded-2xl font-medium transition-all"
            style={{
              background: 'linear-gradient(135deg, #C4785A 0%, #E8997A 100%)',
              color: 'white',
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: '0 12px 40px -12px rgba(196, 120, 90, 0.4)',
            }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            Create Your First Dream
          </motion.button>
        </div>
      </div>

      {/* Decorative element */}
      <div className="absolute bottom-0 right-0 w-64 h-64 opacity-5 pointer-events-none">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="#C4785A" d="M47.5,-65.3C59.9,-56.5,67.5,-41.3,71.8,-25.8C76.1,-10.3,77.1,5.5,73.5,20.4C69.9,35.3,61.7,49.3,49.8,58.7C37.9,68.1,22.3,73,-0.4,73.6C-23.1,74.2,-46.2,70.5,-60.1,59.4C-74,48.3,-78.7,29.8,-78.8,11.7C-78.9,-6.4,-74.4,-24.1,-64.8,-37.7C-55.2,-51.3,-40.5,-60.8,-25.3,-68.4C-10.1,-76,-5,-81.7,4.8,-88.5C14.6,-95.3,35.1,-74.1,47.5,-65.3Z" transform="translate(100 100)" />
        </svg>
      </div>
    </motion.div>
  );
};

export default HomeHub;
