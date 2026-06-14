import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PriceRule, HolidayConfig, Settlement } from '@/types';
import { mockPriceRules, mockSettlements, mockHolidays } from '@/data/misc';

interface AdminState {
  priceRules: PriceRule[];
  holidayConfigs: HolidayConfig[];
  settlements: Settlement[];
  
  getPriceRuleByStoreId: (storeId: string) => PriceRule | undefined;
  addPriceRule: (rule: Omit<PriceRule, 'id'>) => PriceRule;
  updatePriceRule: (id: string, updates: Partial<PriceRule>) => void;
  deletePriceRule: (id: string) => void;
  
  addHoliday: (holiday: Omit<HolidayConfig, 'id'>) => HolidayConfig;
  updateHoliday: (id: string, updates: Partial<HolidayConfig>) => void;
  deleteHoliday: (id: string) => void;
  
  settlePayment: (id: string) => void;
  addSettlement: (settlement: Omit<Settlement, 'id'>) => Settlement;
  updateSettlement: (id: string, updates: Partial<Settlement>) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      priceRules: mockPriceRules,
      holidayConfigs: mockHolidays,
      settlements: mockSettlements,
      
      getPriceRuleByStoreId: (storeId) => {
        return get().priceRules.find(r => r.storeId === storeId);
      },
      
      addPriceRule: (rule) => {
        const newRule: PriceRule = {
          ...rule,
          id: `pr-${Date.now()}`,
        };
        set(state => ({
          priceRules: [...state.priceRules, newRule],
        }));
        return newRule;
      },
      
      updatePriceRule: (id, updates) => {
        set(state => ({
          priceRules: state.priceRules.map(r => r.id === id ? { ...r, ...updates } : r),
        }));
      },
      
      deletePriceRule: (id) => {
        set(state => ({
          priceRules: state.priceRules.filter(r => r.id !== id),
        }));
      },
      
      addHoliday: (holiday) => {
        const newHoliday: HolidayConfig = {
          ...holiday,
          id: `hol-${Date.now()}`,
        };
        set(state => ({
          holidayConfigs: [...state.holidayConfigs, newHoliday],
        }));
        return newHoliday;
      },
      
      updateHoliday: (id, updates) => {
        set(state => ({
          holidayConfigs: state.holidayConfigs.map(h => h.id === id ? { ...h, ...updates } : h),
        }));
      },
      
      deleteHoliday: (id) => {
        set(state => ({
          holidayConfigs: state.holidayConfigs.filter(h => h.id !== id),
        }));
      },
      
      settlePayment: (id) => {
        const now = new Date().toISOString();
        set(state => ({
          settlements: state.settlements.map(s =>
            s.id === id ? { ...s, status: 'settled', settledAt: now } : s
          ),
        }));
      },
      
      addSettlement: (settlement) => {
        const newSettlement: Settlement = {
          ...settlement,
          id: `set-${Date.now()}`,
        };
        set(state => ({
          settlements: [...state.settlements, newSettlement],
        }));
        return newSettlement;
      },
      
      updateSettlement: (id, updates) => {
        set(state => ({
          settlements: state.settlements.map(s => s.id === id ? { ...s, ...updates } : s),
        }));
      },
    }),
    {
      name: 'admin-storage',
    }
  )
);
