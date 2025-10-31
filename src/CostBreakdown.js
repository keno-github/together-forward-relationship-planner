import React from 'react';

const CostBreakdown = ({ totalCostBreakdown, hiddenCosts, locationSpecific }) => {
  if (!totalCostBreakdown) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-300">
          <p className="text-blue-700 text-sm mb-2">Minimum</p>
          <p className="text-3xl font-bold text-blue-900">
            {totalCostBreakdown.currency}€{totalCostBreakdown.minimum?.toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-300">
          <p className="text-green-700 text-sm mb-2">Typical</p>
          <p className="text-3xl font-bold text-green-900">
            {totalCostBreakdown.currency}€{totalCostBreakdown.typical?.toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border-2 border-red-200">
          <p className="text-red-700 text-sm mb-2">Maximum</p>
          <p className="text-3xl font-bold text-red-900">
            {totalCostBreakdown.currency}€{totalCostBreakdown.maximum?.toLocaleString()}
          </p>
        </div>
      </div>

      {totalCostBreakdown.breakdown && (
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
          <h3 className="font-bold text-gray-900 text-xl mb-4">Detailed Cost Breakdown</h3>
          <div className="space-y-3">
            {totalCostBreakdown.breakdown.map((item, i) => (
              <div key={i} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-800">{item.item}</p>
                    {item.required && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{item.notes}</p>
                </div>
                <p className="font-bold text-gray-900 text-lg ml-4">€{item.cost?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {hiddenCosts?.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-300">
          <h3 className="font-bold text-yellow-900 text-xl mb-4">Hidden Costs</h3>
          <div className="space-y-3">
            {hiddenCosts.map((hidden, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-bold text-gray-800">{hidden.cost}</p>
                  <p className="font-bold text-orange-600">+€{hidden.amount?.toLocaleString()}</p>
                </div>
                <p className="text-sm text-gray-600">{hidden.why}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {locationSpecific?.localCosts && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200">
          <h3 className="font-bold text-purple-900 text-xl mb-3">Local Cost Considerations</h3>
          <p className="text-purple-800">{locationSpecific.localCosts}</p>
        </div>
      )}
    </div>
  );
};

export default CostBreakdown;
