import React, { createContext, useState, useContext, useEffect } from 'react';

const ProfileContext = createContext();

const defaultProfile = {
  // Core (collected first) - 5 essential questions
  relationshipStatus: null, // 'dating', 'engaged', 'married', 'its_complicated'
  yearsTogethër: null, // '0-1', '1-3', '3-5', '5-10', '10+'
  ageRange1: null, // '18-24', '25-34', '35-44', '45-54', '55+'
  ageRange2: null, // Same ranges
  kidsStatus: null, // 'planning', 'have_kids', 'no_kids', 'unsure'
  location: null, // String - city, state, country

  // Extended (collected contextually or later)
  housingStatus: null, // 'renting', 'own_home', 'living_with_family', 'other'
  employment1: null, // 'employed', 'self_employed', 'student', 'unemployed'
  employment2: null,
  pets: null, // Boolean or string
  alreadyAchieved: [], // Array of milestone IDs they've completed

  // Meta
  isComplete: false, // True when all core questions answered
  wasSkipped: false, // True if user chose to skip
  lastUpdated: null,
  source: null // 'compatibility', 'ready', 'prompt' - where they filled it
};

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved profile:', e);
        return defaultProfile;
      }
    }
    return defaultProfile;
  });

  // Save to localStorage whenever profile changes
  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (updates, source = null) => {
    const updated = {
      ...profile,
      ...updates,
      lastUpdated: new Date().toISOString(),
      source: source || profile.source
    };

    // Check if core questions are complete
    const coreComplete = updated.relationshipStatus &&
                        updated.yearsTogethër &&
                        updated.ageRange1 &&
                        updated.ageRange2 &&
                        updated.kidsStatus;

    updated.isComplete = coreComplete;

    setProfile(updated);
  };

  const skipProfile = () => {
    setProfile(prev => ({
      ...prev,
      wasSkipped: true,
      lastUpdated: new Date().toISOString()
    }));
  };

  const resetSkipStatus = () => {
    setProfile(prev => ({
      ...prev,
      wasSkipped: false
    }));
  };

  const isProfileMinimal = () => {
    // Check if at least core questions are answered
    return profile.relationshipStatus &&
           profile.yearsTogethër &&
           profile.ageRange1 &&
           profile.ageRange2 &&
           profile.kidsStatus;
  };

  const needsProfile = () => {
    // Returns true if profile should be shown
    return !isProfileMinimal() && !profile.wasSkipped;
  };

  const clearProfile = () => {
    setProfile(defaultProfile);
    localStorage.removeItem('userProfile');
  };

  return (
    <ProfileContext.Provider value={{
      profile,
      updateProfile,
      skipProfile,
      resetSkipStatus,
      isProfileMinimal,
      needsProfile,
      clearProfile
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
};

export default ProfileContext;
