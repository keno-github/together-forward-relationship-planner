import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Lightbulb, ArrowRight
} from 'lucide-react';

/**
 * LunaDailyBrief - Beautifully designed daily briefing card
 *
 * Design: Sophisticated editorial style with warm, inviting colors
 */
const LunaDailyBrief = ({
  focusTask,
  upcomingMilestone,
  lunaSuggestion,
  lastPartnerActivity,
  hasPartner,
  onNavigateToDream,
  preferences = {},
}) => {
  // Don't render if no focus task
  if (!focusTask || focusTask.type === 'no_dreams') return null;

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: '#FFFFFF',
        border: '1px solid #e8e4de',
        boxShadow: '0 4px 12px rgba(45, 41, 38, 0.08)',
      }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >

      {/* Header */}
      <div className="px-6 md:px-7 pt-6 pb-5 border-b" style={{ borderColor: '#e8e4de' }}>
        <div className="flex items-center gap-3">
          <Lightbulb className="w-5 h-5" style={{ color: '#c49a6c' }} />
          <div>
            <h2
              className="text-xl font-semibold"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: '#2d2926',
              }}
            >
              Focus Task
            </h2>
          </div>
        </div>
        <div className="mt-2 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full inline-block" style={{
          backgroundColor: 'rgba(196, 154, 108, 0.12)',
          color: '#a88352',
        }}>
          Daily Brief
        </div>
      </div>

      {/* Content */}
      <div className="px-6 md:px-7 pb-6 pt-5">
        {/* Focus Task - Hero Data */}
        {focusTask && focusTask.type !== 'no_dreams' && (
          <>
            <div className="mb-5">
              <h3
                className="text-2xl md:text-3xl font-normal italic mb-2"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: '#2d2926',
                }}
              >
                {focusTask.message}
              </h3>
              {focusTask.dreamTitle && (
                <p className="text-sm" style={{ color: '#6b635b', fontFamily: "'DM Sans', sans-serif" }}>
                  {focusTask.dreamTitle}
                </p>
              )}
            </div>
          </>
        )}

        {/* Luna Suggestion Box */}
        {lunaSuggestion && (
          <div
            className="p-5 rounded-xl flex gap-3.5 items-start mb-6"
            style={{
              backgroundColor: 'rgba(196, 154, 108, 0.08)',
            }}
          >
            <Lightbulb className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#c49a6c' }} />
            <div className="text-sm leading-relaxed" style={{ color: '#2d2926', fontFamily: "'DM Sans', sans-serif" }}>
              <strong>Luna's Tip:</strong> {lunaSuggestion.message}
            </div>
          </div>
        )}

        {/* Card Footer */}
        <div className="mt-6 pt-5 border-t flex items-center justify-between" style={{ borderColor: '#e8e4de' }}>
          {/* Milestone Link */}
          {upcomingMilestone && (
            <div className="flex items-center gap-2.5 text-sm font-semibold" style={{ color: '#6b635b' }}>
              <Calendar className="w-4 h-4" style={{ color: '#c49a6c' }} />
              <span>
                {upcomingMilestone.isOverdue
                  ? `${Math.abs(upcomingMilestone.daysUntil)} days overdue`
                  : upcomingMilestone.daysUntil === 0
                  ? 'Due today'
                  : `${upcomingMilestone.title} in ${upcomingMilestone.daysUntil} day${upcomingMilestone.daysUntil !== 1 ? 's' : ''}`
                }
              </span>
            </div>
          )}

          {/* View Link */}
          {focusTask?.dreamId && (
            <button
              onClick={() => onNavigateToDream?.(focusTask.dreamId)}
              className="flex items-center gap-2 text-sm font-semibold transition-all group"
              style={{ color: '#c49a6c' }}
            >
              View Milestone
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LunaDailyBrief;
