import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { toast } from 'react-toastify';
import { patchActiveBookingSession } from '../lib/active-booking-session';
import {
  cartItemsFromOrderItemIds,
  orderItemIdsFromCart,
  type MenuItemMeta,
  type OrderCartItem,
} from '../lib/order-cart-utils';
import {
  ensurePublicActiveOrder,
  getPublicActiveOrder,
  updatePublicOrder,
  type RestaurantOrderMasterRow,
  type RestaurantOrderStatus,
} from '../services/api/order.api';

interface UseRestaurantOrderParams {
  restaurantId: number;
  tableId?: number;
  floorId?: number;
  customerId?: number | null;
  bookingId?: number | null;
  menuItemMap: Map<number, MenuItemMeta>;
  enabled: boolean;
  onCustomerLinked?: (customerId: number) => void;
}

interface UseRestaurantOrderResult {
  loading: boolean;
  syncing: boolean;
  orderId: number | null;
  orderNumber: number | null;
  orderStatus: RestaurantOrderStatus;
  cartItems: OrderCartItem[];
  addToCart: (item: {
    id: number;
    name: string;
    price: number;
    veg: boolean;
    image?: string;
  }) => void;
  updateQuantity: (itemId: number, change: number) => void;
  removeFromCart: (itemId: number) => void;
  placeOrder: () => void;
  getCartTotal: () => number;
  isPlaced: boolean;
}

function applySubmittedOrder(
  row: RestaurantOrderMasterRow,
  menuItemMap: Map<number, MenuItemMeta>,
  setters: {
    setOrderId: (id: number) => void;
    setOrderNumber: (n: number) => void;
    setOrderStatus: (s: RestaurantOrderStatus) => void;
    setCartItems: (items: OrderCartItem[]) => void;
  },
  orderIdRef: MutableRefObject<number | null>,
  cartItemsRef: MutableRefObject<OrderCartItem[]>
) {
  const nextCart = cartItemsFromOrderItemIds(row.order_items_id ?? [], menuItemMap);
  orderIdRef.current = row.id;
  cartItemsRef.current = nextCart;
  setters.setOrderId(row.id);
  setters.setOrderNumber(row.order_number);
  setters.setOrderStatus((row.status as RestaurantOrderStatus) || 'pending');
  setters.setCartItems(nextCart);
  patchActiveBookingSession({ activeOrderId: row.id });
}

