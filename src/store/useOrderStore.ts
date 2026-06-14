import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, OrderStatus, LuggageItem, Insurance } from '@/types';
import { mockOrders } from '@/data/orders';
import { generateOrderNo, generatePickupCode } from '@/utils/format';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  getOrderById: (id: string) => Order | undefined;
  getOrderByPickupCode: (code: string) => Order | undefined;
  getOrdersByUserId: (userId: string) => Order[];
  getOrdersByStoreId: (storeId: string) => Order[];
  createOrder: (orderData: {
    userId: string;
    storeId: string;
    storeName: string;
    startTime: string;
    endTime: string;
    luggageCount: number;
    luggages: Omit<LuggageItem, 'id'>[];
    totalAmount: number;
    insuranceAmount: number;
    insurance: Insurance | null;
  }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  payOrder: (orderId: string) => void;
  storeLuggage: (orderId: string, lockerNos: string[], photoUrls?: string[]) => void;
  pickupLuggage: (orderId: string) => void;
  cancelOrder: (orderId: string, reason: string) => void;
  updateLocker: (orderId: string, luggageIndex: number, newLockerNo: string) => void;
  markOverdue: (orderId: string) => void;
  renewOrder: (orderId: string, newEndTime: string, additionalAmount: number) => void;
  rateOrder: (orderId: string, rating: number, review: string) => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: mockOrders,
      currentOrder: null,
      
      setCurrentOrder: (order) => {
        set({ currentOrder: order });
      },
      
      getOrderById: (id) => {
        return get().orders.find(o => o.id === id);
      },
      
      getOrderByPickupCode: (code) => {
        return get().orders.find(o => o.pickupCode === code.toUpperCase());
      },
      
      getOrdersByUserId: (userId) => {
        return get().orders
          .filter(o => o.userId === userId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      
      getOrdersByStoreId: (storeId) => {
        return get().orders
          .filter(o => o.storeId === storeId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      
      createOrder: (orderData) => {
        const newOrder: Order = {
          id: `order-${Date.now()}`,
          orderNo: generateOrderNo(),
          userId: orderData.userId,
          storeId: orderData.storeId,
          storeName: orderData.storeName,
          status: 'pending',
          startTime: orderData.startTime,
          endTime: orderData.endTime,
          luggageCount: orderData.luggageCount,
          luggages: orderData.luggages.map((l, i) => ({
            ...l,
            id: `lug-${Date.now()}-${i}`,
          })),
          totalAmount: orderData.totalAmount,
          insuranceAmount: orderData.insuranceAmount,
          insurance: orderData.insurance,
          pickupCode: generatePickupCode(),
          createdAt: new Date().toISOString(),
          renewCount: 0,
          additionalAmount: 0,
        };
        
        set(state => ({
          orders: [newOrder, ...state.orders],
          currentOrder: newOrder,
        }));
        
        return newOrder;
      },
      
      updateOrderStatus: (orderId, status) => {
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId ? { ...o, status } : o
          ),
          currentOrder: state.currentOrder?.id === orderId
            ? { ...state.currentOrder, status }
            : state.currentOrder,
        }));
      },
      
      payOrder: (orderId) => {
        const now = new Date().toISOString();
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId ? { ...o, status: 'paid', paidAt: now } : o
          ),
          currentOrder: state.currentOrder?.id === orderId
            ? { ...state.currentOrder, status: 'paid', paidAt: now }
            : state.currentOrder,
        }));
      },
      
      storeLuggage: (orderId, lockerNos, photoUrls) => {
        const now = new Date().toISOString();
        set(state => ({
          orders: state.orders.map(o => {
            if (o.id !== orderId) return o;
            const updatedLuggages = o.luggages.map((lug, i) => ({
              ...lug,
              lockerNo: lockerNos[i] || lug.lockerNo,
              photoUrl: photoUrls?.[i] || lug.photoUrl,
              storedAt: now,
            }));
            return {
              ...o,
              status: 'stored',
              luggages: updatedLuggages,
              storedAt: now,
            };
          }),
          currentOrder: state.currentOrder?.id === orderId
            ? (() => {
                const o = state.currentOrder;
                const updatedLuggages = o.luggages.map((lug, i) => ({
                  ...lug,
                  lockerNo: lockerNos[i] || lug.lockerNo,
                  photoUrl: photoUrls?.[i] || lug.photoUrl,
                  storedAt: now,
                }));
                return {
                  ...o,
                  status: 'stored',
                  luggages: updatedLuggages,
                  storedAt: now,
                };
              })()
            : state.currentOrder,
        }));
      },
      
      pickupLuggage: (orderId) => {
        const now = new Date().toISOString();
        set(state => ({
          orders: state.orders.map(o => {
            if (o.id !== orderId) return o;
            const updatedLuggages = o.luggages.map(lug => ({
              ...lug,
              pickedAt: now,
            }));
            return {
              ...o,
              status: 'picked',
              luggages: updatedLuggages,
              pickedAt: now,
            };
          }),
          currentOrder: state.currentOrder?.id === orderId
            ? (() => {
                const o = state.currentOrder;
                const updatedLuggages = o.luggages.map(lug => ({
                  ...lug,
                  pickedAt: now,
                }));
                return {
                  ...o,
                  status: 'picked',
                  luggages: updatedLuggages,
                  pickedAt: now,
                };
              })()
            : state.currentOrder,
        }));
      },
      
      cancelOrder: (orderId, reason) => {
        const now = new Date().toISOString();
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? { ...o, status: 'cancelled', cancelledAt: now, cancelReason: reason }
              : o
          ),
          currentOrder: state.currentOrder?.id === orderId
            ? { ...state.currentOrder, status: 'cancelled', cancelledAt: now, cancelReason: reason }
            : state.currentOrder,
        }));
      },

      updateLocker: (orderId, luggageIndex, newLockerNo) => {
        set(state => ({
          orders: state.orders.map(o => {
            if (o.id !== orderId) return o;
            const updatedLuggages = [...o.luggages];
            if (updatedLuggages[luggageIndex]) {
              updatedLuggages[luggageIndex] = {
                ...updatedLuggages[luggageIndex],
                lockerNo: newLockerNo,
              };
            }
            return { ...o, luggages: updatedLuggages };
          }),
          currentOrder: state.currentOrder?.id === orderId
            ? (() => {
                const o = state.currentOrder;
                const updatedLuggages = [...o.luggages];
                if (updatedLuggages[luggageIndex]) {
                  updatedLuggages[luggageIndex] = {
                    ...updatedLuggages[luggageIndex],
                    lockerNo: newLockerNo,
                  };
                }
                return { ...o, luggages: updatedLuggages };
              })()
            : state.currentOrder,
        }));
      },

      markOverdue: (orderId) => {
        const now = new Date().toISOString();
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? { ...o, status: 'overdue', overdueMarkedAt: now }
              : o
          ),
          currentOrder: state.currentOrder?.id === orderId
            ? { ...state.currentOrder, status: 'overdue', overdueMarkedAt: now }
            : state.currentOrder,
        }));
      },

      renewOrder: (orderId, newEndTime, additionalAmount) => {
        const now = new Date().toISOString();
        set(state => ({
          orders: state.orders.map(o => {
            if (o.id !== orderId) return o;
            const newStatus = o.status === 'overdue' ? 'stored' : o.status;
            return {
              ...o,
              status: newStatus,
              originalEndTime: o.originalEndTime || o.endTime,
              endTime: newEndTime,
              renewedAt: now,
              renewCount: (o.renewCount || 0) + 1,
              additionalAmount: (o.additionalAmount || 0) + additionalAmount,
              totalAmount: o.totalAmount + additionalAmount,
            };
          }),
          currentOrder: state.currentOrder?.id === orderId
            ? (() => {
                const o = state.currentOrder;
                const newStatus = o.status === 'overdue' ? 'stored' : o.status;
                return {
                  ...o,
                  status: newStatus,
                  originalEndTime: o.originalEndTime || o.endTime,
                  endTime: newEndTime,
                  renewedAt: now,
                  renewCount: (o.renewCount || 0) + 1,
                  additionalAmount: (o.additionalAmount || 0) + additionalAmount,
                  totalAmount: o.totalAmount + additionalAmount,
                };
              })()
            : state.currentOrder,
        }));
      },

      rateOrder: (orderId, rating, review) => {
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId ? { ...o, rating, review } : o
          ),
          currentOrder: state.currentOrder?.id === orderId
            ? { ...state.currentOrder, rating, review }
            : state.currentOrder,
        }));
      },
    }),
    {
      name: 'order-storage',
      partialize: (state) => ({ orders: state.orders }),
    }
  )
);
