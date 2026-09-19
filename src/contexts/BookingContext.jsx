import { createContext, useContext, useState, useCallback } from 'react';
import { mockWorkers, mockBookings as seedBookings } from '../data/mockData';

const BookingContext = createContext();

function generateId(prefix) {
  return `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
}

const STATUS_ORDER = [
  'request_submitted',
  'worker_selected',
  'confirmed',
  'on_the_way',
  'arrived',
  'working',
  'worker_done',
  'completed',
];

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState(() => [...seedBookings]);
  const [activeRequest, setActiveRequest] = useState(null);

  // ─── Create a new service request ───
  const createRequest = useCallback((formData) => {
    const newBooking = {
      id: generateId('B'),
      userId: 'U10482',
      workerId: null,
      service: formData.service,
      subType: formData.subType || '',
      description: formData.description,
      photo: formData.photo || null,
      date: formData.date,
      time: formData.time,
      location: formData.locationType === 'gps'
        ? { type: 'gps', display: 'Sector 22, Near Gurudwara, Chandigarh' }
        : {
            type: 'manual',
            house: formData.house || '',
            street: formData.street || '',
            city: formData.city || '',
            state: formData.state || '',
            pin: formData.pin || '',
          },
      status: 'request_submitted',
      serviceCharge: 0,
      materials: [],
      travelDistance: 0,
      travelCost: 0,
      total: 0,
      paymentStatus: 'pending',
      rating: null,
      review: null,
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);
    setActiveRequest(newBooking);
    return newBooking;
  }, []);

  // ─── Get eligible workers for current request ───
  const getEligibleWorkers = useCallback((serviceId) => {
    const allWorkers = Object.values(mockWorkers);
    return allWorkers
      .filter((w) => w.skills.includes(serviceId) && w.verified && w.available)
      .map((w) => ({
        ...w,
        distance: +(1.5 + Math.random() * 6).toFixed(1),
        accepted: true,
      }));
  }, []);

  // ─── Select a worker for the active request ───
  const selectWorker = useCallback((bookingId, workerId) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, workerId, status: 'worker_selected' } : b
      )
    );
    if (activeRequest?.id === bookingId) {
      setActiveRequest((prev) => ({ ...prev, workerId, status: 'worker_selected' }));
    }
  }, [activeRequest]);

  // ─── Confirm booking (uses governed price from PricingContext) ───
  const confirmBooking = useCallback((bookingId, approvedPrice = null) => {
    // approvedPrice is passed in from the component that has access to PricingContext
    // This avoids circular dependency between BookingContext and PricingContext
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const serviceCharge = approvedPrice || b.serviceCharge || 250;
        return {
          ...b,
          status: 'confirmed',
          serviceCharge,
          priceLockedAt: new Date().toISOString(),
          priceSource: 'SAHKAAR_GOVERNED',
        };
      })
    );
    if (activeRequest?.id === bookingId) {
      const serviceCharge = approvedPrice || activeRequest.serviceCharge || 250;
      setActiveRequest((prev) => ({
        ...prev,
        status: 'confirmed',
        serviceCharge,
        priceLockedAt: new Date().toISOString(),
        priceSource: 'SAHKAAR_GOVERNED',
      }));
    }
  }, [activeRequest]);

  // ─── Update booking status (generic) ───
  const updateStatus = useCallback((bookingId, newStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    if (activeRequest?.id === bookingId) {
      setActiveRequest((prev) => ({ ...prev, status: newStatus }));
    }
  }, [activeRequest]);

  // ─── Worker marks done ───
  const workerMarkDone = useCallback((bookingId) => {
    // Simulate materials and travel cost
    const materials = [
      { name: 'Tap Washer', quantity: 2, cost: 40 },
      { name: 'Flexible Pipe', quantity: 1, cost: 230 },
    ];
    const travelDistance = +(2 + Math.random() * 5).toFixed(1);
    const travelCost = Math.round(travelDistance * 18);

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const total = b.serviceCharge + materials.reduce((s, m) => s + m.cost, 0) + travelCost;
        return { ...b, status: 'worker_done', materials, travelDistance, travelCost, total };
      })
    );
  }, []);

  // ─── User marks done → completed ───
  const userMarkDone = useCallback((bookingId) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'completed' } : b))
    );
  }, []);

  // ─── Record payment ───
  const recordPayment = useCallback((bookingId, method) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, paymentStatus: 'paid', paymentMethod: method || 'digital' }
          : b
      )
    );
  }, []);

  // ─── Add rating ───
  const addRating = useCallback((bookingId, rating, review) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, rating, review } : b))
    );
  }, []);

  // ─── Getters ───
  const getBooking = useCallback(
    (bookingId) => bookings.find((b) => b.id === bookingId) || null,
    [bookings]
  );

  const getBookingsByStatus = useCallback(
    (type) => {
      if (type === 'upcoming') {
        return bookings.filter((b) => ['request_submitted', 'worker_selected'].includes(b.status));
      }
      if (type === 'active') {
        return bookings.filter((b) =>
          ['confirmed', 'on_the_way', 'arrived', 'working', 'worker_done'].includes(b.status)
        );
      }
      if (type === 'completed') {
        return bookings.filter((b) => b.status === 'completed');
      }
      return bookings;
    },
    [bookings]
  );

  const getStatusIndex = useCallback((status) => {
    return STATUS_ORDER.indexOf(status);
  }, []);

  return (
    <BookingContext.Provider
      value={{
        bookings,
        activeRequest,
        setActiveRequest,
        createRequest,
        getEligibleWorkers,
        selectWorker,
        confirmBooking,
        updateStatus,
        workerMarkDone,
        userMarkDone,
        recordPayment,
        addRating,
        getBooking,
        getBookingsByStatus,
        getStatusIndex,
        STATUS_ORDER,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used within BookingProvider');
  return context;
}
