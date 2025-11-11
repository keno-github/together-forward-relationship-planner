import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import ErrorBoundary from './Components/ErrorBoundary';
import LandingPage from './Components/LandingPageNew';
import Dashboard from './Components/Dashboard';
import RoadmapProfile from './Components/RoadmapProfile';
import Profile from './Components/Profile';
import Settings from './Components/Settings';
import VisionCompatibility from './Components/VisionCompatibility';
import CompatibilityResults from './Components/CompatibilityResults';
import CompatibilityTransition from './Components/CompatibilityTransition';
import TogetherForward from './TogetherForward';
import DeepDivePage from './Components/DeepDivePage';
import AuthTest from './Components/AuthTest';
import { coupleData, roadmap, deepDiveData } from './SampleData';
import { calculateCompatibilityScore, generateDiscussionGuide } from './utils/compatibilityScoring';
import { getUserRoadmaps, getMilestonesByRoadmap } from './services/supabaseService';

// Inner component that uses auth context
const AppContent = () => {
  const { user, loading: authLoading } = useAuth();

  // Track app stage: landing, dashboard, roadmapProfile, profile, settings, compatibility, results, transition, main, deepDive, authTest
  const [stage, setStage] = useState('loading'); // Start with loading
  const [userData, setUserData] = useState(null);
  const [compatibilityData, setCompatibilityData] = useState(null);
  const [selectedGoalsFromTransition, setSelectedGoalsFromTransition] = useState([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [checkingRoadmaps, setCheckingRoadmaps] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false); // NEW: Track if initial check completed
  const [deepDiveMilestone, setDeepDiveMilestone] = useState(null); // NEW: Track milestone for Deep Dive page

  // Initialize app - always show landing page (no automatic dashboard redirect)
  useEffect(() => {
    const initializeApp = async () => {
      if (authLoading) return; // Wait for auth to load

      // CRITICAL FIX: Only run check if we're still in 'loading' stage
      // Don't redirect if user is already navigating (in roadmapProfile, main, etc.)
      if (stage !== 'loading' && initialCheckDone) {
        return; // User is actively using the app, don't redirect
      }

      // NEW UX: Always show landing page first (no automatic dashboard redirect)
      // The landing page will show appropriate CTAs based on user state
      setStage('landing');

      setCheckingRoadmaps(false);
      setInitialCheckDone(true); // Mark initial check as done
    };

    initializeApp();
  }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const handleLandingComplete = (data) => {
    if (data.chosenPath === 'compatibility') {
      // User chose compatibility path
      setStage('compatibility');
    } else if (data.chosenPath === 'luna') {
      // User chose Luna AI path - go to main app with Luna mode enabled
      setUserData({
        ...data,
        openLunaOnStart: true // Flag to open Luna immediately
      });
      setStage('main');
    } else {
      // User chose "ready" path - go straight to main app
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
    // Go to roadmap profile page (not directly to main)
    setSelectedRoadmap(roadmap);
    setStage('roadmapProfile');
  };

  const handleContinueFromProfile = async () => {
    // From RoadmapProfile → Load data and go to main app
    if (!selectedRoadmap) return;

    // Load milestones
    const { data: milestones } = await getMilestonesByRoadmap(selectedRoadmap.id);

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
    if (milestones && milestones.length > 0) {
      userData.existingMilestones = milestones;
    }

    setUserData(userData);
    setStage('main');
  };

  const handleCreateNewRoadmap = async () => {
    // Check if user has existing roadmaps to determine flow
    setUserData(null);
    setSelectedRoadmap(null);

    // Check if user already has roadmaps (returning user)
    if (user) {
      try {
        const { data: roadmaps } = await getUserRoadmaps();
        const isReturningUser = roadmaps && roadmaps.length > 0;

        // Pass flag to Landing Page to skip hero for returning users
        setUserData({ isReturningUser });
      } catch (error) {
        console.error('Error checking roadmaps:', error);
      }
    }

    setStage('landing');
  };

  // Navigation handlers
  const handleGoToDashboard = () => {
    setStage('dashboard');
  };

  const handleGoToProfile = () => {
    setStage('profile');
  };

  const handleGoToSettings = () => {
    setStage('settings');
  };

  const handleBackToDashboard = () => {
    if (user) {
      setStage('dashboard');
    } else {
      setStage('landing');
    }
  };

  const handleBackToLanding = () => {
    setStage('landing');
  };

  // Deep Dive handlers
  const handleOpenDeepDive = (milestone) => {
    setDeepDiveMilestone(milestone);
    setStage('deepDive');
  };

  const handleBackFromDeepDive = () => {
    setDeepDiveMilestone(null);
    setStage('main'); // Return to main app
  };

  const handleUpdateMilestoneFromDeepDive = (updatedMilestone) => {
    // Update the milestone in the parent state
    // This will be passed to TogetherForward to update its milestone list
    setDeepDiveMilestone(updatedMilestone);
  };

  return (
    <ErrorBoundary>
      {/* TEST STAGE: Auth Test */}
      {stage === 'authTest' && (
        <AuthTest />
      )}

      {/* STAGE 0: Dashboard (for returning users) */}
      {stage === 'dashboard' && (
        <Dashboard
          onContinueRoadmap={handleContinueRoadmap}
          onCreateNew={handleCreateNewRoadmap}
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

      {/* STAGE 1: Landing Page */}
      {stage === 'landing' && (
        <LandingPage
          onComplete={handleLandingComplete}
          onBack={user ? handleBackToDashboard : null} // Only show back button if user is logged in
          onGoToDashboard={handleGoToDashboard} // Navigate to dashboard
          onGoToProfile={handleGoToProfile} // Navigate to profile
          onGoToSettings={handleGoToSettings} // Navigate to settings
          isReturningUser={userData?.isReturningUser} // Pass flag to skip hero
        />
      )}

        {/* STAGE 2: Compatibility Assessment */}
        {stage === 'compatibility' && (
          <VisionCompatibility
            onComplete={handleCompatibilityComplete}
            location="Unknown" // You can get this from geolocation if needed
            onBack={handleBackToLanding}
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
            onOpenDeepDive={handleOpenDeepDive} // NEW: Navigate to full-page Deep Dive
          />
        )}

        {/* STAGE 6: Deep Dive Full Page */}
        {stage === 'deepDive' && deepDiveMilestone && (
          <DeepDivePage
            milestone={deepDiveMilestone}
            onBack={handleBackFromDeepDive}
            onUpdateMilestone={handleUpdateMilestoneFromDeepDive}
            roadmapId={userData?.roadmapId}
            chatProps={{
              // You can pass chat props here if needed
              chatMessages: [],
              sendChatMessage: () => {},
              isChatLoading: false,
              chatInput: '',
              setChatInput: () => {}
            }}
            userContext={{
              partner1: userData?.partner1 || coupleData.partner1,
              partner2: userData?.partner2 || coupleData.partner2,
              location: userData?.location || 'Unknown'
            }}
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
        <AppContent />
      </ProfileProvider>
    </AuthProvider>
  );
};

export default App;
