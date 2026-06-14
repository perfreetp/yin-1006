import { create } from 'zustand';
import type { Store, FilterParams, LuggageSize } from '@/types';
import { mockStores } from '@/data/stores';

interface StoreState {
  stores: Store[];
  filters: FilterParams;
  selectedStore: Store | null;
  setFilters: (filters: Partial<FilterParams>) => void;
  toggleSizeFilter: (size: LuggageSize) => void;
  toggleOpenNow: () => void;
  setSortBy: (sortBy: FilterParams['sortBy']) => void;
  selectStore: (store: Store | null) => void;
  getStoreById: (id: string) => Store | undefined;
  getFilteredStores: () => Store[];
}

export const useStoreStore = create<StoreState>((set, get) => ({
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
}));
