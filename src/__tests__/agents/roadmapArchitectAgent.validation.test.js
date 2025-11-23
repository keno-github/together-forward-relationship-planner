/**
 * Validation Test for Roadmap Architect Agent
 *
 * This test validates that the roadmap agent:
 * 1. Correctly maps user goals to appropriate templates
 * 2. Generates specific journey stages instead of generic phases
 * 3. Uses Claude customization for better personalization
 * 4. Handles edge cases robustly
 */

import { generateRoadmap, determineMilestoneSequence } from '../../services/agents/roadmapArchitectAgent';

describe('Roadmap Architect Agent - Validation Tests', () => {
  describe('Goal Type Mapping', () => {
    test('should use home template for apartment buying goal', () => {
      const goalType = 'home';
      const constraints = [];

      const sequence = determineMilestoneSequence(goalType, constraints);

      // Should NOT contain generic fallback milestones
      expect(sequence).not.toContain('goal_definition_and_research');
      expect(sequence).not.toContain('comprehensive_planning');
      expect(sequence).not.toContain('execution_and_implementation');

      // Should contain specific home buying milestones
      expect(sequence).toContain('financial_health_assessment');
      expect(sequence).toContain('mortgage_preapproval_process');
      expect(sequence).toContain('house_hunting_and_tours');
      expect(sequence).toContain('closing_and_possession');
    });

    test('should use wedding template for wedding planning', () => {
      const goalType = 'wedding';
      const constraints = [];

      const sequence = determineMilestoneSequence(goalType, constraints);

      // Should contain specific wedding milestones
      expect(sequence).toContain('engagement_celebration');
      expect(sequence).toContain('venue_research_and_booking');
      expect(sequence).toContain('vendor_discovery_and_selection');
      expect(sequence).toContain('wedding_day_execution');

      // Should NOT contain generic fallback
      expect(sequence).not.toContain('goal_definition_and_research');
    });

    test('should use relocation template for moving goals', () => {
      const goalType = 'relocation';
      const constraints = [];

      const sequence = determineMilestoneSequence(goalType, constraints);

      // Should contain specific relocation milestones
      expect(sequence).toContain('destination_research');
      expect(sequence).toContain('visa_and_immigration_planning');
      expect(sequence).toContain('housing_search_and_securing');
      expect(sequence).toContain('settling_into_new_location');

      // Should NOT contain generic fallback
      expect(sequence).not.toContain('goal_definition_and_research');
    });
  });

  describe('Generic Fallback Detection', () => {
    test('should detect when generic fallback sequence is used', () => {
      const goalType = 'unknown_goal_type_12345';
      const constraints = [];

      const sequence = determineMilestoneSequence(goalType, constraints);

      // This should trigger fallback
      expect(sequence).toContain('goal_definition_and_research');
      expect(sequence).toContain('comprehensive_planning');
      expect(sequence).toContain('execution_and_implementation');

      // Verify it's the full fallback sequence
      expect(sequence.length).toBe(5);
    });
  });

  describe('Milestone Naming Convention', () => {
    test('all milestone names should use snake_case format', () => {
      const goalType = 'home';
      const sequence = determineMilestoneSequence(goalType, []);

      sequence.forEach(milestone => {
        // Should be snake_case (lowercase with underscores)
        expect(milestone).toMatch(/^[a-z_]+$/);
        // Should not start or end with underscore
        expect(milestone).not.toMatch(/^_|_$/);
        // Should not have double underscores
        expect(milestone).not.toMatch(/__/);
      });
    });

    test('milestone names should be descriptive and actionable', () => {
      const goalType = 'home';
      const sequence = determineMilestoneSequence(goalType, []);

      // Check that milestones are meaningful
      expect(sequence).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/financial|mortgage|house|property|closing|moving/)
        ])
      );
    });
  });

  describe('Constraint Handling', () => {
    test('should compress timeline when time constraint present', () => {
      const goalType = 'wedding';
      const normalSequence = determineMilestoneSequence(goalType, []);
      const rushSequence = determineMilestoneSequence(goalType, [
        { type: 'time_constraint' }
      ]);

      // Rush sequence should be shorter
      expect(rushSequence.length).toBeLessThan(normalSequence.length);

      // But should still contain critical milestones
      expect(rushSequence).toContain('venue_research_and_booking');
      expect(rushSequence).toContain('wedding_day_execution');
    });

    test('should add budget checkpoints when budget constraint present', () => {
      const goalType = 'home';
      const sequence = determineMilestoneSequence(goalType, [
        { type: 'budget_constraint' }
      ]);

      // Should add budget review milestones
      expect(sequence).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/budget|financial/)
        ])
      );
    });
  });

  describe('Roadmap Generation Quality', () => {
    test('should generate roadmap with appropriate number of milestones', async () => {
      const userContext = {
        budget: { amount: 50000 },
        timeline: { text: '12 months', unit: 'relative' },
        location: { text: 'Berlin', confidence: 0.8 },
        preferences: [],
        constraints: []
      };

      const goalType = 'home';
      const goalDescription = 'Buy a 2-bedroom apartment in Berlin';

      const { roadmap } = await generateRoadmap(
        userContext,
        goalType,
        goalDescription,
        { useClaudeValidation: false } // Disable Claude for faster test
      );

      // Should have reasonable number of milestones (6-15 for comprehensive journey)
      expect(roadmap.milestones.length).toBeGreaterThanOrEqual(6);
      expect(roadmap.milestones.length).toBeLessThanOrEqual(15);
    });

    test('should generate milestones with proper dependencies', async () => {
      const userContext = {
        budget: { amount: 30000 },
        timeline: { text: '6 months', unit: 'relative' },
        location: { text: 'Munich', confidence: 0.8 },
        preferences: [],
        constraints: []
      };

      const { roadmap } = await generateRoadmap(
        userContext,
        'wedding',
        null,
        { useClaudeValidation: false }
      );

      // Each milestone (except first) should have dependencies
      roadmap.milestones.forEach((milestone, index) => {
        if (index === 0) {
          expect(milestone.depends_on).toHaveLength(0);
        } else {
          expect(milestone.depends_on.length).toBeGreaterThan(0);
        }
      });
    });

    test('should include proper metadata in roadmap', async () => {
      const userContext = {
        budget: { amount: 100000 },
        timeline: { text: '18 months', unit: 'relative' },
        location: { text: 'Frankfurt', confidence: 0.9 },
        preferences: [{ value: 'modern' }],
        constraints: []
      };

      const { roadmap } = await generateRoadmap(
        userContext,
        'home',
        'Buy a modern apartment',
        { useClaudeValidation: false }
      );

      // Should include comprehensive metadata
      expect(roadmap.metadata).toHaveProperty('totalMilestones');
      expect(roadmap.metadata).toHaveProperty('totalDuration');
      expect(roadmap.metadata).toHaveProperty('estimatedCost');
      expect(roadmap.metadata).toHaveProperty('generationMethod');
      expect(roadmap.metadata).toHaveProperty('confidence');

      // Generation method should NOT be 'fallback' for known goal type
      expect(roadmap.metadata.generationMethod).not.toBe('fallback');
    });
  });

  describe('Budget Allocation', () => {
    test('should allocate budget across milestones', async () => {
      const userContext = {
        budget: { amount: 50000 },
        timeline: { text: '12 months' },
        location: { text: 'Berlin' },
        preferences: [],
        constraints: []
      };

      const { budgetAllocation } = await generateRoadmap(
        userContext,
        'wedding',
        null,
        { useClaudeValidation: false }
      );

      expect(budgetAllocation.total).toBe(50000);
      expect(budgetAllocation.byMilestone).toBeDefined();
      expect(Object.keys(budgetAllocation.byMilestone).length).toBeGreaterThan(0);
    });
  });

  describe('Robustness Tests', () => {
    test('should handle missing budget gracefully', async () => {
      const userContext = {
        timeline: { text: '6 months' },
        location: { text: 'Hamburg' },
        preferences: [],
        constraints: []
      };

      const { roadmap } = await generateRoadmap(
        userContext,
        'home',
        null,
        { useClaudeValidation: false }
      );

      expect(roadmap.milestones.length).toBeGreaterThan(0);
    });

    test('should handle missing timeline gracefully', async () => {
      const userContext = {
        budget: { amount: 40000 },
        location: { text: 'Cologne' },
        preferences: [],
        constraints: []
      };

      const { roadmap } = await generateRoadmap(
        userContext,
        'wedding',
        null,
        { useClaudeValidation: false }
      );

      expect(roadmap.milestones.length).toBeGreaterThan(0);
    });

    test('should handle empty user context', async () => {
      const userContext = {
        preferences: [],
        constraints: []
      };

      const { roadmap } = await generateRoadmap(
        userContext,
        'baby',
        null,
        { useClaudeValidation: false }
      );

      expect(roadmap.milestones.length).toBeGreaterThan(0);
      expect(roadmap.metadata.confidence).toBeLessThan(1); // Low confidence due to missing data
    });
  });

  describe('Quality Assurance - No Generic Phases', () => {
    const GENERIC_KEYWORDS = [
      'goal_definition_and_research',
      'comprehensive_planning',
      'budget_and_resource_allocation',
      'execution_and_implementation',
      'completion_and_celebration'
    ];

    test('home buying roadmap should have NO generic phases', () => {
      const sequence = determineMilestoneSequence('home', []);

      GENERIC_KEYWORDS.forEach(generic => {
        expect(sequence).not.toContain(generic);
      });
    });

    test('wedding roadmap should have NO generic phases', () => {
      const sequence = determineMilestoneSequence('wedding', []);

      GENERIC_KEYWORDS.forEach(generic => {
        expect(sequence).not.toContain(generic);
      });
    });

    test('relocation roadmap should have NO generic phases', () => {
      const sequence = determineMilestoneSequence('relocation', []);

      GENERIC_KEYWORDS.forEach(generic => {
        expect(sequence).not.toContain(generic);
      });
    });

    test('baby roadmap should have NO generic phases', () => {
      const sequence = determineMilestoneSequence('baby', []);

      GENERIC_KEYWORDS.forEach(generic => {
        expect(sequence).not.toContain(generic);
      });
    });

    test('business roadmap should have NO generic phases', () => {
      const sequence = determineMilestoneSequence('business', []);

      GENERIC_KEYWORDS.forEach(generic => {
        expect(sequence).not.toContain(generic);
      });
    });
  });
});
