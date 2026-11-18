/**
 * NFT Validation Middleware
 * Place this in: middleware/nftValidation.js
 */

const { query, body, param, validationResult } = require('express-validator');
const { ethers } = require('ethers');
// Validation rules for GET /api/nfts
exports.validateGetNFTs = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be a non-negative number')
    .custom((value, { req }) => {
      if (req.query.maxPrice && parseFloat(value) > parseFloat(req.query.maxPrice)) {
        throw new Error('Min price cannot be greater than max price');
      }
      return true;
    }),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a non-negative number'),
  
  query('owner')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Owner address cannot be empty')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Owner must be a valid Ethereum address (0x followed by 40 hex characters)'),
  
  query('contract')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Contract address cannot be empty')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Contract must be a valid Ethereum address (0x followed by 40 hex characters)'),
  
  query('sortBy')
    .optional()
    .isIn(['price', 'date', 'name'])
    .withMessage('Sort by must be one of: price, date, name'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc')
];



// ============================================
// NEW VALIDATION - POST /api/nfts/:id/verify-ownership
// ============================================

exports.validateVerifyOwnership = [
  // Validate NFT ID parameter
  param('id')
    .notEmpty()
    .withMessage('NFT ID is required')
    .isMongoId()
    .withMessage('Invalid NFT ID format'),

  // Validate wallet address
  body('walletAddress')
    .notEmpty()
    .withMessage('Wallet address is required')
    .trim()
    .custom((value) => {
      if (!ethers.isAddress(value)) {
        throw new Error('Invalid Ethereum address format');
      }
      return true;
    }),

  // Validate signature
  body('signature')
    .notEmpty()
    .withMessage('Signature is required')
    .trim()
    .isLength({ min: 130, max: 134 })
    .withMessage('Invalid signature format')
    .matches(/^0x[a-fA-F0-9]+$/)
    .withMessage('Signature must be a hex string starting with 0x'),

  // Optional: Message that was signed
  body('message')
    .optional()
    .isString()
    .withMessage('Message must be a string')
];

// ============================================
// NEW VALIDATION - POST /api/nfts/:id/check-current-ownership
// ============================================

exports.validateCheckOwnership = [
  param('id')
    .notEmpty()
    .withMessage('NFT ID is required')
    .isMongoId()
    .withMessage('Invalid NFT ID format')
];







// Middleware to handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};