import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { getActiveBookingSession } from '../../lib/active-booking-session';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const activeBooking = getActiveBookingSession();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-3xl">🍽️</span>
            <span className="text-2xl font-bold text-orange-600">TableMate</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`font-medium transition-all duration-200 relative ${
                isActive('/')
                  ? 'text-orange-600 after:absolute after:bottom-[-8px] after:left-0 after:right-0 after:h-1 after:bg-orange-600 after:rounded-full'
                  : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              Home
            </Link>
            <Link
              to="/restaurants"
              className={`font-medium transition-all duration-200 relative ${
                isActive('/restaurants')
                  ? 'text-orange-600 after:absolute after:bottom-[-8px] after:left-0 after:right-0 after:h-1 after:bg-orange-600 after:rounded-full'
                  : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              Find Restaurant
            </Link>
            <Link
              to="/current-restaurant"
              className={`font-medium transition-all duration-200 relative ${
                isActive('/current-restaurant')
                  ? 'text-orange-600 after:absolute after:bottom-[-8px] after:left-0 after:right-0 after:h-1 after:bg-orange-600 after:rounded-full'
                  : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              {activeBooking ? `At ${activeBooking.tableLabels[0] || 'Table'}` : 'Current Restaurant'}
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700 hover:text-orange-600"
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                isActive('/')
                  ? 'text-white bg-orange-600 shadow-md'
                  : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="flex items-center gap-2">
                {isActive('/') && <span className="text-lg">●</span>}
                Home
              </span>
            </Link>
            <Link
              to="/restaurants"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                isActive('/restaurants')
                  ? 'text-white bg-orange-600 shadow-md'
                  : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="flex items-center gap-2">
                {isActive('/restaurants') && <span className="text-lg">●</span>}
                Find Restaurant
              </span>
            </Link>
            <Link
              to="/current-restaurant"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                isActive('/current-restaurant')
                  ? 'text-white bg-orange-600 shadow-md'
                  : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="flex items-center gap-2">
                {isActive('/current-restaurant') && <span className="text-lg">●</span>}
                {activeBooking ? `At ${activeBooking.tableLabels[0] || 'Table'}` : 'Current Restaurant'}
              </span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

