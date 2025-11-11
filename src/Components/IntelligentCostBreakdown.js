import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, Info, AlertTriangle, MapPin, TrendingUp, TrendingDown
} from 'lucide-react';
import { getCategoriesForMilestone, getBudgetSuggestions } from '../data/budgetCategories';
import { getExpensesByMilestone } from '../services/supabaseService';

const IntelligentCostBreakdown = ({ milestone, roadmapId, userLocation }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!milestone?.id) return;

      try {
        // Get smart categories for this milestone type
        const smartCategories = getCategoriesForMilestone(milestone.title);
        setCategories(smartCategories);

        // Get actual expenses/allocations
        const { data: expenseData } = await getExpensesByMilestone(milestone.id);
        setExpenses(expenseData || []);
      } catch (error) {
        console.error('Error loading cost breakdown data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [milestone?.id, milestone?.title]);

  // Calculate min/typical/max based on budget suggestions
  const calculateBudgetRanges = () => {
    const totalBudget = milestone?.budget_amount || 0;

    if (totalBudget === 0) {
      // No budget set - use category suggestions as baseline
      const suggestedTotal = categories.reduce((sum, cat) => sum + (cat.suggestedBudget || 0), 0);
      return {
        minimum: Math.floor(suggestedTotal * 0.7), // 70% of suggested
        typical: suggestedTotal, // Suggested amount
        maximum: Math.ceil(suggestedTotal * 1.5) // 150% of suggested
      };
    }

    return {
      minimum: Math.floor(totalBudget * 0.7), // Bare minimum: 70% of budget
      typical: totalBudget, // Your budget goal
      maximum: Math.ceil(totalBudget * 1.3) // High-end: 130% of budget
    };
  };

  const ranges = calculateBudgetRanges();

  // Build breakdown from categories
  const buildCostBreakdown = () => {
    return categories.map(category => {
      // Get actual expenses for this category
      const categoryExpenses = expenses.filter(exp => exp.category === category.name);
      const actualSpent = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

      // Use actual or suggested budget
      const suggestedAmount = category.suggestedBudget || (milestone?.budget_amount || 0) * (category.percentage || 0.1);

      return {
        name: category.name,
        icon: category.icon,
        description: category.description,
        suggestedAmount,
        actualSpent,
        isRequired: category.required || false,
        percentage: ((suggestedAmount / (milestone?.budget_amount || suggestedAmount)) * 100).toFixed(0)
      };
    });
  };

  const breakdown = buildCostBreakdown();

  // Get hidden costs based on milestone type
  const getHiddenCosts = () => {
    const title = milestone?.title?.toLowerCase() || '';

    if (title.includes('wedding') || title.includes('marry')) {
      return [
        { cost: 'Alterations & Tailoring', amount: 200, why: 'Wedding attire often needs custom fitting' },
        { cost: 'Vendor Tips & Gratuities', amount: 300, why: 'Standard 15-20% for certain vendors' },
        { cost: 'Overtime Fees', amount: 250, why: 'If reception runs longer than planned' },
        { cost: 'Day-of Coordinator', amount: 800, why: 'Essential for stress-free execution' }
      ];
    }

    if (title.includes('home') || title.includes('house') || title.includes('apartment')) {
      return [
        { cost: 'HOA Transfer Fees', amount: 500, why: 'One-time fee when ownership transfers' },
        { cost: 'Utility Connection Fees', amount: 200, why: 'Setting up electricity, gas, water, internet' },
        { cost: 'Moving Costs', amount: 1200, why: 'Professional movers or truck rental + supplies' },
        { cost: 'Home Warranty', amount: 600, why: 'First year coverage for major appliances' }
      ];
    }

    if (title.includes('travel') || title.includes('vacation') || title.includes('trip')) {
      return [
        { cost: 'Baggage Fees', amount: 80, why: 'Checked bag fees (round trip)' },
        { cost: 'Resort/Hotel Fees', amount: 150, why: 'Mandatory facility fees not in room rate' },
        { cost: 'Currency Exchange', amount: 50, why: 'Exchange rate losses and ATM fees' },
        { cost: 'Travel Insurance', amount: 100, why: 'Trip cancellation and medical coverage' }
      ];
    }

    if (title.includes('baby') || title.includes('child') || title.includes('parent')) {
      return [
        { cost: 'Hospital Parking & Meals', amount: 150, why: 'Often overlooked during birth stay' },
        { cost: 'Postpartum Supplies', amount: 200, why: 'Recovery items not covered by insurance' },
        { cost: 'Baby Proofing', amount: 300, why: 'Safety gates, outlet covers, cabinet locks' },
        { cost: 'Extra Formula/Diapers', amount: 250, why: 'Emergency backup supplies' }
      ];
    }

    // Generic hidden costs for other goals
    return [
      { cost: 'Emergency Buffer', amount: Math.ceil((milestone?.budget_amount || 1000) * 0.1), why: 'Unexpected expenses (10% of budget)' },
      { cost: 'Tax Implications', amount: 0, why: 'Consult tax advisor for potential impacts' }
    ];
  };

  const hiddenCosts = getHiddenCosts();
  const totalHiddenCosts = hiddenCosts.reduce((sum, item) => sum + item.amount, 0);

  // Only show location info for relevant milestones
  const shouldShowLocationInfo = () => {
    const title = milestone?.title?.toLowerCase() || '';
    return title.includes('home') || title.includes('wedding') || title.includes('travel') || title.includes('relocat');
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-white/20 rounded-xl"></div>
          <div className="h-48 bg-white/20 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Range Explanation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5" style={{color: '#3B82F6'}} />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1" style={{color: '#2B2B2B'}}>
              Understanding Your Budget Range
            </h3>
            <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>
              We provide three budget levels to help you plan realistically:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Minimum */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-blue-600" />
              <p className="text-blue-700 text-sm font-semibold">Minimum</p>
            </div>
            <p className="text-3xl font-bold text-blue-900 mb-2">
              ${ranges.minimum?.toLocaleString()}
            </p>
            <p className="text-xs text-blue-700">
              Bare essentials only. You'll need to make compromises on quality or skip non-essential items.
            </p>
          </div>

          {/* Typical */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-400">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <p className="text-green-700 text-sm font-semibold">Typical (Your Goal)</p>
            </div>
            <p className="text-3xl font-bold text-green-900 mb-2">
              ${ranges.typical?.toLocaleString()}
            </p>
            <p className="text-xs text-green-700">
              Recommended budget for a quality experience. Balances cost with satisfaction.
            </p>
          </div>

          {/* Maximum */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <p className="text-purple-700 text-sm font-semibold">Maximum</p>
            </div>
            <p className="text-3xl font-bold text-purple-900 mb-2">
              ${ranges.maximum?.toLocaleString()}
            </p>
            <p className="text-xs text-purple-700">
              High-end/luxury version. Premium options across all categories.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Category Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold mb-4" style={{color: '#2B2B2B'}}>
          Budget by Category
        </h3>
        <p className="text-sm mb-6" style={{color: '#2B2B2B', opacity: 0.7}}>
          Based on your milestone type and budget goal. These are smart suggestions you can customize in the Budget & Savings tab.
        </p>

        <div className="space-y-3">
          {breakdown.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card-light rounded-xl p-4 hover:glass-card transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{item.icon}</span>
                    <h4 className="font-bold" style={{color: '#2B2B2B'}}>
                      {item.name}
                    </h4>
                    {item.isRequired && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                        Required
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/50" style={{color: '#2B2B2B', opacity: 0.7}}>
                      {item.percentage}% of budget
                    </span>
                  </div>
                  <p className="text-sm mb-2" style={{color: '#2B2B2B', opacity: 0.6}}>
                    {item.description}
                  </p>

                  {/* Progress bar showing actual vs suggested */}
                  {item.actualSpent > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1" style={{color: '#2B2B2B', opacity: 0.7}}>
                        <span>Allocated/Spent: ${item.actualSpent.toLocaleString()}</span>
                        <span>Suggested: ${item.suggestedAmount.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min((item.actualSpent / item.suggestedAmount) * 100, 100)}%`,
                            background: item.actualSpent > item.suggestedAmount
                              ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                              : 'linear-gradient(90deg, #10B981, #059669)'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold" style={{color: '#2B2B2B'}}>
                    ${item.suggestedAmount.toLocaleString()}
                  </p>
                  {item.actualSpent > 0 && (
                    <p className={`text-sm font-medium ${item.actualSpent > item.suggestedAmount ? 'text-red-600' : 'text-green-600'}`}>
                      {item.actualSpent > item.suggestedAmount ? 'Over' : 'On track'}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Hidden Costs */}
      {hiddenCosts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6"
          style={{borderLeft: '4px solid #F59E0B'}}
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1" style={{color: '#2B2B2B'}}>
                Hidden Costs to Consider
              </h3>
              <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>
                These often-overlooked expenses are specific to your milestone type. Budget an extra <strong>${totalHiddenCosts.toLocaleString()}</strong> to avoid surprises.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {hiddenCosts.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="bg-yellow-50 rounded-xl p-4 border border-yellow-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-yellow-900">{item.cost}</h4>
                  <p className="font-bold text-yellow-700 text-lg">
                    +${item.amount.toLocaleString()}
                  </p>
                </div>
                <p className="text-sm text-yellow-800">{item.why}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Location-Specific Considerations (conditional) */}
      {shouldShowLocationInfo() && userLocation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6"
          style={{borderLeft: '4px solid #8B5CF6'}}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2" style={{color: '#2B2B2B'}}>
                Cost Considerations for {userLocation}
              </h3>
              <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>
                Costs can vary significantly by location. Research local pricing for major categories like venue, vendors, or real estate to get accurate estimates for your area.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-6"
        style={{background: 'linear-gradient(135deg, rgba(192, 132, 252, 0.1), rgba(248, 198, 208, 0.1))'}}
      >
        <div className="text-center">
          <p className="text-sm mb-2" style={{color: '#2B2B2B', opacity: 0.7}}>
            Total Estimated Cost (including hidden costs)
          </p>
          <p className="text-4xl font-bold mb-1" style={{color: '#C084FC'}}>
            ${(ranges.typical + totalHiddenCosts).toLocaleString()}
          </p>
          <p className="text-xs" style={{color: '#2B2B2B', opacity: 0.6}}>
            Range: ${(ranges.minimum + totalHiddenCosts).toLocaleString()} - ${(ranges.maximum + totalHiddenCosts).toLocaleString()}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default IntelligentCostBreakdown;
