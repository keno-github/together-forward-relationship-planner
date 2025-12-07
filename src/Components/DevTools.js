import React, { useState } from 'react';
import { Bug, Trash2, Info, X, ChevronUp } from 'lucide-react';
import { resetAppData, getStorageInfo, APP_VERSION } from '../utils/storageManager';

/**
 * DevTools - Development helper tools
 * Only shows in development mode
 * Provides quick access to reset app data and view storage info
 */
const DevTools = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleViewStorage = () => {
    setStorageInfo(getStorageInfo());
    setShowStorageInfo(true);
  };

  const handleReset = () => {
    if (window.confirm('This will clear all app data and reload the page. Continue?')) {
      resetAppData();
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all"
        title="Dev Tools"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Bug className="w-5 h-5" />}
      </button>

      {/* Dev Tools Panel */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 z-50 bg-gray-900 text-white rounded-xl shadow-2xl p-4 w-72">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Dev Tools
            </h3>
            <span className="text-xs text-gray-400">v{APP_VERSION}</span>
          </div>

          <div className="space-y-2">
            {/* Reset App Data */}
            <button
              onClick={handleReset}
              className="w-full flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Reset App Data
            </button>

            {/* View Storage */}
            <button
              onClick={handleViewStorage}
              className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              <Info className="w-4 h-4" />
              View localStorage
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Use Reset to clear cached data when testing new features.
          </p>
        </div>
      )}

      {/* Storage Info Modal */}
      {showStorageInfo && storageInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-800">localStorage Info</h3>
              <button
                onClick={() => setShowStorageInfo(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-gray-800">{storageInfo.version}</div>
                  <div className="text-xs text-gray-500">Version</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-gray-800">{storageInfo.itemCount}</div>
                  <div className="text-xs text-gray-500">Items</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-gray-800">{storageInfo.totalSize}</div>
                  <div className="text-xs text-gray-500">Total Size</div>
                </div>
              </div>

              <h4 className="font-semibold text-gray-700 mb-2">Stored Items:</h4>
              <div className="space-y-2">
                {Object.entries(storageInfo.items).map(([key, info]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-sm text-gray-800">{key}</span>
                      <span className="text-xs text-gray-500">{info.size}</span>
                    </div>
                    <div className="text-xs text-gray-500 font-mono break-all">
                      {info.preview}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={handleReset}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DevTools;
