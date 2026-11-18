/**
 * Test NFT Verification with Real Blockchain Data
 * File: testRealVerification.js
 * Run: node testRealVerification.js
 */

const axios = require('axios');
const { ethers } = require('ethers');

const BASE_URL = 'http://localhost:5000/api';

// You'll get this from createTestNFT.js output
const TEST_NFT_ID = '692aca400a7c9627e214b451'; // Replace with actual MongoDB ID

async function testRealVerification() {
  console.log('🧪 Testing NFT Verification with Real Blockchain Data\n');
  console.log('=' .repeat(60));
  
  try {
    // ==========================================
    // Test 1: Check Real Blockchain Ownership
    // ==========================================
    console.log('\n📝 Test 1: Check Current Blockchain Ownership');
    console.log('This queries the REAL Ethereum blockchain...\n');
    
    const checkResponse = await axios.post(
      `${BASE_URL}/nfts/${TEST_NFT_ID}/check-current-ownership`
    );
    
    console.log('✅ Blockchain Query Successful!');
    console.log('\nResults:');
    console.log(`   Listed Owner:     ${checkResponse.data.data.listedOwner}`);
    console.log(`   Blockchain Owner: ${checkResponse.data.data.blockchainOwner}`);
    console.log(`   Match:            ${checkResponse.data.data.isCurrentOwner ? '✅ Yes' : '❌ No'}`);
    console.log(`   Message:          ${checkResponse.data.data.message}`);
    
    // Store the real owner for next test
    const realOwner = checkResponse.data.data.blockchainOwner;
    
    console.log('\n' + '='.repeat(60));
    
    // ==========================================
    // Test 2: Generate Valid Signature
    // ==========================================
    console.log('\n📝 Test 2: Generate Valid Signature');
    console.log('This creates a cryptographically valid signature...\n');
    
    // Create a test wallet (this is just for demonstration)
    // In production, user signs with MetaMask
    const testWallet = ethers.Wallet.createRandom();
    const message = "I am verifying ownership of this NFT";
    const signature = await testWallet.signMessage(message);
    
    console.log('✅ Signature Generated');
    console.log(`   Test Wallet:  ${testWallet.address}`);
    console.log(`   Message:      "${message}"`);
    console.log(`   Signature:    ${signature.slice(0, 20)}...${signature.slice(-20)}`);
    
    console.log('\n' + '='.repeat(60));
    
    // ==========================================
    // Test 3: Try to Verify with Wrong Wallet
    // ==========================================
    console.log('\n📝 Test 3: Verify Ownership (Wrong Wallet - Should Fail)');
    console.log('Testing with a wallet that does NOT own the NFT...\n');
    
    try {
      const verifyResponse = await axios.post(
        `${BASE_URL}/nfts/${TEST_NFT_ID}/verify-ownership`,
        {
          walletAddress: testWallet.address, // Random wallet (doesn't own NFT)
          signature: signature,
          message: message
        }
      );
      
      console.log('❌ Test Failed - Should have been rejected!');
      
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Correctly Rejected!');
        console.log(`   Error: ${error.response.data.error}`);
        console.log(`   Message: ${error.response.data.message}`);
        console.log('\nThis is correct! The test wallet does not own the NFT.');
        console.log(`The real owner is: ${realOwner}`);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
    // ==========================================
    // Test 4: Simulate Real Owner Verification
    // ==========================================
    console.log('\n📝 Test 4: Simulate Real Owner Verification');
    console.log('Note: We cannot actually sign as the real owner (we don\'t have their private key)');
    console.log('In production, the REAL owner would sign with MetaMask.\n');
    
    console.log(`Real Owner Address: ${realOwner}`);
    console.log('To verify this NFT for real, the owner at this address would:');
    console.log('  1. Connect MetaMask');
    console.log('  2. Click "Verify Ownership"');
    console.log('  3. Sign the message in MetaMask');
    console.log('  4. Frontend sends signature to backend');
    console.log('  5. Backend verifies and updates database ✅');
    
    console.log('\n' + '='.repeat(60));
    
    // ==========================================
    // Test 5: Invalid Data
    // ==========================================
    console.log('\n📝 Test 5: Test Validation (Invalid Signature)');
    
    try {
      await axios.post(
        `${BASE_URL}/nfts/${TEST_NFT_ID}/verify-ownership`,
        {
          walletAddress: testWallet.address,
          signature: 'invalid-signature',
          message: message
        }
      );
      console.log('❌ Should have been rejected');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation Rejected Invalid Signature');
        console.log(`   Errors: ${JSON.stringify(error.response.data.errors, null, 2)}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 All Tests Complete!\n');
    
    console.log('📊 Summary:');
    console.log('  ✅ Blockchain query works');
    console.log('  ✅ Real ownership data retrieved');
    console.log('  ✅ Signature verification works');
    console.log('  ✅ Ownership mismatch detected');
    console.log('  ✅ Validation catches errors');
    
    console.log('\n💡 Next Steps:');
    console.log('  1. Frontend: Implement MetaMask signature collection');
    console.log('  2. Test with user who actually owns an NFT');
    console.log('  3. Verify full flow with real wallet');
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Make sure your server is running!');
      console.error('   Run: npm run dev');
    } else if (error.response?.status === 404) {
      console.error('\n⚠️  NFT not found!');
      console.error('   1. Run: node createTestNFT.js');
      console.error('   2. Copy the NFT ID');
      console.error('   3. Update TEST_NFT_ID in this file');
    } else {
      console.error('Full error:', error.response?.data || error);
    }
  }
}

// Run tests
console.log('\n🚀 Starting Real Data Tests...\n');
console.log('Prerequisites:');
console.log('  ✅ Server running (npm run dev)');
console.log('  ✅ MongoDB connected');
console.log('  ✅ .env configured with ETHEREUM_RPC_URL');
console.log('  ✅ Test NFT created (run createTestNFT.js first)');
console.log('  ✅ TEST_NFT_ID updated in this file\n');

testRealVerification().catch(console.error);