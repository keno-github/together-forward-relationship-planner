import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Brain, Sparkles, Target, CheckCircle, ArrowRight, User, LogOut, MoreVertical, LayoutDashboard, UserCircle, Settings, Send, HeartHandshake, MapPin, MessageCircle } from 'lucide-react';
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
      setStage('lunaConversation');
      setIsLunaTyping(true);
      try {
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
      onComplete({ chosenPath: 'compatibility' });
    } else if (chosenPath === 'ready') {
      setStage('goalSelection');
    }
  };

  const handleGoalSelectionPath = (pathId) => {
    if (pathId === 'luna') {
      handlePathChoice('luna');
    } else if (pathId === 'templates') {
      onComplete({
        chosenPath: 'ready',
        showTemplates: true
      });
    } else if (pathId === 'custom') {
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
      const claudeMessages = newConversation.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const result = await converseWithLuna(claudeMessages, lunaContext);
      setConversation([...newConversation, { role: 'assistant', content: result.message }]);
      setLunaContext(result.context);

      if (isRoadmapComplete(result.context)) {
        const roadmapData = getRoadmapData(result.context);
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
    <div className="min-h-screen bg-[#FDFCF8] text-stone-900 font-sans selection:bg-orange-100 selection:text-orange-900">

      {/* NAVIGATION */}
      <nav className="w-full px-8 py-6 flex justify-between items-center max-w-7xl mx-auto sticky top-0 z-50 bg-[#FDFCF8]/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center">
            <Heart className="w-5 h-5 text-[#FDFCF8]" fill="currentColor" />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight">TogetherForward</span>
        </div>

        <div className="flex items-center gap-4">
          {!authLoading && (
            <>
              {user ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="bg-white border border-stone-200 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium hover:bg-stone-50 transition"
                  >
                    <User className="w-4 h-4 text-stone-700" />
                    <span className="text-stone-900">{user.email?.split('@')[0]}</span>
                    <MoreVertical className="w-4 h-4 text-stone-500" />
                  </motion.button>

                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 bg-white border border-stone-200 rounded-2xl p-2 min-w-[220px] shadow-xl"
                    >
                      <div className="px-3 py-2 border-b border-stone-100 mb-2">
                        <p className="text-xs text-stone-500">Signed in as</p>
                        <p className="text-sm font-medium text-stone-900">{user.email}</p>
                      </div>
                      {onGoToDashboard && (
                        <button onClick={() => { onGoToDashboard(); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors text-sm text-stone-900">
                          <LayoutDashboard className="w-4 h-4 text-stone-700" />
                          My Dashboard
                        </button>
                      )}
                      {onGoToProfile && (
                        <button onClick={() => { onGoToProfile(); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors text-sm text-stone-900">
                          <UserCircle className="w-4 h-4 text-stone-700" />
                          My Profile
                        </button>
                      )}
                      {onGoToSettings && (
                        <button onClick={() => { onGoToSettings(); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors text-sm text-stone-900">
                          <Settings className="w-4 h-4 text-stone-700" />
                          Settings
                        </button>
                      )}
                      <div className="border-t border-stone-100 my-2"></div>
                      <button onClick={async () => { await signOut(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm text-red-600">
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
                  className="bg-stone-900 text-[#FDFCF8] px-5 py-2 rounded-full text-sm font-medium hover:bg-stone-800 transition shadow-lg shadow-stone-900/10">
                  <User className="w-4 h-4 inline mr-2" />
                  Sign In
                </motion.button>
              )}
            </>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      {showAuthModal && !user && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-md w-full">
            <button onClick={() => setShowAuthModal(false)}
              className="absolute -top-4 -right-4 bg-white border border-stone-200 w-10 h-10 rounded-full flex items-center justify-center text-2xl z-10 text-stone-900 hover:bg-stone-50 transition">×</button>
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
          >
            {/* HERO SECTION */}
            <header className="max-w-7xl mx-auto px-6 pt-20 pb-32 md:pt-32 md:pb-40 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-stone-200 bg-white text-xs font-medium text-stone-500 uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Now available for Early Access
                </div>

                <h1 className="text-5xl md:text-7xl font-serif leading-[1.1] text-stone-900">
                  Love is easy.<br />
                  <span className="text-stone-400 italic">Logistics are hard.</span>
                </h1>

                <p className="text-xl text-stone-600 leading-relaxed max-w-lg">
                  The operating system for your shared life. Align on goals, plan big moves, and navigate finances with Luna—your proactive AI companion.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={handleGetStarted}
                    className="px-8 py-4 bg-stone-900 text-[#FDFCF8] rounded-full font-medium text-lg hover:bg-stone-800 transition flex items-center justify-center gap-2 shadow-xl shadow-stone-900/20">
                    Create your Dream <ArrowRight size={18} />
                  </button>
                  {user && hasExistingRoadmaps && onGoToDashboard && (
                    <button
                      onClick={onGoToDashboard}
                      className="px-8 py-4 bg-white border border-stone-200 text-stone-900 rounded-full font-medium text-lg hover:bg-stone-50 transition flex items-center justify-center">
                      <LayoutDashboard className="w-5 h-5 mr-2" />
                      My Dashboard
                    </button>
                  )}
                </div>

                <p className="text-sm text-stone-400 pt-2">
                  Free forever plan • No credit card • 2-min setup
                </p>
              </div>

              {/* HERO VISUAL */}
              <div className="relative h-[500px] w-full bg-stone-100 rounded-t-[200px] rounded-b-[40px] overflow-hidden border border-stone-200 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-stone-50 to-stone-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <Sparkles className="w-16 h-16 text-stone-400 mx-auto mb-4" />
                    <p className="font-serif italic text-2xl text-stone-400">Your journey starts here</p>
                  </div>
                </div>

                {/* Floating UI Element overlay */}
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-3/4 bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-stone-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-900 mb-1">Luna's Insight</p>
                      <p className="text-stone-600 text-sm leading-relaxed">
                        "I found three neighborhoods that offer both the garden Sarah wants and Mike's short commute within your budget."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* PROBLEM SECTION */}
            <section className="py-24 bg-white border-t border-stone-100">
              <div className="max-w-4xl mx-auto px-6 text-center">
                <h2 className="text-3xl md:text-4xl font-serif mb-6 text-stone-900">
                  Why do we plan our careers with tools,<br/> but leave our relationships to chance?
                </h2>
                <p className="text-lg text-stone-500 leading-relaxed mb-16 max-w-2xl mx-auto">
                  Spreadsheets are cold. Therapy is expensive. Text chains get lost.
                  TogetherForward bridges the gap between emotional connection and practical execution.
                </p>
              </div>

              <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { icon: <MessageCircle />, title: "The Friction", desc: "Endless debates about 'where do we start?'" },
                  { icon: <MapPin />, title: "The Overwhelm", desc: "Visas, weddings, mortgages—too many moving parts." },
                  { icon: <HeartHandshake />, title: "The Misalignment", desc: "Assuming you're on the same page, until you aren't." }
                ].map((item, i) => (
                  <div key={i} className="p-8 rounded-3xl bg-stone-50 border border-stone-100 hover:border-stone-300 transition duration-300">
                    <div className="w-12 h-12 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-900 mb-6 shadow-sm">
                      {React.cloneElement(item.icon, { strokeWidth: 1.5 })}
                    </div>
                    <h3 className="text-xl font-bold text-stone-900 mb-3">{item.title}</h3>
                    <p className="text-stone-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* FEATURES SECTION */}
            <section className="py-32 overflow-hidden">
              <div className="max-w-7xl mx-auto px-6">
                {/* Feature 1: Luna AI */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
                  <div>
                    <span className="text-orange-600 font-bold tracking-wider uppercase text-xs mb-2 block">Feature 01 — Intelligence</span>
                    <h2 className="text-4xl md:text-5xl font-serif mb-6 text-stone-900">Chat with Luna,<br/>your AI planner.</h2>
                    <p className="text-lg text-stone-600 mb-8 leading-relaxed">
                      Luna analyzes your goals, location, and budget to give you instant, personalized advice. She remembers everything and helps you avoid costly mistakes.
                    </p>

                    <ul className="space-y-4">
                      {["Instant expert advice", "Location-specific costs", "Context-aware planning"].map((feat, i) => (
                        <li key={i} className="flex items-center gap-3 text-stone-800 font-medium">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                            <CheckCircle size={14} strokeWidth={3} />
                          </div>
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="relative">
                    <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-stone-100 p-8 max-w-md mx-auto">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-stone-700 to-stone-900 flex items-center justify-center">
                          <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">Luna AI</p>
                          <p className="text-xs text-stone-400">Your Planning Assistant</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-stone-50 border border-stone-100 rounded-lg p-3">
                          <p className="text-sm text-stone-900">
                            "For a Paris wedding with 80-100 guests, you're looking at €25-35K. Want me to break down where every euro goes?"
                          </p>
                        </div>
                        <div className="flex justify-end">
                          <div className="bg-stone-900 rounded-lg p-3 max-w-[70%]">
                            <p className="text-sm text-white">Yes! What about hidden costs?</p>
                          </div>
                        </div>
                        <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                          <div className="flex gap-2 items-center mb-2">
                             <Sparkles size={14} className="text-orange-600" />
                             <p className="text-xs text-orange-600 font-bold uppercase">Luna Suggests</p>
                          </div>
                          <p className="text-sm text-stone-800">
                            "Hidden costs like alterations (€300), vendor meals (€200), and overtime charges (€500) add up to ~€1,000..."
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Decorative circle behind */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-stone-100 rounded-full -z-10"></div>
                  </div>
                </div>

                {/* Feature 2: Budget Tracking */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className="order-2 lg:order-1 relative">
                    <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-stone-100 p-8 max-w-md mx-auto">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-stone-900">Wedding Budget</h3>
                        <Target className="w-6 h-6 text-stone-700" />
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2 text-stone-900">
                          <span>€18,500 spent</span>
                          <span className="font-bold">74% of budget</span>
                        </div>
                        <div className="w-full h-4 bg-stone-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: '74%' }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5 }}
                            className="h-full bg-emerald-500 rounded-full"
                          ></motion.div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-stone-50 border border-stone-100 rounded-lg p-3">
                          <div className="text-xs mb-1 text-stone-500">Remaining</div>
                          <div className="text-2xl font-bold text-emerald-600">€6,500</div>
                        </div>
                        <div className="bg-stone-50 border border-stone-100 rounded-lg p-3">
                          <div className="text-xs mb-1 text-stone-500">Status</div>
                          <div className="text-2xl font-bold text-emerald-600">On Track</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {[
                          ['Venue & Catering', '€13,750'],
                          ['Photography', '€3,000'],
                          ['Attire & Flowers', '€1,750']
                        ].map(([label, amount], i) => (
                          <div key={i} className="flex justify-between text-sm text-stone-900">
                            <span>{label}</span>
                            <span className="font-semibold">{amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-stone-100 rounded-full -z-10"></div>
                  </div>

                  <div className="order-1 lg:order-2">
                    <span className="text-emerald-600 font-bold tracking-wider uppercase text-xs mb-2 block">Feature 02 — Tracking</span>
                    <h2 className="text-4xl md:text-5xl font-serif mb-6 text-stone-900">Track every euro,<br/>avoid overspending.</h2>
                    <p className="text-lg text-stone-600 mb-8 leading-relaxed">
                      Advanced budget tracker shows you exactly where your money goes. Set limits, track progress, and get smart alerts before you overspend.
                    </p>

                    <ul className="space-y-4">
                      {["Real-time updates", "Category breakdown", "Smart overspending alerts"].map((feat, i) => (
                        <li key={i} className="flex items-center gap-3 text-stone-800 font-medium">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                            <CheckCircle size={14} strokeWidth={3} />
                          </div>
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA SECTION */}
            <section className="py-32 px-6 text-center bg-stone-50 border-t border-stone-100">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-5xl md:text-6xl font-serif text-stone-900 mb-8">
                  Start your next chapter.
                </h2>
                <p className="text-xl text-stone-600 mb-10">
                  Join couples who are turning their relationship dreams into achievable, step-by-step plans.
                </p>

                <button
                  onClick={handleGetStarted}
                  className="px-8 py-4 bg-stone-900 text-[#FDFCF8] rounded-full font-medium text-lg hover:bg-stone-800 transition shadow-xl shadow-stone-900/20 inline-flex items-center gap-2">
                  Get Started — Free Forever <ArrowRight size={18} />
                </button>
                <p className="text-xs text-stone-400 mt-4">No credit card required • 2-minute setup</p>
              </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-white py-12 border-t border-stone-100">
              <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-stone-900 flex items-center justify-center">
                    <Heart className="w-3 h-3 text-[#FDFCF8]" fill="currentColor" />
                  </div>
                  <span className="font-serif font-bold text-stone-900">TogetherForward</span>
                </div>

                <div className="flex gap-8 text-sm text-stone-500">
                  <a href="#" className="hover:text-stone-900">Privacy Policy</a>
                  <a href="#" className="hover:text-stone-900">Terms of Service</a>
                  <a href="#" className="hover:text-stone-900">Contact</a>
                </div>

                <p className="text-sm text-stone-400">© 2025 TogetherForward</p>
              </div>
            </footer>
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
                <h2 className="text-4xl md:text-5xl font-serif mb-4 text-stone-900">
                  Choose Your Starting Point
                </h2>
                <p className="text-xl text-stone-600">
                  Every couple's journey is unique. Pick the path that feels right for you.
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Luna AI */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ y: -4 }}
                  className="bg-white border-2 border-stone-200 rounded-3xl p-8 relative cursor-pointer hover:border-stone-400 transition"
                  onClick={() => handlePathChoice('luna')}
                >
                  <div className="absolute -top-3 right-6 bg-stone-900 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>

                  <div className="w-16 h-16 rounded-2xl bg-stone-900 flex items-center justify-center mb-6">
                    <Brain className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold mb-3 font-serif text-stone-900">
                    Chat with Luna AI
                  </h3>
                  <p className="text-base mb-6 text-stone-600">
                    Our AI guide creates a personalized dream plan through conversation
                  </p>

                  <div className="space-y-2 mb-6">
                    {["Instant dream creation", "Tailored to your situation", "5-7 minute conversation"].map((feat, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-600" />
                        <span className="text-sm text-stone-700">{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-stone-900 font-semibold">
                    <span>Start Planning</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </motion.div>

                {/* Compatibility */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ y: -4 }}
                  className="bg-white border border-stone-200 rounded-3xl p-8 cursor-pointer hover:border-stone-400 transition"
                  onClick={() => handlePathChoice('compatibility')}
                >
                  <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center mb-6">
                    <Heart className="w-8 h-8 text-stone-900" />
                  </div>

                  <h3 className="text-2xl font-bold mb-3 font-serif text-stone-900">
                    Alignment Assessment
                  </h3>
                  <p className="text-base mb-6 text-stone-600">
                    Understand your compatibility before planning your future together
                  </p>

                  <div className="space-y-2 mb-6">
                    {["Identify areas of alignment", "Get discussion guide for gaps", "5-7 minute assessment"].map((feat, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-600" />
                        <span className="text-sm text-stone-700">{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-stone-900 font-semibold">
                    <span>Take Assessment</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </motion.div>

                {/* Quick Start */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ y: -4 }}
                  className="bg-white border border-stone-200 rounded-3xl p-8 cursor-pointer hover:border-stone-400 transition"
                  onClick={() => handlePathChoice('ready')}
                >
                  <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center mb-6">
                    <Target className="w-8 h-8 text-stone-900" />
                  </div>

                  <h3 className="text-2xl font-bold mb-3 font-serif text-stone-900">
                    Jump to Planning
                  </h3>
                  <p className="text-base mb-6 text-stone-600">
                    Already aligned? Skip straight to building your roadmap
                  </p>

                  <div className="space-y-2 mb-6">
                    {["Browse goal templates", "Build custom milestones", "Start planning immediately"].map((feat, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-600" />
                        <span className="text-sm text-stone-700">{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-stone-900 font-semibold">
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
                  className="text-sm font-medium hover:underline text-stone-500"
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
              {/* Luna Profile */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white border border-stone-200 rounded-2xl p-4 mb-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-stone-700 to-stone-900 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-stone-900 font-serif">
                      Luna - Your AI Planner
                    </h3>
                    <p className="text-sm text-stone-500">Online • Ready to help</p>
                  </div>
                  <button
                    onClick={() => setStage('pathChoice')}
                    className="text-sm text-stone-600 hover:text-stone-900 font-medium"
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
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-lg"
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
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-50 border border-stone-200 text-stone-900'
                        }`}
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
                      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
                        <div className="flex gap-1">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity }}
                            className="w-2 h-2 bg-stone-400 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                            className="w-2 h-2 bg-stone-400 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                            className="w-2 h-2 bg-stone-400 rounded-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Input Area */}
                <div className="border-t border-stone-200 p-4 bg-stone-50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleLunaSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 bg-white border border-stone-200 rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-stone-900 text-stone-900"
                      disabled={isLunaTyping}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLunaSendMessage}
                      disabled={isLunaTyping || !userInput.trim()}
                      className="bg-stone-900 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-800 transition"
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
                className="bg-white border border-stone-200 px-4 py-2 rounded-full font-medium flex items-center gap-2 text-stone-900 hover:bg-stone-50 transition"
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
