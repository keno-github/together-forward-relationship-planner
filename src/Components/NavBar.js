import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, User, Settings, LogOut, MoreVertical, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NavBar = ({
  onGoHome = null,
  onGoToDashboard = null,
  onGoToProfile = null,
  onGoToSettings = null,
  showBackButton = false,
  onBack = null,
  title = null
}) => {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  return (
    <div className="glass-card-strong sticky top-0 z-50 border-b border-white/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo/Home or Back Button */}
          <div className="flex items-center gap-4">
            {showBackButton && onBack ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="flex items-center gap-2 glass-card-light px-4 py-2 rounded-xl hover:glass-card transition-all"
                style={{color: '#2B2B2B'}}
              >
                <span>←</span>
                <span className="font-medium">Back</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGoHome || onGoToDashboard}
                className="flex items-center gap-2"
                style={{color: '#2B2B2B'}}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center pulse-glow"
                  style={{background: 'linear-gradient(135deg, #C084FC, #F8C6D0)'}}
                >
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl hidden sm:block">TogetherForward</span>
              </motion.button>
            )}

            {/* Optional Title */}
            {title && (
              <h1 className="text-lg font-semibold hidden md:block" style={{color: '#2B2B2B'}}>
                {title}
              </h1>
            )}
          </div>

          {/* Right Side - User Menu */}
          {user && (
            <div className="flex items-center gap-3">
              {/* Dashboard Button (if not on dashboard) */}
              {onGoToDashboard && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onGoToDashboard}
                  className="hidden sm:flex items-center gap-2 glass-card-light px-4 py-2 rounded-xl hover:glass-card transition-all"
                  style={{color: '#2B2B2B'}}
                  title="Dashboard"
                >
                  <LayoutDashboard className="w-5 h-5" style={{color: '#C084FC'}} />
                  <span className="font-medium">Dashboard</span>
                </motion.button>
              )}

              {/* User Menu */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="glass-card-strong rounded-full p-3 flex items-center gap-2"
                >
                  <User className="w-5 h-5" style={{color: '#C084FC'}} />
                  <span className="text-sm font-medium px-2 hidden sm:inline" style={{color: '#2B2B2B'}}>
                    {user.email?.split('@')[0]}
                  </span>
                  <MoreVertical className="w-4 h-4" style={{color: '#C084FC'}} />
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 glass-card-strong rounded-xl p-2 min-w-[220px] shadow-xl border border-white/20"
                    >
                      {/* User Info */}
                      <div className="px-3 py-2 border-b border-white/20 mb-2">
                        <p className="text-xs" style={{color: '#2B2B2B', opacity: 0.7}}>Signed in as</p>
                        <p className="text-sm font-medium" style={{color: '#2B2B2B'}}>{user.email}</p>
                      </div>

                      {/* Dashboard */}
                      {onGoToDashboard && (
                        <button
                          onClick={() => {
                            onGoToDashboard();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm"
                          style={{color: '#2B2B2B'}}
                        >
                          <LayoutDashboard className="w-4 h-4" style={{color: '#C084FC'}} />
                          Dashboard
                        </button>
                      )}

                      {/* My Profile */}
                      {onGoToProfile && (
                        <button
                          onClick={() => {
                            onGoToProfile();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm"
                          style={{color: '#2B2B2B'}}
                        >
                          <User className="w-4 h-4" style={{color: '#C084FC'}} />
                          My Profile
                        </button>
                      )}

                      {/* Settings */}
                      {onGoToSettings && (
                        <button
                          onClick={() => {
                            onGoToSettings();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm"
                          style={{color: '#2B2B2B'}}
                        >
                          <Settings className="w-4 h-4" style={{color: '#C084FC'}} />
                          Settings
                        </button>
                      )}

                      <div className="border-t border-white/20 my-2"></div>

                      {/* Sign Out */}
                      <button
                        onClick={() => {
                          handleSignOut();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm"
                        style={{color: '#EF4444'}}
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavBar;
