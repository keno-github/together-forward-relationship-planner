import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Plus, TrendingUp, Target, PiggyBank, CheckCircle, Edit2, Trash2
} from 'lucide-react';
import {
  createExpense,
  getExpensesByMilestone,
  updateExpense,
  deleteExpense
} from '../services/supabaseService';
import { getCategoriesForMilestone, suggestCategoryBudgets } from '../data/budgetCategories';

const BudgetAllocation = ({ milestone, roadmapId, onProgressUpdate }) => {
  const [categories, setCategories] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Category management states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('📦');
  const [categoryDescription, setCategoryDescription] = useState('');

  // Initialize categories and load existing allocations
  useEffect(() => {
    initializeBudget();
  }, [milestone]);

  const initializeBudget = async () => {
    setLoading(true);

    // Get predefined categories for this milestone type
    const suggestedCategories = getCategoriesForMilestone(milestone.title);

    // If milestone has budget_amount, suggest breakdown
    let categoryBudgets = {};
    if (milestone.budget_amount > 0) {
      categoryBudgets = suggestCategoryBudgets(milestone.budget_amount, suggestedCategories);
    }

    // Load existing allocations from database (expenses with category)
    if (milestone.id) {
      const { data: expenses } = await getExpensesByMilestone(milestone.id);

      if (expenses && expenses.length > 0) {
        // Group by category
        const categoryAllocations = {};
        expenses.forEach(expense => {
          const cat = expense.category || 'Other';
          if (!categoryAllocations[cat]) {
            categoryAllocations[cat] = {
              allocated: 0,
              expenses: []
            };
          }
          categoryAllocations[cat].allocated += parseFloat(expense.amount || 0);
          categoryAllocations[cat].expenses.push(expense);
        });

        setAllocations(categoryAllocations);
      }
    }

    // Set categories with budget suggestions
    const categoriesWithBudgets = suggestedCategories.map(cat => ({
      ...cat,
      suggestedBudget: categoryBudgets[cat.name] || 0
    }));

    setCategories(categoriesWithBudgets);
    setLoading(false);
  };

  // Calculate totals
  const getTotals = () => {
    const totalBudget = milestone.budget_amount || 0;
    const totalAllocated = Object.values(allocations).reduce(
      (sum, cat) => sum + cat.allocated,
      0
    );
    const percentageAllocated = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0;
    const remaining = totalBudget - totalAllocated;

    return {
      totalBudget,
      totalAllocated,
      percentageAllocated,
      remaining
    };
  };

  const totals = getTotals();

  // Handle adding money to a category
  const handleAddMoney = (category) => {
    setSelectedCategory(category);
    setAmountInput('');
    setNoteInput('');
    setShowAddMoneyModal(true);
  };

  // Save allocation to database
  const handleSaveAllocation = async () => {
    if (!amountInput || parseFloat(amountInput) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsSaving(true);

    try {
      // Create expense record for this allocation
      const expenseData = {
        milestone_id: milestone.id,
        roadmap_id: roadmapId,
        description: noteInput || `Saved towards ${selectedCategory.name}`,
        amount: parseFloat(amountInput),
        category: selectedCategory.name,
        expense_date: new Date().toISOString().split('T')[0],
        status: 'allocated', // Special status for savings/allocations
        notes: noteInput || null
      };

      const { data, error } = await createExpense(expenseData);

      if (error) throw error;

      // Update local state
      const updatedAllocations = { ...allocations };
      if (!updatedAllocations[selectedCategory.name]) {
        updatedAllocations[selectedCategory.name] = {
          allocated: 0,
          expenses: []
        };
      }
      updatedAllocations[selectedCategory.name].allocated += parseFloat(amountInput);
      updatedAllocations[selectedCategory.name].expenses.push(data);

      setAllocations(updatedAllocations);

      // Notify parent of progress update
      if (onProgressUpdate) {
        const newTotals = {
          totalBudget: milestone.budget_amount || 0,
          totalAllocated: Object.values(updatedAllocations).reduce((sum, cat) => sum + cat.allocated, 0)
        };
        onProgressUpdate(newTotals);
      }

      setShowAddMoneyModal(false);
    } catch (error) {
      console.error('Error saving allocation:', error);
      alert('Failed to save allocation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete an allocation
  const handleDeleteAllocation = async (categoryName, expense) => {
    if (!window.confirm('Remove this allocation?')) return;

    try {
      const { error } = await deleteExpense(expense.id);
      if (error) throw error;

      // Update local state
      const updatedAllocations = { ...allocations };
      updatedAllocations[categoryName].allocated -= parseFloat(expense.amount);
      updatedAllocations[categoryName].expenses = updatedAllocations[categoryName].expenses.filter(
        e => e.id !== expense.id
      );

      setAllocations(updatedAllocations);
    } catch (error) {
      console.error('Error deleting allocation:', error);
      alert('Failed to delete allocation.');
    }
  };

  // Category Management Functions
  const handleAddCategory = () => {
    setCategoryName('');
    setCategoryIcon('📦');
    setCategoryDescription('');
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setCategoryName(category.name);
    setCategoryIcon(category.icon);
    setCategoryDescription(category.description);
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = () => {
    if (!categoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    if (editingCategory) {
      // Rename existing category
      const updatedCategories = categories.map(cat =>
        cat.name === editingCategory.name
          ? { ...cat, name: categoryName, icon: categoryIcon, description: categoryDescription }
          : cat
      );

      // Update allocations with new category name
      if (editingCategory.name !== categoryName && allocations[editingCategory.name]) {
        const updatedAllocations = { ...allocations };
        updatedAllocations[categoryName] = updatedAllocations[editingCategory.name];
        delete updatedAllocations[editingCategory.name];
        setAllocations(updatedAllocations);
      }

      setCategories(updatedCategories);
    } else {
      // Add new category
      const newCategory = {
        name: categoryName,
        icon: categoryIcon,
        description: categoryDescription,
        suggestedBudget: 0
      };
      setCategories([...categories, newCategory]);
    }

    setShowCategoryModal(false);
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
      <div className="glass-card rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Overview Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold" style={{color: '#2B2B2B'}}>
              Budget: {formatCurrency(totals.totalBudget)}
            </h3>
            <p className="text-sm mt-1" style={{color: '#2B2B2B', opacity: 0.7}}>
              {formatCurrency(totals.totalAllocated)} allocated · {formatCurrency(totals.remaining)} remaining
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold" style={{color: '#C084FC'}}>
              {totals.percentageAllocated.toFixed(0)}%
            </div>
            <div className="text-xs" style={{color: '#2B2B2B', opacity: 0.7}}>
              Complete
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(totals.percentageAllocated, 100)}%` }}
            className="h-full rounded-full flex items-center justify-end pr-2"
            style={{
              background: totals.percentageAllocated >= 100
                ? 'linear-gradient(90deg, #10B981, #059669)'
                : 'linear-gradient(90deg, #C084FC, #F8C6D0)'
            }}
            transition={{ duration: 0.5 }}
          >
            {totals.percentageAllocated >= 10 && (
              <span className="text-white text-xs font-bold">
                {totals.percentageAllocated.toFixed(0)}%
              </span>
            )}
          </motion.div>
        </div>

        {totals.percentageAllocated >= 100 && (
          <div className="mt-4 flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Budget goal reached! 🎉</span>
          </div>
        )}
      </div>

      {/* Category Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{color: '#2B2B2B'}}>
            Budget Categories
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddCategory}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card-light hover:glass-card font-semibold"
            style={{color: '#C084FC'}}
          >
            <Plus className="w-4 h-4" />
            Add Category
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => {
          const categoryAllocation = allocations[category.name];
          const allocated = categoryAllocation?.allocated || 0;
          const suggestedBudget = category.suggestedBudget || 0;
          const percentage = suggestedBudget > 0 ? (allocated / suggestedBudget) * 100 : 0;

          return (
            <motion.div
              key={category.name}
              whileHover={{ scale: 1.02 }}
              className="glass-card rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{category.icon}</div>
                  <div>
                    <h4 className="font-semibold" style={{color: '#2B2B2B'}}>
                      {category.name}
                    </h4>
                    <p className="text-xs" style={{color: '#2B2B2B', opacity: 0.6}}>
                      {category.description}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleEditCategory(category)}
                  className="p-2 rounded-lg glass-card-light hover:glass-card"
                  title="Edit category"
                >
                  <Edit2 className="w-4 h-4" style={{color: '#C084FC'}} />
                </motion.button>
              </div>

              {/* Budget Info */}
              <div className="flex items-center justify-between text-sm mb-2" style={{color: '#2B2B2B'}}>
                <span>
                  {formatCurrency(allocated)} {suggestedBudget > 0 && `of ${formatCurrency(suggestedBudget)}`}
                </span>
                <span className="font-bold" style={{color: '#C084FC'}}>
                  {percentage.toFixed(0)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  className="h-full rounded-full"
                  style={{background: 'linear-gradient(90deg, #C084FC, #F8C6D0)'}}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Allocations List */}
              {categoryAllocation && categoryAllocation.expenses.length > 0 && (
                <div className="space-y-1 mb-3 max-h-24 overflow-y-auto">
                  {categoryAllocation.expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between text-xs glass-card-light rounded px-2 py-1"
                      style={{color: '#2B2B2B'}}
                    >
                      <span className="flex items-center gap-1">
                        <PiggyBank className="w-3 h-3" />
                        {formatCurrency(expense.amount)}
                      </span>
                      <button
                        onClick={() => handleDeleteAllocation(category.name, expense)}
                        className="opacity-50 hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Money Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAddMoney(category)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-semibold"
                style={{background: 'linear-gradient(135deg, #C084FC, #F8C6D0)'}}
              >
                <Plus className="w-4 h-4" />
                Add Money
              </motion.button>
            </motion.div>
          );
        })}
        </div>
      </div>

      {/* Add Money Modal */}
      <AnimatePresence>
        {showAddMoneyModal && selectedCategory && (
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
              className="glass-card-strong rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">{selectedCategory.icon}</div>
                <h3 className="text-xl font-bold" style={{color: '#2B2B2B'}}>
                  Add Money to {selectedCategory.name}
                </h3>
                <p className="text-sm mt-1" style={{color: '#2B2B2B', opacity: 0.7}}>
                  {selectedCategory.description}
                </p>
              </div>

              <div className="space-y-4">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#2B2B2B'}}>
                    Amount ($) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{color: '#C084FC'}} />
                    <input
                      type="number"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl glass-card-light text-2xl font-bold text-center"
                      placeholder="0"
                      step="0.01"
                      min="0"
                      style={{color: '#2B2B2B'}}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Note Input */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#2B2B2B'}}>
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-card-light"
                    placeholder="e.g., Saved from bonus"
                    style={{color: '#2B2B2B'}}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddMoneyModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl glass-card-light font-semibold"
                  style={{color: '#2B2B2B'}}
                  disabled={isSaving}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveAllocation}
                  className="flex-1 px-4 py-3 rounded-xl text-white font-semibold"
                  style={{background: 'linear-gradient(135deg, #C084FC, #F8C6D0)'}}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Add Money'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Category Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowCategoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card-strong rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-6" style={{color: '#2B2B2B'}}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>

              <div className="space-y-4">
                {/* Category Name */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#2B2B2B'}}>
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-card-light"
                    placeholder="e.g., Home Repairs"
                    style={{color: '#2B2B2B'}}
                    autoFocus
                  />
                </div>

                {/* Category Icon */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#2B2B2B'}}>
                    Icon (Emoji)
                  </label>
                  <input
                    type="text"
                    value={categoryIcon}
                    onChange={(e) => setCategoryIcon(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-card-light text-3xl text-center"
                    placeholder="📦"
                    style={{color: '#2B2B2B'}}
                    maxLength={2}
                  />
                  <p className="text-xs mt-1 text-center" style={{color: '#2B2B2B', opacity: 0.6}}>
                    Choose any emoji to represent this category
                  </p>
                </div>

                {/* Category Description */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#2B2B2B'}}>
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-card-light"
                    placeholder="e.g., Unexpected home maintenance costs"
                    style={{color: '#2B2B2B'}}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl glass-card-light font-semibold"
                  style={{color: '#2B2B2B'}}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveCategory}
                  className="flex-1 px-4 py-3 rounded-xl text-white font-semibold"
                  style={{background: 'linear-gradient(135deg, #C084FC, #F8C6D0)'}}
                >
                  {editingCategory ? 'Save Changes' : 'Add Category'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BudgetAllocation;
