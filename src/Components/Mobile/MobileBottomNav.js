import React from 'react';
import { motion } from 'framer-motion';
import { Home, CheckSquare, Sparkles, User } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

/**
 * Mobile Bottom Navigation Bar
 *
 * Fixed bottom navigation for mobile devices (< 768px)
 * Provides quick access to main app sections
 *
 * Works with stage-based navigation (not React Router)
 */
const MobileBottomNav = ({ currentStage, onNavigate }) => {
  const { openChat } = useLuna();

  // Navigation items with stage matching
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      matchStages: ['dashboard', 'portfolioOverview'],
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      matchStages: ['milestoneDetail'], // Tasks are within milestone detail
    },
    {
      id: 'luna',
      label: 'Luna',
      icon: Sparkles,
      matchStages: [], // Luna is a modal, not a stage
      isSpecial: true,
    },
    {
      id: 'profile',
      label: 'Me',
      icon: User,
      matchStages: ['profile', 'settings'],
    },
  ];

  // Check if a nav item is active based on current stage
  const isActive = (item) => {
    return item.matchStages.includes(currentStage);
  };

  // Handle nav item click
  const handleNavClick = (item) => {
    if (item.id === 'luna') {
      // Open Luna chat panel
      openChat();
    } else if (onNavigate) {
      onNavigate(item.id);
    }
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);

        return (
          <motion.button
            key={item.id}
            onClick={() => handleNavClick(item)}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            whileTap={{ scale: 0.9 }}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            style={{ position: 'relative' }}
          >
            {item.isSpecial ? (
              // Luna gets a special styled icon
              <motion.div
                className="relative"
                animate={active ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #c49a6c, #d4a574)',
                    boxShadow: '0 2px 8px rgba(196, 154, 108, 0.3)'
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: '#ffffff' }}
                  />
                </div>
              </motion.div>
            ) : (
              <Icon
                className="w-6 h-6"
                style={{
                  color: active ? '#c49a6c' : '#6b635b',
                  strokeWidth: active ? 2.5 : 2
                }}
              />
            )}

            {!item.isSpecial && (
              <span
                style={{
                  color: active ? '#c49a6c' : '#6b635b',
                  fontWeight: active ? 600 : 500
                }}
              >
                {item.label}
              </span>
            )}

            {/* Active indicator dot */}
            {active && !item.isSpecial && (
              <motion.div
                layoutId="bottomNavActiveIndicator"
                className="absolute -top-1 left-1/2 w-1 h-1 rounded-full"
                style={{
                  backgroundColor: '#c49a6c',
                  transform: 'translateX(-50%)'
                }}
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
