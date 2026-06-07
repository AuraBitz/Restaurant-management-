import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiStar, FiMapPin, FiClock, FiPhone, FiMail } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import LiveFloorCanvas from '../../components/restaurant/LiveFloorCanvas';
import { mapRestaurantRow } from '../../lib/map-restaurant';
import { saveActiveBookingSession } from '../../lib/active-booking-session';
import {
  isTableBookable,
  resolveBookingTableId,
  tableSeatCount,
} from '../../lib/live-tables-utils';
import { useLiveTableMatrixPoll } from '../../hooks/use-live-table-matrix-poll';
import { createPublicBooking } from '../../services/api/booking.api';
import { getPublicRestaurantById } from '../../services/api/restaurant.api';
import type { LiveCanvasTable, LiveFloorState } from '../../types/live-tables';
import type { RestaurantListItem } from '../../types/restaurant';

const RestaurantDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [activeFloorId, setActiveFloorId] = useState('');
  const { matrixData, loading: matrixLoading, refetchMatrix } =
    useLiveTableMatrixPoll(id);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState({
    persons: 2,
    date: '',
    time: '',
    customerName: '',
    customerPhone: '',
  });

  const [restaurantData, setRestaurantData] = useState<RestaurantListItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    getPublicRestaurantById(id)
      .then((row) => {
        if (!row) {
          toast.error('Restaurant not found!');
          navigate('/restaurants');
          return;
        }
        setRestaurantData(mapRestaurantRow(row));
      })
      .catch(() => {
        toast.error('Failed to load restaurant');
        navigate('/restaurants');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!matrixData) return;
    const floors = matrixData.floors ?? [];
    setActiveFloorId((prev) => {
      if (prev && floors.some((f) => f.id === prev)) return prev;
      return matrixData.activeFloorId && floors.some((f) => f.id === matrixData.activeFloorId)
        ? matrixData.activeFloorId
        : floors[0]?.id ?? '';
    });
  }, [matrixData]);

  useEffect(() => {
    if (!matrixData) return;
    const allTables = matrixData.floors.flatMap((f) => f.tables);
    setSelectedTableIds((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.filter((tableId) => {
        const table = allTables.find((t) => t.id === tableId);
        return table && isTableBookable(table);
      });
      return next.length === prev.length ? prev : next;
    });
  }, [matrixData]);

  const floors = useMemo(() => matrixData?.floors ?? [], [matrixData?.floors]);

  const activeFloor = useMemo(
    () => floors.find((f) => f.id === activeFloorId) ?? floors[0] ?? null,
    [floors, activeFloorId]
  );

  const canvasTables = activeFloor?.tables ?? [];

  const getTableById = (tableId: string) =>
    canvasTables.find((t) => t.id === tableId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading restaurant...</p>
      </div>
    );
  }

  if (!restaurantData) return null;

  const restaurant = {
    ...restaurantData,
    isLive: restaurantData.isOpen,
  };

  const handleCanvasTableSelect = (table: LiveCanvasTable) => {
    if (!isTableBookable(table)) return;
    setSelectedTableIds((prev) =>
      prev.includes(table.id)
        ? prev.filter((tid) => tid !== table.id)
        : [...prev, table.id]
    );
  };

  const handleBookNowClick = () => {
    if (selectedTableIds.length > 0) {
      const totalSeats = selectedTableIds.reduce((sum, tableId) => {
        const table = getTableById(tableId);
        return sum + (table ? tableSeatCount(table) : 0);
      }, 0);
      setBookingData({ ...bookingData, persons: totalSeats });
      setShowBookingForm(true);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || selectedTableIds.length === 0) return;

    setBookingSubmitting(true);
    try {
      const bookingIds: number[] = [];
      const tableLabels: string[] = [];
      let sessionCustomerId: number | undefined;
      let sessionTableId: number | undefined;

      for (const canvasId of selectedTableIds) {
        const table = getTableById(canvasId);
        if (!table) continue;

        tableLabels.push(table.label);
        const masterTableId = resolveBookingTableId(table);
        const created = await createPublicBooking({
          restaurant_id: Number(id),
          customer_name: bookingData.customerName.trim(),
          customer_phone: bookingData.customerPhone.trim(),
          booking_date: bookingData.date,
          booking_time: bookingData.time,
          persons_count: bookingData.persons,
          table_id: masterTableId,
          booking_status: 'confirmed',
        });
        bookingIds.push(created.id);
        if (sessionTableId == null && masterTableId) {
          sessionTableId = masterTableId;
        }
        if (sessionCustomerId == null && created.customer_id) {
          sessionCustomerId = created.customer_id;
        }
      }

      if (bookingIds.length === 0) {
        throw new Error('No valid tables to book');
      }

      await refetchMatrix();

      saveActiveBookingSession({
        restaurantId: Number(id),
        bookingIds,
        canvasTableIds: selectedTableIds,
        tableLabels,
        customerName: bookingData.customerName.trim(),
        customerPhone: bookingData.customerPhone.trim(),
        bookingDate: bookingData.date,
        bookingTime: bookingData.time,
        personsCount: bookingData.persons,
        floorId: activeFloor?.id,
        customerId: sessionCustomerId,
        tableId: sessionTableId,
      });

      toast.success('Booking confirmed! Opening your restaurant...', {
        position: 'top-center',
        autoClose: 4000,
      });

      setShowBookingForm(false);
      setSelectedTableIds([]);
      setBookingData({
        persons: 2,
        date: '',
        time: '',
        customerName: '',
        customerPhone: '',
      });
      navigate('/current-restaurant');
    } catch {
      toast.error('Booking failed. Please try again.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const availableTables = canvasTables.filter(
    (t) => t.status === 'free' && !t.isDisabled
  ).length;
  const totalTables = canvasTables.filter((t) => !t.isDisabled).length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex-grow">
        {/* Restaurant Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-6">
                  <div className="text-7xl">{restaurant.image}</div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold">{restaurant.name}</h1>
                    {restaurant.isLive && (
                      <span className="flex items-center gap-2 bg-green-500 px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                        <span className="w-2 h-2 bg-white rounded-full"></span>
                        LIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xl mb-3">
                    {restaurant.city} • <span className="font-semibold">Dine-in</span>
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                      <FiStar className="text-yellow-400 mr-1" />
                      <span className="font-semibold">{restaurant.rating}</span>
                      <span className="ml-1 opacity-90">({restaurant.reviews} reviews)</span>
                    </div>
                    <div className="flex items-center">
                      <FiMapPin className="mr-1" />
                      <span>{restaurant.distance}</span>
                    </div>
                    <div className="flex items-center">
                      <FiClock className="mr-1" />
                      <span>{restaurant.deliveryTime}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{availableTables}/{totalTables}</div>
                <div className="text-sm opacity-90">Tables Available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed">{restaurant.description}</p>
              </div>

              {/* Live Table Matrix — same layout as Admin Panel */}
              <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50 rounded-2xl shadow-2xl p-6 md:p-8 border-2 border-amber-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                      <span className="text-4xl">🍽️</span>
                      <span className="bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                        Live Floor Plan
                      </span>
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm bg-white p-3 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-emerald-500" />
                      <span className="font-semibold text-gray-700">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-500" />
                      <span className="font-semibold text-gray-700">Booked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-amber-500" />
                      <span className="font-semibold text-gray-700">Reserved</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-orange-500 ring-2 ring-orange-300" />
                      <span className="font-semibold text-gray-700">Your pick</span>
                    </div>
                  </div>
                </div>

                {floors.length > 1 ? (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {floors.map((floor: LiveFloorState) => (
                      <button
                        key={floor.id}
                        type="button"
                        onClick={() => {
                          setActiveFloorId(floor.id);
                          setSelectedTableIds([]);
                        }}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          activeFloor?.id === floor.id
                            ? 'bg-orange-600 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        {floor.label}
                        <span className="ml-1.5 opacity-80">({floor.tables.length})</span>
                      </button>
                    ))}
                  </div>
                ) : activeFloor ? (
                  <p className="mb-4 text-sm font-medium text-gray-600">{activeFloor.label}</p>
                ) : null}

                {matrixLoading ? (
                  <div className="flex h-64 items-center justify-center rounded-2xl bg-[#1a120d] text-white/80">
                    Loading live floor layout...
                  </div>
                ) : activeFloor ? (
                  <LiveFloorCanvas
                    floor={activeFloor}
                    selectedTableIds={selectedTableIds}
                    onTableSelect={handleCanvasTableSelect}
                  />
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-white p-10 text-center">
                    <p className="text-lg font-semibold text-gray-800">Floor layout not configured yet</p>
                    <p className="mt-2 text-sm text-gray-600">
                      Restaurant owner can set up tables in Admin Panel → Live Tables
                    </p>
                  </div>
                )}

                <p className="mt-3 text-xs text-gray-500">
                  Admin Panel me jo bhi change hoga — table position, status, merge — yahan automatically live dikhega.
                </p>

                {/* Booking Button */}
                {selectedTableIds.length > 0 && !showBookingForm && (
                  <div className="mt-6 bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-500 rounded-xl p-6 shadow-lg">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-xl mb-2 text-orange-900">
                          {selectedTableIds.length} Table{selectedTableIds.length > 1 ? 's' : ''} Selected
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedTableIds.map((tableId) => {
                            const table = getTableById(tableId);
                            return (
                              <span
                                key={tableId}
                                className="bg-white px-3 py-1 rounded-lg text-sm font-semibold shadow-md border border-orange-300"
                              >
                                {table?.label} ({table ? tableSeatCount(table) : 0} seats)
                              </span>
                            );
                          })}
                        </div>
                        <div className="text-gray-700 mt-2 font-semibold">
                          Total Capacity:{' '}
                          {selectedTableIds.reduce((sum, tId) => {
                            const t = getTableById(tId);
                            return sum + (t ? tableSeatCount(t) : 0);
                          }, 0)}{' '}
                          persons
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSelectedTableIds([])}
                          className="px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition shadow-md border border-gray-300"
                        >
                          Clear All
                        </button>
                        <button
                          onClick={handleBookNowClick}
                          className="px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-orange-800 transition shadow-xl"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h3 className="text-xl font-bold mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FiMapPin className="text-orange-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <div className="font-semibold">Address</div>
                      <div className="text-gray-600 text-sm">{restaurant.address}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FiPhone className="text-orange-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <div className="font-semibold">Phone</div>
                      <a href={`tel:${restaurant.phone}`} className="text-gray-600 text-sm hover:text-orange-600 transition">
                        {restaurant.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FiMail className="text-orange-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <div className="font-semibold">Email</div>
                      <a href={`mailto:${restaurant.email}`} className="text-gray-600 text-sm hover:text-orange-600 transition">
                        {restaurant.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FiClock className="text-orange-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <div className="font-semibold">Opening Hours</div>
                      <div className="text-gray-600 text-sm">{restaurant.openingHours}</div>
                    </div>
                  </div>
                </div>

                {/* Location Map */}
                <div className="mt-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FiMapPin className="text-orange-600" />
                    Location
                  </h4>
                  
                  {/* Embedded Map */}
                  <div className="relative rounded-lg overflow-hidden shadow-lg border-2 border-gray-200 mb-3">
                    <iframe
                      title="Restaurant Location"
                      src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.2412648750455!2d-73.98823492346709!3d40.75889713573419!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25855c6480299%3A0x55194ec5a1ae072e!2sTimes%20Square!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus`}
                      width="100%"
                      height="200"
                      style={{ border: 0 }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="grayscale hover:grayscale-0 transition-all duration-300"
                    />
                    {/* Overlay for better UX */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 to-transparent"></div>
                  </div>

                  {/* Get Directions Button */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-orange-800 transition shadow-lg"
                  >
                    <FiMapPin size={20} />
                    Get Directions
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 animate-slide-down">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Complete Your Booking</h2>
                  <div className="text-orange-100">
                    {selectedTableIds.map((tId) => getTableById(tId)?.label).join(', ')} • Total{' '}
                    {selectedTableIds.reduce((sum, tId) => {
                      const t = getTableById(tId);
                      return sum + (t ? tableSeatCount(t) : 0);
                    }, 0)}{' '}
                    Seats
                  </div>
                </div>
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleBookingSubmit} className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookingData.customerName}
                      onChange={(e) => setBookingData({ ...bookingData, customerName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={bookingData.customerPhone}
                      onChange={(e) => setBookingData({ ...bookingData, customerPhone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                  Booking Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Persons *
                    </label>
                    <select
                      required
                      value={bookingData.persons}
                      onChange={(e) => setBookingData({ ...bookingData, persons: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Person' : 'Persons'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingData.date}
                      onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time *
                    </label>
                    <select
                      required
                      value={bookingData.time}
                      onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select Time</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="12:30 PM">12:30 PM</option>
                      <option value="1:00 PM">1:00 PM</option>
                      <option value="1:30 PM">1:30 PM</option>
                      <option value="2:00 PM">2:00 PM</option>
                      <option value="6:00 PM">6:00 PM</option>
                      <option value="6:30 PM">6:30 PM</option>
                      <option value="7:00 PM">7:00 PM</option>
                      <option value="7:30 PM">7:30 PM</option>
                      <option value="8:00 PM">8:00 PM</option>
                      <option value="8:30 PM">8:30 PM</option>
                      <option value="9:00 PM">9:00 PM</option>
                      <option value="9:30 PM">9:30 PM</option>
                      <option value="10:00 PM">10:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="flex-1 px-6 py-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition shadow-lg disabled:opacity-60"
                >
                  {bookingSubmitting ? 'Saving...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetail;

