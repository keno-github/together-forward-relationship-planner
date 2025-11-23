/**
 * Financial Intelligence Agent - Test Suite
 *
 * Tests the agent's ability to track expenses, monitor budgets,
 * and provide intelligent financial insights
 */

import {
  analyzeSavingsProgress,
  trackExpense,
  optimizeBudget,
  projectFinalCost,
  detectCategory
} from '../../src/services/agents/financialIntelligenceAgent';

describe('Financial Intelligence Agent', () => {
  describe('analyzeSavingsProgress()', () => {
    test('should calculate savings progress correctly', () => {
      const goal = {
        targetAmount: 30000,
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() // 6 months from now
      };

      const currentStatus = {
        currentAmount: 15000,
        monthlyContribution: 2000
      };

      const result = analyzeSavingsProgress(goal, currentStatus);

      expect(result.progress.currentAmount).toBe(15000);
      expect(result.progress.targetAmount).toBe(30000);
      expect(result.progress.remainingAmount).toBe(15000);
      expect(parseFloat(result.progress.progressPercentage)).toBe(50.0);
    });

    test('should detect when on track', () => {
      const goal = {
        targetAmount: 20000,
        targetDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString() // 8 months
      };

      const currentStatus = {
        currentAmount: 10000,
        monthlyContribution: 1500
      };

      const result = analyzeSavingsProgress(goal, currentStatus);

      expect(result.progress.isOnTrack).toBe(true);
      expect(result.savings.needsAdjustment).toBe(false);
    });

    test('should detect when behind schedule', () => {
      const goal = {
        targetAmount: 30000,
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 3 months
      };

      const currentStatus = {
        currentAmount: 5000,
        monthlyContribution: 1000
      };

      const result = analyzeSavingsProgress(goal, currentStatus);

      expect(result.progress.isOnTrack).toBe(false);
      expect(result.savings.needsAdjustment).toBe(true);
      expect(parseFloat(result.savings.gap)).toBeGreaterThan(0);
    });

    test('should project completion date', () => {
      const goal = {
        targetAmount: 20000,
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };

      const currentStatus = {
        currentAmount: 5000,
        monthlyContribution: 1000
      };

      const result = analyzeSavingsProgress(goal, currentStatus);

      expect(result.timeline.projectedDate).toBeDefined();
      expect(result.timeline.projectedMonths).toBeDefined();
      expect(result.timeline.projectedMonths).toBeGreaterThan(0);
    });

    test('should provide recommendations', () => {
      const goal = {
        targetAmount: 25000,
        targetDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString() // 5 months
      };

      const currentStatus = {
        currentAmount: 3000,
        monthlyContribution: 1000
      };

      const result = analyzeSavingsProgress(goal, currentStatus);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].priority).toBeDefined();
      expect(result.recommendations[0].category).toBeDefined();
    });

    test('should celebrate good progress', () => {
      const goal = {
        targetAmount: 30000,
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
      };

      const currentStatus = {
        currentAmount: 24000,
        monthlyContribution: 2000
      };

      const result = analyzeSavingsProgress(goal, currentStatus);

      const successRec = result.recommendations.find(r => r.category === 'success');
      expect(successRec).toBeDefined();
      expect(successRec.celebration).toBe(true);
    });
  });

  describe('detectCategory()', () => {
    test('should detect venue category', () => {
      expect(detectCategory('Wedding venue booking')).toBe('venue');
      expect(detectCategory('Reserve ceremony hall')).toBe('venue');
    });

    test('should detect catering category', () => {
      expect(detectCategory('Catering deposit')).toBe('catering');
      expect(detectCategory('Wedding cake order')).toBe('catering');
      expect(detectCategory('Dinner for 150 guests')).toBe('catering');
    });

    test('should detect photography category', () => {
      expect(detectCategory('Photography package')).toBe('photography');
      expect(detectCategory('Videographer booking')).toBe('photography');
    });

    test('should detect attire category', () => {
      expect(detectCategory('Wedding dress alterations')).toBe('attire');
      expect(detectCategory('Tuxedo rental')).toBe('attire');
    });

    test('should detect flowers category', () => {
      expect(detectCategory('Bridal bouquet')).toBe('flowers');
      expect(detectCategory('Centerpiece flowers')).toBe('flowers');
    });

    test('should detect music category', () => {
      expect(detectCategory('DJ booking')).toBe('music');
      expect(detectCategory('Live band deposit')).toBe('music');
    });

    test('should detect transportation category', () => {
      expect(detectCategory('Limo service')).toBe('transportation');
      expect(detectCategory('Shuttle for guests')).toBe('transportation');
    });

    test('should default to other for unknown', () => {
      expect(detectCategory('Random expense')).toBe('other');
      expect(detectCategory('Miscellaneous item')).toBe('other');
    });
  });

  describe('trackExpense()', () => {
    test('should track expense with auto-categorization', () => {
      const expense = {
        amount: 3500,
        title: 'Photography package deposit',
        date: new Date().toISOString()
      };

      const budget = {
        photography: {
          allocated: 4000,
          spent: 0
        }
      };

      const result = trackExpense(expense, budget);

      expect(result.expense.category).toBe('photography');
      expect(result.budgetStatus.status).toBe('within_budget');
    });

    test('should detect budget warning', () => {
      const expense = {
        amount: 3200,
        title: 'Venue final payment',
        category: 'venue'
      };

      const budget = {
        venue: {
          allocated: 10000,
          spent: 6900
        }
      };

      const result = trackExpense(expense, budget);

      expect(result.budgetStatus.status).toBe('warning');
      expect(result.budgetStatus.severity).toBe('low');
      expect(parseFloat(result.budgetStatus.percentUsed)).toBeGreaterThan(75);
    });

    test('should detect near limit', () => {
      const expense = {
        amount: 500,
        title: 'Catering addon',
        category: 'catering'
      };

      const budget = {
        catering: {
          allocated: 5000,
          spent: 4600
        }
      };

      const result = trackExpense(expense, budget);

      expect(result.budgetStatus.status).toBe('near_limit');
      expect(result.budgetStatus.severity).toBe('medium');
      expect(result.alerts.length).toBeGreaterThan(0);
    });

    test('should detect over budget', () => {
      const expense = {
        amount: 1500,
        title: 'Flowers upgrade',
        category: 'flowers'
      };

      const budget = {
        flowers: {
          allocated: 2000,
          spent: 1800
        }
      };

      const result = trackExpense(expense, budget);

      expect(result.budgetStatus.status).toBe('over_budget');
      expect(result.budgetStatus.severity).toBe('high');
      expect(result.budgetStatus.remaining).toBeLessThan(0);

      const overBudgetAlert = result.alerts.find(a => a.type === 'budget_exceeded');
      expect(overBudgetAlert).toBeDefined();
    });

    test('should detect large expense anomaly', () => {
      const expense = {
        amount: 15000,
        title: 'Venue booking',
        category: 'venue'
      };

      const budget = {
        totalBudget: 30000,
        venue: {
          allocated: 20000,
          spent: 0
        }
      };

      const result = trackExpense(expense, budget);

      const largeExpenseAnomaly = result.anomalies.find(a => a.type === 'large_expense');
      expect(largeExpenseAnomaly).toBeDefined();
      expect(largeExpenseAnomaly.severity).toBe('high');
    });

    test('should detect round number estimate', () => {
      const expense = {
        amount: 5000,
        title: 'Photography estimate',
        category: 'photography'
      };

      const budget = {
        photography: {
          allocated: 6000,
          spent: 0
        }
      };

      const result = trackExpense(expense, budget);

      const roundNumberAnomaly = result.anomalies.find(a => a.type === 'round_number');
      expect(roundNumberAnomaly).toBeDefined();
      expect(roundNumberAnomaly.severity).toBe('low');
    });

    test('should handle unknown category budget', () => {
      const expense = {
        amount: 500,
        title: 'Random expense',
        category: 'unknown_category'
      };

      const budget = {};

      const result = trackExpense(expense, budget);

      expect(result.budgetStatus.status).toBe('unknown');
      expect(result.budgetStatus.message).toContain('No budget set');
    });
  });

  describe('optimizeBudget()', () => {
    test('should suggest increasing under-allocated categories', () => {
      const currentBudget = {
        catering: {
          allocated: 5000,
          spent: 4800
        },
        flowers: {
          allocated: 1500,
          spent: 1450
        }
      };

      const spendingHistory = {};

      const result = optimizeBudget(currentBudget, spendingHistory);

      const increases = result.suggestions.filter(s => s.type === 'increase');
      expect(increases.length).toBeGreaterThan(0);
      expect(increases[0].category).toBeDefined();
      expect(increases[0].suggested).toBeGreaterThan(increases[0].current);
    });

    test('should suggest decreasing over-allocated categories', () => {
      const currentBudget = {
        invitations: {
          allocated: 2000,
          spent: 800
        },
        decorations: {
          allocated: 3000,
          spent: 1200
        }
      };

      const spendingHistory = {};

      const result = optimizeBudget(currentBudget, spendingHistory);

      const decreases = result.suggestions.filter(s => s.type === 'decrease');
      expect(decreases.length).toBeGreaterThan(0);
      expect(decreases[0].suggested).toBeLessThan(decreases[0].current);
    });

    test('should calculate reallocation plan', () => {
      const currentBudget = {
        category1: {
          allocated: 5000,
          spent: 2000
        },
        category2: {
          allocated: 3000,
          spent: 1000
        }
      };

      const spendingHistory = {};

      const result = optimizeBudget(currentBudget, spendingHistory);

      expect(result.reallocationPlan).toBeDefined();
      expect(result.potentialSavings).toBeGreaterThan(0);
    });
  });

  describe('projectFinalCost()', () => {
    test('should project final cost based on current spending', () => {
      const roadmap = {
        milestones: [
          { id: 1, estimated_cost: 5000, progress: 50 },
          { id: 2, estimated_cost: 3000, progress: 25 },
          { id: 3, estimated_cost: 2000, progress: 0 }
        ]
      };

      const currentSpending = {
        1: 2800,
        2: 900,
        3: 0
      };

      const result = projectFinalCost(roadmap, currentSpending);

      expect(result.totalEstimated).toBe(10000);
      expect(result.totalSpent).toBe(3700);
      expect(result.projectedTotal).toBeGreaterThan(0);
      expect(result.overUnder).toBeDefined();
    });

    test('should detect over-budget projection', () => {
      const roadmap = {
        milestones: [
          { id: 1, estimated_cost: 5000, progress: 50 }
        ]
      };

      const currentSpending = {
        1: 3500 // Spending more than half of budget at 50% progress
      };

      const result = projectFinalCost(roadmap, currentSpending);

      expect(result.projectionsByMilestone[1].projected).toBeGreaterThan(5000);
      expect(result.projectionsByMilestone[1].variance).toBeGreaterThan(0);
      expect(result.onBudget).toBe(false);
    });

    test('should use actual cost for completed milestones', () => {
      const roadmap = {
        milestones: [
          { id: 1, estimated_cost: 5000, progress: 100 }
        ]
      };

      const currentSpending = {
        1: 4500
      };

      const result = projectFinalCost(roadmap, currentSpending);

      expect(result.projectionsByMilestone[1].projected).toBe(4500);
      expect(result.projectionsByMilestone[1].variance).toBe(-500);
    });

    test('should use estimate for not-started milestones', () => {
      const roadmap = {
        milestones: [
          { id: 1, estimated_cost: 3000, progress: 0 }
        ]
      };

      const currentSpending = {};

      const result = projectFinalCost(roadmap, currentSpending);

      expect(result.projectionsByMilestone[1].projected).toBe(3000);
      expect(result.projectionsByMilestone[1].variance).toBe(0);
    });

    test('should calculate variance percentage', () => {
      const roadmap = {
        milestones: [
          { id: 1, estimated_cost: 5000, progress: 50 }
        ]
      };

      const currentSpending = {
        1: 3000
      };

      const result = projectFinalCost(roadmap, currentSpending);

      expect(result.projectionsByMilestone[1].variancePercent).toBeDefined();
      expect(parseFloat(result.projectionsByMilestone[1].variancePercent)).toBeGreaterThan(0);
    });
  });

  describe('Integration Test - Full Financial Flow', () => {
    test('should track expenses and provide budget insights', () => {
      // Setup: Wedding with $30,000 budget
      const budget = {
        totalBudget: 30000,
        venue: { allocated: 9000, spent: 0 },
        catering: { allocated: 7500, spent: 0 },
        photography: { allocated: 3600, spent: 0 },
        flowers: { allocated: 1500, spent: 0 },
        music: { allocated: 2400, spent: 0 },
        invitations: { allocated: 600, spent: 0 },
        attire: { allocated: 2400, spent: 0 },
        other: { allocated: 3000, spent: 0 }
      };

      // Simulate expense tracking
      const expenses = [
        { amount: 5000, title: 'Venue deposit', date: new Date().toISOString() },
        { amount: 2000, title: 'Photography booking', date: new Date().toISOString() },
        { amount: 800, title: 'Invitations printing', date: new Date().toISOString() }
      ];

      const results = expenses.map(expense => trackExpense(expense, budget));

      // All should be categorized
      results.forEach(result => {
        expect(result.expense.category).toBeDefined();
        expect(result.expense.category).not.toBe('other');
      });

      // Update budget with spending
      budget.venue.spent = 5000;
      budget.photography.spent = 2000;
      budget.invitations.spent = 800;

      // Test budget optimization
      const optimization = optimizeBudget(budget, {});

      expect(optimization.suggestions).toBeDefined();

      // Invitations should be flagged for decrease (over-allocated)
      const invitationSuggestion = optimization.suggestions.find(s => s.category === 'invitations');
      expect(invitationSuggestion).toBeDefined();
      expect(invitationSuggestion.type).toBe('decrease');
    });

    test('should project final cost and detect budget issues', () => {
      const roadmap = {
        milestones: [
          { id: 1, estimated_cost: 9000, progress: 60, title: 'Venue' },
          { id: 2, estimated_cost: 7500, progress: 30, title: 'Catering' },
          { id: 3, estimated_cost: 3600, progress: 100, title: 'Photography' }
        ]
      };

      const currentSpending = {
        1: 6000, // On track (60% spent at 60% progress)
        2: 3000, // Over budget (40% spent at 30% progress)
        3: 3400  // Under budget (completed under estimate)
      };

      const projection = projectFinalCost(roadmap, currentSpending);

      // Should detect catering is trending over budget
      expect(projection.projectionsByMilestone[2].projected).toBeGreaterThan(7500);
      expect(projection.projectionsByMilestone[2].variance).toBeGreaterThan(0);

      // Should detect photography came in under budget
      expect(projection.projectionsByMilestone[3].variance).toBeLessThan(0);
    });
  });
});
