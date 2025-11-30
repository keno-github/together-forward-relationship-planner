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
    communication: { matched: 0, total: 0 },
    values: { matched: 0, total: 0 },
    family: { matched: 0, total: 0 },
    career: { matched: 0, total: 0 },
    parenting: { matched: 0, total: 0 },
    future: { matched: 0, total: 0 }
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

    // Religion/Spirituality
    'very_important': "You both hold faith as central - this shared foundation can strengthen your relationship.",
    'somewhat_important': "You're aligned on occasional practice - room for both tradition and flexibility.",
    'not_important': "You both value respect over religious practice - shared openness is key.",
    'not_religious': "You're both secular - this alignment avoids potential conflicts around faith.",

    // Family involvement
    'very_involved': "You both value family input deeply - your families will be active partners in your journey.",
    'consult_but_decide': "Perfect balance! You both honor family while maintaining autonomy.",
    'inform_after': "You're aligned on independence - decisions are yours to make as a couple.",
    'private': "You both value privacy in decision-making - a clear boundary you share.",

    // Career priorities
    'career_first': "You both prioritize career growth - mutual support for ambitions will be crucial.",
    'discuss_together': "Great alignment! You both believe in collaborative decision-making.",
    'relationship_first': "You both put relationship above career - a strong foundation for navigating life together.",
    'depends': "You're both flexible and situational - adaptability is your shared strength.",

    // Social preferences
    'very_social': "You're both extroverts! Shared social energy will keep your life vibrant.",
    'balanced_social': "Perfect mix! You both enjoy friends and couple time equally.",
    'mostly_couple': "You both prefer quality time together - intimacy is your priority.",
    'alone_time': "You both need space to recharge - mutual understanding of introversion.",

    // Parenting style
    'structured': "You're both aligned on clear routines - consistency will be your parenting strength.",
    'balanced': "Great match! You both value structure with room for spontaneity.",
    'free_range': "You both believe in independence - your kids will have freedom to explore.",
    'still_figuring': "You're both open to learning - flexibility as you grow together.",

    // Household division
    'equal_split': "You both value equality - fairness will guide your home life.",
    'by_strength': "Smart alignment! You'll both play to your strengths at home.",
    'by_schedule': "You're both flexible and practical - adaptability is your approach.",
    'hire_help': "You both prefer outsourcing - more time for what matters most to you.",

    // Debt tolerance
    'no_debt': "You're both debt-averse - financial peace will be your shared priority.",
    'strategic_debt': "Great alignment! You both see debt as a tool when used wisely.",
    'comfortable_debt': "You're both pragmatic about borrowing - shared risk tolerance.",
    'not_worried': "You both prioritize living now - just ensure you're on the same page about limits.",

    // Independence vs togetherness
    'very_independent': "You both value autonomy - mutual respect for individual pursuits will thrive.",
    'balanced': "Perfect balance! You both maintain 'me' and 'we' identities.",
    'mostly_together': "You're both team-oriented - your partnership is the priority.",
    'merged': "You're both all-in on 'we' - complete unity is your relationship style.",

    // Retirement vision
    'active_travel': "You both dream of adventure in retirement - start planning those bucket lists!",
    'family_focus': "You're aligned on being near family - roots and relationships matter most.",
    'community': "You both value settled community life - building lasting connections together.",
    'no_plan': "You're both flexible about the future - living in the moment works for you.",

    // Boundaries
    'full_transparency': "You both value complete openness - trust through total honesty.",
    'mostly_open': "Great balance! You both honor openness with healthy privacy.",
    'separate_spaces': "You're aligned on clear boundaries - independence within partnership.",
    'figuring_out': "You're both learning together - ongoing communication will be key.",

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
    10: `"How do we currently handle conflict? What would make difficult conversations easier for both of us?"`,
    11: `"How will our different views on religion/spirituality impact major life decisions? Can we respect each other's beliefs?"`,
    12: `"What role should family play in our decisions? How do we balance family input with our autonomy as a couple?"`,
    13: `"If one of us gets a dream job opportunity, how do we decide? What sacrifices are we each willing to make for career vs. relationship?"`,
    14: `"How much time do we each need with friends vs. alone vs. together? How can we honor each other's social needs?"`,
    15: `"What are our core parenting values? Can we find a middle ground between structure and freedom?"`,
    16: `"How should we split household responsibilities? What feels fair to both of us?"`,
    17: `"What's our comfort level with debt? How will we handle financial decisions that involve borrowing?"`,
    18: `"How do we balance being individuals with being a couple? What does 'healthy independence' mean to each of us?"`,
    19: `"What does retirement look like for each of us? Are these visions compatible, or do we need to compromise?"`,
    20: `"What boundaries do we need in our relationship? How much transparency vs. privacy feels right to both of us?"`
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

*Generated by TwogetherForward - Your relationship planning companion*
`;

  return guide;
};

export default {
  calculateCompatibilityScore,
  generateDiscussionGuide
};
