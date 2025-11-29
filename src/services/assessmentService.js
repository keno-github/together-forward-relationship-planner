import { supabase } from '../config/supabaseClient';

// =====================================================
// SESSION MANAGEMENT
// =====================================================

/**
 * Generate a unique 8-character session code
 */
const generateSessionCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

/**
 * Create a new assessment session
 */
export const createAssessmentSession = async ({
  partner1Name,
  partner2Name,
  partner1Email = null,
  partner2Email = null,
  mode = 'together',
  userId = null
}) => {
  try {
    // Try to get current user if not provided
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    }

    const sessionCode = generateSessionCode();

    const { data, error } = await supabase
      .from('assessment_sessions')
      .insert([{
        session_code: sessionCode,
        user_id: userId,
        partner1_name: partner1Name,
        partner2_name: partner2Name,
        partner1_email: partner1Email,
        partner2_email: partner2Email,
        mode: mode,
        status: 'prescreening'
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      data: {
        ...data,
        shareLink: `${window.location.origin}/assessment/join/${data.session_code}`
      },
      error: null
    };
  } catch (error) {
    console.error('Create assessment session error:', error);
    return { data: null, error };
  }
};

/**
 * Join an existing session by code
 */
export const joinSessionByCode = async (sessionCode) => {
  try {
    const { data, error } = await supabase
      .from('assessment_sessions')
      .select('*')
      .eq('session_code', sessionCode.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Session not found. Please check the code and try again.');
      }
      throw error;
    }

    // Check if session is expired
    if (new Date(data.expires_at) < new Date()) {
      throw new Error('This session has expired. Please start a new assessment.');
    }

    // Check if session is already completed
    if (data.status === 'completed') {
      return {
        data: { ...data, isCompleted: true },
        error: null
      };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Join session error:', error);
    return { data: null, error };
  }
};

/**
 * Get session by ID
 */
export const getSessionById = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('assessment_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get session error:', error);
    return { data: null, error };
  }
};

/**
 * Update session status
 */
export const updateSessionStatus = async (sessionId, status, additionalUpdates = {}) => {
  try {
    const updates = {
      status,
      ...additionalUpdates
    };

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('assessment_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Update session status error:', error);
    return { data: null, error };
  }
};

/**
 * Get user's assessment history
 */
export const getUserAssessmentHistory = async (userId = null) => {
  try {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    if (!userId) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('assessment_summary')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get assessment history error:', error);
    return { data: null, error };
  }
};

// =====================================================
// PRE-SCREENING
// =====================================================

/**
 * Save pre-screening responses for a partner
 */
export const savePrescreeningResponses = async (sessionId, partnerNumber, responses) => {
  try {
    const { data, error } = await supabase
      .from('prescreening_responses')
      .upsert({
        session_id: sessionId,
        partner_number: partnerNumber,
        ...responses
      }, {
        onConflict: 'session_id,partner_number'
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Save prescreening error:', error);
    return { data: null, error };
  }
};

/**
 * Get pre-screening responses for a session
 */
export const getPrescreeningResponses = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('prescreening_responses')
      .select('*')
      .eq('session_id', sessionId);

    if (error) throw error;

    // Return as object keyed by partner number
    return {
      data: {
        partner1: data.find(r => r.partner_number === 1) || null,
        partner2: data.find(r => r.partner_number === 2) || null
      },
      error: null
    };
  } catch (error) {
    console.error('Get prescreening error:', error);
    return { data: null, error };
  }
};

// =====================================================
// SESSION QUESTIONS (Luna-Generated)
// =====================================================

/**
 * Save Luna-generated questions for a session
 */
export const saveSessionQuestions = async (sessionId, questions) => {
  try {
    const questionsWithSession = questions.map((q, index) => ({
      session_id: sessionId,
      question_index: index,
      category: q.category,
      importance: q.importance || 'NORMAL',
      importance_weight: q.importanceWeight || 1.0,
      question_text: q.question,
      options: q.options,
      is_conversational: q.isConversational || false
    }));

    const { data, error } = await supabase
      .from('session_questions')
      .insert(questionsWithSession)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Save session questions error:', error);
    return { data: null, error };
  }
};

/**
 * Get all questions for a session
 */
