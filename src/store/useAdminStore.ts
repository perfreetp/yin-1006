import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PriceRule, HolidayConfig, Settlement } from '@/types';
import { mockPriceRules, mockSettlements, mockHolidays } from '@/data/misc';

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface AdminState {
  priceRules: PriceRule[];
  holidayConfigs: HolidayConfig[];
  settlements: Settlement[];

  getPriceRuleByStoreId: (storeId: string) => PriceRule | undefined;
  getActivePriceRuleByStoreId: (storeId: string, date?: string) => PriceRule | undefined;
  getAllPriceRulesByStoreId: (storeId: string) => PriceRule[];
  addPriceRule: (rule: Omit<PriceRule, 'id'> & { effectiveDate?: string }) => PriceRule;
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
        return get().getActivePriceRuleByStoreId(storeId);
      },

      getActivePriceRuleByStoreId: (storeId, date) => {
        const targetDate = date || getTodayString();
        const storeRules = get().priceRules.filter(r => r.storeId === storeId);
        const sortedRules = [...storeRules].sort((a, b) =>
          b.effectiveDate.localeCompare(a.effectiveDate)
        );
        return sortedRules.find(r => r.effectiveDate <= targetDate);
      },

      getAllPriceRulesByStoreId: (storeId) => {
        const storeRules = get().priceRules.filter(r => r.storeId === storeId);
        return [...storeRules].sort((a, b) =>
          b.effectiveDate.localeCompare(a.effectiveDate)
        );
      },

      addPriceRule: (rule) => {
        const effectiveDate = rule.effectiveDate || getTodayString();
        const ruleWithDate = { ...rule, effectiveDate };

        const existingRule = get().priceRules.find(
          r => r.storeId === rule.storeId && r.effectiveDate === effectiveDate
        );

        if (existingRule) {
          const updatedRule = { ...existingRule, ...ruleWithDate };
          set(state => ({
            priceRules: state.priceRules.map(r =>
              r.id === existingRule.id ? updatedRule : r
            ),
          }));
          return updatedRule;
        }

        const newRule: PriceRule = {
          ...ruleWithDate,
          id: `pr-${Date.now()}`,
        } as PriceRule;
        set(state => ({
          priceRules: [...state.priceRules, newRule],
        }));
        return newRule;
      },

      updatePriceRule: (id, updates) => {
        const currentRule = get().priceRules.find(r => r.id === id);
        if (!currentRule) return;

        const newStoreId = updates.storeId !== undefined ? updates.storeId : currentRule.storeId;
        const newEffectiveDate = updates.effectiveDate !== undefined ? updates.effectiveDate : currentRule.effectiveDate;

        const conflictRule = get().priceRules.find(
          r => r.storeId === newStoreId && r.effectiveDate === newEffectiveDate && r.id !== id
        );
        if (conflictRule) {
          console.warn(`生效日期冲突：storeId ${newStoreId} 在 ${newEffectiveDate} 已存在规则`);
          return;
        }

        set(state => ({
          priceRules: state.priceRules.map(r =>
            r.id === id ? { ...r, ...updates } : r
          ),
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
