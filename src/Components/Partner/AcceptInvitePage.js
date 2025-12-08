import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Heart, Users, Check, AlertCircle, LogIn, Loader2 } from 'lucide-react';
import { acceptDreamShare } from '../../services/supabaseService';
import { useAuth } from '../../context/AuthContext';

/**
 * AcceptInvitePage - Landing page for partner invite links
 * Route: /invite/:code
 */
const AcceptInvitePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  // Extract code from URL path since we use custom routing (not React Router's Route params)
  const code = location.pathname.split('/invite/')[1] || '';

  const [status, setStatus] = useState('loading'); // 'loading', 'ready', 'success', 'error', 'auth_required'
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('📋 AcceptInvitePage useEffect - code:', code, 'authLoading:', authLoading, 'user:', user?.email);

    // If no code in URL, redirect to landing
    if (!code) {
      console.log('📋 No code, redirecting to landing');
      navigate('/');
      return;
    }

    if (authLoading) {
      console.log('📋 Auth still loading, waiting...');
      return;
    }

    if (!user) {
      console.log('📋 No user, setting auth_required');
      setStatus('auth_required');
      return;
    }

    // User is logged in, ready to accept
    console.log('📋 User logged in, setting ready');
    setStatus('ready');
  }, [user, authLoading, code, navigate]);

  const handleAcceptInvite = async () => {
    console.log('📋 handleAcceptInvite called with code:', code);
    setStatus('loading');
    setError('');

    try {
      console.log('📋 Calling acceptDreamShare...');
      const { data, error: acceptError } = await acceptDreamShare(code);
      console.log('📋 acceptDreamShare returned - data:', data, 'error:', acceptError);

      if (acceptError) throw acceptError;

      if (data?.success) {
        console.log('📋 Success! Setting result and status');
        setResult(data);
        setStatus('success');
      } else {
        console.log('📋 Failed - message:', data?.message);
        setError(data?.message || 'Failed to accept invite');
        setStatus('error');
      }
    } catch (err) {
      console.error('📋 Error in handleAcceptInvite:', err);
      setError(err.message || 'Something went wrong');
      setStatus('error');
    }
  };

  const handleGoToLogin = () => {
    // Store the invite code to resume after login
    localStorage.setItem('pending_invite_code', code);
    navigate('/login');
  };

  const handleGoToSignup = () => {
    // Store the invite code to resume after signup
    localStorage.setItem('pending_invite_code', code);
    navigate('/signup');
  };

  const handleGoToDream = () => {
    if (result?.roadmap_id) {
      navigate(`/roadmap/${result.roadmap_id}`);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-4">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(217, 119, 6, 0.06)' }} />

      <div className="relative bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">You're Invited!</h1>
          <p className="text-white/80 text-sm">
            Someone wants to share their dream journey with you
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Loading State */}
          {(status === 'loading' || authLoading) && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
              <p className="text-stone-600">
                {authLoading ? 'Checking your session...' : 'Joining the dream...'}
              </p>
            </div>
          )}

          {/* Auth Required State */}
          {status === 'auth_required' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-stone-600" />
                </div>
                <h2 className="text-xl font-semibold text-stone-800 mb-2">
                  Sign in to Continue
                </h2>
                <p className="text-stone-600 text-sm">
                  You need an account to join this shared dream.
                  Your progress and contributions will be synced together.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800 text-center">
                  <span className="font-medium">Invite Code:</span>{' '}
                  <span className="font-mono font-bold tracking-wider">{code}</span>
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleGoToLogin}
                  className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={handleGoToSignup}
                  className="w-full py-3 bg-white border border-stone-200 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors"
                >
                  Create Account
                </button>
              </div>

              <p className="text-xs text-stone-500 text-center">
                After signing in, you'll automatically join the shared dream.
              </p>
            </div>
          )}

          {/* Ready State */}
          {status === 'ready' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold text-stone-800 mb-2">
                  Ready to Join?
                </h2>
                <p className="text-stone-600 text-sm">
                  Click below to accept this invitation and start
                  planning together.
                </p>
              </div>

              <div className="bg-stone-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <Check className="w-4 h-4 text-green-500" />
                  View and edit shared goals
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <Check className="w-4 h-4 text-green-500" />
                  Track progress together
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <Check className="w-4 h-4 text-green-500" />
                  Get notified of updates
                </div>
              </div>

              <button
                onClick={handleAcceptInvite}
                className="w-full py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
              >
                <Heart className="w-5 h-5" />
                Accept Invitation
              </button>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-stone-800 mb-2">
                  You're In!
                </h2>
                <p className="text-stone-600 text-sm">
                  {result?.message || 'You\'ve successfully joined the dream.'}
                </p>
              </div>

              {result?.roadmap_title && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-amber-700 font-medium uppercase tracking-wide mb-1">
                    Shared Dream
                  </p>
                  <p className="text-lg font-semibold text-amber-900">
                    {result.roadmap_title}
                  </p>
                </div>
              )}

              <button
                onClick={handleGoToDream}
                className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors"
              >
                Go to Dream
              </button>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-stone-800 mb-2">
                  Oops!
                </h2>
                <p className="text-stone-600 text-sm">
                  {error || 'This invite link may be invalid or expired.'}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setStatus('ready')}
                  className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 bg-white border border-stone-200 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 pt-2">
          <p className="text-xs text-stone-400 text-center">
            TwogetherForward - Plan your future, together
          </p>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitePage;
