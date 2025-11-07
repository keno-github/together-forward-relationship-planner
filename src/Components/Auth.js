import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Heart, LogIn, UserPlus, Chrome } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Auth = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const { signIn, signUp, signInWithGoogle, isConfigured } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (!isConfigured) {
        setError('⚠️ Supabase not configured. Please add your credentials to .env file.')
        setLoading(false)
        return
      }

      if (isLogin) {
        // Sign in
        const { data, error } = await signIn(email, password)
        if (error) throw error
        setMessage('✅ Logged in successfully!')
        setTimeout(() => onSuccess && onSuccess(data.user), 1000)
      } else {
        // Sign up
        if (!fullName.trim()) {
          setError('Please enter your name')
          setLoading(false)
          return
        }
        const { data, error } = await signUp(email, password, { full_name: fullName })
        if (error) throw error
        setMessage('✅ Account created! Check your email to verify.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
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
        setError('⚠️ Supabase not configured. Please add your credentials to .env file.')
        setLoading(false)
        return
      }

      const { error } = await signInWithGoogle()
      if (error) throw error
      // Google sign-in redirects, so we don't need onSuccess here
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google')
      setLoading(false)
    }
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen animated-gradient-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card-strong rounded-3xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{color: '#2B2B2B'}}>
            Supabase Not Configured
          </h2>
          <p className="mb-6" style={{color: '#2B2B2B', opacity: 0.7}}>
            To enable authentication and cloud storage, please set up Supabase:
          </p>
          <ol className="text-left space-y-2 mb-6" style={{color: '#2B2B2B', opacity: 0.8}}>
            <li>1. Read <code className="bg-white/50 px-2 py-1 rounded">SUPABASE_SETUP_GUIDE.md</code></li>
            <li>2. Create a Supabase project</li>
            <li>3. Add credentials to <code className="bg-white/50 px-2 py-1 rounded">.env</code></li>
            <li>4. Restart the app</li>
          </ol>
          <button
            onClick={() => window.location.reload()}
            className="glass-button px-6 py-3 rounded-xl font-semibold"
          >
            Reload App
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen animated-gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card-strong rounded-3xl p-8 max-w-md w-full"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center pulse-glow">
            <Heart className="w-8 h-8 text-white" fill="white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-center mb-2" style={{color: '#2B2B2B'}}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-center mb-6" style={{color: '#2B2B2B', opacity: 0.7}}>
          {isLogin ? 'Sign in to continue your journey' : 'Start planning your future together'}
        </p>

        {/* Error/Success Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl glass-card-light border-2 border-red-300"
            style={{color: '#DC2626'}}
          >
            {error}
          </motion.div>
        )}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl glass-card-light border-2 border-green-300"
            style={{color: '#059669'}}
          >
            {message}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name (signup only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: '#2B2B2B'}}>
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{color: '#C084FC'}} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="glass-input w-full pl-12 pr-4 py-3 rounded-xl"
                  style={{color: '#2B2B2B'}}
                  placeholder="Alex Smith"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{color: '#2B2B2B'}}>
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{color: '#C084FC'}} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full pl-12 pr-4 py-3 rounded-xl"
                style={{color: '#2B2B2B'}}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{color: '#2B2B2B'}}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{color: '#C084FC'}} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full pl-12 pr-4 py-3 rounded-xl"
                style={{color: '#2B2B2B'}}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full glass-button py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Loading...</span>
            ) : isLogin ? (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create Account
              </>
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px" style={{backgroundColor: 'rgba(43, 43, 43, 0.2)'}}></div>
          <span className="text-sm" style={{color: '#2B2B2B', opacity: 0.6}}>or</span>
          <div className="flex-1 h-px" style={{backgroundColor: 'rgba(43, 43, 43, 0.2)'}}></div>
        </div>

        {/* Google Sign In */}
        <motion.button
          type="button"
          onClick={handleGoogleSignIn}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          className="w-full glass-card-light py-3 rounded-xl font-semibold flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white/50 transition-all disabled:opacity-50"
          style={{color: '#2B2B2B'}}
        >
          <Chrome className="w-5 h-5" />
          Continue with Google
        </motion.button>

        {/* Toggle Login/Signup */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setMessage('')
            }}
            className="text-sm font-medium hover:underline"
            style={{color: '#C084FC'}}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default Auth
