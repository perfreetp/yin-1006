import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, OrderStatus, LuggageItem, Insurance, PriceSnapshot, FeeRecord, LuggageSize } from '@/types';
import { mockOrders } from '@/data/orders';
import { generateOrderNo, generatePickupCode } from '@/utils/format';
import { useStoreStore as _useStoreStore } from './useStoreStore';

interface CreateOrderParams {
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
  priceSnapshot: PriceSnapshot;
}

interface RenewFeeDetail {
  fromTime: string;
  toTime: string;
  hours?: number;
  perLuggage?: { luggageId: string; size: LuggageSize; amount: number; insurancePremium?: number }[];
}

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  getOrderById: (id: string) => Order | undefined;
  getOrderByPickupCode: (code: string) => Order | undefined;
  getOrdersByUserId: (userId: string) => Order[];
  getOrdersByStoreId: (storeId: string) => Order[];
  createOrder: (orderData: CreateOrderParams) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  payOrder: (orderId: string) => void;
  storeLuggage: (orderId: string, lockerNos: string[], photoUrls?: string[]) => void;
  pickupLuggage: (orderId: string) => void;
  cancelOrder: (orderId: string, reason: string) => void;
  updateLocker: (orderId: string, luggageIndex: number, newLockerNo: string) => void;
  markOverdue: (orderId: string) => void;
  renewOrder: (orderId: string, newEndTime: string, additionalAmount: number) => void;
  renewOrderWithDetail: (orderId: string, newEndTime: string, amount: number, feeDetail: RenewFeeDetail) => void;
  payOverdueFee: (orderId: string, overdueAmount: number, feeDetail: RenewFeeDetail) => void;
  rateOrder: (orderId: string, rating: number, review: string) => void;
}

