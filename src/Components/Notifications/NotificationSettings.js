import React, { useState, useEffect } from 'react';
import {
  Bell, Mail, Smartphone, Moon, Clock, Save, Loader2, ArrowLeft,
  BellRing, MessageSquare, Users, CheckCircle, DollarSign
} from 'lucide-react';
import {
  getNotificationPreferences,
  updateNotificationPreferences
} from '../../services/supabaseService';

/**
 * NotificationSettings - Manage notification preferences
 *
 * Features:
 * - Toggle in-app, push, and email notifications
 * - Quiet hours settings
 * - Per-category toggles (future)
 */
const NotificationSettings = ({ onBack }) => {
  const [preferences, setPreferences] = useState({
    in_app_enabled: true,
    push_enabled: true,
    email_enabled: true,
    email_weekly_digest: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data, error } = await getNotificationPreferences();
        if (error) throw error;
        if (data) {
          setPreferences(data);
        }
      } catch (err) {
        console.error('Error loading preferences:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Save preferences
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const { error } = await updateNotificationPreferences(preferences);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  // Update a preference
  const updatePref = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
        <p className="text-sm text-stone-500">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Notification Settings</h1>
          <p className="text-stone-600">Choose how you want to be notified</p>
        </div>
      </div>

      {/* Notification Channels */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50">
          <h2 className="font-semibold text-stone-800">Notification Channels</h2>
          <p className="text-sm text-stone-500">Where you receive notifications</p>
        </div>

        <div className="divide-y divide-stone-100">
          {/* In-App */}
          <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-stone-800">In-App Notifications</p>
                <p className="text-sm text-stone-500">Bell icon badge and dropdown</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.in_app_enabled}
              onChange={(e) => updatePref('in_app_enabled', e.target.checked)}
              className="w-5 h-5 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
            />
          </label>

          {/* Push */}
          <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-stone-800">Push Notifications</p>
                <p className="text-sm text-stone-500">Browser notifications when tab is closed</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.push_enabled}
              onChange={(e) => updatePref('push_enabled', e.target.checked)}
              className="w-5 h-5 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
            />
          </label>

          {/* Email */}
          <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-stone-800">Email Notifications</p>
                <p className="text-sm text-stone-500">Important updates sent to your email</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.email_enabled}
              onChange={(e) => updatePref('email_enabled', e.target.checked)}
              className="w-5 h-5 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
            />
          </label>

          {/* Weekly Digest */}
          <label className={`flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50 ${!preferences.email_enabled ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-stone-800">Weekly Digest</p>
                <p className="text-sm text-stone-500">Summary of your week's progress every Sunday</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.email_weekly_digest}
              onChange={(e) => updatePref('email_weekly_digest', e.target.checked)}
              disabled={!preferences.email_enabled}
              className="w-5 h-5 rounded border-stone-300 text-amber-500 focus:ring-amber-500 disabled:opacity-50"
            />
          </label>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50">
          <h2 className="font-semibold text-stone-800">Quiet Hours</h2>
          <p className="text-sm text-stone-500">Pause notifications during certain times</p>
        </div>

        <div className="p-4">
          {/* Enable Quiet Hours */}
          <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Moon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-stone-800">Enable Quiet Hours</p>
                <p className="text-sm text-stone-500">No notifications during set times</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.quiet_hours_enabled}
              onChange={(e) => updatePref('quiet_hours_enabled', e.target.checked)}
              className="w-5 h-5 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
            />
          </label>

          {/* Time Pickers */}
          {preferences.quiet_hours_enabled && (
            <div className="mt-4 p-4 bg-stone-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-stone-500" />
                  <span className="text-sm text-stone-600">From</span>
                </div>
                <input
                  type="time"
                  value={preferences.quiet_hours_start}
                  onChange={(e) => updatePref('quiet_hours_start', e.target.value)}
                  className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-sm text-stone-600">to</span>
                <input
                  type="time"
                  value={preferences.quiet_hours_end}
                  onChange={(e) => updatePref('quiet_hours_end', e.target.value)}
                  className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Types Preview */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50">
          <h2 className="font-semibold text-stone-800">What You'll Be Notified About</h2>
          <p className="text-sm text-stone-500">Types of notifications you'll receive</p>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3">
          {[
            { icon: Users, label: 'Partner joined', color: 'text-pink-500 bg-pink-50' },
            { icon: CheckCircle, label: 'Task completed', color: 'text-green-500 bg-green-50' },
            { icon: BellRing, label: 'Nudges', color: 'text-orange-500 bg-orange-50' },
            { icon: DollarSign, label: 'Expense updates', color: 'text-emerald-500 bg-emerald-50' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-stone-50">
              <div className={`w-8 h-8 rounded-lg ${item.color.split(' ')[1]} flex items-center justify-center`}>
                <item.icon className={`w-4 h-4 ${item.color.split(' ')[0]}`} />
              </div>
              <span className="text-sm text-stone-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-stone-900 text-white hover:bg-stone-800'
          } disabled:opacity-50`}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;
