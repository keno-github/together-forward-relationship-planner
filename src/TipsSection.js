import React from 'react';
import { Lightbulb, AlertTriangle, CheckCircle, Target } from 'lucide-react';

const TipsSection = ({ expertTips, commonMistakes, successMetrics }) => {
  return (
    <div className="space-y-6">
      {expertTips?.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 text-2xl flex items-center gap-2">
            <Lightbulb className="w-7 h-7 text-yellow-500" /> Expert Tips
          </h3>
          {expertTips.map((tip, i) => (
            <div key={i} className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border-2 border-yellow-200 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-yellow-900 mb-2">{tip.category}</h4>
                  <p className="text-yellow-800">{tip.tip}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {commonMistakes?.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 text-2xl flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-red-500" /> Avoid These Mistakes
          </h3>
          {commonMistakes.map((mistake, i) => (
            <div key={i} className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-200">
              <h4 className="font-bold text-red-900 mb-2">❌ {mistake.mistake}</h4>
              <p className="text-red-800 mb-3"><span className="font-medium">Impact:</span> {mistake.impact}</p>
              <div className="bg-green-100 rounded-xl p-3 border-2 border-green-200">
                <p className="text-green-800"><span className="font-bold">✅ Solution:</span> {mistake.solution}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {successMetrics?.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
          <h3 className="font-bold text-green-900 text-xl mb-4 flex items-center gap-2">
            <Target className="w-6 h-6" /> How to Know You're On Track
          </h3>
          <div className="space-y-2">
            {successMetrics.map((metric, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-800">{metric}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TipsSection;