export const getSessionQuestions = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('session_questions')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_index', { ascending: true });

    if (error) throw error;

    // Transform to frontend format
    const questions = data.map(q => ({
      id: q.id,
      index: q.question_index,
      category: q.category,
      importance: q.importance,
      importanceWeight: parseFloat(q.importance_weight),
      question: q.question_text,
      options: q.options,
      isConversational: q.is_conversational
    }));

    return { data: questions, error: null };
  } catch (error) {
    console.error('Get session questions error:', error);
    return { data: null, error };
  }
};

// =====================================================
// ASSESSMENT RESPONSES
// =====================================================

/**
 * Save a single answer (real-time as user answers)
 */
export const saveAnswer = async (sessionId, questionId, partnerNumber, answerValue, answerWeight = null, isFreeText = false) => {
  try {
    const { data, error } = await supabase
      .from('assessment_responses')
      .upsert({
        session_id: sessionId,
        question_id: questionId,
        partner_number: partnerNumber,
        answer_value: answerValue,
        answer_weight: answerWeight,
        is_free_text: isFreeText,
        answered_at: new Date().toISOString()
      }, {
        onConflict: 'session_id,question_id,partner_number'
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Save answer error:', error);
    return { data: null, error };
  }
};

/**
 * Get all responses for a session
 */
export const getSessionResponses = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('assessment_responses')
      .select('*, session_questions(*)')
      .eq('session_id', sessionId)
      .order('answered_at', { ascending: true });

    if (error) throw error;

    // Group by partner
    const partner1Answers = {};
    const partner2Answers = {};

    data.forEach(response => {
      const answer = {
        value: response.answer_value,
        weight: response.answer_weight,
        isFreeText: response.is_free_text,
        questionId: response.question_id,
        answeredAt: response.answered_at
      };

      if (response.partner_number === 1) {
        partner1Answers[response.question_id] = answer;
      } else {
        partner2Answers[response.question_id] = answer;
      }
    });

    return {
      data: { partner1Answers, partner2Answers, rawResponses: data },
      error: null
    };
  } catch (error) {
    console.error('Get session responses error:', error);
    return { data: null, error };
  }
};

/**
 * Get partner's progress (number of questions answered)
 */
export const getPartnerProgress = async (sessionId, partnerNumber) => {
  try {
    const { count, error } = await supabase
      .from('assessment_responses')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('partner_number', partnerNumber);

    if (error) throw error;
    return { data: count, error: null };
  } catch (error) {
    console.error('Get partner progress error:', error);
    return { data: null, error };
  }
};

// =====================================================
// CONVERSATIONAL RESPONSES (Deep-dive follow-ups)
// =====================================================

/**
 * Save a conversational response
 */
export const saveConversationalResponse = async (sessionId, partnerNumber, topic, lunaQuestion, partnerResponse) => {
  try {
    // Get current response count for ordering
    const { count } = await supabase
      .from('conversational_responses')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('partner_number', partnerNumber)
      .eq('topic', topic);

    const { data, error } = await supabase
      .from('conversational_responses')
      .insert([{
        session_id: sessionId,
        partner_number: partnerNumber,
        topic: topic,
        luna_question: lunaQuestion,
        partner_response: partnerResponse,
        response_order: (count || 0) + 1
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Save conversational response error:', error);
    return { data: null, error };
  }
};

/**
 * Get all conversational responses for a session
 */
export const getConversationalResponses = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('conversational_responses')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get conversational responses error:', error);
    return { data: null, error };
  }
};

// =====================================================
// ASSESSMENT RESULTS
// =====================================================

/**
 * Save Luna's analysis results
 */
export const saveAssessmentResults = async (sessionId, results) => {
  try {
    const { data, error } = await supabase
      .from('assessment_results')
      .upsert({
        session_id: sessionId,
        alignment_score: results.alignmentScore,
        category_scores: results.categoryScores,
        luna_analysis: results.lunaAnalysis,
        strong_alignments: results.strongAlignments,
        misalignments: results.misalignments,
        discussion_prompts: results.discussionPrompts,
        recommended_goals: results.recommendedGoals,
        questions_asked: results.questionsAsked,
        analysis_model: results.analysisModel || 'claude-3-5-sonnet',
        computed_at: new Date().toISOString()
      }, {
        onConflict: 'session_id'
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Save assessment results error:', error);
    return { data: null, error };
  }
};

/**
 * Get assessment results for a session
 */
export const getAssessmentResults = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get assessment results error:', error);
    return { data: null, error };
  }
};

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribe to session status changes
 */
export const subscribeToSession = (sessionId, callback) => {
  const channel = supabase
    .channel(`session:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'assessment_sessions',
        filter: `id=eq.${sessionId}`
      },
      (payload) => {
        callback({
          type: 'SESSION_UPDATE',
          session: payload.new
        });
      }
    )
    .subscribe();

  return channel;
};

/**
 * Subscribe to response changes (for tracking partner progress)
 */
export const subscribeToResponses = (sessionId, callback) => {
  const channel = supabase
    .channel(`responses:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'assessment_responses',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        callback({
          type: 'NEW_ANSWER',
          response: payload.new
        });
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'assessment_responses',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        callback({
          type: 'ANSWER_UPDATED',
          response: payload.new
        });
      }
    )
    .subscribe();

  return channel;
};

