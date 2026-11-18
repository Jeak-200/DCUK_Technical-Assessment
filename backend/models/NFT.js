/**
 * NFT Model
 */

const mongoose = require('mongoose');

const nftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  image_url: {
    type: String,
    default: ''
  },
  price: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    get: (v) => v ? v.toString() : '0'
  },
  token_id: {
    type: String,
    required: true  // Now required for verification
  },
  contract_address: {
    type: String,
    required: true  // Now required for verification
  },
  owner_address: {
    type: String,
    required: true  // Now required for verification
  },
  
  // NEW VERIFICATION FIELDS
  verified_owners: [{
    address: {
      type: String,
      required: true
    },
    verified_at: {
      type: Date,
      required: true,
      default: Date.now
    },
    signature: {
      type: String,
      required: true
    },
    transaction_hash: {
      type: String,
      default: null
    }
  }],
  
  verification_timestamp: {
    type: Date,
    default: null
  },
  
  verification_status: {
    type: String,
    enum: ['unverified', 'verified', 'outdated', 'checking', 'failed'],
    default: 'unverified'
  },
  
  last_blockchain_check: {
    type: Date,
    default: null
  },
  
  outdated_reason: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { getters: true }
});

module.exports = mongoose.model('NFT', nftSchema);

