import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Check, X, Loader2, UserPlus, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  validatePartnershipCode,
  acceptPartnershipInvite
} from '../../services/supabaseService';
import Auth from '../Auth';

/**
 * AcceptPartnerInvitePage - Handles partner invite acceptance flow
 *
 * URL: /partner-invite/{code}
 *
 * Flow:
 * 1. Validate the invite code
 * 2. If not logged in → show auth (signup/login)
 * 3. If logged in → show accept button
 * 4. On accept → establish partnership, redirect to dashboard
 */
const AcceptPartnerInvitePage = () => {
  const { user, loading: authLoading } = useAuth();

  // Extract code from URL
  const [inviteCode, setInviteCode] = useState(null);

  // States
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [acceptError, setAcceptError] = useState(null);

  // Extract invite code from URL on mount
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/partner-invite\/([^/]+)$/);
    if (match) {
      setInviteCode(match[1].toUpperCase());
    } else {
      setValidationError('Invalid invite link');
      setValidating(false);
    }
  }, []);

  // Validate the invite code
  useEffect(() => {
    if (!inviteCode) return;

    let isCancelled = false;

    const validate = async () => {
      console.log('🎫 Partner Invite: Starting validation for code:', inviteCode);
      setValidating(true);

      // Timeout promise to catch hanging RPC calls
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Validation timeout - please try again')), 15000);
      });

      try {
        const validationPromise = validatePartnershipCode(inviteCode);
        const { data, error } = await Promise.race([validationPromise, timeoutPromise]);

        if (isCancelled) return;

        console.log('🎫 Partner Invite: Validation response:', { data, error });
        if (error) throw error;

        if (data?.valid) {
          console.log('🎫 Partner Invite: Code is valid');
          setIsValid(true);
          // Store the code for auto-accept after auth
          localStorage.setItem('pending_partner_invite_code', inviteCode);
        } else {
          console.log('🎫 Partner Invite: Code is invalid:', data?.reason);
          setValidationError(data?.reason || 'Invalid invite code');
        }
      } catch (error) {
        if (isCancelled) return;
        console.error('🎫 Partner Invite: Validation error:', error);
        setValidationError(error.message || 'Failed to validate invite code');
      } finally {
        if (!isCancelled) {
          console.log('🎫 Partner Invite: Validation complete, setting validating=false');
          setValidating(false);
        }
      }
    };

    validate();

    return () => {
      isCancelled = true;
    };
  }, [inviteCode]);

  // Auto-accept after login if code is valid
  useEffect(() => {
    const pendingCode = localStorage.getItem('pending_partner_invite_code');
    console.log('🎫 Partner Invite: Auto-accept check:', {
      user: !!user,
      pendingCode,
      isValid,
      accepted,
      accepting
    });
    if (user && pendingCode && isValid && !accepted && !accepting) {
      console.log('🎫 Partner Invite: Auto-accepting partnership...');
      localStorage.removeItem('pending_partner_invite_code');
      handleAccept();
    }
  }, [user, isValid, accepted, accepting]);

  const handleAccept = async () => {
    if (!user) {
      localStorage.setItem('pending_partner_invite_code', inviteCode);
      return;
    }

    setAccepting(true);
    setAcceptError(null);

    try {
      const { data, error } = await acceptPartnershipInvite(inviteCode);
      if (error) throw error;

      if (data?.success) {
        setAccepted(true);
        // Redirect to dashboard after short delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        setAcceptError(data?.error || 'Failed to accept invite');
      }
    } catch (error) {
      console.error('Accept error:', error);
      setAcceptError(error.message || 'Failed to accept invite');
    } finally {
      setAccepting(false);
    }
  };

  const handleAuthSuccess = () => {
    // After successful auth, the useEffect will auto-accept
    // Code is already stored in localStorage
  };

  // Loading state
  if (authLoading || validating) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#FAF7F2' }}
      >
        <div className="text-center">
          <Loader2
            className="w-10 h-10 animate-spin mx-auto mb-4"
            style={{ color: '#C4785A' }}
          />
          <p style={{ color: '#6B5E54' }}>
            {authLoading ? 'Loading...' : 'Validating invite...'}
          </p>
        </div>
      </div>
    );
  }

  // Invalid code
  if (!isValid && validationError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: '#FAF7F2' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full rounded-2xl p-8 text-center"
          style={{ backgroundColor: 'white', border: '1px solid #E8E2DA' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: '#FEE2E2' }}
          >
            <X className="w-8 h-8" style={{ color: '#DC2626' }} />
          </div>
          <h1
            className="text-2xl font-light italic mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: '#2D2926' }}
          >
            Invalid Invite
          </h1>
          <p className="mb-6" style={{ color: '#6B5E54' }}>
            {validationError}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {validationError.includes('timeout') && (
              <button
                onClick={() => {
                  setValidationError(null);
                  setValidating(true);
                  // Re-trigger validation by clearing and resetting inviteCode
                  const code = inviteCode;
                  setInviteCode(null);
                  setTimeout(() => setInviteCode(code), 10);
                }}
                className="px-6 py-3 rounded-xl font-medium"
                style={{
                  background: 'linear-gradient(135deg, #C4785A, #d4916f)',
                  color: 'white'
                }}
              >
                Try Again
              </button>
            )}
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 rounded-xl font-medium"
              style={{ backgroundColor: '#FAF7F2', color: '#6B5E54', border: '1px solid #E8E2DA' }}
            >
              Go to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Successfully accepted
  if (accepted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: '#FAF7F2' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full rounded-2xl p-8 text-center"
          style={{ backgroundColor: 'white', border: '1px solid #E8E2DA' }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #C4785A, #d4916f)' }}
          >
            <Heart className="w-10 h-10 text-white" fill="white" />
          </motion.div>
          <h1
            className="text-3xl font-light italic mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: '#2D2926' }}
          >
            You're Connected!
          </h1>
          <p className="mb-6" style={{ color: '#6B5E54' }}>
            Your partnership has been established. Time to start planning your future together.
          </p>
          <div className="flex items-center justify-center gap-2" style={{ color: '#A09890' }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Redirecting to dashboard...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Not logged in - show auth
  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: '#FAF7F2' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #C4785A, #d4916f)' }}
            >
              <Heart className="w-8 h-8 text-white" fill="white" />
            </div>
            <h1
              className="text-3xl font-light italic mb-2"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: '#2D2926' }}
            >
              You're Invited!
            </h1>
            <p style={{ color: '#6B5E54' }}>
              Your partner wants to plan your future together on Twogether Forward.
            </p>
          </div>

          {/* Auth Component */}
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: 'white', border: '1px solid #E8E2DA' }}
          >
            <p className="text-sm text-center mb-4" style={{ color: '#6B5E54' }}>
              Sign up or log in to accept the invite
            </p>
            <Auth
              onSuccess={handleAuthSuccess}
              googleRedirectTo={window.location.href}
              embedded={true}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // Logged in - show accept button
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#FAF7F2' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full rounded-2xl p-8 text-center"
        style={{ backgroundColor: 'white', border: '1px solid #E8E2DA' }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'linear-gradient(135deg, #C4785A, #d4916f)' }}
        >
          <UserPlus className="w-10 h-10 text-white" />
        </div>

        <h1
          className="text-3xl font-light italic mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: '#2D2926' }}
        >
          Accept Partnership
        </h1>
        <p className="mb-6" style={{ color: '#6B5E54' }}>
          You've been invited to plan together. Accept to start sharing dreams and building your future.
        </p>

        {acceptError && (
          <div
            className="rounded-xl p-3 mb-4 text-sm"
            style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
          >
            {acceptError}
          </div>
        )}

        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #C4785A, #d4916f)',
            color: 'white',
            boxShadow: '0 4px 16px rgba(196, 120, 90, 0.3)'
          }}
        >
          {accepting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              Accept & Start Planning
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-xs mt-4" style={{ color: '#A09890' }}>
          Logged in as {user.email}
        </p>
      </motion.div>
    </div>
  );
};

export default AcceptPartnerInvitePage;
