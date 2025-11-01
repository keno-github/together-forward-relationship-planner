import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Brain, Sparkles, Target, Calendar, TrendingUp, Users, CheckCircle, ArrowRight, Loader, Mic, MicOff, Send } from 'lucide-react';
import { getLunaOnboardingResponse, extractUserDataFromConversation } from '../services/claudeAPI';

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

const LandingPage = ({ onComplete }) => {
  const [stage, setStage] = useState('hero'); // hero, pathChoice, loading, detected, onboarding
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
            setStage('detected');

            // Get Luna's intelligent opening from AI
            setIsLunaTyping(true);
            const openingMessage = await getLunaOnboardingResponse([], {
              location: mockLocation
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
      // Go straight to Luna chat (existing flow)
      setStage('loading');
    } else {
      // Go to compatibility assessment (new flow)
      // This will be handled by App.js routing
      onComplete({ chosenPath: 'compatibility', skipLuna: true });
    }
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

        // Enable roadmap creation if we have enough data
        if (extracted.partner1 && extracted.goals && extracted.goals.length > 0) {
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
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
                className="absolute text-pink-300 text-3xl opacity-20"
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
                  <Sparkles className="w-12 h-12 text-purple-500" />
                </motion.div>

                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                    Build Your Future
                  </span>
                  <br />
                  <span className="text-gray-800">Together</span>
                </h1>

                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Turn your relationship dreams into reality with AI-powered planning. Get personalized roadmaps, realistic budgets, and step-by-step guidance for every milestone.
                </p>

                {/* Trust Signals */}
                <div className="flex flex-wrap gap-4 mb-8 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>100% Free</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>No Signup Required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Takes 2 Minutes</span>
                  </div>
                </div>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-purple-300 transition-all flex items-center gap-3 mb-6"
                >
                  Start Planning Together
                  <ArrowRight className="w-5 h-5" />
                </motion.button>

                {/* Example Roadmap Preview - NEW! */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white/50 backdrop-blur rounded-xl p-4 border border-purple-200"
                >
                  <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    Example Roadmap Preview:
                  </p>
                  <div className="space-y-2">
                    {EXAMPLE_ROADMAP.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="flex items-center gap-3 text-sm bg-white rounded-lg p-2"
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{item.title}</div>
                          <div className="text-xs text-gray-500">{item.duration} • {item.cost}</div>
                        </div>
                        <CheckCircle className="w-4 h-4 text-green-500 opacity-50" />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Social Proof */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 flex items-center gap-2 text-gray-500"
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
                  className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 mb-2">AI-Powered Planning</h3>
                      <p className="text-gray-600 text-sm">Get personalized roadmaps based on your location, budget, and dreams.</p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature Card 2 */}
                <motion.div
                  whileHover={{ scale: 1.03, x: 10 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100"
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-pink-400 to-pink-600 p-3 rounded-xl">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 mb-2">Realistic Cost Breakdowns</h3>
                      <p className="text-gray-600 text-sm">No surprises! See minimum, typical, and maximum costs for every goal.</p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature Card 3 */}
                <motion.div
                  whileHover={{ scale: 1.03, x: 10 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100"
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-3 rounded-xl">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 mb-2">Step-by-Step Timelines</h3>
                      <p className="text-gray-600 text-sm">Break down big dreams into actionable monthly tasks you can actually complete.</p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature Card 4 */}
                <motion.div
                  whileHover={{ scale: 1.03, x: 10 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-green-100"
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 mb-2">Track Progress Together</h3>
                      <p className="text-gray-600 text-sm">Celebrate milestones, earn XP, and watch your relationship grow stronger.</p>
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
                  className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-4 mb-4 border border-white/50"
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
                      <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Luna - Your AI Planner
                      </h3>
                      <p className="text-sm text-gray-600">Online • Ready to help you plan</p>
                    </div>

                    {/* Progress Indicator */}
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Progress</p>
                      <div className="flex gap-1">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < Math.floor(conversation.length / 2)
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                                : 'bg-gray-300'
                            }`}
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
                  className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden"
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
                            className={`p-4 rounded-2xl shadow-lg ${
                              message.role === 'user'
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-sm'
                                : 'bg-gradient-to-br from-gray-50 to-white text-gray-800 border-2 border-purple-100 rounded-bl-sm'
                            }`}
                          >
                            <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
                          </motion.div>
                          <p className={`text-xs text-gray-500 mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
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
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-purple-100 rounded-2xl rounded-bl-sm p-4">
                          <div className="flex gap-1">
                            <motion.div
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                              className="w-2 h-2 bg-purple-400 rounded-full"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                              className="w-2 h-2 bg-pink-400 rounded-full"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                              className="w-2 h-2 bg-blue-400 rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Area */}
                  {!canCreateRoadmap ? (
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-purple-100">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          placeholder="Type your message or use voice..."
                          className="flex-1 px-4 py-3 bg-white border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                          autoFocus
                          disabled={isRecording || isLunaTyping}
                        />

                        {/* Voice Button */}
                        <motion.button
                          type="button"
                          onClick={handleVoiceToggle}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`p-3 rounded-xl font-semibold shadow-lg transition-all ${
                            isRecording
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
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
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-purple-100">
                      <motion.button
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleStartApp}
                        className="w-full py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-shadow flex items-center justify-center gap-3"
                      >
                        <Sparkles className="w-6 h-6" />
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
