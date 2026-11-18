/**
 * Authentication Controller
 * Handles user registration, login, and authentication
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrivyClient } = require('@privy-io/server-auth');
const User = require('../models/User');
const axios = require('axios')

// Initialize Privy client
let privy;
try {
  // Try different initialization patterns based on SDK version
  if (process.env.PRIVY_APP_ID && process.env.PRIVY_APP_SECRET) {
    privy = new PrivyClient(
      process.env.PRIVY_APP_ID,
      process.env.PRIVY_APP_SECRET
    );
  }
} catch (error) {
  console.error('Failed to initialize Privy client:', error);
}

/**
 * Register a new user
 */
exports.register = async (req, res) => {
    try {
        const { email, password, walletAddress } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            email,
            password_hash: passwordHash,
            wallet_address: walletAddress || null
        });

        // Generate JWT
        const token = jwt.sign(
            { id: user._id.toString(), email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                walletAddress: user.wallet_address
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'User already exists' });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
};

/**
 * Login user
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id.toString(), email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                walletAddress: user.wallet_address
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

/**
 * Get current user
 */
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password_hash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
};

/**
 * Verify Privy access token and create/login user
 * POST /api/auth/privy/verify
 * Body: { accessToken: string }
 */
exports.verifyPrivy = async (req, res) => {
    try {
        const { identityToken } = req.body;
        
        if (!identityToken) {
            return res.status(400).json({ error: 'Identity token required' });
        }

        if (!privy) {
            return res.status(500).json({ error: 'Privy client not initialized. Check PRIVY_APP_ID and PRIVY_APP_SECRET in .env' });
        }

        // Verify the identity token with Privy
        // Identity tokens contain user data directly, no need to fetch separately
        let privyUser;
        try {
            // Privy SDK method: verifyAuthToken for identity tokens
            // Identity tokens contain full user data in the token itself
            const verifiedToken = await privy.verifyAuthToken(identityToken);
            
            // For identity tokens, the user data is in the token claims
            // Extract user information from verified token
            privyUser = verifiedToken;
            
            // If the token doesn't contain full user data, fetch it using userId
            if (!privyUser.linkedAccounts && verifiedToken.userId) {
                privyUser = await privy.getUser(verifiedToken.userId);
            }
        } catch (error) {
            console.error('Privy identity token verification error:', error);
            return res.status(401).json({ error: 'Invalid or expired identity token' });
        }

        if (!privyUser) {
            return res.status(401).json({ error: 'Failed to verify identity token' });
        }

        // console.log("privy user from identity token:", privyUser);

        // Extract userId and email from user data
        // const privyUserId = privyUser.userId || privyUser.id || privyUser.sub;
        const privyUserId = privyUser.id;
        
        if (!privyUserId) {
            return res.status(400).json({ error: 'User ID not found in identity token' });
        }
        
        // Extract email from user profile
        // Privy user object structure: email is in linkedAccounts array
        const emailAccount = privyUser.linkedAccounts?.find(account => account.type === 'email');
        const email = emailAccount?.address;

        if (!email) {
            return res.status(400).json({ 
                error: 'Email not found in Privy user profile. Please ensure email is linked to your account.' 
            });
        }

        // Check if user exists by privy_user_id or email
        let user = await User.findOne({
            $or: [
                { privy_user_id: privyUserId },
                { email: email.toLowerCase() }
            ]
        });

        if (!user) {
            // Auto-create user on first Privy login
            user = await User.create({
                email: email.toLowerCase(),
                privy_user_id: privyUserId,
                auth_method: 'privy',
                wallet_address: null
            });
        } else {
            // Update existing user if they don't have privy_user_id
            if (!user.privy_user_id) {
                user.privy_user_id = privyUserId;
                user.auth_method = 'privy';
                // Remove password_hash if switching from email to Privy auth
                if (user.password_hash) {
                    user.password_hash = undefined;
                }
                await user.save();
            }
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id.toString(), email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                walletAddress: user.wallet_address,
                authMethod: user.auth_method
            }
        });
    } catch (error) {
        console.error('Privy verification error:', error);
        res.status(500).json({ error: 'Failed to verify Privy authentication' });
    }
};






exports.refreshToken = async (req, res) => {
    try {
      const privyToken = req.headers['x-privy-token'];
      if (!privyToken) {
        return res.status(401).json({ error: 'Privy token required' });
      }
  
      // Verify with Privy
      const response = await axios.get('https://auth.privy.io/api/v1/users/me', {
        headers: { 
          'Authorization': `Bearer ${privyToken}`,
          'privy-app-id': process.env.PRIVY_APP_ID
        }
      });
  
      const privyUser = response.data;
  
      // Find your actual DB user using Privy's user ID
      const user = await User.findOne({ privy_user_id: privyUser.id });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // NOW sign JWT with the CORRECT MongoDB _id
      const newToken = jwt.sign(
        { 
          id: user._id.toString(),      // ← MUST be "id", not "userId"
          email: user.email,
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
  
      res.json({ success: true, token: newToken });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({ error: 'Invalid Privy token' });
    }
  };