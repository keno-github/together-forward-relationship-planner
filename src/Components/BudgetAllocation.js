import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Plus, PiggyBank, CheckCircle, Edit2, Trash2, Wallet, ArrowRight
} from 'lucide-react';
import {
  createExpense,
  getExpensesByMilestone,
  deleteExpense
} from '../services/supabaseService';
import { getCategoriesForMilestone, suggestCategoryBudgets } from '../data/budgetCategories';

const BudgetAllocation = ({ milestone, roadmapId, onProgressUpdate, onNavigateToSection }) => {
  const [pockets, setPockets] = useState([]);
  const [contributions, setContributions] = useState({});
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [selectedPocket, setSelectedPocket] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Pocket management states
  const [showPocketModal, setShowPocketModal] = useState(false);
  const [editingPocket, setEditingPocket] = useState(null);
  const [pocketName, setPocketName] = useState('');
  const [pocketIcon, setPocketIcon] = useState('📦');
  const [pocketDescription, setPocketDescription] = useState('');
  const [pocketTarget, setPocketTarget] = useState('');

  const targetBudget = milestone.budget_amount || 0;

  // Initialize pockets and load existing contributions
  useEffect(() => {
    initializeBudget();
  }, [milestone]);

  const initializeBudget = async () => {
    setLoading(true);

    // Get predefined categories for this milestone type (we'll call them pockets)
    const suggestedCategories = getCategoriesForMilestone(milestone.title);

    // If milestone has budget_amount, suggest breakdown
    let categoryBudgets = {};
    if (targetBudget > 0) {
      categoryBudgets = suggestCategoryBudgets(targetBudget, suggestedCategories);
    }

    // Load existing contributions from database (expenses with category)
    if (milestone.id) {
      const { data: expenses } = await getExpensesByMilestone(milestone.id);

      if (expenses && expenses.length > 0) {
        // Group by pocket (category)
        const pocketContributions = {};
        expenses.forEach(expense => {
          const pocket = expense.category || 'Unallocated';
          if (!pocketContributions[pocket]) {
            pocketContributions[pocket] = {
              saved: 0,
              items: []
            };
          }
          pocketContributions[pocket].saved += parseFloat(expense.amount || 0);
          pocketContributions[pocket].items.push(expense);
        });

        setContributions(pocketContributions);
      }
    }

    // Set pockets with target amounts
    const pocketsWithTargets = suggestedCategories.map(cat => ({
      ...cat,
      targetAmount: categoryBudgets[cat.name] || 0
    }));

    setPockets(pocketsWithTargets);
    setLoading(false);
  };

  // Calculate totals
  const getTotals = () => {
    // Total saved across ALL contributions
    const totalContributions = Object.values(contributions).reduce(
      (sum, pocket) => sum + pocket.saved,
      0
    );

    const percentageSaved = targetBudget > 0 ? (totalContributions / targetBudget) * 100 : 0;
    const remaining = targetBudget - totalContributions;

    return {
      targetBudget,
      totalContributions,
      percentageSaved,
      remaining
    };
  };

  const totals = getTotals();

  // Handle adding money to a pocket
  const handleAddMoney = (pocket) => {
    setSelectedPocket(pocket);
    setAmountInput('');
    setNoteInput('');
    setShowAddMoneyModal(true);
  };

  // Save contribution to database
  const handleSaveContribution = async () => {
    if (!amountInput || parseFloat(amountInput) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsSaving(true);

    try {
      console.log('💰 Saving contribution:', {
        pocket: selectedPocket.name,
        amount: parseFloat(amountInput),
        milestone_id: milestone.id,
        roadmap_id: roadmapId
      });

      // Create expense record for this contribution
      const contributionData = {
        milestone_id: milestone.id,
        roadmap_id: roadmapId,
        description: noteInput || `Saved towards ${selectedPocket.name}`,
        amount: parseFloat(amountInput),
        category: selectedPocket.name,
        expense_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        notes: noteInput || null
      };

      const { data, error } = await createExpense(contributionData);

      if (error) {
        console.error('❌ Error from createExpense:', error);
        throw new Error(error.message || 'Failed to save contribution');
      }

      if (!data) {
        console.error('❌ No data returned from createExpense');
        throw new Error('No data returned from database');
      }

      console.log('✅ Contribution saved successfully:', data);

      // Update local state
      const updatedContributions = { ...contributions };
      if (!updatedContributions[selectedPocket.name]) {
        updatedContributions[selectedPocket.name] = {
          saved: 0,
          items: []
        };
      }
      updatedContributions[selectedPocket.name].saved += parseFloat(amountInput);
      updatedContributions[selectedPocket.name].items.push(data);

      setContributions(updatedContributions);

      console.log('📊 Updated contributions:', updatedContributions);

      // Notify parent of progress update
      if (onProgressUpdate) {
        const newTotals = {
          totalTarget: targetBudget,
          totalSaved: Object.values(updatedContributions).reduce((sum, pocket) => sum + pocket.saved, 0)
        };
        console.log('📈 Progress update:', newTotals);
        onProgressUpdate(newTotals);
      }

      // Reset form and close modal
      setAmountInput('');
      setNoteInput('');
      setShowAddMoneyModal(false);
    } catch (error) {
      console.error('❌ Error saving contribution:', error);
      alert(`Failed to save contribution: ${error.message}\n\nPlease check the console for details.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete a contribution
  const handleDeleteContribution = async (pocketName, expense) => {
    if (!window.confirm('Remove this contribution?')) return;

    try {
      const { error } = await deleteExpense(expense.id);
      if (error) throw error;

      // Update local state
      const updatedContributions = { ...contributions };
      updatedContributions[pocketName].saved -= parseFloat(expense.amount);
      updatedContributions[pocketName].items = updatedContributions[pocketName].items.filter(
        e => e.id !== expense.id
      );

      setContributions(updatedContributions);
    } catch (error) {
      console.error('Error deleting contribution:', error);
      alert('Failed to delete contribution.');
    }
  };

  // Pocket Management Functions
  const handleAddPocket = () => {
    setPocketName('');
    setPocketIcon('📦');
    setPocketDescription('');
    setPocketTarget('');
    setEditingPocket(null);
    setShowPocketModal(true);
  };

  const handleEditPocket = (pocket) => {
    setPocketName(pocket.name);
    setPocketIcon(pocket.icon);
    setPocketDescription(pocket.description);
    setPocketTarget(pocket.targetAmount?.toString() || '');
    setEditingPocket(pocket);
    setShowPocketModal(true);
  };

  const handleSavePocket = () => {
    if (!pocketName.trim()) {
      alert('Please enter a pocket name');
      return;
    }

    const targetAmount = parseFloat(pocketTarget) || 0;

    if (editingPocket) {
      // Update existing pocket
      const updatedPockets = pockets.map(p =>
        p.name === editingPocket.name
          ? { ...p, name: pocketName, icon: pocketIcon, description: pocketDescription, targetAmount }
          : p
      );

      // Update contributions with new pocket name if changed
      if (editingPocket.name !== pocketName && contributions[editingPocket.name]) {
        const updatedContributions = { ...contributions };
        updatedContributions[pocketName] = updatedContributions[editingPocket.name];
        delete updatedContributions[editingPocket.name];
        setContributions(updatedContributions);
      }

      setPockets(updatedPockets);
    } else {
      // Add new pocket
      const newPocket = {
        name: pocketName,
        icon: pocketIcon,
        description: pocketDescription,
        targetAmount
      };
      setPockets([...pockets, newPocket]);
    }

    setShowPocketModal(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Show empty state if no budget is set
  if (targetBudget === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wallet className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Budget Set</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          You haven't set a target budget for this milestone yet. Set a budget in the Overview tab to start tracking your savings.
        </p>
        <button
          onClick={() => onNavigateToSection?.('overview')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          Set Budget in Overview
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Savings Progress Overview */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Savings Progress</h3>
            <p className="text-sm text-gray-600">Track your contributions toward your {formatCurrency(targetBudget)} goal</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-1">Total Contributions</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalContributions)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-1">Still Need</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totals.remaining)}</p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(totals.percentageSaved, 100)}%` }}
            className="h-full rounded-full flex items-center justify-end pr-2 bg-gradient-to-r from-green-500 to-green-600"
            transition={{ duration: 0.5 }}
          >
            {totals.percentageSaved >= 10 && (
              <span className="text-white text-xs font-bold">
                {totals.percentageSaved.toFixed(0)}%
              </span>
            )}
          </motion.div>
        </div>

        {totals.percentageSaved >= 100 && (
          <div className="mt-4 flex items-center gap-2 text-green-600 bg-green-50 rounded-lg p-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Budget goal reached! 🎉</span>
          </div>
        )}
      </div>

      {/* Budget Pockets Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Budget Pockets</h3>
            <p className="text-sm text-gray-600">Break down your {formatCurrency(targetBudget)} target into manageable goals</p>
          </div>
          <button
            onClick={handleAddPocket}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Pocket
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pockets.map((pocket) => {
            const pocketContribution = contributions[pocket.name];
            const saved = pocketContribution?.saved || 0;
            const targetAmount = pocket.targetAmount || 0;
            const need = Math.max(0, targetAmount - saved);
            const percentage = targetAmount > 0 ? (saved / targetAmount) * 100 : 0;
            const isFullyFunded = saved >= targetAmount && targetAmount > 0;

            return (
              <div
                key={pocket.name}
                className={`bg-white rounded-xl p-4 border-2 transition-all ${
                  isFullyFunded ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{pocket.icon}</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{pocket.name}</h4>
                      <p className="text-xs text-gray-600">{pocket.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEditPocket(pocket)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit pocket"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Pocket Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-600">Target</p>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(targetAmount)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-xs text-gray-600">Saved</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(saved)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-xs text-gray-600">Need</p>
                    <p className="text-sm font-bold text-blue-600">{formatCurrency(need)}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    className={`h-full rounded-full ${
                      isFullyFunded ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {isFullyFunded && (
                  <div className="mb-3 flex items-center gap-2 text-green-600 text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    FULLY FUNDED! 🎉
                  </div>
                )}

                {/* Contributions List */}
                {pocketContribution && pocketContribution.items.length > 0 && (
                  <div className="space-y-1 mb-3 max-h-24 overflow-y-auto">
                    {pocketContribution.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1.5"
                      >
                        <span className="flex items-center gap-1 text-gray-700">
                          <PiggyBank className="w-3 h-3" />
                          {formatCurrency(item.amount)}
                          {item.notes && <span className="text-gray-500">· {item.notes}</span>}
                        </span>
                        <button
                          onClick={() => handleDeleteContribution(pocket.name, item)}
                          className="opacity-50 hover:opacity-100 text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Money Button */}
                <button
                  onClick={() => handleAddMoney(pocket)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Money
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Money Modal */}
      <AnimatePresence>
        {showAddMoneyModal && selectedPocket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddMoneyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">{selectedPocket.icon}</div>
                <h3 className="text-xl font-bold text-gray-900">
                  Add Money to {selectedPocket.name}
                </h3>
                <p className="text-sm mt-1 text-gray-600">
                  {selectedPocket.description}
                </p>
              </div>

              <div className="space-y-4">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Amount ($) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-2xl font-bold text-center focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="0"
                      step="0.01"
                      min="0"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Note Input */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="e.g., Saved from bonus"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddMoneyModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveContribution}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-900 text-white hover:bg-gray-800 font-semibold transition-colors"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Add Money'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Pocket Modal */}
      <AnimatePresence>
        {showPocketModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowPocketModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-6 text-gray-900">
                {editingPocket ? 'Edit Pocket' : 'Add New Pocket'}
              </h3>

              <div className="space-y-4">
                {/* Pocket Name */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Pocket Name *
                  </label>
                  <input
                    type="text"
                    value={pocketName}
                    onChange={(e) => setPocketName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="e.g., Venue"
                    autoFocus
                  />
                </div>

                {/* Target Amount */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Target Amount ($) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={pocketTarget}
                      onChange={(e) => setPocketTarget(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="0"
                      step="100"
                      min="0"
                    />
                  </div>
                </div>

                {/* Pocket Icon */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Icon (Emoji)
                  </label>
                  <input
                    type="text"
                    value={pocketIcon}
                    onChange={(e) => setPocketIcon(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-3xl text-center focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="📦"
                    maxLength={2}
                  />
                  <p className="text-xs mt-1 text-center text-gray-500">
                    Choose any emoji to represent this pocket
                  </p>
                </div>

                {/* Pocket Description */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={pocketDescription}
                    onChange={(e) => setPocketDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="e.g., Wedding venue and decorations"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPocketModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePocket}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-900 text-white hover:bg-gray-800 font-semibold transition-colors"
                >
                  {editingPocket ? 'Save Changes' : 'Add Pocket'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BudgetAllocation;
