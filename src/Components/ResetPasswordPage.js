import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, AlertTriangle, Heart } from 'lucide-react';
import { supabase } from '../config/supabaseClient';
import { useNavigate } from 'react-router-dom';

/**
 * ResetPasswordPage - Handle password reset from email link
 *
 * Design: TwogetherForward brand - warm, sophisticated
 */
const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    // Check if we have a valid reset session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setValidSession(true);
      } else {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          background: 'linear-gradient(135deg, #faf8f5 0%, #f5f2ed 100%)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full rounded-2xl p-8 text-center"
          style={{
            background: '#FFFFFF',
            border: '1px solid #e8e4de',
            boxShadow: '0 8px 24px rgba(45, 41, 38, 0.1)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(125, 140, 117, 0.1)',
            }}
          >
            <Check className="w-8 h-8" style={{ color: '#7d8c75' }} />
          </div>

          <h2
            className="text-2xl font-normal italic mb-2"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#2d2926',
            }}
          >
            Password Reset!
          </h2>

          <p className="text-sm mb-4" style={{ color: '#6b635b' }}>
            Your password has been updated successfully.
          </p>

          <p className="text-xs" style={{ color: '#6b635b', opacity: 0.7 }}>
            Redirecting you to login...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, #faf8f5 0%, #f5f2ed 100%)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(196, 154, 108, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(125, 140, 117, 0.12) 0%, transparent 50%)
            `,
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full rounded-2xl p-8 relative z-10"
        style={{
          background: '#FFFFFF',
          border: '1px solid #e8e4de',
          boxShadow: '0 8px 24px rgba(45, 41, 38, 0.1)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-6">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #c49a6c 0%, #d4b08a 100%)',
            }}
          >
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <span
            className="text-lg font-semibold"
            style={{ color: '#2d2926' }}
          >
            TwogetherForward
          </span>
        </div>

        {/* Header */}
        <h1
          className="text-3xl font-normal italic mb-2"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: '#2d2926',
          }}
        >
          Reset Password
        </h1>
        <p className="text-sm mb-6" style={{ color: '#6b635b' }}>
          Enter your new password below.
        </p>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-5 p-4 rounded-xl flex items-center gap-3"
              style={{
                backgroundColor: 'rgba(196, 107, 107, 0.1)',
                border: '1px solid rgba(196, 107, 107, 0.3)',
              }}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#c76b6b' }} />
              <p className="text-sm" style={{ color: '#c76b6b' }}>
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {validSession ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#2d2926' }}>
                New Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="w-4 h-4" style={{ color: '#6b635b' }} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: '#faf8f5',
                    border: '1px solid #e8e4de',
                    color: '#2d2926',
                  }}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" style={{ color: '#6b635b' }} />
                  ) : (
                    <Eye className="w-5 h-5" style={{ color: '#6b635b' }} />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-xs" style={{ color: '#6b635b', opacity: 0.7 }}>
                At least 6 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#2d2926' }}>
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="w-4 h-4" style={{ color: '#6b635b' }} />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: '#faf8f5',
                    border: '1px solid #e8e4de',
                    color: '#2d2926',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirm ? (
                    <EyeOff className="w-5 h-5" style={{ color: '#6b635b' }} />
                  ) : (
                    <Eye className="w-5 h-5" style={{ color: '#6b635b' }} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{
                background: 'linear-gradient(135deg, #c49a6c 0%, #d4b08a 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(196, 154, 108, 0.3)',
              }}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </motion.button>
          </form>
        ) : (
          <div className="text-center py-8">
            <button
              onClick={() => navigate('/')}
              className="font-semibold underline transition-colors"
              style={{ color: '#c49a6c' }}
            >
              Return to Login
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
