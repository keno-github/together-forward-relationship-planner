import React, { useState } from 'react';
import ErrorBoundary from './Components/ErrorBoundary';
import LandingPage from './Components/LandingPage';
import VisionCompatibility from './Components/VisionCompatibility';
import CompatibilityResults from './Components/CompatibilityResults';
import TogetherForward from './TogetherForward';
import { coupleData, roadmap, deepDiveData } from './SampleData';
import { calculateCompatibilityScore, generateDiscussionGuide } from './utils/compatibilityScoring';

const App = () => {
  // Track app stage: landing, compatibility, results, main
  const [stage, setStage] = useState('landing');
  const [userData, setUserData] = useState(null);
  const [compatibilityData, setCompatibilityData] = useState(null);

  // Handle landing page completion
  const handleLandingComplete = (data) => {
    if (data.chosenPath === 'compatibility') {
      // User chose compatibility path
      setStage('compatibility');
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

  // Handle continue from results (go to Luna/main app)
  const handleContinueFromResults = () => {
    // Prepare user data from compatibility assessment
    const preparedUserData = {
      partner1: compatibilityData.partner1Name,
      partner2: compatibilityData.partner2Name,
      location: compatibilityData.location || 'Unknown',
      locationData: null,
      goals: [], // Will be filled by Luna chat
      compatibilityScore: compatibilityData.alignmentScore,
      compatibilityData: compatibilityData // Store for Luna's reference
    };

    setUserData(preparedUserData);
    setStage('main');
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

  return (
    <ErrorBoundary>
      {/* STAGE 1: Landing Page */}
      {stage === 'landing' && (
        <LandingPage onComplete={handleLandingComplete} />
      )}

      {/* STAGE 2: Compatibility Assessment */}
      {stage === 'compatibility' && (
        <VisionCompatibility
          onComplete={handleCompatibilityComplete}
          location="Unknown" // You can get this from geolocation if needed
        />
      )}

      {/* STAGE 3: Compatibility Results */}
      {stage === 'results' && compatibilityData && (
        <CompatibilityResults
          compatibilityData={compatibilityData}
          onContinue={handleContinueFromResults}
          onDownloadGuide={handleDownloadGuide}
        />
      )}

      {/* STAGE 4: Main App (TogetherForward) */}
      {stage === 'main' && (
        <TogetherForward
          coupleData={{
            ...coupleData,
            partner1: userData?.partner1 || coupleData.partner1,
            partner2: userData?.partner2 || coupleData.partner2,
            location: userData?.location || 'Unknown',
            locationData: userData?.locationData,
            compatibilityScore: userData?.compatibilityScore // Pass compatibility score
          }}
          userGoals={userData?.goals || []}
          conversationHistory={userData?.conversationHistory || []}
          compatibilityData={userData?.compatibilityData} // Pass full compatibility data
          roadmap={roadmap}
          deepDiveData={deepDiveData}
        />
      )}
    </ErrorBoundary>
  );
};

export default App;
