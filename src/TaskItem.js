import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

const TaskItem = ({ task, milestone, addAchievement, updateMilestone }) => {
  const toggleComplete = () => {
    const updatedTasks = milestone.tasks.map(t =>
      t.id === task.id ? { ...t, completed: !t.completed } : t
    );
    updateMilestone({ ...milestone, tasks: updatedTasks });
    if (!task.completed) addAchievement('✅ Task Complete', `Completed: ${task.title}`, 10);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
      <button onClick={toggleComplete}>
        {task.completed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />}
      </button>
      <span className={`text-sm flex-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{task.title}</span>
      {task.aiGenerated && <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">AI</span>}
    </div>
  );
};

export default TaskItem;
