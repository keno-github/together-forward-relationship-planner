import React from 'react'
import { motion } from 'framer-motion'
import Auth from './Auth'
import { useAuth } from '../context/AuthContext'

const AuthTest = () => {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen animated-gradient-bg flex items-center justify-center">
        <div className="glass-card-strong rounded-3xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-center" style={{color: '#2B2B2B'}}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Auth onSuccess={(user) => console.log('Login successful!', user)} />
  }

  return (
    <div className="min-h-screen animated-gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card-strong rounded-3xl p-8 max-w-md w-full text-center"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>

        <h2 className="text-3xl font-bold mb-2" style={{color: '#2B2B2B'}}>
          Authentication Works! 🎉
        </h2>

        <p className="mb-6" style={{color: '#2B2B2B', opacity: 0.7}}>
          You're successfully logged in!
        </p>

        <div className="glass-card-light rounded-xl p-4 mb-6 text-left">
          <h3 className="font-semibold mb-2" style={{color: '#C084FC'}}>User Details:</h3>
          <p className="text-sm mb-1" style={{color: '#2B2B2B'}}>
            <strong>Email:</strong> {user.email}
          </p>
          <p className="text-sm mb-1" style={{color: '#2B2B2B'}}>
            <strong>User ID:</strong> {user.id.substring(0, 20)}...
          </p>
          <p className="text-sm" style={{color: '#2B2B2B'}}>
            <strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => signOut()}
          className="w-full glass-button py-3 rounded-xl font-semibold"
        >
          Sign Out
        </motion.button>

        <div className="mt-6 p-4 rounded-xl" style={{backgroundColor: 'rgba(192, 132, 252, 0.1)'}}>
          <p className="text-sm" style={{color: '#2B2B2B'}}>
            <strong>✅ Supabase is configured correctly!</strong><br/>
            Your authentication is working perfectly.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default AuthTest
