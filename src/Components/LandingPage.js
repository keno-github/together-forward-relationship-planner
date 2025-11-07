import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Brain, Sparkles, Target, Calendar, TrendingUp, Users, CheckCircle, ArrowRight, Loader, Mic, MicOff, Send, User, LogOut, MoreVertical, LayoutDashboard, UserCircle, Settings } from 'lucide-react';
import { getLunaOnboardingResponse, extractUserDataFromConversation } from '../services/claudeAPI';
import { getUserRoadmaps } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import Auth from './Auth';
import GoalSelectionHub from './GoalSelectionHub';
import TemplateGallery from './TemplateGallery';
import CustomGoalCreator from './CustomGoalCreator';
import BackButton from './BackButton';

// Mock location data for different cities
const LOCATION_DATA = {
  'Paris, France': {
    flag: '🇫🇷',
    propertyPrice: '€10-15K/m²',
    weddingCost: '€15-20K',
    neighborhoods: ['Le Marais', 'Saint-Germain', 'Montmartre'],
    currency: '€'
  },
  'New York, USA': {
    flag: '🇺🇸',
    propertyPrice: '$15-25K/sqft',
    weddingCost: '$50-70K',
    neighborhoods: ['Brooklyn Heights', 'Upper West Side', 'Williamsburg'],
    currency: '$'
  },
  'London, UK': {
    flag: '🇬🇧',
    propertyPrice: '£8-12K/sqft',
    weddingCost: '£20-30K',
    neighborhoods: ['Notting Hill', 'Shoreditch', 'Greenwich'],
    currency: '£'
  },
  'Tokyo, Japan': {
    flag: '🇯🇵',
    propertyPrice: '¥800K-1.2M/m²',
    weddingCost: '¥3-5M',
    neighborhoods: ['Shibuya', 'Meguro', 'Nakameguro'],
    currency: '¥'
  },
  'Default': {
    flag: '🌍',
    propertyPrice: 'varies',
    weddingCost: 'varies',
    neighborhoods: ['your area'],
    currency: '$'
  }
};

// Example roadmap items for preview
const EXAMPLE_ROADMAP = [
  { icon: '💑', title: 'Move In Together', duration: '2-3 months', cost: '$3K-5K' },
  { icon: '💍', title: 'Get Engaged', duration: '6 months', cost: '$5K-10K' },
  { icon: '🏠', title: 'Buy First Home', duration: '1-2 years', cost: '$50K-100K down' },
  { icon: '👶', title: 'Start a Family', duration: '1-2 years', cost: '$10K-20K/year' }
];

