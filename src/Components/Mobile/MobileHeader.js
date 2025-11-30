import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Home,
  Target,
  User,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../../config/supabaseClient';

/**
 * Mobile Header Component
 *
 * Simplified top bar for mobile with hamburger menu
 * Only visible on screens < 768px
 *
 * Uses stage-based navigation (not React Router)
 */
const MobileHeader = ({ title, showBack, onBack, user, onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (onNavigate) onNavigate('landing');
    setMenuOpen(false);
  };

  // Handle navigation
  const handleNavigate = (stage) => {
    if (onNavigate) onNavigate(stage);
    setMenuOpen(false);
  };

  // Menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, stage: 'dashboard' },
    { id: 'portfolio', label: 'My Dreams', icon: Target, stage: 'portfolioOverview' },
    { id: 'profile', label: 'Profile', icon: User, stage: 'profile' },
    { id: 'settings', label: 'Settings', icon: Settings, stage: 'settings' },
  ];

  return (
    <>
      {/* Header Bar */}
      <header className="mobile-header">
        {/* Left: Back button or Menu */}
        {showBack ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="touch-target"
            aria-label="Go back"
          >
            <ChevronRight className="w-6 h-6 rotate-180" style={{ color: '#2d2926' }} />
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen(true)}
            className="touch-target"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" style={{ color: '#2d2926' }} />
          </motion.button>
        )}

        {/* Center: Logo or Title */}
        <div className="flex-1 text-center">
          {title ? (
            <h1
              className="text-lg font-semibold truncate px-4"
              style={{ color: '#2d2926', fontFamily: "'Playfair Display', serif" }}
            >
              {title}
            </h1>
          ) : (
            <span
              className="text-xl font-semibold"
              style={{ color: '#2d2926', fontFamily: "'Playfair Display', serif" }}
            >
              Twogether Forward
            </span>
          )}
        </div>

        {/* Right: Notifications or Avatar */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleNavigate('profile')}
          className="touch-target"
          aria-label="Profile"
        >
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#c49a6c' }}
            >
              <User className="w-4 h-4 text-white" />
            </div>
          )}
        </motion.button>
      </header>

      {/* Slide-out Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl"
              style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#e8e4de' }}>
                <span
                  className="text-xl font-semibold"
                  style={{ color: '#2d2926', fontFamily: "'Playfair Display', serif" }}
                >
                  Menu
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMenuOpen(false)}
                  className="touch-target"
                >
                  <X className="w-6 h-6" style={{ color: '#6b635b' }} />
                </motion.button>
              </div>

              {/* User Info */}
              {user && (
                <div className="p-4 border-b" style={{ borderColor: '#e8e4de', backgroundColor: '#faf8f5' }}>
                  <div className="flex items-center gap-3">
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#c49a6c' }}
                      >
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{ color: '#2d2926' }}>
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </p>
                      <p className="text-sm truncate" style={{ color: '#6b635b' }}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Items */}
              <nav className="py-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.98, backgroundColor: '#f5f2ed' }}
                      onClick={() => handleNavigate(item.stage)}
                      className="w-full flex items-center gap-4 px-4 py-3 text-left"
                    >
                      <Icon className="w-5 h-5" style={{ color: '#6b635b' }} />
                      <span style={{ color: '#2d2926' }}>{item.label}</span>
                      <ChevronRight className="w-4 h-4 ml-auto" style={{ color: '#d1d5db' }} />
                    </motion.button>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: '#e8e4de', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl"
                  style={{ backgroundColor: '#faf8f5', color: '#b07d62' }}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileHeader;
