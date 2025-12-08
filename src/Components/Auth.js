import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, LogIn, UserPlus, ArrowLeft, Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// User-friendly error messages
const getErrorMessage = (error) => {
  const errorCode = error?.code || error?.message || ''
  if (errorCode.includes('Invalid login credentials')) return 'Invalid email or password. Please try again.'
  if (errorCode.includes('Email not confirmed')) return 'Please verify your email before signing in.'
  if (errorCode.includes('User already registered')) return 'An account with this email already exists.'
  if (errorCode.includes('Password should be at least')) return 'Password must be at least 6 characters.'
  return error?.message || 'An error occurred. Please try again.'
}

// Custom Google Icon
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const Auth = ({ onSuccess, googleRedirectTo = null, embedded = false }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const { signIn, signUp, signInWithGoogle, resetPassword, isConfigured } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (!isConfigured) {
        setError('Authentication not configured. Please contact support.')
        setLoading(false)
        return
      }

      if (isLogin) {
        const { data, error } = await signIn(email, password)
        if (error) throw error
        setMessage('Welcome back! Redirecting...')
        setTimeout(() => onSuccess && onSuccess(data.user), 1000)
      } else {
        if (!fullName.trim()) {
          setError('Please enter your name')
          setLoading(false)
          return
        }
        const { data, error } = await signUp(email, password, { full_name: fullName })
        if (error) throw error
        setMessage('Account created! Check your email to verify.')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      if (!email.trim()) {
        setError('Please enter your email address')
        setLoading(false)
        return
      }
      const { error } = await resetPassword(email)
      if (error) throw error
      setMessage('Password reset link sent! Check your inbox.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (!isConfigured) {
        setError('Authentication not configured. Please contact support.')
        setLoading(false)
        return
      }

      // Pass custom redirect URL if provided (e.g., to return to invite page after OAuth)
      const { error } = await signInWithGoogle(googleRedirectTo)
      if (error) throw error
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  // Not configured state
  if (!isConfigured) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 text-center shadow-xl"
      >
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-xl">⚙️</span>
        </div>
        <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">Setup Required</h2>
        <p className="text-stone-500 text-sm mb-5">Authentication is not yet configured.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-stone-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-stone-800 transition"
        >
          Reload App
        </button>
      </motion.div>
    )
  }

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl"
      >
        <button
          onClick={() => { setShowForgotPassword(false); setError(''); setMessage(''); }}
          className="flex items-center gap-1.5 text-stone-500 hover:text-stone-900 transition mb-5 text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-full bg-stone-900 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <span className="font-serif text-lg font-bold text-stone-900">TwogetherForward</span>
        </div>

        <h1 className="text-2xl font-serif font-bold text-stone-900 mb-2">Reset password</h1>
        <p className="text-stone-500 text-sm mb-5">We'll send you a reset link.</p>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              {error}
            </motion.div>
          )}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-stone-200 rounded-lg text-stone-900 text-sm placeholder-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-stone-800 transition disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      </motion.div>
    )
  }

  // Main Login/Signup View
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={embedded ? '' : 'bg-white rounded-2xl p-6 sm:p-8 shadow-xl'}
    >
      {/* Brand - hide when embedded in another component */}
      {!embedded && (
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-full bg-stone-900 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <span className="font-serif text-lg font-bold text-stone-900">TwogetherForward</span>
        </div>
      )}

      {/* Header */}
      <AnimatePresence mode="wait">
        <motion.h1
          key={isLogin ? 'login' : 'signup'}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-2xl font-serif font-bold text-stone-900 mb-1"
        >
          {isLogin ? 'Welcome back' : 'Create account'}
        </motion.h1>
      </AnimatePresence>
      <p className="text-stone-500 text-sm mb-5">
        {isLogin ? 'Sign in to continue your journey.' : 'Start planning your future together.'}
      </p>

      {/* Messages */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
          >
            {error}
          </motion.div>
        )}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence>
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-stone-200 rounded-lg text-stone-900 text-sm placeholder-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition"
                  placeholder="Alex & Jordan"
                  required={!isLogin}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-stone-200 rounded-lg text-stone-900 text-sm placeholder-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-stone-200 rounded-lg text-stone-900 text-sm placeholder-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          {isLogin && (
            <button
              type="button"
              onClick={() => { setShowForgotPassword(true); setError(''); setMessage(''); }}
              className="mt-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 transition"
            >
              Forgot password?
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-stone-900 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-stone-800 transition disabled:opacity-60"
        >
          {loading ? (
            'Please wait...'
          ) : isLogin ? (
            <>
              <LogIn size={16} />
              Sign in
            </>
          ) : (
            <>
              <UserPlus size={16} />
              Create account
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-stone-200" />
        <span className="text-xs text-stone-400 uppercase">or</span>
        <div className="flex-1 h-px bg-stone-200" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full bg-white border border-stone-200 text-stone-700 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-stone-50 hover:border-stone-300 transition disabled:opacity-60"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      {/* Toggle */}
      <p className="mt-5 text-center text-stone-500 text-sm">
        {isLogin ? "Don't have an account?" : 'Already have an account?'}
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin)
            setError('')
            setMessage('')
          }}
          className="ml-1 font-semibold text-stone-900 hover:underline"
        >
          {isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </motion.div>
  )
}

export default Auth
