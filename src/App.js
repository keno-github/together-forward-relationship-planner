import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import { LunaProvider } from './context/LunaContext';
import { CreationProgressProvider } from './context/CreationProgressContext';
import ErrorBoundary from './Components/ErrorBoundary';
import { LunaFloatingButton, LunaChatPanel, LunaPendingBanner } from './Components/Luna';
import LunaErrorBoundary from './Components/Luna/LunaErrorBoundary';
import LandingPage from './Components/LandingPageNew';
import Dashboard from './Components/Dashboard';
import RoadmapProfile from './Components/RoadmapProfile';
import Profile from './Components/Profile';
import Settings from './Components/Settings';
import PricingPage from './Components/PricingPage';
import CompatibilityResults from './Components/CompatibilityResults';
import CompatibilityTransition from './Components/CompatibilityTransition';
import AssessmentHub from './Components/Assessment/AssessmentHub';
import TogetherForward from './TogetherForward';
import DeepDivePage from './Components/DeepDivePage';
import MilestoneDetailPage from './Components/MilestoneDetailPage';
import AuthTest from './Components/AuthTest';
import GoalBuilder from './Components/GoalBuilder';
import LunaOptimization from './Components/LunaOptimization';
import LunaAssessment from './Components/LunaAssessment';
import PortfolioOverview from './Components/PortfolioOverview';
import AcceptInvitePage from './Components/Partner/AcceptInvitePage';
import AcceptPartnerInvitePage from './Components/Partner/AcceptPartnerInvitePage';
import ResetPasswordPage from './Components/ResetPasswordPage';
import DevTools from './Components/DevTools';
import { MobileBottomNav } from './Components/Mobile';
import { useResponsive } from './hooks/useResponsive';
import { useRouteSync } from './hooks/useRouteSync';
import { coupleData, roadmap, deepDiveData } from './SampleData';
import { calculateCompatibilityScore, generateDiscussionGuide } from './utils/compatibilityScoring';
import { getUserRoadmaps, getMilestonesByRoadmap, createRoadmap, createMilestone } from './services/supabaseService';
import { initGA, trackPageView } from './utils/analytics';
import {
  hasValidGuestDream,
  loadGuestDream,
  attachGuestDreamToAccount,
  clearGuestDream
} from './services/guestDreamService';