const LandingPage = ({ onComplete, onBack = null, onGoToDashboard = null, isReturningUser = false }) => {
  // Authentication state
  const { user, loading: authLoading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasExistingRoadmaps, setHasExistingRoadmaps] = useState(false);

  // For returning users, skip hero and go straight to goal selection
  const initialStage = isReturningUser ? 'goalSelection' : 'hero';
  const [stage, setStage] = useState(initialStage); // hero, pathChoice, goalSelection, templateGallery, customCreator, loading, detected, onboarding
  const [chosenPath, setChosenPath] = useState(null); // 'ready' or 'compatibility'
  const [loadingSteps, setLoadingSteps] = useState([
    { text: 'Connecting to AI brain', done: false },
    { text: 'Loading relationship insights', done: false },
    { text: 'Detecting your location', done: false }
  ]);
  const [location, setLocation] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLunaTyping, setIsLunaTyping] = useState(false);
  const [canCreateRoadmap, setCanCreateRoadmap] = useState(false);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // Goal selection state
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [customGoal, setCustomGoal] = useState(null);
  const [needsLunaRefinement, setNeedsLunaRefinement] = useState(false);

  // Store extracted user data
  const [extractedData, setExtractedData] = useState({
    partner1: '',
    partner2: '',
    goals: [],
    goalDetails: {},
    timeline: '',
    priorities: []
  });

  // Floating hearts animation data
  const hearts = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 0.4,
    duration: 4 + Math.random() * 3,
    x: Math.random() * 100
  }));

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  // Simulate loading steps
  useEffect(() => {
    if (stage === 'loading') {
      // Step 1: AI brain
      setTimeout(() => {
        setLoadingSteps(prev => prev.map((step, i) =>
          i === 0 ? { ...step, done: true } : step
        ));
      }, 800);

      // Step 2: Insights
      setTimeout(() => {
        setLoadingSteps(prev => prev.map((step, i) =>
          i === 1 ? { ...step, done: true } : step
        ));
      }, 1600);

      // Step 3: Location detection
      setTimeout(() => {
        detectLocation();
      }, 2400);
    }
  }, [stage]);

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

  const detectLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // In a real app, you'd use reverse geocoding API
          // For now, we'll use a mock location
          const mockLocation = 'Paris, France';

          setLoadingSteps(prev => prev.map((step, i) =>
            i === 2 ? { ...step, done: true } : step
          ));

          setTimeout(async () => {
            setLocation(mockLocation);
            setLocationData(LOCATION_DATA[mockLocation]);

            // NEW: Check if templates were selected without Luna refinement
            if (selectedTemplates.length > 0 && !needsLunaRefinement) {
              // Skip Luna, go straight to roadmap
              const userData = {
                partner1: 'Partner 1',
                partner2: 'Partner 2',
                goals: selectedTemplates.map(t => t.title),
                goalDetails: {},
                timeline: '',
                priorities: [],
                location: mockLocation,
                locationData: LOCATION_DATA[mockLocation],
                selectedTemplates: selectedTemplates,
                skipLuna: true
              };
              onComplete(userData);
              return;
            }

            // NEW: Check if custom goal was created without Luna refinement
            if (customGoal && !needsLunaRefinement) {
              // Skip Luna, go straight to roadmap
              const userData = {
                partner1: 'Partner 1',
                partner2: 'Partner 2',
                goals: [customGoal.title],
                goalDetails: {},
                timeline: customGoal.duration,
                priorities: [],
                location: mockLocation,
                locationData: LOCATION_DATA[mockLocation],
                customGoal: customGoal,
                skipLuna: true
              };
              onComplete(userData);
              return;
            }

            // Continue with Luna conversation (existing flow or Luna refinement)
            setStage('detected');

            // Get Luna's intelligent opening from AI
            setIsLunaTyping(true);
            const openingMessage = await getLunaOnboardingResponse([], {
              location: mockLocation,
              selectedTemplates: selectedTemplates.length > 0 ? selectedTemplates : undefined,
              customGoal: customGoal || undefined
            });
            setIsLunaTyping(false);

            // Start conversation with Luna's AI-generated intro
            setConversation([{
              role: 'assistant',
              content: openingMessage,
              timestamp: new Date()
            }]);
          }, 500);
        },
        (error) => {
          // Fallback if location denied
          const fallbackLocation = 'Default';
          setLoadingSteps(prev => prev.map((step, i) =>
            i === 2 ? { ...step, done: true } : step
          ));

          setTimeout(async () => {
            setLocation(fallbackLocation);
            setLocationData(LOCATION_DATA[fallbackLocation]);
            setStage('detected');

            // Get Luna's intelligent opening from AI
            setIsLunaTyping(true);
            const openingMessage = await getLunaOnboardingResponse([], {
              location: fallbackLocation
            });
            setIsLunaTyping(false);

            setConversation([{
              role: 'assistant',
              content: openingMessage,
              timestamp: new Date()
            }]);
          }, 500);
        }
      );
    } else {
      // Browser doesn't support geolocation
      const fallbackLocation = 'Default';
      setLocation(fallbackLocation);
      setLocationData(LOCATION_DATA[fallbackLocation]);
      setStage('detected');
    }
  };

  const handleGetStarted = () => {
    setStage('pathChoice');
  };

  const handlePathChoice = (path) => {
    setChosenPath(path);
    if (path === 'ready') {
      // NEW: Go to Goal Selection Hub instead of directly to Luna
      setStage('goalSelection');
    } else {
      // Go to compatibility assessment (new flow)
      // This will be handled by App.js routing
      onComplete({ chosenPath: 'compatibility', skipLuna: true });
    }
  };

  // NEW: Handle goal selection path choice
  const handleGoalSelectionPath = (pathId) => {
    if (pathId === 'luna') {
      // Go directly to Luna chat
      setStage('loading');
    } else if (pathId === 'templates') {
      // Show template gallery
      setStage('templateGallery');
    } else if (pathId === 'custom') {
      // Show custom goal creator
      setStage('customCreator');
    }
  };

  // NEW: Handle template selection complete
  const handleTemplateComplete = (templates) => {
    setSelectedTemplates(templates);
    setNeedsLunaRefinement(false);
    // Skip Luna, go straight to loading then roadmap
    setStage('loading');
  };

  // NEW: Handle template refinement with Luna
  const handleTemplateRefineWithLuna = (templates) => {
    setSelectedTemplates(templates);
    setNeedsLunaRefinement(true);
    // Go to Luna for refinement
    setStage('loading');
  };

  // NEW: Handle custom goal complete
  const handleCustomGoalComplete = (goal) => {
    setCustomGoal(goal);
    setNeedsLunaRefinement(goal.needsLunaRefinement);
    // Go to loading then Luna or roadmap
    setStage('loading');
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      // Stop recording
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      if (recognitionRef.current) {
        setIsRecording(true);
        recognitionRef.current.start();
      } else {
        alert('Voice input is not supported in your browser. Please use Chrome or Edge.');
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLunaTyping) return;

    const userMessage = userInput.trim();
    setUserInput('');

    // Add user message to conversation
    const newConversation = [...conversation, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }];
    setConversation(newConversation);

    // Show Luna typing indicator
    setIsLunaTyping(true);

    try {
      // Get Luna's intelligent response
      const apiMessages = newConversation.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const lunaResponse = await getLunaOnboardingResponse(apiMessages, {
        location: location
      });

      // Add Luna's response
      setConversation([...newConversation, {
        role: 'assistant',
        content: lunaResponse,
        timestamp: new Date()
      }]);

      // After a few exchanges, try to extract data and enable roadmap creation
      // Trigger after 3 messages (Luna welcome -> User -> Luna) to show button sooner
      if (newConversation.length >= 3) {
        tryExtractUserData(newConversation);
      }
    } catch (error) {
      console.error('Error getting Luna response:', error);
      // Fallback error message
      setConversation([...newConversation, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Could you try again?",
        timestamp: new Date()
      }]);
    } finally {
      setIsLunaTyping(false);
    }
  };

  const tryExtractUserData = async (conversationHistory) => {
    try {
      const extracted = await extractUserDataFromConversation(conversationHistory);

      if (extracted) {
        // Update extracted data
        setExtractedData(prev => ({
          ...prev,
          ...extracted
        }));

        // Check if Luna's last response signals readiness for roadmap
        const lastLunaMessage = conversationHistory
          .filter(msg => msg.role === 'assistant')
          .pop()?.content?.toLowerCase() || '';

        const readinessSignals = [
          'shall we start building',
          'ready to see your roadmap',
          'shall we create',
          'ready to see your plan',
          'start building your plan',
          'let\'s create your',
          'ready for your roadmap'
        ];

        const lunaSignalsReady = readinessSignals.some(signal =>
          lastLunaMessage.includes(signal)
        );

        // Enable roadmap creation if:
        // 1. We have basic data (names + goals), AND
        // 2. Luna has signaled readiness
        if (extracted.partner1 && extracted.goals && extracted.goals.length > 0 && lunaSignalsReady) {
          setCanCreateRoadmap(true);
        }
      }
    } catch (error) {
      console.error('Error extracting user data:', error);
    }
  };


  const handleStartApp = () => {
    // Pass extracted user data and conversation context to main app
    const userData = {
      partner1: extractedData.partner1 || 'Partner 1',
      partner2: extractedData.partner2 || 'Partner 2',
      goals: extractedData.goals || [],
      goalDetails: extractedData.goalDetails || {},
      timeline: extractedData.timeline || '2 years',
      budget: extractedData.budget,
      priorities: extractedData.priorities || [],
      location: location,
      locationData: locationData,
      conversationHistory: conversation // Pass full conversation for context
    };

    onComplete(userData);
  };


  return (
    <div className="min-h-screen animated-gradient-bg relative overflow-hidden">
      {/* Decorative blur circles for depth - Using custom colors */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl" style={{backgroundColor: 'rgba(192, 132, 252, 0.15)'}}></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{backgroundColor: 'rgba(248, 198, 208, 0.15)'}}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl" style={{backgroundColor: 'rgba(255, 213, 128, 0.1)'}}></div>

      {/* Top Navigation - Back Button (left) and User Menu (right) */}
      {/* Back Button - Top Left */}
      {onBack && stage === 'hero' && user && (
        <div className="absolute top-0 left-0 p-6 z-50">
          <BackButton onClick={onBack} label="Dashboard" />
        </div>
      )}

      {/* Internal Navigation - Back buttons for nested stages */}
      {(stage === 'goalSelection' || stage === 'templateGallery' || stage === 'customCreator') && (
        <div className="absolute top-0 left-0 p-6 z-50">
          <BackButton
            onClick={() => {
              if (stage === 'templateGallery' || stage === 'customCreator') {
                setStage('goalSelection');
              } else if (stage === 'goalSelection') {
                setStage('hero');
              }
            }}
            label="Back"
          />
        </div>
      )}

      {/* User Menu - Top Right */}
      <div className="absolute top-0 right-0 p-6 z-50">
        {!authLoading && (
          <>
            {user ? (
              /* Logged in - show user menu */
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

                {/* Dropdown Menu */}
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

                    {/* Dashboard */}
                    {onGoToDashboard && (
                      <button
                        onClick={() => {
                          onGoToDashboard();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm"
                        style={{color: '#2B2B2B'}}
                      >
                        <LayoutDashboard className="w-4 h-4" style={{color: '#C084FC'}} />
                        My Dashboard
                      </button>
                    )}

                    {/* My Profile */}
                    <button
                      onClick={() => {
                        // TODO: Add profile page navigation
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm"
                      style={{color: '#2B2B2B'}}
                    >
                      <UserCircle className="w-4 h-4" style={{color: '#C084FC'}} />
                      My Profile
                    </button>

                    {/* Settings */}
                    <button
                      onClick={() => {
                        // TODO: Add settings page navigation
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm"
                      style={{color: '#2B2B2B'}}
                    >
                      <Settings className="w-4 h-4" style={{color: '#C084FC'}} />
                      Settings
                    </button>

                    <div className="border-t border-white/20 my-2"></div>

                    {/* Sign Out */}
                    <button
                      onClick={async () => {
                        await signOut();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm"
                      style={{color: '#EF4444'}}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              /* Not logged in - show sign in button */
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAuthModal(true)}
                className="glass-card-strong rounded-full px-5 py-2 flex items-center gap-2 text-sm font-medium"
                style={{color: '#2B2B2B'}}
              >
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
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-4 -right-4 glass-card-strong w-10 h-10 rounded-full flex items-center justify-center text-2xl z-10"
              style={{color: '#2B2B2B'}}
            >
              ×
            </button>
            <Auth onSuccess={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Hero Stage */}
        {stage === 'hero' && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
          >
            {/* Floating hearts background */}
            {hearts.map(heart => (
              <motion.div
                key={heart.id}
                className="absolute text-white/20 text-3xl"
                initial={{ y: '110vh', x: `${heart.x}vw` }}
                animate={{
                  y: '-10vh',
                }}
                transition={{
                  duration: heart.duration,
                  delay: heart.delay,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              >
                <Heart fill="currentColor" />
              </motion.div>
            ))}

            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
              {/* Left: Hero Content */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block mb-4"
                >
                  <Sparkles className="w-12 h-12 drop-shadow-lg" style={{color: '#FFD580'}} />
                </motion.div>

                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                  <span style={{color: '#C084FC'}} className="drop-shadow-lg">
                    Build Your Future
                  </span>
                  <br />
                  <span style={{color: '#2B2B2B'}} className="drop-shadow-sm">Together</span>
                </h1>

                <p className="text-xl mb-8 leading-relaxed" style={{color: '#2B2B2B'}}>
                  Turn your relationship dreams into reality with AI-powered planning. Get personalized roadmaps, realistic budgets, and step-by-step guidance for every milestone.
                </p>

                {/* Trust Signals */}
                <div className="flex flex-wrap gap-4 mb-8 text-sm" style={{color: '#2B2B2B'}}>
                  <div className="flex items-center gap-2 glass-card-light px-4 py-2 rounded-full">
                    <CheckCircle className="w-5 h-5" style={{color: '#C084FC'}} />
                    <span>100% Free</span>
                  </div>
                  <div className="flex items-center gap-2 glass-card-light px-4 py-2 rounded-full">
                    <CheckCircle className="w-5 h-5" style={{color: '#C084FC'}} />
                    <span>Start Free {user ? '✓' : '(Optional Sign In)'}</span>
                  </div>
                  <div className="flex items-center gap-2 glass-card-light px-4 py-2 rounded-full">
                    <CheckCircle className="w-5 h-5" style={{color: '#C084FC'}} />
                    <span>Takes 2 Minutes</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGetStarted}
                    className="glass-button text-white px-8 py-4 rounded-full font-bold text-lg glow-soft flex items-center gap-3"
                  >
                    Start Planning Together
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>

                  {/* Dashboard Button - for returning users with roadmaps */}
                  {user && hasExistingRoadmaps && onGoToDashboard && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onGoToDashboard}
                      className="glass-card-strong px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center gap-3 border-2"
                      style={{borderColor: '#C084FC', color: '#2B2B2B'}}
                    >
                      <LayoutDashboard className="w-5 h-5" style={{color: '#C084FC'}} />
                      View My Dashboard
                    </motion.button>
                  )}
                </div>

                {/* Example Roadmap Preview - NEW! */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="glass-card rounded-2xl p-5 shimmer"
                >
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{color: '#2B2B2B'}}>
                    <Target className="w-4 h-4" style={{color: '#C084FC'}} />
                    Example Roadmap Preview:
                  </p>
                  <div className="space-y-2">
                    {EXAMPLE_ROADMAP.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="flex items-center gap-3 text-sm glass-card-light rounded-xl p-3 smooth-transition hover:glass-card-strong"
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium" style={{color: '#2B2B2B'}}>{item.title}</div>
                          <div className="text-xs" style={{color: '#2B2B2B', opacity: 0.6}}>{item.duration} • {item.cost}</div>
                        </div>
                        <CheckCircle className="w-4 h-4" style={{color: '#C084FC'}} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Social Proof */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 flex items-center gap-2"
                  style={{color: '#2B2B2B', opacity: 0.7}}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-sm">Trusted by 1,000+ couples planning their future</span>
                </motion.div>
              </motion.div>

              {/* Right: Feature Preview Cards */}
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                {/* Feature Card 1 */}
                <motion.div
                  whileHover={{ scale: 1.03, x: 10 }}
                  className="glass-card rounded-2xl p-6 glow-soft smooth-transition float"
                  style={{ animationDelay: '0s' }}
                >
                  <div className="flex items-start gap-4">
                    <div className="glass-card-strong p-4 rounded-xl">
                      <Brain className="w-6 h-6" style={{color: '#C084FC'}} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2" style={{color: '#2B2B2B'}}>AI-Powered Planning</h3>
                      <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>Get personalized roadmaps based on your location, budget, and dreams.</p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature Card 2 */}
                <motion.div
                  whileHover={{ scale: 1.03, x: 10 }}
                  className="glass-card rounded-2xl p-6 glow-soft smooth-transition float"
                  style={{ animationDelay: '1s' }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="glass-card-strong p-4 rounded-xl">
                      <Target className="w-6 h-6" style={{color: '#F8C6D0'}} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2" style={{color: '#2B2B2B'}}>Realistic Cost Breakdowns</h3>
                      <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>No surprises! See minimum, typical, and maximum costs for every goal.</p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature Card 3 */}
                <motion.div
                  whileHover={{ scale: 1.03, x: 10 }}
                  className="glass-card rounded-2xl p-6 glow-soft smooth-transition float"
                  style={{ animationDelay: '2s' }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="glass-card-strong p-4 rounded-xl">
                      <Calendar className="w-6 h-6" style={{color: '#FFD580'}} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2" style={{color: '#2B2B2B'}}>Step-by-Step Timelines</h3>
                      <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>Break down big dreams into actionable monthly tasks you can actually complete.</p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature Card 4 */}
                <motion.div
                  whileHover={{ scale: 1.03, x: 10 }}
                  className="glass-card rounded-2xl p-6 glow-soft smooth-transition float"
                  style={{ animationDelay: '3s' }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="glass-card-strong p-4 rounded-xl">
                      <TrendingUp className="w-6 h-6" style={{color: '#C084FC'}} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2" style={{color: '#2B2B2B'}}>Track Progress Together</h3>
                      <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.7}}>Celebrate milestones, earn XP, and watch your relationship grow stronger.</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Path Choice Stage - NEW! */}
        {stage === 'pathChoice' && (
          <motion.div
            key="pathChoice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="max-w-5xl mx-auto"
            >
              {/* Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-12"
              >
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                    Where Are You On Your Journey?
                  </span>
                </h1>
                <p className="text-xl text-gray-600">
                  Choose the path that fits you best - there's no wrong answer!
                </p>
              </motion.div>

              {/* Two Path Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* PATH 1: Ready to Plan */}
                <motion.button
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePathChoice('ready')}
                  className="bg-white rounded-3xl p-8 shadow-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-2xl transition-all text-left group"
                >
                  <div className="text-6xl mb-4">💡</div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-3 group-hover:text-purple-600 transition-colors">
                    We're Ready
                  </h2>
                  <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                    We know our goals and we're aligned on what we want to achieve together.
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>Start planning immediately</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>Chat with Luna about your goals</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>Get personalized roadmaps</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-purple-600 font-semibold group-hover:translate-x-2 transition-transform">
                    <span>Let's Go!</span>
                    <ArrowRight className="w-6 h-6" />
                  </div>
                </motion.button>

                {/* PATH 2: Get Aligned */}
                <motion.button
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePathChoice('compatibility')}
                  className="bg-white rounded-3xl p-8 shadow-xl border-2 border-pink-200 hover:border-pink-400 hover:shadow-2xl transition-all text-left group"
                >
                  <div className="text-6xl mb-4">🤝</div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-3 group-hover:text-pink-600 transition-colors">
                    Help Us Get Aligned
                  </h2>
                  <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                    We're exploring options and want to make sure we're on the same page first.
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-pink-500 flex-shrink-0" />
                      <span>Quick 5-minute assessment</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-pink-500 flex-shrink-0" />
                      <span>Discover where you align</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-pink-500 flex-shrink-0" />
                      <span>Get discussion guides</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-pink-600 font-semibold group-hover:translate-x-2 transition-transform">
                    <span>Check Alignment</span>
                    <ArrowRight className="w-6 h-6" />
                  </div>
                </motion.button>
              </div>

              {/* Bottom note */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-gray-500 mt-8 text-sm"
              >
                💡 <strong>Tip:</strong> 95% of couples discover something new in the alignment check - it's worth the 5 minutes!
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {/* NEW: Goal Selection Hub */}
        {stage === 'goalSelection' && (
          <GoalSelectionHub
            partner1={extractedData.partner1 || 'Partner 1'}
            partner2={extractedData.partner2 || 'Partner 2'}
            onSelectPath={handleGoalSelectionPath}
          />
        )}

        {/* NEW: Template Gallery */}
        {stage === 'templateGallery' && (
          <TemplateGallery
            onBack={() => setStage('goalSelection')}
            onComplete={handleTemplateComplete}
            onRefineWithLuna={handleTemplateRefineWithLuna}
          />
        )}

        {/* NEW: Custom Goal Creator */}
        {stage === 'customCreator' && (
          <CustomGoalCreator
            onBack={() => setStage('goalSelection')}
            onComplete={handleCustomGoalComplete}
          />
        )}

        {/* Loading Stage */}
        {stage === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Brain className="w-12 h-12 mx-auto mb-3 text-purple-500" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-800">Setting Up Your AI Assistant</h2>
                <p className="text-gray-600 mt-2">This will only take a moment...</p>
              </div>

              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-2 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3 }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {loadingSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.8 }}
                    className="flex items-center gap-3"
                  >
                    {step.done ? (
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <Loader className="w-6 h-6 animate-spin text-purple-500 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${step.done ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                      {step.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Detected Stage - BEAUTIFIED! */}
        {stage === 'detected' && (
          <motion.div
            key="detected"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen relative overflow-hidden"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
              <motion.div
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 20, repeat: Infinity }}
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)',
                  backgroundSize: '200% 200%'
                }}
              />
            </div>

            {/* Floating decorative elements */}
            <motion.div
              animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute top-20 left-10 text-6xl opacity-20"
            >
              💕
            </motion.div>
            <motion.div
              animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, delay: 1 }}
              className="absolute top-40 right-20 text-5xl opacity-20"
            >
              ✨
            </motion.div>
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 7, repeat: Infinity, delay: 2 }}
              className="absolute bottom-40 left-20 text-5xl opacity-20"
            >
              💫
            </motion.div>

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-4xl"
              >
                {/* Luna's Profile Card */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="glass-card-strong rounded-2xl glow-soft p-4 mb-4"
                >
                  <div className="flex items-center gap-4">
                    {/* Luna Avatar */}
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
                      <p className="text-sm" style={{color: '#2B2B2B', opacity: 0.6}}>Online • Ready to help you plan</p>
                    </div>

                    {/* Progress Indicator */}
                    <div className="text-right">
                      <p className="text-xs mb-1" style={{color: '#2B2B2B', opacity: 0.5}}>Progress</p>
                      <div className="flex gap-1">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: i < Math.floor(conversation.length / 2)
                                ? 'linear-gradient(135deg, #C084FC, #F8C6D0)'
                                : 'rgba(192, 132, 252, 0.2)'
                            }}
                            className={i < Math.floor(conversation.length / 2) ? 'glow-soft' : ''}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Location Banner */}
                  {location !== 'Default' && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="mt-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="text-2xl"
                        >
                          {locationData.flag}
                        </motion.span>
                        <span className="font-bold">Detected: {location}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-white/20 rounded-lg p-2 backdrop-blur">
                          <div className="font-semibold">Properties</div>
                          <div>{locationData.propertyPrice}</div>
                        </div>
                        <div className="bg-white/20 rounded-lg p-2 backdrop-blur">
                          <div className="font-semibold">Weddings</div>
                          <div>{locationData.weddingCost}</div>
                        </div>
                        <div className="bg-white/20 rounded-lg p-2 backdrop-blur">
                          <div className="font-semibold">Top Areas</div>
                          <div>{locationData.neighborhoods[0]}</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Chat Container */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card-strong rounded-2xl glow-soft overflow-hidden"
                  style={{ height: '500px', display: 'flex', flexDirection: 'column' }}
                >
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {conversation.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center mr-2 flex-shrink-0">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                        )}

                        <div className={`max-w-[75%] ${message.role === 'user' ? 'order-1' : ''}`}>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`p-4 rounded-2xl ${
                              message.role === 'user'
                                ? 'glass-button rounded-br-sm'
                                : 'glass-card rounded-bl-sm'
                            }`}
                            style={{
                              color: message.role === 'user' ? 'white' : '#2B2B2B'
                            }}
                          >
                            <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
                          </motion.div>
                          <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
                             style={{color: '#2B2B2B', opacity: 0.6}}>
                            {message.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center ml-2 flex-shrink-0">
                            <Heart className="w-4 h-4 text-white" fill="white" />
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {/* Luna Typing Indicator */}
                    {isLunaTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center pulse-glow">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                        <div className="glass-card rounded-2xl rounded-bl-sm p-4">
                          <div className="flex gap-1">
                            <motion.div
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                              className="w-2 h-2 bg-purple-300 rounded-full"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                              className="w-2 h-2 bg-pink-300 rounded-full"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                              className="w-2 h-2 bg-blue-300 rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Area */}
                  {!canCreateRoadmap ? (
                    <div className="p-4 glass-card-light border-t border-white/20">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          placeholder="Type your message or use voice..."
                          className="flex-1 px-4 py-3 glass-input rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            color: '#2B2B2B',
                            '::placeholder': { color: 'rgba(43, 43, 43, 0.5)' }
                          }}
                          autoFocus
                          disabled={isRecording || isLunaTyping}
                        />

                        {/* Voice Button */}
                        <motion.button
                          type="button"
                          onClick={handleVoiceToggle}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`p-3 rounded-xl font-semibold smooth-transition ${
                            isRecording
                              ? 'glass-button bg-red-500/30 text-white animate-pulse'
                              : 'glass-button text-white'
                          }`}
                        >
                          {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </motion.button>

                        {/* Send Button */}
                        <motion.button
                          type="submit"
                          whileHover={{ scale: isLunaTyping ? 1 : 1.05 }}
                          whileTap={{ scale: isLunaTyping ? 1 : 0.95 }}
                          disabled={!userInput.trim() || isLunaTyping}
                          className="px-6 py-3 glass-button text-white rounded-xl font-semibold smooth-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Send className="w-5 h-5" />
                          {isLunaTyping ? 'Thinking...' : 'Send'}
                        </motion.button>
                      </form>

                      {/* Recording Indicator */}
                      {isRecording && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 flex items-center gap-2 text-red-600 text-sm"
                        >
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-2 h-2 bg-red-600 rounded-full"
                          />
                          Recording... Speak now!
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 glass-card-light border-t border-white/20">
                      <motion.button
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleStartApp}
                        className="w-full py-4 glass-button text-white rounded-xl font-bold text-lg glow-strong shimmer flex items-center justify-center gap-3"
                      >
                        <Sparkles className="w-6 h-6 text-yellow-300" />
                        See Your Personalized Roadmap
                        <ArrowRight className="w-6 h-6" />
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
