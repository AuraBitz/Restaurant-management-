import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin, FiStar, FiClock, FiHeart, FiTrendingUp } from 'react-icons/fi';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { mapRestaurantRow } from '../../lib/map-restaurant';
import { getPublicRestaurantList } from '../../services/api/restaurant.api';
import type { RestaurantListItem } from '../../types/restaurant';

interface Suggestion {
  type: 'restaurant' | 'city';
  value: string;
  restaurantId?: number;
  count?: number;
}

const Restaurants: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const restaurantsPerPage = 10;

  const loadRestaurants = useCallback(async (search?: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await getPublicRestaurantList({
        limit: 100,
        search: search?.trim() || undefined,
      });
      setRestaurants(result.rows.map(mapRestaurantRow));
    } catch {
      setError('Could not load restaurants. Please check backend is running.');
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const categories = useMemo(() => {
    const cityMap = new Map<string, number>();
    restaurants.forEach((r) => {
      const city = r.city || 'Other';
      cityMap.set(city, (cityMap.get(city) || 0) + 1);
    });
    return [
      { id: 'all', name: 'All Restaurants', icon: '🍽️', count: restaurants.length },
      ...Array.from(cityMap.entries()).map(([city, count]) => ({
        id: city.toLowerCase().replace(/\s+/g, '-'),
        name: city,
        icon: '📍',
        count,
      })),
    ];
  }, [restaurants]);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
    );
  };

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      restaurant.name.toLowerCase().includes(query) ||
      restaurant.cuisine.toLowerCase().includes(query) ||
      restaurant.address.toLowerCase().includes(query);
    const matchesCategory =
      selectedCategory === 'all' || restaurant.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredRestaurants.length / restaurantsPerPage);
  const indexOfLastRestaurant = currentPage * restaurantsPerPage;
  const indexOfFirstRestaurant = indexOfLastRestaurant - restaurantsPerPage;
  const currentRestaurants = filteredRestaurants.slice(
    indexOfFirstRestaurant,
    indexOfLastRestaurant
  );

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const newSuggestions: Suggestion[] = [];

      const restaurantSuggestions = restaurants
        .filter((r) => r.name.toLowerCase().includes(query))
        .slice(0, 5)
        .map((r) => ({
          type: 'restaurant' as const,
          value: r.name,
          restaurantId: r.id,
        }));

      const cityMap = new Map<string, number>();
      restaurants.forEach((r) => {
        if (r.city.toLowerCase().includes(query)) {
          cityMap.set(r.city, (cityMap.get(r.city) || 0) + 1);
        }
      });

      const citySuggestions = Array.from(cityMap.entries())
        .slice(0, 3)
        .map(([city, count]) => ({
          type: 'city' as const,
          value: city,
          count,
        }));

      newSuggestions.push(...restaurantSuggestions, ...citySuggestions);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, restaurants]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.type === 'restaurant' && suggestion.restaurantId) {
      navigate(`/restaurant/${suggestion.restaurantId}`);
    } else {
      setSearchQuery(suggestion.value);
      setShowSuggestions(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex-grow">
        <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-6 text-center">Find Your Perfect Restaurant</h1>

            <div className="max-w-3xl mx-auto">
              <div className="relative" ref={searchRef}>
                <FiSearch
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"
                  size={24}
                />
                <input
                  type="text"
                  placeholder="Search restaurants, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery && setShowSuggestions(true)}
                  className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 focus:ring-2 focus:ring-orange-300 outline-none text-lg"
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-3 border-b border-orange-200">
                      <div className="flex items-center gap-2 text-orange-700 font-semibold">
                        <FiTrendingUp size={18} />
                        <span>Search Suggestions</span>
                      </div>
                    </div>

                    <div className="py-2">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full px-4 py-3 hover:bg-orange-50 transition-colors flex items-center gap-3 text-left group"
                        >
                          {suggestion.type === 'restaurant' ? (
                            <>
                              <div className="bg-orange-100 p-2 rounded-lg group-hover:bg-orange-200 transition-colors">
                                <FiMapPin className="text-orange-600" size={20} />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                                  {suggestion.value}
                                </div>
                                <div className="text-sm text-gray-500">Restaurant</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
                                <FiSearch className="text-blue-600" size={20} />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                                  {suggestion.value}
                                </div>
                                <div className="text-sm text-gray-500">
                                  City • {suggestion.count} restaurants
                                </div>
                              </div>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold whitespace-nowrap transition ${
                    selectedCategory === category.id
                      ? 'bg-orange-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">{category.icon}</span>
                  <span>{category.name}</span>
                  <span className="text-xs opacity-80">({category.count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {loading ? 'Loading restaurants...' : `${filteredRestaurants.length} Restaurants Found`}
            </h2>
            <button
              type="button"
              onClick={() => loadRestaurants(searchQuery)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {error ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold mb-2">Failed to load restaurants</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => loadRestaurants()}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
              >
                Try Again
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-gray-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-10 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden relative group"
                >
                  {!restaurant.isOpen ? (
                    <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Offline
                    </div>
                  ) : (
                    <div className="absolute top-4 left-4 z-10 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Online
                    </div>
                  )}

                  <button
                    onClick={() => toggleFavorite(restaurant.id)}
                    className="absolute top-4 right-4 z-10 bg-white p-2 rounded-full shadow-lg hover:scale-110 transition"
                  >
                    <FiHeart
                      size={20}
                      className={
                        favorites.includes(restaurant.id)
                          ? 'fill-red-500 text-red-500'
                          : 'text-gray-600'
                      }
                    />
                  </button>

                  <div className="bg-gradient-to-br from-orange-100 to-orange-200 h-48 flex items-center justify-center text-8xl group-hover:scale-110 transition-transform duration-300">
                    {restaurant.image}
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{restaurant.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {restaurant.city} • Dine-in
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <FiStar className="text-yellow-500 mr-1" />
                        <span className="font-semibold">{restaurant.rating}</span>
                        <span className="text-gray-500 ml-1">rating</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <FiClock className="mr-2" />
                        <span>{restaurant.deliveryTime}</span>
                      </div>

                      <div className="flex items-start text-sm text-gray-600">
                        <FiMapPin className="mr-2 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{restaurant.address}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                      className={`w-full py-3 rounded-lg font-semibold transition ${
                        restaurant.isOpen
                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!restaurant.isOpen}
                    >
                      {restaurant.isOpen ? 'Book Table' : 'Currently Offline'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && filteredRestaurants.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">😔</div>
              <h3 className="text-2xl font-bold mb-2">No restaurants found</h3>
              <p className="text-gray-600 mb-6">
                Only online restaurants from Restaurant Master are shown here.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  loadRestaurants();
                }}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
              >
                Clear Filters
              </button>
            </div>
          ) : null}

          {!loading && filteredRestaurants.length > restaurantsPerPage ? (
            <div className="mt-12 flex justify-center items-center gap-2 flex-wrap">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-orange-600 hover:text-white border border-gray-300'
                }`}
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`w-10 h-10 rounded-lg font-semibold transition ${
                    currentPage === pageNumber
                      ? 'bg-orange-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-orange-100 border border-gray-300'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-orange-600 hover:text-white border border-gray-300'
                }`}
              >
                ›
              </button>
            </div>
          ) : null}

          {!loading && filteredRestaurants.length > 0 ? (
            <div className="mt-6 text-center text-gray-600">
              Showing {indexOfFirstRestaurant + 1} to{' '}
              {Math.min(indexOfLastRestaurant, filteredRestaurants.length)} of{' '}
              {filteredRestaurants.length} restaurants
            </div>
          ) : null}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Restaurants;
