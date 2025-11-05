import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, DollarSign, Calendar, X, Sparkles } from 'lucide-react';

const CustomizationModal = ({ currentData, onSave, onCancel, userContext }) => {
  const [customLocation, setCustomLocation] = useState(userContext?.location || '');
  const [customBudget, setCustomBudget] = useState(currentData?.totalCostBreakdown?.typical || 0);
  const [customTimeline, setCustomTimeline] = useState(currentData?.duration || '');
  const [customStyle, setCustomStyle] = useState('');

  const handleSave = () => {
    // Calculate budget multiplier for cost adjustments
    const budgetMultiplier = customBudget / (currentData.totalCostBreakdown?.typical || 1);

    const updatedData = {
      ...currentData,

      // Update basic info
      duration: customTimeline,
      estimatedCost: customBudget,

      // Bug #1 & #3 fix - Update AI Analysis "Based on" section with new location and timeline
      aiAnalysis: {
        ...currentData.aiAnalysis,
        basedOn: [
          `${userContext?.partner1} & ${userContext?.partner2}`,
          `Location: ${customLocation}`,
          `Goal: ${currentData.title}`,
          `Timeline: ${customTimeline}`
        ],
        summary: `I've created a personalized plan for ${currentData.title.toLowerCase()} based on your unique situation in ${customLocation}. Let's explore what this journey looks like for you both! 💕`
      },

      // Bug #2 fix - Ensure budget consistency
      totalCostBreakdown: {
        ...currentData.totalCostBreakdown,
        minimum: Math.floor(customBudget * 0.7),
        typical: customBudget,
        maximum: Math.floor(customBudget * 1.4),
        breakdown: (currentData.totalCostBreakdown?.breakdown || []).map(item => ({
          ...item,
          cost: Math.floor(item.cost * budgetMultiplier)
        }))
      },

      // Update hidden costs proportionally
      hiddenCosts: (currentData.hiddenCosts || []).map(cost => ({
        ...cost,
        amount: Math.floor(cost.amount * budgetMultiplier)
      })),

      // Bug #6 fix - Update location-specific info with regulations
      locationSpecific: {
        ...currentData.locationSpecific,
        localCosts: `Costs in ${customLocation} are ${getLocationCostLevel(customLocation)} compared to average`,
        culturalFactors: getCulturalFactorsForLocation(customLocation, currentData.id),
        resources: getLocalResourcesForLocation(customLocation, currentData.id),
        regulations: getLocalRegulations(customLocation, currentData.id)
      },

      // Add customization metadata
      customizations: {
        location: customLocation,
        budget: customBudget,
        timeline: customTimeline,
        style: customStyle,
        notes: customStyle ? `${userContext?.partner1} and ${userContext?.partner2} want a ${customStyle} style` : '',
        customizedAt: new Date().toISOString()
      }
    };

    onSave(updatedData);
  };

  const budgetChange = currentData?.totalCostBreakdown?.typical
    ? ((customBudget / currentData.totalCostBreakdown.typical - 1) * 100).toFixed(0)
    : 0;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
                Customize Your Plan
              </h2>
              <p className="text-gray-600 mt-1">Personalize this milestone: <strong>{currentData?.title}</strong></p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Customization Fields */}
          <div className="space-y-6">
            {/* Location */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-purple-500" />
                Where do you plan this?
              </label>
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="e.g., Paris, New York, Bali"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                <span className="font-medium">Current:</span> {userContext?.location}
                <span className="mx-1">→</span>
                <span className="text-purple-600">This will update costs and resources</span>
              </p>
            </div>

            {/* Budget */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                What's your target budget?
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  {currentData?.totalCostBreakdown?.currency || '€'}
                </span>
                <input
                  type="number"
                  value={customBudget}
                  onChange={(e) => setCustomBudget(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  min="0"
                />
              </div>
              <div className="flex justify-between items-center text-xs mt-1.5">
                <span className="text-gray-500">
                  Original: {currentData?.totalCostBreakdown?.currency}{currentData?.totalCostBreakdown?.typical?.toLocaleString()}
                </span>
                <span className={`font-semibold px-2 py-0.5 rounded-full ${
                  budgetChange > 0 ? 'bg-red-100 text-red-700' :
                  budgetChange < 0 ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {budgetChange > 0 ? '+' : ''}{budgetChange}%
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                When do you want to achieve this?
              </label>
              <input
                type="text"
                value={customTimeline}
                onChange={(e) => setCustomTimeline(e.target.value)}
                placeholder="e.g., 6 months, 1 year, 18 months"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                <span className="font-medium">Original:</span> {currentData?.duration}
              </p>
            </div>

            {/* Style/Preferences (Optional) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                Any style preferences? <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
                placeholder="e.g., vintage, modern, rustic, bohemian, elegant"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                This will be noted in your plan for reference when discussing with Luna
              </p>
            </div>
          </div>

          {/* Preview of Changes */}
          <div className="mt-6 bg-purple-50 rounded-xl p-4 border-2 border-purple-100">
            <p className="text-sm font-semibold text-purple-800 mb-2">✨ What will change:</p>
            <ul className="space-y-1 text-sm text-purple-700">
              <li>• Location updated to <strong>{customLocation || userContext?.location}</strong></li>
              <li>• Budget adjusted to <strong>{currentData?.totalCostBreakdown?.currency}{customBudget?.toLocaleString()}</strong></li>
              <li>• Timeline set to <strong>{customTimeline || currentData?.duration}</strong></li>
              {customStyle && <li>• Style preference: <strong>{customStyle}</strong></li>}
              <li className="pt-2 border-t border-purple-200 mt-2">
                • All cost breakdowns will be recalculated
              </li>
              <li>• Location-specific tips and resources will update</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Save Customization
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Helper functions
const getLocationCostLevel = (location) => {
  const locationLower = location?.toLowerCase() || '';

  // High cost locations
  const highCost = ['new york', 'london', 'tokyo', 'paris', 'san francisco', 'zurich', 'singapore', 'hong kong'];
  if (highCost.some(city => locationLower.includes(city))) {
    return 'significantly higher';
  }

  // Low cost locations
  const lowCost = ['india', 'thailand', 'mexico', 'vietnam', 'philippines', 'indonesia', 'portugal', 'poland'];
  if (lowCost.some(country => locationLower.includes(country))) {
    return 'lower';
  }

  return 'moderate';
};

const getCulturalFactorsForLocation = (location, goalId) => {
  const locationLower = location?.toLowerCase() || '';

  if (goalId === 'marry') {
    if (locationLower.includes('italy')) return 'Italian weddings emphasize family, tradition, and multi-course feasts';
    if (locationLower.includes('japan')) return 'Japanese ceremonies blend Shinto rituals with Western traditions';
    if (locationLower.includes('india')) return 'Multi-day celebrations with rich cultural ceremonies are common';
    if (locationLower.includes('mexico')) return 'Vibrant celebrations with mariachi music and traditional customs';
    if (locationLower.includes('greece')) return 'Greek Orthodox traditions and celebratory dancing are central';
    return 'Consider local wedding customs and traditions for a meaningful ceremony';
  }

  if (goalId === 'home') {
    if (locationLower.includes('us') || locationLower.includes('america')) return 'Competitive market; consider pre-approval and quick decisions';
    if (locationLower.includes('japan')) return 'High upfront costs but stable market; consider long-term property value';
    return 'Research local real estate customs and buyer protection laws';
  }

  return 'Consider local customs, traditions, and cultural norms';
};

const getLocalResourcesForLocation = (location, goalId) => {
  const locationName = location || 'your area';

  if (goalId === 'marry') {
    return [
      `${locationName} wedding venue directory`,
      `Local wedding vendors and suppliers`,
      `${locationName} marriage license office`,
      `Regional wedding planning forums`
    ];
  }

  if (goalId === 'home') {
    return [
      `${locationName} real estate listings (Zillow, Rightmove, etc.)`,
      `Local mortgage brokers and lenders`,
      `${locationName} housing market reports`,
      `Community forums and neighborhood guides`
    ];
  }

  if (goalId === 'vacation') {
    return [
      `${locationName} tourism board website`,
      `Local travel guides and blogs`,
      `Accommodation booking sites (Airbnb, Booking.com)`,
      `${locationName} community travel tips`
    ];
  }

  return [
    `${locationName} community resources`,
    `Local service providers`,
    `Regional planning guides`,
    `Online forums and support groups`
  ];
};

const getLocalRegulations = (location, goalId) => {
  const locationLower = location?.toLowerCase() || '';

  // France regulations
  if (locationLower.includes('paris') || locationLower.includes('france')) {
    const regulations = {
      'marry': 'Must publish banns 10 days before civil ceremony at mairie',
      'home': 'Notary fees (frais de notaire) are 7-8% of purchase price and legally required',
      'default': 'Check prefecture website for local regulations'
    };
    return regulations[goalId] || regulations['default'];
  }

  // Italy regulations
  if (locationLower.includes('italy') || locationLower.includes('como') || locationLower.includes('rome') || locationLower.includes('florence')) {
    const regulations = {
      'marry': 'Nulla osta (certificate of no impediment) required; residency requirement may apply',
      'home': 'Rogito (deed) must be signed before a notaio; cadastral registration mandatory',
      'default': 'Check comune (municipality) website for local requirements'
    };
    return regulations[goalId] || regulations['default'];
  }

  // US regulations
  if (locationLower.includes('united states') || locationLower.includes('usa') || locationLower.includes('new york') || locationLower.includes('california')) {
    const regulations = {
      'marry': 'Marriage license required; waiting period varies by state (24hrs-3 days)',
      'home': 'Title insurance recommended; inspection contingencies vary by state',
      'default': 'Check state and county regulations'
    };
    return regulations[goalId] || regulations['default'];
  }

  // UK regulations
  if (locationLower.includes('london') || locationLower.includes('uk') || locationLower.includes('england')) {
    const regulations = {
      'marry': 'Give notice 29 days before ceremony at local register office',
      'home': 'Solicitor/conveyancer required; stamp duty applies on properties over £250,000',
      'default': 'Check gov.uk for local council requirements'
    };
    return regulations[goalId] || regulations['default'];
  }

  return 'Check local government website for specific requirements';
};

export default CustomizationModal;
