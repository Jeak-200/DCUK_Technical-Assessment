/**
 * NFT Routes
 */

const express = require('express');
const router = express.Router();
const { getAllNFTs, getNFTById, createNFT, searchNFTs, verifyOwnership, checkCurrentOwnership} = require('../controllers/nftController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateGetNFTs, handleValidationErrors, validateVerifyOwnership, validateCheckOwnership } = require('../middleware/nftValidation');


// GET /api/nfts - List all NFTs with pagination
router.get('/',authenticateToken, validateGetNFTs, handleValidationErrors,  getAllNFTs);


// POST /api/nfts/:id/verify-ownership - Verify ownership with signature
router.post('/:id/verify-ownership',
    validateVerifyOwnership,
    handleValidationErrors,
    verifyOwnership
  );
  
  // POST /api/nfts/:id/check-current-ownership - Check current blockchain ownership
  router.post('/:id/check-current-ownership',
    validateCheckOwnership,
    handleValidationErrors,
    checkCurrentOwnership
  );
  


// GET /api/nfts/search - Search NFTs
router.get('/search', searchNFTs);

// GET /api/nfts/:id - Get NFT details
router.get('/:id', getNFTById);

// POST /api/nfts - Create NFT listing (admin only)
router.post('/', authenticateToken, requireAdmin, createNFT);

module.exports = router;
