/**
 * Blockchain Service - Handles all blockchain interactions
 * File: services/blockchainService.js
 */

const { ethers } = require('ethers');

class BlockchainService {
  constructor() {
    // Initialize provider based on environment
    this.initializeProvider();
    
    // Minimal ERC-721 ABI (only what we need)
    this.nftABI = [
      "function ownerOf(uint256 tokenId) view returns (address)",
      "function tokenURI(uint256 tokenId) view returns (string)"
    ];
  }

  initializeProvider() {
    if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_BLOCKCHAIN === 'true') {
      console.log('⚠️  Using MOCK blockchain for development');
      this.provider = null;
      this.isMock = true;
    } else {
      // Use real blockchain provider
      // Default to Sepolia for testnet NFTs
      const rpcUrl = process.env.ETHEREUM_RPC_URL;
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.isMock = false;
      console.log('✅ Connected to blockchain network:', rpcUrl);
    }
  }

  /**
   * Verify a message signature
   * @param {string} message - The message that was signed
   * @param {string} signature - The signature from the wallet
   * @returns {string} - The recovered address
   */
  verifySignature(message, signature) {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress;
    } catch (error) {
      throw new Error(`Invalid signature: ${error.message}`);
    }
  }

  /**
   * Check who owns an NFT on the blockchain
   * @param {string} contractAddress - NFT contract address
   * @param {string} tokenId - Token ID
   * @returns {Promise<string>} - Owner address
   */
  async getTokenOwner(contractAddress, tokenId) {
    // Mock implementation for development/testing
    if (this.isMock) {
      return this.mockGetTokenOwner(contractAddress, tokenId);
    }

    try {
      // Validate contract address
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Invalid contract address format');
      }

      // Create contract instance
      const contract = new ethers.Contract(
        contractAddress,
        this.nftABI,
        this.provider
      );

      // Call ownerOf function
      const owner = await contract.ownerOf(tokenId);
      
      console.log(`✅ Token ${tokenId} owner: ${owner}`);
      return owner;

    } catch (error) {
      // Handle specific errors
      if (error.message.includes('invalid address')) {
        throw new Error('Invalid contract address');
      }
      
      if (error.message.includes('call revert exception')) {
        throw new Error('Token does not exist or contract does not support ownerOf');
      }
      
      if (error.message.includes('network')) {
        throw new Error('Network connection failed. Please try again.');
      }

      throw new Error(`Blockchain query failed: ${error.message}`);
    }
  }

  /**
   * Get token metadata URI
   * @param {string} contractAddress - NFT contract address
   * @param {string} tokenId - Token ID
   * @returns {Promise<string>} - Token URI
   */
  async getTokenURI(contractAddress, tokenId) {
    if (this.isMock) {
      return `https://mock-metadata.com/${contractAddress}/${tokenId}`;
    }

    try {
      const contract = new ethers.Contract(
        contractAddress,
        this.nftABI,
        this.provider
      );

      const uri = await contract.tokenURI(tokenId);
      return uri;

    } catch (error) {
      console.warn('Failed to fetch token URI:', error.message);
      return null;
    }
  }

  /**
   * Validate Ethereum address format
   * @param {string} address - Address to validate
   * @returns {boolean}
   */
  isValidAddress(address) {
    return ethers.isAddress(address);
  }

  /**
   * Mock blockchain for testing/development
   */
  mockGetTokenOwner(contractAddress, tokenId) {
    console.log('🧪 MOCK: Getting token owner');
    
    // Simulate some mock data
    const mockOwners = {
      // Format: "contract:tokenId": "ownerAddress"
      [`${contractAddress}:1`]: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      [`${contractAddress}:2`]: "0x8Ba1f109551bD432803012645Ac136ddd64DBA72",
      [`${contractAddress}:3`]: "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
    };

    const key = `${contractAddress}:${tokenId}`;
    const owner = mockOwners[key];

    if (owner) {
      console.log(`🧪 MOCK: Token ${tokenId} owner: ${owner}`);
      return owner;
    }

    // Return first mock address as default
    return "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";
  }

  /**
   * Check if provider is connected
   */
  async isConnected() {
    if (this.isMock) return true;
    
    try {
      await this.provider.getNetwork();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
module.exports = new BlockchainService();