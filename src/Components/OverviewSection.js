import React from 'react';
import { Brain, MapPin, Users, Clock, DollarSign, AlertTriangle, Edit3 } from 'lucide-react';

const OverviewSection = ({ deepDiveData, userContext, onCustomize }) => {
  if (!deepDiveData?.aiAnalysis) return null;

  const { aiAnalysis, totalCostBreakdown, duration, challengescount = deepDiveData.challenges?.length || 0 } = deepDiveData;

  return (
    <div className="space-y-6">
      {/* AI Analysis Header */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  🧠 AI Analysis Complete
                </h2>
                <p className="text-gray-700 font-medium">
                  {aiAnalysis.summary}
                </p>
              </div>
              {onCustomize && (
                <button
                  onClick={onCustomize}
                  className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-300 rounded-lg text-purple-700 font-semibold hover:bg-purple-50 hover:border-purple-400 transition-all shadow-sm hover:shadow-md flex-shrink-0"
                >
                  <Edit3 className="w-4 h-4" />
                  Customize
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Based On - Bug #4 fix: cleaner presentation */}
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-2">
            {aiAnalysis.basedOn.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg px-3 py-2 text-sm text-gray-700 border border-purple-100"
              >
                • {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Timeline */}
        <div className="bg-white rounded-xl p-4 border-2 border-blue-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-700 text-sm">Timeline</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">{duration || 'varies'}</p>
          <p className="text-xs text-gray-500 mt-1">Realistic estimate</p>
        </div>

        {/* Budget */}
        <div className="bg-white rounded-xl p-4 border-2 border-green-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-gray-700 text-sm">Budget</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {totalCostBreakdown?.currency}{totalCostBreakdown?.typical?.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {totalCostBreakdown?.currency}{totalCostBreakdown?.minimum?.toLocaleString()} - {totalCostBreakdown?.currency}{totalCostBreakdown?.maximum?.toLocaleString()}
          </p>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl p-4 border-2 border-purple-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-700 text-sm">Location</h3>
            </div>
            {onCustomize && (
              <button
                onClick={onCustomize}
                className="text-purple-500 hover:text-purple-700 transition-colors"
                title="Customize this milestone"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-lg font-bold text-purple-600">{userContext?.location || 'Unknown'}</p>
          <p className="text-xs text-gray-500 mt-1">Cost level: {deepDiveData.locationSpecific?.localCosts?.includes('higher') ? 'High' : 'Moderate'}</p>
        </div>

        {/* Challenges - Bug #4 fix: proper formatting */}
        <div className="bg-white rounded-xl p-4 border-2 border-orange-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-700 text-sm">Challenges</h3>
          </div>
          <p className="text-2xl font-bold text-orange-600">{challengescount}</p>
          <p className="text-xs text-gray-500 mt-1">Identified with solutions</p>
        </div>
      </div>

      {/* What's Involved - Bug #7 fix: softer tone */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-500" />
          Your Personalized Journey: {userContext?.partner1} & {userContext?.partner2}
        </h3>

        <div className="space-y-6">
          {/* Financial Requirements */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 text-lg">💰 Financial Requirements:</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {totalCostBreakdown?.breakdown?.slice(0, 3).map((item, index) => (
                <div key={index} className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">{item.item}</span>
                    {item.required && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Required</span>}
                    <p className="text-sm text-gray-600">{item.notes}</p>
                  </div>
                  <span className="font-bold text-gray-800 ml-4">
                    {totalCostBreakdown?.currency}{item.cost?.toLocaleString()}
                  </span>
                </div>
              ))}
              <p className="text-sm text-purple-600 font-medium mt-3 flex items-center gap-1">
                💰 Want to see the full cost breakdown? Check the Cost tab above!
              </p>
            </div>
          </div>

          {/* Process Overview */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 text-lg">📋 Process Steps:</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 mb-3">
                This goal involves <strong>{deepDiveData.detailedSteps?.length || 0} detailed steps</strong>.
                Here are the first few:
              </p>
              <ol className="space-y-2">
                {deepDiveData.detailedSteps?.slice(0, 3).map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="font-bold text-indigo-500">{step.step}.</span>
                    <div className="flex-1">
                      <span className="font-medium text-gray-800">{step.title}</span>
                      <p className="text-sm text-gray-600">{step.description}</p>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        <span>⏱️ {step.duration}</span>
                        <span className={`capitalize ${
                          step.difficulty === 'easy' ? 'text-green-600' :
                          step.difficulty === 'medium' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {step.difficulty}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="text-sm text-blue-600 font-medium mt-3 flex items-center gap-1">
                📋 Ready for the complete step-by-step guide? Head to the Steps tab!
              </p>
            </div>
          </div>

          {/* Top Challenges */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 text-lg">⚠️ Challenges You'll Face:</h4>
            <div className="bg-orange-50 rounded-lg p-4 space-y-3">
              {deepDiveData.challenges?.slice(0, 2).map((challenge, index) => (
                <div key={index} className="border-l-4 border-orange-400 pl-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">{challenge.challenge}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      challenge.likelihood === 'high' || challenge.likelihood === 'very high'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {challenge.likelihood} likelihood
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>Solution:</strong> {challenge.solution}
                  </p>
                </div>
              ))}
              <p className="text-sm text-orange-600 font-medium mt-3 flex items-center gap-1">
                ⚠️ Want to explore all challenges with solutions? Visit the Challenges tab!
              </p>
            </div>
          </div>

          {/* Location-Specific Info */}
          {deepDiveData.locationSpecific && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 text-lg">
                🌍 Specific to {userContext?.location}:
              </h4>
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                {deepDiveData.locationSpecific.culturalFactors && (
                  <p className="text-gray-700">
                    <strong>Cultural note:</strong> {deepDiveData.locationSpecific.culturalFactors}
                  </p>
                )}
                {deepDiveData.locationSpecific.regulations && (
                  <p className="text-gray-700">
                    <strong>Regulations:</strong> {deepDiveData.locationSpecific.regulations}
                  </p>
                )}
                {deepDiveData.locationSpecific.resources && (
                  <div>
                    <strong className="text-gray-700">Local resources:</strong>
                    <ul className="ml-4 mt-1 text-sm text-gray-600">
                      {deepDiveData.locationSpecific.resources.map((resource, index) => (
                        <li key={index}>• {resource}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-2">🎯 Ready to get started?</h3>
        <p className="mb-4">
          Explore the tabs above for detailed costs, step-by-step guidance, expert tips, and chat with Luna for personalized advice!
        </p>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm">💰 Cost breakdown</span>
          <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm">📋 Step-by-step guide</span>
          <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm">💡 Expert tips</span>
          <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm">💬 Chat with Luna</span>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;
