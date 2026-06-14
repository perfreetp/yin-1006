import type { LuggageItem, LuggageSize } from '@/types';

export const formatPrice = (price: number): string => {
  return `¥${price.toFixed(2)}`;
};

export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
};

export const formatDuration = (start: string, end: string): string => {
  const startDate = new Date(start).getTime();
  const endDate = new Date(end).getTime();
  const diffMs = endDate - startDate;
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    return `${diffHours}小时`;
  }
  const days = Math.floor(diffHours / 24);
  const hours = diffHours % 24;
  return hours > 0 ? `${days}天${hours}小时` : `${days}天`;
};

export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

export const generatePickupCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateOrderNo = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `XC${year}${month}${day}${random}`;
};

export const getSizeLabel = (size: string): string => {
  const sizeMap: Record<string, string> = {
    small: '小件',
    medium: '中件',
    large: '大件',
  };
  return sizeMap[size] || size;
};

export const getSizeDescription = (size: string): string => {
  const sizeMap: Record<string, string> = {
    small: '背包/手提包',
    medium: '登机箱/20寸以下',
    large: '大行李箱/24寸以上',
  };
  return sizeMap[size] || '';
};

export const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    stored: '寄存中',
    picked: '已取件',
    cancelled: '已取消',
    overdue: '已超时',
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    paid: 'bg-blue-100 text-blue-700',
    stored: 'bg-teal-100 text-teal-700',
    picked: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-700',
    overdue: 'bg-orange-100 text-orange-700',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-600';
};

export const getTicketTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    cancel: '取消申请',
    lost: '遗失申报',
    compensation: '赔付申请',
    review: '差评回访',
  };
  return typeMap[type] || type;
};

export const getTicketStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭',
  };
  return statusMap[status] || status;
};

export const getTicketStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    resolved: 'bg-teal-100 text-teal-700',
    closed: 'bg-gray-100 text-gray-600',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-600';
};

export const getPriorityLabel = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
  };
  return priorityMap[priority] || priority;
};

export const getPriorityColor = (priority: string): string => {
  const colorMap: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
  };
  return colorMap[priority] || 'bg-gray-100 text-gray-600';
};

const getSizePriceKey = (size: LuggageSize, prices: { smallPrice: number; mediumPrice: number; largePrice: number }): number => {
  if (size === 'small') return prices.smallPrice;
  if (size === 'large') return prices.largePrice;
  return prices.mediumPrice;
};

export const calculateSingleLuggagePrice = (
  size: LuggageSize,
  prices: { smallPrice: number; mediumPrice: number; largePrice: number; hourlyRate: number; dailyCap: number },
  startTime: string,
  endTime: string,
  priceMultiplier: number = 1,
  holidaySurcharge: number = 0,
): number => {
  const basePrice = getSizePriceKey(size, prices);
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const hours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
  const days = Math.ceil(hours / 24);
  const totalHours = Math.min(hours, days * 24);
  let price = basePrice + Math.max(0, totalHours - 1) * prices.hourlyRate;
  price = Math.min(price, prices.dailyCap * days);
  price = price * priceMultiplier + holidaySurcharge * days;
  return Math.round(price * 100) / 100;
};

export const calculateLuggagesPrice = (
  luggages: { size: LuggageSize }[],
  prices: { smallPrice: number; mediumPrice: number; largePrice: number; hourlyRate: number; dailyCap: number },
  startTime: string,
  endTime: string,
  priceMultiplier: number = 1,
  holidaySurcharge: number = 0,
): { total: number; perLuggage: { size: LuggageSize; amount: number }[] } => {
  let total = 0;
  const perLuggage = luggages.map((lug) => {
    const amount = calculateSingleLuggagePrice(lug.size, prices, startTime, endTime, priceMultiplier, holidaySurcharge);
    total += amount;
    return { size: lug.size, amount };
  });
  return { total, perLuggage };
};

export const calculatePrice = (
  basePrice: number,
  hourlyRate: number,
  dailyCap: number,
  startTime: string,
  endTime: string,
  luggageCount: number,
  priceMultiplier: number = 1,
  holidaySurcharge: number = 0,
): number => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const hours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
  const days = Math.ceil(hours / 24);
  const totalHours = Math.min(hours, days * 24);
  let price = basePrice + Math.max(0, totalHours - 1) * hourlyRate;
  price = Math.min(price, dailyCap * days);
  price = price * priceMultiplier + holidaySurcharge * days;
  return price * luggageCount;
};

export const calculateInsurancePremium = (insuredAmount: number): number => {
  return Math.max(5, insuredAmount * 0.01);
};

export const isHolidayPeriod = (startTime: string, endTime: string, holidays: { date: string; priceMultiplier: number; capacityMultiplier?: number }[]): { isHoliday: boolean; multiplier: number; capacityMultiplier: number } => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  let maxMultiplier = 1;
  let maxCapMultiplier = 1;
  let foundHoliday = false;

  for (const holiday of holidays) {
    const holidayDate = new Date(holiday.date);
    const holidayStr = `${holidayDate.getFullYear()}-${String(holidayDate.getMonth() + 1).padStart(2, '0')}-${String(holidayDate.getDate()).padStart(2, '0')}`;

    const startDateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const endDateStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

    if (holidayStr >= startDateStr && holidayStr <= endDateStr) {
      foundHoliday = true;
      maxMultiplier = Math.max(maxMultiplier, holiday.priceMultiplier);
      if (holiday.capacityMultiplier) {
        maxCapMultiplier = Math.max(maxCapMultiplier, holiday.capacityMultiplier);
      }
    }
  }

  return { isHoliday: foundHoliday, multiplier: maxMultiplier, capacityMultiplier: maxCapMultiplier };
};

export const calculateOverdueFeePerLuggage = (
  luggages: { size: LuggageSize }[],
  prices: { hourlyRate: number; dailyCap: number },
  originalEndTime: string,
  currentTime: string,
  priceMultiplier: number = 1,
): { total: number; perLuggage: { size: LuggageSize; amount: number }[] } => {
  const end = new Date(originalEndTime).getTime();
  const now = new Date(currentTime).getTime();
  if (now <= end) {
    return {
      total: 0,
      perLuggage: luggages.map(l => ({ size: l.size, amount: 0 })),
    };
  }
  const overdueHours = Math.max(1, Math.ceil((now - end) / (1000 * 60 * 60)));
  const overdueDays = Math.ceil(overdueHours / 24);
  const perLuggage = luggages.map(l => {
    const amount = Math.min(prices.hourlyRate * overdueHours, prices.dailyCap * overdueDays) * priceMultiplier;
    return { size: l.size, amount: Math.round(amount * 100) / 100 };
  });
  const total = perLuggage.reduce((sum, x) => sum + x.amount, 0);
  return { total, perLuggage };
};

export const calculateOverdueFee = (
  hourlyRate: number,
  dailyCap: number,
  originalEndTime: string,
  currentTime: string,
  luggageCount: number,
  priceMultiplier: number = 1,
): number => {
  const end = new Date(originalEndTime).getTime();
  const now = new Date(currentTime).getTime();
  if (now <= end) return 0;
  const overdueHours = Math.max(1, Math.ceil((now - end) / (1000 * 60 * 60)));
  const overdueDays = Math.ceil(overdueHours / 24);
  let fee = hourlyRate * overdueHours;
  fee = Math.min(fee, dailyCap * overdueDays);
  fee = fee * priceMultiplier;
  return fee * luggageCount;
};
