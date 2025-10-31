import React from 'react';
import { AlertTriangle, Shield, MapPin, Sparkles, ArrowRight } from 'lucide-react';

const ChallengesSection = ({ challenges, warningFlags, locationSpecific }) => {
  return (
    <div className="space-y-6">
      {challenges?.length > 0 && (
        <div className="space-y-4">
          {challenges.map((challenge, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  challenge.likelihood === 'high' ? 'bg-red-500' :
                  challenge.likelihood === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}>
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-bold text-gray-900 text-lg">{challenge.challenge}</h4>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                      challenge.likelihood === 'high' ? 'bg-red-100 text-red-700' :
                      challenge.likelihood === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {challenge.likelihood.toUpperCase()} LIKELIHOOD
                    </span>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                    <p className="text-green-800">
                      <span className="font-bold">💡 How to overcome:</span> {challenge.solution}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {warningFlags?.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border-2 border-red-300">
          <h3 className="font-bold text-red-900 text-xl mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6" /> Red Flags to Watch For
          </h3>
          <div className="space-y-2">
            {warningFlags.map((flag, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800">{flag}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {locationSpecific?.culturalFactors && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200">
          <h3 className="font-bold text-purple-900 text-xl mb-3 flex items-center gap-2">
            <MapPin className="w-6 h-6" /> Cultural & Regional Factors
          </h3>
          <p className="text-purple-800">{locationSpecific.culturalFactors}</p>
        </div>
      )}

      {locationSpecific?.resources?.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
          <h3 className="font-bold text-blue-900 text-xl mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6" /> Local Resources
          </h3>
          <div className="space-y-2">
            {locationSpecific.resources.map((resource, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-3">
                <ArrowRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800">{resource}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengesSection;
