import {
  detectTimelineConflicts,
  generateOptimalTimeline,
  analyzeBudgetDistribution,
  buildDependencyGraph,
  getOptimalGoalOrder,
  analyzeRisks,
  parseDurationToMonths
} from './goalAnalyzer';

/**
 * GoalOrchestrator: Intelligent system for managing multi-goal roadmaps
 *
 * Phase 1 Features:
 * - Maintains a "goal basket" that users build progressively
 * - Auto-saves to localStorage
 * - Handles templates and custom goals uniformly
 * - Basic conflict/synergy detection
 * - Smart suggestions
 *
 * Phase 2 Features (ENHANCED INTELLIGENCE):
 * - Advanced timeline conflict detection
 * - Budget optimization with allocation suggestions
 * - Dependency graph generation
 * - Risk analysis
 * - Smart reordering based on dependencies
 */

class GoalOrchestrator {
  constructor(user = null, locationData = null) {
    this.user = user;
    this.locationData = locationData;
    this.goalBasket = this.loadBasket();
    this.lunaContext = {};
    this.listeners = []; // For state change notifications
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GOAL MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Add a goal to the basket (template or custom)
   */
  addGoal(goal) {
    // Ensure goal has required fields
    const normalizedGoal = this.normalizeGoal(goal);

    // Check if goal already exists
    if (this.goalBasket.some(g => g.id === normalizedGoal.id)) {
      return {
        success: false,
        error: 'Goal already in basket'
      };
    }

    // Analyze how this goal fits with existing goals
    const analysis = this.analyzeGoalFit(normalizedGoal);

    // Add goal with metadata
    this.goalBasket.push({
      ...normalizedGoal,
      addedAt: Date.now(),
      status: 'draft',
      aiAnalysis: analysis
    });

    this.autoSave();
    this.notifyListeners();

    return {
      success: true,
      analysis,
      suggestions: this.generateSuggestions()
    };
  }

  /**
   * Remove a goal from basket
   */
  removeGoal(goalId) {
    const beforeLength = this.goalBasket.length;
    this.goalBasket = this.goalBasket.filter(g => g.id !== goalId);

    if (this.goalBasket.length < beforeLength) {
      this.autoSave();
      this.notifyListeners();
      return { success: true };
    }

    return { success: false, error: 'Goal not found' };
  }

  /**
   * Update an existing goal
   */
  updateGoal(goalId, updates) {
    const index = this.goalBasket.findIndex(g => g.id === goalId);
    if (index === -1) {
      return { success: false, error: 'Goal not found' };
    }

    // Merge updates
    this.goalBasket[index] = {
      ...this.goalBasket[index],
      ...updates,
      updatedAt: Date.now()
    };

    // Re-analyze fit
    this.goalBasket[index].aiAnalysis = this.analyzeGoalFit(this.goalBasket[index]);

    this.autoSave();
    this.notifyListeners();

    return { success: true, goal: this.goalBasket[index] };
  }

  /**
   * Get all goals in basket
   */
  getGoals() {
    return [...this.goalBasket];
  }

  /**
   * Get basket statistics (ENHANCED PHASE 2)
   */
  getStats() {
    if (this.goalBasket.length === 0) {
      return {
        totalGoals: 0,
        totalBudget: 0,
        totalDuration: 0,
        categories: {},
        conflicts: [],
        synergies: [],
        budgetAnalysis: null,
        timeline: null,
        dependencyGraph: null,
        risks: [],
        optimalOrder: []
      };
    }

    // Phase 2 Advanced Analysis
    const budgetAnalysis = analyzeBudgetDistribution(this.goalBasket);
    const timeline = generateOptimalTimeline(this.goalBasket);
    const dependencyGraph = buildDependencyGraph(this.goalBasket);
    const optimalOrder = getOptimalGoalOrder(this.goalBasket, dependencyGraph);
    const risks = analyzeRisks(this.goalBasket);

    return {
      // Phase 1 basics
      totalGoals: this.goalBasket.length,
      totalBudget: this.getTotalBudget(),
      totalDuration: this.getTotalDuration(),
      categories: this.getCategories(),
      conflicts: this.getAllConflicts(),
      synergies: this.getAllSynergies(),

      // Phase 2 advanced intelligence
      budgetAnalysis,      // Budget distribution, issues, optimizations
      timeline,            // Optimal timeline with start/end months
      dependencyGraph,     // Goal dependencies
      risks,               // Risk analysis with mitigation
      optimalOrder,        // Recommended goal sequence

      // Summary metrics
      metrics: {
        averageDuration: timeline.length > 0
          ? timeline.reduce((sum, t) => sum + t.duration, 0) / timeline.length
          : 0,
        maxEndMonth: timeline.length > 0
          ? Math.max(...timeline.map(t => t.endMonth))
          : 0,
        totalConflicts: this.getAllConflicts().length,
        totalSynergies: this.getAllSynergies().length,
        totalDependencies: dependencyGraph.edges.length,
        budgetIssues: budgetAnalysis.issues.length,
        riskLevel: this.calculateOverallRiskLevel(risks)
      }
    };
  }

  /**
   * Calculate overall risk level
   */
  calculateOverallRiskLevel(risks) {
    if (risks.length === 0) return 'low';

    const highRisks = risks.filter(r => r.severity === 'high').length;
    const mediumRisks = risks.filter(r => r.severity === 'medium').length;

    if (highRisks > 0) return 'high';
    if (mediumRisks > 1) return 'medium';
    return 'low';
  }

  /**
   * Clear entire basket
   */
  clearBasket() {
    this.goalBasket = [];
    this.autoSave();
    this.notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GOAL NORMALIZATION
  // ═══════════════════════════════════════════════════════════════════════

  normalizeGoal(goal) {
    return {
      id: goal.id || `goal_${Date.now()}`,
      title: goal.title,
      description: goal.description || '',
      category: goal.category || 'custom',
      icon: goal.icon || '✨',
      color: goal.color || 'bg-gradient-to-br from-purple-500 to-pink-500',
      estimatedCost: goal.estimatedCost || 0,
      duration: goal.duration || 'Flexible',
      tasks: goal.tasks || [],
      customDetails: goal.customDetails || goal.details || '',
      source: goal.source || (goal.id?.startsWith('custom_') ? 'custom' : 'template'),
      deepDiveData: goal.deepDiveData || null,
      needsLunaRefinement: goal.needsLunaRefinement || false
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INTELLIGENT ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  analyzeGoalFit(newGoal) {
    const existing = this.goalBasket.filter(g => g.id !== newGoal.id);

    if (existing.length === 0) {
      return {
        conflicts: [],
        synergies: [],
        budgetImpact: { level: 'manageable', message: 'First goal - no conflicts' },
        suggestedOrder: 1,
        dependencies: []
      };
    }

    return {
      conflicts: this.detectConflicts(newGoal, existing),
      synergies: this.detectSynergies(newGoal, existing),
      budgetImpact: this.calculateBudgetImpact(newGoal, existing),
      suggestedOrder: this.suggestOptimalOrder([...existing, newGoal]),
      dependencies: this.identifyDependencies(newGoal, existing)
    };
  }

  detectConflicts(newGoal, existing) {
    const conflicts = [];

    // PHASE 2: Timeline conflicts (using advanced analyzer)
    existing.forEach(existingGoal => {
      const timelineConflict = detectTimelineConflicts(newGoal, existingGoal);
      if (timelineConflict) {
        conflicts.push({
          type: timelineConflict.type,
          severity: timelineConflict.severity,
          message: timelineConflict.message,
          suggestion: timelineConflict.recommendation,
          with: existingGoal.id,
          withTitle: existingGoal.title
        });
      }
    });

    // Budget conflicts (total exceeds reasonable limit)
    const totalBudget = existing.reduce((sum, g) => sum + (g.estimatedCost || 0), 0) + (newGoal.estimatedCost || 0);

    if (totalBudget > 100000) {
      conflicts.push({
        type: 'budget',
        severity: 'high',
        message: `Total budget (€${totalBudget.toLocaleString()}) is very ambitious`,
        suggestion: 'Consider phasing goals over time or adjusting budgets'
      });
    } else if (totalBudget > 50000) {
      conflicts.push({
        type: 'budget',
        severity: 'medium',
        message: `Total budget (€${totalBudget.toLocaleString()}) requires strong financial planning`,
        suggestion: 'Add a financial planning goal to your roadmap'
      });
    }

    // Category conflicts (e.g., multiple business ventures)
    const sameCategory = existing.filter(g => g.category === newGoal.category);
    if (sameCategory.length > 0 && ['business', 'home'].includes(newGoal.category)) {
      conflicts.push({
        type: 'category',
        severity: 'medium',
        message: `Multiple ${newGoal.category} goals may require careful sequencing`,
        suggestion: 'Consider which goal should come first'
      });
    }

    return conflicts;
  }

  detectSynergies(newGoal, existing) {
    const synergies = [];

    // Wedding + Home Purchase synergy
    if (newGoal.category === 'home' && existing.some(g => g.category === 'wedding')) {
      synergies.push({
        type: 'logical_sequence',
        message: 'Home purchase pairs well with wedding planning',
        suggestion: 'Consider scheduling home purchase 6-12 months after wedding'
      });
    }

    if (newGoal.category === 'wedding' && existing.some(g => g.category === 'home')) {
      synergies.push({
        type: 'logical_sequence',
        message: 'Wedding planning pairs well with home purchase',
        suggestion: 'Many couples buy a home after getting married'
      });
    }

    // Business + Financial synergy
    if (newGoal.category === 'business' && existing.some(g => g.category === 'financial')) {
      synergies.push({
        type: 'financial',
        message: 'Financial planning supports business launch',
        suggestion: 'Strong financial foundation helps secure business funding'
      });
    }

    // Travel + Relationship synergy
    if (newGoal.category === 'travel' && existing.some(g => g.category === 'wedding' || g.category === 'relationship')) {
      synergies.push({
        type: 'experience',
        message: 'Travel strengthens relationships',
        suggestion: 'Consider combining this with honeymoon planning'
      });
    }

    return synergies;
  }

  calculateBudgetImpact(newGoal, existing) {
    const currentTotal = existing.reduce((sum, g) => sum + (g.estimatedCost || 0), 0);
    const newTotal = currentTotal + (newGoal.estimatedCost || 0);
    const increase = newTotal - currentTotal;
    const percentIncrease = currentTotal > 0 ? (increase / currentTotal) * 100 : 0;

    if (newTotal > 100000) {
      return {
        level: 'high',
        message: `Adds €${increase.toLocaleString()} (${Math.round(percentIncrease)}% increase) to total of €${newTotal.toLocaleString()}`,
        recommendation: 'Consider extended timeline or phased approach'
      };
    } else if (newTotal > 50000) {
      return {
        level: 'medium',
        message: `Adds €${increase.toLocaleString()} to total of €${newTotal.toLocaleString()}`,
        recommendation: 'Solid financial planning recommended'
      };
    } else {
      return {
        level: 'manageable',
        message: `Adds €${increase.toLocaleString()} to total of €${newTotal.toLocaleString()}`,
        recommendation: 'Financially achievable with planning'
      };
    }
  }

  suggestOptimalOrder(goals) {
    // Simple ordering heuristic:
    // 1. Financial goals first (foundation)
    // 2. Wedding/relationship goals
    // 3. Home purchase
    // 4. Business/creative goals
    // 5. Travel/experience goals

    const orderPriority = {
      'financial': 1,
      'wedding': 2,
      'relationship': 2,
      'home': 3,
      'business': 4,
      'creative': 4,
      'travel': 5,
      'health': 5,
      'learning': 5
    };

    return goals.map((g, idx) => ({
      goalId: g.id,
      suggestedPosition: orderPriority[g.category] || 6,
      currentPosition: idx + 1
    })).sort((a, b) => a.suggestedPosition - b.suggestedPosition);
  }

  identifyDependencies(newGoal, existing) {
    const dependencies = [];

    // Business depends on financial foundation
    if (newGoal.category === 'business' && existing.some(g => g.category === 'financial')) {
      const financialGoal = existing.find(g => g.category === 'financial');
      dependencies.push({
        goalId: financialGoal.id,
        type: 'prerequisite',
        reason: 'Financial foundation needed before business launch'
      });
    }

    // Home purchase depends on financial savings
    if (newGoal.category === 'home' && existing.some(g => g.category === 'financial')) {
      const financialGoal = existing.find(g => g.category === 'financial');
      dependencies.push({
        goalId: financialGoal.id,
        type: 'prerequisite',
        reason: 'Savings goal supports home down payment'
      });
    }

    return dependencies;
  }

  getAllConflicts() {
    return this.goalBasket.flatMap(g => g.aiAnalysis?.conflicts || []);
  }

  getAllSynergies() {
    return this.goalBasket.flatMap(g => g.aiAnalysis?.synergies || []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SMART SUGGESTIONS
  // ═══════════════════════════════════════════════════════════════════════

  generateSuggestions() {
    const suggestions = [];

    // Suggest Luna enhancement if basket has 2+ goals
    if (this.goalBasket.length >= 2 && !this.lunaContext.enhanced) {
      suggestions.push({
        type: 'enhancement',
        priority: 'high',
        icon: '✨',
        title: 'Optimize your multi-goal roadmap',
        description: 'Luna can help you prioritize and connect these goals intelligently',
        action: 'enhanceWithLuna',
        estimatedTime: '3-5 minutes'
      });
    }

    // Suggest budget planning if high-cost goals
    if (this.getTotalBudget() > 50000 && !this.hasCategory('financial')) {
      suggestions.push({
        type: 'financial',
        priority: 'high',
        icon: '💰',
        title: 'Add financial planning goal',
        description: `With €${this.getTotalBudget().toLocaleString()} in goals, a savings plan is crucial`,
        action: 'addFinancialGoal'
      });
    }

    // Suggest adding complementary goals
    if (this.goalBasket.length === 1) {
      const complementary = this.getComplementaryGoals();
      if (complementary.length > 0) {
        suggestions.push({
          type: 'complementary',
          priority: 'medium',
          icon: '💡',
          title: 'Consider adding these goals',
          goals: complementary.slice(0, 2),
          reason: 'They pair well with your current goal'
        });
      }
    }

    return suggestions;
  }

  getComplementaryGoals() {
    const current = this.goalBasket[0];
    if (!current) return [];

    const complementary = [];

    if (current.category === 'wedding') {
      complementary.push({ category: 'home', reason: 'Many couples buy a home after marriage' });
      complementary.push({ category: 'travel', reason: 'Perfect honeymoon planning' });
    }

    if (current.category === 'business') {
      complementary.push({ category: 'financial', reason: 'Financial foundation for business' });
    }

    if (current.category === 'home') {
      complementary.push({ category: 'financial', reason: 'Savings for down payment' });
    }

    return complementary;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════

  getTotalBudget() {
    return this.goalBasket.reduce((sum, g) => sum + (g.estimatedCost || 0), 0);
  }

  getTotalDuration() {
    // Get the longest duration in months (rough estimate)
    const durations = this.goalBasket.map(g => {
      const duration = g.duration || '';
      const match = duration.match(/(\d+)/);
      return match ? parseInt(match[0]) : 0;
    });
    return Math.max(...durations, 0);
  }

  getCategories() {
    const categories = {};
    this.goalBasket.forEach(g => {
      categories[g.category] = (categories[g.category] || 0) + 1;
    });
    return categories;
  }

  hasCategory(category) {
    return this.goalBasket.some(g => g.category === category);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // AUTO-SAVE & PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════

  autoSave() {
    try {
      const data = {
        goals: this.goalBasket,
        lastSaved: Date.now(),
        version: '1.0',
        stats: this.getStats()
      };

      localStorage.setItem('goalBasket', JSON.stringify(data));
      console.log('✅ Goal basket auto-saved to localStorage');

      return { success: true };
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
      return { success: false, error: error.message };
    }
  }

  loadBasket() {
    try {
      const saved = localStorage.getItem('goalBasket');
      if (saved) {
        const data = JSON.parse(saved);
        console.log('📦 Loaded goal basket from localStorage:', data.goals?.length || 0, 'goals');
        return data.goals || [];
      }
    } catch (error) {
      console.error('❌ Failed to load basket:', error);
    }

    return [];
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STATE CHANGE LISTENERS
  // ═══════════════════════════════════════════════════════════════════════

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    const state = {
      goals: this.getGoals(),
      stats: this.getStats(),
      suggestions: this.generateSuggestions()
    };

    this.listeners.forEach(listener => listener(state));
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ROADMAP CREATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Create final roadmap from goal basket
   */
  createRoadmap() {
    if (this.goalBasket.length === 0) {
      return { success: false, error: 'No goals in basket' };
    }

    // Convert goals to milestones format
    const milestones = this.goalBasket.map(goal => ({
      ...goal,
      // Ensure milestone format
      id: goal.id,
      title: goal.title,
      description: goal.description,
      icon: goal.icon,
      color: goal.color,
      category: goal.category,
      estimatedCost: goal.estimatedCost,
      budget_amount: 0, // Initialize with 0 (user will set this later in Budget Allocation)
      target_date: null, // No target date set yet
      duration: goal.duration,
      tasks: goal.tasks || [],
      aiGenerated: goal.source === 'template',
      completed: false,
      deepDiveData: goal.deepDiveData
    }));

    return {
      success: true,
      roadmap: {
        milestones,
        stats: this.getStats(),
        createdFrom: 'goalBuilder',
        createdAt: Date.now()
      }
    };
  }
}

export default GoalOrchestrator;
