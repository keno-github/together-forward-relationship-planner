import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Users, Link2, Copy, Check, ArrowLeft,
  Loader2, Sparkles, MessageCircle, ChevronRight, ArrowRight, AlertCircle
} from 'lucide-react';
import PreScreeningForm from './PreScreeningForm';
import LunaQuestions from './LunaQuestions';
import WaitingForPartner from './WaitingForPartner';
import LunaAnalysisResults from './LunaAnalysisResults';
import LunaLoadingExperience from './LunaLoadingExperience';
import {
  createAssessmentSession,
  joinSessionByCode,
  updateSessionStatus,
  savePrescreeningResponses,
  getPrescreeningResponses,
  saveSessionQuestions,
  getSessionQuestions,
  saveAssessmentResults,
  getAssessmentResults,
  subscribeToAssessment,
  unsubscribe,
  checkAssessmentComplete,
  getFullAssessmentData
} from '../../services/assessmentService';
import { sendAssessmentInviteEmail } from '../../services/supabaseService';
import {
  generateAssessmentQuestions,
  analyzeAssessmentResults
} from '../../services/lunaAssessmentAI';

// Assessment stages
const STAGES = {
  MODE_SELECT: 'mode_select',
  NAMES: 'names',
  SESSION_SETUP: 'session_setup',
  PRESCREENING_P1: 'prescreening_p1',
  PRESCREENING_P2: 'prescreening_p2',
  GENERATING_QUESTIONS: 'generating_questions',
  QUESTIONS_P1: 'questions_p1',
  QUESTIONS_P2: 'questions_p2',
  WAITING_FOR_PARTNER: 'waiting_for_partner',
  ANALYZING: 'analyzing',
  RESULTS: 'results'
};

