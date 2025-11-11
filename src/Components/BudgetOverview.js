import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  Calendar, PieChart, CreditCard, CheckCircle
} from 'lucide-react';
import {
  getRoadmapBudgetSummary,
  getExpenseCategoryBreakdown,
  getOverdueExpenses,
  getUpcomingExpenses
} from '../services/supabaseService';

const BudgetOverview = ({ roadmapId, milestones = [] }) => {
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [overdueExpenses, setOverdueExpenses] = useState([]);
  const [upcomingExpenses, setUpcomingExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roadmapId) {
      loadBudgetData();
    }
  }, [roadmapId]);

  const loadBudgetData = async () => {
    setLoading(true);
    try {
      // Load all budget data in parallel
      const [summaryRes, categoryRes, overdueRes, upcomingRes] = await Promise.all([
        getRoadmapBudgetSummary(roadmapId),
        getExpenseCategoryBreakdown(roadmapId),
        getOverdueExpenses(roadmapId),
        getUpcomingExpenses(roadmapId, 30)
      ]);

      if (summaryRes.data) setBudgetSummary(summaryRes.data);
      if (categoryRes.data) setCategoryBreakdown(categoryRes.data);
      if (overdueRes.data) setOverdueExpenses(overdueRes.data);
      if (upcomingRes.data) setUpcomingExpenses(upcomingRes.data);
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatPercent = (value) => {
    return `${parseFloat(value || 0).toFixed(1)}%`;
  };

  // Generate colors for category pie chart
  const getCategoryColor = (index) => {
    const colors = [
      'linear-gradient(135deg, #C084FC, #F8C6D0)',
      'linear-gradient(135deg, #60A5FA, #A78BFA)',
      'linear-gradient(135deg, #F87171, #FB923C)',
      'linear-gradient(135deg, #34D399, #10B981)',
      'linear-gradient(135deg, #FBBF24, #F59E0B)',
      'linear-gradient(135deg, #EC4899, #F43F5E)',
      'linear-gradient(135deg, #8B5CF6, #6366F1)',
      'linear-gradient(135deg, #14B8A6, #06B6D4)'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/20 rounded w-1/3"></div>
          <div className="h-20 bg-white/20 rounded"></div>
          <div className="h-20 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate if over budget
  const isOverBudget = budgetSummary &&
    parseFloat(budgetSummary.total_expenses) > parseFloat(budgetSummary.total_budget);

  const budgetVariance = budgetSummary ?
    parseFloat(budgetSummary.total_budget) - parseFloat(budgetSummary.total_expenses) : 0;

  return (
    <div className="space-y-6">
      {/* Main Budget Summary */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{color: '#2B2B2B'}}>
          <DollarSign className="w-8 h-8" style={{color: '#C084FC'}} />
          Budget Overview
        </h2>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Budget */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card-light rounded-xl p-4"
          >
            <div className="text-xs mb-2" style={{color: '#2B2B2B', opacity: 0.7}}>
              Total Budget
            </div>
            <div className="text-2xl font-bold" style={{color: '#2B2B2B'}}>
              {formatCurrency(budgetSummary?.total_budget || 0)}
            </div>
          </motion.div>

          {/* Total Spent */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card-light rounded-xl p-4"
          >
            <div className="text-xs mb-2" style={{color: '#2B2B2B', opacity: 0.7}}>
              Total Expenses
            </div>
            <div className="text-2xl font-bold" style={{color: isOverBudget ? '#EF4444' : '#2B2B2B'}}>
              {formatCurrency(budgetSummary?.total_expenses || 0)}
            </div>
            <div className="text-xs mt-1" style={{color: isOverBudget ? '#EF4444' : '#10B981'}}>
              {formatPercent(budgetSummary?.budget_used_percentage)} of budget
            </div>
          </motion.div>

          {/* Total Paid */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card-light rounded-xl p-4"
          >
            <div className="text-xs mb-2" style={{color: '#2B2B2B', opacity: 0.7}}>
              Total Paid
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(budgetSummary?.total_paid || 0)}
            </div>
            <div className="text-xs mt-1 text-green-600">
              {formatPercent(budgetSummary?.payment_completion_percentage)} paid
            </div>
          </motion.div>

          {/* Remaining/Variance */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card-light rounded-xl p-4"
          >
            <div className="text-xs mb-2" style={{color: '#2B2B2B', opacity: 0.7}}>
              {budgetVariance >= 0 ? 'Remaining Budget' : 'Over Budget'}
            </div>
            <div className={`text-2xl font-bold flex items-center gap-2 ${budgetVariance >= 0 ? '' : 'text-red-600'}`}>
              {budgetVariance >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              {formatCurrency(Math.abs(budgetVariance))}
            </div>
          </motion.div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          {/* Budget Usage */}
          <div>
            <div className="flex justify-between text-sm mb-2" style={{color: '#2B2B2B'}}>
              <span>Budget Usage</span>
              <span className="font-semibold">{formatPercent(budgetSummary?.budget_used_percentage)}</span>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(parseFloat(budgetSummary?.budget_used_percentage || 0), 100)}%` }}
                className="h-full rounded-full"
                style={{
                  background: isOverBudget
                    ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                    : 'linear-gradient(90deg, #C084FC, #F8C6D0)'
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Payment Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2" style={{color: '#2B2B2B'}}>
              <span>Payment Progress</span>
              <span className="font-semibold">{formatPercent(budgetSummary?.payment_completion_percentage)}</span>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(parseFloat(budgetSummary?.payment_completion_percentage || 0), 100)}%` }}
                className="h-full rounded-full"
                style={{background: 'linear-gradient(90deg, #10B981, #059669)'}}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{color: '#2B2B2B'}}>
            <PieChart className="w-5 h-5" style={{color: '#C084FC'}} />
            Expenses by Category
          </h3>

          {categoryBreakdown.length === 0 ? (
            <div className="text-center py-8" style={{color: '#2B2B2B', opacity: 0.5}}>
              <PieChart className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No expenses categorized yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.slice(0, 6).map((category, index) => {
                const percentage = budgetSummary?.total_expenses > 0
                  ? (parseFloat(category.total_amount) / parseFloat(budgetSummary.total_expenses)) * 100
                  : 0;

                return (
                  <div key={category.category}>
                    <div className="flex justify-between text-sm mb-1" style={{color: '#2B2B2B'}}>
                      <span className="font-medium">{category.category}</span>
                      <span className="font-semibold">
                        {formatCurrency(category.total_amount)} ({formatPercent(percentage)})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className="h-full rounded-full"
                        style={{background: getCategoryColor(index)}}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1" style={{color: '#2B2B2B', opacity: 0.6}}>
                      <span>{category.expense_count} expense{category.expense_count !== 1 ? 's' : ''}</span>
                      <span className="text-green-600">
                        {formatCurrency(category.paid_amount)} paid
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alerts & Upcoming Payments */}
        <div className="space-y-4">
          {/* Overdue Expenses Alert */}
          {overdueExpenses.length > 0 && (
            <div className="glass-card rounded-2xl p-6 border-2 border-red-500/30">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Overdue Expenses ({overdueExpenses.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {overdueExpenses.map((expense) => (
                  <div key={expense.id} className="glass-card-light rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-sm" style={{color: '#2B2B2B'}}>
                          {expense.description}
                        </div>
                        <div className="text-xs mt-1 text-red-600">
                          Due: {new Date(expense.due_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-red-600">
                        {formatCurrency(expense.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Payments */}
          {upcomingExpenses.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{color: '#2B2B2B'}}>
                <Calendar className="w-5 h-5" style={{color: '#C084FC'}} />
                Upcoming Payments ({upcomingExpenses.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {upcomingExpenses.map((expense) => (
                  <div key={expense.id} className="glass-card-light rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-sm" style={{color: '#2B2B2B'}}>
                          {expense.description}
                        </div>
                        <div className="text-xs mt-1" style={{color: '#2B2B2B', opacity: 0.7}}>
                          Due: {new Date(expense.due_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm font-bold" style={{color: '#C084FC'}}>
                        {formatCurrency(expense.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Milestone Budget Summary */}
          {milestones.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{color: '#2B2B2B'}}>
                <CheckCircle className="w-5 h-5" style={{color: '#C084FC'}} />
                Milestone Budgets
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {milestones
                  .filter(m => m.budget_amount > 0)
                  .map((milestone) => (
                    <div key={milestone.id} className="glass-card-light rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-sm" style={{color: '#2B2B2B'}}>
                            {milestone.title}
                          </div>
                          <div className="text-xs mt-1" style={{color: '#2B2B2B', opacity: 0.7}}>
                            Budget: {formatCurrency(milestone.budget_amount)}
                          </div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${milestone.completed ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'}`}>
                          {milestone.completed ? 'Complete' : 'In Progress'}
                        </div>
                      </div>
                    </div>
                  ))}
                {milestones.filter(m => m.budget_amount > 0).length === 0 && (
                  <div className="text-center py-4" style={{color: '#2B2B2B', opacity: 0.5}}>
                    <p className="text-sm">No budgets set for milestones yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending Payments Summary */}
      {budgetSummary && parseFloat(budgetSummary.total_pending) > 0 && (
        <div className="glass-card rounded-2xl p-6 border-2 border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 text-yellow-600">
                <CreditCard className="w-5 h-5" />
                Pending Payments
              </h3>
              <p className="text-sm mt-1" style={{color: '#2B2B2B', opacity: 0.7}}>
                You have expenses that haven't been paid yet
              </p>
            </div>
            <div className="text-3xl font-bold text-yellow-600">
              {formatCurrency(budgetSummary.total_pending)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetOverview;
