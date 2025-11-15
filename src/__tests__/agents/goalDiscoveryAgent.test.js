/**
 * Goal Discovery Agent - Test Suite
 *
 * Tests the agent's ability to extract context from user messages
 */

import {
  analyzeMessage,
  determineNextQuestions,
  generateFollowUp,
  consolidateContext
} from '../../services/agents/goalDiscoveryAgent';

describe('Goal Discovery Agent', () => {
  describe('analyzeMessage()', () => {
    test('should extract budget hints from dollar amounts', () => {
      const message = "We're planning a wedding with a budget of $25,000";
      const context = analyzeMessage(message);

      expect(context.budgetHints).toHaveLength(1);
      expect(context.budgetHints[0].amount).toBe(25000);
      expect(context.budgetHints[0].type).toBe('dollar');
      expect(context.budgetHints[0].confidence).toBeGreaterThan(0);
    });

    test('should extract multiple budget formats', () => {
      const message = "We can save $500 per month and have $10,000 saved already";
      const context = analyzeMessage(message);

      expect(context.budgetHints.length).toBeGreaterThan(0);
      // Should find both $500 and $10,000
      const amounts = context.budgetHints.map(h => h.amount);
      expect(amounts).toContain(500);
      expect(amounts).toContain(10000);
    });

    test('should extract timeline hints', () => {
      const message = "We want to get married in 6 months";
      const context = analyzeMessage(message);

      expect(context.timelineHints.length).toBeGreaterThan(0);
      expect(context.timelineHints[0].text).toContain('6 months');
    });

    test('should extract seasonal timelines', () => {
      const message = "We're planning to buy a house by next summer";
      const context = analyzeMessage(message);

      expect(context.timelineHints.length).toBeGreaterThan(0);
      expect(context.timelineHints[0].unit).toBe('seasonal');
    });

    test('should detect location hints', () => {
      const message = "We're looking to buy a home in Austin";
      const context = analyzeMessage(message);

      expect(context.location).toBeTruthy();
      expect(context.location.text).toBe('Austin');
    });

    test('should extract preferences', () => {
      const message = "We want a modern, eco-friendly wedding";
      const context = analyzeMessage(message);

      expect(context.preferences.length).toBeGreaterThan(0);
      const preferenceValues = context.preferences.map(p => p.value);
      expect(preferenceValues).toContain('modern');
    });

    test('should detect constraints', () => {
      const message = "We have a tight budget and need to move quickly";
      const context = analyzeMessage(message);

      expect(context.constraints.length).toBeGreaterThan(0);
      const constraintTypes = context.constraints.map(c => c.type);
      expect(constraintTypes).toContain('budget_constraint');
      expect(constraintTypes).toContain('time_constraint');
    });

    test('should handle messages with no context', () => {
      const message = "Hello, I need help planning";
      const context = analyzeMessage(message);

      expect(context.budgetHints).toHaveLength(0);
      expect(context.timelineHints).toHaveLength(0);
      expect(context.preferences).toHaveLength(0);
    });
  });

  describe('determineNextQuestions()', () => {
    test('should ask for budget when missing', () => {
      const context = {
        budgetHints: [],
        timelineHints: [{ text: '6 months', confidence: 0.7 }],
        location: null,
        preferences: []
      };

      const result = determineNextQuestions(context, 'wedding');

      expect(result.isReady).toBe(false);
      expect(result.nextQuestion).toBeTruthy();
      expect(result.nextQuestion.type).toBe('budget');
    });

    test('should ask for timeline when missing', () => {
      const context = {
        budgetHints: [{ amount: 20000, confidence: 0.8 }],
        timelineHints: [],
        location: null,
        preferences: []
      };

      const result = determineNextQuestions(context, 'wedding');

      expect(result.nextQuestion.type).toBe('timeline');
    });

    test('should be ready with 50% info', () => {
      const context = {
        budgetHints: [{ amount: 20000, confidence: 0.8 }],
        timelineHints: [{ text: '6 months', confidence: 0.7 }],
        location: null,
        preferences: []
      };

      const result = determineNextQuestions(context, 'wedding');

      expect(result.readiness).toBeGreaterThanOrEqual(0.5);
      expect(result.isReady).toBe(true);
    });

    test('should not be ready with minimal info', () => {
      const context = {
        budgetHints: [],
        timelineHints: [],
        location: null,
        preferences: []
      };

      const result = determineNextQuestions(context, 'wedding');

      expect(result.isReady).toBe(false);
      expect(result.missingInfo.length).toBeGreaterThan(0);
    });
  });

  describe('consolidateContext()', () => {
    test('should consolidate budget from multiple messages', () => {
      const contexts = [
        {
          budgetHints: [{ amount: 20000, type: 'dollar', confidence: 0.7 }],
          timelineHints: [],
          location: null,
          preferences: [],
          constraints: []
        },
        {
          budgetHints: [{ amount: 25000, type: 'dollar', confidence: 0.9 }],
          timelineHints: [],
          location: null,
          preferences: [],
          constraints: []
        }
      ];

      const consolidated = consolidateContext(contexts);

      expect(consolidated.budget).toBeTruthy();
      // Should take highest confidence
      expect(consolidated.budget.amount).toBe(25000);
      expect(consolidated.budget.confidence).toBe(0.9);
    });

    test('should consolidate preferences without duplicates', () => {
      const contexts = [
        {
          budgetHints: [],
          timelineHints: [],
          location: null,
          preferences: [
            { category: 'style', value: 'modern', confidence: 0.7 },
            { category: 'style', value: 'elegant', confidence: 0.6 }
          ],
          constraints: []
        },
        {
          budgetHints: [],
          timelineHints: [],
          location: null,
          preferences: [
            { category: 'style', value: 'modern', confidence: 0.8 }
          ],
          constraints: []
        }
      ];

      const consolidated = consolidateContext(contexts);

      // Should deduplicate 'modern'
      const modernPrefs = consolidated.preferences.filter(p => p.value === 'modern');
      expect(modernPrefs).toHaveLength(1);
    });
  });

  describe('Integration Test - Full Conversation Flow', () => {
    test('should extract context and determine readiness', () => {
      // Simulate a conversation
      const messages = [
        "We want to plan a wedding",
        "Our budget is around $30,000 and we're saving $1000 per month",
        "We'd like to get married by next summer in California",
        "We prefer a rustic, outdoor vibe"
      ];

      const allContexts = messages.map(msg => analyzeMessage(msg));
      const consolidated = consolidateContext(allContexts);

      // Should have extracted all key info
      expect(consolidated.budget).toBeTruthy();
      expect(consolidated.budget.amount).toBe(30000);

      expect(consolidated.timeline).toBeTruthy();
      expect(consolidated.timeline.text).toContain('summer');

      expect(consolidated.location).toBeTruthy();
      expect(consolidated.location.text).toBe('California');

      expect(consolidated.preferences.length).toBeGreaterThan(0);

      // Should be ready to proceed
      const readiness = determineNextQuestions(consolidated, 'wedding');
      expect(readiness.isReady).toBe(true);
    });
  });
});