// Premium styles
const styles = `
  .assessment-hub {
    --color-bg: #faf8f5;
    --color-bg-alt: #f5f2ed;
    --color-text: #2d2926;
    --color-text-muted: #6b635b;
    --color-accent: #c9a68a;
    --color-accent-dark: #a88968;
    --color-success: #7d8c75;
    --color-border: #e8e4de;
    --color-card: #ffffff;
    --font-display: 'Playfair Display', Georgia, serif;
    --font-body: 'DM Sans', -apple-system, sans-serif;

    font-family: var(--font-body);
    background: var(--color-bg);
    color: var(--color-text);
    min-height: 100vh;
  }

  .assessment-hub * {
    box-sizing: border-box;
  }

  /* Hero Landing */
  .hero-landing {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  .hero-landing::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -30%;
    width: 80%;
    height: 100%;
    background: radial-gradient(ellipse, rgba(201, 166, 138, 0.15) 0%, transparent 60%);
    pointer-events: none;
  }

  .hero-landing::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -20%;
    width: 60%;
    height: 80%;
    background: radial-gradient(ellipse, rgba(125, 140, 117, 0.1) 0%, transparent 60%);
    pointer-events: none;
  }

  .hero-content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    position: relative;
    z-index: 10;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(201, 166, 138, 0.15);
    border: 1px solid rgba(201, 166, 138, 0.3);
    border-radius: 100px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-accent-dark);
    margin-bottom: 2rem;
  }

  .hero-title {
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-weight: 500;
    text-align: center;
    line-height: 1.15;
    margin-bottom: 1rem;
    max-width: 700px;
  }

  .hero-subtitle {
    font-size: 1.125rem;
    color: var(--color-text-muted);
    text-align: center;
    max-width: 500px;
    line-height: 1.7;
    margin-bottom: 3rem;
  }

  /* Mode Cards */
  .mode-selection {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    max-width: 600px;
    width: 100%;
    margin-bottom: 2rem;
  }

  @media (max-width: 600px) {
    .mode-selection {
      grid-template-columns: 1fr;
    }
  }

  .mode-card {
    position: relative;
    background: var(--color-card);
    border: 2px solid var(--color-border);
    border-radius: 20px;
    padding: 2rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
    overflow: hidden;
  }

  .mode-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--color-accent), var(--color-accent-dark));
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .mode-card:hover {
    border-color: var(--color-accent);
    transform: translateY(-4px);
    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.1);
  }

  .mode-card.selected {
    border-color: var(--color-accent);
  }

  .mode-card.selected::before {
    opacity: 1;
  }

  .mode-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: var(--color-bg-alt);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.25rem;
    transition: all 0.3s ease;
  }

  .mode-card.selected .mode-icon {
    background: linear-gradient(135deg, var(--color-accent), var(--color-accent-dark));
    color: white;
  }

  .mode-title {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .mode-description {
    font-size: 0.9375rem;
    color: var(--color-text-muted);
    line-height: 1.5;
  }

  /* Form Container */
  .form-container {
    max-width: 480px;
    width: 100%;
    margin: 0 auto;
    padding: 2rem;
  }

  .form-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .form-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-accent), var(--color-accent-dark));
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    color: white;
  }

  .form-title {
    font-family: var(--font-display);
    font-size: 1.75rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .form-subtitle {
    font-size: 1rem;
    color: var(--color-text-muted);
    line-height: 1.6;
  }

  /* Input Fields */
  .input-group {
    margin-bottom: 1.25rem;
  }

  .input-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
    margin-bottom: 0.5rem;
  }

  .input-field {
    width: 100%;
    padding: 1rem 1.25rem;
    border: 2px solid var(--color-border);
    border-radius: 12px;
    font-family: var(--font-body);
    font-size: 1rem;
    background: var(--color-card);
    transition: all 0.2s ease;
    outline: none;
  }

  .input-field:focus {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 4px rgba(201, 166, 138, 0.1);
  }

  .input-field::placeholder {
    color: #b5ada5;
  }

  /* Session Code Display */
  .session-code-card {
    background: var(--color-card);
    border: 2px solid var(--color-border);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }

  .session-code-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-muted);
    margin-bottom: 0.5rem;
  }

  .session-code-value {
    font-family: var(--font-display);
    font-size: 2.5rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: var(--color-text);
  }

  .share-link-container {
    display: flex;
    gap: 0.75rem;
  }

  .share-link-input {
    flex: 1;
    padding: 0.875rem 1rem;
    border: 2px solid var(--color-border);
    border-radius: 10px;
    font-family: var(--font-body);
    font-size: 0.875rem;
    background: var(--color-bg-alt);
    color: var(--color-text-muted);
    outline: none;
  }

  .copy-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.25rem;
    border: none;
    border-radius: 10px;
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .copy-btn.default {
    background: var(--color-text);
    color: white;
  }

  .copy-btn.copied {
    background: var(--color-success);
    color: white;
  }

  /* Buttons */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #2d2926 0%, #3d3633 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-family: var(--font-body);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    background: transparent;
    color: var(--color-text-muted);
    border: 2px solid var(--color-border);
    border-radius: 12px;
    font-family: var(--font-body);
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-secondary:hover {
    border-color: var(--color-accent);
    color: var(--color-text);
  }

  .btn-group {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .btn-group .btn-secondary {
    flex-shrink: 0;
  }

  .btn-group .btn-primary {
    flex: 1;
  }

  /* Back Button */
  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: absolute;
    top: 2rem;
    left: 2rem;
    z-index: 20;
  }

  .back-btn:hover {
    color: var(--color-text);
  }

  /* Loading States */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;
    padding: 2rem;
  }

  .loading-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-accent), var(--color-accent-dark));
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
    color: white;
  }

  .loading-title {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .loading-subtitle {
    font-size: 1rem;
    color: var(--color-text-muted);
    max-width: 400px;
  }

  .pulse-animation {
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .spin-animation {
    animation: spin 2s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Error Message */
  .error-message {
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    font-size: 0.875rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  /* Trust Indicators */
  .trust-indicators {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-border);
  }

  .trust-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  .trust-icon {
    width: 16px;
    height: 16px;
    color: var(--color-success);
  }
`;

