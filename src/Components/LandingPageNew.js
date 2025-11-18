import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Brain, Sparkles, Target, CheckCircle, ArrowRight, User, LogOut, MoreVertical, LayoutDashboard, UserCircle, Settings, Send } from 'lucide-react';
import { getUserRoadmaps } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { converseWithLuna, isRoadmapComplete, getRoadmapData } from '../services/lunaService';
import Auth from './Auth';
import GoalSelectionHub from './GoalSelectionHub';

const LandingPageNew = ({ onComplete, onBack = null, onGoToDashboard = null, onGoToProfile = null, onGoToSettings = null, isReturningUser = false }) => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasExistingRoadmaps, setHasExistingRoadmaps] = useState(false);

  const initialStage = isReturningUser ? 'goalSelection' : 'hero';
  const [stage, setStage] = useState(initialStage);

  // Luna conversation state
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLunaTyping, setIsLunaTyping] = useState(false);
  const [partner1Name, setPartner1Name] = useState('');
  const [partner2Name, setPartner2Name] = useState('');
  const [lunaContext, setLunaContext] = useState({});

  // Check if user has existing roadmaps
  useEffect(() => {
    const checkRoadmaps = async () => {
      if (user && !authLoading) {
        try {
          const { data: roadmaps } = await getUserRoadmaps();
          setHasExistingRoadmaps(roadmaps && roadmaps.length > 0);
        } catch (error) {
          console.error('Error checking roadmaps:', error);
        }
      } else {
        setHasExistingRoadmaps(false);
      }
    };
    checkRoadmaps();
  }, [user, authLoading]);

  const handleGetStarted = () => {
    setStage('pathChoice');
  };

  const handlePathChoice = async (chosenPath) => {
    if (chosenPath === 'luna') {
      // Start Luna conversation
      setStage('lunaConversation');
      // Get Luna's opening message
      setIsLunaTyping(true);
      try {
        // Start conversation with empty message history to get Luna's greeting
        const initialMessage = { role: 'user', content: 'Hi' };
        const result = await converseWithLuna([initialMessage], {});

        setConversation([{ role: 'assistant', content: result.message }]);
        setLunaContext(result.context);
      } catch (error) {
        console.error('Error getting Luna response:', error);
        setConversation([{
          role: 'assistant',
          content: "Hi there! 👋 I'm Luna, your AI planning assistant. I'm here to help you turn your dreams into achievable plans. What are you hoping to accomplish together?"
        }]);
      }
      setIsLunaTyping(false);
    } else if (chosenPath === 'compatibility') {
      // Go to compatibility assessment
      onComplete({ chosenPath: 'compatibility' });
    } else if (chosenPath === 'ready') {
      // Show goal selection hub
      setStage('goalSelection');
    }
  };

  const handleGoalSelectionPath = (pathId) => {
    if (pathId === 'luna') {
      // From goal selection, go to Luna
      handlePathChoice('luna');
    } else if (pathId === 'templates') {
      // Go to templates (will be handled by completing with a flag)
      onComplete({
        chosenPath: 'ready',
        showTemplates: true
      });
    } else if (pathId === 'custom') {
      // Go to custom creator
      onComplete({
        chosenPath: 'ready',
        showCustomCreator: true
      });
    }
  };

  const handleLunaSendMessage = async () => {
    if (!userInput.trim() || isLunaTyping) return;

    const userMessage = { role: 'user', content: userInput };
    const newConversation = [...conversation, userMessage];
    setConversation(newConversation);
    setUserInput('');
    setIsLunaTyping(true);

    try {
      // Convert our conversation format to Claude format for the API
      const claudeMessages = newConversation.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call Luna service with conversation history and context
      const result = await converseWithLuna(claudeMessages, lunaContext);

      // Update conversation with Luna's response
      setConversation([...newConversation, { role: 'assistant', content: result.message }]);
      setLunaContext(result.context);

      console.log('💡 Luna context updated:', {
        hasPartner1: !!result.context.partner1,
        hasPartner2: !!result.context.partner2,
        hasLocation: !!result.context.location,
        milestonesCount: result.context.milestones?.length || 0,
        deepDivesCount: result.context.deepDives?.length || 0,
        isComplete: result.context.roadmapComplete
      });
      console.log('🔍 DEBUG: Full context received:', result.context);
      console.log('🔍 DEBUG: context.milestones:', result.context.milestones);
      console.log('🔍 DEBUG: context.generatedMilestones:', result.context.generatedMilestones);
      console.log('🔍 DEBUG: Checking isRoadmapComplete...');

      // Check if roadmap is complete
      if (isRoadmapComplete(result.context)) {
        console.log('✅ Roadmap complete! Preparing data...');
        const roadmapData = getRoadmapData(result.context);

        console.log('📦 Luna roadmap data prepared:', {
          milestones: roadmapData.milestones?.length,
          milestonesWithDeepDives: roadmapData.milestones?.filter(m => m.deepDiveData).length,
          partner1: roadmapData.partner1,
          partner2: roadmapData.partner2,
          location: roadmapData.location
        });

        // Give user time to read Luna's final message
        setTimeout(() => {
          onComplete({
            chosenPath: 'luna',
            ...roadmapData,
            conversationHistory: [...newConversation, { role: 'assistant', content: result.message }]
          });
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error in Luna conversation:', error);
      setConversation([...newConversation, {
        role: 'assistant',
        content: "I'm having a moment of trouble connecting. Could you tell me again what you're hoping to accomplish?"
      }]);
    }
    setIsLunaTyping(false);
  };

  return (
    <div className="min-h-screen animated-gradient-bg relative overflow-hidden">
      {/* User Menu - Top Right */}
      <div className="absolute top-0 right-0 p-6 z-50">
        {!authLoading && (
          <>
            {user ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="glass-card-strong rounded-full p-3 flex items-center gap-2"
                >
                  <User className="w-5 h-5" style={{color: '#C084FC'}} />
                  <span className="text-sm font-medium px-2" style={{color: '#2B2B2B'}}>
                    {user.email?.split('@')[0]}
                  </span>
                  <MoreVertical className="w-4 h-4" style={{color: '#C084FC'}} />
                </motion.button>

                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 glass-card-strong rounded-xl p-2 min-w-[220px] shadow-lg"
                  >
                    <div className="px-3 py-2 border-b border-white/20 mb-2">
                      <p className="text-xs" style={{color: '#2B2B2B', opacity: 0.7}}>Signed in as</p>
                      <p className="text-sm font-medium" style={{color: '#2B2B2B'}}>{user.email}</p>
                    </div>
                    {onGoToDashboard && (
                      <button onClick={() => { onGoToDashboard(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm"
                        style={{color: '#2B2B2B'}}>
                        <LayoutDashboard className="w-4 h-4" style={{color: '#C084FC'}} />
                        My Dashboard
                      </button>
                    )}
                    {onGoToProfile && (
                      <button onClick={() => { onGoToProfile(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm"
                        style={{color: '#2B2B2B'}}>
                        <UserCircle className="w-4 h-4" style={{color: '#C084FC'}} />
                        My Profile
                      </button>
                    )}
                    {onGoToSettings && (
                      <button onClick={() => { onGoToSettings(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm"
                        style={{color: '#2B2B2B'}}>
                        <Settings className="w-4 h-4" style={{color: '#C084FC'}} />
                        Settings
                      </button>
                    )}
                    <div className="border-t border-white/20 my-2"></div>
                    <button onClick={async () => { await signOut(); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm"
                      style={{color: '#EF4444'}}>
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAuthModal(true)}
                className="glass-card-strong rounded-full px-5 py-2 flex items-center gap-2 text-sm font-medium"
                style={{color: '#2B2B2B'}}>
                <User className="w-4 h-4" style={{color: '#C084FC'}} />
                Sign In
              </motion.button>
            )}
          </>
        )}
      </div>

      {/* Auth Modal */}
      {showAuthModal && !user && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-md w-full">
            <button onClick={() => setShowAuthModal(false)}
              className="absolute -top-4 -right-4 glass-card-strong w-10 h-10 rounded-full flex items-center justify-center text-2xl z-10"
              style={{color: '#2B2B2B'}}>×</button>
            <Auth onSuccess={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {stage === 'hero' && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            {/* SECTION 1: HERO - Centered & Bold */}
            <section className="min-h-screen flex items-center justify-center px-4 py-20">
              <div className="max-w-5xl mx-auto text-center">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-block mb-4"
                  >
                    <Sparkles className="w-16 h-16" style={{color: '#FFD580'}} />
                  </motion.div>
                </motion.div>

                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
                >
                  <span style={{color: '#C084FC'}}>Turn Dreams Into</span>
                  <br />
                  <span style={{color: '#2B2B2B'}}>Achievable Plans</span>
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto"
                  style={{color: '#2B2B2B', opacity: 0.8}}
                >
                  AI-powered planning for couples. Get personalized roadmaps, realistic budgets, and expert guidance for every milestone.
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGetStarted}
                    className="glass-button text-white px-10 py-4 rounded-full font-bold text-lg glow-strong shimmer flex items-center gap-3"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>

                  {user && hasExistingRoadmaps && onGoToDashboard && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onGoToDashboard}
                      className="glass-card-strong px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-3"
                      style={{color: '#2B2B2B'}}
                    >
                      <LayoutDashboard className="w-5 h-5" style={{color: '#C084FC'}} />
                      My Dashboard
                    </motion.button>
                  )}
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-6 text-sm"
                  style={{color: '#2B2B2B', opacity: 0.7}}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" style={{color: '#10B981'}} />
                    <span>No Credit Card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" style={{color: '#10B981'}} />
                    <span>2 Min Setup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" style={{color: '#10B981'}} />
                    <span>Cancel Anytime</span>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* SECTION 2: LIVE DEMO - Alternating Layout */}
            <section className="py-32 px-4">
              <div className="max-w-7xl mx-auto">
                {/* Demo 1: Luna AI - LEFT IMAGE, RIGHT TEXT */}
                <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    className="order-2 md:order-1"
                  >
                    <div className="glass-card rounded-3xl p-6 glow-soft">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                          <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold" style={{color: '#2B2B2B'}}>Luna AI</p>
                          <p className="text-xs" style={{color: '#2B2B2B', opacity: 0.5}}>Your Planning Assistant</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="glass-card-light rounded-lg p-3">
                          <p className="text-sm" style={{color: '#2B2B2B'}}>
                            "For a Paris wedding with 80-100 guests, you're looking at €25-35K. Want me to break down where every euro goes?"
                          </p>
                        </div>
                        <div className="flex justify-end">
                          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-3 max-w-[70%]">
                            <p className="text-sm text-white">Yes! What about hidden costs?</p>
                          </div>
                        </div>
                        <div className="glass-card-light rounded-lg p-3">
                          <p className="text-sm" style={{color: '#2B2B2B'}}>
                            "Hidden costs like alterations (€300), vendor meals (€200), and overtime charges (€500) add up to ~€1,000..."
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    className="order-1 md:order-2"
                  >
                    <div className="mb-4">
                      <span className="inline-block px-4 py-1 rounded-full text-xs font-bold text-white mb-4"
                        style={{background: 'linear-gradient(135deg, #C084FC, #F8C6D0)'}}>
                        AI-POWERED
                      </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{color: '#2B2B2B'}}>
                      Chat With Luna
                    </h2>
                    <p className="text-xl mb-6" style={{color: '#2B2B2B', opacity: 0.7}}>
                      Luna analyzes your goals, location, and budget to give you instant, personalized advice. She remembers everything and helps you avoid costly mistakes.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0" style={{color: '#C084FC'}} />
                        <div>
                          <p className="font-semibold" style={{color: '#2B2B2B'}}>Instant Expert Advice</p>
                          <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.6}}>Get answers in seconds, not hours</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0" style={{color: '#C084FC'}} />
                        <div>
                          <p className="font-semibold" style={{color: '#2B2B2B'}}>Location-Specific</p>
                          <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.6}}>Real costs for your city, not generic estimates</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0" style={{color: '#C084FC'}} />
                        <div>
                          <p className="font-semibold" style={{color: '#2B2B2B'}}>Context-Aware</p>
                          <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.6}}>Remembers your previous conversations</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Demo 2: Budget Tracker - RIGHT IMAGE, LEFT TEXT */}
                <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                  >
                    <div className="mb-4">
                      <span className="inline-block px-4 py-1 rounded-full text-xs font-bold text-white mb-4"
                        style={{background: 'linear-gradient(135deg, #10B981, #34D399)'}}>
                        SMART TRACKING
                      </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{color: '#2B2B2B'}}>
                      Track Every Euro
                    </h2>
                    <p className="text-xl mb-6" style={{color: '#2B2B2B', opacity: 0.7}}>
                      Advanced budget tracker shows you exactly where your money goes. Set limits, track progress, and avoid overspending.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0" style={{color: '#10B981'}} />
                        <div>
                          <p className="font-semibold" style={{color: '#2B2B2B'}}>Real-Time Updates</p>
                          <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.6}}>See your spending instantly</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0" style={{color: '#10B981'}} />
                        <div>
                          <p className="font-semibold" style={{color: '#2B2B2B'}}>Category Breakdown</p>
                          <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.6}}>Know where every euro goes</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0" style={{color: '#10B981'}} />
                        <div>
                          <p className="font-semibold" style={{color: '#2B2B2B'}}>Smart Alerts</p>
                          <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.6}}>Get warned before you overspend</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                  >
                    <div className="glass-card rounded-3xl p-6 glow-soft">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg" style={{color: '#2B2B2B'}}>Wedding Budget</h3>
                        <Target className="w-6 h-6" style={{color: '#C084FC'}} />
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2" style={{color: '#2B2B2B'}}>
                          <span>€18,500 spent</span>
                          <span className="font-bold">74% of budget</span>
                        </div>
                        <div className="w-full h-4 bg-white/30 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: '74%' }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                          ></motion.div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="glass-card-light rounded-lg p-3">
                          <div className="text-xs mb-1" style={{color: '#2B2B2B', opacity: 0.7}}>Remaining</div>
                          <div className="text-2xl font-bold" style={{color: '#10B981'}}>€6,500</div>
                        </div>
                        <div className="glass-card-light rounded-lg p-3">
                          <div className="text-xs mb-1" style={{color: '#2B2B2B', opacity: 0.7}}>Status</div>
                          <div className="text-2xl font-bold" style={{color: '#10B981'}}>On Track</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm" style={{color: '#2B2B2B'}}>
                          <span>Venue & Catering</span>
                          <span className="font-semibold">€13,750</span>
                        </div>
                        <div className="flex justify-between text-sm" style={{color: '#2B2B2B'}}>
                          <span>Photography</span>
                          <span className="font-semibold">€3,000</span>
                        </div>
                        <div className="flex justify-between text-sm" style={{color: '#2B2B2B'}}>
                          <span>Attire & Flowers</span>
                          <span className="font-semibold">€1,750</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Demo 3: Milestone Card - LEFT IMAGE, RIGHT TEXT */}
                <div className="grid md:grid-cols-2 gap-16 items-center">
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    className="order-2 md:order-1"
                  >
                    <div className="glass-card rounded-3xl p-6 glow-soft">
                      <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-6 text-white mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-2xl font-bold">Dream Wedding</h3>
                          <Heart className="w-8 h-8" fill="white" />
                        </div>
                        <p className="text-sm opacity-90 mb-4">From engagement to the big day - let's make it unforgettable!</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/20 rounded-lg p-3">
                            <div className="text-xs opacity-75">Timeline</div>
                            <div className="font-bold">12-18 months</div>
                          </div>
                          <div className="bg-white/20 rounded-lg p-3">
                            <div className="text-xs opacity-75">Est. Cost</div>
                            <div className="font-bold">€25,000</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm" style={{color: '#2B2B2B'}}>
                          <span>Venue & Catering (55%)</span>
                          <span className="font-semibold">€13,750</span>
                        </div>
                        <div className="flex justify-between text-sm" style={{color: '#2B2B2B'}}>
                          <span>Photography (12%)</span>
                          <span className="font-semibold">€3,000</span>
                        </div>
                        <div className="flex justify-between text-sm" style={{color: '#2B2B2B'}}>
                          <span>Attire & Flowers (18%)</span>
                          <span className="font-semibold">€4,500</span>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        className="w-full py-3 rounded-xl font-semibold text-white"
                        style={{background: 'linear-gradient(135deg, #C084FC, #F8C6D0)'}}
                      >
                        View Deep Dive →
                      </motion.button>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    className="order-1 md:order-2"
                  >
                    <div className="mb-4">
                      <span className="inline-block px-4 py-1 rounded-full text-xs font-bold text-white mb-4"
                        style={{background: 'linear-gradient(135deg, #F8C6D0, #FCA5A5)'}}>
                        DETAILED INSIGHTS
                      </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{color: '#2B2B2B'}}>
                      Deep Dive Into Every Goal
                    </h2>
                    <p className="text-xl mb-6" style={{color: '#2B2B2B', opacity: 0.7}}>
                      Click any milestone to see expert tips, hidden costs, common mistakes, and step-by-step timelines tailored to your location.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0" style={{color: '#F8C6D0'}} />
                        <div>
                          <p className="font-semibold" style={{color: '#2B2B2B'}}>Hidden Costs Revealed</p>
                          <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.6}}>Know about fees others miss</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0" style={{color: '#F8C6D0'}} />
                        <div>
                          <p className="font-semibold" style={{color: '#2B2B2B'}}>Expert Tips</p>
                          <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.6}}>Advice from industry professionals</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0" style={{color: '#F8C6D0'}} />
                        <div>
                          <p className="font-semibold" style={{color: '#2B2B2B'}}>Warning Flags</p>
                          <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.6}}>Avoid mistakes before you make them</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* SECTION 3: PRICING - Centered, Clean */}
            <section className="py-32 px-4" style={{background: 'rgba(192, 132, 252, 0.05)'}}>
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-6xl font-bold mb-6" style={{color: '#2B2B2B'}}>
                    Simple, Transparent Pricing
                  </h2>
                  <p className="text-xl max-w-2xl mx-auto" style={{color: '#2B2B2B', opacity: 0.7}}>
                    One avoided mistake pays for years of Pro
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
                  {/* FREE */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="glass-card rounded-3xl p-8"
                  >
                    <h3 className="text-2xl font-bold mb-2" style={{color: '#2B2B2B'}}>Starter</h3>
                    <div className="mb-6">
                      <span className="text-5xl font-bold" style={{color: '#10B981'}}>Free</span>
                    </div>
                    <p className="text-sm mb-6" style={{color: '#2B2B2B', opacity: 0.7}}>Perfect to try us out</p>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{color: '#10B981'}} />
                        <span className="text-sm" style={{color: '#2B2B2B'}}>1 active roadmap</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{color: '#10B981'}} />
                        <span className="text-sm" style={{color: '#2B2B2B'}}>3 Luna AI conversations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{color: '#10B981'}} />
                        <span className="text-sm" style={{color: '#2B2B2B'}}>Basic budget tracker</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{color: '#10B981'}} />
                        <span className="text-sm" style={{color: '#2B2B2B'}}>Cost breakdowns & tips</span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={handleGetStarted}
                      className="w-full py-3 rounded-xl font-semibold border-2"
                      style={{borderColor: '#10B981', color: '#10B981', background: 'transparent'}}
                    >
                      Start Free
                    </motion.button>
                  </motion.div>

                  {/* PRO - HIGHLIGHTED */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="glass-card rounded-3xl p-8 border-4 relative transform md:scale-105"
                    style={{borderColor: '#C084FC', boxShadow: '0 20px 60px rgba(192, 132, 252, 0.3)'}}
                  >
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="px-6 py-2 rounded-full text-sm font-bold text-white"
                        style={{background: 'linear-gradient(135deg, #C084FC, #F8C6D0)'}}>
                        MOST POPULAR
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold mb-2" style={{color: '#2B2B2B'}}>Pro</h3>
                    <div className="mb-2">
                      <span className="text-5xl font-bold" style={{color: '#C084FC'}}>€9.99</span>
                      <span className="text-xl" style={{color: '#2B2B2B', opacity: 0.6}}>/month</span>
                    </div>
                    <p className="text-sm mb-6" style={{color: '#10B981'}}>
                      or €99/year (save 17%)
                    </p>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{color: '#C084FC'}} />
                        <span className="text-sm font-semibold" style={{color: '#2B2B2B'}}>Everything in Starter, plus:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{color: '#C084FC'}} />
                        <span className="text-sm" style={{color: '#2B2B2B'}}>Unlimited roadmaps</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{color: '#C084FC'}} />
                        <span className="text-sm" style={{color: '#2B2B2B'}}>Unlimited Luna conversations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{color: '#C084FC'}} />
                        <span className="text-sm" style={{color: '#2B2B2B'}}>Cloud sync</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{color: '#C084FC'}} />
                        <span className="text-sm" style={{color: '#2B2B2B'}}>Partner access</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{color: '#C084FC'}} />
                        <span className="text-sm" style={{color: '#2B2B2B'}}>Priority support</span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={handleGetStarted}
                      className="w-full py-3 rounded-xl font-bold text-white"
                      style={{background: 'linear-gradient(135deg, #C084FC, #F8C6D0)'}}
                    >
                      Start Free Trial
                    </motion.button>
                    <p className="text-xs text-center mt-2" style={{color: '#2B2B2B', opacity: 0.6}}>
                      7-day free trial • Cancel anytime
                    </p>
                  </motion.div>

                  {/* PREMIUM */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="glass-card rounded-3xl p-8"
                  >
                    <h3 className="text-2xl font-bold mb-2" style={{color: '#2B2B2B'}}>Premium</h3>
                    <div className="mb-2">
                      <span className="text-5xl font-bold" style={{color: '#F8C6D0'}}>€19.99</span>
                      <span className="text-xl" style={{color: '#2B2B2B', opacity: 0.6}}>/month</span>
                    </div>
                    <p className="text-sm mb-6" style={{color: '#10B981'}}>
                      or €199/year (save 17%)
                    </p>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{color: '#F8C6D0'}} />
                        <span className="text-sm font-semibold" style={{color: '#2B2B2B'}}>Everything in Pro, plus:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{color: '#F8C6D0'}} />
                        <span className="text-sm" style={{color: '#2B2B2B'}}>AI budget predictions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{color: '#F8C6D0'}} />
                        <span className="text-sm" style={{color: '#2B2B2B'}}>Weekly Luna check-ins</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{color: '#F8C6D0'}} />
                        <span className="text-sm" style={{color: '#2B2B2B'}}>Custom templates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{color: '#F8C6D0'}} />
                        <span className="text-sm" style={{color: '#2B2B2B'}}>Private community</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{color: '#F8C6D0'}} />
                        <span className="text-sm" style={{color: '#2B2B2B'}}>VIP support</span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={handleGetStarted}
                      className="w-full py-3 rounded-xl font-semibold border-2"
                      style={{borderColor: '#F8C6D0', color: '#F8C6D0', background: 'transparent'}}
                    >
                      Start Free Trial
                    </motion.button>
                  </motion.div>
                </div>

                {/* Value Comparison */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  className="max-w-3xl mx-auto glass-card rounded-3xl p-8"
                >
                  <h3 className="text-2xl font-bold text-center mb-6" style={{color: '#2B2B2B'}}>
                    The Math Is Simple
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm font-semibold mb-3" style={{color: '#EF4444'}}>Without TogetherForward:</p>
                      <div className="space-y-2 text-sm" style={{color: '#2B2B2B'}}>
                        <div className="flex justify-between">
                          <span>Wedding planner:</span>
                          <span className="font-semibold">€500</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Financial advisor:</span>
                          <span className="font-semibold">€300</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Budget app:</span>
                          <span className="font-semibold">€120/yr</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold">
                          <span>Total:</span>
                          <span style={{color: '#EF4444'}}>€920+</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-3" style={{color: '#10B981'}}>With TogetherForward Pro:</p>
                      <div className="space-y-2 text-sm" style={{color: '#2B2B2B'}}>
                        <div className="flex justify-between">
                          <span>All features:</span>
                          <span className="font-semibold">✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unlimited access:</span>
                          <span className="font-semibold">✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Forever:</span>
                          <span className="font-semibold">✓</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold">
                          <span>Total:</span>
                          <span style={{color: '#10B981'}}>€120/yr</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 text-center p-4 rounded-xl" style={{background: 'rgba(192, 132, 252, 0.1)'}}>
                    <p className="font-bold text-lg" style={{color: '#C084FC'}}>
                      You save €800/year + avoid costly mistakes
                    </p>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* SECTION 4: FINAL CTA - Centered */}
            <section className="py-32 px-4">
              <div className="max-w-4xl mx-auto text-center">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl md:text-6xl font-bold mb-6" style={{color: '#2B2B2B'}}>
                    Start Planning Your Future
                  </h2>
                  <p className="text-xl mb-12 max-w-2xl mx-auto" style={{color: '#2B2B2B', opacity: 0.7}}>
                    Join couples who are turning their relationship dreams into achievable, step-by-step plans.
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGetStarted}
                    className="glass-button text-white px-12 py-5 rounded-full font-bold text-xl glow-strong shimmer inline-flex items-center gap-3"
                  >
                    <Sparkles className="w-6 h-6" />
                    Get Started - No Credit Card
                    <ArrowRight className="w-6 h-6" />
                  </motion.button>

                  <p className="mt-6 text-sm" style={{color: '#2B2B2B', opacity: 0.6}}>
                    Free forever plan • 7-day Pro trial • Cancel anytime
                  </p>
                </motion.div>
              </div>
            </section>
          </motion.div>
        )}

        {/* PATH CHOICE STAGE */}
        {stage === 'pathChoice' && (
          <motion.div
            key="pathChoice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center px-4 py-20"
          >
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{color: '#2B2B2B'}}>
                  Choose Your Starting Point
                </h2>
                <p className="text-xl" style={{color: '#2B2B2B', opacity: 0.7}}>
                  Every couple's journey is unique. Pick the path that feels right for you.
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Option 1: Luna AI (Recommended) */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  className="glass-card rounded-3xl p-8 relative cursor-pointer glow-soft"
                  onClick={() => handlePathChoice('luna')}
                >
                  <div className="absolute -top-3 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>

                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center mb-6">
                    <Brain className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold mb-3" style={{color: '#2B2B2B'}}>
                    Chat with Luna AI
                  </h3>
                  <p className="text-base mb-6" style={{color: '#2B2B2B', opacity: 0.7}}>
                    Our AI guide creates a personalized roadmap through conversation
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{color: '#10B981'}} />
                      <span className="text-sm" style={{color: '#2B2B2B', opacity: 0.8}}>
                        Instant roadmap creation
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{color: '#10B981'}} />
                      <span className="text-sm" style={{color: '#2B2B2B', opacity: 0.8}}>
                        Tailored to your unique situation
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{color: '#10B981'}} />
                      <span className="text-sm" style={{color: '#2B2B2B', opacity: 0.8}}>
                        5-7 minute conversation
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-purple-600 font-semibold">
                    <span>Start Planning</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </motion.div>

                {/* Option 2: Compatibility Assessment */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  className="glass-card rounded-3xl p-8 cursor-pointer"
                  onClick={() => handlePathChoice('compatibility')}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center mb-6">
                    <Heart className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold mb-3" style={{color: '#2B2B2B'}}>
                    Alignment Assessment
                  </h3>
                  <p className="text-base mb-6" style={{color: '#2B2B2B', opacity: 0.7}}>
                    Understand your compatibility before planning your future together
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{color: '#10B981'}} />
                      <span className="text-sm" style={{color: '#2B2B2B', opacity: 0.8}}>
                        Identify areas of alignment
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{color: '#10B981'}} />
                      <span className="text-sm" style={{color: '#2B2B2B', opacity: 0.8}}>
                        Get discussion guide for gaps
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{color: '#10B981'}} />
                      <span className="text-sm" style={{color: '#2B2B2B', opacity: 0.8}}>
                        5-7 minute assessment
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 font-semibold" style={{color: '#2B2B2B'}}>
                    <span>Take Assessment</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </motion.div>

                {/* Option 3: Quick Start */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  className="glass-card rounded-3xl p-8 cursor-pointer"
                  onClick={() => handlePathChoice('ready')}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center mb-6">
                    <Target className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold mb-3" style={{color: '#2B2B2B'}}>
                    Jump to Planning
                  </h3>
                  <p className="text-base mb-6" style={{color: '#2B2B2B', opacity: 0.7}}>
                    Already aligned? Skip straight to building your roadmap
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{color: '#10B981'}} />
                      <span className="text-sm" style={{color: '#2B2B2B', opacity: 0.8}}>
                        Browse goal templates
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{color: '#10B981'}} />
                      <span className="text-sm" style={{color: '#2B2B2B', opacity: 0.8}}>
                        Build custom milestones
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{color: '#10B981'}} />
                      <span className="text-sm" style={{color: '#2B2B2B', opacity: 0.8}}>
                        Start planning immediately
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 font-semibold" style={{color: '#2B2B2B'}}>
                    <span>Start Now</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center mt-12"
              >
                <button
                  onClick={() => setStage('hero')}
                  className="text-sm font-medium hover:underline"
                  style={{color: '#2B2B2B', opacity: 0.6}}
                >
                  ← Back to home
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* LUNA CONVERSATION STAGE */}
        {stage === 'lunaConversation' && (
          <motion.div
            key="lunaConversation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center px-4 py-20"
          >
            <div className="max-w-4xl mx-auto w-full">
              {/* Luna Profile Card */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="glass-card-strong rounded-2xl p-4 mb-4"
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(168, 85, 247, 0.4)',
                        '0 0 40px rgba(236, 72, 153, 0.6)',
                        '0 0 20px rgba(168, 85, 247, 0.4)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center"
                  >
                    <Brain className="w-8 h-8 text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold" style={{color: '#2B2B2B'}}>
                      Luna - Your AI Planner
                    </h3>
                    <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.6}}>Online • Ready to help</p>
                  </div>
                  <button
                    onClick={() => setStage('pathChoice')}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    ← Back
                  </button>
                </div>
              </motion.div>

              {/* Chat Container */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="glass-card-strong rounded-2xl overflow-hidden"
                style={{ height: '500px', display: 'flex', flexDirection: 'column' }}
              >
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {conversation.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'glass-card'
                        }`}
                        style={message.role === 'assistant' ? {color: '#2B2B2B'} : {}}
                      >
                        {message.content}
                      </div>
                    </motion.div>
                  ))}
                  {isLunaTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="glass-card rounded-2xl p-4">
                        <div className="flex gap-1">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity }}
                            className="w-2 h-2 bg-purple-500 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                            className="w-2 h-2 bg-pink-500 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                            className="w-2 h-2 bg-blue-500 rounded-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Input Area */}
                <div className="border-t border-white/20 p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleLunaSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 bg-white/50 rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                      style={{color: '#2B2B2B'}}
                      disabled={isLunaTyping}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLunaSendMessage}
                      disabled={isLunaTyping || !userInput.trim()}
                      className="glass-button text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* GOAL SELECTION STAGE */}
        {stage === 'goalSelection' && (
          <motion.div
            key="goalSelection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute top-4 left-4 z-50">
              <button
                onClick={() => setStage('pathChoice')}
                className="glass-card-strong px-4 py-2 rounded-full font-medium flex items-center gap-2"
                style={{color: '#2B2B2B'}}
              >
                ← Back to Path Selection
              </button>
            </div>
            <GoalSelectionHub
              partner1={partner1Name || 'Partner'}
              partner2={partner2Name || 'You'}
              onSelectPath={handleGoalSelectionPath}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPageNew;
