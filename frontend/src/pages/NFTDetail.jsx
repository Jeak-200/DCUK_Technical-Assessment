/**
 * NFT Detail Page with Verification
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const NFTDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  
  // Verification states
  const [verificationData, setVerificationData] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);

  useEffect(() => {
    fetchNFT();
  }, [id]);

  const fetchNFT = async () => {
    try {
      const response = await axios.get(`/api/nfts/${id}`);
      setNft(response.data.nft);
    } catch (error) {
      console.error('Failed to fetch NFT:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Complete verification function
  const verifyNFT = async () => {
    setVerifying(true);
    setVerificationError(null);
    
    try {
      console.log('🔍 Verifying NFT ownership...');
      
      const response = await axios.post(`/api/nfts/${id}/check-current-ownership`);
      
      console.log('✅ Verification response:', response.data);
      
      setVerificationData(response.data.data);
      
      // Also refresh the NFT data to get updated verification status
      await fetchNFT();
      
    } catch (error) {
      console.error('❌ Verification failed:', error);
      setVerificationError(
        error.response?.data?.message || 'Failed to verify ownership'
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    const result = await addToCart(nft.id);
    setAddingToCart(false);

    if (result.success) {
      alert('Added to cart!');
    } else {
      alert(result.error || 'Failed to add to cart');
    }
  };

  const truncateAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!nft) {
    return <div className="text-center py-8">NFT not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          {/* Image Section */}
          <div className="md:w-1/2">
            {nft.image_url ? (
              <img
                src={nft.image_url}
                alt={nft.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <span className="text-white text-6xl">🖼️</span>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="md:w-1/2 p-8">
            <h1 className="text-3xl font-bold mb-4">{nft.name}</h1>
            <p className="text-gray-600 mb-6">{nft.description}</p>

            {/* Price */}
            <div className="mb-6">
              <p className="text-2xl font-bold text-purple-600 mb-4">
                {nft.price} ETH
              </p>

              {/* Blockchain Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                <h3 className="font-semibold text-sm text-gray-700 mb-2">
                  Blockchain Details
                </h3>
                
                {nft.contract_address && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Contract:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-gray-800">
                        {truncateAddress(nft.contract_address)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(nft.contract_address)}
                        className="text-purple-600 hover:text-purple-700 text-xs"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                )}

                {nft.token_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Token ID:</span>
                    <span className="text-sm font-mono text-gray-800">
                      {nft.token_id}
                    </span>
                  </div>
                )}

                {nft.owner_address && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Owner:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-gray-800">
                        {truncateAddress(nft.owner_address)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(nft.owner_address)}
                        className="text-purple-600 hover:text-purple-700 text-xs"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Verification Status */}
              <div className="mb-4">
                {nft.verification_status === 'verified' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <span className="text-green-600 text-xl mr-2">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-green-800">
                          Ownership Verified
                        </p>
                        {nft.verification_timestamp && (
                          <p className="text-xs text-green-600">
                            Last verified: {new Date(nft.verification_timestamp).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {nft.verification_status === 'unverified' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <span className="text-yellow-600 text-xl mr-2">⚠️</span>
                      <p className="text-sm font-semibold text-yellow-800">
                        Ownership Not Verified
                      </p>
                    </div>
                  </div>
                )}

                {nft.verification_status === 'outdated' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <span className="text-red-600 text-xl mr-2">❌</span>
                      <div>
                        <p className="text-sm font-semibold text-red-800">
                          Verification Outdated
                        </p>
                        {nft.outdated_reason && (
                          <p className="text-xs text-red-600 mt-1">
                            {nft.outdated_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Verification Result (after checking) */}
              {verificationData && (
                <div className={`rounded-lg p-4 mb-4 ${
                  verificationData.isCurrentOwner 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`font-semibold mb-2 ${
                    verificationData.isCurrentOwner ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {verificationData.isCurrentOwner ? '✅' : '❌'} {verificationData.message}
                  </p>
                  <div className="text-sm space-y-1">
                    <p className={verificationData.isCurrentOwner ? 'text-green-700' : 'text-red-700'}>
                      <span className="font-medium">Blockchain Owner:</span>{' '}
                      <span className="font-mono">
                        {truncateAddress(verificationData.blockchainOwner)}
                      </span>
                    </p>
                    <p className="text-gray-600 text-xs">
                      Checked: {new Date(verificationData.lastChecked).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Verification Error */}
              {verificationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800">
                    ⚠️ {verificationError}
                  </p>
                </div>
              )}

              {/* Verify Button */}
              <button
                onClick={verifyNFT}
                disabled={verifying}
                className="w-full bg-gray-700 text-white py-3 rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition mb-4"
              >
                {verifying ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-2">⏳</span>
                    Checking Blockchain...
                  </span>
                ) : (
                  'Verify Current Ownership'
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
              
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || verificationData?.isCurrentOwner === false}
                className="w-full bg-gray-700 text-white py-3 rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {addingToCart ? 'Processing...' : 'Buy Now'}
              </button>
              
              {verificationData?.isCurrentOwner === false && (
                <p className="text-sm text-red-600 text-center">
                  ⚠️ Cannot purchase - ownership verification failed
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View on Etherscan Link */}
      {nft.contract_address && (
        <div className="mt-6 text-center">
          <a
            href={`https://etherscan.io/address/${nft.contract_address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-700 text-sm underline"
          >
            View on Etherscan →
          </a>
        </div>
      )}
    </div>
  );
};

export default NFTDetail;