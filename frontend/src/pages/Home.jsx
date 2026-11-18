/**
 * Enhanced Home Page with Validation Error Handling
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate} from 'react-router-dom';
import axios from 'axios';
import { useAuth} from '../contexts/AuthContext';

const Home = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [cart, setCart] = useState([]);
  const [addingToCart, setAddingToCart] = useState({});
  const navigate = useNavigate();

  const { refreshToken, isAuthenticated} = useAuth();

  // Filter states - Initialize with empty strings
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    owner: '',
    contract: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchNFTs();
    }
  }, [filters, pagination.page, isAuthenticated]);

  const fetchNFTs = async () => {
    try {
      setLoading(true);
      setError(null);
      setValidationErrors([]);
      
      // Build query params - only add non-empty values
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      // Only add filter params if they have actual values
      if (filters.minPrice && filters.minPrice.trim() !== '') {
        params.append('minPrice', filters.minPrice.trim());
      }
      if (filters.maxPrice && filters.maxPrice.trim() !== '') {
        params.append('maxPrice', filters.maxPrice.trim());
      }
      if (filters.owner && filters.owner.trim() !== '') {
        params.append('owner', filters.owner.trim());
      }
      if (filters.contract && filters.contract.trim() !== '') {
        params.append('contract', filters.contract.trim());
      }

      console.log('🔍 Fetching NFTs with params:', Object.fromEntries(params));
      
      const response = await axios.get(`/api/nfts?${params.toString()}`);
      
      console.log('✅ NFTs fetched successfully:', {
        count: response.data.nfts.length,
        total: response.data.pagination.total,
        page: response.data.pagination.page
      });

      setNfts(response.data.nfts || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages
      }));
    } catch (error) {
      console.error('❌ Failed to fetch NFTs:', error);

      // Handle validation errors (400)
      if (error.response && error.response.status === 400) {
        const errorData = error.response.data;
        
        // Log validation errors to console
        console.group('🚫 Validation Errors');
        console.log('Error type:', errorData.error);
        if (errorData.errors) {
          errorData.errors.forEach((err, index) => {
            console.log(`${index + 1}. ${err.field}: ${err.message}`, {
              field: err.field,
              value: err.value,
              message: err.message
            });
          });
        }
        console.groupEnd();

        // Set validation errors for UI display
        if (errorData.errors && Array.isArray(errorData.errors)) {
          setValidationErrors(errorData.errors);
          setError('Please fix the validation errors below');
        } else {
          setError(errorData.error || 'Invalid request parameters');
        }
      } 
      // Handle token refresh (401)
      else if (error.response && error.response.status === 401) {
        console.log("Token expired!")
        const refreshResult = await refreshToken();
        
        if (refreshResult.success) {
          // Retry the request
          await fetchNFTs();
        } else {
          // Redirect to login
          navigate('/login');
        }
      }
      else {
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setError('Failed to load NFTs. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    // Clear validation errors when user starts typing
    setValidationErrors([]);
    setError(null);
    
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      owner: '',
      contract: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
    setValidationErrors([]);
    setError(null);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const addToCart = (nft) => {
    setAddingToCart(prev => ({ ...prev, [nft.id]: true }));
    
    setTimeout(() => {
      setCart(prev => {
        if (prev.find(item => item.id === nft.id)) {
          return prev;
        }
        return [...prev, nft];
      });
      setAddingToCart(prev => ({ ...prev, [nft.id]: false }));
    }, 300);
  };

  const isInCart = (nftId) => cart.some(item => item.id === nftId);

  const truncateAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  // Check if a specific field has validation error
  const getFieldError = (fieldName) => {
    return validationErrors.find(err => err.field === fieldName);
  };

  const hasFieldError = (fieldName) => {
    return validationErrors.some(err => err.field === fieldName);
  };

  // Show loading state while not authenticated
  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <p>Please log in to view NFTs</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">NFT Marketplace</h1>
        <p className="text-gray-600">
          Discover and collect unique digital assets
        </p>
        {cart.length > 0 && (
          <div className="mt-4 inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full">
            🛒 {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
          </div>
        )}
      </div>

      {/* Validation Errors Alert - Shows at top if there are validation errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6 shadow-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-red-500 text-2xl">⚠️</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-red-800 font-semibold text-lg mb-2">
                Validation Errors
              </h3>
              <p className="text-red-700 mb-3">
                Please correct the following errors in your filters:
              </p>
              <ul className="space-y-2">
                {validationErrors.map((err, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <div>
                      <span className="font-semibold text-red-900">
                        {err.field}:
                      </span>{' '}
                      <span className="text-red-700">{err.message}</span>
                      {err.value && (
                        <span className="text-sm text-red-600 block mt-1">
                          (You entered: "{err.value}")
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Min Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Price (ETH)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              placeholder="0.00"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                hasFieldError('minPrice')
                  ? 'border-red-500 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-purple-500'
              }`}
            />
            {hasFieldError('minPrice') && (
              <p className="mt-1 text-sm text-red-600">
                {getFieldError('minPrice').message}
              </p>
            )}
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Price (ETH)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              placeholder="10.00"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                hasFieldError('maxPrice')
                  ? 'border-red-500 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-purple-500'
              }`}
            />
            {hasFieldError('maxPrice') && (
              <p className="mt-1 text-sm text-red-600">
                {getFieldError('maxPrice').message}
              </p>
            )}
          </div>

          {/* Owner Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Owner Address
            </label>
            <input
              type="text"
              value={filters.owner}
              onChange={(e) => handleFilterChange('owner', e.target.value)}
              placeholder="0x..."
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 font-mono text-sm ${
                hasFieldError('owner')
                  ? 'border-red-500 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-purple-500'
              }`}
            />
            {hasFieldError('owner') && (
              <p className="mt-1 text-sm text-red-600">
                {getFieldError('owner').message}
              </p>
            )}
          </div>

          {/* Contract Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contract Address
            </label>
            <input
              type="text"
              value={filters.contract}
              onChange={(e) => handleFilterChange('contract', e.target.value)}
              placeholder="0x..."
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 font-mono text-sm ${
                hasFieldError('contract')
                  ? 'border-red-500 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-purple-500'
              }`}
            />
            {hasFieldError('contract') && (
              <p className="mt-1 text-sm text-red-600">
                {getFieldError('contract').message}
              </p>
            )}
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                hasFieldError('sortBy')
                  ? 'border-red-500 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-purple-500'
              }`}
            >
              <option value="date">Date Added</option>
              <option value="price">Price</option>
              <option value="name">Name</option>
            </select>
            {hasFieldError('sortBy') && (
              <p className="mt-1 text-sm text-red-600">
                {getFieldError('sortBy').message}
              </p>
            )}
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                hasFieldError('sortOrder')
                  ? 'border-red-500 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-purple-500'
              }`}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            {hasFieldError('sortOrder') && (
              <p className="mt-1 text-sm text-red-600">
                {getFieldError('sortOrder').message}
              </p>
            )}
          </div>

          {/* Clear Button */}
          <div className="flex items-end lg:col-span-2">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      {!loading && !error && (
        <div className="mb-4 text-gray-600">
          Showing {nfts.length} of {pagination.total} NFTs
        </div>
      )}

      {/* General Error State (Non-validation errors) */}
      {error && validationErrors.length === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-2">
            <span className="text-red-500 text-xl mr-2">⚠️</span>
            <h3 className="text-red-800 font-semibold">Error</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchNFTs}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="w-full h-64 bg-gray-300" />
              <div className="p-4">
                <div className="h-6 bg-gray-300 rounded mb-2" />
                <div className="h-4 bg-gray-300 rounded mb-2" />
                <div className="h-4 bg-gray-300 rounded w-2/3 mb-4" />
                <div className="h-10 bg-gray-300 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NFT Grid */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {nfts.map((nft) => (
              <div
                key={nft.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <Link to={`/nft/${nft.id}`}>
                  {nft.image_url ? (
                    <img
                      src={nft.image_url}
                      alt={nft.name}
                      className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <span className="text-white text-4xl">🖼️</span>
                    </div>
                  )}
                </Link>
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Link to={`/nft/${nft.id}`}>
                      <h3 className="font-semibold text-lg hover:text-purple-600 transition">
                        {nft.name}
                      </h3>
                    </Link>
                    {nft.contract_address && (
                      <span className="text-green-500 text-xl" title="Verified">
                        ✓
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {nft.description || 'No description available'}
                  </p>
                  
                  <div className="mb-3 text-xs text-gray-500">
                    <div className="flex items-center mb-1">
                      <span className="font-medium mr-1">Owner:</span>
                      <span className="font-mono">
                        {truncateAddress(nft.owner_address)}
                      </span>
                    </div>
                    {nft.contract_address && (
                      <div className="flex items-center">
                        <span className="font-medium mr-1">Contract:</span>
                        <span className="font-mono">
                          {truncateAddress(nft.contract_address)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-purple-600 font-bold text-lg">
                      {formatPrice(nft.price)} ETH
                    </p>
                    
                    <button
                      onClick={() => addToCart(nft)}
                      disabled={isInCart(nft.id) || addingToCart[nft.id]}
                      className={`px-4 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
                        isInCart(nft.id)
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : addingToCart[nft.id]
                          ? 'bg-purple-400 text-white cursor-wait'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {isInCart(nft.id) ? '✓ In Cart' : addingToCart[nft.id] ? 'Adding...' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {nfts.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                No NFTs Found
              </h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your filters to see more results
              </p>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              
              <div className="flex gap-2">
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                    className={`px-4 py-2 rounded-md transition ${
                      pagination.page === i + 1
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;