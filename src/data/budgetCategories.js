// Predefined budget categories for different milestone types

export const BUDGET_CATEGORIES_BY_TYPE = {
  wedding: [
    { name: 'Venue', description: 'Ceremony and reception location', icon: '🏛️' },
    { name: 'Catering', description: 'Food and beverages', icon: '🍽️' },
    { name: 'Photography', description: 'Photos and videos', icon: '📸' },
    { name: 'Attire', description: 'Wedding dress, suit, accessories', icon: '👗' },
    { name: 'Flowers & Decor', description: 'Floral arrangements and decorations', icon: '💐' },
    { name: 'Music & Entertainment', description: 'DJ, band, entertainment', icon: '🎵' },
    { name: 'Invitations', description: 'Save the dates, invitations, thank you cards', icon: '💌' },
    { name: 'Rings', description: 'Wedding bands', icon: '💍' },
    { name: 'Transportation', description: 'Limos, shuttles, parking', icon: '🚗' },
    { name: 'Accommodation', description: 'Hotel for guests', icon: '🏨' },
    { name: 'Other', description: 'Miscellaneous expenses', icon: '📦' }
  ],

  home: [
    { name: 'Down Payment', description: 'Initial payment towards home', icon: '💰' },
    { name: 'Closing Costs', description: 'Legal fees, title insurance, etc.', icon: '📋' },
    { name: 'Home Inspection', description: 'Property inspection fees', icon: '🔍' },
    { name: 'Appraisal', description: 'Home appraisal costs', icon: '📊' },
    { name: 'Moving Costs', description: 'Movers, truck rental', icon: '🚚' },
    { name: 'Furniture', description: 'New furniture and appliances', icon: '🛋️' },
    { name: 'Renovations', description: 'Immediate repairs or updates', icon: '🔨' },
    { name: 'Insurance', description: 'Homeowners insurance', icon: '🏠' },
    { name: 'Emergency Fund', description: 'Reserve for unexpected costs', icon: '🆘' },
    { name: 'Other', description: 'Miscellaneous expenses', icon: '📦' }
  ],

  travel: [
    { name: 'Flights', description: 'Airfare for all travelers', icon: '✈️' },
    { name: 'Accommodation', description: 'Hotels, Airbnb, rentals', icon: '🏨' },
    { name: 'Activities', description: 'Tours, excursions, attractions', icon: '🎢' },
    { name: 'Food & Dining', description: 'Restaurants and meals', icon: '🍴' },
    { name: 'Transportation', description: 'Car rental, trains, taxis', icon: '🚗' },
    { name: 'Travel Insurance', description: 'Trip protection', icon: '🛡️' },
    { name: 'Visa & Documents', description: 'Passport, visas, permits', icon: '📄' },
    { name: 'Shopping', description: 'Souvenirs and shopping', icon: '🛍️' },
    { name: 'Emergency Fund', description: 'Backup money', icon: '🆘' },
    { name: 'Other', description: 'Miscellaneous expenses', icon: '📦' }
  ],

  baby: [
    { name: 'Medical Costs', description: 'Prenatal care, delivery, postnatal', icon: '🏥' },
    { name: 'Nursery Setup', description: 'Crib, changing table, decorations', icon: '🛏️' },
    { name: 'Baby Gear', description: 'Stroller, car seat, carrier', icon: '👶' },
    { name: 'Clothing', description: 'Baby clothes and accessories', icon: '👕' },
    { name: 'Diapers & Supplies', description: 'Diapers, wipes, toiletries', icon: '🧷' },
    { name: 'Feeding', description: 'Bottles, formula, nursing supplies', icon: '🍼' },
    { name: 'Childcare', description: 'Daycare or nanny costs', icon: '👨‍👩‍👧' },
    { name: 'Education Fund', description: 'College savings', icon: '🎓' },
    { name: 'Emergency Fund', description: 'Unexpected baby costs', icon: '🆘' },
    { name: 'Other', description: 'Miscellaneous expenses', icon: '📦' }
  ],

  education: [
    { name: 'Tuition', description: 'Course or degree fees', icon: '🎓' },
    { name: 'Books & Materials', description: 'Textbooks, supplies, equipment', icon: '📚' },
    { name: 'Accommodation', description: 'Dorm or rent', icon: '🏠' },
    { name: 'Living Expenses', description: 'Food, utilities, transport', icon: '🛒' },
    { name: 'Technology', description: 'Laptop, software, subscriptions', icon: '💻' },
    { name: 'Application Fees', description: 'Test fees, application costs', icon: '📝' },
    { name: 'Emergency Fund', description: 'Backup for unexpected costs', icon: '🆘' },
    { name: 'Other', description: 'Miscellaneous expenses', icon: '📦' }
  ],

  business: [
    { name: 'Initial Capital', description: 'Startup investment', icon: '💰' },
    { name: 'Legal & Licenses', description: 'Business registration, permits', icon: '⚖️' },
    { name: 'Equipment', description: 'Tools, machinery, computers', icon: '🖥️' },
    { name: 'Office Space', description: 'Rent, utilities, furniture', icon: '🏢' },
    { name: 'Marketing', description: 'Advertising, website, branding', icon: '📢' },
    { name: 'Inventory', description: 'Initial stock or supplies', icon: '📦' },
    { name: 'Insurance', description: 'Business insurance', icon: '🛡️' },
    { name: 'Emergency Fund', description: 'Operating reserve', icon: '🆘' },
    { name: 'Other', description: 'Miscellaneous expenses', icon: '📦' }
  ],

  default: [
    { name: 'Category 1', description: 'Main expense category', icon: '📁' },
    { name: 'Category 2', description: 'Secondary expense category', icon: '📁' },
    { name: 'Category 3', description: 'Additional expenses', icon: '📁' },
    { name: 'Emergency Fund', description: 'Backup for unexpected costs', icon: '🆘' },
    { name: 'Other', description: 'Miscellaneous expenses', icon: '📦' }
  ]
};