export function useRestaurantOrder({
  restaurantId,
  tableId,
  floorId,
  customerId,
  bookingId,
  menuItemMap,
  enabled,
  onCustomerLinked,
}: UseRestaurantOrderParams): UseRestaurantOrderResult {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState<RestaurantOrderStatus>('pending');
  const [cartItems, setCartItems] = useState<OrderCartItem[]>([]);

  const orderIdRef = useRef<number | null>(null);
  const cartItemsRef = useRef<OrderCartItem[]>([]);
  const menuItemMapRef = useRef(menuItemMap);
  const orderStatusRef = useRef<RestaurantOrderStatus>('pending');
  const initKeyRef = useRef<string | null>(null);

  const setters = {
    setOrderId,
    setOrderNumber,
    setOrderStatus,
    setCartItems,
  };

  useEffect(() => {
    orderStatusRef.current = orderStatus;
  }, [orderStatus]);

  useEffect(() => {
    menuItemMapRef.current = menuItemMap;
    if (orderStatusRef.current !== 'on_dine' && orderStatusRef.current !== 'completed') {
      return;
    }
    const refreshed = cartItemsFromOrderItemIds(
      orderItemIdsFromCart(cartItemsRef.current),
      menuItemMap
    );
    cartItemsRef.current = refreshed;
    setCartItems(refreshed);
  }, [menuItemMap]);

  const ensureOrder = useCallback(async (): Promise<number> => {
    if (!tableId || !floorId) {
      throw new Error('Table session is not ready');
    }

    const row = await ensurePublicActiveOrder({
      restaurant_id: restaurantId,
      table_id: tableId,
      floor_id: floorId,
      customer_id: customerId ?? null,
      booking_id: bookingId ?? null,
      order_items_id: [],
      status: 'pending',
    });

    if (row.customer_id) {
      onCustomerLinked?.(row.customer_id);
    }

    orderIdRef.current = row.id;
    setOrderId(row.id);
    setOrderNumber(row.order_number);
    patchActiveBookingSession({ activeOrderId: row.id });
    return row.id;
  }, [restaurantId, tableId, floorId, customerId, bookingId, onCustomerLinked]);

  useEffect(() => {
    if (!enabled || !tableId || !floorId) {
      setLoading(false);
      return;
    }

    const initKey = `${restaurantId}:${tableId}:${bookingId ?? customerId ?? 'guest'}`;
    if (initKeyRef.current === initKey) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    initKeyRef.current = initKey;
    orderIdRef.current = null;
    cartItemsRef.current = [];
    setOrderId(null);
    setOrderNumber(null);
    setOrderStatus('pending');
    setCartItems([]);

    (async () => {
      setLoading(true);
      try {
        const row = await getPublicActiveOrder({
          restaurant_id: restaurantId,
          table_id: tableId,
          customer_id: customerId ?? null,
        });
        if (cancelled) return;

        if (row?.customer_id) {
          onCustomerLinked?.(row.customer_id);
        }

        if (row && (row.status === 'on_dine' || row.status === 'completed')) {
          applySubmittedOrder(
            row,
            menuItemMapRef.current,
            setters,
            orderIdRef,
            cartItemsRef
          );
        } else if (row) {
          orderIdRef.current = row.id;
          setOrderId(row.id);
          setOrderNumber(row.order_number);
          patchActiveBookingSession({ activeOrderId: row.id });
        }
      } catch {
        if (!cancelled) {
          toast.error('Could not load your table order.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    restaurantId,
    tableId,
    floorId,
    customerId,
    bookingId,
    onCustomerLinked,
  ]);

  const addToCart = useCallback(
    (item: {
      id: number;
      name: string;
      price: number;
      veg: boolean;
      image?: string;
    }) => {
      if (
        orderStatusRef.current === 'on_dine' ||
        orderStatusRef.current === 'completed'
      ) {
        toast.info('Order already submitted. Contact waiter to add more items.', {
          autoClose: 2500,
        });
        return;
      }

      const optimistic = [...cartItemsRef.current];
      const existing = optimistic.find((entry) => entry.id === item.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        optimistic.push({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          veg: item.veg,
          image: item.image,
        });
      }
      cartItemsRef.current = optimistic;
      setCartItems([...optimistic]);
      toast.success(`${item.name} added!`, { autoClose: 1200 });
    },
    []
  );

  const updateQuantity = useCallback((itemId: number, change: number) => {
    const isSubmitted =
      orderStatusRef.current === 'on_dine' ||
      orderStatusRef.current === 'completed';

    if (isSubmitted && change < 0) {
      return;
    }

    const nextCart = cartItemsRef.current
      .map((entry) =>
        entry.id === itemId
          ? { ...entry, quantity: entry.quantity + change }
          : entry
      )
      .filter((entry) => entry.quantity > 0);

    if (isSubmitted && change > 0) {
      cartItemsRef.current = nextCart;
      setCartItems([...nextCart]);
      void (async () => {
        setSyncing(true);
        try {
          const currentOrderId = orderIdRef.current;
          if (!currentOrderId) return;
          const row = await updatePublicOrder(currentOrderId, {
            order_items_id: orderItemIdsFromCart(nextCart),
            status: 'on_dine',
          });
          applySubmittedOrder(
            row,
            menuItemMapRef.current,
            setters,
            orderIdRef,
            cartItemsRef
          );
        } catch {
          toast.error('Could not update quantity.');
        } finally {
          setSyncing(false);
        }
      })();
      return;
    }

    if (isSubmitted) return;

    cartItemsRef.current = nextCart;
    setCartItems([...nextCart]);
  }, []);

  const removeFromCart = useCallback((itemId: number) => {
    if (
      orderStatusRef.current === 'on_dine' ||
      orderStatusRef.current === 'completed'
    ) {
      return;
    }

    const nextCart = cartItemsRef.current.filter((entry) => entry.id !== itemId);
    cartItemsRef.current = nextCart;
    setCartItems([...nextCart]);
    toast.info('Item removed', { autoClose: 1200 });
  }, []);

  const placeOrder = useCallback(() => {
    if (cartItemsRef.current.length === 0) {
      toast.error('Please add items before submitting!', { autoClose: 2000 });
      return;
    }

    if (
      orderStatusRef.current === 'on_dine' ||
      orderStatusRef.current === 'completed'
    ) {
      toast.info('Order already submitted.', { autoClose: 2000 });
      return;
    }

    void (async () => {
      setSyncing(true);
      try {
        let currentOrderId = orderIdRef.current;
        if (!currentOrderId) {
          currentOrderId = await ensureOrder();
        }

        const row = await updatePublicOrder(currentOrderId, {
          order_items_id: orderItemIdsFromCart(cartItemsRef.current),
          status: 'on_dine',
        });
        applySubmittedOrder(
          row,
          menuItemMapRef.current,
          setters,
          orderIdRef,
          cartItemsRef
        );
        toast.success('Order sent to the kitchen!', {
          position: 'top-center',
          autoClose: 3000,
        });
      } catch {
        toast.error('Could not submit order. Please try again.');
      } finally {
        setSyncing(false);
      }
    })();
  }, [ensureOrder]);

  const getCartTotal = useCallback(
    () =>
      cartItemsRef.current.reduce(
        (total, entry) => total + entry.price * entry.quantity,
        0
      ),
    [cartItems]
  );

  return {
    loading,
    syncing,
    orderId,
    orderNumber,
    orderStatus,
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    placeOrder,
    getCartTotal,
    isPlaced: orderStatus === 'on_dine' || orderStatus === 'completed',
  };
}
