import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  Calendar, PieChart, CreditCard, Check, ChevronRight
} from 'lucide-react';
import {
  getRoadmapBudgetSummary,
  getExpenseCategoryBreakdown,
  getOverdueExpenses,
  getUpcomingExpenses
} from '../services/supabaseService';

/**
 * BudgetOverview - Elegant financial tracking interface
 */
const BudgetOverview = ({ roadmapId, milestones = [] }) => {
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [overdueExpenses, setOverdueExpenses] = useState([]);
  const [upcomingExpenses, setUpcomingExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roadmapId) {
      loadBudgetData();
    } else {
      setLoading(false);
    }
  }, [roadmapId]);

  const loadBudgetData = async () => {
    setLoading(true);
    try {
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

  const formatPercent = (value) => `${parseFloat(value || 0).toFixed(1)}%`;

  const categoryColors = [
    '#c49a6c', '#7d8c75', '#6b8fad', '#d4a574',
    '#a88352', '#5f6d58', '#5a7a94', '#c76b6b'
  ];

  // Safety check for missing roadmapId
  if (!roadmapId) {
    return (
      <div className="tf-app" style={{ background: '#faf8f5' }}>
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="text-center py-16">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(196, 154, 108, 0.12)' }}
            >
              <DollarSign className="w-8 h-8" style={{ color: '#c49a6c' }} />
            </div>
            <h3
              className="text-xl font-medium mb-2"
              style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}
            >
              No Budget Data Yet
            </h3>
            <p style={{ color: '#6b635b' }}>
              Budget tracking will appear here once you have expenses.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-[#c49a6c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isOverBudget = budgetSummary &&
    parseFloat(budgetSummary.total_expenses) > parseFloat(budgetSummary.total_budget);

  const budgetVariance = budgetSummary ?
    parseFloat(budgetSummary.total_budget) - parseFloat(budgetSummary.total_expenses) : 0;

  return (
    <div className="tf-app" style={{ background: '#faf8f5' }}>
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(196, 154, 108, 0.12)' }}
            >
              <DollarSign className="w-6 h-6" style={{ color: '#c49a6c' }} />
            </div>
            <div>
              <h2
                className="text-2xl font-medium"
                style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}
              >
                Budget
              </h2>
              <p style={{ color: '#6b635b' }}>Track your expenses and payments</p>
            </div>
          </div>
        </header>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Total Budget"
            value={formatCurrency(budgetSummary?.total_budget || 0)}
            accentColor="#c49a6c"
          />
          <MetricCard
            label="Total Expenses"
            value={formatCurrency(budgetSummary?.total_expenses || 0)}
            subtitle={`${formatPercent(budgetSummary?.budget_used_percentage)} used`}
            accentColor={isOverBudget ? '#c76b6b' : '#7d8c75'}
          />
          <MetricCard
            label="Total Paid"
            value={formatCurrency(budgetSummary?.total_paid || 0)}
            subtitle={`${formatPercent(budgetSummary?.payment_completion_percentage)} paid`}
            accentColor="#7d8c75"
          />
          <MetricCard
            label={budgetVariance >= 0 ? 'Remaining' : 'Over Budget'}
            value={formatCurrency(Math.abs(budgetVariance))}
            icon={budgetVariance >= 0 ? TrendingUp : TrendingDown}
            accentColor={budgetVariance >= 0 ? '#7d8c75' : '#c76b6b'}
          />
        </div>

        {/* Progress Section */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ background: '#ffffff', border: '1px solid #e8e4de' }}
        >
          {/* Budget Usage */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium" style={{ color: '#2d2926' }}>
                Budget Usage
              </span>
              <span
                className="text-lg font-semibold"
                style={{ fontFamily: "'Playfair Display', serif", color: isOverBudget ? '#c76b6b' : '#c49a6c' }}
              >
                {formatPercent(budgetSummary?.budget_used_percentage)}
              </span>
            </div>
            <div className="h-2 rounded-full" style={{ background: '#e8e4de' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(parseFloat(budgetSummary?.budget_used_percentage || 0), 100)}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: isOverBudget ? '#c76b6b' : '#c49a6c' }}
              />
            </div>
          </div>

          {/* Payment Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium" style={{ color: '#2d2926' }}>
                Payment Progress
              </span>
              <span
                className="text-lg font-semibold"
                style={{ fontFamily: "'Playfair Display', serif", color: '#7d8c75' }}
              >
                {formatPercent(budgetSummary?.payment_completion_percentage)}
              </span>
            </div>
            <div className="h-2 rounded-full" style={{ background: '#e8e4de' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(parseFloat(budgetSummary?.payment_completion_percentage || 0), 100)}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                className="h-full rounded-full"
                style={{ background: '#7d8c75' }}
              />
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div
            className="rounded-2xl p-6"
            style={{ background: '#ffffff', border: '1px solid #e8e4de' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <PieChart className="w-5 h-5" style={{ color: '#c49a6c' }} />
              <h3 className="font-medium" style={{ color: '#2d2926' }}>
                By Category
              </h3>
            </div>

            {categoryBreakdown.length === 0 ? (
              <div className="text-center py-8">
                <PieChart className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: '#6b635b' }} />
                <p style={{ color: '#6b635b' }}>No expenses yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {categoryBreakdown.slice(0, 6).map((category, index) => {
                  const percentage = budgetSummary?.total_expenses > 0
                    ? (parseFloat(category.total_amount) / parseFloat(budgetSummary.total_expenses)) * 100
                    : 0;

                  return (
                    <div key={category.category}>
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ background: categoryColors[index % categoryColors.length] }}
                          />
                          <span className="text-sm font-medium" style={{ color: '#2d2926' }}>
                            {category.category}
                          </span>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: '#2d2926' }}>
                          {formatCurrency(category.total_amount)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: '#e8e4de' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                          className="h-full rounded-full"
                          style={{ background: categoryColors[index % categoryColors.length] }}
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-1" style={{ color: '#6b635b' }}>
                        <span>{category.expense_count} expense{category.expense_count !== 1 ? 's' : ''}</span>
                        <span>{formatPercent(percentage)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Overdue Alert */}
            {overdueExpenses.length > 0 && (
              <div
                className="rounded-2xl p-5"
                style={{ background: 'rgba(199, 107, 107, 0.05)', border: '1px solid rgba(199, 107, 107, 0.2)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5" style={{ color: '#c76b6b' }} />
                  <h3 className="font-medium" style={{ color: '#c76b6b' }}>
                    Overdue ({overdueExpenses.length})
                  </h3>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {overdueExpenses.map((expense) => (
                    <ExpenseItem
                      key={expense.id}
                      expense={expense}
                      formatCurrency={formatCurrency}
                      isOverdue
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Payments */}
            {upcomingExpenses.length > 0 && (
              <div
                className="rounded-2xl p-5"
                style={{ background: '#ffffff', border: '1px solid #e8e4de' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5" style={{ color: '#c49a6c' }} />
                  <h3 className="font-medium" style={{ color: '#2d2926' }}>
                    Upcoming ({upcomingExpenses.length})
                  </h3>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {upcomingExpenses.map((expense) => (
                    <ExpenseItem
                      key={expense.id}
                      expense={expense}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Milestone Budgets */}
            {milestones.filter(m => m.budget_amount > 0).length > 0 && (
              <div
                className="rounded-2xl p-5"
                style={{ background: '#ffffff', border: '1px solid #e8e4de' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Check className="w-5 h-5" style={{ color: '#7d8c75' }} />
                  <h3 className="font-medium" style={{ color: '#2d2926' }}>
                    Milestones
                  </h3>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {milestones
                    .filter(m => m.budget_amount > 0)
                    .map((milestone) => (
                      <div
                        key={milestone.id}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: '#faf8f5' }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#2d2926' }}>
                            {milestone.title}
                          </p>
                          <p className="text-xs" style={{ color: '#6b635b' }}>
                            {formatCurrency(milestone.budget_amount)}
                          </p>
                        </div>
                        <span
                          className="text-xs font-medium px-2 py-1 rounded"
                          style={{
                            background: milestone.completed ? 'rgba(125, 140, 117, 0.15)' : 'rgba(196, 154, 108, 0.15)',
                            color: milestone.completed ? '#7d8c75' : '#a88352'
                          }}
                        >
                          {milestone.completed ? 'Done' : 'Active'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pending Payments Banner */}
        {budgetSummary && parseFloat(budgetSummary.total_pending) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 rounded-2xl p-6"
            style={{ background: 'rgba(212, 165, 116, 0.1)', border: '1px solid rgba(212, 165, 116, 0.3)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(212, 165, 116, 0.2)' }}
                >
                  <CreditCard className="w-6 h-6" style={{ color: '#d4a574' }} />
                </div>
                <div>
                  <h3 className="font-medium" style={{ color: '#a67c4a' }}>
                    Pending Payments
                  </h3>
                  <p className="text-sm" style={{ color: '#6b635b' }}>
                    Expenses awaiting payment
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-2xl font-semibold"
                  style={{ fontFamily: "'Playfair Display', serif", color: '#d4a574' }}
                >
                  {formatCurrency(budgetSummary.total_pending)}
                </span>
                <ChevronRight className="w-5 h-5" style={{ color: '#d4a574' }} />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

/**
 * Metric Card
 */
const MetricCard = ({ label, value, subtitle, icon: Icon, accentColor = '#c49a6c' }) => {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: '#ffffff', border: '1px solid #e8e4de', borderLeft: `3px solid ${accentColor}` }}
    >
      <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#6b635b' }}>
        {label}
      </p>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5" style={{ color: accentColor }} />}
        <span
          className="text-xl font-semibold"
          style={{ fontFamily: "'Playfair Display', serif", color: '#2d2926' }}
        >
          {value}
        </span>
      </div>
      {subtitle && (
        <p className="text-xs mt-1" style={{ color: accentColor }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

/**
 * Expense Item
 */
const ExpenseItem = ({ expense, formatCurrency, isOverdue }) => {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-xl"
      style={{ background: '#faf8f5' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#2d2926' }}>
          {expense.description}
        </p>
        <p
          className="text-xs"
          style={{ color: isOverdue ? '#c76b6b' : '#6b635b' }}
        >
          Due: {new Date(expense.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>
      <span
        className="text-sm font-semibold"
        style={{ color: isOverdue ? '#c76b6b' : '#c49a6c' }}
      >
        {formatCurrency(expense.amount)}
      </span>
    </div>
  );
};

export default BudgetOverview;
