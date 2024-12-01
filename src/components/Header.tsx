import { Megaphone, LogOut, LayoutDashboard, Edit2, Coins } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCredits } from '../contexts/CreditsContext'

export function Header() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isDashboard = location.pathname === '/dashboard'
  const { credits } = useCredits()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 relative overflow-hidden w-full">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-90 animate-gradient"></div>
      <div className="w-full px-8 py-4 relative">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <Megaphone className="h-8 w-8 text-white drop-shadow-glow mr-2" />
            <h1 className="text-2xl font-semibold text-white drop-shadow-glow">
              EasierGen by StefanAI
              <sup className="ml-1 text-xs font-medium text-white drop-shadow-glow">BETA</sup>
            </h1>
          </Link>
          
          {user && (
            <div className="flex items-center space-x-2 text-white">
              <span className="font-medium">{user.user_metadata.display_name}</span>
              <span 
                className="flex items-center bg-white/20 px-3 py-1 rounded-full"
                title="Available credits for generating post ideas"
                aria-label={`${credits ?? 0} credits remaining`}
              >
                <Coins 
                  className="h-4 w-4 mr-1" 
                  aria-hidden="true"
                />
                <span>{credits ?? '...'}</span>
              </span>
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {isDashboard ? (
                  <Link 
                    to="/" 
                    className="flex items-center text-white hover:text-gray-200"
                    title="Go to Editor"
                  >
                    <Edit2 className="h-6 w-6" />
                    <span className="ml-2">Editor</span>
                  </Link>
                ) : (
                  <Link 
                    to="/dashboard" 
                    className="flex items-center text-white hover:text-gray-200"
                    title="Go to Dashboard"
                  >
                    <LayoutDashboard className="h-6 w-6" />
                    <span className="ml-2">Dashboard</span>
                  </Link>
                )}
                <button 
                  onClick={handleLogout} 
                  className="flex items-center text-white hover:text-gray-200"
                >
                  <LogOut className="h-6 w-6" />
                  <span className="ml-2">Logout</span>
                </button>
              </>
            ) : (
              <div className="space-x-4">
                <Link 
                  to="/login" 
                  className="text-white hover:text-gray-200"
                >
                  Sign-in
                </Link>
                <Link 
                  to="/register" 
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100"
                >
                  Sign-up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}