// AuthContext.jsx
import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { usePrivy, useIdentityToken } from '@privy-io/react-auth';
import axios from 'axios';

const AuthContext = createContext();
  
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false);
  const privyStateRef = useRef({ ready: false, authenticated: false, user: null });
  // ✅ Privy hooks are NOW in AuthContext
  const { 
    login: privyLogin, 
    logout: privyLogout, 
    getAccessToken,
    authenticated, 
    ready, 
    user: privyUser
  } = usePrivy();

  // Keep ref in sync on every render

  // Get identity token (contains user data)
  const { identityToken } = useIdentityToken();
  const [_, forceRender] = useState(0);

  useEffect(() => {
    console.log("new render", {ready, authenticated, privyUser})
    forceRender(i => i + 1);
  }, [ready, authenticated, privyUser?.id])

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } 
  }, [token]);

  // Sync with backend when Privy authentication completes
  useEffect(() => {
    const syncWithBackend = async () => {
      if (authenticated && privyUser && !token) {
        setSyncing(true);
        setError('');
        
        try {
          // Get the Privy identity token - contains user data (email, etc.)
          if (!identityToken) {
            throw new Error('Identity token not available. Please ensure identity tokens are enabled in Privy dashboard.');
          }

          // Send the identity token to backend for verification
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/auth/privy/verify`,
            { identityToken }
          );

          const { token: newToken, user: userData } = response.data;
          setToken(newToken);
          setUser(userData);
          localStorage.setItem('token', newToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        } catch (err) {
          console.error('Backend sync failed:', err);
          setError(err.response?.data?.error || 'Login failed');
          // Optionally logout from Privy if backend fails
          await privyLogout();
        } finally {
          setSyncing(false);
        }
      }
    };

    syncWithBackend();
  }, [authenticated, privyUser, token, privyLogout, identityToken]);

  useEffect(() => {
    if (ready && authenticated && privyUser && !token) {
      syncWithBackend();
    }
  }, [ready, authenticated, privyUser, token]);
  
  const refreshToken = async (authenticat=authenticated, privy=privyUser) => {
    // if (isRefreshing) {
    const authenticated = authenticat
    const privyUser= privy
      console.log('⏳ Token refresh already in progress...');
      // return { success: false, message: 'Refresh in progress' };
    // }

    try {
      setIsRefreshing(true);
      console.log('🔄 Attempting to refresh JWT token...');

      // Check if user is authenticated with Privy
      console.log({authenticated, privyUser}, !authenticated || !privyUser)
      if (!authenticated || !privyUser) {
        console.error('❌ Not authenticated with Privy');
        return { 
          success: false, 
          message: 'Not authenticated with Privy',
          shouldRedirectToLogin: true 
        };
      }

      // Get fresh Privy access token
      const privyToken = await getAccessToken();
      console.log({privyToken})
      if (!privyToken) {
        console.error('❌ Failed to get Privy access token');
        return { 
          success: false, 
          message: 'Failed to get Privy token',
          shouldRedirectToLogin: true 
        };
      }

      console.log('✅ Got Privy token, requesting new JWT...');

      // Request new JWT from backend
      const response = await axios.post(
        '/api/auth/refresh',
        {},
        {
          headers: {
            'x-privy-token': privyToken
          }
        }
      );

      if (response.data.success && response.data.token) {
        const newToken = response.data.token;
        
        // Store new token
        localStorage.setItem('token', newToken);
        setToken(newToken);
        
        // Update axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        console.log('✅ JWT token refreshed successfully');
        
        return { 
          success: true, 
          message: 'Token refreshed successfully',
          token: newToken
        };
      } else {
        console.error('❌ Invalid response from refresh endpoint');
        return { 
          success: false, 
          message: 'Invalid refresh response',
          shouldRedirectToLogin: false 
        };
      }

    } catch (error) {
      console.error('❌ Token refresh failed:', error);

      // Check if it's a Privy token expiration
      if (error.response?.status === 401) {
        console.error('🚫 Privy token expired or invalid');
        return { 
          success: false, 
          message: 'Privy session expired',
          shouldRedirectToLogin: true 
        };
      }

      // Handle other errors
      return { 
        success: false, 
        message: error.response?.data?.message || 'Token refresh failed',
        shouldRedirectToLogin: error.response?.status === 403
      };

    } finally {
      // setIsRefreshing(false);
    }
  };


  useEffect(() => {
    privyStateRef.current = { ready, authenticated, user: privyUser };
    console.log("rerunning useEffect", {isRefreshing, ready, authenticated, privyUser})

    if(isRefreshing&&ready&&authenticated&&privyUser){
    console.log("rerunning refresh", {isRefreshing, ready, authenticated, privyUser})
      refreshToken(authenticated, privyUser)
      setIsRefreshing(false);
    }
  }, [ready, authenticated, privyUser?.id]);











  const login = () => {
    setError('');
    privyLogin(); // Just opens the modal
  };

  
  const logout = async () => {
    try {
      await privyLogout();
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      console.log("logout successful in logout funtion")
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const value = {
    token,
    user,
    refreshToken,
    isRefreshing,
    login,
    logout,
    authenticated,
    ready,
    syncing,
    error,
    isAuthenticated: authenticated && !!token, // Both Privy AND backend authenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};