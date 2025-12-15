import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Calendar, Edit2, Save, X, Camera,
  Bell, Lock, CreditCard, LogOut, Trash2,
  UserPlus, Heart, ChevronRight, Shield, Crown,
  Copy, Check, Link2, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getUserProfile,
  updateUserProfile,
  getUserPartnership,
  getPendingPartnershipInvite,
  createPartnershipInvite,
  cancelPartnership
} from '../services/supabaseService';
import BackButton from './BackButton';

const Profile = ({ onBack, onGoToPricing }) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: ''
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Partnership state
  const [partnership, setPartnership] = useState(null);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [partnershipLoading, setPartnershipLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [cancellingInvite, setCancellingInvite] = useState(false);

  useEffect(() => {
    loadProfile();
    loadPartnership();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: profileData } = await getUserProfile(user.id);
      if (profileData) {
        setProfile(profileData);
        setEditForm({
          full_name: profileData.full_name || '',
          bio: profileData.bio || ''
        });
      } else {
        setProfile({
          id: user.id,
          email: user.email,
          full_name: '',
          bio: '',
          created_at: user.created_at
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPartnership = async () => {
    if (!user) return;

    setPartnershipLoading(true);
    try {
      // Check for active partnership
      const { data: partnershipData } = await getUserPartnership();
      if (partnershipData) {
        setPartnership(partnershipData);
        setPendingInvite(null);
        setInviteCode(null);
      } else {
        // Check for pending invite
        const { data: pendingData } = await getPendingPartnershipInvite();
        if (pendingData) {
          setPendingInvite(pendingData);
          setInviteCode(pendingData.invite_code);
        }
      }
    } catch (error) {
      console.error('Error loading partnership:', error);
    } finally {
      setPartnershipLoading(false);
    }
  };

  const handleGenerateInvite = async () => {
    setGeneratingInvite(true);
    try {
      const { data, error } = await createPartnershipInvite();
      if (error) throw error;

      if (data?.success) {
        setInviteCode(data.invite_code);
        setPendingInvite({ invite_code: data.invite_code });
      } else {
        alert(data?.error || 'Failed to generate invite');
      }
    } catch (error) {
      console.error('Error generating invite:', error);
      alert('Failed to generate invite. Please try again.');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      const inviteLink = `${window.location.origin}/partner-invite/${inviteCode}`;
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleCancelInvite = async () => {
    setCancellingInvite(true);
    try {
      const { data, error } = await cancelPartnership();
      if (error) throw error;
      if (data?.success) {
        setPendingInvite(null);
        setInviteCode(null);
      } else {
        alert(data?.error || 'Failed to cancel invite');
      }
    } catch (error) {
      console.error('Error cancelling invite:', error);
      alert('Failed to cancel invite. Please try again.');
    } finally {
      setCancellingInvite(false);
    }
  };

  const handleEditToggle = () => {
    if (editing) {
      setEditForm({
        full_name: profile?.full_name || '',
        bio: profile?.bio || ''
      });
    }
    setEditing(!editing);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data, error } = await updateUserProfile(user.id, editForm);
      if (error) throw error;
      setProfile(data);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      if (onBack) onBack();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (name, email) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#C4785A' }} />
          <p style={{ color: '#6B5E54' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-30 border-b"
        style={{
          backgroundColor: 'rgba(250, 247, 242, 0.97)',
          backdropFilter: 'blur(10px)',
          borderColor: '#E8E2DA'
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-4">
          <BackButton onClick={onBack} label="Back" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 mb-6"
          style={{ backgroundColor: 'white', border: '1px solid #E8E2DA' }}
        >
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                  style={{ border: '3px solid #E8E2DA' }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #C4785A, #d4916f)',
                    color: 'white'
                  }}
                >
                  {getInitials(profile?.full_name, user?.email)}
                </div>
              )}
              {editing && (
                <button
                  className="absolute bottom-0 right-0 rounded-full p-1.5"
                  style={{ backgroundColor: '#C4785A', color: 'white' }}
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-3 py-2 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: '#FAF7F2',
                      border: '1px solid #E8E2DA',
                      color: '#2D2926',
                      focusRingColor: '#C4785A'
                    }}
                  />
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="A short bio about yourself..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 resize-none"
                    style={{
                      backgroundColor: '#FAF7F2',
                      border: '1px solid #E8E2DA',
                      color: '#2D2926'
                    }}
                  />
                </div>
              ) : (
                <>
                  <h1
                    className="text-xl font-semibold mb-1"
                    style={{ color: '#2D2926', fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {profile?.full_name || 'Your Name'}
                  </h1>
                  <p className="text-sm mb-2" style={{ color: '#6B5E54' }}>
                    {user?.email}
                  </p>
                  {profile?.bio && (
                    <p className="text-sm" style={{ color: '#8B8178' }}>
                      {profile.bio}
                    </p>
                  )}
                  <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#A09890' }}>
                    <Calendar className="w-3 h-3" />
                    Member since {new Date(profile?.created_at || user?.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </>
              )}
            </div>

            {/* Edit Button */}
            <div className="flex-shrink-0">
              {editing ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"
                    style={{ backgroundColor: '#C4785A', color: 'white' }}
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? '...' : 'Save'}
                  </button>
                  <button
                    onClick={handleEditToggle}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: '#FAF7F2', color: '#6B5E54', border: '1px solid #E8E2DA' }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"
                  style={{ backgroundColor: '#FAF7F2', color: '#6B5E54', border: '1px solid #E8E2DA' }}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Partner Connection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl p-5 mb-6"
          style={{ backgroundColor: 'white', border: '1px solid #E8E2DA' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#A09890' }}>
            Partner Connection
          </h2>

          {partnershipLoading ? (
            <div className="rounded-xl p-4 flex items-center justify-center" style={{ backgroundColor: '#FAF7F2' }}>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#C4785A' }} />
            </div>
          ) : partnership ? (
            /* Active Partnership - Show Partner Info */
            <div className="rounded-xl p-4" style={{ backgroundColor: '#FAF7F2' }}>
              <div className="flex items-center gap-4 mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #C4785A, #d4916f)',
                    color: 'white'
                  }}
                >
                  {partnership.partner_name
                    ? partnership.partner_name.substring(0, 2).toUpperCase()
                    : partnership.partner_email?.substring(0, 2).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <p className="font-medium" style={{ color: '#2D2926' }}>
                    {partnership.partner_name || partnership.partner_email || 'Your Partner'}
                  </p>
                  <p className="text-sm flex items-center gap-1" style={{ color: '#6B5E54' }}>
                    <Heart className="w-3 h-3" fill="#C4785A" style={{ color: '#C4785A' }} />
                    Together since {new Date(partnership.together_since).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(125, 140, 117, 0.1)', color: '#7d8c75' }}
                >
                  Connected
                </div>
              </div>
            </div>
          ) : inviteCode || pendingInvite ? (
            /* Pending Invite - Show Invite Code */
            <div className="rounded-xl p-4" style={{ backgroundColor: '#FAF7F2' }}>
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(196, 120, 90, 0.1)' }}
                >
                  <Clock className="w-6 h-6" style={{ color: '#C4785A' }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium" style={{ color: '#2D2926' }}>Invite Pending</p>
                  <p className="text-sm" style={{ color: '#6B5E54' }}>
                    Share this code with your partner
                  </p>
                </div>
              </div>

              {/* Invite Code Display */}
              <div
                className="rounded-lg p-3 mb-3 text-center"
                style={{ backgroundColor: 'white', border: '2px dashed #E8E2DA' }}
              >
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#A09890' }}>
                  Invite Code
                </p>
                <p
                  className="text-2xl font-mono font-bold tracking-widest"
                  style={{ color: '#C4785A' }}
                >
                  {inviteCode}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'white', color: '#6B5E54', border: '1px solid #E8E2DA' }}
                >
                  {codeCopied ? <Check className="w-4 h-4" style={{ color: '#7d8c75' }} /> : <Copy className="w-4 h-4" />}
                  {codeCopied ? 'Copied!' : 'Copy Code'}
                </button>
                <button
                  onClick={handleCopyInviteLink}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#C4785A', color: 'white' }}
                >
                  {linkCopied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                  {linkCopied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              {/* Cancel Invite */}
              <button
                onClick={handleCancelInvite}
                disabled={cancellingInvite}
                className="w-full mt-3 px-3 py-2 rounded-lg text-xs font-medium text-center disabled:opacity-50"
                style={{ color: '#A09890' }}
              >
                {cancellingInvite ? 'Cancelling...' : 'Cancel and generate new code'}
              </button>
            </div>
          ) : (
            /* No Partnership - Show Invite Button */
            <div
              className="rounded-xl p-4 flex items-center gap-4"
              style={{ backgroundColor: '#FAF7F2' }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(196, 120, 90, 0.1)' }}
              >
                <Heart className="w-6 h-6" style={{ color: '#C4785A' }} />
              </div>
              <div className="flex-1">
                <p className="font-medium" style={{ color: '#2D2926' }}>Invite Your Partner</p>
                <p className="text-sm" style={{ color: '#6B5E54' }}>
                  Share your dreams and plan together
                </p>
              </div>
              <button
                onClick={handleGenerateInvite}
                disabled={generatingInvite}
                className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#C4785A', color: 'white' }}
              >
                {generatingInvite ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {generatingInvite ? 'Generating...' : 'Invite'}
              </button>
            </div>
          )}
        </motion.div>

        {/* Subscription */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-5 mb-6"
          style={{ backgroundColor: 'white', border: '1px solid #E8E2DA' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#A09890' }}>
            Subscription
          </h2>

          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{ backgroundColor: '#FAF7F2' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(196, 120, 90, 0.1)' }}
              >
                <Crown className="w-5 h-5" style={{ color: '#C4785A' }} />
              </div>
              <div>
                <p className="font-medium" style={{ color: '#2D2926' }}>Twogether Starter</p>
                <p className="text-sm" style={{ color: '#6B5E54' }}>Free plan</p>
              </div>
            </div>
            {onGoToPricing && (
              <button
                onClick={onGoToPricing}
                className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
                style={{
                  background: 'linear-gradient(135deg, #C4785A, #d4916f)',
                  color: 'white'
                }}
              >
                Upgrade
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl overflow-hidden mb-6"
          style={{ backgroundColor: 'white', border: '1px solid #E8E2DA' }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wider px-5 pt-5 pb-3"
            style={{ color: '#A09890' }}
          >
            Settings
          </h2>

          <SettingsItem
            icon={<Bell className="w-5 h-5" />}
            label="Notifications"
            description="Manage push and email notifications"
          />
          <SettingsItem
            icon={<Mail className="w-5 h-5" />}
            label="Email Preferences"
            description="Weekly updates, tips, and reminders"
          />
          <SettingsItem
            icon={<Lock className="w-5 h-5" />}
            label="Change Password"
            description="Update your account password"
          />
          <SettingsItem
            icon={<Shield className="w-5 h-5" />}
            label="Privacy"
            description="Control what your partner can see"
            isLast
          />
        </motion.div>

        {/* Account Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden mb-6"
          style={{ backgroundColor: 'white', border: '1px solid #E8E2DA' }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wider px-5 pt-5 pb-3"
            style={{ color: '#A09890' }}
          >
            Account
          </h2>

          <button
            onClick={handleSignOut}
            className="w-full px-5 py-4 flex items-center gap-4 hover:bg-stone-50 transition-colors"
            style={{ borderBottom: '1px solid #E8E2DA' }}
          >
            <LogOut className="w-5 h-5" style={{ color: '#6B5E54' }} />
            <div className="text-left">
              <p className="font-medium" style={{ color: '#2D2926' }}>Sign Out</p>
              <p className="text-sm" style={{ color: '#6B5E54' }}>Sign out of your account</p>
            </div>
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full px-5 py-4 flex items-center gap-4 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-5 h-5" style={{ color: '#DC2626' }} />
            <div className="text-left">
              <p className="font-medium" style={{ color: '#DC2626' }}>Delete Account</p>
              <p className="text-sm" style={{ color: '#6B5E54' }}>Permanently delete your account and data</p>
            </div>
          </button>
        </motion.div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(45, 41, 38, 0.5)' }}
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-6 max-w-sm w-full"
              style={{ backgroundColor: 'white' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: '#FEE2E2' }}
                >
                  <Trash2 className="w-6 h-6" style={{ color: '#DC2626' }} />
                </div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: '#2D2926' }}>
                  Delete Account?
                </h3>
                <p className="text-sm" style={{ color: '#6B5E54' }}>
                  This action cannot be undone. All your dreams, roadmaps, and data will be permanently deleted.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-xl font-medium"
                  style={{ backgroundColor: '#FAF7F2', color: '#6B5E54', border: '1px solid #E8E2DA' }}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2 rounded-xl font-medium"
                  style={{ backgroundColor: '#DC2626', color: 'white' }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

// Settings Item Component
const SettingsItem = ({ icon, label, description, isLast = false }) => (
  <button
    className="w-full px-5 py-4 flex items-center gap-4 hover:bg-stone-50 transition-colors"
    style={{ borderBottom: isLast ? 'none' : '1px solid #E8E2DA' }}
  >
    <div style={{ color: '#C4785A' }}>{icon}</div>
    <div className="flex-1 text-left">
      <p className="font-medium" style={{ color: '#2D2926' }}>{label}</p>
      <p className="text-sm" style={{ color: '#6B5E54' }}>{description}</p>
    </div>
    <ChevronRight className="w-5 h-5" style={{ color: '#A09890' }} />
  </button>
);

export default Profile;
