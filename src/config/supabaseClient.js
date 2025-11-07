import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// Get these from your Supabase project dashboard: https://app.supabase.com
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || ''
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage // Use localStorage for session persistence
  },
  realtime: {
    params: {
      eventsPerSecond: 10 // Rate limit for real-time subscriptions
    }
  }
})

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '')
}

// Export for easy access
export default supabase
