import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

/**
 * Route configuration - maps stages to URL paths
 */
export const ROUTES = {
  landing: '/',
  dashboard: '/dashboard',
  profile: '/profile',
  settings: '/settings',
  goalBuilder: '/create',
  compatibility: '/assessment',
  results: '/assessment/results',
  transition: '/assessment/transition',
  main: '/journey',
  milestoneDetail: '/dream/:dreamId',
  deepDive: '/dream/:dreamId/deep-dive',
  assessment: '/luna-assessment',
  portfolioOverview: '/portfolio',
  lunaOptimization: '/optimize',
  roadmapProfile: '/roadmap/:roadmapId',
  authTest: '/auth-test',
};

/**
 * Reverse mapping - URL paths to stages
 */
const PATH_TO_STAGE = {
  '/': 'landing',
  '/dashboard': 'dashboard',
  '/profile': 'profile',
  '/settings': 'settings',
  '/create': 'goalBuilder',
  '/assessment': 'compatibility',
  '/assessment/results': 'results',
  '/assessment/transition': 'transition',
  '/journey': 'main',
  '/luna-assessment': 'assessment',
  '/portfolio': 'portfolioOverview',
  '/optimize': 'lunaOptimization',
  '/auth-test': 'authTest',
};

/**
 * Custom hook that syncs URL routing with stage state
 *
 * This allows gradual migration - existing setStage() calls still work,
 * and URLs are kept in sync automatically.
 *
 * @param {string} stage - Current stage state
 * @param {function} setStage - Stage setter function
 * @param {object} options - Additional options
 * @returns {object} Navigation helpers
 */
export const useRouteSync = (stage, setStage, options = {}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    dreamId,
    setDreamId,
    milestoneDetailState,
    setMilestoneDetailState,
  } = options;

  /**
   * Sync URL → Stage (on URL change or initial load)
   */
  useEffect(() => {
    const path = location.pathname;

    // Check for exact path matches first
    if (PATH_TO_STAGE[path]) {
      const newStage = PATH_TO_STAGE[path];
      if (stage !== newStage) {
        setStage(newStage);
      }
      return;
    }

    // Check for dynamic routes
    // Dream detail: /dream/:dreamId or /dream/:dreamId/:section
    const dreamMatch = path.match(/^\/dream\/([^/]+)(?:\/([^/]+))?$/);
    if (dreamMatch) {
      const [, extractedDreamId, section] = dreamMatch;

      if (section === 'deep-dive') {
        if (stage !== 'deepDive') {
          setStage('deepDive');
        }
      } else {
        if (stage !== 'milestoneDetail') {
          setStage('milestoneDetail');
        }
        // Update section if provided
        if (section && setMilestoneDetailState) {
          setMilestoneDetailState(prev => ({
            ...prev,
            section: section || 'overview'
          }));
        }
      }

      // Store dreamId for component to use
      if (setDreamId && extractedDreamId !== dreamId) {
        setDreamId(extractedDreamId);
      }
      return;
    }

    // Assessment join with code: /assessment/join/:code
    const assessmentJoinMatch = path.match(/^\/assessment\/join\/([^/]+)$/);
    if (assessmentJoinMatch) {
      setStage('compatibility');
      return;
    }

    // Roadmap profile: /roadmap/:roadmapId
    const roadmapMatch = path.match(/^\/roadmap\/([^/]+)$/);
    if (roadmapMatch) {
      setStage('roadmapProfile');
      return;
    }

    // Default to landing if unknown path
    if (stage !== 'landing' && path !== '/') {
      // Unknown route - could show 404 or redirect
      navigate('/', { replace: true });
    }
  }, [location.pathname]);

  /**
   * Sync Stage → URL (when stage changes via setStage)
   */
  useEffect(() => {
    const currentPath = location.pathname;
    let targetPath = ROUTES[stage] || '/';

    // Handle dynamic routes
    if (stage === 'milestoneDetail' && dreamId) {
      const section = milestoneDetailState?.section;
      targetPath = section && section !== 'overview'
        ? `/dream/${dreamId}/${section}`
        : `/dream/${dreamId}`;
    } else if (stage === 'deepDive' && dreamId) {
      targetPath = `/dream/${dreamId}/deep-dive`;
    } else if (stage === 'roadmapProfile' && options.selectedRoadmapId) {
      targetPath = `/roadmap/${options.selectedRoadmapId}`;
    }

    // Only navigate if path actually changed
    if (currentPath !== targetPath) {
      navigate(targetPath);
    }
  }, [stage, dreamId, milestoneDetailState?.section]);

  /**
   * Enhanced navigation function that updates both URL and stage
   */
  const navigateTo = useCallback((newStage, params = {}) => {
    const { dreamId: newDreamId, section, replace = false } = params;

    // Update dreamId if provided
    if (newDreamId && setDreamId) {
      setDreamId(newDreamId);
    }

    // Update section if provided
    if (section && setMilestoneDetailState) {
      setMilestoneDetailState(prev => ({ ...prev, section }));
    }

    // Update stage (this will trigger URL sync via useEffect)
    setStage(newStage);
  }, [setStage, setDreamId, setMilestoneDetailState]);

  /**
   * Get shareable URL for current state
   */
  const getShareableUrl = useCallback(() => {
    return window.location.href;
  }, []);

  /**
   * Navigate to dream detail
   */
  const navigateToDream = useCallback((dreamIdParam, section = 'overview') => {
    if (setDreamId) {
      setDreamId(dreamIdParam);
    }
    if (setMilestoneDetailState) {
      setMilestoneDetailState(prev => ({ ...prev, section }));
    }
    setStage('milestoneDetail');
    navigate(`/dream/${dreamIdParam}${section !== 'overview' ? `/${section}` : ''}`);
  }, [navigate, setStage, setDreamId, setMilestoneDetailState]);

  return {
    navigateTo,
    navigateToDream,
    getShareableUrl,
    currentPath: location.pathname,
  };
};

export default useRouteSync;
