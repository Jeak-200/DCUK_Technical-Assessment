const mongoose = require('mongoose');
require('dotenv').config();

// Import your NFT model
const NFT = require('./models/NFT'); // Adjust path as needed

// Sample data pools
const names = [
    'Cosmic Cat', 'Digital Dragon', 'Pixel Punk', 'Cyber Ape', 'Meta Monkey',
    'Bored Bear', 'Cool Koala', 'Dope Dog', 'Epic Eagle', 'Fancy Fox',
    'Galaxy Gorilla', 'Happy Hippo', 'Ice Iguana', 'Jolly Jaguar', 'Killer Kangaroo',
    'Lazy Lion', 'Magic Moose', 'Neon Narwhal', 'Ocean Otter', 'Prismatic Panda',
    'Quantum Quokka', 'Radical Rhino', 'Space Seal', 'Techno Tiger', 'Ultra Unicorn'
];

const descriptions = [
    'A rare and unique digital collectible with stunning artwork',
    'One of a kind NFT from the exclusive collection',
    'Limited edition artwork with special traits and attributes',
    'Handcrafted digital masterpiece by renowned artist',
    'Premium NFT with verified authenticity and provenance'
];

const owners = [
    "0x00CA929d0D4b7d0dCf49401eCD82ed8d908435BA",
    "0x00CA929d0D4b7d0dCf49401eCD82ed8d908435BA",
    "0x00CA929d0D4b7d0dCf49401eCD82ed8d908435BA",
    "0x00CA929d0D4b7d0dCf49401eCD82ed8d908435BA",
    "0x00CA929d0D4b7d0dCf49401eCD82ed8d908435BA"
];

const contracts = [
 "0xCCE641c16dF312DB3b4F56AD07B213A2Fa100C3F",
 "0xCCE641c16dF312DB3b4F56AD07B213A2Fa100C3F",
 "0xCCE641c16dF312DB3b4F56AD07B213A2Fa100C3F",
 "0xCCE641c16dF312DB3b4F56AD07B213A2Fa100C3F"
];

const imageUrls = [
    'https://picsum.photos/seed/nft1/400/400',
    'https://picsum.photos/seed/nft2/400/400',
    'https://picsum.photos/seed/nft3/400/400',
    'https://picsum.photos/seed/nft4/400/400',
    'https://picsum.photos/seed/nft5/400/400',
    'https://picsum.photos/seed/nft6/400/400',
    'https://picsum.photos/seed/nft7/400/400',
    'https://picsum.photos/seed/nft8/400/400'
];

// Generate random NFTs
function generateNFTs(count = 50) {
    const nfts = [];
    
    for (let i = 0; i < count; i++) {
        const nft = {
            name: `${names[Math.floor(Math.random() * names.length)]} #${i + 1}`,
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            image_url: imageUrls[Math.floor(Math.random() * imageUrls.length)],
            price: mongoose.Types.Decimal128.fromString((Math.random() * 10).toFixed(2)), // 0 to 10 ETH
            owner_address: owners[Math.floor(Math.random() * owners.length)],
            contract_address: contracts[Math.floor(Math.random() * contracts.length)],
            token_id: 1,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        };
        
        nfts.push(nft);
    }
    
    return nfts;
}
module.exports = generateNFTs

// Seed the database
async function seedDatabase() {
    try {
        // Connect to MongoDB

        // Clear existing NFTs (optional - comment out if you want to keep existing data)
        await NFT.deleteMany({});
        console.log('Cleared existing NFTs');

        // Generate and insert NFTs
        const nfts = generateNFTs(50); // Generate 50 NFTs
        const insertedNFTs = await NFT.insertMany(nfts);
        
        console.log(`✅ Successfully inserted ${insertedNFTs.length} NFTs`);
        
        // Show some stats
        const allNFTs = await NFT.find({});
        const prices = allNFTs.map(nft => parseFloat(nft.price));
        const priceRanges = {
            low: prices.filter(p => p < 3).length,
            medium: prices.filter(p => p >= 3 && p <= 7).length,
            high: prices.filter(p => p > 7).length
        };
        
        console.log('\n📊 Price Distribution:');
        console.log(`   Low (< 3 ETH): ${priceRanges.low}`);
        console.log(`   Medium (3-7 ETH): ${priceRanges.medium}`);
        console.log(`   High (> 7 ETH): ${priceRanges.high}`);
        
        console.log('\n🔍 Sample queries to test:');
        console.log(`   GET /api/nfts?minPrice=2&maxPrice=5`);
        console.log(`   GET /api/nfts?owner=${owners[0]}`);
        console.log(`   GET /api/nfts?contract=${contracts[0]}`);
        console.log(`   GET /api/nfts?sortBy=price&sortOrder=asc`);
        console.log(`   GET /api/nfts?sortBy=name&sortOrder=desc`);
        
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seed function
seedDatabase();