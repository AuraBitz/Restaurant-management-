import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiCalendar, FiShoppingBag, FiStar, FiClock, FiTrendingUp, FiCheckCircle, FiUsers, FiAward } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const Home: React.FC = () => {
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    message: '',
    rating: 5,
  });
  const [activeStep, setActiveStep] = useState(0);
  const [counts, setCounts] = useState({ restaurants: 0, users: 0, orders: 0 });

  // Auto-rotate steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Animated counters
  useEffect(() => {
    const duration = 2000;
    const steps = 50;
    const interval = duration / steps;
    
    const targets = { restaurants: 500, users: 10000, orders: 50000 };
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setCounts({
        restaurants: Math.floor((targets.restaurants / steps) * step),
        users: Math.floor((targets.users / steps) * step),
        orders: Math.floor((targets.orders / steps) * step),
      });
      
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('🙏 Thank you for your valuable feedback!', {
      position: 'top-center',
      autoClose: 3000,
    });
    setFeedbackForm({ name: '', email: '', message: '', rating: 5 });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section with SVG Illustration */}
      <section className="relative bg-gradient-to-br from-orange-50 via-white to-orange-50 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="2" fill="#EA580C" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left animate-fade-in">
              <div className="inline-block mb-4 px-4 py-2 bg-orange-100 rounded-full">
                <span className="text-orange-600 font-semibold text-sm">🎉 India's #1 Smart Dining Platform</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Your Smart
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-800">
                  Dining Companion
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
                Discover restaurants, book tables instantly, and order with QR codes. 
                Experience the future of dining today.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link
                  to="/restaurants"
                  className="group bg-gradient-to-r from-orange-600 to-orange-700 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <span>Explore Restaurants</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <button className="bg-white border-2 border-orange-600 text-orange-600 px-8 py-4 rounded-xl font-semibold hover:bg-orange-50 transition-all duration-300 transform hover:scale-105">
                  Watch Demo
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" />
                  <span>No booking fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" />
                  <span>Instant confirmation</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" />
                  <span>Best prices</span>
                </div>
              </div>
            </div>

            {/* Right SVG Illustration */}
            <div className="relative animate-slide-up">
              <div className="relative">
                {/* Main Illustration */}
                <svg viewBox="0 0 500 500" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                  {/* Restaurant Building */}
                  <g className="animate-bounce-slow">
                    <rect x="150" y="150" width="200" height="250" fill="#FFF7ED" stroke="#EA580C" strokeWidth="3" rx="10"/>
                    <rect x="150" y="150" width="200" height="60" fill="#EA580C"/>
                    <text x="250" y="190" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">Restaurant</text>
                    
                    {/* Windows */}
                    <rect x="170" y="230" width="50" height="50" fill="#FFEDD5" stroke="#EA580C" strokeWidth="2" rx="5"/>
                    <rect x="280" y="230" width="50" height="50" fill="#FFEDD5" stroke="#EA580C" strokeWidth="2" rx="5"/>
                    <rect x="170" y="300" width="50" height="50" fill="#FFEDD5" stroke="#EA580C" strokeWidth="2" rx="5"/>
                    <rect x="280" y="300" width="50" height="50" fill="#FFEDD5" stroke="#EA580C" strokeWidth="2" rx="5"/>
                    
                    {/* Door */}
                    <rect x="225" y="320" width="50" height="80" fill="#9A3412" rx="5"/>
                    <circle cx="265" cy="360" r="3" fill="#FCD34D"/>
                  </g>

                  {/* Floating Elements */}
                  <g className="animate-pulse-slow">
                    {/* QR Code */}
                    <rect x="50" y="100" width="60" height="60" fill="white" stroke="#EA580C" strokeWidth="2" rx="5"/>
                    <rect x="55" y="105" width="20" height="20" fill="#EA580C"/>
                    <rect x="80" y="105" width="20" height="20" fill="#EA580C"/>
                    <rect x="55" y="135" width="20" height="20" fill="#EA580C"/>
                    <rect x="80" y="135" width="20" height="20" fill="#EA580C"/>
                    <text x="80" y="180" textAnchor="middle" fill="#EA580C" fontSize="12" fontWeight="bold">Scan QR</text>
                  </g>

                  <g className="animate-pulse-slow" style={{animationDelay: '0.5s'}}>
                    {/* Table Booking Icon */}
                    <circle cx="420" y="150" r="35" fill="white" stroke="#EA580C" strokeWidth="3"/>
                    <path d="M 405 145 L 435 145 L 435 155 L 405 155 Z" fill="#EA580C"/>
                    <circle cx="408" cy="160" r="3" fill="#EA580C"/>
                    <circle cx="420" cy="160" r="3" fill="#EA580C"/>
                    <circle cx="432" cy="160" r="3" fill="#EA580C"/>
                    <text x="420" y="205" textAnchor="middle" fill="#EA580C" fontSize="12" fontWeight="bold">Book Table</text>
                  </g>

                  <g className="animate-pulse-slow" style={{animationDelay: '1s'}}>
                    {/* Food Icon */}
                    <circle cx="80" y="320" r="35" fill="white" stroke="#22C55E" strokeWidth="3"/>
                    <path d="M 70 315 Q 80 305 90 315" stroke="#22C55E" strokeWidth="3" fill="none"/>
                    <circle cx="80" cy="325" r="8" fill="#22C55E"/>
                    <text x="80" y="375" textAnchor="middle" fill="#22C55E" fontSize="12" fontWeight="bold">Order Food</text>
                  </g>

                  <g className="animate-pulse-slow" style={{animationDelay: '1.5s'}}>
                    {/* Payment Icon */}
                    <circle cx="420" y="350" r="35" fill="white" stroke="#3B82F6" strokeWidth="3"/>
                    <rect x="405" y="345" width="30" height="20" fill="#3B82F6" rx="2"/>
                    <rect x="405" y="355" width="15" height="4" fill="white"/>
                    <text x="420" y="400" textAnchor="middle" fill="#3B82F6" fontSize="12" fontWeight="bold">Pay Online</text>
                  </g>

                  {/* Connecting Lines */}
                  <path d="M 110 130 L 150 170" stroke="#EA580C" strokeWidth="2" strokeDasharray="5,5" opacity="0.3"/>
                  <path d="M 385 150 L 350 170" stroke="#EA580C" strokeWidth="2" strokeDasharray="5,5" opacity="0.3"/>
                  <path d="M 115 320 L 150 320" stroke="#22C55E" strokeWidth="2" strokeDasharray="5,5" opacity="0.3"/>
                  <path d="M 385 350 L 350 350" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5" opacity="0.3"/>
                </svg>

                {/* Floating Cards */}
                <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-xl p-4 border-2 border-green-500 animate-bounce-slow">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <div className="font-bold text-gray-800">4.8/5</div>
                      <div className="text-xs text-gray-600">Rating</div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-8 -left-4 bg-white rounded-lg shadow-xl p-4 border-2 border-orange-500 animate-bounce-slow" style={{animationDelay: '0.5s'}}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🍽️</span>
                    <div>
                      <div className="font-bold text-gray-800">500+</div>
                      <div className="text-xs text-gray-600">Restaurants</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Interactive Steps */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Background SVG Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <pattern id="wave" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M0 50 Q 25 25, 50 50 T 100 50" stroke="#EA580C" fill="none" strokeWidth="2"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#wave)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-4 py-2 bg-orange-100 rounded-full">
              <span className="text-orange-600 font-semibold text-sm">How It Works</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple Steps to Your Perfect Meal
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From discovery to delivery, we've made dining out easier than ever before
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/4 left-0 right-0 h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-300 opacity-20" style={{top: '120px'}}></div>

            {/* Step 1 */}
            <div className={`relative group ${activeStep === 0 ? 'scale-105' : ''} transition-transform duration-500`}>
              <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-orange-200">
                <div className="relative">
                  {/* Step Number */}
                  <div className="absolute -top-12 -left-4 w-16 h-16 bg-gradient-to-br from-orange-600 to-orange-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    1
                  </div>

                  {/* Icon */}
                  <div className="bg-white w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md border-2 border-orange-200">
                    <FiSearch className="text-orange-600" size={48} />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">Discover</h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    Browse through hundreds of restaurants with advanced filters, reviews, and real-time availability
                  </p>

                  {/* Feature List */}
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <FiCheckCircle className="text-green-500 flex-shrink-0" />
                      <span>Smart search & filters</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <FiCheckCircle className="text-green-500 flex-shrink-0" />
                      <span>Real-time reviews</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <FiCheckCircle className="text-green-500 flex-shrink-0" />
                      <span>Live availability</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`relative group ${activeStep === 1 ? 'scale-105' : ''} transition-transform duration-500`}>
              <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-green-200">
                <div className="relative">
                  {/* Step Number */}
                  <div className="absolute -top-12 -left-4 w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    2
                  </div>

                  {/* Icon */}
                  <div className="bg-white w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md border-2 border-green-200">
                    <FiCalendar className="text-green-600" size={48} />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">Book or Scan</h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    Reserve your table in advance or scan QR code at restaurant for instant menu access
                  </p>

                  {/* Feature List */}
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <FiCheckCircle className="text-green-500 flex-shrink-0" />
                      <span>Instant confirmation</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <FiCheckCircle className="text-green-500 flex-shrink-0" />
                      <span>QR code ordering</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <FiCheckCircle className="text-green-500 flex-shrink-0" />
                      <span>No waiting time</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`relative group ${activeStep === 2 ? 'scale-105' : ''} transition-transform duration-500`}>
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-blue-200">
                <div className="relative">
                  {/* Step Number */}
                  <div className="absolute -top-12 -left-4 w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    3
                  </div>

                  {/* Icon */}
                  <div className="bg-white w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md border-2 border-blue-200">
                    <FiShoppingBag className="text-blue-600" size={48} />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">Order & Enjoy</h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    Browse menu, customize dishes, place order, and pay online. Track your order in real-time
                  </p>

                  {/* Feature List */}
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <FiCheckCircle className="text-green-500 flex-shrink-0" />
                      <span>Easy customization</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <FiCheckCircle className="text-green-500 flex-shrink-0" />
                      <span>Multiple payments</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <FiCheckCircle className="text-green-500 flex-shrink-0" />
                      <span>Order tracking</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gradient-to-br from-orange-600 via-orange-700 to-orange-800 text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Trusted by Thousands</h2>
            <p className="text-xl text-orange-100">Join India's fastest growing dining community</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Stat 1 */}
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 transform hover:scale-105 transition-all duration-300">
              <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers size={40} />
              </div>
              <div className="text-5xl font-bold mb-2">{counts.restaurants.toLocaleString()}+</div>
              <div className="text-xl text-orange-100">Partner Restaurants</div>
              <p className="text-sm text-orange-200 mt-2">Across major cities</p>
            </div>

            {/* Stat 2 */}
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 transform hover:scale-105 transition-all duration-300">
              <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAward size={40} />
              </div>
              <div className="text-5xl font-bold mb-2">{counts.users.toLocaleString()}+</div>
              <div className="text-xl text-orange-100">Happy Diners</div>
              <p className="text-sm text-orange-200 mt-2">And growing every day</p>
            </div>

            {/* Stat 3 */}
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 transform hover:scale-105 transition-all duration-300">
              <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiShoppingBag size={40} />
              </div>
              <div className="text-5xl font-bold mb-2">{counts.orders.toLocaleString()}+</div>
              <div className="text-xl text-orange-100">Orders Completed</div>
              <p className="text-sm text-orange-200 mt-2">With 4.8★ average rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features & Benefits */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-4 py-2 bg-blue-100 rounded-full">
              <span className="text-blue-600 font-semibold text-sm">Why Choose TableMate</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Experience Dining, Reimagined
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We bring together technology and hospitality to create unforgettable dining experiences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-blue-500">
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FiClock className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Save Time</h3>
              <p className="text-gray-600 leading-relaxed">
                Skip the wait. Order instantly from your phone and get your food faster with our streamlined process.
              </p>
              <div className="mt-4 text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more →
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-green-500">
              <div className="bg-gradient-to-br from-green-100 to-green-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FiStar className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Better Experience</h3>
              <p className="text-gray-600 leading-relaxed">
                Browse full menus with high-quality photos, reviews, and detailed descriptions before ordering.
              </p>
              <div className="mt-4 text-green-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more →
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-purple-500">
              <div className="bg-gradient-to-br from-purple-100 to-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FiTrendingUp className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Recommendations</h3>
              <p className="text-gray-600 leading-relaxed">
                Get AI-powered personalized restaurant and dish suggestions based on your taste preferences.
              </p>
              <div className="mt-4 text-purple-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more →
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-orange-500">
              <div className="bg-gradient-to-br from-orange-100 to-orange-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FiShoppingBag className="text-orange-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Payment</h3>
              <p className="text-gray-600 leading-relaxed">
                Multiple secure payment options including UPI, cards, and digital wallets for quick checkout.
              </p>
              <div className="mt-4 text-orange-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more →
              </div>
            </div>
          </div>

          {/* Additional Benefits */}
          <div className="mt-16 bg-gradient-to-r from-orange-100 via-orange-50 to-blue-50 rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-3">🔒</div>
                <h4 className="font-bold text-gray-900 mb-2">100% Secure</h4>
                <p className="text-gray-600 text-sm">Your data is encrypted and protected</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">⚡</div>
                <h4 className="font-bold text-gray-900 mb-2">Instant Updates</h4>
                <p className="text-gray-600 text-sm">Real-time order tracking and notifications</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">💳</div>
                <h4 className="font-bold text-gray-900 mb-2">Cashless & Contactless</h4>
                <p className="text-gray-600 text-sm">Safe and hygienic digital payments</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-4 py-2 bg-orange-100 rounded-full">
              <span className="text-orange-600 font-semibold text-sm">💬 Your Voice Matters</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Help Us Serve You Better
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Share your experience and suggestions to help us improve TableMate
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 via-white to-blue-50 rounded-3xl shadow-2xl p-8 md:p-12 border border-orange-200">
            <form onSubmit={handleFeedbackSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    👤 Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={feedbackForm.name}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    📧 Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={feedbackForm.email}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="mb-6 bg-white rounded-xl p-6 border-2 border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  ⭐ Rate Your Experience
                </label>
                <div className="flex gap-3 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                      className="focus:outline-none transition-transform hover:scale-125 active:scale-110"
                    >
                      <FiStar
                        size={40}
                        className={`transition-all ${star <= feedbackForm.rating ? 'fill-orange-500 text-orange-500' : 'text-gray-300 hover:text-orange-300'}`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center mt-3">
                  <span className="text-orange-600 font-semibold">
                    {feedbackForm.rating === 5 ? '🎉 Excellent!' : feedbackForm.rating === 4 ? '😊 Great!' : feedbackForm.rating === 3 ? '😐 Good' : feedbackForm.rating === 2 ? '😕 Okay' : '😞 Could be better'}
                  </span>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  💭 Your Feedback *
                </label>
                <textarea
                  required
                  rows={6}
                  value={feedbackForm.message}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none transition-all bg-white"
                  placeholder="Share your thoughts, suggestions, or experience with TableMate..."
                />
                <p className="text-sm text-gray-500 mt-2">Your feedback helps us improve our service</p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white px-8 py-5 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <span>Submit Feedback</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* CTA Section with SVG Background */}
      <section className="relative bg-gradient-to-br from-orange-600 via-orange-700 to-orange-900 text-white py-20 overflow-hidden">
        {/* Animated SVG Background */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cta-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="2"/>
                <circle cx="50" cy="50" r="15" fill="white"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cta-pattern)" />
          </svg>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full animate-pulse-slow" style={{animationDelay: '1s'}}></div>

        {/* Floating Table & Chairs SVG Illustrations */}
        <div className="absolute left-10 top-1/2 transform -translate-y-1/2 hidden lg:block animate-bounce-slow opacity-20">
          <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            {/* Dining Table */}
            <ellipse cx="60" cy="70" rx="40" ry="15" fill="white" opacity="0.8"/>
            <rect x="40" y="70" width="40" height="40" fill="white" opacity="0.6" rx="2"/>
            <rect x="42" y="110" width="4" height="8" fill="white" opacity="0.8"/>
            <rect x="74" y="110" width="4" height="8" fill="white" opacity="0.8"/>
            
            {/* Chair 1 (Left) */}
            <rect x="15" y="55" width="15" height="20" fill="white" opacity="0.7" rx="2"/>
            <rect x="18" y="50" width="9" height="6" fill="white" opacity="0.8" rx="1"/>
            <rect x="18" y="75" width="3" height="8" fill="white" opacity="0.7"/>
            <rect x="27" y="75" width="3" height="8" fill="white" opacity="0.7"/>
            
            {/* Chair 2 (Right) */}
            <rect x="90" y="55" width="15" height="20" fill="white" opacity="0.7" rx="2"/>
            <rect x="93" y="50" width="9" height="6" fill="white" opacity="0.8" rx="1"/>
            <rect x="93" y="75" width="3" height="8" fill="white" opacity="0.7"/>
            <rect x="102" y="75" width="3" height="8" fill="white" opacity="0.7"/>
            
            {/* Food on table */}
            <circle cx="55" cy="65" r="4" fill="#FCD34D" opacity="0.9"/>
            <circle cx="65" cy="65" r="4" fill="#FCD34D" opacity="0.9"/>
          </svg>
        </div>

        <div className="absolute right-10 top-1/2 transform -translate-y-1/2 hidden lg:block animate-bounce-slow opacity-20" style={{animationDelay: '0.5s'}}>
          <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            {/* Dining Table */}
            <ellipse cx="60" cy="70" rx="40" ry="15" fill="white" opacity="0.8"/>
            <rect x="40" y="70" width="40" height="40" fill="white" opacity="0.6" rx="2"/>
            <rect x="42" y="110" width="4" height="8" fill="white" opacity="0.8"/>
            <rect x="74" y="110" width="4" height="8" fill="white" opacity="0.8"/>
            
            {/* Chair 1 (Top) */}
            <rect x="52" y="25" width="16" height="20" fill="white" opacity="0.7" rx="2"/>
            <rect x="55" y="20" width="10" height="6" fill="white" opacity="0.8" rx="1"/>
            <rect x="55" y="45" width="3" height="8" fill="white" opacity="0.7"/>
            <rect x="64" y="45" width="3" height="8" fill="white" opacity="0.7"/>
            
            {/* Chair 2 (Bottom) */}
            <rect x="52" y="95" width="16" height="20" fill="white" opacity="0.7" rx="2"/>
            <rect x="55" y="90" width="10" height="6" fill="white" opacity="0.8" rx="1"/>
            <rect x="55" y="115" width="3" height="8" fill="white" opacity="0.7"/>
            <rect x="64" y="115" width="3" height="8" fill="white" opacity="0.7"/>
            
            {/* Utensils on table */}
            <line x1="52" y1="65" x2="52" y2="75" stroke="#FCD34D" strokeWidth="2" opacity="0.9"/>
            <line x1="68" y1="65" x2="68" y2="75" stroke="#FCD34D" strokeWidth="2" opacity="0.9"/>
          </svg>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/20 shadow-2xl">
            {/* Decorative Table & Chairs at Top */}
            <div className="flex justify-center mb-6">
              <svg width="200" height="100" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg" className="animate-pulse-slow">
                {/* Main Table */}
                <ellipse cx="100" cy="55" rx="70" ry="20" fill="white" opacity="0.9"/>
                <rect x="50" y="55" width="100" height="35" fill="white" opacity="0.7" rx="5"/>
                <rect x="55" y="90" width="8" height="10" fill="white" opacity="0.9"/>
                <rect x="137" y="90" width="8" height="10" fill="white" opacity="0.9"/>
                
                {/* Chair Left */}
                <g opacity="0.85">
                  <rect x="15" y="40" width="25" height="30" fill="white" rx="3"/>
                  <rect x="20" y="33" width="15" height="8" fill="white" rx="2"/>
                  <rect x="20" y="70" width="5" height="12" fill="white"/>
                  <rect x="35" y="70" width="5" height="12" fill="white"/>
                </g>
                
                {/* Chair Right */}
                <g opacity="0.85">
                  <rect x="160" y="40" width="25" height="30" fill="white" rx="3"/>
                  <rect x="165" y="33" width="15" height="8" fill="white" rx="2"/>
                  <rect x="165" y="70" width="5" height="12" fill="white"/>
                  <rect x="175" y="70" width="5" height="12" fill="white"/>
                </g>
                
                {/* Plates and utensils on table */}
                <circle cx="80" cy="50" r="8" fill="#FCD34D" opacity="0.95"/>
                <circle cx="120" cy="50" r="8" fill="#FCD34D" opacity="0.95"/>
                <circle cx="100" cy="48" r="6" fill="#F59E0B" opacity="0.9"/>
                
                {/* Fork */}
                <line x1="70" y1="48" x2="70" y2="60" stroke="white" strokeWidth="2" opacity="0.9"/>
                <line x1="67" y1="48" x2="67" y2="52" stroke="white" strokeWidth="1" opacity="0.9"/>
                <line x1="73" y1="48" x2="73" y2="52" stroke="white" strokeWidth="1" opacity="0.9"/>
                
                {/* Spoon */}
                <line x1="130" y1="48" x2="130" y2="60" stroke="white" strokeWidth="2" opacity="0.9"/>
                <circle cx="130" cy="47" r="3" fill="white" opacity="0.9"/>
              </svg>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Ready to Transform Your Dining?
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-orange-100 max-w-3xl mx-auto">
              Join <span className="font-bold text-white">10,000+</span> happy diners who've discovered the future of restaurant experiences
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                to="/restaurants"
                className="group bg-white text-orange-600 px-10 py-5 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center gap-3"
              >
                <span>Explore Restaurants</span>
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                to="/current-restaurant"
                className="bg-transparent border-3 border-white text-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-white hover:text-orange-600 transition-all duration-300 transform hover:scale-105"
              >
                Try QR Ordering
              </Link>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-white/20">
              <div>
                <div className="text-3xl font-bold mb-1">500+</div>
                <div className="text-orange-100 text-sm">Restaurants</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">50K+</div>
                <div className="text-orange-100 text-sm">Orders</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">4.8★</div>
                <div className="text-orange-100 text-sm">Rating</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">24/7</div>
                <div className="text-orange-100 text-sm">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
