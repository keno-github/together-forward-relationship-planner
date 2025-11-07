import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trophy, Plus, ArrowRight, Users, TrendingUp, Target, Calendar, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserRoadmaps, getMilestonesByRoadmap } from '../services/supabaseService';

const Dashboard = ({ onContinueRoadmap, onCreateNew }) => {
  const { user, signOut } = useAuth();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalXP: 0,
    totalMilestones: 0,
    completedMilestones: 0,
    activeRoadmaps: 0
  });

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get all user roadmaps
      const { data: userRoadmaps, error } = await getUserRoadmaps();

      if (error) throw error;

      if (userRoadmaps && userRoadmaps.length > 0) {
        // Load milestones for each roadmap to calculate progress
        const roadmapsWithProgress = await Promise.all(
          userRoadmaps.map(async (roadmap) => {
            const { data: milestones } = await getMilestonesByRoadmap(roadmap.id);

            const totalMilestones = milestones?.length || 0;
            const completedMilestones = milestones?.filter(m => m.completed).length || 0;
            const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

            return {
              ...roadmap,
              milestones: milestones || [],
              totalMilestones,
              completedMilestones,
              progress
            };
          })
        );

        setRoadmaps(roadmapsWithProgress);

        // Calculate overall stats
        const totalXP = roadmapsWithProgress.reduce((sum, r) => sum + (r.xp_points || 0), 0);
        const totalMilestones = roadmapsWithProgress.reduce((sum, r) => sum + r.totalMilestones, 0);
        const completedMilestones = roadmapsWithProgress.reduce((sum, r) => sum + r.completedMilestones, 0);

        setStats({
          totalXP,
          totalMilestones,
          completedMilestones,
          activeRoadmaps: roadmapsWithProgress.length
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-gradient-bg flex items-center justify-center">
        <div className="glass-card-strong rounded-3xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderColor: '#C084FC'}}></div>
          <p className="text-center" style={{color: '#2B2B2B'}}>Loading your roadmaps...</p>
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center pulse-glow">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{color: '#2B2B2B'}}>TogetherForward</h1>
              <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>Your Dashboard</p>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <div className="glass-card-light px-3 py-2 rounded-full flex items-center gap-2">
              <User className="w-4 h-4" style={{color: '#C084FC'}} />
              <span className="text-sm font-medium" style={{color: '#2B2B2B'}}>{user?.email?.split('@')[0]}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="glass-card-light p-2 rounded-full hover:glass-card-strong transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" style={{color: '#2B2B2B'}} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-4xl font-bold mb-2" style={{color: '#2B2B2B'}}>
            Welcome back, {user?.email?.split('@')[0]}! 👋
          </h2>
          <p className="text-lg" style={{color: '#2B2B2B', opacity: 0.7}}>
            Here's your relationship planning progress
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          {/* Stat Card 1 */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl" style={{backgroundColor: 'rgba(192, 132, 252, 0.2)'}}>
                <Heart className="w-6 h-6" style={{color: '#C084FC'}} />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1" style={{color: '#2B2B2B'}}>{stats.activeRoadmaps}</p>
            <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>Active Roadmaps</p>
          </div>

          {/* Stat Card 2 */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl" style={{backgroundColor: 'rgba(255, 213, 128, 0.2)'}}>
                <Trophy className="w-6 h-6" style={{color: '#FFD580'}} />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1" style={{color: '#2B2B2B'}}>{stats.totalXP}</p>
            <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>Total XP Earned</p>
          </div>

          {/* Stat Card 3 */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl" style={{backgroundColor: 'rgba(248, 198, 208, 0.2)'}}>
                <Target className="w-6 h-6" style={{color: '#F8C6D0'}} />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1" style={{color: '#2B2B2B'}}>
              {stats.completedMilestones}/{stats.totalMilestones}
            </p>
            <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>Milestones Done</p>
          </div>

          {/* Stat Card 4 */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl" style={{backgroundColor: 'rgba(16, 185, 129, 0.2)'}}>
                <TrendingUp className="w-6 h-6" style={{color: '#10B981'}} />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1" style={{color: '#2B2B2B'}}>
              {stats.totalMilestones > 0 ? Math.round((stats.completedMilestones / stats.totalMilestones) * 100) : 0}%
            </p>
            <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>Overall Progress</p>
          </div>
        </motion.div>

        {/* Roadmaps Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold" style={{color: '#2B2B2B'}}>Your Roadmaps</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreateNew}
              className="glass-button px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Roadmap
            </motion.button>
          </div>

          {roadmaps.length === 0 ? (
            /* Empty State */
            <div className="glass-card rounded-3xl p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 pulse-glow">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{color: '#2B2B2B'}}>Start Your Journey</h3>
              <p className="mb-6 max-w-md mx-auto" style={{color: '#2B2B2B', opacity: 0.7}}>
                You haven't created any roadmaps yet. Let's build your future together!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCreateNew}
                className="glass-button px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 mx-auto"
              >
                <Plus className="w-6 h-6" />
                Create Your First Roadmap
              </motion.button>
            </div>
          ) : (
            /* Roadmap Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {roadmaps.map((roadmap, index) => (
                <motion.div
                  key={roadmap.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="glass-card rounded-2xl p-6 cursor-pointer"
                  onClick={() => onContinueRoadmap(roadmap)}
                >
                  {/* Roadmap Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold mb-2" style={{color: '#2B2B2B'}}>
                        {roadmap.title || 'Our Journey Together'}
                      </h4>
                      <div className="flex items-center gap-2 text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>
                        <Users className="w-4 h-4" />
                        <span>{roadmap.partner1_name || 'Partner 1'} & {roadmap.partner2_name || 'Partner 2'}</span>
                      </div>
                    </div>
                    <div className="glass-card-light px-3 py-1 rounded-full flex items-center gap-1">
                      <Trophy className="w-4 h-4" style={{color: '#FFD580'}} />
                      <span className="text-sm font-bold" style={{color: '#FFD580'}}>{roadmap.xp_points || 0} XP</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium" style={{color: '#2B2B2B'}}>Progress</span>
                      <span className="text-sm font-bold" style={{color: '#C084FC'}}>{Math.round(roadmap.progress)}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden" style={{backgroundColor: 'rgba(192, 132, 252, 0.2)'}}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${roadmap.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                        className="h-full rounded-full"
                        style={{background: 'linear-gradient(90deg, #C084FC, #F8C6D0)'}}
                      />
                    </div>
                  </div>

                  {/* Milestones Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>
                      <Target className="w-4 h-4" />
                      <span>{roadmap.completedMilestones} of {roadmap.totalMilestones} milestones completed</span>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="flex items-center gap-2 text-xs mb-4" style={{color: '#2B2B2B', opacity: 0.5}}>
                    <Calendar className="w-3 h-3" />
                    <span>Updated {new Date(roadmap.updated_at).toLocaleDateString()}</span>
                  </div>

                  {/* Continue Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onContinueRoadmap(roadmap);
                    }}
                    className="w-full glass-button py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    Continue Journey
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
