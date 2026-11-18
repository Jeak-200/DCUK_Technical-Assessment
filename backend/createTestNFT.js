/**
 * Create Test NFT with Real Contract Data
 * File: createTestNFT.js
 * Run: node createTestNFT.js
 */

const mongoose =  require('mongoose');
require('dotenv').config();

const NFT = require('./models/NFT'); // Adjust path as needed

async function createTestNFT() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI ||
    `mongodb://localhost:27017/dcuk-assessment`;

const conn = await mongoose.connect(mongoURI,{
    dbName: "dcuk-assessment"
});

    console.log('Connected to MongoDB');
    console.log('   Database name :', mongoose.connection.name);
    console.log('   Host          :', mongoose.connection.host);
    console.log('   Port          :', mongoose.connection.port);
    console.log('   Full URL      :', mongoose.connection.getClient().options.srvHost || 'mongodb://localhost')

    console.log('✅ Connected to MongoDB');

    // Real NFT data we can test with
    // These are REAL contracts we can query (read-only, free)
    const testNFTs = [
      {
        name: "Bored Ape #1",
        description: "One of the first Bored Apes ever minted",
        image_url: "https://i.seadn.io/gcs/files/1f6e3e0e8c4e4e3e8f6e3e0e8c4e4e3e.png",
        price: mongoose.Types.Decimal128.fromString("50.0"),
        
        // REAL Bored Ape Yacht Club data
        contract_address: "0xBC4CA0EdAD51c0Da02AF91C556ceBcF59BcaaF31",
        token_id: "1",
        owner_address: "0x0000000000000000000000000000000000000000", // We'll query real owner
        
        verification_status: "unverified",
        verified_owners: [],
        verification_timestamp: null
      },
      {
        name: "Azuki #40",
        description: "Azuki NFT from the popular collection",
        image_url: "https://ikzttp.mypinata.cloud/ipfs/QmYDvPAXtiJg7s8JdRBSLWdgSphQdac8j1YuQNNxcGE1hg/40.png",
        price: mongoose.Types.Decimal128.fromString("15.0"),
        
        // REAL Azuki data
        contract_address: "0xED5AF388653567Af2F388E6224dC7C4b3241C544",
        token_id: "40",
        owner_address: "0x0000000000000000000000000000000000000000",
        
        verification_status: "unverified",
        verified_owners: [],
        verification_timestamp: null
      },
      {
        name: "Doodle #100",
        description: "Doodle NFT for testing",
        image_url: "https://ikzttp.mypinata.cloud/ipfs/QmPMc4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aS/100.png",
        price: mongoose.Types.Decimal128.fromString("8.0"),
        
        // REAL Doodles data
        contract_address: "0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e",
        token_id: "100",
        owner_address: "0x0000000000000000000000000000000000000000",
        
        verification_status: "unverified",
        verified_owners: [],
        verification_timestamp: null
      }
    ];

    // Clear existing test NFTs (optional)
    console.log('🗑️  Clearing existing NFTs...');
    await NFT.deleteMany({});

    // Insert test NFTs
    const inserted = await NFT.insertMany(testNFTs);
    
    console.log('\n✅ Created test NFTs:');
    inserted.forEach(nft => {
      console.log(`\n📦 ${nft.name}`);
      console.log(`   ID: ${nft._id}`);
      console.log(`   Contract: ${nft.contract_address}`);
      console.log(`   Token ID: ${nft.token_id}`);
    });

    console.log('\n📋 Copy one of these NFT IDs for testing!\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestNFT();