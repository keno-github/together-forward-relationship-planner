import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Loader2 } from 'lucide-react';

/**
 * PendingChangesCard
 *
 * Displays Luna's proposed changes with Confirm/Cancel actions.
 * Shows change type icon, summary, reason, and action buttons.
 */
const PendingChangesCard = ({
  pendingChanges = [],
  onConfirmAll,
  onConfirmOne,
  onRejectAll,
  onRejectOne,
  isApplying = false
}) => {
  if (pendingChanges.length === 0) return null;

  // Filter out error-type changes for display purposes
  const validChanges = pendingChanges.filter(c => c.status !== 'error');
  const errorChanges = pendingChanges.filter(c => c.status === 'error');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-4 mb-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Proposed Changes</h4>
            <p className="text-xs text-gray-600">
              {validChanges.length} change{validChanges.length !== 1 ? 's' : ''} awaiting your approval
            </p>
          </div>
        </div>

        {/* Bulk Actions */}
        {validChanges.length > 1 && (
          <div className="flex gap-2">
            <button
              onClick={onConfirmAll}
              disabled={isApplying}
              className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 flex items-center gap-1"
            >
              {isApplying ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              Confirm All
            </button>
            <button
              onClick={onRejectAll}
              disabled={isApplying}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Cancel All
            </button>
          </div>
        )}
      </div>

      {/* Changes List */}
      <div className="space-y-3">
        <AnimatePresence>
          {validChanges.map((change, index) => (
            <ChangeItem
              key={`${change.id}-${index}`}
              change={change}
              index={index}
              onConfirm={() => onConfirmOne(change)}
              onReject={() => onRejectOne(change)}
              isApplying={isApplying}
              showActions={validChanges.length === 1}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Single change actions */}
      {validChanges.length === 1 && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={onConfirmAll}
            disabled={isApplying}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirm Change
              </>
            )}
          </button>
          <button
            onClick={onRejectAll}
            disabled={isApplying}
            className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      )}

      {/* Error Changes (if any) */}
      {errorChanges.length > 0 && (
        <div className="mt-4 pt-4 border-t border-amber-200">
          <p className="text-sm text-red-600 font-medium mb-2">Issues detected:</p>
          {errorChanges.map(change => (
            <div key={change.id} className="text-sm text-red-600 flex items-center gap-2">
              <X className="w-3 h-3" />
              {change.summary}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

/**
 * Individual change item
 */
const ChangeItem = ({ change, index, onConfirm, onReject, isApplying, showActions }) => {
  const getTypeColor = (type) => {
    const colors = {
      title_update: 'bg-pink-100 text-pink-700 border-pink-200',
      description_update: 'bg-violet-100 text-violet-700 border-violet-200',
      budget_update: 'bg-purple-100 text-purple-700 border-purple-200',
      date_update: 'bg-blue-100 text-blue-700 border-blue-200',
      add_phase: 'bg-green-100 text-green-700 border-green-200',
      modify_phase: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      remove_phase: 'bg-red-100 text-red-700 border-red-200',
      add_task: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      update_task: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      delete_task: 'bg-rose-100 text-rose-700 border-rose-200',
      regenerate_roadmap: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getTypeBadge = (type) => {
    const badges = {
      title_update: 'Title',
      description_update: 'Description',
      budget_update: 'Budget',
      date_update: 'Date',
      add_phase: 'Add Phase',
      modify_phase: 'Modify Phase',
      remove_phase: 'Remove Phase',
      add_task: 'Add Task',
      update_task: 'Update Task',
      delete_task: 'Delete Task',
      regenerate_roadmap: 'Regenerate'
    };
    return badges[type] || type;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl p-3 border border-amber-100 hover:border-amber-300 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className="text-2xl flex-shrink-0">{change.icon}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${getTypeColor(change.type)}`}>
              {getTypeBadge(change.type)}
            </span>
          </div>

          <p className="font-medium text-gray-900 text-sm">{change.summary}</p>

          {change.reason && (
            <p className="text-xs text-gray-600 mt-1">
              <span className="font-medium">Why:</span> {change.reason}
            </p>
          )}

          {/* Details for certain types */}
          {change.type === 'budget_update' && change.details && (
            <p className="text-xs text-gray-500 mt-1">
              Difference: {change.details.difference >= 0 ? '+' : ''}€{change.details.difference.toLocaleString()}
            </p>
          )}

          {change.requiresRegeneration && (
            <p className="text-xs text-amber-600 mt-1 font-medium">
              ⚠️ This will regenerate your entire roadmap
            </p>
          )}
        </div>

        {/* Individual Actions (only show for multiple changes) */}
        {!showActions && (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={onConfirm}
              disabled={isApplying}
              className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-colors"
              title="Confirm this change"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onReject}
              disabled={isApplying}
              className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              title="Reject this change"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PendingChangesCard;
