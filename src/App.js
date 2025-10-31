import React, { useState, useEffect, useRef } from 'react';
import { Heart, MapPin, Calendar, Home, Briefcase, Plane, CheckCircle, Circle, ChevronRight, Plus, Trophy, Sparkles, AlertCircle, DollarSign, Clock, Edit2, X, GripVertical, Save, Trash2, Info, ChevronDown, MessageSquare, Paperclip, Eye, EyeOff, MoreVertical, Star, TrendingUp, Target, Zap, Bell, Menu, Settings, LogOut, User, ArrowRight, Award, Gift, Lightbulb, Play, Users, BarChart3, Shield, ChevronLeft, Loader2, Brain, Mic, Volume2, Send, Bot, Maximize2, AlertTriangle, BookOpen, FileText, TrendingDown } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';

const TogetherForward = () => {
  // ========== CONFIGURATION ==========
  const ANTHROPIC_API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY || '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';
  const USE_AI_GENERATOR = true;

  // ========== CORE STATE ==========
  const [step, setStep] = useState('loading');
  const [quizStep, setQuizStep] = useState(1);
  const [coupleData, setCoupleData] = useState({
    partner1: '',
    partner2: '',
    location1: '',
    location2: '',
    country1: '',
    country2: '',
    relationshipStatus: '',
    financialStatus: '',
    timeline: '24',
    goals: [],
    customGoals: [],
    detectedLocation: null
  });

  // ========== ENHANCED DEEP DIVE STATE ==========
  const [showConfetti, setShowConfetti] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);
  const [lunaMessage, setLunaMessage] = useState('');
  const [showLunaChat, setShowLunaChat] = useState(false);
  const [useVoiceOnboarding, setUseVoiceOnboarding] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [achievements, setAchievements] = useState([]);
  const [xpPoints, setXpPoints] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [selectedGoalForDeepDive, setSelectedGoalForDeepDive] = useState(null);
  const [deepDiveData, setDeepDiveData] = useState(null);
  const [isLoadingDeepDive, setIsLoadingDeepDive] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeDeepDiveTab, setActiveDeepDiveTab] = useState('overview');

  // ========== EXISTING STATE ==========
  const [roadmap, setRoadmap] = useState([]);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [customGoalInput, setCustomGoalInput] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [showNotes, setShowNotes] = useState({});
  const [showSystemTip, setShowSystemTip] = useState({});
  const [generatingAITasks, setGeneratingAITasks] = useState(false);
  const [aiGenerationProgress, setAiGenerationProgress] = useState('');
  const [aiError, setAiError] = useState(null);
  const [hiddenMilestones, setHiddenMilestones] = useState({});
  const [showEncouragement, setShowEncouragement] = useState(true);
  const [currentEncouragementIndex, setCurrentEncouragementIndex] = useState(0);

  // ========== REFS ==========
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // ========== LOCATION DETECTION ==========
  useEffect(() => {
    const detectLocation = async () => {
      setIsDetectingLocation(true);
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        const location = {
          city: data.city,
          country: data.country_name,
          countryCode: data.country_code,
          currency: data.currency
        };
        
        setDetectedLocation(location);
        setCoupleData(prev => ({
          ...prev,
          detectedLocation: location,
          location1: data.city,
          country1: data.country_name,
          location2: data.city,
          country2: data.country_name
        }));
        
        setLunaMessage(`🌍 Detected: ${data.city}, ${data.country_name}!`);
      } catch (error) {
        console.error('Location detection failed:', error);
        setDetectedLocation({ city: 'Unknown', country: 'Unknown' });
      } finally {
        setIsDetectingLocation(false);
        setTimeout(() => setStep('welcome'), 2000);
      }
    };

    detectLocation();
  }, []);

  // ========== VOICE RECOGNITION SETUP ==========
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setVoiceTranscript(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // ========== VOICE FUNCTIONS ==========
  const startListening = () => {
    if (recognitionRef.current) {
      setVoiceTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processVoiceOnboarding = async () => {
    if (!voiceTranscript || !voiceTranscript.trim()) {
      alert('Please record your story first!');
      return;
    }

    setGeneratingAITasks(true);
    setAiGenerationProgress('Processing your story...');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: `Extract relationship information from this voice transcript: "${voiceTranscript}"

Return a JSON object with this structure:
{
  "partner1": "name",
  "partner2": "name",
  "relationshipStatus": "dating|engaged|married",
  "goals": ["goal1", "goal2"],
  "timeline": "number of months",
  "financialStatus": "starting|stable|comfortable"
}

Be smart about inferring information. If not mentioned, make reasonable assumptions.`
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid API response format');
      }
      
      const content = data.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        
        setCoupleData(prev => ({
          ...prev,
          partner1: extracted.partner1 || prev.partner1,
          partner2: extracted.partner2 || prev.partner2,
          relationshipStatus: extracted.relationshipStatus || prev.relationshipStatus,
          financialStatus: extracted.financialStatus || prev.financialStatus,
          timeline: extracted.timeline || prev.timeline,
          customGoals: extracted.goals || []
        }));

        addAchievement('🎤 Voice Pioneer', 'Used voice onboarding', 50);
        triggerConfetti();
        
        setStep('quiz');
        setQuizStep(6);
      } else {
        throw new Error('Could not extract information from voice transcript');
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      
      let errorMessage = 'Failed to process voice. ';
      
      if (error.message.includes('API Error')) {
        errorMessage += 'There was a problem connecting to the AI service. Please check your API key and try again, or use traditional forms.';
      } else if (error.message.includes('Invalid API response')) {
        errorMessage += 'The AI service returned an unexpected response. Please try again, or use traditional forms.';
      } else if (error.message.includes('Could not extract')) {
        errorMessage += 'Could not understand the voice transcript. Please try speaking more clearly, or use traditional forms.';
      } else {
        errorMessage += 'Please try again or use traditional forms.';
      }
      
      alert(errorMessage);
      
      if (window.confirm('Would you like to use traditional forms instead?')) {
        setStep('quiz');
        setQuizStep(1);
      }
    } finally {
      setGeneratingAITasks(false);
      setAiGenerationProgress('');
    }
  };

  // ========== ACHIEVEMENT SYSTEM ==========
  const addAchievement = (title, description, xp) => {
    const newAchievement = {
      id: Date.now(),
      title,
      description,
      xp,
      timestamp: new Date()
    };
    setAchievements(prev => [...prev, newAchievement]);
    setXpPoints(prev => prev + xp);
    
    setLunaMessage(`🏆 ${title}! +${xp} XP`);
    setTimeout(() => setLunaMessage(''), 3000);
  };

  // ========== CONFETTI TRIGGER ==========
  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  // ========== ENHANCED DEEP DIVE MODAL WITH COMPREHENSIVE BREAKDOWN ==========
  const openDeepDive = async (goal) => {
    setSelectedGoalForDeepDive(goal);
    setIsLoadingDeepDive(true);
    setChatMessages([]);
    setActiveDeepDiveTab('overview');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 3000,
          messages: [{
            role: 'user',
            content: `Create a COMPREHENSIVE, DETAILED breakdown for this goal: "${goal.title || goal.name}"

Context:
- Partners: ${coupleData.partner1} and ${coupleData.partner2}
- Location: ${coupleData.location1}, ${coupleData.country1}
- Relationship Status: ${coupleData.relationshipStatus}
- Financial Situation: ${coupleData.financialStatus}
- Timeline: ${coupleData.timeline} months

Provide an extremely detailed analysis in JSON format with ALL of these fields:

{
  "overview": "3-4 sentence comprehensive summary of what this goal really involves",
  "realisticTimeline": "Realistic timeline with phases (e.g., 'Week 1-2: Research, Week 3-4: Applications, Month 2-3: Execution')",
  "totalCostBreakdown": {
    "minimum": number,
    "typical": number,
    "maximum": number,
    "currency": "EUR",
    "breakdown": [
      {"item": "Item name", "cost": number, "required": true/false, "notes": "explanation"}
    ]
  },
  "detailedSteps": [
    {"step": number, "title": "Step title", "description": "Detailed description", "duration": "time estimate", "difficulty": "easy|medium|hard"}
  ],
  "hiddenCosts": [
    {"cost": "Hidden cost name", "amount": number, "why": "Why people miss this"}
  ],
  "commonMistakes": [
    {"mistake": "What people do wrong", "impact": "What happens", "solution": "How to avoid"}
  ],
  "challenges": [
    {"challenge": "Challenge name", "likelihood": "high|medium|low", "solution": "How to overcome"}
  ],
  "expertTips": [
    {"category": "Category", "tip": "Specific actionable tip"}
  ],
  "locationSpecific": {
    "insights": "Detailed location-specific advice for ${coupleData.location1}, ${coupleData.country1}",
    "localCosts": "Local cost considerations",
    "culturalFactors": "Cultural or regional factors to consider",
    "resources": ["Local resources or organizations"]
  },
  "personalizedAdvice": "Specific advice based on their ${coupleData.relationshipStatus} status and ${coupleData.financialStatus} financial situation",
  "successMetrics": ["How to know you're on track"],
  "warningFlags": ["Red flags to watch out for"],
  "nextSteps": ["Immediate actions they should take"]
}

Make it EXTREMELY detailed and practical. Include real numbers, specific timeframes, and actionable advice.`
          }]
        })
      });

      const data = await response.json();
      const content = data.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const deepDive = JSON.parse(jsonMatch[0]);
        setDeepDiveData(deepDive);
        
        // Initialize chat with Luna's comprehensive intro
        setChatMessages([{
          role: 'assistant',
          content: `Hi! I'm Luna, your AI guide for "${goal.title || goal.name}". 

${deepDive.overview}

I've analyzed your specific situation (${coupleData.partner1} & ${coupleData.partner2} in ${coupleData.location1}) and created a comprehensive breakdown.

${deepDive.personalizedAdvice}

Feel free to ask me anything - I'm here to help! 💜`,
          timestamp: new Date()
        }]);

        addAchievement('🔍 Deep Dive', 'Explored goal details', 20);
      }
    } catch (error) {
      console.error('Deep dive error:', error);
      setDeepDiveData({
        overview: "I'm ready to help you with this goal!",
        detailedSteps: [{ step: 1, title: "Let's break this down together", description: "Ask me any questions!" }],
        expertTips: [{ category: "Getting Started", tip: "Feel free to ask specific questions about this goal" }]
      });
    } finally {
      setIsLoadingDeepDive(false);
    }
  };

  // ========== AI CHAT ==========
  const sendChatMessage = async () => {
    if (!chatInput.trim() || !selectedGoalForDeepDive) return;

    const userMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const conversationHistory = chatMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          messages: [
            ...conversationHistory,
            {
              role: 'user',
              content: `Context: We're discussing "${selectedGoalForDeepDive.title || selectedGoalForDeepDive.name}" for ${coupleData.partner1} and ${coupleData.partner2} in ${coupleData.location1}, ${coupleData.country1}.

Relationship: ${coupleData.relationshipStatus}
Financial: ${coupleData.financialStatus}
Timeline: ${coupleData.timeline} months

User question: ${chatInput}

Respond as Luna, a friendly, encouraging AI relationship planning assistant. Be:
- Specific and actionable
- Encouraging but realistic
- Tailored to their situation
- Include numbers and timeframes when relevant
- Address concerns directly`
            }
          ]
        })
      });

      const data = await response.json();
      const aiMessage = {
        role: 'assistant',
        content: data.content[0].text,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
      
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again!",
        timestamp: new Date()
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // ========== AI TASK GENERATION ==========
  const generateAITasks = async (goalName, goalContext = {}) => {
    if (!USE_AI_GENERATOR || !ANTHROPIC_API_KEY) {
      return generateFallbackTasks(goalName);
    }

    setGeneratingAITasks(true);
    setAiGenerationProgress('Connecting to AI...');
    setAiError(null);

    try {
      setAiGenerationProgress('Analyzing your goal...');

      const prompt = `You are Luna, an AI relationship planning assistant. Generate a detailed, actionable task list for: "${goalName}"

Context:
- Partner 1: ${coupleData.partner1}, Location: ${coupleData.location1}, ${coupleData.country1}
- Partner 2: ${coupleData.partner2}, Location: ${coupleData.location2}, ${coupleData.country2}
- Relationship: ${coupleData.relationshipStatus}
- Financial: ${coupleData.financialStatus}
- Timeline: ${coupleData.timeline} months

Generate 8-12 specific, actionable tasks. Return ONLY valid JSON:
[
  {
    "title": "Task description",
    "estimatedCost": 500,
    "priority": "high|medium|low",
    "duration": "2-3 weeks",
    "notes": "Why important"
  }
]`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      const content = data.content[0].text;
      
      let tasksData;
      try {
        tasksData = JSON.parse(content);
      } catch (e) {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          tasksData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse JSON');
        }
      }

      const tasks = tasksData.map((task, index) => ({
        id: `ai-task-${Date.now()}-${index}`,
        title: task.title,
        completed: false,
        estimatedCost: task.estimatedCost || 0,
        priority: task.priority || 'medium',
        duration: task.duration || '',
        note: task.notes || '',
        subtasks: [],
        aiGenerated: true
      }));

      setGeneratingAITasks(false);
      return tasks;

    } catch (error) {
      console.error('AI Task Generation Error:', error);
      setAiError(error.message);
      setGeneratingAITasks(false);
      return generateFallbackTasks(goalName);
    }
  };

  const generateFallbackTasks = (goalName) => {
    return [
      { id: `t1-${Date.now()}`, title: `Research and plan for: ${goalName}`, completed: false, subtasks: [], estimatedCost: 0 },
      { id: `t2-${Date.now()}`, title: 'Set a realistic budget', completed: false, subtasks: [], estimatedCost: 0 },
      { id: `t3-${Date.now()}`, title: 'Create a timeline together', completed: false, subtasks: [], estimatedCost: 0 },
      { id: `t4-${Date.now()}`, title: 'Break down into smaller steps', completed: false, subtasks: [], estimatedCost: 0 },
      { id: `t5-${Date.now()}`, title: 'Take the first action', completed: false, subtasks: [], estimatedCost: 0 }
    ];
  };

  // ========== GENERATE ROADMAP ==========
  const generateRoadmap = async () => {
    setGeneratingAITasks(true);
    setAiGenerationProgress('Creating your personalized roadmap...');

    const newRoadmap = [];
    const selectedGoalObjects = coupleData.goals.map(goalId => 
      availableGoals.find(g => g.id === goalId)
    ).filter(Boolean);

    for (const [index, goal] of selectedGoalObjects.entries()) {
      let milestone = createMilestoneFromGoal(goal, index);
      if (milestone) newRoadmap.push(milestone);
    }

    if (coupleData.customGoals.length > 0) {
      setAiGenerationProgress(`Generating AI tasks for ${coupleData.customGoals.length} custom goal(s)...`);
      
      for (const [index, customGoal] of coupleData.customGoals.entries()) {
        setAiGenerationProgress(`AI is working on: "${customGoal}"...`);
        const aiTasks = await generateAITasks(customGoal);
        
        newRoadmap.push({
          id: `custom-${index}`,
          title: customGoal,
          description: `${coupleData.partner1} and ${coupleData.partner2}'s custom goal`,
          iconName: 'Sparkles',
          color: 'bg-indigo-500',
          duration: '6-12 months',
          estimatedCost: aiTasks.reduce((sum, task) => sum + (task.estimatedCost || 0), 0),
          tasks: aiTasks,
          budgetCategories: [],
          aiGenerated: true
        });
      }
    }

    setRoadmap(newRoadmap);
    setGeneratingAITasks(false);
    setAiGenerationProgress('');
    
    addAchievement('🚀 Roadmap Created', 'Generated your personalized roadmap', 100);
    triggerConfetti();
    
    setStep('roadmap');
  };

  const createMilestoneFromGoal = (goal, index) => {
    const baseMilestone = {
      id: `milestone-${index}`,
      title: goal.name,
      description: `${coupleData.partner1} and ${coupleData.partner2}: ${goal.description}`,
      iconName: goal.icon,
      color: goal.color,
      duration: '6-12 months',
      estimatedCost: 5000,
      tasks: [],
      budgetCategories: []
    };

    switch(goal.id) {
      case 'move-together':
        return {
          ...baseMilestone,
          estimatedCost: 5000,
          tasks: [
            { id: 't1', title: 'Research neighborhoods together', completed: false, subtasks: [] },
            { id: 't2', title: 'Set moving budget', completed: false, subtasks: [] },
            { id: 't3', title: 'Start apartment hunting', completed: false, subtasks: [] }
          ]
        };
      case 'get-married':
        return {
          ...baseMilestone,
          estimatedCost: 15000,
          tasks: [
            { id: 't1', title: 'Set wedding date', completed: false, subtasks: [] },
            { id: 't2', title: 'Book venue', completed: false, subtasks: [] },
            { id: 't3', title: 'Create guest list', completed: false, subtasks: [] }
          ]
        };
      case 'buy-house':
        return {
          ...baseMilestone,
          estimatedCost: 50000,
          tasks: [
            { id: 't1', title: 'Improve credit scores', completed: false, subtasks: [] },
            { id: 't2', title: 'Save for down payment', completed: false, subtasks: [] },
            { id: 't3', title: 'Get pre-approved for mortgage', completed: false, subtasks: [] }
          ]
        };
      default:
        return baseMilestone;
    }
  };

  // ========== AVAILABLE GOALS ==========
  const availableGoals = [
    { id: 'move-together', name: 'Move in Together', icon: 'Home', color: 'bg-blue-500', description: 'Find and set up your first home together' },
    { id: 'get-married', name: 'Get Married', icon: 'Heart', color: 'bg-pink-500', description: 'Plan your dream wedding' },
    { id: 'buy-house', name: 'Buy a House', icon: 'Home', color: 'bg-green-500', description: 'Purchase your forever home' },
    { id: 'travel', name: 'Travel Together', icon: 'Plane', color: 'bg-purple-500', description: 'Explore the world as a couple' },
    { id: 'start-business', name: 'Start a Business', icon: 'Briefcase', color: 'bg-orange-500', description: 'Build something together' },
    { id: 'emergency-fund', name: 'Build Emergency Fund', icon: 'DollarSign', color: 'bg-yellow-500', description: 'Create financial security' }
  ];

  const getIconComponent = (iconName) => {
    const icons = {
      'Heart': Heart,
      'Home': Home,
      'Briefcase': Briefcase,
      'Plane': Plane,
      'Sparkles': Sparkles,
      'DollarSign': DollarSign,
      'Trophy': Trophy,
      'Calendar': Calendar,
      'MapPin': MapPin
    };
    return icons[iconName] || Heart;
  };

  const toggleGoalSelection = (goalId) => {
    setCoupleData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(id => id !== goalId)
        : [...prev.goals, goalId]
    }));
  };

  const addCustomGoal = () => {
    if (customGoalInput.trim()) {
      setCoupleData(prev => ({
        ...prev,
        customGoals: [...prev.customGoals, customGoalInput.trim()]
      }));
      setCustomGoalInput('');
    }
  };

  const removeCustomGoal = (index) => {
    setCoupleData(prev => ({
      ...prev,
      customGoals: prev.customGoals.filter((_, i) => i !== index)
    }));
  };

  // ========== LOADING SCREEN ==========
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ 
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + 100,
                opacity: 0 
              }}
              animate={{ 
                y: -100,
                opacity: [0, 1, 1, 0],
                rotate: 360
              }}
              transition={{ 
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.3
              }}
            >
              <Heart 
                className="text-white" 
                size={20 + Math.random() * 30}
                fill="currentColor"
              />
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full mx-4 text-center relative z-10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Brain className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text mb-4">
            Welcome to TogetherForward
          </h1>

          <p className="text-gray-600 mb-6">
            🧠 AI is getting ready for you...
          </p>

          <div className="space-y-3 text-left mb-6">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">Connecting to AI brain</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">Loading relationship insights</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isDetectingLocation ? 0.5 : 1, x: 0 }}
              transition={{ delay: 0.9 }}
            >
              {isDetectingLocation ? (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              <span className="text-sm text-gray-600">
                {isDetectingLocation ? 'Detecting your location... 🌍' : `Detected: ${detectedLocation?.city}, ${detectedLocation?.country}`}
              </span>
            </motion.div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2 }}
            />
          </div>

          {lunaMessage && (
            <motion.p 
              className="mt-4 text-sm font-medium text-purple-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {lunaMessage}
            </motion.p>
          )}
        </motion.div>
      </div>
    );
  }

  // ========== WELCOME SCREEN ==========
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 relative overflow-hidden">
        {showConfetti && <Confetti />}
        
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-32 h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
              >
                <Bot className="w-16 h-16 text-white" />
              </motion.div>

              <h1 className="text-4xl font-bold text-gray-800 mb-3">
                👋 Hi! I'm Luna
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Your AI Relationship Planning Assistant
              </p>

              {detectedLocation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-6 border-2 border-green-200"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <p className="font-bold text-green-800">
                      🌍 Detected: {detectedLocation.city}, {detectedLocation.country}!
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    I already know about your area and can give you location-specific advice!
                  </p>
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                <div className="bg-purple-50 rounded-xl p-4">
                  <Sparkles className="w-6 h-6 text-purple-500 mb-2" />
                  <p className="text-sm font-medium text-gray-800">Guide you through every step</p>
                </div>
                <div className="bg-pink-50 rounded-xl p-4">
                  <Lightbulb className="w-6 h-6 text-pink-500 mb-2" />
                  <p className="text-sm font-medium text-gray-800">Give you expert advice</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <Target className="w-6 h-6 text-blue-500 mb-2" />
                  <p className="text-sm font-medium text-gray-800">Keep you on track</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <Trophy className="w-6 h-6 text-green-500 mb-2" />
                  <p className="text-sm font-medium text-gray-800">Celebrate your wins</p>
                </div>
              </div>

              <p className="text-gray-600 mb-8">
                Think of me as your personal relationship coach who never sleeps! 💜
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    setUseVoiceOnboarding(true);
                    setStep('voice-intro');
                  }}
                  className="w-full px-8 py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                  <Mic className="w-6 h-6" />
                  🎤 Tell Me Your Story (Recommended!)
                </button>

                <button
                  onClick={() => {
                    setUseVoiceOnboarding(false);
                    setStep('quiz');
                  }}
                  className="w-full px-8 py-5 bg-white border-2 border-gray-300 text-gray-700 rounded-2xl font-medium text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                  ⌨️ Use Traditional Forms
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-6">
                💡 Voice is faster and more natural!
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-pink-500 mb-2">10K+</div>
              <p className="text-gray-600 text-sm">Couples Planning Together</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">€2.5M+</div>
              <p className="text-gray-600 text-sm">Savings Tracked</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">98%</div>
              <p className="text-gray-600 text-sm">Satisfaction Rate</p>
            </div>
          </motion.div>
        </div>

        <style jsx>{`
          @keyframes blob {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
      </div>
    );
  }

  // ========== VOICE ONBOARDING SCREEN ==========
  if (step === 'voice-intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-8"
          >
            <div className="text-center mb-8">
              <motion.div
                animate={{ scale: isListening ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 0.5, repeat: isListening ? Infinity : 0 }}
                className={`w-32 h-32 ${isListening ? 'bg-red-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'} rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl`}
              >
                {isListening ? (
                  <Volume2 className="w-16 h-16 text-white animate-pulse" />
                ) : (
                  <Mic className="w-16 h-16 text-white" />
                )}
              </motion.div>

              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                {isListening ? '🎤 Listening...' : 'Ready to Share Your Story?'}
              </h2>
              <p className="text-gray-600 mb-6">
                {isListening 
                  ? 'Go ahead, I\'m all ears! Tell me about you and your partner...'
                  : 'Just speak naturally! Tell me your names, your story, and what you want to achieve together.'}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {!isListening ? (
                <button
                  onClick={startListening}
                  className="w-full px-8 py-5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                  <Mic className="w-6 h-6" />
                  🔴 Start Recording
                </button>
              ) : (
                <button
                  onClick={stopListening}
                  className="w-full px-8 py-5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                  <X className="w-6 h-6" />
                  ⏹ Stop & Process
                </button>
              )}
            </div>

            {voiceTranscript && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-purple-50 rounded-2xl p-6 mb-6 border-2 border-purple-200"
              >
                <p className="text-sm font-medium text-purple-800 mb-2">What I'm hearing:</p>
                <p className="text-gray-700 italic">"{voiceTranscript}"</p>
              </motion.div>
            )}

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-blue-800 mb-2">💡 Tips for best results:</p>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li>• Speak clearly and at a normal pace</li>
                <li>• Mention both your names</li>
                <li>• Share what goals you want to achieve</li>
                <li>• Tell me your timeline (e.g., "in 2 years")</li>
              </ul>
            </div>

            {voiceTranscript && voiceTranscript.trim() && !isListening && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={processVoiceOnboarding}
                disabled={generatingAITasks}
                className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingAITasks ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Brain className="w-6 h-6" />
                    ✨ Process My Story
                  </>
                )}
              </motion.button>
            )}

            <button
              onClick={() => setStep('welcome')}
              className="w-full mt-4 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Luna
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ========== QUIZ - CONTINUING FROM ORIGINAL CODE ==========
  if (step === 'quiz') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Step {quizStep} of 6</span>
              <span className="text-sm font-medium text-gray-600">{Math.round((quizStep / 6) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-pink-500 to-purple-500 h-3 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${(quizStep / 6) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <motion.div
            key={quizStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
          >
            {quizStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Let's Start With Your Names</h2>
                  <p className="text-gray-600">Tell me who's on this journey together</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Partner 1 Name</label>
                    <input
                      type="text"
                      value={coupleData.partner1}
                      onChange={(e) => setCoupleData({...coupleData, partner1: e.target.value})}
                      placeholder="Enter first partner's name"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-lg"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Partner 2 Name</label>
                    <input
                      type="text"
                      value={coupleData.partner2}
                      onChange={(e) => setCoupleData({...coupleData, partner2: e.target.value})}
                      placeholder="Enter second partner's name"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-lg"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setStep('welcome')}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium flex items-center gap-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (coupleData.partner1 && coupleData.partner2) {
                        setQuizStep(2);
                      }
                    }}
                    disabled={!coupleData.partner1 || !coupleData.partner2}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {quizStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">What's Your Relationship Status?</h2>
                  <p className="text-gray-600">This helps us tailor advice for your journey</p>
                </div>

                <div className="grid gap-4">
                  {[
                    { value: 'dating', label: '💕 Dating', desc: 'We\'re in a committed relationship' },
                    { value: 'engaged', label: '💍 Engaged', desc: 'We\'re planning to get married' },
                    { value: 'married', label: '👰 Married', desc: 'We\'re already married' },
                  ].map(option => (
                    <motion.button
                      key={option.value}
                      onClick={() => setCoupleData({...coupleData, relationshipStatus: option.value})}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-6 border-2 rounded-xl text-left transition-all ${
                        coupleData.relationshipStatus === option.value
                          ? 'border-pink-500 bg-pink-50 shadow-lg'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg mb-1">{option.label}</h3>
                          <p className="text-sm text-gray-600">{option.desc}</p>
                        </div>
                        {coupleData.relationshipStatus === option.value && (
                          <CheckCircle className="w-6 h-6 text-pink-500" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setQuizStep(1)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium flex items-center gap-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (coupleData.relationshipStatus) {
                        setQuizStep(3);
                      }
                    }}
                    disabled={!coupleData.relationshipStatus}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {quizStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">How's Your Financial Situation?</h2>
                  <p className="text-gray-600">This helps us create realistic budgets</p>
                </div>

                <div className="grid gap-4">
                  {[
                    { value: 'starting', label: '🌱 Starting Out', desc: 'Just beginning our financial journey' },
                    { value: 'stable', label: '💪 Stable', desc: 'We have steady income and some savings' },
                    { value: 'comfortable', label: '🌟 Comfortable', desc: 'We have good savings and financial flexibility' },
                  ].map(option => (
                    <motion.button
                      key={option.value}
                      onClick={() => setCoupleData({...coupleData, financialStatus: option.value})}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-6 border-2 rounded-xl text-left transition-all ${
                        coupleData.financialStatus === option.value
                          ? 'border-green-500 bg-green-50 shadow-lg'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg mb-1">{option.label}</h3>
                          <p className="text-sm text-gray-600">{option.desc}</p>
                        </div>
                        {coupleData.financialStatus === option.value && (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setQuizStep(2)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium flex items-center gap-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (coupleData.financialStatus) {
                        setQuizStep(4);
                      }
                    }}
                    disabled={!coupleData.financialStatus}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
            
            {quizStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">What Are Your Goals?</h2>
                  <p className="text-gray-600">Select all the goals you want to achieve together</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {availableGoals.map(goal => {
                    const IconComponent = getIconComponent(goal.icon);
                    const isSelected = coupleData.goals.includes(goal.id);
                    
                    return (
                      <motion.button
                        key={goal.id}
                        onClick={() => toggleGoalSelection(goal.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-6 border-2 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-50 shadow-lg'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`${goal.color} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 mb-1">{goal.name}</h3>
                            <p className="text-sm text-gray-600">{goal.description}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeepDive(goal);
                              }}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Info className="w-3 h-3" />
                              Learn More
                            </button>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="border-t pt-6">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 mb-4 border-2 border-purple-200">
                    <div className="flex items-start gap-3">
                      <Brain className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-purple-900 mb-1">✨ AI-Powered Custom Goals</h4>
                        <p className="text-sm text-purple-700">
                          Add your own goals and our AI will generate personalized, actionable tasks!
                        </p>
                      </div>
                    </div>
                  </div>

                  <label className="block text-sm font-medium text-gray-700 mb-3">Add Custom Goals (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customGoalInput}
                      onChange={(e) => setCustomGoalInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomGoal()}
                      placeholder="e.g., Start a family, Learn a new language together"
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      onClick={addCustomGoal}
                      className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 font-medium flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add
                    </button>
                  </div>

                  {coupleData.customGoals.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {coupleData.customGoals.map((goal, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border-2 border-indigo-200"
                        >
                          <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-indigo-600" />
                            <span className="text-gray-700 font-medium">{goal}</span>
                            <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                              AI will generate tasks
                            </span>
                          </div>
                          <button
                            onClick={() => removeCustomGoal(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setQuizStep(3)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium flex items-center gap-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (coupleData.goals.length > 0 || coupleData.customGoals.length > 0) {
                        setQuizStep(5);
                      }
                    }}
                    disabled={coupleData.goals.length === 0 && coupleData.customGoals.length === 0}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {quizStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Let's Review Everything</h2>
                  <p className="text-gray-600">Make sure everything looks good before we continue</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-pink-50 rounded-xl p-4 border-2 border-pink-200">
                    <h3 className="font-bold text-pink-900 mb-2">👥 Partners</h3>
                    <p className="text-pink-800">{coupleData.partner1} & {coupleData.partner2}</p>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                    <h3 className="font-bold text-purple-900 mb-2">💕 Status</h3>
                    <p className="text-purple-800 capitalize">{coupleData.relationshipStatus}</p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                    <h3 className="font-bold text-green-900 mb-2">💰 Financial Situation</h3>
                    <p className="text-green-800 capitalize">{coupleData.financialStatus}</p>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                    <h3 className="font-bold text-blue-900 mb-3">🎯 Selected Goals</h3>
                    <div className="space-y-2">
                      {coupleData.goals.map(goalId => {
                        const goal = availableGoals.find(g => g.id === goalId);
                        return (
                          <div key={goalId} className="flex items-center gap-2 text-blue-800">
                            <CheckCircle className="w-4 h-4" />
                            <span>{goal?.name}</span>
                          </div>
                        );
                      })}
                      {coupleData.customGoals.map((goal, i) => (
                        <div key={i} className="flex items-center gap-2 text-indigo-800">
                          <Brain className="w-4 h-4" />
                          <span>{goal}</span>
                          <span className="text-xs bg-indigo-100 px-2 py-0.5 rounded-full">Custom</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setQuizStep(4)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium flex items-center gap-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    onClick={() => setQuizStep(6)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:shadow-lg font-medium flex items-center justify-center gap-2"
                  >
                    Looks Good!
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {quizStep === 6 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">What's Your Timeline?</h2>
                  <p className="text-gray-600">How long do you want to achieve all your goals?</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: '12', label: '1 Year' },
                      { value: '24', label: '2 Years' },
                      { value: '36', label: '3 Years' },
                      { value: '48', label: '4 Years' },
                    ].map(option => (
                      <motion.button
                        key={option.value}
                        onClick={() => setCoupleData({...coupleData, timeline: option.value})}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-6 border-2 rounded-xl font-bold text-lg transition-all ${
                          coupleData.timeline === option.value
                            ? 'border-yellow-500 bg-yellow-50 text-yellow-700 shadow-lg'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {option.label}
                      </motion.button>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Or enter a custom timeline (in months):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={coupleData.timeline}
                        onChange={(e) => setCoupleData({...coupleData, timeline: e.target.value})}
                        placeholder="Enter months (e.g., 18)"
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                      <div className="flex items-center px-4 py-3 bg-gray-100 rounded-xl text-gray-600 font-medium">
                        months
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Tip: Most couples plan for 12-48 months (1-4 years)
                    </p>
                  </div>
                </div>

                {coupleData.customGoals.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200"
                  >
                    <div className="flex items-start gap-3">
                      <Brain className="w-8 h-8 text-purple-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-purple-900 text-lg mb-2">🚀 AI Magic Happening Next!</h4>
                        <p className="text-sm text-purple-700 mb-3">
                          You have {coupleData.customGoals.length} custom goal{coupleData.customGoals.length > 1 ? 's' : ''}. 
                          Our AI will analyze your situation and generate personalized tasks!
                        </p>
                        <p className="text-xs text-purple-600 italic">
                          ⏱️ This usually takes 5-15 seconds per goal
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setQuizStep(5)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium flex items-center gap-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                  </button>
                  <motion.button
                    onClick={generateRoadmap}
                    disabled={!coupleData.timeline || generatingAITasks}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white rounded-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center gap-2"
                  >
                    {generatingAITasks ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6" />
                        Generate My Roadmap ✨
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <AnimatePresence>
          {generatingAITasks && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white rounded-3xl max-w-md w-full p-8 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Brain className="w-10 h-10 text-white" />
                </motion.div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-2">AI is Working Magic ✨</h3>
                <p className="text-gray-600 mb-6">
                  {aiGenerationProgress || 'Creating your personalized roadmap...'}
                </p>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <motion.div
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full"
                    animate={{ width: ["0%", "70%", "90%"] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </div>

                <p className="text-xs text-gray-500">This usually takes 5-15 seconds per goal</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ========== COMPREHENSIVE DEEP DIVE MODAL ==========
  const DeepDiveModal = () => {
    if (!selectedGoalForDeepDive) return null;

    const Icon = getIconComponent(selectedGoalForDeepDive.icon || selectedGoalForDeepDive.iconName);

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setSelectedGoalForDeepDive(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col my-8"
          >
            {/* Header */}
            <div className={`${selectedGoalForDeepDive.color || 'bg-purple-500'} p-6 text-white relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}></div>
              </div>
              <div className="relative z-10 flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{selectedGoalForDeepDive.title || selectedGoalForDeepDive.name}</h2>
                    <p className="text-white text-opacity-90 mt-1">{selectedGoalForDeepDive.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedGoalForDeepDive(null)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'overview', label: '📋 Overview', icon: FileText },
                  { id: 'costs', label: '💰 Costs', icon: DollarSign },
                  { id: 'steps', label: '📝 Steps', icon: Target },
                  { id: 'tips', label: '💡 Tips', icon: Lightbulb },
                  { id: 'challenges', label: '⚠️ Challenges', icon: AlertTriangle },
                  { id: 'chat', label: '💬 Chat', icon: Bot },
                ].map(tab => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveDeepDiveTab(tab.id)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                        activeDeepDiveTab === tab.id
                          ? 'bg-white text-purple-600 shadow-lg'
                          : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                      }`}
                    >
                      <TabIcon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingDeepDive ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <Loader2 className="w-16 h-16 text-purple-500 animate-spin mb-4" />
                  <p className="text-gray-600">Luna is analyzing your situation...</p>
                </div>
              ) : deepDiveData ? (
                <>
                  {/* Overview Tab */}
                  {activeDeepDiveTab === 'overview' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                        <h3 className="font-bold text-blue-900 text-xl mb-3 flex items-center gap-2">
                          <BookOpen className="w-6 h-6" />
                          What This Really Means
                        </h3>
                        <p className="text-blue-800 text-lg leading-relaxed">{deepDiveData.overview}</p>
                      </div>

                      {deepDiveData.personalizedAdvice && (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                          <h3 className="font-bold text-purple-900 text-xl mb-3 flex items-center gap-2">
                            <Users className="w-6 h-6" />
                            Personalized for You
                          </h3>
                          <p className="text-purple-800 leading-relaxed">{deepDiveData.personalizedAdvice}</p>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-6 h-6 text-green-600" />
                            <h4 className="font-bold text-green-900 text-lg">Timeline</h4>
                          </div>
                          <p className="text-green-800 whitespace-pre-line">{deepDiveData.realisticTimeline}</p>
                        </div>

                        {deepDiveData.locationSpecific && (
                          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 border-2 border-yellow-200">
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin className="w-6 h-6 text-yellow-600" />
                              <h4 className="font-bold text-yellow-900 text-lg">Local Info</h4>
                            </div>
                            <p className="text-yellow-800">{deepDiveData.locationSpecific.insights}</p>
                          </div>
                        )}
                      </div>

                      {deepDiveData.nextSteps && deepDiveData.nextSteps.length > 0 && (
                        <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-6 border-2 border-pink-200">
                          <h3 className="font-bold text-pink-900 text-xl mb-4 flex items-center gap-2">
                            <Zap className="w-6 h-6" />
                            Start Here
                          </h3>
                          <div className="space-y-3">
                            {deepDiveData.nextSteps.map((step, i) => (
                              <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm">
                                <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                  {i + 1}
                                </div>
                                <p className="text-gray-800 font-medium flex-1">{step}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Costs Tab */}
                  {activeDeepDiveTab === 'costs' && deepDiveData.totalCostBreakdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
                          <p className="text-blue-700 text-sm mb-2">Minimum</p>
                          <p className="text-3xl font-bold text-blue-900">
                            {deepDiveData.totalCostBreakdown.currency}€{deepDiveData.totalCostBreakdown.minimum?.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-300 shadow-lg">
                          <p className="text-green-700 text-sm mb-2">Typical</p>
                          <p className="text-3xl font-bold text-green-900">
                            {deepDiveData.totalCostBreakdown.currency}€{deepDiveData.totalCostBreakdown.typical?.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border-2 border-red-200">
                          <p className="text-red-700 text-sm mb-2">Maximum</p>
                          <p className="text-3xl font-bold text-red-900">
                            {deepDiveData.totalCostBreakdown.currency}€{deepDiveData.totalCostBreakdown.maximum?.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {deepDiveData.totalCostBreakdown.breakdown && (
                        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                          <h3 className="font-bold text-gray-900 text-xl mb-4">Detailed Cost Breakdown</h3>
                          <div className="space-y-3">
                            {deepDiveData.totalCostBreakdown.breakdown.map((item, i) => (
                              <div key={i} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-bold text-gray-800">{item.item}</p>
                                    {item.required && (
                                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                        Required
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">{item.notes}</p>
                                </div>
                                <p className="font-bold text-gray-900 text-lg ml-4">€{item.cost?.toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {deepDiveData.hiddenCosts && deepDiveData.hiddenCosts.length > 0 && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-300">
                          <h3 className="font-bold text-yellow-900 text-xl mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6" />
                            Hidden Costs (Don't Get Surprised!)
                          </h3>
                          <div className="space-y-3">
                            {deepDiveData.hiddenCosts.map((hidden, i) => (
                              <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="flex items-start justify-between mb-2">
                                  <p className="font-bold text-gray-800">{hidden.cost}</p>
                                  <p className="font-bold text-orange-600">+€{hidden.amount?.toLocaleString()}</p>
                                </div>
                                <p className="text-sm text-gray-600">{hidden.why}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {deepDiveData.locationSpecific?.localCosts && (
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200">
                          <h3 className="font-bold text-purple-900 text-xl mb-3 flex items-center gap-2">
                            <MapPin className="w-6 h-6" />
                            Local Cost Considerations
                          </h3>
                          <p className="text-purple-800">{deepDiveData.locationSpecific.localCosts}</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Steps Tab */}
                  {activeDeepDiveTab === 'steps' && deepDiveData.detailedSteps && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {deepDiveData.detailedSteps.map((stepItem, i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-blue-300 transition-all hover:shadow-lg">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                              {stepItem.step}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-bold text-gray-900 text-lg">{stepItem.title}</h4>
                                <div className="flex gap-2">
                                  {stepItem.difficulty && (
                                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                                      stepItem.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                      stepItem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {stepItem.difficulty.toUpperCase()}
                                    </span>
                                  )}
                                  {stepItem.duration && (
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {stepItem.duration}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-gray-700 leading-relaxed">{stepItem.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* Tips Tab */}
                  {activeDeepDiveTab === 'tips' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {deepDiveData.expertTips && deepDiveData.expertTips.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="font-bold text-gray-900 text-2xl flex items-center gap-2">
                            <Lightbulb className="w-7 h-7 text-yellow-500" />
                            Expert Tips
                          </h3>
                          {deepDiveData.expertTips.map((tip, i) => (
                            <div key={i} className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border-2 border-yellow-200 hover:shadow-lg transition-all">
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Lightbulb className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-yellow-900 mb-2">{tip.category}</h4>
                                  <p className="text-yellow-800">{tip.tip}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {deepDiveData.commonMistakes && deepDiveData.commonMistakes.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="font-bold text-gray-900 text-2xl flex items-center gap-2">
                            <AlertTriangle className="w-7 h-7 text-red-500" />
                            Avoid These Mistakes
                          </h3>
                          {deepDiveData.commonMistakes.map((mistake, i) => (
                            <div key={i} className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-200">
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <X className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-red-900 mb-2">❌ {mistake.mistake}</h4>
                                  <p className="text-red-800 mb-3">
                                    <span className="font-medium">Impact:</span> {mistake.impact}
                                  </p>
                                  <div className="bg-green-100 rounded-xl p-3 border-2 border-green-200">
                                    <p className="text-green-800">
                                      <span className="font-bold">✅ Solution:</span> {mistake.solution}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {deepDiveData.successMetrics && deepDiveData.successMetrics.length > 0 && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                          <h3 className="font-bold text-green-900 text-xl mb-4 flex items-center gap-2">
                            <Target className="w-6 h-6" />
                            How to Know You're On Track
                          </h3>
                          <div className="space-y-2">
                            {deepDiveData.successMetrics.map((metric, i) => (
                              <div key={i} className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <p className="text-green-800">{metric}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Challenges Tab */}
                  {activeDeepDiveTab === 'challenges' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {deepDiveData.challenges && deepDiveData.challenges.length > 0 && (
                        <div className="space-y-4">
                          {deepDiveData.challenges.map((challenge, i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all">
                              <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  challenge.likelihood === 'high' ? 'bg-red-500' :
                                  challenge.likelihood === 'medium' ? 'bg-yellow-500' :
                                  'bg-blue-500'
                                }`}>
                                  <AlertTriangle className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-3">
                                    <h4 className="font-bold text-gray-900 text-lg">{challenge.challenge}</h4>
                                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                                      challenge.likelihood === 'high' ? 'bg-red-100 text-red-700' :
                                      challenge.likelihood === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {challenge.likelihood.toUpperCase()} LIKELIHOOD
                                    </span>
                                  </div>
                                  <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                                    <p className="text-green-800">
                                      <span className="font-bold">💡 How to overcome:</span> {challenge.solution}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {deepDiveData.warningFlags && deepDiveData.warningFlags.length > 0 && (
                        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border-2 border-red-300">
                          <h3 className="font-bold text-red-900 text-xl mb-4 flex items-center gap-2">
                            <Shield className="w-6 h-6" />
                            Red Flags to Watch For
                          </h3>
                          <div className="space-y-2">
                            {deepDiveData.warningFlags.map((flag, i) => (
                              <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-4">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-red-800">{flag}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {deepDiveData.locationSpecific?.culturalFactors && (
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200">
                          <h3 className="font-bold text-purple-900 text-xl mb-3 flex items-center gap-2">
                            <MapPin className="w-6 h-6" />
                            Cultural & Regional Factors
                          </h3>
                          <p className="text-purple-800">{deepDiveData.locationSpecific.culturalFactors}</p>
                        </div>
                      )}

                      {deepDiveData.locationSpecific?.resources && deepDiveData.locationSpecific.resources.length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                          <h3 className="font-bold text-blue-900 text-xl mb-4 flex items-center gap-2">
                            <Sparkles className="w-6 h-6" />
                            Local Resources
                          </h3>
                          <div className="space-y-2">
                            {deepDiveData.locationSpecific.resources.map((resource, i) => (
                              <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-3">
                                <ArrowRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <p className="text-blue-800">{resource}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Chat Tab */}
                  {activeDeepDiveTab === 'chat' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
                        <p className="text-purple-800 text-sm">
                          💬 Ask Luna anything about this goal! She knows your situation and can give personalized advice.
                        </p>
                      </div>

                      {/* Messages */}
                      <div className="bg-gray-50 rounded-2xl p-4 min-h-[400px] max-h-[500px] overflow-y-auto space-y-3">
                        {chatMessages.map((msg, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                          >
                            {msg.role === 'assistant' && (
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Bot className="w-6 h-6 text-white" />
                              </div>
                            )}
                            <div className={`max-w-[75%] p-4 rounded-2xl ${
                              msg.role === 'user' 
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' 
                                : 'bg-white border-2 border-purple-200'
                            }`}>
                              <p className={`text-sm leading-relaxed whitespace-pre-line ${
                                msg.role === 'user' ? 'text-white' : 'text-gray-800'
                              }`}>
                                {msg.content}
                              </p>
                            </div>
                            {msg.role === 'user' && (
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-6 h-6 text-white" />
                              </div>
                            )}
                          </motion.div>
                        ))}
                        {isChatLoading && (
                          <div className="flex gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div className="bg-white border-2 border-purple-200 p-4 rounded-2xl">
                              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Input */}
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          sendChatMessage();
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask Luna anything about this goal..."
                          className="flex-1 px-5 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                        />
                        <button
                          type="submit"
                          disabled={!chatInput.trim() || isChatLoading}
                          className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                        >
                          <Send className="w-5 h-5" />
                          Send
                        </button>
                      </form>
                    </motion.div>
                  )}
                </>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // ========== ROADMAP VIEW ==========
  if (step === 'roadmap') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        {showConfetti && <Confetti />}
        <DeepDiveModal />
        
        <div className="bg-white shadow-lg sticky top-0 z-30 border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">TogetherForward</h1>
                  <p className="text-sm text-gray-500">{coupleData.partner1} & {coupleData.partner2}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <span className="font-bold text-yellow-700">{xpPoints} XP</span>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Start over?')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600 font-medium">Goals</h3>
                <Target className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{roadmap.length}</p>
              <p className="text-sm text-gray-500">Active milestones</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600 font-medium">Timeline</h3>
                <Calendar className="w-6 h-6 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{coupleData.timeline}</p>
              <p className="text-sm text-gray-500">Months to achieve</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600 font-medium">Experience</h3>
                <Trophy className="w-6 h-6 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{xpPoints} XP</p>
              <p className="text-sm text-gray-500">{achievements.length} achievements</p>
            </motion.div>
          </div>

          <div className="space-y-6">
            {roadmap.map((milestone, index) => {
              const Icon = getIconComponent(milestone.iconName);
              
              return (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`${milestone.color} w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-md relative`}>
                      <Icon className="w-6 h-6 text-white" />
                      {milestone.aiGenerated && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                          <Brain className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-gray-800">{milestone.title}</h3>
                            {milestone.aiGenerated && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
                                <Brain className="w-3 h-3" />
                                AI Generated
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-sm mb-3">{milestone.description}</p>
                          
                          {milestone.estimatedCost > 0 && (
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                <span>~€{milestone.estimatedCost.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{milestone.duration}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openDeepDive(milestone)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium"
                            title="Deep dive into this goal"
                          >
                            <Maximize2 className="w-4 h-4" />
                            Deep Dive
                          </button>
                          <button
                            onClick={() => setSelectedMilestone(selectedMilestone === milestone.id ? null : milestone.id)}
                            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <ChevronRight 
                              className={`w-5 h-5 transition-transform ${
                                selectedMilestone === milestone.id ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {selectedMilestone === milestone.id && milestone.tasks && milestone.tasks.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 space-y-2 border-t pt-4"
                        >
                          {milestone.tasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                            >
                              <button
                                onClick={() => {
                                  const updatedTasks = milestone.tasks.map(t =>
                                    t.id === task.id ? { ...t, completed: !t.completed } : t
                                  );
                                  setRoadmap(roadmap.map(m =>
                                    m.id === milestone.id ? { ...m, tasks: updatedTasks } : m
                                  ));
                                  if (!task.completed) {
                                    addAchievement('✅ Task Complete', `Completed: ${task.title}`, 10);
                                  }
                                }}
                              >
                                {task.completed ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                                )}
                              </button>
                              <span className={`text-sm flex-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                {task.title}
                              </span>
                              {task.aiGenerated && (
                                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">AI</span>
                              )}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {lunaMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 z-50"
          >
            <Bot className="w-5 h-5" />
            <span className="font-medium">{lunaMessage}</span>
          </motion.div>
        )}
      </div>
    );
  }

  return null;
};

export default TogetherForward;