/**
 * Subscribe to all assessment events (combined)
 */
export const subscribeToAssessment = (sessionId, callbacks) => {
  const {
    onSessionUpdate,
    onNewAnswer,
    onPartnerProgress
  } = callbacks;

  const channel = supabase
    .channel(`assessment:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'assessment_sessions',
        filter: `id=eq.${sessionId}`
      },
      (payload) => {
        if (onSessionUpdate) {
          onSessionUpdate(payload.new);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'assessment_responses',
        filter: `session_id=eq.${sessionId}`
      },
      async (payload) => {
        if (onNewAnswer) {
          onNewAnswer(payload.new);
        }
        // Calculate and report partner progress
        if (onPartnerProgress && payload.new) {
          const partnerNumber = payload.new.partner_number;
          const { data: count } = await getPartnerProgress(sessionId, partnerNumber);
          onPartnerProgress(partnerNumber, count);
        }
      }
    )
    .subscribe();

  return channel;
};

/**
 * Unsubscribe from a channel
 */
export const unsubscribe = (channel) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Check if both partners have completed pre-screening
 */
export const checkPrescreeningComplete = async (sessionId) => {
  try {
    const { data } = await getPrescreeningResponses(sessionId);
    return {
      partner1Complete: !!data?.partner1,
      partner2Complete: !!data?.partner2,
      bothComplete: !!data?.partner1 && !!data?.partner2
    };
  } catch (error) {
    console.error('Check prescreening error:', error);
    return { partner1Complete: false, partner2Complete: false, bothComplete: false };
  }
};

/**
 * Check if both partners have completed the assessment
 */
export const checkAssessmentComplete = async (sessionId) => {
  try {
    const { data: questions } = await getSessionQuestions(sessionId);
    const { data: responses } = await getSessionResponses(sessionId);

    if (!questions || !responses) {
      return { partner1Complete: false, partner2Complete: false, bothComplete: false };
    }

    const totalQuestions = questions.length;
    const partner1Count = Object.keys(responses.partner1Answers).length;
    const partner2Count = Object.keys(responses.partner2Answers).length;

    return {
      partner1Complete: partner1Count >= totalQuestions,
      partner2Complete: partner2Count >= totalQuestions,
      bothComplete: partner1Count >= totalQuestions && partner2Count >= totalQuestions,
      partner1Progress: partner1Count,
      partner2Progress: partner2Count,
      totalQuestions
    };
  } catch (error) {
    console.error('Check assessment complete error:', error);
    return { partner1Complete: false, partner2Complete: false, bothComplete: false };
  }
};

/**
 * Get full assessment data for analysis
 */
export const getFullAssessmentData = async (sessionId) => {
  try {
    const [
      { data: session },
      { data: prescreening },
      { data: questions },
      { data: responses },
      { data: conversational }
    ] = await Promise.all([
      getSessionById(sessionId),
      getPrescreeningResponses(sessionId),
      getSessionQuestions(sessionId),
      getSessionResponses(sessionId),
      getConversationalResponses(sessionId)
    ]);

    return {
      data: {
        session,
        prescreening,
        questions,
        responses,
        conversational
      },
      error: null
    };
  } catch (error) {
    console.error('Get full assessment data error:', error);
    return { data: null, error };
  }
};
