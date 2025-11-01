/**
 * Compatibility Scoring Utility
 * Calculates alignment scores and generates insights
 */

export const calculateCompatibilityScore = (partner1Answers, partner2Answers, questions) => {
  let totalQuestions = questions.length;
  let matchedQuestions = 0;
  let categoryMatches = {
    timeline: { matched: 0, total: 0 },
    financial: { matched: 0, total: 0 },
    lifestyle: { matched: 0, total: 0 },
    communication: { matched: 0, total: 0 }
  };

  const strongAlignments = [];
  const misalignments = [];

  questions.forEach(question => {
    const p1Answer = partner1Answers[question.id];
    const p2Answer = partner2Answers[question.id];

    // Get answer labels
    const p1Option = question.options.find(opt => opt.value === p1Answer);
    const p2Option = question.options.find(opt => opt.value === p2Answer);

    if (!p1Option || !p2Option) return;

    // Calculate weight difference (smaller difference = better alignment)
    const weightDiff = Math.abs(p1Option.weight - p2Option.weight);
    const maxWeightDiff = question.options.length - 1;

    // Score this question (0 = no match, 1 = perfect match)
    const questionScore = 1 - (weightDiff / maxWeightDiff);

    // Update category scores
    const category = question.category;
    if (categoryMatches[category]) {
      categoryMatches[category].total++;
      categoryMatches[category].matched += questionScore;
    }

    // Update total score
    if (questionScore >= 0.75) {
      matchedQuestions += 1;
    } else if (questionScore >= 0.5) {
      matchedQuestions += 0.5;
    }

    // Categorize as strong alignment or misalignment
    if (p1Answer === p2Answer) {
      strongAlignments.push({
        question: question.question,
        answer: p1Option.label,
        insight: getAlignmentInsight(question, p1Option)
      });
    } else if (questionScore < 0.5) {
      misalignments.push({
        question: question.question,
        partner1Answer: p1Option.label,
        partner2Answer: p2Option.label,
        severity: questionScore < 0.25 ? 'high' : 'medium',
        discussionPrompt: getDiscussionPrompt(question, p1Option, p2Option)
      });
    }
  });

  // Calculate overall alignment percentage
  const alignmentScore = Math.round((matchedQuestions / totalQuestions) * 100);

  // Calculate category percentages
  const categoryScores = {};
  Object.keys(categoryMatches).forEach(category => {
    const { matched, total } = categoryMatches[category];
    if (total > 0) {
      categoryScores[category] = Math.round((matched / total) * 100);
    }
  });

  return {
    alignmentScore,
    categoryScores,
    strongAlignments,
    misalignments,
    totalQuestions,
    matchedQuestions
  };
};

// Generate insight for strong alignments
const getAlignmentInsight = (question, option) => {
  const insights = {
    // Marriage timeline
    'within_1_year': "You're both ready to take the leap soon - that's exciting!",
    '1_2_years': "You're aligned on a near-future timeline - great for planning together!",
    '3_5_years': "You both prefer a longer timeline - this gives you time to prepare financially and emotionally.",
    'no_timeline': "You're both flexible about timing - communication will be key as life unfolds.",

    // Home ownership
    'essential': "You both prioritize homeownership - this shared goal will guide your financial planning.",
    'important': "You both value owning a home - flexibility on timing gives you breathing room.",
    'not_important': "You're both comfortable renting - this frees up resources for other priorities.",

    // Kids timing
    'ready_now': "You're both ready for parenthood now - that's beautiful alignment!",
    '2_3_years': "You're aligned on starting a family soon - great for near-term planning.",
    '5_plus_years': "You both want kids eventually - this timeline allows for other goals first.",
    'not_interested': "You're both childfree - this is an important alignment for your future.",

    // Savings style
    'aggressive': "You're both serious savers - you'll build financial security quickly together.",
    'balanced': "You both balance saving and enjoying - a healthy middle ground!",
    'yolo': "You both prioritize experiences now - just watch your emergency fund!",

    // Default
    'default': "Great alignment! You see this the same way."
  };

  return insights[option.value] || insights['default'];
};

// Generate discussion prompts for misalignments
const getDiscussionPrompt = (question, p1Option, p2Option) => {
  const prompts = {
    1: `"When do we each see marriage happening, and why? What would help us both feel ready?"`,
    2: `"How important is owning vs. renting to each of us? What are the trade-offs we're each considering?"`,
    3: `"What's driving our different timelines for kids? Are there concerns or goals we need to share?"`,
    4: `"What are our top priorities right now, and how can we support each other's different focuses?"`,
    5: `"How do our saving styles affect our relationship? Can we find a compromise that honors both approaches?"`,
    6: `"What does 'value' mean to each of us when it comes to big purchases? How can we find common ground?"`,
    7: `"How do we want to manage money together? What makes each of us feel secure and respected?"`,
    8: `"How can we balance one person's need for adventure with the other's need for stability?"`,
    9: `"Where do we each see ourselves living long-term? Is there flexibility, or is this a dealbreaker?"`,
    10: `"How do we currently handle conflict? What would make difficult conversations easier for both of us?"`
  };

  return prompts[question.id] || `"Let's talk about why we answered differently and find common ground."`;
};

// Generate discussion guide content
export const generateDiscussionGuide = (compatibilityData) => {
  const { partner1Name, partner2Name, misalignments, alignmentScore } = compatibilityData;

  let guide = `
# Discussion Guide for ${partner1Name} & ${partner2Name}

## Your Alignment Score: ${alignmentScore}%

${alignmentScore >= 75
    ? 'You have strong alignment! Use this guide to maintain and deepen your connection.'
    : alignmentScore >= 50
      ? 'You have good foundational alignment with some areas to explore.'
      : 'You have important differences to work through before major commitments.'}

---

## Areas to Discuss

${misalignments.map((m, index) => `
### ${index + 1}. ${m.question}

**${partner1Name}'s answer:** ${m.partner1Answer}
**${partner2Name}'s answer:** ${m.partner2Answer}

**Discussion starter:**
${m.discussionPrompt}

**Tips for this conversation:**
- Share your "why" behind your answer
- Listen without judgment
- Look for compromise or middle ground
- It's okay to agree to disagree on some things

---
`).join('\n')}

## Conversation Guidelines

1. **Choose the right time:** Not when tired, hungry, or stressed
2. **One topic at a time:** Don't try to solve everything in one sitting
3. **Use "I" statements:** "I feel..." instead of "You always..."
4. **Take breaks:** If emotions run high, pause and return later
5. **Celebrate agreement:** Acknowledge where you DO align

## Remember

Differences don't mean incompatibility. They mean you're two unique people building something together. The goal isn't to think exactly alike - it's to understand each other and find ways forward that honor both of you.

---

*Generated by TogetherForward - Your relationship planning companion*
`;

  return guide;
};

export default {
  calculateCompatibilityScore,
  generateDiscussionGuide
};
