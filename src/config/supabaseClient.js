import { createClient } from '@supabase/supabase-js'
import config from './env'

// Supabase configuration
// Get these from your Supabase project dashboard: https://app.supabase.com
const supabaseUrl = config.supabase.url
const supabaseAnonKey = config.supabase.anonKey

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuration is missing. Please check your .env file.')
}

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
