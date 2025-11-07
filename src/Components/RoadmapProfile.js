import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trophy, Target, Calendar, ArrowRight, TrendingUp, CheckCircle, Circle, Clock, Edit, Trash2 } from 'lucide-react';
import BackButton from './BackButton';
import { getMilestonesByRoadmap } from '../services/supabaseService';

const RoadmapProfile = ({ roadmap, onContinueJourney, onBack, onEdit, onDelete }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMilestones: 0,
    completedMilestones: 0,
    inProgressMilestones: 0,
    upcomingMilestones: 0,
    progressPercentage: 0
  });

  useEffect(() => {
    loadMilestones();
  }, [roadmap.id]);

  const loadMilestones = async () => {
    setLoading(true);
    try {
      const { data: milestonesData, error } = await getMilestonesByRoadmap(roadmap.id);

      if (error) throw error;

      if (milestonesData) {
        setMilestones(milestonesData);

        // Calculate stats
        const completed = milestonesData.filter(m => m.completed).length;
        const inProgress = milestonesData.filter(m => !m.completed && m.in_progress).length;
        const upcoming = milestonesData.filter(m => !m.completed && !m.in_progress).length;
        const total = milestonesData.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        setStats({
          totalMilestones: total,
          completedMilestones: completed,
          inProgressMilestones: inProgress,
          upcomingMilestones: upcoming,
          progressPercentage: progress
        });
      }
    } catch (error) {
      console.error('Error loading milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneIcon = (milestone) => {
    if (milestone.completed) {
      return <CheckCircle className="w-6 h-6" style={{color: '#10B981'}} />;
    } else if (milestone.in_progress) {
      return <Clock className="w-6 h-6" style={{color: '#FFD580'}} />;
    } else {
      return <Circle className="w-6 h-6" style={{color: '#C084FC', opacity: 0.4}} />;
    }
  };

  const getMilestoneStatusLabel = (milestone) => {
    if (milestone.completed) return 'Completed';
    if (milestone.in_progress) return 'In Progress';
    return 'Upcoming';
  };

  const getMilestoneStatusColor = (milestone) => {
    if (milestone.completed) return 'bg-green-100 text-green-700';
    if (milestone.in_progress) return 'bg-yellow-100 text-yellow-700';
    return 'bg-purple-100 text-purple-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-gradient-bg flex items-center justify-center">
        <div className="glass-card-strong rounded-3xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderColor: '#C084FC'}}></div>
          <p className="text-center" style={{color: '#2B2B2B'}}>Loading your journey...</p>
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
          <BackButton onClick={onBack} label="Dashboard" />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Journey Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8 mb-6"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center pulse-glow">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold" style={{color: '#2B2B2B'}}>
                    {roadmap.title || 'Our Journey Together'}
                  </h1>
                  <p className="text-lg" style={{color: '#2B2B2B', opacity: 0.7}}>
                    {roadmap.partner1_name || 'Partner 1'} & {roadmap.partner2_name || 'Partner 2'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {onEdit && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onEdit}
                  className="glass-card-light p-3 rounded-xl hover:glass-card-strong transition-all"
                  title="Edit Journey"
                >
                  <Edit className="w-5 h-5" style={{color: '#C084FC'}} />
                </motion.button>
              )}
              {onDelete && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onDelete}
                  className="glass-card-light p-3 rounded-xl hover:glass-card-strong transition-all"
                  title="Delete Journey"
                >
                  <Trash2 className="w-5 h-5" style={{color: '#EF4444'}} />
                </motion.button>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Progress */}
            <div className="glass-card-light rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" style={{color: '#10B981'}} />
                <span className="text-sm font-medium" style={{color: '#2B2B2B', opacity: 0.7}}>Progress</span>
              </div>
              <p className="text-3xl font-bold" style={{color: '#2B2B2B'}}>{stats.progressPercentage}%</p>
            </div>

            {/* XP */}
            <div className="glass-card-light rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5" style={{color: '#FFD580'}} />
                <span className="text-sm font-medium" style={{color: '#2B2B2B', opacity: 0.7}}>XP Earned</span>
              </div>
              <p className="text-3xl font-bold" style={{color: '#FFD580'}}>{roadmap.xp_points || 0}</p>
            </div>

            {/* Milestones */}
            <div className="glass-card-light rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5" style={{color: '#C084FC'}} />
                <span className="text-sm font-medium" style={{color: '#2B2B2B', opacity: 0.7}}>Milestones</span>
              </div>
              <p className="text-3xl font-bold" style={{color: '#2B2B2B'}}>
                {stats.completedMilestones}/{stats.totalMilestones}
              </p>
            </div>

            {/* Created */}
            <div className="glass-card-light rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5" style={{color: '#F8C6D0'}} />
                <span className="text-sm font-medium" style={{color: '#2B2B2B', opacity: 0.7}}>Created</span>
              </div>
              <p className="text-sm font-bold" style={{color: '#2B2B2B'}}>
                {new Date(roadmap.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{color: '#2B2B2B'}}>Overall Progress</span>
              <span className="text-sm font-bold" style={{color: '#C084FC'}}>{stats.progressPercentage}%</span>
            </div>
            <div className="w-full h-4 rounded-full overflow-hidden" style={{backgroundColor: 'rgba(192, 132, 252, 0.2)'}}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{background: 'linear-gradient(90deg, #C084FC, #F8C6D0)'}}
              />
            </div>
          </div>

          {/* Continue Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onContinueJourney}
            className="w-full glass-button py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3"
          >
            Continue Your Journey
            <ArrowRight className="w-6 h-6" />
          </motion.button>
        </motion.div>

        {/* Milestones List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-8"
        >
          <h2 className="text-2xl font-bold mb-6" style={{color: '#2B2B2B'}}>
            Your Milestones
          </h2>

          {milestones.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 mx-auto mb-4" style={{color: '#C084FC', opacity: 0.3}} />
              <p className="text-lg" style={{color: '#2B2B2B', opacity: 0.5}}>
                No milestones yet. Continue your journey to create them!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="glass-card-light rounded-2xl p-6 flex items-center gap-4 hover:glass-card transition-all"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {getMilestoneIcon(milestone)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg font-bold" style={{color: '#2B2B2B'}}>
                        {milestone.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getMilestoneStatusColor(milestone)}`}>
                        {getMilestoneStatusLabel(milestone)}
                      </span>
                    </div>
                    {milestone.description && (
                      <p className="text-sm mb-2" style={{color: '#2B2B2B', opacity: 0.7}}>
                        {milestone.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs" style={{color: '#2B2B2B', opacity: 0.5}}>
                      {milestone.duration && (
                        <span>⏱️ {milestone.duration}</span>
                      )}
                      {milestone.estimated_cost && (
                        <span>💰 ${milestone.estimated_cost?.toLocaleString()}</span>
                      )}
                      {milestone.category && (
                        <span className="capitalize">📁 {milestone.category}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default RoadmapProfile;
