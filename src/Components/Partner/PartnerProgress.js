import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Check, Clock, TrendingUp, Award } from 'lucide-react';

/**
 * PartnerProgress - Shows task completion and progress per partner
 */
const PartnerProgress = ({ tasks, partnerInfo, userContext }) => {
  const [stats, setStats] = useState({ partner1: {}, partner2: {}, shared: {} });

  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      setStats({ partner1: {}, partner2: {}, shared: {} });
      return;
    }

    // Get partner names
    const partner1Name = partnerInfo?.partner1_name || userContext?.partner1 || 'Partner 1';
    const partner2Name = partnerInfo?.partner2_name || userContext?.partner2 || 'Partner 2';

    // Calculate stats per partner
    const partner1Tasks = tasks.filter(t => t.assigned_to === partner1Name || t.assigned_to_user_id === partnerInfo?.user_id);
    const partner2Tasks = tasks.filter(t => t.assigned_to === partner2Name || t.assigned_to_user_id === partnerInfo?.partner_id);
    const sharedTasks = tasks.filter(t => !t.assigned_to && !t.assigned_to_user_id);

    const calculateStats = (taskList) => {
      const total = taskList.length;
      const completed = taskList.filter(t => t.completed).length;
      const overdue = taskList.filter(t => !t.completed && t.due_date && new Date(t.due_date) < new Date()).length;
      const upcoming = taskList.filter(t => !t.completed && t.due_date && new Date(t.due_date) >= new Date()).length;

      return {
        total,
        completed,
        overdue,
        upcoming,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    };

    setStats({
      partner1: { name: partner1Name, ...calculateStats(partner1Tasks) },
      partner2: { name: partner2Name, ...calculateStats(partner2Tasks) },
      shared: { name: 'Shared', ...calculateStats(sharedTasks) }
    });
  }, [tasks, partnerInfo, userContext]);

  // Don't render if no tasks
  if (!tasks || tasks.length === 0) {
    return null;
  }

  const totalCompleted = (stats.partner1.completed || 0) + (stats.partner2.completed || 0) + (stats.shared.completed || 0);
  const totalTasks = (stats.partner1.total || 0) + (stats.partner2.total || 0) + (stats.shared.total || 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium" style={{ color: '#2d2926' }}>
          Partner Progress
        </h3>
        <span className="text-sm" style={{ color: '#6b635b' }}>
          {totalCompleted} of {totalTasks} tasks
        </span>
      </div>

      {/* Partner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Partner 1 */}
        {stats.partner1.total > 0 && (
          <PartnerCard partner={stats.partner1} color="#c49a6c" />
        )}

        {/* Partner 2 */}
        {stats.partner2.total > 0 && (
          <PartnerCard partner={stats.partner2} color="#7d8c75" />
        )}
      </div>

      {/* Shared Tasks */}
      {stats.shared.total > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(107, 143, 173, 0.08)', border: '1px solid rgba(107, 143, 173, 0.2)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(107, 143, 173, 0.15)' }}
              >
                <User className="w-4 h-4" style={{ color: '#6b8fad' }} />
              </div>
              <span className="font-medium" style={{ color: '#2d2926' }}>
                Shared Tasks
              </span>
            </div>
            <span className="text-sm font-medium" style={{ color: '#6b8fad' }}>
              {stats.shared.percentage}%
            </span>
          </div>

          <div className="h-2 rounded-full" style={{ background: 'rgba(107, 143, 173, 0.2)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.shared.percentage}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{ background: '#6b8fad' }}
            />
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: '#6b635b' }}>
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3" style={{ color: '#7d8c75' }} />
              {stats.shared.completed} done
            </span>
            {stats.shared.overdue > 0 && (
              <span className="flex items-center gap-1" style={{ color: '#c76b6b' }}>
                <Clock className="w-3 h-3" />
                {stats.shared.overdue} overdue
              </span>
            )}
          </div>
        </div>
      )}

      {/* Comparison Bar */}
      {stats.partner1.total > 0 && stats.partner2.total > 0 && (
        <ComparisonBar partner1={stats.partner1} partner2={stats.partner2} />
      )}
    </div>
  );
};

/**
 * Partner Card Component
 */
const PartnerCard = ({ partner, color }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4"
      style={{ background: '#fff', border: '1px solid #e8e4de' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: `${color}20` }}
          >
            <User className="w-4 h-4" style={{ color }} />
          </div>
          <span className="font-medium" style={{ color: '#2d2926' }}>
            {partner.name}
          </span>
        </div>
        <span className="text-lg font-semibold" style={{ color }}>
          {partner.percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 rounded-full mb-3" style={{ background: '#e8e4de' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${partner.percentage}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs" style={{ color: '#6b635b' }}>
        <span className="flex items-center gap-1">
          <Check className="w-3 h-3" style={{ color: '#7d8c75' }} />
          {partner.completed} done
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {partner.total - partner.completed} remaining
        </span>
        {partner.overdue > 0 && (
          <span className="flex items-center gap-1" style={{ color: '#c76b6b' }}>
            <Clock className="w-3 h-3" />
            {partner.overdue} overdue
          </span>
        )}
      </div>
    </motion.div>
  );
};

/**
 * Comparison Bar - Visual comparison of both partners
 */
const ComparisonBar = ({ partner1, partner2 }) => {
  const total = partner1.completed + partner2.completed;
  const p1Percent = total > 0 ? (partner1.completed / total) * 100 : 50;
  const p2Percent = total > 0 ? (partner2.completed / total) * 100 : 50;

  // Determine who's leading
  const leader = partner1.percentage > partner2.percentage ? partner1.name :
                 partner2.percentage > partner1.percentage ? partner2.name : null;

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: '#fff', border: '1px solid #e8e4de' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium" style={{ color: '#2d2926' }}>
          Contribution
        </span>
        {leader && (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
            style={{ background: 'rgba(196, 154, 108, 0.1)', color: '#a88352' }}
          >
            <Award className="w-3 h-3" />
            {leader} leading
          </span>
        )}
      </div>

      <div className="flex h-3 rounded-full overflow-hidden" style={{ background: '#e8e4de' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${p1Percent}%` }}
          transition={{ duration: 0.5 }}
          className="h-full"
          style={{ background: '#c49a6c' }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${p2Percent}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="h-full"
          style={{ background: '#7d8c75' }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs">
        <span style={{ color: '#c49a6c' }}>
          {partner1.name}: {partner1.completed} tasks
        </span>
        <span style={{ color: '#7d8c75' }}>
          {partner2.name}: {partner2.completed} tasks
        </span>
      </div>
    </div>
  );
};

export default PartnerProgress;
