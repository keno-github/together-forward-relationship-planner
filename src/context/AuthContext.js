import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../config/supabaseClient'
import { getOrCreateUserProfile } from '../services/supabaseService'
import { unsubscribeAll } from '../utils/subscriptionManager'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

/**
 * AuthProvider - Netflix-grade auth state management
 *
 * FIXES race conditions that caused infinite loading:
 * 1. Single source of truth: onAuthStateChange is primary
 * 2. getSession only runs once as initial check
 * 3. Timeout protection prevents infinite hangs
 * 4. Profile creation is non-blocking
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  // Prevent race conditions - track if we've processed initial auth
  const initialAuthProcessed = useRef(false)
  const profileCreationInProgress = useRef(false)
  const loadingRef = useRef(true) // Track loading state for timeout closure

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured. Add your credentials to .env file.')
      setLoading(false)
      loadingRef.current = false
      return
    }

    // TIMEOUT PROTECTION: Don't let auth hang forever
    // Uses ref to avoid stale closure issue
    const authTimeout = setTimeout(() => {
      if (loadingRef.current) {
        console.warn('🔑 AuthContext: Auth timeout - proceeding without session')
        setLoading(false)
        loadingRef.current = false
      }
    }, 10000) // 10 second max wait for auth

    // Get initial session (runs once)
    console.log('🔑 AuthContext: Getting initial session...')
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      // Only process if onAuthStateChange hasn't already handled it
      if (!initialAuthProcessed.current) {
        console.log('🔑 AuthContext: Initial session retrieved, user:', initialSession?.user?.email || 'none')
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
        setLoading(false)
        loadingRef.current = false
        initialAuthProcessed.current = true
      }

      // Clear URL hash after retrieving session to prevent stale token warnings
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('🔑 AuthContext: OAuth return detected (hash), setting sessionStorage flag')
        sessionStorage.setItem('oauth_return', 'true')
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }).catch((error) => {
      console.error('🔑 AuthContext: Error getting session:', error)
      setLoading(false)
      loadingRef.current = false
    })

    // Listen for auth changes (PRIMARY source of truth)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔑 AuthContext: onAuthStateChange -', event, 'user:', newSession?.user?.email || 'none')

      // Update state immediately
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setLoading(false)
      loadingRef.current = false // Keep ref in sync to prevent unnecessary timeout firing
      initialAuthProcessed.current = true

      // Clear URL hash after auth to prevent stale token warnings
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('🔑 AuthContext: OAuth return detected in onAuthStateChange, setting flag')
        sessionStorage.setItem('oauth_return', 'true')
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }

      // Auto-create profile for new users (NON-BLOCKING)
      // Don't await this - let it run in background
      if (newSession?.user && (event === 'SIGNED_IN' || event === 'SIGNED_UP')) {
        if (!profileCreationInProgress.current) {
          profileCreationInProgress.current = true
          const { user: newUser } = newSession
          getOrCreateUserProfile(newUser.id, {
            email: newUser.email,
            full_name: newUser.user_metadata?.full_name || newUser.user_metadata?.name || null
          }).finally(() => {
            profileCreationInProgress.current = false
          })
        }
      }
    })

    return () => {
      clearTimeout(authTimeout)
      subscription.unsubscribe()
    }
  }, [])

  // Sign up with email and password
  const signUp = async (email, password, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata // Store additional user data like name
        }
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Sign up error:', error.message)
      return { data: null, error }
    }
  }

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error.message)
      return { data: null, error }
    }
  }

  // Sign in with Google
  // redirectTo parameter allows customizing where to return after OAuth (e.g., back to invite page)
  const signInWithGoogle = async (redirectTo = null) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo || window.location.origin
        }
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Google sign in error:', error.message)
      return { data: null, error }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      // Cleanup all Realtime subscriptions before signing out
      unsubscribeAll()

      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error.message)
      return { error }
    }
  }

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Password reset error:', error.message)
      return { data: null, error }
    }
  }

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Profile update error:', error.message)
      return { data: null, error }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    isConfigured: isSupabaseConfigured()
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
