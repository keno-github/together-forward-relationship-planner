import React, { createContext, useContext, useState, useEffect } from 'react'
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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured. Add your credentials to .env file.')
      setLoading(false)
      return
    }

    // Get initial session
    console.log('🔑 AuthContext: Getting initial session...')
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔑 AuthContext: Session retrieved, user:', session?.user?.email || 'none')
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Clear URL hash after retrieving session to prevent stale token warnings
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('🔑 AuthContext: OAuth return detected (hash), setting sessionStorage flag')
        // Store flag so components can detect OAuth return (hash will be cleared)
        sessionStorage.setItem('oauth_return', 'true')
        // Replace the URL without the hash to clean up
        window.history.replaceState(null, '', window.location.pathname)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔑 AuthContext: onAuthStateChange -', event, 'user:', session?.user?.email || 'none')
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Clear URL hash after auth to prevent stale token warnings
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('🔑 AuthContext: OAuth return detected in onAuthStateChange, setting flag')
        // Store flag so components can detect OAuth return (hash will be cleared)
        sessionStorage.setItem('oauth_return', 'true')
        window.history.replaceState(null, '', window.location.pathname)
      }

      // Auto-create profile for new users (on SIGNED_IN or SIGNED_UP)
      if (session?.user && (event === 'SIGNED_IN' || event === 'SIGNED_UP')) {
        const { user } = session
        await getOrCreateUserProfile(user.id, {
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null
        })
      }
    })

    return () => subscription.unsubscribe()
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
