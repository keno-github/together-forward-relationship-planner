import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Plus, Edit2, Trash2, Check, X,
  Calendar, CreditCard, FileText, AlertCircle, Clock, User
} from 'lucide-react';
import {
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesByMilestone,
  markExpenseAsPaid
} from '../services/supabaseService';
import { getCategoriesForMilestone } from '../data/budgetCategories';

const PAYMENT_METHODS = [
  'Credit Card', 'Debit Card', 'Bank Transfer',
  'Cash', 'Check', 'PayPal', 'Other'
];

const ExpenseTracker = ({
  milestone,
  roadmapId,
  partnerInfo,
  currentUserId,
  userContext,
  onExpensesUpdated = null
}) => {
  const [expenses, setExpenses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  // Expense form state
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    expense_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'pending',
    payment_method: '',
    paid_by_name: '',
    paid_by_user_id: null,
    notes: ''
  });

  // Get partner options for "Paid By" dropdown
  const getPartnerOptions = () => {
    if (!partnerInfo) {
      return [
        { name: userContext?.partner1 || 'Partner 1', userId: null },
        { name: userContext?.partner2 || 'Partner 2', userId: null }
      ];
    }
    return [
      { name: partnerInfo.partner1_name || userContext?.partner1 || 'Partner 1', userId: partnerInfo.user_id },
      { name: partnerInfo.partner2_name || userContext?.partner2 || 'Partner 2', userId: partnerInfo.partner_id }
    ].filter(p => p.name);
  };

  // Handle paid_by selection
  const handlePaidByChange = (partnerName) => {
    const options = getPartnerOptions();
    const selected = options.find(p => p.name === partnerName);
    setFormData({
      ...formData,
      paid_by_name: partnerName,
      paid_by_user_id: selected?.userId || null
    });
  };

  // Initialize smart categories based on milestone
  useEffect(() => {
    if (milestone?.title) {
      const smartCategories = getCategoriesForMilestone(milestone.title);
      setCategories(smartCategories);
    }
  }, [milestone?.title]);

  // Load expenses on mount
  useEffect(() => {
    if (milestone?.id) {
      loadExpenses();
    }
  }, [milestone?.id]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await getExpensesByMilestone(milestone.id);
      if (!error && data) {
        setExpenses(data);
        // Notify parent of expense update
        if (onExpensesUpdated) {
          onExpensesUpdated(data);
        }
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const paid = expenses
      .filter(exp => exp.status === 'paid')
      .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const pending = expenses
      .filter(exp => exp.status === 'pending')
      .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const overdue = expenses
      .filter(exp => exp.status === 'overdue')
      .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

    return { total, paid, pending, overdue };
  };

  const totals = calculateTotals();

  // Open add modal
  const handleAddExpense = () => {
    setFormData({
      description: '',
      amount: '',
      category: '',
      expense_date: new Date().toISOString().split('T')[0],
      due_date: '',
      status: 'pending',
      payment_method: '',
      paid_by_name: '',
      paid_by_user_id: null,
      notes: ''
    });
    setEditingExpense(null);
    setShowAddModal(true);
  };

  // Open edit modal
  const handleEditExpense = (expense) => {
    setFormData({
      description: expense.description || '',
      amount: expense.amount || '',
      category: expense.category || '',
      expense_date: expense.expense_date || '',
      due_date: expense.due_date || '',
      status: expense.status || 'pending',
      payment_method: expense.payment_method || '',
      paid_by_name: expense.paid_by_name || '',
      paid_by_user_id: expense.paid_by_user_id || null,
      notes: expense.notes || ''
    });
    setEditingExpense(expense);
    setShowAddModal(true);
  };

  // Save expense (create or update)
  const handleSaveExpense = async () => {
    if (!formData.description || !formData.amount) {
      alert('Please fill in description and amount');
      return;
    }

    setSaving(true);
    try {
      const expenseData = {
        milestone_id: milestone.id,
        roadmap_id: roadmapId,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category || 'Other',
        expense_date: formData.expense_date,
        due_date: formData.due_date || null,
        status: formData.status,
        payment_method: formData.payment_method || null,
        paid_by_name: formData.paid_by_name || null,
        paid_by_user_id: formData.paid_by_user_id || null,
        notes: formData.notes || null
      };

      if (editingExpense) {
        // Update existing expense
        const { error } = await updateExpense(editingExpense.id, expenseData);
        if (error) throw error;
      } else {
        // Create new expense
        const { error } = await createExpense(expenseData);
        if (error) throw error;
      }

      // Reload expenses
      await loadExpenses();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Delete expense
  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const { error } = await deleteExpense(expenseId);
      if (error) throw error;
      await loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  // Mark as paid
  const handleMarkAsPaid = async (expenseId) => {
    try {
      const { error } = await markExpenseAsPaid(expenseId);
      if (error) throw error;
      await loadExpenses();
    } catch (error) {
      console.error('Error marking expense as paid:', error);
      alert('Failed to mark expense as paid. Please try again.');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      paid: 'bg-green-500/20 text-green-700',
      pending: 'bg-yellow-500/20 text-yellow-700',
      overdue: 'bg-red-500/20 text-red-700',
      cancelled: 'bg-gray-500/20 text-gray-700'
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-white/20 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Budget Summary */}
      {milestone.budget_amount > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{color: '#2B2B2B'}}>
              Budget: {formatCurrency(milestone.budget_amount)}
            </h3>
            <div className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>
              Spent: {formatCurrency(totals.total)} ({((totals.total / milestone.budget_amount) * 100).toFixed(1)}%)
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((totals.total / milestone.budget_amount) * 100, 100)}%` }}
              className="h-full rounded-full"
              style={{
                background: totals.total > milestone.budget_amount
                  ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                  : 'linear-gradient(90deg, #C084FC, #F8C6D0)'
              }}
            />
          </div>

          {/* Budget stats grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs mb-1" style={{color: '#2B2B2B', opacity: 0.7}}>Paid</div>
              <div className="text-sm font-semibold text-green-600">{formatCurrency(totals.paid)}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{color: '#2B2B2B', opacity: 0.7}}>Pending</div>
              <div className="text-sm font-semibold text-yellow-600">{formatCurrency(totals.pending)}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{color: '#2B2B2B', opacity: 0.7}}>Remaining</div>
              <div className="text-sm font-semibold" style={{color: '#C084FC'}}>
                {formatCurrency(milestone.budget_amount - totals.total)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{color: '#2B2B2B'}}>
            Expenses ({expenses.length})
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddExpense}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white"
            style={{background: 'linear-gradient(135deg, #C084FC, #F8C6D0)'}}
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </motion.button>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-8" style={{color: '#2B2B2B', opacity: 0.5}}>
            <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No expenses tracked yet</p>
            <p className="text-sm mt-1">Add your first expense to start tracking your budget</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card-light rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold" style={{color: '#2B2B2B'}}>
                        {expense.description}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(expense.status)}`}>
                        {expense.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>
                      {expense.category && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {expense.category}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </span>
                      {expense.paid_by_name && (
                        <span className="flex items-center gap-1" style={{ color: '#C084FC' }}>
                          <User className="w-3 h-3" />
                          {expense.paid_by_name}
                        </span>
                      )}
                      {expense.due_date && expense.status === 'pending' && (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Clock className="w-3 h-3" />
                          Due {new Date(expense.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {expense.notes && (
                      <p className="text-sm mt-2" style={{color: '#2B2B2B', opacity: 0.6}}>
                        {expense.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <div className="text-xl font-bold" style={{color: '#2B2B2B'}}>
                        {formatCurrency(expense.amount)}
                      </div>
                      {expense.payment_method && (
                        <div className="text-xs flex items-center gap-1 justify-end" style={{color: '#2B2B2B', opacity: 0.6}}>
                          <CreditCard className="w-3 h-3" />
                          {expense.payment_method}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {expense.status === 'pending' && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleMarkAsPaid(expense.id)}
                          className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30"
                          title="Mark as Paid"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEditExpense(expense)}
                        className="p-2 rounded-lg glass-card-light hover:glass-card"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" style={{color: '#C084FC'}} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Expense Modal - Rendered via Portal */}
      {showAddModal && ReactDOM.createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card-strong rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-6" style={{color: '#2B2B2B'}}>
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h3>

              <div className="space-y-4">
                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{color: '#2B2B2B'}}>
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl"
                    placeholder="e.g., Venue deposit"
                    style={{
                      color: '#2B2B2B',
                      background: 'rgba(0, 0, 0, 0.03)',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      fontSize: '16px'
                    }}
                  />
                </div>

                {/* Amount and Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{color: '#2B2B2B'}}>
                      Amount * ($)
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      style={{
                        color: '#2B2B2B',
                        background: 'rgba(0, 0, 0, 0.03)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        fontSize: '16px'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{color: '#2B2B2B'}}>
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl"
                      style={{
                        color: '#2B2B2B',
                        background: 'rgba(0, 0, 0, 0.03)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        fontSize: '16px'
                      }}
                    >
                      <option value="">Select...</option>
                      {categories.map(cat => (
                        <option key={cat.name} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{color: '#2B2B2B'}}>
                      Expense Date
                    </label>
                    <input
                      type="date"
                      value={formData.expense_date}
                      onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl"
                      style={{
                        color: '#2B2B2B',
                        background: 'rgba(0, 0, 0, 0.03)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        fontSize: '16px'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{color: '#2B2B2B'}}>
                      Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl"
                      style={{
                        color: '#2B2B2B',
                        background: 'rgba(0, 0, 0, 0.03)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                </div>

                {/* Status and Paid By */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{color: '#2B2B2B'}}>
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl"
                      style={{
                        color: '#2B2B2B',
                        background: 'rgba(0, 0, 0, 0.03)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        fontSize: '16px'
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{color: '#2B2B2B'}}>
                      Paid By
                    </label>
                    <select
                      value={formData.paid_by_name}
                      onChange={(e) => handlePaidByChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl"
                      style={{
                        color: '#2B2B2B',
                        background: 'rgba(0, 0, 0, 0.03)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        fontSize: '16px'
                      }}
                    >
                      <option value="">Both / Shared</option>
                      {getPartnerOptions().map(partner => (
                        <option key={partner.name} value={partner.name}>{partner.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{color: '#2B2B2B'}}>
                    Payment Method
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl"
                    style={{
                      color: '#2B2B2B',
                      background: 'rgba(0, 0, 0, 0.03)',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      fontSize: '16px'
                    }}
                  >
                    <option value="">Select...</option>
                    {PAYMENT_METHODS.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{color: '#2B2B2B'}}>
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl"
                    placeholder="Additional notes..."
                    rows={3}
                    style={{
                      color: '#2B2B2B',
                      background: 'rgba(0, 0, 0, 0.03)',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      fontSize: '16px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold"
                  style={{
                    background: 'rgba(0, 0, 0, 0.05)',
                    color: '#2B2B2B',
                    border: '1px solid rgba(0, 0, 0, 0.1)'
                  }}
                  disabled={saving}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveExpense}
                  className="flex-1 px-4 py-3 rounded-xl text-white font-semibold"
                  style={{background: 'linear-gradient(135deg, #C084FC, #F8C6D0)'}}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (editingExpense ? 'Update' : 'Add Expense')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default ExpenseTracker;
