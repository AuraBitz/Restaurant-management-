import React from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-3xl">🍽️</span>
              <span className="text-2xl font-bold text-orange-500">TableMate</span>
            </div>
            <p className="text-gray-400 mb-4">
              Simplifying restaurant dining with smart table booking and seamless QR code ordering.
            </p>
            <div className="flex space-x-4">
              <button className="text-gray-400 hover:text-orange-500 transition">
                <FiFacebook size={20} />
              </button>
              <button className="text-gray-400 hover:text-orange-500 transition">
                <FiTwitter size={20} />
              </button>
              <button className="text-gray-400 hover:text-orange-500 transition">
                <FiInstagram size={20} />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-orange-500 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/restaurants" className="text-gray-400 hover:text-orange-500 transition">
                  Find Restaurants
                </Link>
              </li>
              <li>
                <button className="text-gray-400 hover:text-orange-500 transition">
                  About Us
                </button>
              </li>
              <li>
                <button className="text-gray-400 hover:text-orange-500 transition">
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* For Restaurants */}
          <div>
            <h3 className="text-lg font-semibold mb-4">For Restaurants</h3>
            <ul className="space-y-2">
              <li>
                <button className="text-gray-400 hover:text-orange-500 transition">
                  Partner with Us
                </button>
              </li>
              <li>
                <button className="text-gray-400 hover:text-orange-500 transition">
                  Restaurant Login
                </button>
              </li>
              <li>
                <button className="text-gray-400 hover:text-orange-500 transition">
                  Features
                </button>
              </li>
              <li>
                <button className="text-gray-400 hover:text-orange-500 transition">
                  Pricing
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start">
                <FiMail className="mt-1 mr-2 flex-shrink-0" size={18} />
                <span>support@tablemate.com</span>
              </li>
              <li className="flex items-start">
                <FiPhone className="mt-1 mr-2 flex-shrink-0" size={18} />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start">
                <FiMapPin className="mt-1 mr-2 flex-shrink-0" size={18} />
                <span>123 Restaurant Ave, Food City, FC 12345</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} TableMate. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <button className="text-gray-400 hover:text-orange-500 text-sm transition">
              Privacy Policy
            </button>
            <button className="text-gray-400 hover:text-orange-500 text-sm transition">
              Terms of Service
            </button>
            <button className="text-gray-400 hover:text-orange-500 text-sm transition">
              Cookie Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

