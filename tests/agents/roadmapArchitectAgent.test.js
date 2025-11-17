/**
 * Roadmap Architect Agent - Test Suite
 *
 * Tests the agent's ability to generate comprehensive roadmaps
 * for any goal type with intelligent context adaptation
 */

import {
  generateRoadmap,
  adaptRoadmap,
  determineMilestoneSequence,
  allocateBudget
} from '../../src/services/agents/roadmapArchitectAgent';

describe('Roadmap Architect Agent', () => {
  describe('determineMilestoneSequence()', () => {
    test('should generate wedding milestone sequence', () => {
      const sequence = determineMilestoneSequence('wedding', []);

      expect(sequence).toContain('venue_booking');
      expect(sequence).toContain('vendor_selection');
      expect(sequence).toContain('wedding_day');
      expect(sequence[sequence.length - 1]).toBe('wedding_day');
    });

    test('should generate home buying milestone sequence', () => {
      const sequence = determineMilestoneSequence('home', []);

      expect(sequence).toContain('mortgage_preapproval');
      expect(sequence).toContain('house_hunting');
      expect(sequence).toContain('closing_preparations');
    });

    test('should adjust sequence for time constraints', () => {
      const constraints = [{ type: 'time_constraint', severity: 'high' }];
      const sequence = determineMilestoneSequence('wedding', constraints);

      // Should have fewer milestones for rushed timeline
      const normalSequence = determineMilestoneSequence('wedding', []);
      expect(sequence.length).toBeLessThan(normalSequence.length);
    });

    test('should add budget review for budget constraints', () => {
      const constraints = [{ type: 'budget_constraint', severity: 'high' }];
      const sequence = determineMilestoneSequence('wedding', constraints);

      expect(sequence).toContain('budget_review');
    });

    test('should provide generic sequence for unknown goal types', () => {
      const sequence = determineMilestoneSequence('custom_goal', []);

      expect(sequence).toContain('research');
      expect(sequence).toContain('planning');
      expect(sequence).toContain('execution');
      expect(sequence).toContain('completion');
    });
  });

  describe('allocateBudget()', () => {
    test('should allocate budget across milestones', () => {
      const milestones = [
        { title: 'Venue Booking' },
        { title: 'Catering Selection' },
        { title: 'Photography' }
      ];

      const result = allocateBudget(milestones, 30000);

      expect(result.total).toBe(30000);
      expect(result.byMilestone['Venue Booking']).toBeDefined();
      expect(result.byMilestone['Venue Booking'].amount).toBeGreaterThan(0);
      expect(result.byMilestone['Venue Booking'].percentage).toBeDefined();
    });

    test('should allocate higher percentage to venue', () => {
      const milestones = [
        { title: 'Venue Booking' },
        { title: 'Invitations' }
      ];

      const result = allocateBudget(milestones, 30000);

      // Venue should get more than invitations
      expect(result.byMilestone['Venue Booking'].amount)
        .toBeGreaterThan(result.byMilestone['Invitations'].amount);
    });

    test('should handle no budget', () => {
      const milestones = [{ title: 'Planning' }];
      const result = allocateBudget(milestones, null);

      expect(result.total).toBe(0);
      expect(result.message).toContain('No budget specified');
    });
  });

  describe('generateRoadmap()', () => {
    test('should generate complete wedding roadmap', async () => {
      const userContext = {
        budget: { amount: 25000, confidence: 0.8 },
        timeline: { text: '8 months', confidence: 0.7 },
        location: { text: 'California', confidence: 0.9 },
        preferences: [
          { category: 'style', value: 'rustic', confidence: 0.8 },
          { category: 'vibe', value: 'outdoor', confidence: 0.9 }
        ],
        constraints: []
      };

      const result = await generateRoadmap(userContext, 'wedding');

      expect(result.roadmap).toBeDefined();
      expect(result.roadmap.milestones).toBeDefined();
      expect(result.roadmap.milestones.length).toBeGreaterThan(5);
      expect(result.roadmap.metadata.totalMilestones).toBe(result.roadmap.milestones.length);
      expect(result.roadmap.metadata.location).toBe('California');
      expect(result.roadmap.metadata.createdWith).toBe('Roadmap Architect Agent');
    });

    test('should include budget allocation', async () => {
      const userContext = {
        budget: { amount: 30000, confidence: 0.8 },
        timeline: { text: '6 months', confidence: 0.7 },
        location: null,
        preferences: [],
        constraints: []
      };

      const result = await generateRoadmap(userContext, 'wedding');

      expect(result.budgetAllocation).toBeDefined();
      expect(result.budgetAllocation.total).toBe(30000);
      expect(result.budgetAllocation.byMilestone).toBeDefined();
    });

    test('should add dependencies to milestones', async () => {
      const userContext = {
        budget: { amount: 20000, confidence: 0.8 },
        timeline: { text: '12 months', confidence: 0.7 },
        location: null,
        preferences: [],
        constraints: []
      };

      const result = await generateRoadmap(userContext, 'home');

      const milestones = result.roadmap.milestones;

      // First milestone should have no dependencies
      expect(milestones[0].depends_on).toHaveLength(0);

      // Later milestones should depend on previous ones
      if (milestones.length > 1) {
        expect(milestones[1].depends_on.length).toBeGreaterThan(0);
      }
    });

    test('should calculate confidence score', async () => {
      const fullContext = {
        budget: { amount: 30000, confidence: 0.8 },
        timeline: { text: '8 months', confidence: 0.7 },
        location: { text: 'Austin', confidence: 0.9 },
        preferences: [{ category: 'style', value: 'modern', confidence: 0.8 }],
        constraints: []
      };

      const result = await generateRoadmap(fullContext, 'wedding');

      expect(result.roadmap.metadata.confidence).toBeDefined();
      expect(result.roadmap.metadata.confidence).toBeGreaterThan(0.7);
    });

    test('should handle minimal context', async () => {
      const minimalContext = {
        budget: null,
        timeline: null,
        location: null,
        preferences: [],
        constraints: []
      };

      const result = await generateRoadmap(minimalContext, 'wedding');

      expect(result.roadmap.milestones).toBeDefined();
      expect(result.roadmap.milestones.length).toBeGreaterThan(0);
      expect(result.roadmap.metadata.confidence).toBeLessThan(0.5);
    });

    test('should assign tasks to partners', async () => {
      const userContext = {
        budget: { amount: 25000, confidence: 0.8 },
        timeline: { text: '6 months', confidence: 0.7 },
        location: null,
        preferences: [],
        constraints: []
      };

      const result = await generateRoadmap(userContext, 'wedding');

      const milestonesWithTasks = result.roadmap.milestones.filter(m => m.tasks && m.tasks.length > 0);

      if (milestonesWithTasks.length > 0) {
        const firstTask = milestonesWithTasks[0].tasks[0];
        expect(firstTask.suggested_assignee).toBeDefined();
        expect(['partner_a', 'partner_b']).toContain(firstTask.suggested_assignee);
      }
    });
  });

  describe('adaptRoadmap()', () => {
    test('should adapt budget allocation', () => {
      const originalRoadmap = {
        milestones: [
          { title: 'Venue Booking' },
          { title: 'Catering' }
        ],
        metadata: { location: 'Austin' }
      };

      const changes = { budget: 35000 };
      const adapted = adaptRoadmap(originalRoadmap, changes);

      expect(adapted.budgetAllocation).toBeDefined();
      expect(adapted.budgetAllocation.total).toBe(35000);
    });

    test('should adapt timeline constraints', () => {
      const originalRoadmap = {
        milestones: [
          { title: 'Planning', estimated_duration: '2-4 weeks' },
          { title: 'Execution', estimated_duration: '3-6 weeks' }
        ],
        metadata: {}
      };

      const changes = {
        timeline: '3 months',
        constraints: [{ type: 'time_constraint', severity: 'high' }]
      };

      const adapted = adaptRoadmap(originalRoadmap, changes);

      // Durations should be adjusted (shortened)
      expect(adapted.milestones[0].estimated_duration).toBeDefined();
    });

    test('should update location metadata', () => {
      const originalRoadmap = {
        milestones: [],
        metadata: { location: 'Austin' }
      };

      const changes = { location: 'San Francisco' };
      const adapted = adaptRoadmap(originalRoadmap, changes);

      expect(adapted.metadata.location).toBe('San Francisco');
    });
  });

  describe('Integration Test - Full Roadmap Generation Flow', () => {
    test('should generate roadmap from discovery context', async () => {
      // Simulate output from Goal Discovery Agent
      const discoveryContext = {
        budget: { amount: 30000, confidence: 0.8 },
        timeline: { text: 'next summer', unit: 'seasonal', confidence: 0.7 },
        location: { text: 'California', confidence: 0.9 },
        preferences: [
          { category: 'style', value: 'rustic', confidence: 0.8 },
          { category: 'vibe', value: 'outdoor', confidence: 0.9 },
          { category: 'size', value: 'intimate', confidence: 0.7 }
        ],
        constraints: []
      };

      const result = await generateRoadmap(discoveryContext, 'wedding');

      // Should have comprehensive roadmap
      expect(result.roadmap.milestones.length).toBeGreaterThanOrEqual(7);

      // Should have budget allocation
      expect(result.budgetAllocation.total).toBe(30000);

      // Should have location in metadata
      expect(result.roadmap.metadata.location).toBe('California');

      // Should have high confidence
      expect(result.roadmap.metadata.confidence).toBeGreaterThan(0.8);

      // Milestones should have dependencies
      const milestonesWithDeps = result.roadmap.milestones.filter(m => m.depends_on && m.depends_on.length > 0);
      expect(milestonesWithDeps.length).toBeGreaterThan(0);

      // Should have duration estimates
      const milestonesWithDuration = result.roadmap.milestones.filter(m => m.estimated_duration);
      expect(milestonesWithDuration.length).toBeGreaterThan(0);
    });
  });
});
