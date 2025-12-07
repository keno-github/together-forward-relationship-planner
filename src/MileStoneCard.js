// MileStoneCard.js
import React, { useState } from 'react';
import { Clock, DollarSign, ChevronRight, Maximize2, Brain, Heart, Receipt, Target, Trash2 } from 'lucide-react';
import TaskItem from './TaskItem';
import ExpenseTracker from './Components/ExpenseTracker';

const MileStoneCard = ({ milestone, selectedMilestone, setSelectedMilestone, roadmap, setRoadmap, openDeepDive, openMilestoneDetail, addAchievement, roadmapId, onDelete }) => {
  // Handle both emoji strings and React components for icon
  const IconComponent = milestone.icon || Heart;
  const isEmojiIcon = typeof IconComponent === 'string';

  // Tab state for viewing tasks vs expenses
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'expenses'

  // Handle delete with confirmation
  const handleDelete = async () => {
    const confirmMessage = `Are you sure you want to delete "${milestone.title}"?\n\nThis will permanently remove:\n- The milestone\n- All associated tasks\n- All budget and expense data\n\nThis action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      if (onDelete) {
        await onDelete(milestone.id);
      }
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 hover:glass-card-strong smooth-transition shimmer">
      <div className="flex items-start gap-4">
        {/* Milestone Icon */}
        <div className={`${milestone.color} w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 pulse-glow relative`}>
          {isEmojiIcon ? (
            <span className="text-2xl">{IconComponent}</span>
          ) : (
            IconComponent && <IconComponent className="w-6 h-6 text-white" />
          )}
          {milestone.aiGenerated && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
              <Brain className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Milestone Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold" style={{color: '#2B2B2B'}}>{milestone.title}</h3>
                {milestone.aiGenerated && (
                  <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-full flex items-center gap-1">
                    <Brain className="w-3 h-3" /> AI Generated
                  </span>
                )}
              </div>
              <p className="text-sm mb-3" style={{color: '#2B2B2B', opacity: 0.7}}>{milestone.description}</p>

              <div className="flex items-center gap-4 text-sm" style={{color: '#2B2B2B', opacity: 0.8}}>
                {/* Budget (new field) or Estimated Cost (legacy field) */}
                {(milestone.budget_amount > 0 || milestone.estimatedCost > 0) && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold">
                      ${(milestone.budget_amount || milestone.estimatedCost || 0).toLocaleString()}
                    </span>
                    {milestone.budget_amount && <span className="text-xs opacity-60">budget</span>}
                  </div>
                )}
                {milestone.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{milestone.duration}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              {/* NEW: Primary action - View Details (multi-section page) */}
              {openMilestoneDetail && (
                <button
                  onClick={() => openMilestoneDetail(milestone, 'overview')}
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl hover:bg-amber-600 hover:shadow-lg smooth-transition flex items-center gap-2 font-medium"
                  title="View full milestone details with overview, roadmap, budget, etc."
                >
                  <Target className="w-4 h-4" />
                  View Details
                </button>
              )}

              {/* Legacy: Deep Dive (kept for backward compatibility) */}
              {openDeepDive && !openMilestoneDetail && (
                <button
                  onClick={() => openDeepDive(milestone)}
                  className="px-4 py-2 glass-button rounded-xl smooth-transition flex items-center gap-2 font-medium"
                  title="Deep dive into this goal"
                >
                  <Maximize2 className="w-4 h-4" />
                  Deep Dive
                </button>
              )}

              {/* Delete Button */}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="p-2 hover:bg-red-100 rounded-lg smooth-transition group"
                  title="Delete this milestone"
                  style={{color: '#EF4444'}}
                >
                  <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              )}

              <button
                onClick={() => setSelectedMilestone(selectedMilestone === milestone.id ? null : milestone.id)}
                className="p-2 hover:glass-card-light rounded-lg smooth-transition"
                style={{color: '#2B2B2B', opacity: 0.6}}
              >
                <ChevronRight
                  className={`w-5 h-5 transition-transform ${selectedMilestone === milestone.id ? 'rotate-90' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Expanded View: Tasks and Expenses */}
          {selectedMilestone === milestone.id && (
            <div className="mt-4 border-t pt-4">
              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`px-4 py-2 rounded-xl font-medium smooth-transition ${
                    activeTab === 'tasks'
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Tasks {milestone.tasks && `(${milestone.tasks.length})`}
                </button>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`px-4 py-2 rounded-xl font-medium smooth-transition flex items-center gap-2 ${
                    activeTab === 'expenses'
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  Budget & Expenses
                </button>
              </div>

              {/* Tasks Tab */}
              {activeTab === 'tasks' && milestone.tasks && milestone.tasks.length > 0 && (
                <div className="space-y-2">
                  {milestone.tasks.map((task) => {
                    // Function to update this specific milestone
                    const updateMilestone = (updatedMilestone) => {
                      const updatedRoadmap = roadmap.map(m =>
                        m.id === updatedMilestone.id ? updatedMilestone : m
                      );
                      setRoadmap(updatedRoadmap);
                    };

                    return (
                      <TaskItem
                        key={task.id}
                        task={task}
                        milestone={milestone}
                        updateMilestone={updateMilestone}
                        addAchievement={addAchievement}
                      />
                    );
                  })}
                </div>
              )}

              {/* Empty tasks state */}
              {activeTab === 'tasks' && (!milestone.tasks || milestone.tasks.length === 0) && (
                <div className="text-center py-8" style={{color: '#2B2B2B', opacity: 0.5}}>
                  <p>No tasks yet for this milestone</p>
                </div>
              )}

              {/* Expenses Tab */}
              {activeTab === 'expenses' && roadmapId && (
                <ExpenseTracker
                  milestone={milestone}
                  roadmapId={roadmapId}
                  onExpensesUpdated={(expenses) => {
                    // Optional: Update milestone with expense summary
                    console.log('Expenses updated:', expenses);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MileStoneCard;
