import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Trophy, Calendar, Clock, DollarSign, Maximize2, ChevronRight, Brain } from 'lucide-react';

import DeepDiveModal from './DeepDiveModal';
import MileStoneCard from './MileStoneCard';
import SampleData from './SampleData'; // contains roadmap, coupleData, etc.

const TogetherForward = () => {
  const [roadmap, setRoadmap] = useState(SampleData.roadmap || []);
  const [coupleData] = useState(SampleData.coupleData || { partner1: '', partner2: '', timeline: 0 });
  const [xpPoints, setXpPoints] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [deepDiveData, setDeepDiveData] = useState(null);
  const [activeTab, setActiveTab] = useState('roadmap');

  // Chat props for DeepDiveModal
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const addAchievement = (title, description, xp) => {
    setAchievements(prev => [...prev, { title, description }]);
    setXpPoints(prev => prev + (xp || 0));
  };

  const openDeepDive = (milestone) => {
    setDeepDiveData(milestone);
  };

  const sendChatMessage = (message) => {
    if (!message.trim()) return;

    const userMsg = { role: 'user', content: message };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    // Fake assistant response (replace with AI call)
    setTimeout(() => {
      const assistantMsg = { role: 'assistant', content: `Luna says: I see you asked "${message}"` };
      setChatMessages(prev => [...prev, assistantMsg]);
      setIsChatLoading(false);
    }, 1000);
  };

  const getIconComponent = (iconName) => {
    // Simple mapping: extend as needed
    switch(iconName) {
      case 'Heart': return Heart;
      case 'Trophy': return Trophy;
      default: return Heart;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <DeepDiveModal
        deepDiveData={deepDiveData}
        activeTab="cost"
        onClose={() => setDeepDiveData(null)}
        chatProps={{ chatMessages, sendChatMessage, isChatLoading, chatInput, setChatInput }}
      />

      {/* Header */}
      <div className="bg-white shadow-lg sticky top-0 z-30 border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">TogetherForward</h1>
              <p className="text-sm text-gray-500">{coupleData.partner1} & {coupleData.partner2}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <span className="font-bold text-yellow-700">{xpPoints} XP</span>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Start over?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Brain className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="container mx-auto px-4 py-8 space-y-6">
        {roadmap.map((milestone, index) => (
          <MileStoneCard
            key={milestone.id}
            milestone={milestone}
            selectedMilestone={selectedMilestone}
            setSelectedMilestone={setSelectedMilestone}
            openDeepDive={openDeepDive}
            roadmap={roadmap}
            setRoadmap={setRoadmap}
            addAchievement={addAchievement}
          />
        ))}
      </div>
    </div>
  );
};

export default TogetherForward;
