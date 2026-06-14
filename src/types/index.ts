export type UserRole = 'visitor' | 'store' | 'service' | 'admin';

export interface User {
  id: string;
  phone: string;
  nickname: string;
  role: UserRole;
  avatar: string;
  storeId?: string;
}

export type LocationType = 'station' | 'commercial' | 'scenic' | 'airport' | 'other';

export interface Store {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  businessHours: string;
  rating: number;
  reviewCount: number;
  distance: number;
  totalCapacity: number;
  availableCapacity: number;
  images: string[];
  phone: string;
  description: string;
  basePrice: number;
  smallPrice: number;
  mediumPrice: number;
  largePrice: number;
  hourlyRate: number;
  dailyCap: number;
  features: string[];
  locationType: LocationType;
}

export type LuggageSize = 'small' | 'medium' | 'large';

export type OrderStatus = 'pending' | 'paid' | 'stored' | 'picked' | 'cancelled' | 'overdue';

export interface LuggageItem {
  id: string;
  size: LuggageSize;
  lockerNo?: string;
  photoUrl?: string;
  storedAt?: string;
  pickedAt?: string;
}

export interface Insurance {
  id: string;
  insuredAmount: number;
  premium: number;
  status: 'active' | 'claimed' | 'expired';
}

export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  storeId: string;
  storeName: string;
  status: OrderStatus;
  startTime: string;
  endTime: string;
  originalEndTime?: string;
  luggageCount: number;
  luggages: LuggageItem[];
  totalAmount: number;
  insuranceAmount: number;
  insurance: Insurance | null;
  pickupCode: string;
  createdAt: string;
  paidAt?: string;
  storedAt?: string;
  pickedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  overdueMarkedAt?: string;
  renewedAt?: string;
  renewCount?: number;
  additionalAmount?: number;
  rating?: number;
  review?: string;
}

export interface FilterParams {
  keyword?: string;
  location?: string;
  openNow?: boolean;
  sizes?: LuggageSize[];
  priceMin?: number;
  priceMax?: number;
  minRating?: number;
  sortBy?: 'distance' | 'price' | 'rating' | 'popular';
  locationTypes?: LocationType[];
}

export interface Locker {
  id: string;
  storeId: string;
  lockerNo: string;
  size: LuggageSize;
  status: 'available' | 'occupied' | 'maintenance';
  floor: number;
}

export type TicketType = 'cancel' | 'lost' | 'compensation' | 'review';

export type TicketStatus = 'pending' | 'processing' | 'resolved' | 'closed';

export interface ServiceTicket {
  id: string;
  type: TicketType;
  orderId: string;
  orderNo: string;
  userId: string;
  userName: string;
  storeId: string;
  storeName: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  handler?: string;
  handledAt?: string;
  resolution?: string;
  images?: string[];
}

export interface Settlement {
  id: string;
  storeId: string;
  storeName: string;
  period: string;
  orderCount: number;
  totalAmount: number;
  platformFee: number;
  settleAmount: number;
  status: 'pending' | 'settled';
  createdAt: string;
  settledAt?: string;
}

export interface PriceRule {
  id: string;
  storeId: string;
  basePrice: number;
  smallPrice: number;
  mediumPrice: number;
  largePrice: number;
  hourlyRate: number;
  dailyCap: number;
  holidaySurcharge: number;
}

export interface HolidayConfig {
  id: string;
  date: string;
  name: string;
  capacityMultiplier: number;
  priceMultiplier: number;
}
