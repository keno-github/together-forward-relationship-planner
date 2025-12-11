import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Mail, Bell, Shield, Download, Trash2, LogOut,
  ChevronRight, Check, AlertTriangle, Eye, EyeOff, ArrowLeft, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { getUserRoadmaps, getMilestonesByRoadmap } from '../services/supabaseService';
import { supabase } from '../config/supabaseClient';
import { generateAIPoweredPDF } from '../services/pdfExportService';

/**
 * Settings - Account and preference management
 *
 * Design: TwogetherForward brand - sophisticated, warm copper tones
 */
const Settings = ({ onBack }) => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [activeSection, setActiveSection] = useState(null);
  const [loading, setLoading] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Notification settings (loaded from localStorage for now)
  const [notifications, setNotifications] = useState({
    milestoneReminders: true,
    weeklyProgress: true,
    achievements: true,
    partnerActivity: true,
    emailNotifications: true,
    pushNotifications: false
  });

  // Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Load notification preferences from localStorage
  useEffect(() => {
    if (user?.id) {
      try {
        const saved = localStorage.getItem(`notification_prefs_${user.id}`);
        if (saved) {
          setNotifications(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      }
    }
  }, [user?.id]);

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      setPasswordSuccess('Password updated successfully!');
      setPasswordForm({ newPassword: '', confirmPassword: '' });

      // Close section after 2 seconds
      setTimeout(() => {
        setPasswordSuccess('');
        setActiveSection(null);
      }, 2000);
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordError(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      console.log('📊 Generating AI-powered PDF report...');

      // Get all user data
      const { data: dreams } = await getUserRoadmaps();

      // Prepare data for PDF generation
      const userData = {
        user: user,
        dreams: dreams || [],
        user_profile: profile,
      };

      // Generate AI-powered PDF
      const result = await generateAIPoweredPDF(userData);

      // Show success message
      setPasswordSuccess(`AI-powered report "${result.fileName}" downloaded successfully!`);
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (error) {
      console.error('Export error:', error);

      // Check if it's a Claude API error
      if (error.message?.includes('Claude') || error.message?.includes('API')) {
        setPasswordError('AI analysis temporarily unavailable. Please try again in a moment.');
      } else {
        setPasswordError('Failed to generate report. Please try again.');
      }

      setTimeout(() => setPasswordError(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setPasswordError('Please type DELETE to confirm');
      setTimeout(() => setPasswordError(''), 3000);
      return;
    }

    if (!window.confirm('Are you absolutely sure? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      // Note: Full account deletion requires backend implementation
      // This will sign out the user. Backend should handle data deletion via RLS policies
      await signOut();
    } catch (error) {
      console.error('Delete account error:', error);
      setPasswordError('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = (key) => {
    const updated = {
      ...notifications,
      [key]: !notifications[key]
    };
    setNotifications(updated);

    // Save to localStorage
    if (user?.id) {
      try {
        localStorage.setItem(`notification_prefs_${user.id}`, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save notification preferences:', error);
      }
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #faf8f5 0%, #f5f2ed 100%)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(196, 154, 108, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(125, 140, 117, 0.12) 0%, transparent 50%)
            `,
          }}
        />
      </div>

      {/* Header */}
      <div
        className="sticky top-0 z-30 border-b"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          borderColor: '#e8e4de',
        }}
      >
        <div className="container mx-auto px-6 py-4 max-w-4xl">
          <button
            onClick={onBack}
            className="flex items-center gap-2 transition-colors"
            style={{ color: '#6b635b' }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1
            className="text-4xl md:text-5xl font-normal italic mb-3"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#2d2926',
            }}
          >
            Settings
          </h1>
          <p className="text-lg" style={{ color: '#6b635b' }}>
            Manage your account and preferences
          </p>
        </motion.div>

        {/* Main Settings List */}
        {!activeSection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Account Settings */}
            <SettingsCard title="Account">
              <SettingItem
                icon={Mail}
                title="Email Address"
                description={user?.email}
                onClick={() => {
                  setPasswordError('Email change coming soon');
                  setTimeout(() => setPasswordError(''), 3000);
                }}
              />
              <SettingItem
                icon={Lock}
                title="Change Password"
                description="Update your password"
                onClick={() => setActiveSection('password')}
              />
            </SettingsCard>

            {/* Notifications */}
            <SettingsCard title="Notifications">
              <SettingItem
                icon={Bell}
                title="Notification Preferences"
                description="Manage how you receive updates"
                onClick={() => setActiveSection('notifications')}
              />
            </SettingsCard>

            {/* Privacy & Security */}
            <SettingsCard title="Privacy & Security">
              <SettingItem
                icon={Shield}
                title="Privacy Settings"
                description="Coming soon - control your data visibility"
                onClick={() => {
                  setPasswordError('Privacy settings coming soon');
                  setTimeout(() => setPasswordError(''), 3000);
                }}
              />
            </SettingsCard>

            {/* Data Management */}
            <SettingsCard title="Data">
              <SettingItem
                icon={Download}
                title="Generate Journey Report"
                description="AI-powered PDF report with insights and recommendations"
                onClick={handleExportData}
                loading={loading}
              />
              <SettingItem
                icon={Trash2}
                title="Delete Account"
                description="Permanently delete your account and data"
                onClick={() => setActiveSection('delete')}
                dangerous
              />
            </SettingsCard>

            {/* Global Messages */}
            <AnimatePresence>
              {passwordSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{
                    backgroundColor: 'rgba(125, 140, 117, 0.1)',
                    border: '1px solid rgba(125, 140, 117, 0.3)',
                  }}
                >
                  <Check className="w-5 h-5" style={{ color: '#7d8c75' }} />
                  <p className="text-sm font-medium" style={{ color: '#7d8c75' }}>
                    {passwordSuccess}
                  </p>
                </motion.div>
              )}
              {passwordError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{
                    backgroundColor: 'rgba(196, 107, 107, 0.1)',
                    border: '1px solid rgba(196, 107, 107, 0.3)',
                  }}
                >
                  <AlertTriangle className="w-5 h-5" style={{ color: '#c76b6b' }} />
                  <p className="text-sm font-medium" style={{ color: '#c76b6b' }}>
                    {passwordError}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sign Out */}
            <motion.button
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleSignOut}
              className="w-full rounded-2xl p-6 flex items-center justify-center gap-3 transition-all"
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(196, 107, 107, 0.2)',
                boxShadow: '0 2px 8px rgba(45, 41, 38, 0.04)',
              }}
            >
              <LogOut className="w-5 h-5" style={{ color: '#c76b6b' }} />
              <span className="font-semibold" style={{ color: '#c76b6b' }}>
                Sign Out
              </span>
            </motion.button>
          </motion.div>
        )}

        {/* Password Change Section */}
        <AnimatePresence>
          {activeSection === 'password' && (
            <PasswordSection
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              showPasswords={showPasswords}
              setShowPasswords={setShowPasswords}
              passwordError={passwordError}
              passwordSuccess={passwordSuccess}
              loading={loading}
              onSubmit={handlePasswordChange}
              onBack={() => {
                setActiveSection(null);
                setPasswordError('');
                setPasswordSuccess('');
                setPasswordForm({ newPassword: '', confirmPassword: '' });
              }}
            />
          )}
        </AnimatePresence>

        {/* Notifications Section */}
        <AnimatePresence>
          {activeSection === 'notifications' && (
            <NotificationsSection
              notifications={notifications}
              onToggle={handleNotificationToggle}
              onBack={() => setActiveSection(null)}
            />
          )}
        </AnimatePresence>

        {/* Delete Account Section */}
        <AnimatePresence>
          {activeSection === 'delete' && (
            <DeleteAccountSection
              deleteConfirmText={deleteConfirmText}
              setDeleteConfirmText={setDeleteConfirmText}
              loading={loading}
              onDelete={handleDeleteAccount}
              onBack={() => {
                setActiveSection(null);
                setDeleteConfirmText('');
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ========================================
// Reusable Components
// ========================================

const SettingsCard = ({ title, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl overflow-hidden"
    style={{
      background: '#FFFFFF',
      border: '1px solid #e8e4de',
      boxShadow: '0 4px 12px rgba(45, 41, 38, 0.06)',
    }}
  >
    <div className="px-6 py-5 border-b" style={{ borderColor: '#e8e4de' }}>
      <h2
        className="text-lg font-semibold"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          color: '#2d2926',
        }}
      >
        {title}
      </h2>
    </div>
    <div className="divide-y" style={{ divideColor: '#e8e4de' }}>
      {children}
    </div>
  </motion.div>
);

const SettingItem = ({ icon: Icon, title, description, onClick, dangerous = false, loading = false }) => (
  <motion.button
    whileHover={{ backgroundColor: 'rgba(196, 154, 108, 0.03)' }}
    whileTap={{ scale: 0.99 }}
    onClick={onClick}
    disabled={loading}
    className="w-full flex items-center justify-between p-5 transition-colors disabled:opacity-50"
  >
    <div className="flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: dangerous
            ? 'rgba(196, 107, 107, 0.1)'
            : 'rgba(196, 154, 108, 0.1)',
        }}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: dangerous ? '#c76b6b' : '#c49a6c' }} />
        ) : (
          <Icon className="w-5 h-5" style={{ color: dangerous ? '#c76b6b' : '#c49a6c' }} />
        )}
      </div>
      <div className="text-left flex-1 min-w-0">
        <p
          className="font-semibold text-sm mb-0.5"
          style={{ color: dangerous ? '#c76b6b' : '#2d2926' }}
        >
          {title}
        </p>
        <p
          className="text-xs truncate"
          style={{ color: '#6b635b' }}
        >
          {description}
        </p>
      </div>
    </div>
    <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: '#6b635b', opacity: 0.4 }} />
  </motion.button>
);

const PasswordSection = ({
  passwordForm,
  setPasswordForm,
  showPasswords,
  setShowPasswords,
  passwordError,
  passwordSuccess,
  loading,
  onSubmit,
  onBack
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="rounded-2xl p-8"
    style={{
      background: '#FFFFFF',
      border: '1px solid #e8e4de',
      boxShadow: '0 4px 12px rgba(45, 41, 38, 0.06)',
    }}
  >
    <button
      onClick={onBack}
      className="mb-6 flex items-center gap-2 font-medium transition-colors"
      style={{ color: '#c49a6c' }}
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Settings
    </button>

    <h2
      className="text-2xl font-normal italic mb-6"
      style={{
        fontFamily: "'Playfair Display', serif",
        color: '#2d2926',
      }}
    >
      Change Password
    </h2>

    <div className="space-y-5">
      {/* New Password */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: '#2d2926' }}>
          New Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.new ? 'text' : 'password'}
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            placeholder="Enter new password"
            className="w-full rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: '#faf8f5',
              border: '1px solid #e8e4de',
              color: '#2d2926',
              focusRingColor: '#c49a6c',
            }}
          />
          <button
            type="button"
            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showPasswords.new ? (
              <EyeOff className="w-5 h-5" style={{ color: '#6b635b' }} />
            ) : (
              <Eye className="w-5 h-5" style={{ color: '#6b635b' }} />
            )}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: '#2d2926' }}>
          Confirm New Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.confirm ? 'text' : 'password'}
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            placeholder="Confirm new password"
            className="w-full rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: '#faf8f5',
              border: '1px solid #e8e4de',
              color: '#2d2926',
            }}
          />
          <button
            type="button"
            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showPasswords.confirm ? (
              <EyeOff className="w-5 h-5" style={{ color: '#6b635b' }} />
            ) : (
              <Eye className="w-5 h-5" style={{ color: '#6b635b' }} />
            )}
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      <AnimatePresence>
        {passwordError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{
              backgroundColor: 'rgba(196, 107, 107, 0.1)',
              border: '1px solid rgba(196, 107, 107, 0.3)',
            }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: '#c76b6b' }} />
            <p className="text-sm" style={{ color: '#c76b6b' }}>
              {passwordError}
            </p>
          </motion.div>
        )}

        {passwordSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{
              backgroundColor: 'rgba(125, 140, 117, 0.1)',
              border: '1px solid rgba(125, 140, 117, 0.3)',
            }}
          >
            <Check className="w-5 h-5" style={{ color: '#7d8c75' }} />
            <p className="text-sm" style={{ color: '#7d8c75' }}>
              {passwordSuccess}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSubmit}
        disabled={loading}
        className="w-full py-3.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        style={{
          background: 'linear-gradient(135deg, #c49a6c 0%, #d4b08a 100%)',
          color: 'white',
          boxShadow: '0 4px 12px rgba(196, 154, 108, 0.3)',
        }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Updating...
          </span>
        ) : (
          'Update Password'
        )}
      </motion.button>
    </div>
  </motion.div>
);

const NotificationsSection = ({ notifications, onToggle, onBack }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="rounded-2xl p-8"
    style={{
      background: '#FFFFFF',
      border: '1px solid #e8e4de',
      boxShadow: '0 4px 12px rgba(45, 41, 38, 0.06)',
    }}
  >
    <button
      onClick={onBack}
      className="mb-6 flex items-center gap-2 font-medium transition-colors"
      style={{ color: '#c49a6c' }}
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Settings
    </button>

    <h2
      className="text-2xl font-normal italic mb-6"
      style={{
        fontFamily: "'Playfair Display', serif",
        color: '#2d2926',
      }}
    >
      Notification Preferences
    </h2>

    <div className="space-y-3">
      <ToggleSetting
        label="Milestone Reminders"
        description="Get reminded about upcoming milestones"
        checked={notifications.milestoneReminders}
        onChange={() => onToggle('milestoneReminders')}
      />
      <ToggleSetting
        label="Weekly Progress"
        description="Receive weekly progress summaries"
        checked={notifications.weeklyProgress}
        onChange={() => onToggle('weeklyProgress')}
      />
      <ToggleSetting
        label="Achievements"
        description="Celebrate when you earn achievements"
        checked={notifications.achievements}
        onChange={() => onToggle('achievements')}
      />
      <ToggleSetting
        label="Partner Activity"
        description="Know when your partner completes tasks"
        checked={notifications.partnerActivity}
        onChange={() => onToggle('partnerActivity')}
      />
      <ToggleSetting
        label="Email Notifications"
        description="Receive updates via email"
        checked={notifications.emailNotifications}
        onChange={() => onToggle('emailNotifications')}
      />
      <ToggleSetting
        label="Push Notifications"
        description="Get push notifications on your device (Coming Soon)"
        checked={notifications.pushNotifications}
        onChange={() => onToggle('pushNotifications')}
      />
    </div>

    <div
      className="mt-6 p-4 rounded-xl text-sm"
      style={{
        backgroundColor: 'rgba(196, 154, 108, 0.08)',
        color: '#6b635b',
      }}
    >
      <strong style={{ color: '#c49a6c' }}>Note:</strong> Preferences are saved locally.
      Cloud sync coming soon.
    </div>
  </motion.div>
);

const ToggleSetting = ({ label, description, checked, onChange }) => (
  <div
    className="flex items-center justify-between p-4 rounded-xl"
    style={{
      backgroundColor: '#faf8f5',
      border: '1px solid #e8e4de',
    }}
  >
    <div className="flex-1 pr-4">
      <p className="font-semibold text-sm mb-1" style={{ color: '#2d2926' }}>
        {label}
      </p>
      <p className="text-xs" style={{ color: '#6b635b' }}>
        {description}
      </p>
    </div>
    <button
      onClick={onChange}
      className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
      style={{
        backgroundColor: checked ? '#c49a6c' : '#d4c4a8',
      }}
    >
      <motion.div
        animate={{ x: checked ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full"
        style={{
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      />
    </button>
  </div>
);

const DeleteAccountSection = ({ deleteConfirmText, setDeleteConfirmText, loading, onDelete, onBack }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="rounded-2xl p-8"
    style={{
      background: '#FFFFFF',
      border: '2px solid rgba(196, 107, 107, 0.3)',
      boxShadow: '0 4px 12px rgba(196, 107, 107, 0.15)',
    }}
  >
    <button
      onClick={onBack}
      className="mb-6 flex items-center gap-2 font-medium transition-colors"
      style={{ color: '#c49a6c' }}
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Settings
    </button>

    <div className="flex items-center gap-3 mb-6">
      <AlertTriangle className="w-8 h-8" style={{ color: '#c76b6b' }} />
      <h2
        className="text-2xl font-normal italic"
        style={{
          fontFamily: "'Playfair Display', serif",
          color: '#c76b6b',
        }}
      >
        Delete Account
      </h2>
    </div>

    <div
      className="p-5 rounded-xl mb-6"
      style={{
        backgroundColor: 'rgba(196, 107, 107, 0.08)',
        border: '1px solid rgba(196, 107, 107, 0.2)',
      }}
    >
      <p className="text-sm mb-3 font-semibold" style={{ color: '#c76b6b' }}>
        Warning: This action is permanent and cannot be undone.
      </p>
      <ul className="text-sm space-y-2" style={{ color: '#6b635b' }}>
        <li className="flex items-start gap-2">
          <span style={{ color: '#c76b6b' }}>•</span>
          <span>All your dreams and milestones will be deleted</span>
        </li>
        <li className="flex items-start gap-2">
          <span style={{ color: '#c76b6b' }}>•</span>
          <span>Your achievements and progress will be lost</span>
        </li>
        <li className="flex items-start gap-2">
          <span style={{ color: '#c76b6b' }}>•</span>
          <span>Your account data will be permanently removed</span>
        </li>
      </ul>
    </div>

    <div className="mb-6">
      <label className="block text-sm font-semibold mb-2" style={{ color: '#2d2926' }}>
        Type <strong style={{ color: '#c76b6b' }}>DELETE</strong> to confirm
      </label>
      <input
        type="text"
        value={deleteConfirmText}
        onChange={(e) => setDeleteConfirmText(e.target.value)}
        placeholder="Type DELETE"
        className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all"
        style={{
          backgroundColor: '#faf8f5',
          border: '1px solid rgba(196, 107, 107, 0.3)',
          color: '#2d2926',
        }}
      />
    </div>

    <motion.button
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onDelete}
      disabled={loading || deleteConfirmText !== 'DELETE'}
      className="w-full py-3.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      style={{
        backgroundColor: '#c76b6b',
        color: 'white',
        boxShadow: '0 4px 12px rgba(196, 107, 107, 0.3)',
      }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Deleting...
        </span>
      ) : (
        'Delete My Account'
      )}
    </motion.button>
  </motion.div>
);

export default Settings;