const splitLuggageFees = (
  luggages: { id: string; size: LuggageSize; insurance?: { premium: number } }[],
  totalFee: number,
  priceSnapshot: PriceSnapshot
): { luggageId: string; size: LuggageSize; amount: number; insurancePremium: number }[] => {
  const sizePrices: Record<LuggageSize, number> = {
    small: priceSnapshot.smallPrice,
    medium: priceSnapshot.mediumPrice,
    large: priceSnapshot.largePrice,
  };

  const totalUnitPrice = luggages.reduce((sum, l) => sum + sizePrices[l.size], 0);
  if (totalUnitPrice === 0) {
    const avg = totalFee / luggages.length;
    return luggages.map(l => ({
      luggageId: l.id,
      size: l.size,
      amount: avg,
      insurancePremium: l.insurance?.premium || 0,
    }));
  }

  return luggages.map(l => ({
    luggageId: l.id,
    size: l.size,
    amount: (sizePrices[l.size] / totalUnitPrice) * totalFee,
    insurancePremium: l.insurance?.premium || 0,
  }));
};

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
        const now = new Date().toISOString();
        const luggagesWithId = orderData.luggages.map((l, i) => ({
          ...l,
          id: `lug-${Date.now()}-${i}`,
        }));

        const calculatedInsuranceAmount = luggagesWithId.reduce(
          (sum, l) => sum + (l.insurance?.premium || 0),
          0
        );
        const insuranceAmount = orderData.insuranceAmount || calculatedInsuranceAmount;
        const storageFee = orderData.totalAmount - insuranceAmount;

        const perLuggage = splitLuggageFees(
          luggagesWithId.map(l => ({ id: l.id, size: l.size, insurance: l.insurance })),
          storageFee,
          orderData.priceSnapshot
        );

        const originalFee: FeeRecord = {
          id: `fee-${Date.now()}-0`,
          type: 'original',
          amount: orderData.totalAmount,
          description: '寄存及保险费用',
          paidAt: now,
          detail: {
            fromTime: orderData.startTime,
            toTime: orderData.endTime,
            perLuggage,
          },
        };

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
          luggages: luggagesWithId,
          totalAmount: orderData.totalAmount,
          paidAmount: 0,
          insuranceAmount,
          insurance: orderData.insurance,
          pickupCode: generatePickupCode(),
          createdAt: now,
          renewCount: 0,
          additionalAmount: 0,
          priceSnapshot: orderData.priceSnapshot,
          feeRecords: [originalFee],
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
            o.id === orderId ? { ...o, status: 'paid', paidAt: now, paidAmount: o.totalAmount } : o
          ),
          currentOrder: state.currentOrder?.id === orderId
            ? { ...state.currentOrder, status: 'paid', paidAt: now, paidAmount: state.currentOrder.totalAmount }
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
        const order = get().orders.find(o => o.id === orderId);

        if (order && (order.status === 'stored' || order.status === 'overdue')) {
          const storeState = _useStoreStore.getState();
          if (storeState.releaseCapacity) {
            storeState.releaseCapacity(order.storeId, order.luggageCount);
          }
        }

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
            const renewFee: FeeRecord = {
              id: `fee-${Date.now()}-renew`,
              type: 'renew',
              amount: additionalAmount,
              description: '续存费用',
              paidAt: now,
            };
            return {
              ...o,
              status: newStatus,
              originalEndTime: o.originalEndTime || o.endTime,
              endTime: newEndTime,
              renewedAt: now,
              renewCount: (o.renewCount || 0) + 1,
              additionalAmount: (o.additionalAmount || 0) + additionalAmount,
              totalAmount: o.totalAmount + additionalAmount,
              paidAmount: o.paidAmount + additionalAmount,
              feeRecords: [...o.feeRecords, renewFee],
            };
          }),
          currentOrder: state.currentOrder?.id === orderId
            ? (() => {
                const o = state.currentOrder;
                const newStatus = o.status === 'overdue' ? 'stored' : o.status;
                const renewFee: FeeRecord = {
                  id: `fee-${Date.now()}-renew`,
                  type: 'renew',
                  amount: additionalAmount,
                  description: '续存费用',
                  paidAt: now,
                };
                return {
                  ...o,
                  status: newStatus,
                  originalEndTime: o.originalEndTime || o.endTime,
                  endTime: newEndTime,
                  renewedAt: now,
                  renewCount: (o.renewCount || 0) + 1,
                  additionalAmount: (o.additionalAmount || 0) + additionalAmount,
                  totalAmount: o.totalAmount + additionalAmount,
                  paidAmount: o.paidAmount + additionalAmount,
                  feeRecords: [...o.feeRecords, renewFee],
                };
              })()
            : state.currentOrder,
        }));
      },

      renewOrderWithDetail: (orderId, newEndTime, amount, feeDetail) => {
        const now = new Date().toISOString();
        const renewFee: FeeRecord = {
          id: `fee-${Date.now()}-renew`,
          type: 'renew',
          amount,
          description: '续存费用',
          paidAt: now,
          detail: feeDetail,
        };

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
              additionalAmount: (o.additionalAmount || 0) + amount,
              totalAmount: o.totalAmount + amount,
              paidAmount: o.paidAmount + amount,
              feeRecords: [...o.feeRecords, renewFee],
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
                  additionalAmount: (o.additionalAmount || 0) + amount,
                  totalAmount: o.totalAmount + amount,
                  paidAmount: o.paidAmount + amount,
                  feeRecords: [...o.feeRecords, renewFee],
                };
              })()
            : state.currentOrder,
        }));
      },

      payOverdueFee: (orderId, overdueAmount, feeDetail) => {
        const now = new Date().toISOString();
        const overdueFee: FeeRecord = {
          id: `fee-${Date.now()}-overdue`,
          type: 'overdue',
          amount: overdueAmount,
          description: '超时费用',
          paidAt: now,
          detail: feeDetail,
        };

        set(state => ({
          orders: state.orders.map(o => {
            if (o.id !== orderId) return o;
            return {
              ...o,
              status: 'stored',
              additionalAmount: (o.additionalAmount || 0) + overdueAmount,
              totalAmount: o.totalAmount + overdueAmount,
              paidAmount: o.paidAmount + overdueAmount,
              feeRecords: [...o.feeRecords, overdueFee],
            };
          }),
          currentOrder: state.currentOrder?.id === orderId
            ? (() => {
                const o = state.currentOrder;
                return {
                  ...o,
                  status: 'stored',
                  additionalAmount: (o.additionalAmount || 0) + overdueAmount,
                  totalAmount: o.totalAmount + overdueAmount,
                  paidAmount: o.paidAmount + overdueAmount,
                  feeRecords: [...o.feeRecords, overdueFee],
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
