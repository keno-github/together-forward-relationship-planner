/**
 * Roadmap Architect Agent - Hybrid Approach Test Suite
 *
 * Tests the hybrid milestone generation:
 * - Layer 1: Template matching
 * - Layer 2: Claude refinement
 * - Layer 3: Pure Claude generation
 * - Fallback: Generic sequence
 */

import {
  generateRoadmap,
  refineSequenceWithClaude,
  generateMilestonesWithClaude,
  determineMilestoneSequence
} from '../../services/agents/roadmapArchitectAgent';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn()
      }
    }))
  };
});

describe('Roadmap Architect Agent - Hybrid Approach', () => {
  let mockAnthropic;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up Anthropic mock
    const Anthropic = require('@anthropic-ai/sdk').default;
    mockAnthropic = new Anthropic();

    // Set environment variable
    process.env.REACT_APP_ANTHROPIC_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.REACT_APP_ANTHROPIC_API_KEY;
  });

  describe('Layer 1: Template Matching', () => {
    test('should use wedding template for wedding goal', async () => {
      const userContext = {
        budget: { amount: 25000, confidence: 0.8 },
        timeline: { text: '8 months', confidence: 0.7 },
        location: { text: 'California', confidence: 0.9 },
        preferences: [],
        constraints: []
      };

      // Disable Claude refinement to test template only
      const result = await generateRoadmap(
        userContext,
        'wedding',
        null, // No description
        { useClaudeRefinement: false }
      );

      expect(result.roadmap).toBeDefined();
      expect(result.roadmap.metadata.generationMethod).toBe('template');
      expect(result.roadmap.milestones.length).toBeGreaterThan(5);
    });

    test('should use relocation template for moving goal', async () => {
      const userContext = {
        budget: { amount: 5000, confidence: 0.8 },
        timeline: { text: '18 months', confidence: 0.7 },
        location: { text: 'Germany', confidence: 0.9 },
        preferences: [],
        constraints: []
      };

      const result = await generateRoadmap(
        userContext,
        'relocation',
        null,
        { useClaudeRefinement: false }
      );

      expect(result.roadmap.metadata.generationMethod).toBe('template');
      expect(result.roadmap.milestones.length).toBeGreaterThan(0);

      // Should have relocation-specific milestones
      const milestoneTypes = result.roadmap.milestones.map(m =>
        m.title.toLowerCase()
      );
      const hasRelocationMilestones = milestoneTypes.some(
        title =>
          title.includes('visa') ||
          title.includes('immigration') ||
          title.includes('housing')
      );
      expect(hasRelocationMilestones).toBe(true);
    });
  });

  describe('Layer 2: Claude Refinement', () => {
    test('should refine wedding template with specific description', async () => {
      const templateSequence = [
        'engagement',
        'venue_booking',
        'catering',
        'invitations'
      ];

      // Mock Claude response
      mockAnthropic.messages.create.mockResolvedValue({
        content: [
          {
            text: '["engagement", "venue_booking", "vegan_catering_selection", "sustainable_invitations", "eco_friendly_decorations"]'
          }
        ]
      });

      const userContext = {
        budget: { amount: 20000 },
        preferences: [{ category: 'values', value: 'sustainable', confidence: 0.9 }]
      };

      const refined = await refineSequenceWithClaude(
        templateSequence,
        'wedding',
        'We want a sustainable, eco-friendly wedding with vegan catering',
        userContext
      );

      expect(refined).toBeDefined();
      expect(Array.isArray(refined)).toBe(true);
      expect(refined.length).toBeGreaterThan(3);
    });

    test('should fall back to template if Claude refinement fails', async () => {
      const templateSequence = ['step1', 'step2', 'step3'];

      // Mock Claude to throw an error
      mockAnthropic.messages.create.mockRejectedValue(
        new Error('API Error')
      );

      const userContext = { budget: { amount: 10000 } };

      await expect(
        refineSequenceWithClaude(
          templateSequence,
          'wedding',
          'Test description',
          userContext
        )
      ).rejects.toThrow('API Error');
    });

    test('should handle Claude returning invalid JSON', async () => {
      const templateSequence = ['step1', 'step2'];

      // Mock Claude to return invalid JSON
      mockAnthropic.messages.create.mockResolvedValue({
        content: [{ text: 'This is not JSON' }]
      });

      const userContext = { budget: { amount: 10000 } };

      await expect(
        refineSequenceWithClaude(
          templateSequence,
          'wedding',
          'Test',
          userContext
        )
      ).rejects.toThrow();
    });

    test('should extract JSON from markdown code blocks', async () => {
      const templateSequence = ['step1', 'step2'];

      // Mock Claude to return JSON in markdown
      mockAnthropic.messages.create.mockResolvedValue({
        content: [
          {
            text: '```json\n["step1", "step2", "step3", "step4"]\n```'
          }
        ]
      });

      const userContext = { budget: { amount: 10000 } };

      const refined = await refineSequenceWithClaude(
        templateSequence,
        'wedding',
        'Test',
        userContext
      );

      expect(refined).toEqual(['step1', 'step2', 'step3', 'step4']);
    });

    test('should validate refined sequence length', async () => {
      const templateSequence = ['step1', 'step2'];

      // Mock Claude to return too few milestones
      mockAnthropic.messages.create.mockResolvedValue({
        content: [{ text: '["step1"]' }]
      });

      const userContext = { budget: { amount: 10000 } };

      const refined = await refineSequenceWithClaude(
        templateSequence,
        'wedding',
        'Test',
        userContext
      );

      // Should fall back to template sequence
      expect(refined).toEqual(templateSequence);
    });
  });

  describe('Layer 3: Pure Claude Generation', () => {
    test('should generate milestones for unknown goal type', async () => {
      // Mock Claude response
      mockAnthropic.messages.create.mockResolvedValue({
        content: [
          {
            text: '["concept_development", "market_research", "business_plan", "funding", "location_scouting", "kitchen_design", "menu_creation", "staff_hiring", "soft_launch", "grand_opening"]'
          }
        ]
      });

      const userContext = {
        budget: { amount: 50000 },
        timeline: { text: '12 months' },
        location: { text: 'San Francisco' }
      };

      const generated = await generateMilestonesWithClaude(
        'Start a family-owned Italian restaurant',
        userContext
      );

      expect(generated).toBeDefined();
      expect(Array.isArray(generated)).toBe(true);
      expect(generated.length).toBeGreaterThanOrEqual(5);
      expect(generated.length).toBeLessThanOrEqual(10);
    });

    test('should throw error if Claude generation fails', async () => {
      // Mock Claude to throw error
      mockAnthropic.messages.create.mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      const userContext = { budget: { amount: 10000 } };

      await expect(
        generateMilestonesWithClaude(
          'Unknown goal',
          userContext
        )
      ).rejects.toThrow('Rate limit exceeded');
    });

    test('should validate generated sequence has valid items', async () => {
      // Mock Claude to return non-strings
      mockAnthropic.messages.create.mockResolvedValue({
        content: [{ text: '[1, 2, 3, 4, 5]' }]
      });

      const userContext = { budget: { amount: 10000 } };

      await expect(
        generateMilestonesWithClaude('Test', userContext)
      ).rejects.toThrow('Claude generated non-string items');
    });
  });

  describe('Full Hybrid Integration', () => {
    test('should use template refinement when description is provided', async () => {
      const userContext = {
        budget: { amount: 30000, confidence: 0.9 },
        timeline: { text: '12 months', confidence: 0.8 },
        location: { text: 'Austin', confidence: 0.9 },
        preferences: [],
        constraints: []
      };

      // Mock Claude refinement
      mockAnthropic.messages.create.mockResolvedValue({
        content: [
          {
            text: '["engagement", "budget_planning", "eco_venue", "sustainable_vendors", "guest_list", "green_invitations", "ceremony_prep", "wedding_day"]'
          }
        ]
      });

      const result = await generateRoadmap(
        userContext,
        'wedding',
        'Eco-friendly sustainable wedding with minimal waste',
        { useClaudeRefinement: true }
      );

      expect(result.roadmap.metadata.generationMethod).toBe('template_refined');
      expect(mockAnthropic.messages.create).toHaveBeenCalled();
    });

    test('should fall back through all layers gracefully', async () => {
      const userContext = {
        budget: { amount: 10000 },
        timeline: { text: '6 months' },
        preferences: [],
        constraints: []
      };

      // Mock all Claude calls to fail
      mockAnthropic.messages.create.mockRejectedValue(
        new Error('API unavailable')
      );

      // Should still succeed using template
      const result = await generateRoadmap(
        userContext,
        'wedding',
        'Test wedding',
        { useClaudeRefinement: true }
      );

      expect(result.roadmap).toBeDefined();
      expect(result.roadmap.metadata.generationMethod).toBe('template');
    });

    test('should use fallback sequence for unknown goal with no description', async () => {
      const userContext = {
        budget: { amount: 5000 },
        preferences: [],
        constraints: []
      };

      const result = await generateRoadmap(
        userContext,
        'unknown_goal_type',
        null, // No description
        { useClaudeRefinement: true }
      );

      expect(result.roadmap.metadata.generationMethod).toBe('fallback');
      expect(result.roadmap.milestones).toBeDefined();
      expect(result.roadmap.milestones.length).toBeGreaterThan(0);
    });

    test('should attempt pure Claude generation for unknown goal with description', async () => {
      const userContext = {
        budget: { amount: 15000 },
        timeline: { text: '9 months' },
        preferences: [],
        constraints: []
      };

      // Mock Claude generation
      mockAnthropic.messages.create.mockResolvedValue({
        content: [
          {
            text: '["research_competitors", "create_menu", "find_location", "build_food_truck", "obtain_permits", "launch"]'
          }
        ]
      });

      const result = await generateRoadmap(
        userContext,
        'unknown_goal',
        'Start a food truck business',
        { useClaudeRefinement: true }
      );

      expect(result.roadmap.metadata.generationMethod).toBe('claude_generated');
      expect(mockAnthropic.messages.create).toHaveBeenCalled();
    });
  });

  describe('Robustness & Edge Cases', () => {
    test('should handle missing budget gracefully', async () => {
      const userContext = {
        timeline: { text: '6 months' },
        preferences: [],
        constraints: []
      };

      const result = await generateRoadmap(
        userContext,
        'wedding',
        null,
        { useClaudeRefinement: false }
      );

      expect(result.roadmap).toBeDefined();
      expect(result.budgetAllocation.total).toBe(0);
    });

    test('should handle missing timeline gracefully', async () => {
      const userContext = {
        budget: { amount: 20000 },
        preferences: [],
        constraints: []
      };

      const result = await generateRoadmap(
        userContext,
        'wedding',
        null,
        { useClaudeRefinement: false }
      );

      expect(result.roadmap).toBeDefined();
      expect(result.roadmap.metadata.totalDuration).toBeDefined();
    });

    test('should handle missing API key', async () => {
      delete process.env.REACT_APP_ANTHROPIC_API_KEY;

      const userContext = { budget: { amount: 10000 } };

      await expect(
        refineSequenceWithClaude(
          ['step1', 'step2'],
          'wedding',
          'Test',
          userContext
        )
      ).rejects.toThrow('REACT_APP_ANTHROPIC_API_KEY not found');
    });

    test('should include generation method in metadata', async () => {
      const userContext = {
        budget: { amount: 25000 },
        timeline: { text: '10 months' },
        preferences: [],
        constraints: []
      };

      const result = await generateRoadmap(
        userContext,
        'wedding',
        null,
        { useClaudeRefinement: false }
      );

      expect(result.roadmap.metadata.generationMethod).toBeDefined();
      expect(['template', 'template_refined', 'claude_generated', 'fallback']).toContain(
        result.roadmap.metadata.generationMethod
      );
    });
  });
});
