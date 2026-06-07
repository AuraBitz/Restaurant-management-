import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import LiveFloorCanvas from '../../components/restaurant/LiveFloorCanvas';
import RestaurantThaliMenuContent from '../../components/restaurant/RestaurantThaliMenuContent';
import { getActiveBookingSession, patchActiveBookingSession } from '../../lib/active-booking-session';
import { mapRestaurantRow } from '../../lib/map-restaurant';
import { buildMenuItemMap, resolveOrderContext } from '../../lib/order-cart-utils';
import { resolveWaiterCallContext } from '../../lib/resolve-waiter-call-context';
import { useLiveTableMatrixPoll } from '../../hooks/use-live-table-matrix-poll';
import { useRestaurantOrder } from '../../hooks/use-restaurant-order';
import { getPublicRestaurantById } from '../../services/api/restaurant.api';
import { createPublicCallWaiter } from '../../services/api/call-waiter.api';
import { getPublicRestaurantMenus } from '../../services/api/menu.api';
import { getPublicBookingById } from '../../services/api/booking.api';
import type { LiveFloorState } from '../../types/live-tables';
import type { RestaurantListItem } from '../../types/restaurant';
import type { RestaurantThaliRow } from '../../types/menu';

const CurrentRestaurant: React.FC = () => {
  const session = useMemo(() => getActiveBookingSession(), []);
  const [restaurant, setRestaurant] = useState<RestaurantListItem | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const { matrixData, loading: matrixLoading } = useLiveTableMatrixPoll(
    session?.restaurantId ? String(session.restaurantId) : undefined
  );

  const [activeFloorId, setActiveFloorId] = useState(session?.floorId ?? '');

  const floors = useMemo(() => matrixData?.floors ?? [], [matrixData?.floors]);
  const activeFloor = useMemo(
    () => floors.find((f) => f.id === activeFloorId) ?? floors[0] ?? null,
    [floors, activeFloorId]
  );

  useEffect(() => {
    if (!matrixData) return;
    const fl = matrixData.floors ?? [];
    setActiveFloorId((prev) => {
      if (prev && fl.some((f) => f.id === prev)) return prev;
      return session?.floorId && fl.some((f) => f.id === session.floorId)
        ? session.floorId
        : fl[0]?.id ?? '';
    });
  }, [matrixData, session?.floorId]);

  useEffect(() => {
    if (!session) {
      setPageLoading(false);
      return;
    }
    getPublicRestaurantById(session.restaurantId)
      .then((row) => {
        if (row) setRestaurant(mapRestaurantRow(row));
      })
      .finally(() => setPageLoading(false));
  }, [session]);
  const [menuThalis, setMenuThalis] = useState<RestaurantThaliRow[]>([]);
  const [resolvedCustomerId, setResolvedCustomerId] = useState<
    number | null | undefined
  >(session?.customerId ?? (session?.bookingIds?.length ? undefined : null));

  useEffect(() => {
    if (!session) return;
    if (session.customerId) {
      setResolvedCustomerId(session.customerId);
      return;
    }
    const bookingId = session.bookingIds?.[0];
    if (!bookingId) {
      setResolvedCustomerId(null);
      return;
    }
    let cancelled = false;
    getPublicBookingById(bookingId)
      .then((booking) => {
        if (cancelled) return;
        const id = booking?.customer_id ?? null;
        setResolvedCustomerId(id);
        if (id) {
          patchActiveBookingSession({ customerId: id });
        }
      })
      .catch(() => {
        if (!cancelled) setResolvedCustomerId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const menuItemMap = useMemo(() => buildMenuItemMap(menuThalis), [menuThalis]);

  const orderContext = useMemo(
    () => (session ? resolveOrderContext(session, matrixData) : null),
    [session, matrixData]
  );

  useEffect(() => {
    if (!session?.restaurantId) return;
    getPublicRestaurantMenus(session.restaurantId)
      .then(setMenuThalis)
      .catch(() => setMenuThalis([]));
  }, [session?.restaurantId]);

  const {
    loading: orderLoading,
    syncing: orderSyncing,
    orderNumber,
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    placeOrder,
    getCartTotal,
    isPlaced,
  } = useRestaurantOrder({
    restaurantId: session?.restaurantId ?? 0,
    tableId: orderContext?.tableId,
    floorId: orderContext?.floorId,
    customerId: resolvedCustomerId ?? null,
    bookingId: session?.bookingIds?.[0] ?? null,
    menuItemMap,
    onCustomerLinked: (id) => {
      setResolvedCustomerId(id);
      patchActiveBookingSession({ customerId: id });
    },
    enabled: Boolean(
      session &&
        orderContext?.tableId &&
        orderContext?.floorId &&
        (resolvedCustomerId !== undefined || session.bookingIds?.length)
    ),
  });

  const [showMenu, setShowMenu] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [showThankYou, setShowThankYou] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showScanPrompt, setShowScanPrompt] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [, setScanning] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  const handlePlaceOrder = () => {
    void placeOrder();
  };

  const handlePaymentRequest = () => {
    const totalAmount = getCartTotal() + Math.round(getCartTotal() * 0.05);
    
    setShowPaymentModal(false);
    
    if (selectedPaymentMethod === 'cash') {
      toast.success('💵 Cash payment request sent to waiter!', {
        position: 'top-center',
        autoClose: 2000,
      });
      
      // Show thank you directly for cash
      setTimeout(() => {
        setShowThankYou(true);
      }, 1000);
    } else {
      toast.success(`💳 Processing ${selectedPaymentMethod.toUpperCase()} payment of ₹${totalAmount}...`, {
        position: 'top-center',
        autoClose: 2000,
      });
      
      // Simulate payment processing
      setTimeout(() => {
        toast.success('✅ Payment successful!', {
          position: 'top-center',
          autoClose: 2000,
        });
        
        // Show thank you modal after payment success
        setTimeout(() => {
          setShowThankYou(true);
        }, 1000);
      }, 2000);
    }
  };

  const handleThankYouClose = () => {
    setShowThankYou(false);
    setShowFeedback(true);
  };

  const handleFeedbackSubmit = () => {
    if (rating === 0) {
      toast.error('Please select a rating!', { autoClose: 2000 });
      return;
    }

    toast.success('🙏 Thank you for your feedback!', {
      position: 'top-center',
      autoClose: 2000,
    });

    setTimeout(() => {
      setShowFeedback(false);
      setShowMenu(false);
      setShowBill(false);
      setRating(0);
      setFeedbackText('');
      setShowScanPrompt(true);
    }, 1000);
  };

  const handleStartScanning = async () => {
    setShowScanner(true);
    setScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      const video = document.getElementById('qr-video') as HTMLVideoElement;
      if (video) {
        video.srcObject = stream;
        video.play();

        toast.success('📸 Camera ready! Point at QR code', {
          autoClose: 3000,
        });

        // Simulate QR scan after 3 seconds (in real app, use QR detection library)
        setTimeout(() => {
          stream.getTracks().forEach(track => track.stop());
          toast.success('✅ QR Code Detected! Redirecting...', {
            autoClose: 2000,
          });
          
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }, 3000);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('❌ Camera access denied. Please enable camera permissions.', {
        autoClose: 3000,
      });
      setScanning(false);
      setShowScanner(false);
    }
  };

  const handleStopScanning = () => {
    const video = document.getElementById('qr-video') as HTMLVideoElement;
    if (video && video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setScanning(false);
    setShowScanner(false);
  };

  const downloadBillPDF = () => {
    const doc = new jsPDF();
    
    // Set font
    doc.setFont('helvetica');
    
    // Header - Restaurant Name
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(restaurant?.name || 'Restaurant', 105, 20, { align: 'center' });
    
    // Restaurant Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(restaurant?.address || '', 105, 28, { align: 'center' });
    doc.text(`Phone: ${restaurant?.phone || ''}`, 105, 34, { align: 'center' });
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.line(15, 40, 195, 40);
    
    // Bill Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 105, 50, { align: 'center' });
    
    // Bill Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const billDate = new Date().toLocaleDateString();
    const billTime = new Date().toLocaleTimeString();
    doc.text(`Date: ${billDate}`, 15, 60);
    doc.text(`Time: ${billTime}`, 15, 66);
    doc.text(`Table: ${session?.tableLabels.join(', ') || 'N/A'}`, 15, 72);
    doc.text(`Bill No: ${Math.floor(Math.random() * 10000)}`, 140, 60);
    
    // Line separator
    doc.line(15, 78, 195, 78);
    
    // Table Header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('#', 15, 88);
    doc.text('Item', 25, 88);
    doc.text('Qty', 110, 88);
    doc.text('Price', 135, 88);
    doc.text('Total', 170, 88, { align: 'right' });
    
    doc.line(15, 91, 195, 91);
    
    // Items
    doc.setFont('helvetica', 'normal');
    let yPos = 100;
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    cartItems.forEach((item, idx) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(10);
      doc.text((idx + 1).toString(), 15, yPos);
      doc.text(item.name, 25, yPos);
      doc.text(item.quantity.toString(), 110, yPos);
      doc.text(`₹${item.price}`, 135, yPos);
      doc.text(`₹${item.price * item.quantity}`, 195, yPos, { align: 'right' });
      
      yPos += 8;
    });
    
    // Line before totals
    yPos += 5;
    doc.line(15, yPos, 195, yPos);
    yPos += 10;
    
    // Subtotal
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', 120, yPos);
    doc.text(`₹${subtotal}`, 195, yPos, { align: 'right' });
    yPos += 8;
    
    // GST
    const gst = Math.round(subtotal * 0.05);
    doc.text('GST (5%):', 120, yPos);
    doc.text(`₹${gst}`, 195, yPos, { align: 'right' });
    yPos += 8;
    
    // Double line before grand total
    doc.setLineWidth(0.8);
    doc.line(110, yPos, 195, yPos);
    yPos += 8;
    
    // Grand Total
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total:', 120, yPos);
    doc.text(`₹${subtotal + gst}`, 195, yPos, { align: 'right' });
    
    // Footer
    yPos += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for dining with us!', 105, yPos, { align: 'center' });
    yPos += 6;
    doc.text('Please visit again', 105, yPos, { align: 'center' });
    
    // Bottom line
    doc.setLineWidth(0.5);
    doc.line(15, 280, 195, 280);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('This is a computer generated bill', 105, 285, { align: 'center' });
    
    // Save PDF
    const fileName = `Bill_${(restaurant?.name || 'Restaurant').replace(/\s+/g, '_')}_${billDate.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
    
    toast.success('📥 Bill downloaded successfully!', { autoClose: 2000 });
  };

  const handleCallWaiter = async () => {
    if (!session) return;

    const ctx = resolveWaiterCallContext(session, matrixData);
    if (!ctx) {
      toast.error('Table info not found. Please book your table again.');
      return;
    }

    setCallingWaiter(true);
    try {
      await createPublicCallWaiter({
        restaurant_id: ctx.restaurant_id,
        floor_id: ctx.floor_id,
        table_id: ctx.table_id,
        is_ring: true,
        calling_text: null,
      });
      toast.success('🔔 Waiter called! They will be with you shortly.', {
        position: 'top-center',
        autoClose: 3000,
      });
    } catch {
      toast.error('Failed to call waiter. Please try again.');
    } finally {
      setTimeout(() => {
        setCallingWaiter(false);
      }, 5000);
    }
  };

  const sendVoiceMessageToWaiter = async (text: string) => {
    if (!session) return;

    const ctx = resolveWaiterCallContext(session, matrixData);
    if (!ctx) {
      toast.error('Table info not found. Please book your table again.');
      return;
    }

    const message = text.trim();
    if (!message) return;

    try {
      await createPublicCallWaiter({
        restaurant_id: ctx.restaurant_id,
        floor_id: ctx.floor_id,
        table_id: ctx.table_id,
        is_ring: false,
        calling_text: message,
      });
      toast.success(`Message sent: "${message}"`, {
        position: 'top-center',
        autoClose: 3000,
      });
    } catch {
      toast.error('Failed to send message to waiter.');
    }
  };

  const toggleVoiceAssistant = () => {
    if (isListening) {
      // Stop listening
      if (recognition) {
        recognition.stop();
        setRecognition(null);
      }
      setIsListening(false);
      setVoiceText('');
      toast.info('🎤 Voice Assistant stopped', { autoClose: 2000 });
    } else {
      // Show widget immediately
      setIsListening(true);
      toast.info('🤖 Initializing Voice Assistant...', { autoClose: 2000 });
      // Start listening
      setTimeout(() => {
        startVoiceRecognition();
      }, 100);
    }
  };

  const startVoiceRecognition = () => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('Voice recognition is not supported in your browser!', {
        autoClose: 3000,
      });
      setIsListening(false);
      return;
    }

    const newRecognition = new SpeechRecognition();
    newRecognition.continuous = true;
    newRecognition.interimResults = true;
    newRecognition.lang = 'en-US';

    newRecognition.onstart = () => {
      toast.success('🎤 Voice Assistant activated! Listening...', {
        position: 'top-center',
        autoClose: 2000,
      });
    };

    newRecognition.onresult = (event: any) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        }
      }

      if (finalTranscript) {
        setVoiceText(finalTranscript);
        toast.info(`You said: "${finalTranscript.trim()}"`, {
          autoClose: 3000,
        });
        
        // Process voice commands
        processVoiceCommand(finalTranscript.toLowerCase().trim());
      }
    };

    newRecognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        toast.error('🎤 Microphone permission denied! Please allow microphone access.', {
          autoClose: 4000,
        });
      } else {
        toast.error(`Voice recognition error: ${event.error}`, {
          autoClose: 3000,
        });
      }
    };

    newRecognition.onend = () => {
      if (isListening) {
        try {
          newRecognition.start(); // Restart if still in listening mode
        } catch (error) {
          console.error('Error restarting recognition:', error);
          setIsListening(false);
        }
      }
    };

    try {
      newRecognition.start();
      setRecognition(newRecognition);
    } catch (error) {
      console.error('Error starting recognition:', error);
      setIsListening(false);
      toast.error('Failed to start voice recognition. Please try again.', {
        autoClose: 3000,
      });
    }
  };

  const processVoiceCommand = (command: string) => {
    const normalized = command.toLowerCase().trim();

    if (normalized.includes('menu') || normalized.includes('open menu')) {
      setShowMenu(true);
      toast.success('🍽️ Opening menu for you!', { autoClose: 2000 });
      return;
    }

    if (normalized.includes('call waiter') || normalized.includes('waiter')) {
      void handleCallWaiter();
      return;
    }

    if (normalized.includes('help')) {
      toast.info('You can say: "Open Menu", "Call Waiter", or any request like "Bring water"', {
        autoClose: 4000,
      });
      return;
    }

    void sendVoiceMessageToWaiter(command);
  };

  // Auto-close welcome modal after 4 seconds
  useEffect(() => {
    if (!showWelcome) return;
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [showWelcome]);

  // Disable body scroll when modals are open
  useEffect(() => {
    if (showMenu || showPaymentModal || showThankYou || showFeedback || showScanPrompt || showWelcome || showScanner) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMenu, showPaymentModal, showThankYou, showFeedback, showScanPrompt, showWelcome, showScanner]);

  // Reset bill view when menu closes
  useEffect(() => {
    if (!showMenu) {
      setShowBill(false);
    }
  }, [showMenu]);

  // Cleanup voice recognition on unmount
  useEffect(() => {
    return () => {
      if (recognition) {
        recognition.stop();
      }
      if (isListening) {
        setIsListening(false);
      }
    };
  }, [recognition, isListening]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center px-4 py-16">
          <div className="max-w-lg rounded-2xl border border-amber-200 bg-white p-10 text-center shadow-xl">
            <div className="text-6xl mb-4">🍽️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No active booking</h1>
            <p className="text-gray-600 mb-6">
              Pehle kisi restaurant me table book karein — phir yahan aapka booked restaurant khulega.
            </p>
            <Link
              to="/restaurants"
              className="inline-flex rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700 transition"
            >
              Find Restaurant
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (pageLoading || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading your restaurant...</p>
      </div>
    );
  }

  const bookedTableLabels = session.tableLabels.join(', ');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Restaurant Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white py-4 md:py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden md:flex w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-lg border-4 border-white/40 items-center justify-center text-5xl shadow-lg">
                {restaurant.image}
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{restaurant.name}</h1>
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 animate-pulse">
                    <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                    <span>LIVE</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <span className="text-lg">🪑</span>
                    <span className="text-sm font-semibold">Table {bookedTableLabels}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <span className="text-sm font-semibold">
                      {session.bookingDate} • {session.bookingTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <span className="text-sm font-semibold">{session.personsCount} guests</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
              <div className="text-left md:text-right hidden md:block">
                <p className="text-orange-100 text-sm">📍 {restaurant.address}</p>
                <p className="text-orange-100 text-sm">📞 {restaurant.phone}</p>
              </div>
              
              {/* Action Buttons Container */}
              <div className="flex items-center gap-2 md:gap-4">
                <button
                  onClick={handleCallWaiter}
                  disabled={callingWaiter}
                  className={`${
                    callingWaiter 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white text-orange-600 hover:bg-orange-50'
                  } px-3 md:px-4 py-2 md:py-3 rounded-lg font-bold transition shadow-lg flex items-center gap-2 group flex-1 md:flex-initial justify-center`}
                >
                  <span className={`text-xl md:text-2xl ${callingWaiter ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'}`}>
                    🔔
                  </span>
                  <span className="text-sm md:text-base">
                    {callingWaiter ? 'Calling...' : 'Call'}
                  </span>
                </button>
                
                <button
                  onClick={() => setShowMenu(true)}
                  className="bg-white text-orange-600 px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold hover:bg-orange-50 transition shadow-lg flex items-center gap-2 group flex-1 md:flex-initial justify-center"
                >
                  <span className="text-xl md:text-2xl group-hover:scale-110 transition-transform">🍽️</span>
                  <span className="text-sm md:text-base">Menu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50 rounded-2xl shadow-2xl p-6 md:p-8 border-2 border-amber-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <span className="text-4xl">🍽️</span>
                <span className="bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                  Live Floor Plan
                </span>
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Your tables: <span className="font-semibold text-orange-700">{bookedTableLabels}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm bg-white p-3 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-600 ring-2 ring-blue-300" />
                <span className="font-semibold text-gray-700">You are here</span>
              </div>
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
            </div>
          </div>

          {floors.length > 1 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {floors.map((floor: LiveFloorState) => (
                <button
                  key={floor.id}
                  type="button"
                  onClick={() => setActiveFloorId(floor.id)}
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
            <div className="flex h-64 items-center justify-center rounded-2xl border-4 border-[#3E2723] bg-amber-50 text-gray-600">
              Loading live floor layout...
            </div>
          ) : activeFloor ? (
            <LiveFloorCanvas
              floor={activeFloor}
              selectedTableIds={[]}
              hereTableIds={session.canvasTableIds}
              onTableSelect={() => undefined}
              readOnly
            />
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-white p-10 text-center">
              <p className="text-lg font-semibold text-gray-800">Floor layout not available</p>
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* AI Voice Assistant - Fixed Left Side (Siri Style) */}
      <div 
        className="fixed left-0 md:left-4 top-1/2 transform -translate-y-1/2 z-[9999]"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="relative group">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleVoiceAssistant();
            }}
            className={`${
              isListening 
                ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-[0_0_30px_rgba(239,68,68,0.6)]' 
                : 'bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 hover:from-purple-600 hover:via-purple-700 hover:to-blue-700 shadow-[0_0_30px_rgba(168,85,247,0.4)]'
            } w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl flex items-center justify-center relative transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto`}
            title={isListening ? 'Stop Voice Assistant' : 'Start Voice Assistant'}
            type="button"
            style={{ zIndex: 9999, position: 'relative' }}
          >
            <span className="text-2xl md:text-3xl relative z-10">
              {isListening ? '🎤' : '🤖'}
            </span>
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60"></span>
                <span className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-600 rounded-full animate-pulse"></span>
                </span>
              </>
            )}
            {!isListening && (
              <>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 opacity-0 group-hover:opacity-30 transition-opacity"></div>
                <div className="absolute inset-0 rounded-full border-2 border-white opacity-20"></div>
              </>
            )}
          </button>
          
          {/* Enhanced Tooltip */}
          {!isListening && (
            <div className="hidden md:block absolute left-full ml-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-2 rounded-xl text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <span className="font-semibold">Click to activate AI Assistant</span>
              </div>
              <div className="absolute right-full top-1/2 transform -translate-y-1/2">
                <div className="border-8 border-transparent border-r-gray-900"></div>
              </div>
            </div>
          )}
          
          {/* Pulse ring effect when not listening */}
          {!isListening && (
            <div className="absolute inset-0 rounded-full border-2 border-purple-500 opacity-30 animate-ping"></div>
          )}
        </div>
      </div>

      {/* Voice Assistant Listening Indicator (Siri Style) */}
      {isListening && (
        <div className="fixed left-2 md:left-20 bottom-4 md:bottom-auto md:top-1/2 md:transform md:-translate-y-1/2 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-4 md:p-5 w-80 md:max-w-md z-40 border-2 border-red-500 animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl">🎤</span>
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full animate-ping"></span>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-gray-800 text-lg">AI Assistant</h4>
                <button
                  onClick={toggleVoiceAssistant}
                  className="text-gray-400 hover:text-red-600 transition p-1 rounded-full hover:bg-red-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <p className="text-sm text-red-600 font-semibold animate-pulse">Listening...</p>
              </div>

              {voiceText ? (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-3 mb-3 border border-red-200">
                  <p className="text-sm text-gray-700 font-medium">"{voiceText}"</p>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-xl p-3 mb-3">
                  <p className="text-sm text-gray-500 italic">Say something...</p>
                </div>
              )}

              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-200">
                <p className="font-semibold text-xs text-purple-800 mb-2 flex items-center gap-1">
                  <span>💡</span>
                  <span>Voice Commands:</span>
                </p>
                <div className="grid grid-cols-1 gap-1 text-xs text-purple-700">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-500">•</span>
                    <span>"Open Menu"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-500">•</span>
                    <span>"Call Waiter"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-500">•</span>
                    <span>"Help"</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Modal */}
      {showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full h-[90vh] flex flex-col animate-slide-down">
            {/* Menu Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    {showBill ? '🧾 Your Bill' : '🍽️ Restaurant Menu'}
                  </h2>
                  <p className="text-orange-100">
                    {restaurant.name}
                    {orderNumber != null ? ` · Order #${orderNumber}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {!showBill && isPlaced && cartItems.length > 0 && (
                    <button
                      onClick={() => setShowBill(true)}
                      className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold hover:bg-orange-50 transition shadow-lg flex items-center gap-2"
                    >
                      <span className="text-xl">🧾</span>
                      <span>View Bill</span>
                      <span className="bg-orange-600 text-white px-2 py-0.5 rounded-full text-xs">
                        {cartItems.length}
                      </span>
                    </button>
                  )}
                  {showBill && (
                    <button
                      onClick={() => setShowBill(false)}
                      className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold hover:bg-orange-50 transition shadow-lg"
                    >
                      Back to Menu
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowBill(false);
                    }}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            {!showBill ? (
              <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 flex-1 overflow-hidden">
                <div className="lg:col-span-2 border-r border-gray-200 flex flex-col overflow-hidden">
                  <RestaurantThaliMenuContent
                    restaurantId={session.restaurantId}
                    orderBusy={orderSyncing}
                    orderLocked={isPlaced}
                    onAddToCart={(item) => {
                      addToCart(item);
                    }}
                  />
                </div>

              {/* Right Side - Cart Section (1/3 width) */}
              <div className="lg:col-span-1 bg-orange-50 flex flex-col overflow-hidden">
                <div className="p-6 flex flex-col h-full">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2 flex-shrink-0">
                    🛒 Your Order
                    {orderNumber != null && (
                      <span className="text-sm font-semibold text-orange-700">#{orderNumber}</span>
                    )}
                    {cartItems.length > 0 && (
                      <span className="bg-orange-600 text-white text-sm px-2 py-1 rounded-full">
                        {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    )}
                    {orderSyncing && (
                      <span className="text-xs font-normal text-orange-700">Submitting…</span>
                    )}
                  </h3>

                  {orderLoading ? (
                    <div className="text-center py-12 text-gray-500">Loading your order…</div>
                  ) : cartItems.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🍽️</div>
                      <p className="text-gray-600 font-semibold mb-2">Your cart is empty</p>
                      <p className="text-gray-500 text-sm">Select dishes from menu, then tap Submit Order</p>
                    </div>
                  ) : (
                    <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
                      {/* Cart Items */}
                      <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {cartItems.map((item) => (
                          <div key={item.id} className="bg-white rounded-lg p-3 shadow border border-orange-200">
                            <div className="flex items-start gap-3">
                              {item.image && (
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-16 h-16 rounded object-cover"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${item.veg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                      <h4 className="font-semibold text-sm text-gray-800">{item.name}</h4>
                                    </div>
                                    <p className="text-orange-600 font-bold text-sm mt-1">₹{item.price}</p>
                                  </div>
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    disabled={isPlaced}
                                    className="text-red-500 hover:text-red-700 transition disabled:opacity-40"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                                
                                {/* Quantity Controls */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 bg-orange-100 rounded-full px-2 py-1">
                                    <button
                                      onClick={() => updateQuantity(item.id, -1)}
                                      disabled={isPlaced}
                                      className="w-6 h-6 rounded-full bg-white hover:bg-orange-200 transition flex items-center justify-center font-bold disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      -
                                    </button>
                                    <span className="font-bold text-sm px-2">{item.quantity}</span>
                                    <button
                                      onClick={() => updateQuantity(item.id, 1)}
                                      disabled={orderSyncing}
                                      className="w-6 h-6 rounded-full bg-white hover:bg-orange-200 transition flex items-center justify-center font-bold disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <span className="font-bold text-gray-800">₹{item.price * item.quantity}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bill Summary */}
                      <div className="bg-white rounded-lg p-4 shadow border border-orange-200 flex-shrink-0">
                        <h4 className="font-bold text-gray-800 mb-3">Bill Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-gray-600">
                            <span>Item Total</span>
                            <span>₹{getCartTotal()}</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>GST (5%)</span>
                            <span>₹{Math.round(getCartTotal() * 0.05)}</span>
                          </div>
                          <div className="border-t border-gray-300 pt-2 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-gray-800">Total</span>
                              <span className="font-bold text-orange-600 text-lg">
                                ₹{getCartTotal() + Math.round(getCartTotal() * 0.05)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Submit Order Button */}
                      <button 
                        onClick={handlePlaceOrder}
                        disabled={orderSyncing || isPlaced}
                        className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition shadow-lg flex-shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {orderSyncing
                          ? 'Submitting…'
                          : isPlaced
                          ? 'Order sent to kitchen'
                          : `Submit Order • ₹${getCartTotal() + Math.round(getCartTotal() * 0.05)}`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
              </>
            ) : (
              /* Bill View */
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto">
                  {/* Bill Header */}
                  <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border-2 border-orange-200 relative">
                    {/* Download Button */}
                    <button
                      onClick={downloadBillPDF}
                      className="absolute top-6 right-6 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition shadow-md hover:shadow-lg"
                      title="Download Bill as PDF"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download</span>
                    </button>

                    <div className="text-center mb-6">
                      <h2 className="text-4xl font-bold text-gray-800 mb-2">{restaurant.name}</h2>
                      <p className="text-gray-600">{restaurant.address}</p>
                      <p className="text-gray-600">{restaurant.phone}</p>
                      <div className="border-t border-gray-300 mt-4 pt-4">
                        <p className="text-sm text-gray-500">Bill Date: {new Date().toLocaleDateString()} | Time: {new Date().toLocaleTimeString()}</p>
                        <p className="text-sm text-gray-500">Table: {bookedTableLabels}</p>
                      </div>
                    </div>

                    {/* Bill Items */}
                    <div className="space-y-4 mb-6">
                      <div className="border-b-2 border-gray-800 pb-2">
                        <div className="grid grid-cols-12 gap-2 font-bold text-gray-800">
                          <div className="col-span-1">#</div>
                          <div className="col-span-5">Item</div>
                          <div className="col-span-2 text-center">Qty</div>
                          <div className="col-span-2 text-right">Price</div>
                          <div className="col-span-2 text-right">Total</div>
                        </div>
                      </div>

                      {cartItems.map((item, idx) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 py-2 border-b border-gray-200">
                          <div className="col-span-1 text-gray-600">{idx + 1}</div>
                          <div className="col-span-5">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${item.veg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              <span className="font-medium text-gray-800">{item.name}</span>
                            </div>
                          </div>
                          <div className="col-span-2 text-center text-gray-600">{item.quantity}</div>
                          <div className="col-span-2 text-right text-gray-600">₹{item.price}</div>
                          <div className="col-span-2 text-right font-semibold text-gray-800">₹{item.price * item.quantity}</div>
                        </div>
                      ))}
                    </div>

                    {/* Bill Summary */}
                    <div className="border-t-2 border-gray-800 pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-gray-700">
                          <span>Subtotal:</span>
                          <span className="font-semibold">₹{getCartTotal()}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>GST (5%):</span>
                          <span className="font-semibold">₹{Math.round(getCartTotal() * 0.05)}</span>
                        </div>
                        <div className="border-t-2 border-orange-300 my-3"></div>
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold text-gray-900">Grand Total:</span>
                          <span className="text-3xl font-bold text-orange-600">
                            ₹{getCartTotal() + Math.round(getCartTotal() * 0.05)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bill Footer */}
                    <div className="border-t border-gray-300 mt-6 pt-6 text-center">
                      <p className="text-gray-600 text-sm mb-2">Thank you for dining with us! 🍽️</p>
                      <p className="text-gray-500 text-xs">Please visit again</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowBill(false)}
                      className="flex-1 bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition shadow-lg"
                    >
                      Continue Ordering
                    </button>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg"
                    >
                      Request Payment
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Welcome Modal - QR Scan Success */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[10001] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full animate-slide-down overflow-hidden">
            {/* Success Animation Header */}
            <div className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white p-8 text-center relative overflow-hidden">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="welcome-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                      <circle cx="20" cy="20" r="2" fill="white" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#welcome-pattern)" />
                </svg>
              </div>

              {/* Success Icon */}
              <div className="relative mb-4">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-lg animate-bounce-slow">
                  <svg className="w-12 h-12 text-green-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-2">QR Code Scanned!</h2>
              <p className="text-green-100 text-lg">Connection Successful</p>
            </div>

            {/* Welcome Content */}
            <div className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Welcome to {restaurant.name}! 🎉
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  You've successfully scanned the QR code and connected to your dining table.
                </p>
              </div>

              {/* Table Info Card */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-600 text-white w-12 h-12 rounded-xl flex items-center justify-center text-2xl">
                      🪑
                    </div>
                    <div>
                      <div className="text-sm text-orange-700 font-semibold">Your Table</div>
                      <div className="text-2xl font-bold text-orange-900">
                        Table {bookedTableLabels}
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                    <span>ACTIVE</span>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-white/60 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">📱</div>
                    <div className="text-xs text-gray-600">Scan Complete</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">🍽️</div>
                    <div className="text-xs text-gray-600">Order Ready</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowWelcome(false);
                    setShowMenu(true);
                  }}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🍽️</span>
                  <span>Open Menu & Order</span>
                </button>
                <button
                  onClick={() => setShowWelcome(false)}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Continue to View Tables
                </button>
              </div>

              {/* Auto-close indicator */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  This message will close automatically in 4 seconds
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thank You Modal */}
      {showThankYou && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-down text-center p-8">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Thank You!</h2>
            <p className="text-lg text-gray-600 mb-6">
              Your payment has been received successfully.
            </p>
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-800 font-semibold mb-2">✅ Order Complete</p>
              <p className="text-sm text-green-700">
                We hope you enjoyed your dining experience at {restaurant.name}!
              </p>
            </div>
            <button
              onClick={handleThankYouClose}
              className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition shadow-lg"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-slide-down">
            {/* Feedback Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white p-6 rounded-t-2xl">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <span>⭐</span>
                <span>Rate Your Experience</span>
              </h3>
              <p className="text-orange-100 mt-2">Help us serve you better!</p>
            </div>

            {/* Feedback Content */}
            <div className="p-6 space-y-6">
              {/* Star Rating */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                  How was your experience?
                </label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-125 active:scale-110"
                    >
                      <span className={`text-5xl ${star <= rating ? 'filter-none' : 'grayscale opacity-40'}`}>
                        {star <= rating ? '⭐' : '☆'}
                      </span>
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center mt-3 text-orange-600 font-semibold">
                    {rating === 5 ? '🎉 Excellent!' : rating === 4 ? '😊 Great!' : rating === 3 ? '😐 Good' : rating === 2 ? '😕 Okay' : '😞 Poor'}
                  </p>
                )}
              </div>

              {/* Feedback Text */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Share your feedback (Optional)
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
                  placeholder="Tell us about your experience..."
                />
              </div>

              {/* Quick Feedback Options */}
              <div>
                <p className="block text-sm font-semibold text-gray-700 mb-2">Quick feedback:</p>
                <div className="flex flex-wrap gap-2">
                  {['Great food', 'Excellent service', 'Clean ambiance', 'Quick delivery', 'Value for money'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setFeedbackText(prev => prev ? `${prev}, ${tag}` : tag)}
                      className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-sm font-medium hover:bg-orange-100 transition border border-orange-200"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => {
                  setShowFeedback(false);
                  setShowMenu(false);
                  setShowBill(false);
                  setShowScanPrompt(true);
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Skip
              </button>
              <button
                onClick={handleFeedbackSubmit}
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition shadow-lg"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Prompt Modal */}
      {showScanPrompt && !showScanner && (
        <div className="fixed inset-0 bg-gradient-to-br from-orange-600 to-orange-800 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-slide-down text-center p-10">
            <div className="text-8xl mb-6 animate-pulse">🎉</div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Session Complete!</h2>
            <p className="text-xl text-gray-600 mb-6">
              Thank you for dining with us at <span className="font-bold text-orange-600">{restaurant.name}</span>
            </p>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6 mb-6">
              <p className="text-gray-800 font-semibold mb-4 text-lg">Ready for your next dining experience?</p>
              <div className="space-y-3 text-left text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📱</span>
                  <div>
                    <div className="font-semibold">Scan QR Code</div>
                    <div className="text-sm text-gray-600">Use your camera to scan table QR code</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🏠</span>
                  <div>
                    <div className="font-semibold">Browse Restaurants</div>
                    <div className="text-sm text-gray-600">Explore and book tables online</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleStartScanning}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Scan QR Code Now</span>
              </button>
              
              <button
                onClick={() => {
                  setShowScanPrompt(false);
                  window.location.href = '/';
                }}
                className="w-full bg-white border-2 border-orange-600 text-orange-600 py-4 rounded-xl font-bold text-lg hover:bg-orange-50 transition"
              >
                Go to Home Page
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              💡 Tip: Make sure to allow camera access for QR scanning
            </p>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black z-[10001] flex flex-col">
          {/* Scanner Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold">Scan QR Code</h3>
                <p className="text-sm text-orange-100">Point camera at table QR code</p>
              </div>
            </div>
            <button
              onClick={handleStopScanning}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Camera View */}
          <div className="flex-1 relative bg-black flex items-center justify-center">
            <video
              id="qr-video"
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />

            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Scanner Frame */}
              <div className="relative w-72 h-72">
                {/* Corner Borders */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-orange-500 rounded-tl-2xl"></div>
                <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-orange-500 rounded-tr-2xl"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-orange-500 rounded-bl-2xl"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-orange-500 rounded-br-2xl"></div>
                
                {/* Scanning Line */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-pulse"></div>
                </div>

                {/* Center Dot */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 bg-orange-500 rounded-full animate-ping"></div>
                  <div className="absolute top-0 left-0 w-4 h-4 bg-orange-500 rounded-full"></div>
                </div>
              </div>

              {/* Status Text */}
              <div className="absolute bottom-32 left-0 right-0">
                <div className="bg-black/60 backdrop-blur-sm text-white px-6 py-4 rounded-xl mx-auto max-w-md text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                    <p className="text-lg font-bold">Scanning...</p>
                  </div>
                  <p className="text-sm text-gray-300">
                    Position QR code within the frame
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scanner Footer */}
          <div className="bg-gradient-to-r from-gray-900 to-black text-white p-6">
            <div className="max-w-md mx-auto">
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <div className="text-2xl mb-1">📱</div>
                  <div className="text-xs text-gray-400">Hold Steady</div>
                </div>
                <div>
                  <div className="text-2xl mb-1">💡</div>
                  <div className="text-xs text-gray-400">Good Lighting</div>
                </div>
                <div>
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-xs text-gray-400">Center QR Code</div>
                </div>
              </div>
              <button
                onClick={handleStopScanning}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition"
              >
                Cancel Scanning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-down">
            {/* Payment Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-t-2xl">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <span>💳</span>
                <span>Select Payment Method</span>
              </h3>
              <p className="text-green-100 mt-2">
                Total Amount: ₹{getCartTotal() + Math.round(getCartTotal() * 0.05)}
              </p>
            </div>

            {/* Payment Methods */}
            <div className="p-6 space-y-3">
              {/* Cash Payment */}
              <div
                onClick={() => setSelectedPaymentMethod('cash')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                  selectedPaymentMethod === 'cash'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentMethod === 'cash' ? 'border-green-500' : 'border-gray-300'
                  }`}>
                    {selectedPaymentMethod === 'cash' && (
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💵</span>
                      <h4 className="font-bold text-gray-800">Cash Payment</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Pay with cash to waiter</p>
                  </div>
                </div>
              </div>

              {/* Card Payment */}
              <div
                onClick={() => setSelectedPaymentMethod('card')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                  selectedPaymentMethod === 'card'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentMethod === 'card' ? 'border-green-500' : 'border-gray-300'
                  }`}>
                    {selectedPaymentMethod === 'card' && (
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💳</span>
                      <h4 className="font-bold text-gray-800">Credit/Debit Card</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Pay securely with your card</p>
                  </div>
                </div>
              </div>

              {/* UPI Payment */}
              <div
                onClick={() => setSelectedPaymentMethod('upi')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                  selectedPaymentMethod === 'upi'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentMethod === 'upi' ? 'border-green-500' : 'border-gray-300'
                  }`}>
                    {selectedPaymentMethod === 'upi' && (
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📱</span>
                      <h4 className="font-bold text-gray-800">UPI Payment</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Pay using UPI (GPay, PhonePe, Paytm)</p>
                  </div>
                </div>
              </div>

              {/* Wallet Payment */}
              <div
                onClick={() => setSelectedPaymentMethod('wallet')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                  selectedPaymentMethod === 'wallet'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentMethod === 'wallet' ? 'border-green-500' : 'border-gray-300'
                  }`}>
                    {selectedPaymentMethod === 'wallet' && (
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">👛</span>
                      <h4 className="font-bold text-gray-800">Digital Wallet</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Pay using Paytm, Amazon Pay, etc.</p>
                  </div>
                </div>
              </div>

              {/* Information Banner */}
              {selectedPaymentMethod === 'cash' ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-blue-800 flex items-center gap-2">
                    <span>ℹ️</span>
                    <span>Waiter will be notified for cash payment collection</span>
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-green-800 flex items-center gap-2">
                    <span>🔒</span>
                    <span>Your payment will be processed securely</span>
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentRequest}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-lg"
              >
                {selectedPaymentMethod === 'cash' ? 'Request Cash Payment' : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentRestaurant;