// Inner component that uses auth context
const AppContent = () => {
  const { user, loading: authLoading, authEvent, clearAuthEvent } = useAuth();
  const { isMobile } = useResponsive();

  // Track app stage: landing, dashboard, roadmapProfile, profile, settings, compatibility, results, transition, main, deepDive, milestoneDetail, authTest, goalBuilder, lunaOptimization, assessment, portfolioOverview, invite
  const [stage, setStage] = useState('landing'); // Start with landing page
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0); // Force Dashboard remount
  const [userData, setUserData] = useState(null);
  const [successNotification, setSuccessNotification] = useState(null); // Success alert after dream creation
  const [compatibilityData, setCompatibilityData] = useState(null);
  const [selectedGoalsFromTransition, setSelectedGoalsFromTransition] = useState([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [checkingRoadmaps, setCheckingRoadmaps] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false); // NEW: Track if initial check completed
  const [deepDiveMilestone, setDeepDiveMilestone] = useState(null); // NEW: Track milestone for Deep Dive page
  const [goalOrchestrator, setGoalOrchestrator] = useState(null); // NEW: Track goal orchestrator for Luna optimization
  const [isNavigating, setIsNavigating] = useState(false); // Prevent double-clicks on navigation

  // NEW: Milestone Detail state
  const [milestoneDetailState, setMilestoneDetailState] = useState({
    milestone: null,
    section: 'overview' // default section: overview, roadmap, budget, assessment, tasks, status
  });

  // NEW: Assessment Hub state (Luna-powered alignment assessment)
  const [assessmentJoinCode, setAssessmentJoinCode] = useState(null);

  // Chat state for Deep Dive
  const [deepDiveChatMessages, setDeepDiveChatMessages] = useState([]);
  const [isDeepDiveChatLoading, setIsDeepDiveChatLoading] = useState(false);

  // NEW: Dream ID for URL routing (e.g., /dream/:dreamId)
  const [dreamId, setDreamId] = useState(null);

  // Initialize URL ↔ Stage sync for shareable URLs
  // This allows partners to share links like /dream/abc123 or /dashboard
  const { navigateTo, navigateToDream, currentPath } = useRouteSync(stage, setStage, {
    dreamId,
    setDreamId,
    milestoneDetailState,
    setMilestoneDetailState,
    selectedRoadmapId: selectedRoadmap?.id,
  });

  // Initialize Google Analytics on mount
  useEffect(() => {
    initGA();
  }, []);

  // Track page views when stage changes
  useEffect(() => {
    const pageNames = {
      'landing': 'Landing Page',
      'dashboard': 'Dashboard',
      'roadmapProfile': 'Roadmap Profile',
      'profile': 'User Profile',
      'settings': 'Settings',
      'compatibility': 'Alignment Assessment',
      'results': 'Compatibility Results',
      'transition': 'Compatibility Transition',
      'main': 'Main App',
      'deepDive': 'Deep Dive',
      'milestoneDetail': 'Milestone Detail',
      'goalBuilder': 'Goal Builder',
      'lunaOptimization': 'Luna Optimization',
      'assessment': 'Luna Assessment',
      'portfolioOverview': 'Portfolio Overview',
      'invite': 'Partner Invite',
    };

    const pageName = pageNames[stage] || stage;
    trackPageView(`/${stage}`, pageName);
  }, [stage]);

  // Determine if mobile bottom nav should be shown
  const showMobileNav = isMobile && user && [
    'dashboard',
    'profile',
    'settings',
    'main',
    'milestoneDetail',
    'deepDive',
    'assessment',
    'portfolioOverview'
  ].includes(stage);

  // Add/remove body class for bottom nav padding
  useEffect(() => {
    if (showMobileNav) {
      document.body.classList.add('has-bottom-nav');
    } else {
      document.body.classList.remove('has-bottom-nav');
    }
    return () => document.body.classList.remove('has-bottom-nav');
  }, [showMobileNav]);

  // Mobile navigation handlers
  const handleMobileNavigation = (destination) => {
    switch (destination) {
      case 'home':
        setStage('dashboard');
        break;
      case 'tasks':
        // If we have a current milestone, go to its tasks
        if (milestoneDetailState.milestone) {
          setMilestoneDetailState(prev => ({ ...prev, section: 'tasks' }));
          setStage('milestoneDetail');
        } else {
          setStage('dashboard');
        }
        break;
      case 'luna':
        // Open Luna chat - handled by LunaContext
        break;
      case 'profile':
        setStage('profile');
        break;
      default:
        break;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // APP INITIALIZATION - State-of-the-art auth event handling
  //
  // This effect handles navigation based on auth events. The key insight is that
  // we DON'T want to navigate on every `user` change - we only want to navigate
  // on meaningful auth events:
  //
  // - INITIAL_SESSION: First page load → check roadmaps, navigate appropriately
  // - SIGNED_IN: User logged in → check roadmaps, navigate to dashboard
  // - SIGNED_OUT: User logged out → navigate to landing
  // - TOKEN_REFRESHED: ⚠️ IGNORE! This happens when switching browser tabs
  //   and should NOT cause any navigation (preserves Luna chat, etc.)
  //
  // This fixes the bug where switching browser tabs would wipe the user's
  // Luna conversation because Supabase refreshes the token on tab focus.
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const initializeApp = async () => {
      if (authLoading) return; // Wait for auth to load
      if (!authEvent) return; // No event to process

      // ═══════════════════════════════════════════════════════════════════════
      // CRITICAL: Ignore TOKEN_REFRESHED events
      //
      // TOKEN_REFRESHED happens when:
      // 1. User switches browser tabs and returns
      // 2. Session token is about to expire
      // 3. Any background session refresh
      //
      // We MUST NOT navigate on these events - user should stay where they are!
      // ═══════════════════════════════════════════════════════════════════════
      if (authEvent === 'TOKEN_REFRESHED') {
        console.log('🔄 TOKEN_REFRESHED event - preserving current state, no navigation');
        clearAuthEvent(); // Clear the event so we don't process it again
        return;
      }

      // Also ignore USER_UPDATED events (profile changes shouldn't navigate)
      if (authEvent === 'USER_UPDATED') {
        console.log('👤 USER_UPDATED event - preserving current state, no navigation');
        clearAuthEvent();
        return;
      }

      console.log('🚀 Processing auth event:', authEvent, 'user:', user?.email || 'none');

      // Check if we're on a special route that shouldn't be overridden
      // These routes are handled by useRouteSync and should not redirect to landing
      const specialRoutes = ['/invite/', '/partner-invite/', '/assessment/join/'];
      const isOnSpecialRoute = specialRoutes.some(route =>
        window.location.pathname.startsWith(route)
      );

      if (isOnSpecialRoute) {
        console.log('🔗 Special route detected, skipping landing redirect:', window.location.pathname);

        // Handle assessment join route - extract code and set it
        const assessmentJoinMatch = window.location.pathname.match(/^\/assessment\/join\/([^/]+)$/);
        if (assessmentJoinMatch) {
          const joinCode = assessmentJoinMatch[1];
          console.log('🔗 Assessment join code extracted:', joinCode);
          setAssessmentJoinCode(joinCode);
          setStage('compatibility');
        }

        setCheckingRoadmaps(false);
        setInitialCheckDone(true);
        clearAuthEvent();
        return; // Don't override stage - let useRouteSync handle it
      }

      // CRITICAL: Check for pending invites BEFORE redirecting to landing
      // This handles the case where user just logged in after clicking invite link
      if (user) {
        // Check for pending dream share invite
        const pendingCode = localStorage.getItem('pending_invite_code');
        if (pendingCode) {
          console.log('🔗 Pending dream invite detected after login, redirecting to:', pendingCode);
          localStorage.removeItem('pending_invite_code');
          clearAuthEvent();
          // Full page redirect to invite page
          window.location.href = `/invite/${pendingCode}`;
          return; // Don't continue with initialization
        }

        // Check for pending global partner invite
        const pendingPartnerCode = localStorage.getItem('pending_partner_invite_code');
        if (pendingPartnerCode) {
          console.log('🔗 Pending partner invite detected after login, redirecting to:', pendingPartnerCode);
          clearAuthEvent();
          // Don't remove yet - AcceptPartnerInvitePage will handle it
          // Full page redirect to partner invite page
          window.location.href = `/partner-invite/${pendingPartnerCode}`;
          return; // Don't continue with initialization
        }

        // ═══════════════════════════════════════════════════════════════════════
        // PREMIUM ONBOARDING: Attach guest dream to new account
        //
        // This is the critical step in the "ownership-first" flow where a guest
        // who created a dream before signing up gets their dream automatically
        // saved to their new account. No data loss, seamless experience.
        // ═══════════════════════════════════════════════════════════════════════
        if (hasValidGuestDream()) {
          console.log('🎁 Guest dream detected! Attaching to new account...');

          try {
            const guestDream = loadGuestDream();
            const result = await attachGuestDreamToAccount();

            if (result.success) {
              console.log('✅ Guest dream attached successfully!');
              console.log('   - Roadmap ID:', result.savedRoadmap?.id);
              console.log('   - Milestone ID:', result.savedMilestone?.id);
              console.log('   - Tasks created:', result.tasksCreated);

              // Show success notification
              setSuccessNotification({
                type: 'success',
                message: `Welcome! Your dream "${guestDream?.dream?.title || 'dream'}" is now saved to your account.`,
                dreamCount: 1
              });

              // Navigate to the newly saved dream
              if (result.savedMilestone) {
                setMilestoneDetailState({
                  milestone: result.savedMilestone,
                  section: 'overview'
                });
                setStage('milestoneDetail');
                setCheckingRoadmaps(false);
                setInitialCheckDone(true);
                clearAuthEvent();
                return; // Don't continue - we're showing the dream
              }
            } else {
              console.warn('⚠️ Guest dream attachment failed:', result.error);
              // Continue with normal flow - dream is still in localStorage
              // User can try again later
            }
          } catch (error) {
            console.error('❌ Error attaching guest dream:', error);
            // Continue with normal flow
          }
        }
      }

      // Handle SIGNED_OUT event
      if (authEvent === 'SIGNED_OUT' || !user) {
        // Allow pricing page for everyone (public access)
        if (stage === 'pricing') {
          console.log('💰 No user, but allowing public pricing page access');
          setCheckingRoadmaps(false);
          setInitialCheckDone(true);
          clearAuthEvent();
          return;
        }

        console.log('🚫 User signed out → redirecting to landing page');
        setStage('landing');
        setCheckingRoadmaps(false);
        setInitialCheckDone(true);
        clearAuthEvent();
        return;
      }

      // For INITIAL_SESSION or SIGNED_IN: Check if we should redirect
      // Don't redirect if user is already in the middle of something (not on landing/loading)
      if (initialCheckDone && stage !== 'loading' && stage !== 'landing') {
        console.log('📍 User already navigating (stage:', stage, '), preserving state');
        clearAuthEvent();
        return;
      }

      // UX: Returning users with existing roadmaps go directly to Dashboard (HomeHub)
      // New users or users without roadmaps see the landing page
      console.log('🔍 Checking roadmaps for user:', user.email);
      try {
        const { getUserRoadmaps } = await import('./services/supabaseService');
        const { data: roadmaps } = await getUserRoadmaps();
        console.log('🔍 Found', roadmaps?.length || 0, 'roadmap(s)');

        if (roadmaps && roadmaps.length > 0) {
          console.log('🏠 Returning user with roadmaps → going to Dashboard/HomeHub');
          setStage('dashboard');
          setCheckingRoadmaps(false);
          setInitialCheckDone(true);
          clearAuthEvent();
          return;
        } else {
          console.log('📝 New user or no roadmaps → showing landing page');
        }
      } catch (error) {
        console.error('❌ Error checking roadmaps:', error);
      }

      // New users or users without roadmaps see landing page
      setStage('landing');
      setCheckingRoadmaps(false);
      setInitialCheckDone(true);
      clearAuthEvent();
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authEvent, authLoading]); // Intentionally react ONLY to authEvent, not user/stage changes

  // Handle reset password route (from email link)
  if (window.location.pathname === '/reset-password') {
    return <ResetPasswordPage />;
  }

  // Show loading screen while checking auth and roadmaps
  if (authLoading || checkingRoadmaps) {
    return (
      <div className="min-h-screen animated-gradient-bg flex items-center justify-center">
        <div className="glass-card-strong rounded-3xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderColor: '#C084FC'}}></div>
          <p className="text-center" style={{color: '#2B2B2B'}}>Loading...</p>
        </div>
      </div>
    );
  }

  // Handle landing page completion
  const handleLandingComplete = async (data) => {
    if (data.chosenPath === 'compatibility') {
      // User chose compatibility path
      setStage('compatibility');
    } else if (data.chosenPath === 'luna') {
      // ═══════════════════════════════════════════════════════════════════════════
      // LUNA PATH: Navigate to MilestoneDetailPage
      // Luna's handleFinalizeRoadmap already saved to database - use those IDs
      // ═══════════════════════════════════════════════════════════════════════════
      console.log('🎯 Luna path complete - preparing navigation');

      const milestones = data.milestones || [];
      const partner1Name = data.partner1 || '';
      const partner2Name = data.partner2 || '';
      const location = data.location || '';

      // Validate milestones exist (three-layer defense - UI safeguard)
      if (milestones.length === 0) {
        console.error('❌ UI SAFEGUARD: No milestones in Luna data, cannot proceed');
        // Stay on landing/conversation - don't navigate to broken state
        return;
      }

      let savedMilestone = null;
      let savedRoadmap = null;

      // Check if Luna already saved to database (prevents duplicate creation)
      if (data.savedRoadmapId) {
        console.log('✅ Luna already saved to DB - using existing roadmap:', data.savedRoadmapId);
        savedRoadmap = { id: data.savedRoadmapId };
        // First milestone should have its ID from Luna's save
        const firstMilestone = milestones[0];
        if (firstMilestone.id) {
          savedMilestone = { id: firstMilestone.id };
          console.log('✅ Using existing milestone:', firstMilestone.id);
        }
      } else if (user) {
        // Fallback: Luna didn't save (guest mode or error) - save now
        console.log('⚠️ No savedRoadmapId from Luna - saving to database now');
        try {
          // Create roadmap (dream container)
          const firstMilestone = milestones[0];
          const { data: newRoadmap, error: roadmapError } = await createRoadmap({
            title: firstMilestone.title,
            partner1_name: partner1Name,
            partner2_name: partner2Name,
            location: location,
            xp_points: 0
          });

          if (roadmapError) {
            console.error('Error creating roadmap:', roadmapError);
          } else {
            savedRoadmap = newRoadmap;
            console.log('✅ Created roadmap:', newRoadmap.id);

            // Create milestone under this roadmap
            const { data: newMilestone, error: milestoneError } = await createMilestone({
              roadmap_id: newRoadmap.id,
              title: firstMilestone.title,
              description: firstMilestone.description || '',
              icon: firstMilestone.icon || 'Target',
              color: firstMilestone.color || 'bg-gradient-to-br from-amber-500 to-orange-500',
              category: firstMilestone.category || 'relationship',
              estimated_cost: firstMilestone.estimatedCost || firstMilestone.budget || 0,
              budget_amount: firstMilestone.budget_amount || firstMilestone.budget || firstMilestone.estimatedCost || 0,
              duration: firstMilestone.duration || '3-6 months',
              ai_generated: true,
              deep_dive_data: firstMilestone.deepDiveData || firstMilestone.deep_dive_data || {
                roadmapPhases: firstMilestone.roadmapPhases || [],
                detailedSteps: [],
                expertTips: [],
                challenges: [],
                successMetrics: []
              },
              order_index: 0
            });

            if (milestoneError) {
              console.error('Error creating milestone:', milestoneError);
            } else {
              savedMilestone = newMilestone;
              console.log('✅ Created milestone:', newMilestone.id);
            }
          }
        } catch (err) {
          console.error('Error saving Luna dream to database:', err);
        }
      }

      // Format milestone for MilestoneDetailPage
      const firstMilestone = milestones[0];
      const formattedMilestone = {
        id: savedMilestone?.id || `temp-${Date.now()}`,
        roadmap_id: savedRoadmap?.id || null,
        title: firstMilestone.title || 'Your Dream',
        description: firstMilestone.description || '',
        icon: firstMilestone.icon || 'Target',
        color: firstMilestone.color || 'bg-gradient-to-br from-amber-500 to-orange-500',
        category: firstMilestone.category || 'relationship',
        estimatedCost: firstMilestone.estimatedCost || firstMilestone.budget || 0,
        budget_amount: firstMilestone.budget_amount || firstMilestone.budget || firstMilestone.estimatedCost || 0,
        target_date: firstMilestone.target_date || null,
        milestone_metrics: {
          tasks_completed: 0,
          tasks_total: 0,
          progress_percentage: 0,
          health_score: 50,
          on_track: true
        },
        duration: firstMilestone.duration || '3-6 months',
        aiGenerated: true,
        completed: false,
        deepDiveData: firstMilestone.deepDiveData || firstMilestone.deep_dive_data || {
          roadmapPhases: firstMilestone.roadmapPhases || [],
          detailedSteps: [],
          expertTips: [],
          challenges: [],
          successMetrics: []
        },
        tasks: [],
        _savedToDb: !!savedMilestone
      };

      // Update userData with roadmap info
      setUserData({
        ...data,
        roadmapId: savedRoadmap?.id,
        existingMilestones: [formattedMilestone],
        partner1: partner1Name,
        partner2: partner2Name,
        location: location
      });

      // Set selected roadmap for context
      if (savedRoadmap) {
        setSelectedRoadmap(savedRoadmap);
      }

      // Show success notification
      setSuccessNotification({
        type: 'success',
        message: `Your dream "${firstMilestone.title}" has been created!`,
        dreamCount: 1
      });
      setTimeout(() => setSuccessNotification(null), 5000);

      // Force dashboard refresh for when user goes back
      setDashboardRefreshKey(prev => prev + 1);

      // Navigate DIRECTLY to MilestoneDetailPage (consistent with Dashboard flow)
      console.log('🚀 Navigating to MilestoneDetailPage:', formattedMilestone.title);
      setMilestoneDetailState({ milestone: formattedMilestone, section: 'overview' });
      setStage('milestoneDetail');

    } else if (data.chosenPath === 'ready') {
      // User chose "ready" path - check if they want templates or custom goal creator
      if (data.showTemplates || data.showCustomCreator) {
        // Go to unified goal builder
        setUserData(data);
        setStage('goalBuilder');
      } else {
        // Go straight to main app
        setUserData(data);
        setStage('main');
      }
    } else {
      // Default: go to main app
      setUserData(data);
      setStage('main');
    }
  };

  // Handle compatibility assessment completion
  const handleCompatibilityComplete = (data) => {
    // Calculate compatibility scores
    const scores = calculateCompatibilityScore(
      data.partner1Answers,
      data.partner2Answers,
      data.questions
    );

    // Store compatibility results
    const fullCompatibilityData = {
      ...scores,
      partner1Name: data.partner1Name,
      partner2Name: data.partner2Name,
      location: data.location
    };

    setCompatibilityData(fullCompatibilityData);
    setStage('results');
  };

  // Handle continue from results (go to transition screen)
  const handleContinueFromResults = () => {
    // Go to transition screen where user selects goals and path
    setStage('transition');
  };

  // Handle path selection from transition screen
  const handleTransitionPathSelected = (path, selectedGoals) => {
    setSelectedGoalsFromTransition(selectedGoals);

    if (path === 'luna') {
      // Go to landing page in Luna mode with selected goals
      setStage('landing');
      // The landing page will detect this and open Luna with compatibility context
    } else if (path === 'instant') {
      // Create instant roadmap and go to main app
      const preparedUserData = {
        partner1: compatibilityData.partner1Name,
        partner2: compatibilityData.partner2Name,
        location: compatibilityData.location || 'Unknown',
        locationData: null,
        goals: selectedGoals, // Selected goals from transition
        compatibilityScore: compatibilityData.alignmentScore,
        compatibilityData: compatibilityData,
        skipLuna: true, // Flag to skip Luna and create instant roadmap
        instantGoals: selectedGoals // Pass selected goal IDs
      };
      setUserData(preparedUserData);
      setStage('main');
    } else if (path === 'explore') {
      // Go to landing page in exploration mode
      setStage('landing');
      // Landing page will show goal selection hub
    }
  };

  // Handle download discussion guide
  const handleDownloadGuide = () => {
    const guideContent = generateDiscussionGuide(compatibilityData);

    // Create blob and download
    const blob = new Blob([guideContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${compatibilityData.partner1Name}-${compatibilityData.partner2Name}-discussion-guide.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle dashboard actions
  const handleContinueRoadmap = async (roadmap) => {
    // Prevent double-clicks
    if (isNavigating) {
      console.log('⏳ Navigation already in progress, ignoring click');
      return;
    }
    setIsNavigating(true);

    // IMPROVED UX: Go directly to MilestoneDetailPage (skip TogetherForward intermediate view)
    console.log('🎯 Opening roadmap:', roadmap.id);

    try {
      // Load milestones
      const { data: milestones, error } = await getMilestonesByRoadmap(roadmap.id);

      if (error) {
        console.error('❌ Error loading milestones:', error);
      }

      console.log('📦 Dashboard: Loaded', milestones?.length || 0, 'milestones from database');

      const newUserData = {
        partner1: roadmap.partner1_name,
        partner2: roadmap.partner2_name,
        location: roadmap.location || 'Unknown',
        roadmapId: roadmap.id,
        xp_points: roadmap.xp_points || 0
      };

      // Format milestones with all required fields and proper defaults
      let formattedMilestones = [];
      if (milestones && milestones.length > 0) {
        formattedMilestones = milestones.map(m => ({
          id: m.id,
          roadmap_id: m.roadmap_id, // CRITICAL: Include roadmap_id for Luna updates
          title: m.title || 'Untitled Goal',
          description: m.description || '',
          icon: m.icon || 'Target',
          color: m.color || 'bg-gradient-to-br from-amber-500 to-orange-500',
          category: m.category || 'relationship',
          estimatedCost: m.estimated_cost || 0,
          budget_amount: m.budget_amount || m.estimated_cost || 0,
          target_date: m.target_date || null,
          // CRITICAL: Provide default milestone_metrics to prevent blank page
          milestone_metrics: m.milestone_metrics || {
            tasks_completed: 0,
            tasks_total: 0,
            progress_percentage: 0,
            health_score: 50,
            on_track: true
          },
          duration: m.duration || '3-6 months',
          aiGenerated: m.ai_generated || false,
          completed: m.completed || false,
          // CRITICAL: Provide default deepDiveData structure
          deepDiveData: m.deep_dive_data || {
            roadmapPhases: [],
            detailedSteps: [],
            expertTips: [],
            challenges: [],
            successMetrics: []
          },
          tasks: [],
          _savedToDb: true // Mark as coming from database
        }));
        newUserData.existingMilestones = formattedMilestones;
        console.log('✅ Loaded milestones:', formattedMilestones.map(m => m.title).join(', '));
      }

      // CRITICAL FIX: If no milestones in DB, create a placeholder from the roadmap info
      // This prevents sample data ("Save for Vacation") from being used
      if (formattedMilestones.length === 0) {
        console.log('⚠️ No milestones found in DB, creating placeholder from roadmap');
        const placeholderMilestone = {
          id: `placeholder-${roadmap.id}`,
          roadmap_id: roadmap.id,
          title: roadmap.title || 'Your Dream',
          description: `Your ${roadmap.title || 'dream'} journey starts here.`,
          icon: 'Target',
          color: 'bg-gradient-to-br from-amber-500 to-orange-500',
          category: 'relationship',
          estimatedCost: 0,
          budget_amount: 0,
          target_date: null,
          milestone_metrics: {
            tasks_completed: 0,
            tasks_total: 0,
            progress_percentage: 0,
            health_score: 50,
            on_track: true
          },
          duration: '3-6 months',
          aiGenerated: false,
          completed: false,
          deepDiveData: {
            roadmapPhases: [],
            detailedSteps: [],
            expertTips: [],
            challenges: [],
            successMetrics: []
          },
          tasks: [],
          _savedToDb: false,
          _isPlaceholder: true
        };
        formattedMilestones = [placeholderMilestone];
        newUserData.existingMilestones = formattedMilestones;
      }

      setUserData(newUserData);
      setSelectedRoadmap(roadmap);

      // DIRECT NAVIGATION: Go straight to MilestoneDetailPage (skip intermediate view)
      // Find the first non-completed milestone (or first if all completed)
      const activeMilestone = formattedMilestones.find(m => !m.completed) || formattedMilestones[0];
      console.log('🚀 Direct navigation to milestone:', activeMilestone.title);
      setMilestoneDetailState({ milestone: activeMilestone, section: 'overview' });
      setStage('milestoneDetail');
    } catch (err) {
      console.error('❌ handleContinueRoadmap error:', err);
      // Even on error, create placeholder milestone to avoid sample data
      const placeholderMilestone = {
        id: `placeholder-${roadmap.id}`,
        roadmap_id: roadmap.id,
        title: roadmap.title || 'Your Dream',
        description: `Your ${roadmap.title || 'dream'} journey starts here.`,
        icon: 'Target',
        color: 'bg-gradient-to-br from-amber-500 to-orange-500',
        category: 'relationship',
        estimatedCost: 0,
        budget_amount: 0,
        target_date: null,
        milestone_metrics: {
          tasks_completed: 0,
          tasks_total: 0,
          progress_percentage: 0,
          health_score: 50,
          on_track: true
        },
        duration: '3-6 months',
        aiGenerated: false,
        completed: false,
        deepDiveData: { roadmapPhases: [], detailedSteps: [], expertTips: [], challenges: [], successMetrics: [] },
        tasks: [],
        _savedToDb: false,
        _isPlaceholder: true
      };
      setUserData({
        partner1: roadmap.partner1_name,
        partner2: roadmap.partner2_name,
        location: roadmap.location || 'Unknown',
        roadmapId: roadmap.id,
        xp_points: roadmap.xp_points || 0,
        existingMilestones: [placeholderMilestone]
      });
      setSelectedRoadmap(roadmap);
      setMilestoneDetailState({ milestone: placeholderMilestone, section: 'overview' });
      setStage('milestoneDetail');
    } finally {
      setIsNavigating(false);
    }
  };

  const handleContinueFromProfile = async () => {
    // From RoadmapProfile → Load data and go to main app
    if (!selectedRoadmap) return;

    // Load milestones
    const { data: milestones } = await getMilestonesByRoadmap(selectedRoadmap.id);

    console.log('📦 RoadmapProfile: Loaded', milestones?.length || 0, 'milestones from database');

    // CRITICAL FIX: Don't pass existingMilestones if database is empty
    // This lets TogetherForward use sample data instead of overwriting with empty array
    const userData = {
      partner1: selectedRoadmap.partner1_name,
      partner2: selectedRoadmap.partner2_name,
      location: selectedRoadmap.location || 'Unknown',
      roadmapId: selectedRoadmap.id,
      xp_points: selectedRoadmap.xp_points || 0 // Pass XP points from roadmap
    };

    // Only add existingMilestones if we actually have some
    // CRITICAL: Format milestones to include ALL fields with proper defaults
    if (milestones && milestones.length > 0) {
      const formattedMilestones = milestones.map(m => {
        console.log(`Formatting milestone: ${m.title}, budget_amount: ${m.budget_amount}`);

        // Extract Luna-enhanced fields from deep_dive_data
        const deepDive = m.deep_dive_data || {};

        return {
          id: m.id,
          roadmap_id: m.roadmap_id, // CRITICAL: Include roadmap_id for Luna updates
          title: m.title || 'Untitled Goal',
          description: m.description || '',
          icon: m.icon || 'Target',
          color: m.color || 'bg-gradient-to-br from-amber-500 to-orange-500',
          category: m.category || 'relationship',
          estimatedCost: m.estimated_cost || 0,
          budget_amount: m.budget_amount || m.estimated_cost || 0,
          target_date: m.target_date || null,
          // CRITICAL: Provide default milestone_metrics to prevent blank page
          milestone_metrics: m.milestone_metrics || {
            tasks_completed: 0,
            tasks_total: 0,
            progress_percentage: 0,
            health_score: 50,
            on_track: true
          },
          duration: m.duration || '3-6 months',
          aiGenerated: m.ai_generated || false,
          completed: m.completed || false,
          tasks: [],
          _savedToDb: true, // Mark as coming from database

          // CRITICAL: Keep Luna fields inside deepDiveData with defaults
          deepDiveData: {
            ...deepDive,
            roadmapPhases: deepDive.roadmapPhases || [],
            detailedSteps: deepDive.detailedSteps || [],
            milestones: deepDive.milestones || [],
            expertTips: deepDive.expertTips || [],
            challenges: deepDive.challenges || [],
            successMetrics: deepDive.successMetrics || [],
            budgetBreakdown: deepDive.budgetBreakdown || [],
            lunaEnhanced: deepDive.lunaEnhanced || false,
            generatedAt: deepDive.generatedAt || null
          }
        };
      });
      userData.existingMilestones = formattedMilestones;
      console.log('✅ Formatted milestones with budgets:', formattedMilestones.map(m => `${m.title}: $${m.budget_amount || 0}`));
    }

    setUserData(userData);
    setStage('main');
  };

  const handleCreateNewRoadmap = async () => {
    // For logged-in users, go directly to Goal Builder (skip landing page)
    setSelectedRoadmap(null);

    if (user) {
      // Go straight to Goal Builder where they can choose Luna, templates, or custom
      setUserData({ isReturningUser: true });
      setStage('goalBuilder');
    } else {
      // Not logged in - go to landing page
      setUserData(null);
      setStage('landing');
    }
  };

  // Navigation handlers
  const handleGoToDashboard = () => {
    setIsNavigating(false); // Reset navigation lock when going to dashboard
    setStage('dashboard');
  };

  const handleGoToProfile = () => {
    setStage('profile');
  };

  const handleGoToSettings = () => {
    setStage('settings');
  };

  const handleGoToPricing = () => {
    setStage('pricing');
  };

  const handleBackToDashboard = () => {
    setIsNavigating(false); // Reset navigation lock
    if (user) {
      setStage('dashboard');
    } else {
      setStage('landing');
    }
  };

  const handleBackToLanding = () => {
    setStage('landing');
  };

  const handleOpenAssessment = () => {
    setStage('compatibility');
  };

  const handleOpenPortfolioOverview = () => {
    setStage('portfolioOverview');
  };

  const handleOpenHomeHub = () => {
    // Navigate to dashboard and open HomeHub
    setStage('dashboard');
    // The HomeHub will automatically show on dashboard if not seen this session
  };

  // Handle alignment assessment completion (Luna-powered)
  const handleAlignmentAssessmentComplete = () => {
    // After assessment completion, return to landing or dashboard
    setAssessmentJoinCode(null);
    if (user) {
      setStage('dashboard');
    } else {
      setStage('landing');
    }
  };

  // Goal Builder handlers
  const handleGoalBuilderComplete = async (roadmapData) => {
    // User completed building goals and created roadmap
    console.log('🎯 Goal Builder Complete - roadmapData:', roadmapData);
    console.log('👤 Current userData:', userData);

    // CRITICAL: Clear the goal basket from localStorage after successful roadmap creation
    // This prevents previously selected templates from appearing when user creates new dreams
    try {
      localStorage.removeItem('goalBasket');
      console.log('🧹 Cleared goal basket from localStorage');
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }

    const milestones = roadmapData.milestones || [];
    const partner1Name = roadmapData.partner1_name || userData?.partner1 || '';
    const partner2Name = roadmapData.partner2_name || userData?.partner2 || '';
    const location = userData?.location || '';

    // OPTION A: Create a SEPARATE roadmap/dream for EACH milestone/template
    // This means each selected template becomes its own dream card in Dashboard
    if (user && milestones.length > 0) {
      console.log('📦 Creating separate roadmaps for each dream...');

      // Parallelize dream creation for speed (was sequential, causing UI hang)
      const createDreamPromises = milestones.map(async (milestone) => {
        try {
          // Create a roadmap for this dream
          const { data: newRoadmap, error: roadmapError } = await createRoadmap({
            title: milestone.title,
            partner1_name: partner1Name,
            partner2_name: partner2Name,
            location: location,
            xp_points: 0
          });

          if (roadmapError) {
            console.error('Error creating roadmap:', roadmapError);
            return { success: false, title: milestone.title };
          }

          // Create the milestone under this roadmap
          const { error: milestoneError } = await createMilestone({
            roadmap_id: newRoadmap.id,
            title: milestone.title,
            description: milestone.description,
            icon: milestone.icon,
            color: milestone.color,
            category: milestone.category || 'relationship',
            estimated_cost: milestone.estimatedCost || 0,
            budget_amount: milestone.budget_amount || milestone.estimatedCost || 0,
            duration: milestone.duration,
            ai_generated: milestone.aiGenerated || milestone.source === 'template',
            deep_dive_data: milestone.deepDiveData,
            order_index: 0
          });

          if (milestoneError) {
            console.error('Error creating milestone:', milestoneError);
            return { success: false, title: milestone.title };
          }

          return { success: true, title: milestone.title };
        } catch (error) {
          console.error(`Error creating dream "${milestone.title}":`, error);
          return { success: false, title: milestone.title };
        }
      });

      // Wait for all dreams to be created in parallel
      const results = await Promise.all(createDreamPromises);
      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Created ${successCount}/${milestones.length} dreams`);

      // Show success notification
      setSuccessNotification({
        type: 'success',
        message: `${milestones.length} dream${milestones.length > 1 ? 's' : ''} added to your dashboard!`,
        dreamCount: milestones.length
      });

      // Auto-dismiss after 5 seconds
      setTimeout(() => setSuccessNotification(null), 5000);
    }

    // Update userData with partner info
    const preparedUserData = {
      ...userData,
      createdFrom: 'goalBuilder',
      partner1: partner1Name,
      partner2: partner2Name
    };

    setUserData(preparedUserData);

    // Force dashboard refresh
    setDashboardRefreshKey(prev => prev + 1);

    // Reset navigation lock and navigate to Dashboard
    setIsNavigating(false);
    setStage('dashboard');
  };

  const handleGoalBuilderEnhanceWithLuna = (data) => {
    // User wants Luna to enhance/optimize their goal basket
    // Phase 3: Open Luna optimization conversation with rich context
    console.log('🎯 Luna enhancement requested:', data);

    // Store orchestrator and go to Luna optimization stage
    if (data.orchestrator) {
      setGoalOrchestrator(data.orchestrator);
      setStage('lunaOptimization');
    } else {
      console.error('⚠️ No orchestrator provided to Luna enhancement');
      handleGoalBuilderComplete(data);
    }
  };

  const handleLunaOptimizationComplete = async (optimizedData) => {
    // Luna has optimized the roadmap - create separate dreams
    console.log('✨ Luna optimization complete:', optimizedData);

    // CRITICAL: Clear the goal basket from localStorage after successful roadmap creation
    try {
      localStorage.removeItem('goalBasket');
      console.log('🧹 Cleared goal basket from localStorage');
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }

    const milestones = optimizedData.milestones || [];
    const partner1Name = userData?.partner1 || '';
    const partner2Name = userData?.partner2 || '';
    const location = userData?.location || '';

    // OPTION A: Create a SEPARATE roadmap/dream for EACH milestone/template
    if (user && milestones.length > 0) {
      console.log('📦 Creating separate roadmaps for each Luna-optimized dream...');

      // Parallelize dream creation for speed (was sequential, causing 5-10s hang)
      const createDreamPromises = milestones.map(async (milestone) => {
        try {
          // Create a roadmap for this dream
          const { data: newRoadmap, error: roadmapError } = await createRoadmap({
            title: milestone.title,
            partner1_name: partner1Name,
            partner2_name: partner2Name,
            location: location,
            xp_points: 0
          });

          if (roadmapError) {
            console.error('Error creating roadmap:', roadmapError);
            return { success: false, title: milestone.title };
          }

          // Create the milestone under this roadmap
          await createMilestone({
            roadmap_id: newRoadmap.id,
            title: milestone.title,
            description: milestone.description,
            icon: milestone.icon,
            color: milestone.color,
            category: milestone.category || 'relationship',
            estimated_cost: milestone.estimatedCost || 0,
            budget_amount: milestone.budget_amount || milestone.estimatedCost || 0,
            duration: milestone.duration,
            ai_generated: true,
            deep_dive_data: milestone.deepDiveData,
            order_index: 0
          });

          return { success: true, title: milestone.title };
        } catch (error) {
          console.error(`Error creating dream "${milestone.title}":`, error);
          return { success: false, title: milestone.title };
        }
      });

      // Wait for all dreams to be created in parallel
      const results = await Promise.all(createDreamPromises);
      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Created ${successCount}/${milestones.length} Luna-optimized dreams`);

      // Show success notification
      setSuccessNotification({
        type: 'success',
        message: `${milestones.length} Luna-optimized dream${milestones.length > 1 ? 's' : ''} added to your dashboard!`,
        dreamCount: milestones.length
      });

      // Auto-dismiss after 5 seconds
      setTimeout(() => setSuccessNotification(null), 5000);
    }

    const preparedUserData = {
      ...userData,
      createdFrom: 'lunaOptimization',
      lunaOptimized: true
    };

    setUserData(preparedUserData);
    setGoalOrchestrator(null); // Clear orchestrator

    // Force dashboard refresh
    setDashboardRefreshKey(prev => prev + 1);

    // Reset navigation lock and navigate to Dashboard
    setIsNavigating(false);
    setStage('dashboard');
  };

  const handleBackFromLunaOptimization = () => {
    // User went back from Luna optimization - return to goal builder
    setGoalOrchestrator(null);
    setStage('goalBuilder');
  };

  // Deep Dive handlers
  const handleOpenDeepDive = (milestone) => {
    setDeepDiveMilestone(milestone);
    setDeepDiveChatMessages([]); // Reset chat for new deep dive
    setStage('deepDive');
  };

  const handleBackFromDeepDive = () => {
    setDeepDiveMilestone(null);
    setDeepDiveChatMessages([]); // Clear chat when leaving deep dive
    setStage('main'); // Return to main app
  };

  const handleUpdateMilestoneFromDeepDive = (updatedMilestone) => {
    // Update the milestone in the parent state
    // This will be passed to TogetherForward to update its milestone list
    setDeepDiveMilestone(updatedMilestone);
  };

  // NEW: Milestone Detail handlers (multi-section navigation)
  const handleOpenMilestoneDetail = (milestone, section = 'overview') => {
    setMilestoneDetailState({ milestone, section });
    setStage('milestoneDetail');
  };

  const handleMilestoneDetailSectionChange = (section) => {
    setMilestoneDetailState(prev => ({ ...prev, section }));
  };

  const handleBackFromMilestoneDetail = () => {
    console.log('🔙 Returning from MilestoneDetail to Dashboard');

    setMilestoneDetailState({ milestone: null, section: 'overview' });

    // Force Dashboard to refresh with latest data
    setDashboardRefreshKey(prev => prev + 1);

    // Reset navigation lock and go back to Dashboard
    setIsNavigating(false);
    setStage('dashboard');
  };

  const handleUpdateMilestoneFromDetail = (updatedMilestone) => {
    console.log('🔄 App.js: handleUpdateMilestoneFromDetail called with:', updatedMilestone);
    console.log('📊 Budget amount in update:', updatedMilestone.budget_amount);

    // Update the milestone in the detail state
    setMilestoneDetailState(prev => {
      console.log('🔄 Updating milestoneDetailState from:', prev.milestone);
      console.log('🔄 Updating milestoneDetailState to:', updatedMilestone);
      return { ...prev, milestone: updatedMilestone };
    });

    // CRITICAL: Also update in userData.existingMilestones for consistency
    if (userData?.existingMilestones) {
      setUserData(prev => {
        const updatedMilestones = prev.existingMilestones.map(m =>
          m.id === updatedMilestone.id ? updatedMilestone : m
        );
        console.log('✅ Updated userData.existingMilestones with new budget');
        return {
          ...prev,
          existingMilestones: updatedMilestones
        };
      });
    }
  };

  // Chat handler for Deep Dive
  const handleSendDeepDiveMessage = async (message) => {
    if (!message.trim()) return;

    const userMsg = { role: 'user', content: message };
    setDeepDiveChatMessages(prev => [...prev, userMsg]);
    setIsDeepDiveChatLoading(true);

    try {
      // Import Luna service
      const { converseWithLuna } = await import('./services/lunaService');

      // Build context with deep dive information
      const context = {
        partner1: userData?.partner1 || 'Partner 1',
        partner2: userData?.partner2 || 'Partner 2',
        location: userData?.location || 'Unknown',
        currentMilestone: deepDiveMilestone,
        deepDiveContext: true, // Flag to indicate this is deep dive chat
        // Include deep dive specific data
        ...(deepDiveMilestone && {
          milestoneTitle: deepDiveMilestone.title,
          totalBudget: deepDiveMilestone.totalBudget,
          timeline: deepDiveMilestone.timeline_months,
          personalizedInsights: deepDiveMilestone.personalizedInsights,
          intelligentTips: deepDiveMilestone.intelligentTips,
          riskAnalysis: deepDiveMilestone.riskAnalysis
        })
      };

      // Build message history
      const messages = [...deepDiveChatMessages, userMsg];

      // Call Luna with context
      const response = await converseWithLuna(messages, context);

      const assistantMsg = { role: 'assistant', content: response };
      setDeepDiveChatMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Deep Dive chat error:', error);
      const errorMsg = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again!'
      };
      setDeepDiveChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsDeepDiveChatLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      {/* COLOR TEST and SHOWCASE stages removed - moved to feature/design-system branch */}

      {/* TEST STAGE: Auth Test */}
      {stage === 'authTest' && (
        <AuthTest />
      )}

      {/* STAGE 0: Dashboard (for returning users) */}
      {stage === 'dashboard' && (
        <Dashboard
          key={dashboardRefreshKey}
          onContinueRoadmap={handleContinueRoadmap}
          onCreateNew={handleCreateNewRoadmap}
          onBackToHome={() => setStage('landing')}
          onOpenAssessment={handleOpenAssessment}
          onOpenPortfolioOverview={handleOpenPortfolioOverview}
          onGoToProfile={handleGoToProfile}
          onGoToSettings={handleGoToSettings}
          onGoToPricing={handleGoToPricing}
          successNotification={successNotification}
          onDismissNotification={() => setSuccessNotification(null)}
        />
      )}

      {/* STAGE 0.5: Roadmap Profile (journey details) */}
      {stage === 'roadmapProfile' && selectedRoadmap && (
        <RoadmapProfile
          roadmap={selectedRoadmap}
          onContinueJourney={handleContinueFromProfile}
          onBack={handleBackToDashboard}
        />
      )}

      {/* STAGE: Profile */}
      {stage === 'profile' && (
        <Profile onBack={handleBackToLanding} />
      )}

      {/* STAGE: Settings */}
      {stage === 'settings' && (
        <Settings onBack={handleBackToLanding} />
      )}

      {/* STAGE: Pricing */}
      {stage === 'pricing' && (
        <PricingPage
          onUpgrade={async (tier, billingPeriod) => {
            console.log('Upgrade clicked:', tier, billingPeriod);
            // TODO: Implement Stripe checkout
            alert('Stripe integration coming soon! You selected: ' + tier + ' - ' + billingPeriod);
          }}
          onClose={user ? handleBackToDashboard : () => setStage('landing')}
        />
      )}

      {/* STAGE 1: Landing Page */}
      {stage === 'landing' && (
        <LandingPage
          onComplete={handleLandingComplete}
          onBack={user ? handleBackToDashboard : null} // Only show back button if user is logged in
          onGoToDashboard={handleGoToDashboard} // Navigate to dashboard
          onGoToProfile={handleGoToProfile} // Navigate to profile
          onGoToSettings={handleGoToSettings} // Navigate to settings
          onGoToPricing={handleGoToPricing} // Navigate to pricing page
          onOpenHomeHub={handleOpenHomeHub} // Navigate to HomeHub
          onOpenAssessment={handleOpenAssessment} // Navigate to Alignment Test
          onOpenPortfolioOverview={handleOpenPortfolioOverview} // Navigate to Portfolio Overview
          hasMultipleDreams={false} // Portfolio Overview shown in Dashboard menu instead
          notificationCount={0} // TODO: Implement notification count
          isReturningUser={userData?.isReturningUser} // Pass flag to skip hero
        />
      )}

      {/* STAGE 1.5: Goal Builder (Unified templates + custom goals) */}
      {stage === 'goalBuilder' && (
        <GoalBuilder
          onBack={handleBackToLanding}
          onComplete={handleGoalBuilderComplete}
          onEnhanceWithLuna={handleGoalBuilderEnhanceWithLuna}
          user={user}
          locationData={userData?.locationData}
        />
      )}

      {/* STAGE 1.6: Luna Optimization (Phase 3) */}
      {stage === 'lunaOptimization' && goalOrchestrator && (
        <LunaOptimization
          orchestrator={goalOrchestrator}
          userData={userData}
          onComplete={handleLunaOptimizationComplete}
          onBack={handleBackFromLunaOptimization}
        />
      )}

        {/* STAGE 2: Compatibility Assessment (Luna-Powered) */}
        {stage === 'compatibility' && (
          <AssessmentHub
            joinCode={assessmentJoinCode}
            onBack={handleBackToDashboard}
            onComplete={handleAlignmentAssessmentComplete}
          />
        )}

        {/* STAGE 3: Compatibility Results */}
        {stage === 'results' && compatibilityData && (
          <CompatibilityResults
            compatibilityData={compatibilityData}
            onContinue={handleContinueFromResults}
            onDownloadGuide={handleDownloadGuide}
            onBack={() => setStage('compatibility')}
          />
        )}

        {/* STAGE 4: Transition Screen (Goal Selection) */}
        {stage === 'transition' && compatibilityData && (
          <CompatibilityTransition
            compatibilityData={compatibilityData}
            onPathSelected={handleTransitionPathSelected}
            onBack={() => setStage('results')}
          />
        )}

        {/* STAGE 5: Main App (TogetherForward) */}
        {stage === 'main' && (
          <TogetherForward
            coupleData={{
              ...coupleData,
              partner1: userData?.partner1 || coupleData.partner1,
              partner2: userData?.partner2 || coupleData.partner2,
              location: userData?.location || 'Unknown',
              locationData: userData?.locationData,
              compatibilityScore: userData?.compatibilityScore, // Pass compatibility score
              roadmapId: userData?.roadmapId, // CRITICAL FIX: Pass roadmap ID
              existingMilestones: userData?.existingMilestones, // CRITICAL FIX: Pass existing milestones
              xp_points: userData?.xp_points // CRITICAL FIX: Pass XP points
            }}
            userGoals={userData?.goals || []}
            conversationHistory={userData?.conversationHistory || []}
            compatibilityData={userData?.compatibilityData} // Pass full compatibility data
            selectedTemplates={userData?.selectedTemplates} // NEW: Pass selected templates
            customGoal={userData?.customGoal} // NEW: Pass custom goal
            instantGoals={userData?.instantGoals || []} // NEW: Pass instant goals from transition
            roadmap={roadmap}
            deepDiveData={deepDiveData}
            onBack={handleBackToDashboard} // Back navigation handler
            onGoToDashboard={handleGoToDashboard} // Navigate to dashboard
            onGoToProfile={handleGoToProfile} // Navigate to profile
            onGoToSettings={handleGoToSettings} // Navigate to settings
            onOpenDeepDive={handleOpenDeepDive} // Navigate to full-page Deep Dive (legacy)
            onOpenMilestoneDetail={handleOpenMilestoneDetail} // NEW: Navigate to multi-section milestone detail
          />
        )}

        {/* STAGE 6: Milestone Detail Page (NEW - Multi-section navigation) */}
        {stage === 'milestoneDetail' && milestoneDetailState.milestone && (
          <MilestoneDetailPage
            milestone={milestoneDetailState.milestone}
            section={milestoneDetailState.section}
            onSectionChange={handleMilestoneDetailSectionChange}
            onBack={handleBackFromMilestoneDetail}
            onUpdateMilestone={handleUpdateMilestoneFromDetail}
            roadmapId={userData?.roadmapId}
            userContext={{
              partner1: userData?.partner1 || selectedRoadmap?.partner1_name || coupleData.partner1,
              partner2: userData?.partner2 || selectedRoadmap?.partner2_name || coupleData.partner2,
              location: userData?.location || 'Unknown',
              userId: user?.id
            }}
          />
        )}

        {/* STAGE 7: Deep Dive Full Page (Legacy - for backward compatibility) */}
        {stage === 'deepDive' && deepDiveMilestone && (
          <DeepDivePage
            milestone={deepDiveMilestone}
            onBack={handleBackFromDeepDive}
            onUpdateMilestone={handleUpdateMilestoneFromDeepDive}
            roadmapId={userData?.roadmapId}
            chatProps={{
              chatMessages: deepDiveChatMessages,
              sendChatMessage: handleSendDeepDiveMessage,
              isChatLoading: isDeepDiveChatLoading
            }}
            userContext={{
              partner1: userData?.partner1 || selectedRoadmap?.partner1_name || coupleData.partner1,
              partner2: userData?.partner2 || selectedRoadmap?.partner2_name || coupleData.partner2,
              location: userData?.location || 'Unknown',
              userId: user?.id
            }}
          />
        )}

        {/* STAGE 8: Luna Assessment (Journey Intelligence) */}
        {stage === 'assessment' && (
          <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            <div className="container mx-auto px-6 py-8 max-w-6xl">
              <div className="mb-6">
                <button
                  onClick={handleBackToDashboard}
                  className="px-4 py-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors flex items-center gap-2 text-stone-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </button>
              </div>
              <LunaAssessment
                userId={user?.id}
                roadmapId={userData?.roadmapId || selectedRoadmap?.id}
                userContext={{
                  partner1_name: userData?.partner1 || selectedRoadmap?.partner1_name || coupleData.partner1,
                  partner2_name: userData?.partner2 || selectedRoadmap?.partner2_name || coupleData.partner2,
                  location: userData?.location || selectedRoadmap?.location || 'Unknown'
                }}
              />
            </div>
          </div>
        )}

        {/* STAGE 9: Portfolio Overview (Cross-Dream Intelligence) - NEW */}
        {stage === 'portfolioOverview' && (
          <PortfolioOverview
            onBack={handleBackToDashboard}
            userId={user?.id}
            userContext={{
              partner1_name: userData?.partner1 || selectedRoadmap?.partner1_name || coupleData.partner1,
              partner2_name: userData?.partner2 || selectedRoadmap?.partner2_name || coupleData.partner2,
              partner1: userData?.partner1 || selectedRoadmap?.partner1_name || coupleData.partner1,
              partner2: userData?.partner2 || selectedRoadmap?.partner2_name || coupleData.partner2,
              location: userData?.location || selectedRoadmap?.location || 'Unknown'
            }}
          />
        )}

        {/* STAGE 10: Dream Share Invite Acceptance */}
        {stage === 'invite' && (
          <AcceptInvitePage />
        )}

        {/* STAGE 11: Global Partnership Invite Acceptance */}
        {stage === 'partnerInvite' && (
          <AcceptPartnerInvitePage />
        )}

        {/* Mobile Bottom Navigation */}
        {showMobileNav && (
          <MobileBottomNav
            currentStage={stage}
            onNavigate={handleMobileNavigation}
          />
        )}

    </ErrorBoundary>
  );
};

// Main App wrapper with providers
const App = () => {
  return (
    <AuthProvider>
      <ProfileProvider>
        <LunaProvider>
          <CreationProgressProvider>
            <AppContent />
            {/* Luna Floating Chat System */}
            <LunaErrorBoundary variant="compact" maxRetries={3}>
              <LunaPendingBanner />
            </LunaErrorBoundary>
            <LunaErrorBoundary variant="compact" maxRetries={3}>
              <LunaFloatingButton />
            </LunaErrorBoundary>
            <LunaErrorBoundary variant="panel" maxRetries={3}>
              <LunaChatPanel />
            </LunaErrorBoundary>
            <DevTools />
          </CreationProgressProvider>
        </LunaProvider>
      </ProfileProvider>
    </AuthProvider>
  );
};

export default App;
