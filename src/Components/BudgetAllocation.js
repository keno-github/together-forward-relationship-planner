import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Plus, PiggyBank, Check, Edit3, Trash2, Wallet, ArrowRight,
  Home, Car, Gem, Plane, UtensilsCrossed, Music, Camera, Gift, Heart,
  ShoppingBag, Briefcase, GraduationCap, Baby, X
} from 'lucide-react';
import {
  createExpense,
  getExpensesByMilestone,
  deleteExpense
} from '../services/supabaseService';
import { getCategoriesForMilestone, suggestCategoryBudgets } from '../data/budgetCategories';

// Lucide icon mapping for pockets
const POCKET_ICONS = {
  'Home': Home,
  'Venue': Home,
  'Transportation': Car,
  'Car': Car,
  'Ring': Gem,
  'Jewelry': Gem,
  'Travel': Plane,
  'Honeymoon': Plane,
  'Food': UtensilsCrossed,
  'Catering': UtensilsCrossed,
  'Entertainment': Music,
  'Music': Music,
  'Photography': Camera,
  'Photo': Camera,
  'Gifts': Gift,
  'Decorations': Heart,
  'Flowers': Heart,
  'Shopping': ShoppingBag,
  'Attire': ShoppingBag,
  'Dress': ShoppingBag,
  'Work': Briefcase,
  'Education': GraduationCap,
  'Baby': Baby,
  'Nursery': Baby,
  'default': Wallet
};

// Get icon component by name
const getIconForPocket = (name) => {
  // Try to match pocket name with icon
  for (const [key, IconComponent] of Object.entries(POCKET_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return IconComponent;
    }
  }
  return POCKET_ICONS.default;
};

// Icon selector options
const ICON_OPTIONS = [
  { name: 'Home', icon: Home },
  { name: 'Car', icon: Car },
  { name: 'Jewelry', icon: Gem },
  { name: 'Travel', icon: Plane },
  { name: 'Food', icon: UtensilsCrossed },
  { name: 'Music', icon: Music },
  { name: 'Photo', icon: Camera },
  { name: 'Gift', icon: Gift },
  { name: 'Heart', icon: Heart },
  { name: 'Shopping', icon: ShoppingBag },
  { name: 'Work', icon: Briefcase },
  { name: 'Education', icon: GraduationCap },
  { name: 'Baby', icon: Baby },
  { name: 'Wallet', icon: Wallet }
];

