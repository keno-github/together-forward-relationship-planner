import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Trophy, Target, Heart, TrendingUp, Edit2, Save, X, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../services/supabaseService';
import { getUserRoadmaps, getMilestonesByRoadmap, getAchievementsByRoadmap } from '../services/supabaseService';
import BackButton from './BackButton';

const Profile = ({ onBack }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalRoadmaps: 0,
    totalMilestones: 0,
    completedMilestones: 0,
    totalXP: 0,
    totalAchievements: 0
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    avatar_url: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfileAndStats();
  }, [user]);

  const loadProfileAndStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load profile
      const { data: profileData } = await getUserProfile(user.id);
      if (profileData) {
        setProfile(profileData);
        setEditForm({
          full_name: profileData.full_name || '',
          bio: profileData.bio || '',
          avatar_url: profileData.avatar_url || ''
        });
      } else {
        // No profile yet, set defaults
        setProfile({
          id: user.id,
          email: user.email,
          full_name: '',
          bio: '',
          avatar_url: '',
          created_at: user.created_at
        });
      }

      // Load roadmaps and calculate stats
      const { data: roadmaps } = await getUserRoadmaps();
      if (roadmaps && roadmaps.length > 0) {
        let totalMilestones = 0;
        let completedMilestones = 0;
        let totalXP = 0;
        let totalAchievements = 0;

        for (const roadmap of roadmaps) {
          // Get milestones
          const { data: milestones } = await getMilestonesByRoadmap(roadmap.id);
          if (milestones) {
            totalMilestones += milestones.length;
            completedMilestones += milestones.filter(m => m.completed).length;
          }

          // Get achievements
          const { data: achievements } = await getAchievementsByRoadmap(roadmap.id);
          if (achievements) {
            totalAchievements += achievements.length;
          }

          // Add XP
          totalXP += roadmap.xp_points || 0;
        }

        setStats({
          totalRoadmaps: roadmaps.length,
          totalMilestones,
          completedMilestones,
          totalXP,
          totalAchievements
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (editing) {
      // Cancel editing
      setEditForm({
        full_name: profile?.full_name || '',
        bio: profile?.bio || '',
        avatar_url: profile?.avatar_url || ''
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
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
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

  const completionRate = stats.totalMilestones > 0
    ? Math.round((stats.completedMilestones / stats.totalMilestones) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen animated-gradient-bg flex items-center justify-center">
        <div className="glass-card-strong rounded-3xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderColor: '#C084FC'}}></div>
          <p className="text-center" style={{color: '#2B2B2B'}}>Loading profile...</p>
        </div>
      </div>
    );
  }

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
      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8 mb-6"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-6 flex-1">
              {/* Avatar */}
              <div className="relative">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover pulse-glow"
                    style={{border: '4px solid rgba(192, 132, 252, 0.3)'}}
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold pulse-glow"
                    style={{
                      background: 'linear-gradient(135deg, #C084FC, #F8C6D0)',
                      color: 'white'
                    }}
                  >
                    {getInitials(profile?.full_name, user?.email)}
                  </div>
                )}
                {editing && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute bottom-0 right-0 glass-card-strong rounded-full p-2"
                    style={{border: '2px solid #C084FC'}}
                  >
                    <Camera className="w-4 h-4" style={{color: '#C084FC'}} />
                  </motion.button>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block" style={{color: '#2B2B2B', opacity: 0.7}}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                        placeholder="Enter your name"
                        className="w-full glass-card-light rounded-xl px-4 py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                        style={{color: '#2B2B2B'}}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block" style={{color: '#2B2B2B', opacity: 0.7}}>
                        Bio
                      </label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                        placeholder="Tell us about yourself..."
                        rows={3}
                        className="w-full glass-card-light rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        style={{color: '#2B2B2B'}}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold mb-2" style={{color: '#2B2B2B'}}>
                      {profile?.full_name || 'Your Profile'}
                    </h1>
                    <div className="flex items-center gap-2 mb-3" style={{color: '#2B2B2B', opacity: 0.7}}>
                      <Mail className="w-4 h-4" />
                      <span>{user?.email}</span>
                    </div>
                    {profile?.bio && (
                      <p className="text-sm mb-3" style={{color: '#2B2B2B', opacity: 0.8}}>
                        {profile.bio}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm" style={{color: '#2B2B2B', opacity: 0.5}}>
                      <Calendar className="w-4 h-4" />
                      <span>
                        Joined {new Date(profile?.created_at || user?.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <div className="flex gap-2">
              {editing ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="glass-button px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleEditToggle}
                    disabled={saving}
                    className="glass-card-light px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:glass-card-strong transition-all"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEditToggle}
                  className="glass-card-light px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:glass-card-strong transition-all"
                >
                  <Edit2 className="w-4 h-4" style={{color: '#C084FC'}} />
                  Edit Profile
                </motion.button>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Total Roadmaps */}
            <div className="glass-card-light rounded-2xl p-4 text-center">
              <Heart className="w-6 h-6 mx-auto mb-2" style={{color: '#F8C6D0'}} />
              <p className="text-2xl font-bold" style={{color: '#2B2B2B'}}>{stats.totalRoadmaps}</p>
              <p className="text-xs" style={{color: '#2B2B2B', opacity: 0.6}}>Roadmaps</p>
            </div>

            {/* Total Milestones */}
            <div className="glass-card-light rounded-2xl p-4 text-center">
              <Target className="w-6 h-6 mx-auto mb-2" style={{color: '#C084FC'}} />
              <p className="text-2xl font-bold" style={{color: '#2B2B2B'}}>{stats.totalMilestones}</p>
              <p className="text-xs" style={{color: '#2B2B2B', opacity: 0.6}}>Milestones</p>
            </div>

            {/* Completed */}
            <div className="glass-card-light rounded-2xl p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2" style={{color: '#10B981'}} />
              <p className="text-2xl font-bold" style={{color: '#2B2B2B'}}>{stats.completedMilestones}</p>
              <p className="text-xs" style={{color: '#2B2B2B', opacity: 0.6}}>Completed</p>
            </div>

            {/* XP Points */}
            <div className="glass-card-light rounded-2xl p-4 text-center">
              <Trophy className="w-6 h-6 mx-auto mb-2" style={{color: '#FFD580'}} />
              <p className="text-2xl font-bold" style={{color: '#FFD580'}}>{stats.totalXP}</p>
              <p className="text-xs" style={{color: '#2B2B2B', opacity: 0.6}}>XP Earned</p>
            </div>

            {/* Completion Rate */}
            <div className="glass-card-light rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold mb-1" style={{color: '#2B2B2B'}}>{completionRate}%</div>
              <p className="text-xs" style={{color: '#2B2B2B', opacity: 0.6}}>Completion</p>
            </div>
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-8"
        >
          <h2 className="text-2xl font-bold mb-4" style={{color: '#2B2B2B'}}>
            Account Information
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 glass-card-light rounded-xl">
              <div>
                <p className="font-medium" style={{color: '#2B2B2B'}}>Email Address</p>
                <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.6}}>{user?.email}</p>
              </div>
              <Mail className="w-5 h-5" style={{color: '#C084FC'}} />
            </div>

            <div className="flex items-center justify-between p-4 glass-card-light rounded-xl">
              <div>
                <p className="font-medium" style={{color: '#2B2B2B'}}>User ID</p>
                <p className="text-sm font-mono" style={{color: '#2B2B2B', opacity: 0.6}}>
                  {user?.id.substring(0, 20)}...
                </p>
              </div>
              <User className="w-5 h-5" style={{color: '#C084FC'}} />
            </div>

            <div className="flex items-center justify-between p-4 glass-card-light rounded-xl">
              <div>
                <p className="font-medium" style={{color: '#2B2B2B'}}>Account Created</p>
                <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.6}}>
                  {new Date(profile?.created_at || user?.created_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <Calendar className="w-5 h-5" style={{color: '#C084FC'}} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
