/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyPrivy, refreshToken } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/refresh', refreshToken);

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/privy/verify
router.post('/privy/verify', verifyPrivy);

// GET /api/auth/me
router.get('/me', authenticateToken, getMe);

module.exports = router;
