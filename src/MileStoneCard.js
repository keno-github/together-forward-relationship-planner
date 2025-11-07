// MileStoneCard.js
import React from 'react';
import { Clock, DollarSign, ChevronRight, Maximize2, Brain, Heart } from 'lucide-react';
import TaskItem from './TaskItem';

const MileStoneCard = ({ milestone, selectedMilestone, setSelectedMilestone, roadmap, setRoadmap, openDeepDive, addAchievement }) => {
  // Handle both emoji strings and React components for icon
  const IconComponent = milestone.icon || Heart;
  const isEmojiIcon = typeof IconComponent === 'string';

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
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center pulse-glow">
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
                  <span className="px-2 py-0.5 glass-card-light text-xs rounded-full flex items-center gap-1" style={{color: '#C084FC'}}>
                    <Brain className="w-3 h-3" /> AI Generated
                  </span>
                )}
              </div>
              <p className="text-sm mb-3" style={{color: '#2B2B2B', opacity: 0.7}}>{milestone.description}</p>

              {milestone.estimatedCost > 0 && (
                <div className="flex items-center gap-4 text-sm" style={{color: '#2B2B2B', opacity: 0.8}}>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>~€{milestone.estimatedCost.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{milestone.duration}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => openDeepDive(milestone)}
                className="px-4 py-2 glass-button rounded-xl smooth-transition flex items-center gap-2 font-medium"
                title="Deep dive into this goal"
              >
                <Maximize2 className="w-4 h-4" />
                Deep Dive
              </button>
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

          {/* Tasks */}
          {selectedMilestone === milestone.id && milestone.tasks && milestone.tasks.length > 0 && (
            <div className="mt-4 space-y-2 border-t pt-4">
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
        </div>
      </div>
    </div>
  );
};

export default MileStoneCard;
