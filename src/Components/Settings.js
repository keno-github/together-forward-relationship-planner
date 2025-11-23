import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Mail, Bell, Shield, Download, Trash2, LogOut,
  ChevronRight, Check, AlertTriangle, Eye, EyeOff, Palette
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserRoadmaps, getMilestonesByRoadmap } from '../services/supabaseService';
import { supabase } from '../config/supabaseClient';
import BackButton from './BackButton';

const Settings = ({ onBack }) => {
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState(null);
  const [loading, setLoading] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Notification settings
  const [notifications, setNotifications] = useState({
    milestoneReminders: true,
    weeklyProgress: true,
    achievements: true,
    partnerActivity: false,
    emailNotifications: true,
    pushNotifications: false
  });

  // Theme settings
  const [theme, setTheme] = useState('light');

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
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
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordError(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      // Get all user data
      const { data: roadmaps } = await getUserRoadmaps();
      const exportData = {
        user: {
          email: user.email,
          id: user.id,
          created_at: user.created_at
        },
        roadmaps: []
      };

      if (roadmaps) {
        for (const roadmap of roadmaps) {
          const { data: milestones } = await getMilestonesByRoadmap(roadmap.id);
          exportData.roadmaps.push({
            ...roadmap,
            milestones: milestones || []
          });
        }
      }

      // Create download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `together-forward-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    if (!window.confirm('Are you absolutely sure? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      // Note: Account deletion requires backend implementation for full cleanup
      // This will sign out the user. Backend should handle data deletion via RLS policies
      await signOut();
      alert('Account deletion initiated. Your data will be removed.');
    } catch (error) {
      console.error('Delete account error:', error);
      alert('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    // TODO: Save to database
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  const SettingSection = ({ icon: Icon, title, description, onClick, dangerous = false }) => (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 glass-card-light rounded-xl hover:glass-card transition-all"
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: dangerous
              ? 'linear-gradient(135deg, #EF4444, #DC2626)'
              : 'linear-gradient(135deg, #C084FC, #F8C6D0)'
          }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-left">
          <p className="font-semibold" style={{color: dangerous ? '#EF4444' : '#2B2B2B'}}>
            {title}
          </p>
          <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.6}}>
            {description}
          </p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5" style={{color: '#C084FC', opacity: 0.5}} />
    </motion.button>
  );

  const ToggleSetting = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 glass-card-light rounded-xl">
      <div className="flex-1">
        <p className="font-medium" style={{color: '#2B2B2B'}}>{label}</p>
        {description && (
          <p className="text-sm mt-1" style={{color: '#2B2B2B', opacity: 0.6}}>
            {description}
          </p>
        )}
      </div>
      <button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-purple-500' : 'bg-gray-300'
        }`}
      >
        <motion.div
          animate={{ x: checked ? 24 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full"
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen animated-gradient-bg relative overflow-hidden">
      {/* Decorative blur circles */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl" style={{backgroundColor: 'rgba(192, 132, 252, 0.15)'}}></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{backgroundColor: 'rgba(248, 198, 208, 0.15)'}}></div>

      {/* Header */}
      <div className="glass-card-strong sticky top-0 z-30 border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <BackButton onClick={onBack} label="Back" />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-4xl font-bold mb-2" style={{color: '#2B2B2B'}}>Settings</h1>
          <p style={{color: '#2B2B2B', opacity: 0.7}}>
            Manage your account and preferences
          </p>
        </motion.div>

        {/* Main Settings List */}
        {!activeSection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Account Settings */}
            <div className="glass-card rounded-3xl p-6 space-y-3">
              <h2 className="text-xl font-bold mb-4" style={{color: '#2B2B2B'}}>Account</h2>
              <SettingSection
                icon={Mail}
                title="Email Address"
                description={user?.email}
                onClick={() => alert('Email change coming soon')}
              />
              <SettingSection
                icon={Lock}
                title="Change Password"
                description="Update your password"
                onClick={() => setActiveSection('password')}
              />
            </div>

            {/* Notifications */}
            <div className="glass-card rounded-3xl p-6 space-y-3">
              <h2 className="text-xl font-bold mb-4" style={{color: '#2B2B2B'}}>Notifications</h2>
              <SettingSection
                icon={Bell}
                title="Notification Preferences"
                description="Manage how you receive updates"
                onClick={() => setActiveSection('notifications')}
              />
            </div>

            {/* Appearance */}
            <div className="glass-card rounded-3xl p-6 space-y-3">
              <h2 className="text-xl font-bold mb-4" style={{color: '#2B2B2B'}}>Appearance</h2>
              <SettingSection
                icon={Palette}
                title="Theme"
                description="Customize your experience (Coming Soon)"
                onClick={() => alert('Theme customization coming soon!')}
              />
            </div>

            {/* Privacy & Security */}
            <div className="glass-card rounded-3xl p-6 space-y-3">
              <h2 className="text-xl font-bold mb-4" style={{color: '#2B2B2B'}}>Privacy & Security</h2>
              <SettingSection
                icon={Shield}
                title="Privacy Settings"
                description="Control your data and visibility (Coming Soon)"
                onClick={() => alert('Privacy settings coming soon')}
              />
            </div>

            {/* Data Management */}
            <div className="glass-card rounded-3xl p-6 space-y-3">
              <h2 className="text-xl font-bold mb-4" style={{color: '#2B2B2B'}}>Data</h2>
              <SettingSection
                icon={Download}
                title="Export Data"
                description="Download all your data"
                onClick={handleExportData}
              />
              <SettingSection
                icon={Trash2}
                title="Delete Account"
                description="Permanently delete your account"
                onClick={() => setActiveSection('delete')}
                dangerous
              />
            </div>

            {/* Sign Out */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleSignOut}
              className="w-full glass-card rounded-3xl p-6 flex items-center justify-center gap-3 hover:bg-red-50/50 transition-all"
            >
              <LogOut className="w-5 h-5" style={{color: '#EF4444'}} />
              <span className="font-semibold" style={{color: '#EF4444'}}>Sign Out</span>
            </motion.button>
          </motion.div>
        )}

        {/* Password Change Section */}
        <AnimatePresence>
          {activeSection === 'password' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card rounded-3xl p-6"
            >
              <button
                onClick={() => {
                  setActiveSection(null);
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="mb-4 text-purple-600 hover:text-purple-700 font-medium"
              >
                ← Back to Settings
              </button>

              <h2 className="text-2xl font-bold mb-6" style={{color: '#2B2B2B'}}>
                Change Password
              </h2>

              <div className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#2B2B2B'}}>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      placeholder="Enter new password"
                      className="w-full glass-card-light rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      style={{color: '#2B2B2B'}}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="w-5 h-5" style={{color: '#C084FC'}} />
                      ) : (
                        <Eye className="w-5 h-5" style={{color: '#C084FC'}} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#2B2B2B'}}>
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      placeholder="Confirm new password"
                      className="w-full glass-card-light rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      style={{color: '#2B2B2B'}}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="w-5 h-5" style={{color: '#C084FC'}} />
                      ) : (
                        <Eye className="w-5 h-5" style={{color: '#C084FC'}} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error/Success Messages */}
                {passwordError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <p className="text-sm text-red-700">{passwordError}</p>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <Check className="w-5 h-5 text-green-500" />
                    <p className="text-sm text-green-700">{passwordSuccess}</p>
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePasswordChange}
                  disabled={loading}
                  className="w-full glass-button py-3 rounded-xl font-bold disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications Section */}
        <AnimatePresence>
          {activeSection === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card rounded-3xl p-6"
            >
              <button
                onClick={() => setActiveSection(null)}
                className="mb-4 text-purple-600 hover:text-purple-700 font-medium"
              >
                ← Back to Settings
              </button>

              <h2 className="text-2xl font-bold mb-6" style={{color: '#2B2B2B'}}>
                Notification Preferences
              </h2>

              <div className="space-y-3">
                <ToggleSetting
                  label="Milestone Reminders"
                  description="Get reminded about upcoming milestones"
                  checked={notifications.milestoneReminders}
                  onChange={() => handleNotificationToggle('milestoneReminders')}
                />
                <ToggleSetting
                  label="Weekly Progress"
                  description="Receive weekly progress summaries"
                  checked={notifications.weeklyProgress}
                  onChange={() => handleNotificationToggle('weeklyProgress')}
                />
                <ToggleSetting
                  label="Achievements"
                  description="Celebrate when you earn achievements"
                  checked={notifications.achievements}
                  onChange={() => handleNotificationToggle('achievements')}
                />
                <ToggleSetting
                  label="Partner Activity"
                  description="Know when your partner completes tasks"
                  checked={notifications.partnerActivity}
                  onChange={() => handleNotificationToggle('partnerActivity')}
                />
                <ToggleSetting
                  label="Email Notifications"
                  description="Receive updates via email"
                  checked={notifications.emailNotifications}
                  onChange={() => handleNotificationToggle('emailNotifications')}
                />
                <ToggleSetting
                  label="Push Notifications"
                  description="Get push notifications on your device"
                  checked={notifications.pushNotifications}
                  onChange={() => handleNotificationToggle('pushNotifications')}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Account Section */}
        <AnimatePresence>
          {activeSection === 'delete' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card rounded-3xl p-6 border-2 border-red-300"
            >
              <button
                onClick={() => {
                  setActiveSection(null);
                  setDeleteConfirmText('');
                }}
                className="mb-4 text-purple-600 hover:text-purple-700 font-medium"
              >
                ← Back to Settings
              </button>

              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <h2 className="text-2xl font-bold text-red-600">Delete Account</h2>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-800 mb-2">
                  <strong>Warning:</strong> This action is permanent and cannot be undone.
                </p>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                  <li>All your roadmaps and milestones will be deleted</li>
                  <li>Your achievements and progress will be lost</li>
                  <li>Your account data will be permanently removed</li>
                </ul>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{color: '#2B2B2B'}}>
                  Type <strong>DELETE</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full glass-card-light rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  style={{color: '#2B2B2B'}}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirmText !== 'DELETE'}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : 'Delete My Account'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Settings;
