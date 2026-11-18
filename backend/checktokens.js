/**
 * Check What Tokens Were Actually Minted
 * Run: node checkTokens.js
 */

const { ethers } = require('ethers');
require('dotenv').config();

async function checkTokens() {

  const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
  console.log(`🔍 Checking your NFT contract on ${process.env.ETHEREUM_RPC_URL}\n`);

  const contractAddress = "0xCCE641c16dF312DB3b4F56AD07B213A2Fa100C3F";
  const yourWallet = "0x00CA929d0D4b7d0dCf49401eCD82ed8d908435BA";

  const contract = new ethers.Contract(
    contractAddress,
    [
      "function ownerOf(uint256 tokenId) view returns (address)",
      "function totalSupply() view returns (uint256)",
      "function name() view returns (string)",
      "function symbol() view returns (string)"
    ],
    provider
  );

  console.log('📋 Contract Info:');
  console.log('   Address:', contractAddress);
  
  try {
    const name = await contract.name();
    const symbol = await contract.symbol();
    console.log('   Name:', name);
    console.log('   Symbol:', symbol);
  } catch (e) {
    console.log('   (Could not fetch name/symbol)');
  }

  // Check total supply
  try {
    const totalSupply = await contract.totalSupply();
    console.log('   Total Minted:', totalSupply.toString(), 'NFTs');
    
    if (totalSupply.toString() === '0') {
      console.log('\n❌ NO TOKENS MINTED!');
      console.log('   You need to mint NFTs first.');
      console.log('   Go back to Remix and call the "mint" function.');
      return;
    }
  } catch (e) {
    console.log('   (Could not fetch totalSupply)');
  }

  // Try to check tokens 1-10
  console.log('\n🔍 Checking tokens...\n');
  
  const tokensFound = [];
  
  for (let i = 1; i <= 10; i++) {
    try {
      const owner = await contract.ownerOf(i);
      console.log(`✅ Token #${i} exists`);
      console.log(`   Owner: ${owner}`);
      
      if (owner.toLowerCase() === yourWallet.toLowerCase()) {
        console.log(`   🎉 YOU OWN THIS ONE!`);
        tokensFound.push(i);
      }
      
    } catch (error) {
      if (error.message.includes('BAD_DATA') || error.message.includes('does not exist')) {
        console.log(`❌ Token #${i} does not exist`);
      } else {
        console.log(`⚠️  Token #${i} - Error: ${error.message.substring(0, 50)}...`);
      }
    }
  }

  console.log('\n📊 Summary:');
  if (tokensFound.length > 0) {
    console.log(`✅ You own ${tokensFound.length} NFT(s): ${tokensFound.join(', ')}`);
    console.log('\n💡 Update your database with these token IDs:');
    tokensFound.forEach(id => {
      console.log(`   Token ID: ${id}`);
    });
  } else {
    console.log('❌ You don\'t own any NFTs in this contract');
    console.log('\n💡 Either:');
    console.log('   1. Mint some NFTs in Remix');
    console.log('   2. Or the tokens were minted but you used a different wallet');
  }

  console.log('\n🔗 Check on Etherscan:');
  console.log(`   https://sepolia.etherscan.io/address/${contractAddress}`);
}

checkTokens().catch(console.error);