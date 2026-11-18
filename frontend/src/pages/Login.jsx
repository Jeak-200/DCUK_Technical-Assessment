import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

const LoginUser = ({purpose}) => {
  const navigate = useNavigate();
  const { login, isAuthenticated, ready, syncing, error } = useAuth();
  const [action, setAction] = useState(purpose);
  
  // Update action when purpose prop changes (when navigating between routes)
  useEffect(() => {
    setAction(purpose);
  }, [purpose]);
  
  // const [isLoggingIn, setIsLoggingIn] = useState(false);
// console.log({isAuthenticated})
  const handleLogin = async () => {
    try {
      // setIsLoggingIn(true);
      console.log('🔐 Starting login...');

      // ALWAYS logout first, regardless of authenticated state
      // This clears any ghost sessions
      try {
        console.log('🧹 Clearing any existing session...');
        await logout();
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (logoutError) {
        // Logout might fail if no session exists - that's OK
        console.log('Logout completed (or no session to clear)');
      }

      // Now login with clean slate
      console.log('🚀 Attempting login...');
      await login();
      
      console.log('✅ Login successful');

    } catch (error) {
      console.error('❌ Login failed:', error);
    } finally {
      // setIsLoggingIn(false);
    }
  };


  return (
    <div className="max-w-md mx-auto mt-20">
      <h1 className="text-3xl font-bold mb-8 text-center">{action}</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <button
          onClick={handleLogin}
          disabled={syncing || !ready}
          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {syncing ? 'Logging in...' : `${action} with Email or Google`}
        </button>
        
        <p className="mt-4 text-center text-gray-600">
          {action === 'Login' ? "Don't have an account? " : "Already have an account? "}
          <Link 
            to={action === 'Login' ? '/register' : '/login'} 
            className="text-purple-600 hover:underline"
          >
            {action === 'Login' ? 'Register' : 'Login'}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginUser;