import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Store, FilterParams, LuggageSize, LocationType } from '@/types';
import { mockStores } from '@/data/stores';
import { useAdminStore as _useAdminStore } from './useAdminStore';

interface StoreState {
  stores: Store[];
  filters: FilterParams;
  selectedStore: Store | null;
  setFilters: (filters: Partial<FilterParams>) => void;
  toggleSizeFilter: (size: LuggageSize) => void;
  toggleLocationTypeFilter: (type: LocationType) => void;
  toggleOpenNow: () => void;
  setSortBy: (sortBy: FilterParams['sortBy']) => void;
  selectStore: (store: Store | null) => void;
  getStoreById: (id: string) => Store | undefined;
  getFilteredStores: () => Store[];
  addStore: (store: Omit<Store, 'id'>) => void;
  updateStore: (id: string, updates: Partial<Store>) => void;
  deleteStore: (id: string) => void;
  occupyCapacity: (storeId: string, count: number) => boolean;
  releaseCapacity: (storeId: string, count: number) => void;
  getEffectiveCapacity: (storeId: string, date?: string) => number;
  getAvailableCapacityForDate: (storeId: string, date?: string) => number;
}

export const useStoreStore = create<StoreState>()(
  persist(
    (set, get) => ({
      stores: mockStores,
      filters: {
        sortBy: 'distance',
      },
      selectedStore: null,

      setFilters: (filters) => {
        set(state => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      toggleSizeFilter: (size) => {
        set(state => {
          const currentSizes = state.filters.sizes || [];
          const newSizes = currentSizes.includes(size)
            ? currentSizes.filter(s => s !== size)
            : [...currentSizes, size];
          return {
            filters: {
              ...state.filters,
              sizes: newSizes.length > 0 ? newSizes : undefined,
            },
          };
        });
      },

      toggleLocationTypeFilter: (type) => {
        set(state => {
          const currentTypes = state.filters.locationTypes || [];
          const newTypes = currentTypes.includes(type)
            ? currentTypes.filter(t => t !== type)
            : [...currentTypes, type];
          return {
            filters: {
              ...state.filters,
              locationTypes: newTypes.length > 0 ? newTypes : undefined,
            },
          };
        });
      },

      toggleOpenNow: () => {
        set(state => ({
          filters: {
            ...state.filters,
            openNow: !state.filters.openNow,
          },
        }));
      },

      setSortBy: (sortBy) => {
        set(state => ({
          filters: { ...state.filters, sortBy },
        }));
      },

      selectStore: (store) => {
        set({ selectedStore: store });
      },

      getStoreById: (id) => {
        return get().stores.find(s => s.id === id);
      },

      addStore: (store) => {
        const newStore: Store = {
          ...store,
          id: `store-${Date.now()}`,
        };
        set(state => ({
          stores: [...state.stores, newStore],
        }));
        return newStore;
      },

      updateStore: (id, updates) => {
        set(state => ({
          stores: state.stores.map(s => s.id === id ? { ...s, ...updates } : s),
          selectedStore: state.selectedStore?.id === id
            ? { ...state.selectedStore, ...updates }
            : state.selectedStore,
        }));
      },

      deleteStore: (id) => {
        set(state => ({
          stores: state.stores.filter(s => s.id !== id),
          selectedStore: state.selectedStore?.id === id ? null : state.selectedStore,
        }));
      },

      occupyCapacity: (storeId, count) => {
        const store = get().stores.find(s => s.id === storeId);
        if (!store) return false;
        if (store.availableCapacity - count < 0) return false;

        set(state => ({
          stores: state.stores.map(s => {
            if (s.id !== storeId) return s;
            return { ...s, availableCapacity: s.availableCapacity - count };
          }),
          selectedStore: state.selectedStore?.id === storeId
            ? {
                ...state.selectedStore,
                availableCapacity: state.selectedStore.availableCapacity - count,
              }
            : state.selectedStore,
        }));
        return true;
      },

      releaseCapacity: (storeId, count) => {
        set(state => ({
          stores: state.stores.map(s => {
            if (s.id !== storeId) return s;
            const newAvailable = Math.min(s.totalCapacity, s.availableCapacity + count);
            return { ...s, availableCapacity: newAvailable };
          }),
          selectedStore: state.selectedStore?.id === storeId
            ? {
                ...state.selectedStore,
                availableCapacity: Math.min(
                  state.selectedStore.totalCapacity,
                  state.selectedStore.availableCapacity + count
                ),
              }
            : state.selectedStore,
        }));
      },

      getEffectiveCapacity: (storeId, date) => {
        const store = get().stores.find(s => s.id === storeId);
        if (!store) return 0;

        const targetDate = date ? new Date(date) : new Date();
        const dateStr = targetDate.toISOString().split('T')[0];

        const adminState = _useAdminStore.getState();
        const holidayConfig = adminState.holidayConfigs.find(h => h.date === dateStr);
        const multiplier = holidayConfig?.capacityMultiplier || 1;

        return Math.floor(store.totalCapacity * multiplier);
      },

      getAvailableCapacityForDate: (storeId, date) => {
        const store = get().stores.find(s => s.id === storeId);
        if (!store) return 0;

        const targetDate = date ? new Date(date) : new Date();
        const dateStr = targetDate.toISOString().split('T')[0];

        const adminState = _useAdminStore.getState();
        const holidayConfig = adminState.holidayConfigs.find(h => h.date === dateStr);
        const multiplier = holidayConfig?.capacityMultiplier || 1;

        const effectiveTotal = Math.floor(store.totalCapacity * multiplier);
        const occupiedCount = store.totalCapacity - store.availableCapacity;
        const available = effectiveTotal - occupiedCount;

        return Math.max(0, available);
      },

      getFilteredStores: () => {
        const { stores, filters } = get();
        let filtered = [...stores];

        if (filters.keyword) {
          const keyword = filters.keyword.toLowerCase();
          filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(keyword) ||
            s.address.toLowerCase().includes(keyword)
          );
        }

        if (filters.locationTypes && filters.locationTypes.length > 0) {
          filtered = filtered.filter(s => filters.locationTypes!.includes(s.locationType));
        }

        if (filters.openNow) {
          const now = new Date();
          const currentHour = now.getHours();
          filtered = filtered.filter(s => {
            const hours = s.businessHours.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
            if (hours) {
              const startHour = parseInt(hours[1]);
              const endHour = parseInt(hours[3]);
              return currentHour >= startHour && currentHour < endHour;
            }
            return true;
          });
        }

        if (filters.sizes && filters.sizes.length > 0) {
          filtered = filtered.filter(s => {
            return filters.sizes?.some(size => {
              if (size === 'small') return s.smallPrice !== undefined;
              if (size === 'medium') return s.mediumPrice !== undefined;
              if (size === 'large') return s.largePrice !== undefined;
              return false;
            });
          });
        }

        if (filters.priceMin !== undefined) {
          filtered = filtered.filter(s => s.basePrice >= filters.priceMin!);
        }
        if (filters.priceMax !== undefined) {
          filtered = filtered.filter(s => s.basePrice <= filters.priceMax!);
        }

        if (filters.minRating !== undefined) {
          filtered = filtered.filter(s => s.rating >= filters.minRating!);
        }

        if (filters.sortBy) {
          switch (filters.sortBy) {
            case 'distance':
              filtered.sort((a, b) => a.distance - b.distance);
              break;
            case 'price':
              filtered.sort((a, b) => a.basePrice - b.basePrice);
              break;
            case 'rating':
              filtered.sort((a, b) => b.rating - a.rating);
              break;
            case 'popular':
              filtered.sort((a, b) => b.reviewCount - a.reviewCount);
              break;
          }
        }

        return filtered;
      },
    }),
    {
      name: 'store-storage',
      partialize: (state) => ({ stores: state.stores }),
    }
  )
);