// Helper to get categories based on milestone title/type
export const getCategoriesForMilestone = (milestoneTitle) => {
  const title = milestoneTitle.toLowerCase();

  if (title.includes('wedding') || title.includes('marry') || title.includes('engaged')) {
    return BUDGET_CATEGORIES_BY_TYPE.wedding;
  }
  if (title.includes('home') || title.includes('house') || title.includes('apartment') || title.includes('buy')) {
    return BUDGET_CATEGORIES_BY_TYPE.home;
  }
  if (title.includes('travel') || title.includes('trip') || title.includes('vacation') || title.includes('honeymoon')) {
    return BUDGET_CATEGORIES_BY_TYPE.travel;
  }
  if (title.includes('baby') || title.includes('child') || title.includes('parent')) {
    return BUDGET_CATEGORIES_BY_TYPE.baby;
  }
  if (title.includes('school') || title.includes('college') || title.includes('university') || title.includes('education') || title.includes('degree')) {
    return BUDGET_CATEGORIES_BY_TYPE.education;
  }
  if (title.includes('business') || title.includes('startup') || title.includes('company')) {
    return BUDGET_CATEGORIES_BY_TYPE.business;
  }

  return BUDGET_CATEGORIES_BY_TYPE.default;
};

// Helper to suggest budget breakdown based on total budget
export const suggestCategoryBudgets = (totalBudget, categories) => {
  // Wedding breakdown (typical percentages)
  const weddingBreakdown = {
    'Venue': 0.30,
    'Catering': 0.25,
    'Photography': 0.10,
    'Attire': 0.08,
    'Flowers & Decor': 0.08,
    'Music & Entertainment': 0.07,
    'Invitations': 0.03,
    'Rings': 0.03,
    'Transportation': 0.02,
    'Accommodation': 0.02,
    'Other': 0.02
  };

  // Home buying breakdown
  const homeBreakdown = {
    'Down Payment': 0.70,
    'Closing Costs': 0.10,
    'Home Inspection': 0.02,
    'Appraisal': 0.02,
    'Moving Costs': 0.05,
    'Furniture': 0.05,
    'Renovations': 0.03,
    'Insurance': 0.01,
    'Emergency Fund': 0.01,
    'Other': 0.01
  };

  // Travel breakdown
  const travelBreakdown = {
    'Flights': 0.30,
    'Accommodation': 0.30,
    'Activities': 0.15,
    'Food & Dining': 0.15,
    'Transportation': 0.05,
    'Travel Insurance': 0.02,
    'Visa & Documents': 0.01,
    'Shopping': 0.01,
    'Emergency Fund': 0.01,
    'Other': 0.00
  };

  // Determine which breakdown to use
  let breakdown = {};
  const firstCategory = categories[0]?.name;

  if (firstCategory === 'Venue') {
    breakdown = weddingBreakdown;
  } else if (firstCategory === 'Down Payment') {
    breakdown = homeBreakdown;
  } else if (firstCategory === 'Flights') {
    breakdown = travelBreakdown;
  } else {
    // Equal distribution for other types
    const equalPercentage = 1 / categories.length;
    categories.forEach(cat => {
      breakdown[cat.name] = equalPercentage;
    });
  }

  // Calculate suggested budgets
  const suggestions = {};
  categories.forEach(category => {
    const percentage = breakdown[category.name] || 0;
    suggestions[category.name] = Math.round(totalBudget * percentage);
  });

  return suggestions;
};

export default BUDGET_CATEGORIES_BY_TYPE;
