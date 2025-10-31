import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const StepsList = ({ steps }) => {
  if (!steps) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {steps.map((stepItem, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-blue-300 transition-all hover:shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
              {stepItem.step}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-gray-900 text-lg">{stepItem.title}</h4>
                {stepItem.duration && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {stepItem.duration}
                  </span>
                )}
              </div>
              <p className="text-gray-700 leading-relaxed">{stepItem.description}</p>
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default StepsList;