const BudgetAllocation = ({ milestone, roadmapId, onProgressUpdate, onNavigateToSection }) => {
  const [pockets, setPockets] = useState([]);
  const [contributions, setContributions] = useState({});
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [selectedPocket, setSelectedPocket] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [showPocketModal, setShowPocketModal] = useState(false);
  const [editingPocket, setEditingPocket] = useState(null);
  const [pocketName, setPocketName] = useState('');
  const [pocketIconName, setPocketIconName] = useState('Wallet');
  const [pocketDescription, setPocketDescription] = useState('');
  const [pocketTarget, setPocketTarget] = useState('');

  const targetBudget = milestone?.budget_amount || 0;

  useEffect(() => {
    if (milestone?.id) {
      initializeBudget();
    } else {
      setLoading(false);
    }
  }, [milestone?.id]);

  const initializeBudget = async () => {
    setLoading(true);

    const suggestedCategories = getCategoriesForMilestone(milestone.title);

    let categoryBudgets = {};
    if (targetBudget > 0) {
      categoryBudgets = suggestCategoryBudgets(targetBudget, suggestedCategories);
    }

    if (milestone.id) {
      const { data: expenses } = await getExpensesByMilestone(milestone.id);

      if (expenses && expenses.length > 0) {
        const pocketContributions = {};
        expenses.forEach(expense => {
          const pocket = expense.category || 'Unallocated';
          if (!pocketContributions[pocket]) {
            pocketContributions[pocket] = { saved: 0, items: [] };
          }
          pocketContributions[pocket].saved += parseFloat(expense.amount || 0);
          pocketContributions[pocket].items.push(expense);
        });

        setContributions(pocketContributions);
      }
    }

    const pocketsWithTargets = suggestedCategories.map(cat => ({
      ...cat,
      iconName: cat.iconName || 'Wallet',
      targetAmount: categoryBudgets[cat.name] || 0
    }));

    setPockets(pocketsWithTargets);
    setLoading(false);
  };

  const getTotals = () => {
    const totalContributions = Object.values(contributions).reduce(
      (sum, pocket) => sum + pocket.saved, 0
    );
    const percentageSaved = targetBudget > 0 ? (totalContributions / targetBudget) * 100 : 0;
    const remaining = targetBudget - totalContributions;

    return { targetBudget, totalContributions, percentageSaved, remaining };
  };

  const totals = getTotals();

  const handleAddMoney = (pocket) => {
    setSelectedPocket(pocket);
    setAmountInput('');
    setNoteInput('');
    setShowAddMoneyModal(true);
  };

  const handleSaveContribution = async () => {
    if (!amountInput || parseFloat(amountInput) <= 0) return;

    setIsSaving(true);

    try {
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
      if (error) throw new Error(error.message);

      const updatedContributions = { ...contributions };
      if (!updatedContributions[selectedPocket.name]) {
        updatedContributions[selectedPocket.name] = { saved: 0, items: [] };
      }
      updatedContributions[selectedPocket.name].saved += parseFloat(amountInput);
      updatedContributions[selectedPocket.name].items.push(data);

      setContributions(updatedContributions);

      if (onProgressUpdate) {
        const newTotals = {
          totalTarget: targetBudget,
          totalSaved: Object.values(updatedContributions).reduce((sum, pocket) => sum + pocket.saved, 0)
        };
        onProgressUpdate(newTotals);
      }

      setAmountInput('');
      setNoteInput('');
      setShowAddMoneyModal(false);
    } catch (error) {
      console.error('Error saving contribution:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteContribution = async (pocketName, expense) => {
    if (!window.confirm('Remove this contribution?')) return;

    try {
      // Pass activity context for logging
      const activityContext = { roadmapId, expense };
      const { error } = await deleteExpense(expense.id, activityContext);
      if (error) throw error;

      const updatedContributions = { ...contributions };
      updatedContributions[pocketName].saved -= parseFloat(expense.amount);
      updatedContributions[pocketName].items = updatedContributions[pocketName].items.filter(
        e => e.id !== expense.id
      );

      setContributions(updatedContributions);
    } catch (error) {
      console.error('Error deleting contribution:', error);
    }
  };

  const handleAddPocket = () => {
    setPocketName('');
    setPocketIconName('Wallet');
    setPocketDescription('');
    setPocketTarget('');
    setEditingPocket(null);
    setShowPocketModal(true);
  };

  const handleEditPocket = (pocket) => {
    setPocketName(pocket.name);
    setPocketIconName(pocket.iconName || 'Wallet');
    setPocketDescription(pocket.description);
    setPocketTarget(pocket.targetAmount?.toString() || '');
    setEditingPocket(pocket);
    setShowPocketModal(true);
  };

  const handleSavePocket = () => {
    if (!pocketName.trim()) return;

    const targetAmount = parseFloat(pocketTarget) || 0;

    if (editingPocket) {
      const updatedPockets = pockets.map(p =>
        p.name === editingPocket.name
          ? { ...p, name: pocketName, iconName: pocketIconName, description: pocketDescription, targetAmount }
          : p
      );

      if (editingPocket.name !== pocketName && contributions[editingPocket.name]) {
        const updatedContributions = { ...contributions };
        updatedContributions[pocketName] = updatedContributions[editingPocket.name];
        delete updatedContributions[editingPocket.name];
        setContributions(updatedContributions);
      }

      setPockets(updatedPockets);
    } else {
      const newPocket = {
        name: pocketName,
        iconName: pocketIconName,
        description: pocketDescription,
        targetAmount
      };
      setPockets([...pockets, newPocket]);
    }

    setShowPocketModal(false);
  };

  const handleDeletePocket = async (pocket) => {
    const pocketContribution = contributions[pocket.name];
    const hasSavings = pocketContribution && pocketContribution.saved > 0;

    const confirmMessage = hasSavings
      ? `Delete "${pocket.name}" pocket? This will also remove ${formatCurrency(pocketContribution.saved)} in tracked savings.`
      : `Delete "${pocket.name}" pocket?`;

    if (!window.confirm(confirmMessage)) return;

    // Delete all contributions/expenses for this pocket from database
    if (pocketContribution && pocketContribution.items) {
      for (const expense of pocketContribution.items) {
        try {
          // Pass activity context for logging
          const activityContext = { roadmapId, expense };
          await deleteExpense(expense.id, activityContext);
        } catch (error) {
          console.error('Error deleting expense:', error);
        }
      }
    }

    // Remove pocket from state
    setPockets(pockets.filter(p => p.name !== pocket.name));

    // Remove contributions for this pocket
    const updatedContributions = { ...contributions };
    delete updatedContributions[pocket.name];
    setContributions(updatedContributions);
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
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-[#c49a6c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!milestone) {
    return (
      <div className="text-center py-16">
        <p style={{ color: '#6b635b' }}>No milestone selected</p>
      </div>
    );
  }

  if (targetBudget === 0) {
    return (
      <div className="text-center py-16">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(196, 154, 108, 0.12)' }}
        >
          <Wallet className="w-8 h-8" style={{ color: '#c49a6c' }} />
        </div>
        <h3
          className="text-xl font-medium mb-2"
          style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}
        >
          No Budget Set
        </h3>
        <p className="mb-6 max-w-sm mx-auto" style={{ color: '#6b635b' }}>
          Set a target budget in the Overview tab to start tracking your savings.
        </p>
        <button
          onClick={() => onNavigateToSection?.('overview')}
          className="px-6 py-3 rounded-xl font-medium text-white flex items-center gap-2 mx-auto transition-all hover:-translate-y-0.5"
          style={{ background: '#2d2926' }}
        >
          Set Budget
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Savings Progress Overview */}
      <div
        className="rounded-2xl p-6"
        style={{ background: '#ffffff', border: '1px solid #e8e4de' }}
      >
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(125, 140, 117, 0.12)' }}
          >
            <PiggyBank className="w-6 h-6" style={{ color: '#7d8c75' }} />
          </div>
          <div>
            <h3
              className="text-lg font-medium"
              style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}
            >
              Savings Progress
            </h3>
            <p className="text-sm" style={{ color: '#6b635b' }}>
              Tracking your progress toward {formatCurrency(targetBudget)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="rounded-xl p-4" style={{ background: '#faf8f5' }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#6b635b' }}>
              Total Saved
            </p>
            <p
              className="text-2xl font-semibold"
              style={{ fontFamily: "'Playfair Display', serif", color: '#7d8c75' }}
            >
              {formatCurrency(totals.totalContributions)}
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: '#faf8f5' }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#6b635b' }}>
              Still Need
            </p>
            <p
              className="text-2xl font-semibold"
              style={{ fontFamily: "'Playfair Display', serif", color: '#c49a6c' }}
            >
              {formatCurrency(Math.max(0, totals.remaining))}
            </p>
          </div>
        </div>

        <div className="h-2.5 rounded-full" style={{ background: '#e8e4de' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(totals.percentageSaved, 100)}%` }}
            className="h-full rounded-full"
            style={{ background: '#7d8c75' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <p className="text-sm mt-2 text-right" style={{ color: '#7d8c75' }}>
          {totals.percentageSaved.toFixed(0)}% saved
        </p>

        {totals.percentageSaved >= 100 && (
          <div
            className="mt-4 flex items-center gap-2 rounded-xl p-3"
            style={{ background: 'rgba(125, 140, 117, 0.1)' }}
          >
            <Check className="w-5 h-5" style={{ color: '#7d8c75' }} />
            <span className="font-medium" style={{ color: '#7d8c75' }}>
              Budget goal reached!
            </span>
          </div>
        )}
      </div>

      {/* Budget Pockets Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3
              className="text-lg font-medium"
              style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}
            >
              Budget Pockets
            </h3>
            <p className="text-sm" style={{ color: '#6b635b' }}>
              Organize your savings into categories
            </p>
          </div>
          <button
            onClick={handleAddPocket}
            className="px-4 py-2.5 rounded-xl font-medium text-white flex items-center gap-2 transition-all hover:-translate-y-0.5"
            style={{ background: '#2d2926' }}
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
            const PocketIcon = getIconForPocket(pocket.name);

            return (
              <div
                key={pocket.name}
                className="rounded-xl p-5 transition-all"
                style={{
                  background: isFullyFunded ? 'rgba(125, 140, 117, 0.05)' : '#ffffff',
                  border: isFullyFunded ? '2px solid rgba(125, 140, 117, 0.3)' : '1px solid #e8e4de'
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: isFullyFunded ? 'rgba(125, 140, 117, 0.15)' : 'rgba(196, 154, 108, 0.12)' }}
                    >
                      <PocketIcon
                        className="w-6 h-6"
                        style={{ color: isFullyFunded ? '#7d8c75' : '#c49a6c' }}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium" style={{ color: '#2d2926' }}>{pocket.name}</h4>
                      <p className="text-xs" style={{ color: '#6b635b' }}>{pocket.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditPocket(pocket)}
                      className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                      title="Edit pocket"
                    >
                      <Edit3 className="w-4 h-4" style={{ color: '#6b635b' }} />
                    </button>
                    <button
                      onClick={() => handleDeletePocket(pocket)}
                      className="p-2 rounded-lg transition-colors hover:bg-red-50"
                      title="Delete pocket"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: '#c76b6b' }} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="rounded-lg p-2" style={{ background: '#faf8f5' }}>
                    <p className="text-xs" style={{ color: '#6b635b' }}>Target</p>
                    <p className="text-sm font-semibold" style={{ color: '#2d2926' }}>
                      {formatCurrency(targetAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: 'rgba(125, 140, 117, 0.08)' }}>
                    <p className="text-xs" style={{ color: '#6b635b' }}>Saved</p>
                    <p className="text-sm font-semibold" style={{ color: '#7d8c75' }}>
                      {formatCurrency(saved)}
                    </p>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: 'rgba(196, 154, 108, 0.08)' }}>
                    <p className="text-xs" style={{ color: '#6b635b' }}>Need</p>
                    <p className="text-sm font-semibold" style={{ color: '#c49a6c' }}>
                      {formatCurrency(need)}
                    </p>
                  </div>
                </div>

                <div className="h-1.5 rounded-full mb-3" style={{ background: '#e8e4de' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    className="h-full rounded-full"
                    style={{ background: isFullyFunded ? '#7d8c75' : '#c49a6c' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {isFullyFunded && (
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium" style={{ color: '#7d8c75' }}>
                    <Check className="w-4 h-4" />
                    Fully Funded
                  </div>
                )}

                {pocketContribution && pocketContribution.items.length > 0 && (
                  <div className="space-y-1 mb-3 max-h-24 overflow-y-auto">
                    {pocketContribution.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs rounded-lg px-2 py-1.5"
                        style={{ background: '#faf8f5' }}
                      >
                        <span className="flex items-center gap-1" style={{ color: '#2d2926' }}>
                          <PiggyBank className="w-3 h-3" style={{ color: '#7d8c75' }} />
                          {formatCurrency(item.amount)}
                          {item.notes && <span style={{ color: '#6b635b' }}>· {item.notes}</span>}
                        </span>
                        <button
                          onClick={() => handleDeleteContribution(pocket.name, item)}
                          className="opacity-50 hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" style={{ color: '#c76b6b' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleAddMoney(pocket)}
                  className="w-full py-2.5 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                  style={{ background: '#2d2926' }}
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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl p-6 max-w-md w-full"
              style={{ background: '#ffffff', border: '1px solid #e8e4de' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-lg font-medium"
                  style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}
                >
                  Add to {selectedPocket.name}
                </h3>
                <button
                  onClick={() => setShowAddMoneyModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" style={{ color: '#6b635b' }} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>
                    Amount
                  </label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                      style={{ color: '#6b635b' }}
                    />
                    <input
                      type="number"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-xl font-semibold focus:outline-none focus:ring-2"
                      style={{ border: '1px solid #e8e4de', color: '#2d2926' }}
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
                    style={{ border: '1px solid #e8e4de', color: '#2d2926' }}
                    placeholder="e.g., Saved from bonus"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddMoneyModal(false)}
                  className="flex-1 py-3 rounded-xl font-medium transition-colors"
                  style={{ background: '#f5f2ed', color: '#6b635b' }}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveContribution}
                  className="flex-1 py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-50"
                  style={{ background: '#7d8c75' }}
                  disabled={isSaving || !amountInput}
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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl p-6 max-w-md w-full"
              style={{ background: '#ffffff', border: '1px solid #e8e4de' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-lg font-medium"
                  style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}
                >
                  {editingPocket ? 'Edit Pocket' : 'Add New Pocket'}
                </h3>
                <button
                  onClick={() => setShowPocketModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" style={{ color: '#6b635b' }} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>
                    Pocket Name
                  </label>
                  <input
                    type="text"
                    value={pocketName}
                    onChange={(e) => setPocketName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
                    style={{ border: '1px solid #e8e4de', color: '#2d2926' }}
                    placeholder="e.g., Venue"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>
                    Target Amount
                  </label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                      style={{ color: '#6b635b' }}
                    />
                    <input
                      type="number"
                      value={pocketTarget}
                      onChange={(e) => setPocketTarget(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2"
                      style={{ border: '1px solid #e8e4de', color: '#2d2926' }}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>
                    Icon
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {ICON_OPTIONS.map(({ name, icon: IconComp }) => (
                      <button
                        key={name}
                        onClick={() => setPocketIconName(name)}
                        className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                        style={{
                          background: pocketIconName === name ? 'rgba(196, 154, 108, 0.2)' : '#faf8f5',
                          border: pocketIconName === name ? '2px solid #c49a6c' : '1px solid #e8e4de'
                        }}
                      >
                        <IconComp
                          className="w-5 h-5"
                          style={{ color: pocketIconName === name ? '#c49a6c' : '#6b635b' }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={pocketDescription}
                    onChange={(e) => setPocketDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
                    style={{ border: '1px solid #e8e4de', color: '#2d2926' }}
                    placeholder="e.g., Wedding venue costs"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPocketModal(false)}
                  className="flex-1 py-3 rounded-xl font-medium transition-colors"
                  style={{ background: '#f5f2ed', color: '#6b635b' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePocket}
                  className="flex-1 py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-50"
                  style={{ background: '#7d8c75' }}
                  disabled={!pocketName.trim()}
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