const AssessmentHub = ({ onBack, onComplete, joinCode = null }) => {
  // Core state
  const [stage, setStage] = useState(joinCode ? 'joining' : STAGES.MODE_SELECT);
  const [mode, setMode] = useState('together');
  const [session, setSession] = useState(null);
  const [currentPartner, setCurrentPartner] = useState(1);

  // Form state
  const [partner1Name, setPartner1Name] = useState('');
  const [partner2Name, setPartner2Name] = useState('');
  const [partner1Email, setPartner1Email] = useState('');
  const [partner2Email, setPartner2Email] = useState('');

  // Data state
  const [prescreening, setPrescreening] = useState({ partner1: null, partner2: null });
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [realtimeChannel, setRealtimeChannel] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null); // 'sent', 'failed', or null

  // Refs to track current values for realtime callbacks (avoids stale closures)
  const stageRef = useRef(stage);
  const currentPartnerRef = useRef(currentPartner);

  // Keep refs in sync with state
  useEffect(() => { stageRef.current = stage; }, [stage]);
  useEffect(() => { currentPartnerRef.current = currentPartner; }, [currentPartner]);

  // Join existing session if code provided
  useEffect(() => {
    if (joinCode) {
      // Inline join session logic to avoid stale closure issues
      const joinSession = async () => {
        setLoading(true);
        setError(null);

        try {
          const { data, error: joinError } = await joinSessionByCode(joinCode);
          if (joinError) throw joinError;

          setSession(data);
          setPartner1Name(data.partner1_name);
          setPartner2Name(data.partner2_name);
          setMode('separate');
          setCurrentPartner(2);

          if (data.isCompleted) {
            // Load results for completed sessions
            const { data: existingResults } = await getAssessmentResults(data.id);
            if (existingResults) {
              setResults(existingResults);
            }
            setStage(STAGES.RESULTS);
          } else if (data.status === 'prescreening' || data.status === 'prescreening_p1_complete') {
            setStage(STAGES.PRESCREENING_P2);
          } else if (data.status === 'questions_ready' || data.status === 'partner1_answering' || data.status === 'partner2_answering') {
            const { data: questionsData } = await getSessionQuestions(data.id);
            setQuestions(questionsData || []);
            setStage(STAGES.QUESTIONS_P2);
          } else if (data.status === 'partner1_complete') {
            const { data: questionsData } = await getSessionQuestions(data.id);
            setQuestions(questionsData || []);
            setStage(STAGES.QUESTIONS_P2);
          } else if (data.status === 'partner2_complete') {
            setStage(STAGES.WAITING_FOR_PARTNER);
          }
        } catch (err) {
          setError(err.message || 'Failed to join session');
          setStage(STAGES.MODE_SELECT);
        } finally {
          setLoading(false);
        }
      };

      joinSession();
    }
  }, [joinCode]);

  // Subscribe to realtime updates when session exists
  useEffect(() => {
    if (session?.id && mode === 'separate') {
      const channel = subscribeToAssessment(session.id, {
        onSessionUpdate: handleSessionUpdate,
        onNewAnswer: handleNewAnswer,
        onPartnerProgress: handlePartnerProgress
      });
      setRealtimeChannel(channel);

      return () => {
        unsubscribe(channel);
      };
    }
  }, [session?.id, mode]);

  // Realtime handlers - use refs to avoid stale closures
  const handleSessionUpdate = useCallback(async (updatedSession) => {
    setSession(updatedSession);
    const currentStage = stageRef.current;
    const partner = currentPartnerRef.current;

    // Handle different status transitions
    if (updatedSession.status === 'completed') {
      // Load results when assessment is complete
      const { data: existingResults } = await getAssessmentResults(updatedSession.id);
      if (existingResults) {
        setResults(existingResults);
      }
      setStage(STAGES.RESULTS);
    } else if (updatedSession.status === 'questions_ready' && currentStage === STAGES.WAITING_FOR_PARTNER) {
      // Partner 2 was waiting for questions to be generated
      const { data: questionsData } = await getSessionQuestions(updatedSession.id);
      if (questionsData && questionsData.length > 0) {
        setQuestions(questionsData);
        setStage(STAGES.QUESTIONS_P2);
      }
    } else if (updatedSession.status === 'both_complete' ||
               (updatedSession.status === 'partner2_complete' && partner === 1) ||
               (updatedSession.status === 'partner1_complete' && partner === 2)) {
      // Partner finished - check if both are done
      const completion = await checkAssessmentComplete(updatedSession.id);
      if (completion.bothComplete && currentStage === STAGES.WAITING_FOR_PARTNER) {
        setStage(STAGES.ANALYZING);
        // The other partner will trigger analysis
      }
    }
  }, []); // Empty deps - uses refs for current values

  const handleNewAnswer = useCallback((response) => {
    console.log('Partner answered a question');
  }, []);

  const handlePartnerProgress = useCallback((partnerNum, count) => {
    console.log(`Partner ${partnerNum} has answered ${count} questions`);
  }, []);

  // Create new session
  const handleCreateSession = async () => {
    if (!partner1Name.trim() || !partner2Name.trim()) {
      setError('Please enter both names');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await createAssessmentSession({
        partner1Name: partner1Name.trim(),
        partner2Name: partner2Name.trim(),
        partner1Email: partner1Email.trim() || null,
        partner2Email: partner2Email.trim() || null,
        mode
      });

      if (error) throw error;
      setSession(data);

      // Send email invite if partner email provided in separate mode
      if (mode === 'separate' && partner2Email.trim()) {
        try {
          const { error: emailError } = await sendAssessmentInviteEmail(partner2Email.trim(), {
            inviterName: partner1Name.trim(),
            partnerName: partner2Name.trim(),
            sessionCode: data.session_code
          });

          if (emailError) {
            console.warn('Email send failed:', emailError);
            setEmailStatus('failed');
          } else {
            setEmailStatus('sent');
          }
        } catch (emailErr) {
          console.warn('Email send error:', emailErr);
          setEmailStatus('failed');
        }
      }

      if (mode === 'separate') {
        setStage(STAGES.SESSION_SETUP);
      } else {
        setStage(STAGES.PRESCREENING_P1);
      }
    } catch (err) {
      setError(err.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  // Handle pre-screening completion
  const handlePrescreeningComplete = async (partnerNumber, answers) => {
    setLoading(true);
    setError(null); // Clear any previous errors

    try {
      await savePrescreeningResponses(session.id, partnerNumber, answers);

      if (partnerNumber === 1) {
        setPrescreening(prev => ({ ...prev, partner1: answers }));

        if (mode === 'together') {
          setCurrentPartner(2);
          setStage(STAGES.PRESCREENING_P2);
        } else {
          await updateSessionStatus(session.id, 'prescreening_p1_complete');
          setStage(STAGES.GENERATING_QUESTIONS);
          await generateQuestions();
        }
      } else {
        setPrescreening(prev => ({ ...prev, partner2: answers }));

        if (mode === 'together') {
          setStage(STAGES.GENERATING_QUESTIONS);
          await generateQuestions();
        } else {
          await updateSessionStatus(session.id, 'prescreening_complete');
          const { data: existingQuestions } = await getSessionQuestions(session.id);
          if (existingQuestions && existingQuestions.length > 0) {
            setQuestions(existingQuestions);
            setStage(STAGES.QUESTIONS_P2);
          } else {
            setStage(STAGES.WAITING_FOR_PARTNER);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to save responses');
    } finally {
      setLoading(false);
    }
  };

  // Generate Luna's questions
  const generateQuestions = async () => {
    setStage(STAGES.GENERATING_QUESTIONS);

    try {
      let prescreeningData = prescreening;
      if (!prescreeningData.partner1) {
        const { data } = await getPrescreeningResponses(session.id);
        prescreeningData = data;
        setPrescreening(data);
      }

      const { data: generatedQuestions, error } = await generateAssessmentQuestions(
        prescreeningData,
        { partner1: partner1Name, partner2: partner2Name }
      );

      if (error) {
        console.warn('Using fallback questions due to error:', error);
      }

      await saveSessionQuestions(session.id, generatedQuestions);

      const { data: savedQuestions, error: loadError } = await getSessionQuestions(session.id);

      if (loadError || !savedQuestions) {
        throw new Error('Failed to load saved questions');
      }

      console.log(`✅ Saved and loaded ${savedQuestions.length} questions with database IDs`);
      setQuestions(savedQuestions);

      await updateSessionStatus(session.id, 'questions_ready');

      setCurrentPartner(1);
      setStage(STAGES.QUESTIONS_P1);
    } catch (err) {
      setError('Failed to generate questions. Please try again.');
      console.error('Question generation error:', err);
    }
  };

  // Handle question completion
  const handleQuestionsComplete = async (partnerNumber) => {
    setLoading(true);

    try {
      if (mode === 'together') {
        if (partnerNumber === 1) {
          await updateSessionStatus(session.id, 'partner1_complete');
          setCurrentPartner(2);
          setStage(STAGES.QUESTIONS_P2);
        } else {
          await updateSessionStatus(session.id, 'both_complete');
          setStage(STAGES.ANALYZING);
          await analyzeResults();
        }
      } else {
        const statusUpdate = partnerNumber === 1 ? 'partner1_complete' : 'partner2_complete';
        await updateSessionStatus(session.id, statusUpdate);

        const completion = await checkAssessmentComplete(session.id);
        if (completion.bothComplete) {
          setStage(STAGES.ANALYZING);
          await analyzeResults();
        } else {
          setStage(STAGES.WAITING_FOR_PARTNER);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to save completion');
    } finally {
      setLoading(false);
    }
  };

  // Analyze results with Luna
  const analyzeResults = async () => {
    setStage(STAGES.ANALYZING);

    try {
      const { data: fullData } = await getFullAssessmentData(session.id);
      const { data: analysis, error } = await analyzeAssessmentResults(fullData);

      if (error) {
        console.warn('Analysis had errors, using fallback:', error);
      }

      await saveAssessmentResults(session.id, analysis);
      await updateSessionStatus(session.id, 'completed');

      setResults(analysis);
      setStage(STAGES.RESULTS);
    } catch (err) {
      setError('Failed to analyze results. Please try again.');
      console.error('Analysis error:', err);
    }
  };

  // Load existing results
  const loadResults = async (sessionId = session?.id) => {
    try {
      const { data } = await getAssessmentResults(sessionId);
      if (data) {
        setResults(data);
        setStage(STAGES.RESULTS);
      }
    } catch (err) {
      console.error('Error loading results:', err);
    }
  };

  // Copy share link
  const copyShareLink = () => {
    navigator.clipboard.writeText(session?.shareLink || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render based on current stage
  const renderStage = () => {
    switch (stage) {
      case 'joining':
        return (
          <div className="loading-container">
            <motion.div
              className="loading-icon spin-animation"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Loader2 size={32} />
            </motion.div>
            <h2 className="loading-title">Joining Session</h2>
            <p className="loading-subtitle">Connecting you with your partner's assessment...</p>
          </div>
        );

      case STAGES.MODE_SELECT:
        return (
          <motion.div
            className="hero-landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="hero-content-wrapper">
              <motion.div
                className="hero-badge"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Heart size={14} />
                <span>Relationship Assessment</span>
              </motion.div>

              <motion.h1
                className="hero-title"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Discover Where You Align
              </motion.h1>

              <motion.p
                className="hero-subtitle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Luna will guide you through thoughtful questions designed to uncover your shared values and growth opportunities.
              </motion.p>

              <motion.div
                className="mode-selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div
                  className={`mode-card ${mode === 'together' ? 'selected' : ''}`}
                  onClick={() => setMode('together')}
                >
                  <div className="mode-icon">
                    <Users size={24} />
                  </div>
                  <h3 className="mode-title">Together Mode</h3>
                  <p className="mode-description">
                    Take turns on the same device. Perfect for date night.
                  </p>
                </div>

                <div
                  className={`mode-card ${mode === 'separate' ? 'selected' : ''}`}
                  onClick={() => setMode('separate')}
                >
                  <div className="mode-icon">
                    <Link2 size={24} />
                  </div>
                  <h3 className="mode-title">Separate Mode</h3>
                  <p className="mode-description">
                    Each on your own device. Share a link to your partner.
                  </p>
                </div>
              </motion.div>

              <motion.button
                className="btn-primary"
                onClick={() => setStage(STAGES.NAMES)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                style={{ maxWidth: '300px' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Begin Assessment
                <ArrowRight size={18} />
              </motion.button>

              <motion.div
                className="trust-indicators"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="trust-item">
                  <Check className="trust-icon" />
                  <span>Private & Secure</span>
                </div>
                <div className="trust-item">
                  <Check className="trust-icon" />
                  <span>15-20 Minutes</span>
                </div>
                <div className="trust-item">
                  <Check className="trust-icon" />
                  <span>AI-Powered Insights</span>
                </div>
              </motion.div>

              {/* Back to Dashboard button */}
              {onBack && (
                <motion.button
                  className="btn-secondary"
                  onClick={onBack}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  style={{
                    marginTop: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <ArrowLeft size={18} />
                  Back to Dashboard
                </motion.button>
              )}
            </div>
          </motion.div>
        );

      case STAGES.NAMES:
        return (
          <motion.div
            className="form-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ paddingTop: '4rem' }}
          >
            <div className="form-header">
              <motion.div
                className="form-icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <Sparkles size={28} />
              </motion.div>
              <h2 className="form-title">Let's Get Acquainted</h2>
              <p className="form-subtitle">
                Enter your names so Luna can personalize your experience
              </p>
            </div>

            <div className="input-group">
              <label className="input-label">Your Name</label>
              <input
                type="text"
                value={partner1Name}
                onChange={(e) => setPartner1Name(e.target.value)}
                placeholder="e.g., Sarah"
                className="input-field"
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label">Partner's Name</label>
              <input
                type="text"
                value={partner2Name}
                onChange={(e) => setPartner2Name(e.target.value)}
                placeholder="e.g., Michael"
                className="input-field"
              />
            </div>

            {mode === 'separate' && (
              <div className="input-group">
                <label className="input-label">Partner's Email (optional)</label>
                <input
                  type="email"
                  value={partner2Email}
                  onChange={(e) => setPartner2Email(e.target.value)}
                  placeholder="To send them an invite"
                  className="input-field"
                />
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="btn-group">
              <button
                className="btn-secondary"
                onClick={() => setStage(STAGES.MODE_SELECT)}
              >
                <ArrowLeft size={18} />
                Back
              </button>
              <motion.button
                className="btn-primary"
                onClick={handleCreateSession}
                disabled={loading || !partner1Name.trim() || !partner2Name.trim()}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <Loader2 size={20} className="spin-animation" />
                ) : (
                  <>
                    Continue
                    <ChevronRight size={18} />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        );

      case STAGES.SESSION_SETUP:
        return (
          <motion.div
            className="form-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ paddingTop: '4rem' }}
          >
            <div className="form-header">
              <motion.div
                className="form-icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                style={{ background: 'linear-gradient(135deg, #7d8c75, #5a6b54)' }}
              >
                <Check size={28} />
              </motion.div>
              <h2 className="form-title">Share with {partner2Name}</h2>
              <p className="form-subtitle">
                Send this link so they can join your assessment session
              </p>
            </div>

            <div className="session-code-card">
              <div className="session-code-label">Session Code</div>
              <div className="session-code-value">{session?.session_code}</div>
            </div>

            <div className="session-code-card">
              <div className="session-code-label">Share Link</div>
              <div className="share-link-container">
                <input
                  type="text"
                  value={session?.shareLink || ''}
                  readOnly
                  className="share-link-input"
                />
                <button
                  onClick={copyShareLink}
                  className={`copy-btn ${copied ? 'copied' : 'default'}`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Email status feedback */}
            {emailStatus && partner2Email && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  marginTop: '1rem',
                  fontSize: '0.875rem',
                  background: emailStatus === 'sent'
                    ? 'rgba(34, 197, 94, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                  color: emailStatus === 'sent' ? '#16a34a' : '#dc2626',
                }}
              >
                {emailStatus === 'sent' ? (
                  <>
                    <Check size={16} />
                    <span>Email sent to {partner2Email}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} />
                    <span>Email couldn't be sent. Share the link manually.</span>
                  </>
                )}
              </motion.div>
            )}

            <motion.button
              className="btn-primary"
              onClick={() => {
                setCurrentPartner(1);
                setStage(STAGES.PRESCREENING_P1);
              }}
              style={{ marginTop: '1.5rem' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Start My Assessment
              <ArrowRight size={18} />
            </motion.button>
          </motion.div>
        );

      case STAGES.PRESCREENING_P1:
      case STAGES.PRESCREENING_P2:
        const prescreeningPartner = stage === STAGES.PRESCREENING_P1 ? 1 : 2;
        const prescreeningName = prescreeningPartner === 1 ? partner1Name : partner2Name;

        const handlePrescreeningBack = () => {
          if (stage === STAGES.PRESCREENING_P1) {
            setStage(mode === 'separate' ? STAGES.SESSION_SETUP : STAGES.NAMES);
          } else {
            setStage(STAGES.PRESCREENING_P1);
            setCurrentPartner(1);
          }
        };

        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="form-container"
            style={{ maxWidth: '600px', paddingTop: '3rem' }}
          >
            <PreScreeningForm
              partnerName={prescreeningName}
              partnerNumber={prescreeningPartner}
              onComplete={(answers) => handlePrescreeningComplete(prescreeningPartner, answers)}
              onBack={handlePrescreeningBack}
              initialAnswers={prescreeningPartner === 1 ? prescreening.partner1 : prescreening.partner2}
              isSubmitting={loading}
              submitError={error}
            />
          </motion.div>
        );

      case STAGES.GENERATING_QUESTIONS:
        // Get focus areas from prescreening data
        const focusAreas = prescreening.partner1?.focus_areas || prescreening.partner2?.focus_areas || [];
        return <LunaLoadingExperience type="questions" focusAreas={focusAreas} />;

      case STAGES.QUESTIONS_P1:
      case STAGES.QUESTIONS_P2:
        const questionPartner = stage === STAGES.QUESTIONS_P1 ? 1 : 2;
        const questionName = questionPartner === 1 ? partner1Name : partner2Name;

        return (
          <motion.div
            key={`questions-partner-${questionPartner}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}
          >
            <LunaQuestions
              key={`luna-questions-${questionPartner}`}
              sessionId={session?.id}
              partnerName={questionName}
              partnerNumber={questionPartner}
              questions={questions}
              onComplete={() => handleQuestionsComplete(questionPartner)}
            />
          </motion.div>
        );

      case STAGES.WAITING_FOR_PARTNER:
        const waitingForPartner = currentPartner === 1 ? partner2Name : partner1Name;
        const waitingType = session?.status === 'prescreening' ? 'prescreening' : 'questions';

        return (
          <WaitingForPartner
            sessionId={session?.id}
            sessionCode={session?.session_code}
            partnerName={waitingForPartner}
            waitingFor={waitingType}
            onPartnerReady={() => {
              setStage(STAGES.ANALYZING);
              analyzeResults();
            }}
          />
        );

      case STAGES.ANALYZING:
        const analysisFocusAreas = prescreening.partner1?.focus_areas || prescreening.partner2?.focus_areas || [];
        return <LunaLoadingExperience type="analysis" focusAreas={analysisFocusAreas} />;

      case STAGES.RESULTS:
        return (
          <LunaAnalysisResults
            results={results}
            partner1Name={partner1Name}
            partner2Name={partner2Name}
            onStartConversation={onComplete}
            onNewAssessment={() => {
              setStage(STAGES.MODE_SELECT);
              setSession(null);
              setQuestions([]);
              setResults(null);
              setPrescreening({ partner1: null, partner2: null });
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="assessment-hub">
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />

      <style>{styles}</style>

      {/* Back button */}
      {stage !== STAGES.RESULTS && stage !== 'joining' && stage !== STAGES.MODE_SELECT && (
        <motion.button
          className="back-btn"
          onClick={onBack}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ArrowLeft size={18} />
          Exit
        </motion.button>
      )}

      {/* Main content */}
      <AnimatePresence mode="wait">
        {renderStage()}
      </AnimatePresence>
    </div>
  );
};

export default AssessmentHub;
