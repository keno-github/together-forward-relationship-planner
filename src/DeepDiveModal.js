import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StepsList from './StepsList';
import CostBreakdown from './CostBreakdown';
import TipsSection from './TipsSection';
import ChallengesSection from './ChallengesSection';
import ChatPanel from './ChatPanel';
import OverviewSection from './Components/OverviewSection';

const DeepDiveModal = ({ deepDiveData, activeTab, onClose, chatProps, userContext }) => {
  const [activeDeepDiveTab, setActiveDeepDiveTab] = useState(activeTab || 'overview');

  if (!deepDiveData) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 z-40 flex justify-center items-start pt-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl w-full max-w-4xl p-6 relative"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-800 mb-6">{deepDiveData.title}</h2>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {['overview', 'cost', 'steps', 'tips', 'challenges', 'chat'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveDeepDiveTab(tab)}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  activeDeepDiveTab === tab
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab === 'overview' ? '📊 Overview' :
                 tab === 'cost' ? '💰 Cost' :
                 tab === 'steps' ? '📋 Steps' :
                 tab === 'tips' ? '💡 Tips' :
                 tab === 'challenges' ? '⚠️ Challenges' :
                 '💬 Chat'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto">
            {activeDeepDiveTab === 'overview' && <OverviewSection deepDiveData={deepDiveData} userContext={userContext} />}
            {activeDeepDiveTab === 'cost' && <CostBreakdown totalCostBreakdown={deepDiveData.totalCostBreakdown} hiddenCosts={deepDiveData.hiddenCosts} locationSpecific={deepDiveData.locationSpecific} />}
            {activeDeepDiveTab === 'steps' && <StepsList steps={deepDiveData.detailedSteps} />}
            {activeDeepDiveTab === 'tips' && <TipsSection expertTips={deepDiveData.expertTips} commonMistakes={deepDiveData.commonMistakes} successMetrics={deepDiveData.successMetrics} />}
            {activeDeepDiveTab === 'challenges' && <ChallengesSection challenges={deepDiveData.challenges} warningFlags={deepDiveData.warningFlags} locationSpecific={deepDiveData.locationSpecific} />}
            {activeDeepDiveTab === 'chat' && <ChatPanel {...chatProps} />}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DeepDiveModal;
