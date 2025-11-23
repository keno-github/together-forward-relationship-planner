import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StepsList from './StepsList';
import CostBreakdown from './CostBreakdown';
import TipsSection from './TipsSection';
import ChallengesSection from './ChallengesSection';
import ChatPanel from './ChatPanel';
import OverviewSection from './Components/OverviewSection';
import CustomizationModal from './Components/CustomizationModal';
import BudgetAllocation from './Components/BudgetAllocation';

const DeepDiveModal = ({
  deepDiveData: initialDeepDiveData,
  activeTab,
  onClose,
  chatProps,
  userContext,
  onUpdateMilestone,
  roadmapId // NEW: Pass roadmap ID for budget tracking
}) => {
  const [activeDeepDiveTab, setActiveDeepDiveTab] = useState(activeTab || 'overview');

  // Local editable state
  const [deepDiveData, setDeepDiveData] = useState(initialDeepDiveData);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Sync with parent when initial data changes
  useEffect(() => {
    setDeepDiveData(initialDeepDiveData);
  }, [initialDeepDiveData]);

  // Handle customization
  const handleCustomize = () => {
    setIsCustomizing(true);
  };

  // Handle customization save
  const handleSaveCustomization = (updatedData) => {
    setDeepDiveData(updatedData);  // Update local state (all tabs refresh)
    if (onUpdateMilestone) {
      onUpdateMilestone(updatedData);  // Update parent state
    }
    setIsCustomizing(false);
  };

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
            {['overview', 'budget', 'cost', 'steps', 'tips', 'challenges', 'chat'].map(tab => (
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
                 tab === 'budget' ? '💰 Budget & Savings' :
                 tab === 'cost' ? '💵 Cost Breakdown' :
                 tab === 'steps' ? '📋 Steps' :
                 tab === 'tips' ? '💡 Tips' :
                 tab === 'challenges' ? '⚠️ Challenges' :
                 '💬 Chat'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto pb-8">
            {activeDeepDiveTab === 'overview' && (
              <OverviewSection
                deepDiveData={deepDiveData}
                userContext={userContext}
                onCustomize={handleCustomize}
              />
            )}
            {activeDeepDiveTab === 'budget' && roadmapId && (
              <BudgetAllocation
                milestone={deepDiveData}
                roadmapId={roadmapId}
                onProgressUpdate={(budgetProgress) => {
                  console.log('Budget progress updated:', budgetProgress);
                  // Optionally notify parent of budget progress
                }}
              />
            )}
            {activeDeepDiveTab === 'cost' && (
              <CostBreakdown
                totalCostBreakdown={deepDiveData.totalCostBreakdown}
                hiddenCosts={deepDiveData.hiddenCosts}
                locationSpecific={deepDiveData.locationSpecific}
              />
            )}
            {activeDeepDiveTab === 'steps' && <StepsList steps={deepDiveData.detailedSteps} />}
            {activeDeepDiveTab === 'tips' && (
              <TipsSection
                expertTips={deepDiveData.expertTips}
                commonMistakes={deepDiveData.commonMistakes}
                successMetrics={deepDiveData.successMetrics}
              />
            )}
            {activeDeepDiveTab === 'challenges' && (
              <ChallengesSection
                challenges={deepDiveData.challenges}
                warningFlags={deepDiveData.warningFlags}
                locationSpecific={deepDiveData.locationSpecific}
              />
            )}
            {activeDeepDiveTab === 'chat' && <ChatPanel {...chatProps} />}
          </div>
        </motion.div>
      </motion.div>

      {/* Customization Modal */}
      {isCustomizing && (
        <CustomizationModal
          currentData={deepDiveData}
          onSave={handleSaveCustomization}
          onCancel={() => setIsCustomizing(false)}
          userContext={userContext}
        />
      )}
    </AnimatePresence>
  );
};

export default DeepDiveModal;
