import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Package,
  Shield,
  Plus,
  ChevronDown,
  ChevronUp,
  Star,
  Phone,
  Info,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { useStoreStore } from '@/store/useStoreStore';
import { useOrderStore } from '@/store/useOrderStore';
import { useUserStore } from '@/store/useUserStore';
import { useAdminStore } from '@/store/useAdminStore';
import { formatPrice, getSizeLabel, getSizeDescription, calculateLuggagesPrice, calculateInsurancePremium, isHolidayPeriod } from '@/utils/format';
import type { LuggageSize, PriceSnapshot, LuggageItem } from '@/types';

const sizeOptions: { value: LuggageSize; label: string; priceKey: 'smallPrice' | 'mediumPrice' | 'largePrice' }[] = [
  { value: 'small', label: '小件', priceKey: 'smallPrice' },
  { value: 'medium', label: '中件', priceKey: 'mediumPrice' },
  { value: 'large', label: '大件', priceKey: 'largePrice' },
];

const insuranceOptions = [
  { amount: 0, label: '不保价' },
  { amount: 500, label: '500元' },
  { amount: 1000, label: '1000元' },
  { amount: 2000, label: '2000元' },
  { amount: 5000, label: '5000元' },
];

interface LuggageFormItem {
  id: string;
  size: LuggageSize;
  insuredAmount: number;
  remark: string;
}

export default function OrderCreate() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { getStoreById, getAvailableCapacityForDate } = useStoreStore();
  const { createOrder, payOrder } = useOrderStore();
  const { currentUser } = useUserStore();
  const { getActivePriceRuleByStoreId, holidayConfigs } = useAdminStore();

  const store = getStoreById(storeId || '');

  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [luggages, setLuggages] = useState<LuggageFormItem[]>([
    { id: 'lug-1', size: 'medium', insuredAmount: 0, remark: '' },
  ]);
  const [expandedLuggageIds, setExpandedLuggageIds] = useState<Set<string>>(new Set(['lug-1']));
  const [paymentMethod, setPaymentMethod] = useState('wechat');
  const [showSuccess, setShowSuccess] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const formatTime = (d: Date) => {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(Math.ceil(d.getMinutes() / 30) * 30 % 60).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    setStartDate(formatDate(now));
    setStartTime(formatTime(now));
    setEndDate(formatDate(tomorrow));
    setEndTime('18:00');
  }, []);

  const startDateTime = useMemo(() => `${startDate}T${startTime}:00`, [startDate, startTime]);
  const endDateTime = useMemo(() => `${endDate}T${endTime}:00`, [endDate, endTime]);

  useEffect(() => {
    if (!startDate || !startTime || !endDate || !endTime) {
      setTimeError(null);
      return;
    }

    const start = new Date(startDateTime).getTime();
    const end = new Date(endDateTime).getTime();
    const now = Date.now();

    if (start < now - 5 * 60 * 1000) {
      setTimeError('开始时间不能早于当前时间');
      return;
    }

    if (end <= start) {
      setTimeError('结束时间必须晚于开始时间');
      return;
    }

    const diffHours = (end - start) / (1000 * 60 * 60);
    if (diffHours < 1) {
      setTimeError('寄存时长至少1小时');
      return;
    }

    if (diffHours > 24 * 30) {
      setTimeError('寄存时长不能超过30天');
      return;
    }

    setTimeError(null);
  }, [startDateTime, endDateTime]);

  const priceRule = store ? getActivePriceRuleByStoreId(store.id, startDate) : undefined;

  const effectivePrices = useMemo(() => {
    if (!store) return null;
    if (priceRule) {
      return {
        smallPrice: priceRule.smallPrice,
        mediumPrice: priceRule.mediumPrice,
        largePrice: priceRule.largePrice,
        hourlyRate: priceRule.hourlyRate,
        dailyCap: priceRule.dailyCap,
      };
    }
    return {
      smallPrice: store.smallPrice,
      mediumPrice: store.mediumPrice,
      largePrice: store.largePrice,
      hourlyRate: store.hourlyRate,
      dailyCap: store.dailyCap,
    };
  }, [store, priceRule]);

  const holidaySurcharge = priceRule ? priceRule.holidaySurcharge : 0;

  const { isHoliday, multiplier: priceMultiplier, capacityMultiplier } = isHolidayPeriod(
    startDateTime,
    endDateTime,
    holidayConfigs
  );

  const totalHours = Math.max(1, Math.ceil(
    (new Date(endDateTime).getTime() - new Date(startDateTime).getTime()) / (1000 * 60 * 60)
  ));

  const luggagesForPriceCalc = useMemo(() => {
    return luggages.map(l => ({ size: l.size }));
  }, [luggages]);

  const { total: luggagePrice, perLuggage } = useMemo(() => {
    if (!effectivePrices) return { total: 0, perLuggage: [] as { size: LuggageSize; amount: number }[] };
    return calculateLuggagesPrice(
      luggagesForPriceCalc,
      effectivePrices,
      startDateTime,
      endDateTime,
      priceMultiplier,
      holidaySurcharge
    );
  }, [luggagesForPriceCalc, effectivePrices, startDateTime, endDateTime, priceMultiplier, holidaySurcharge]);

  const insurancePremiums = useMemo(() => {
    return luggages.map(l => ({
      id: l.id,
      premium: l.insuredAmount > 0 ? calculateInsurancePremium(l.insuredAmount) : 0,
    }));
  }, [luggages]);

  const totalInsurancePremium = useMemo(() => {
    return insurancePremiums.reduce((sum, item) => sum + item.premium, 0);
  }, [insurancePremiums]);

  const totalAmount = luggagePrice + totalInsurancePremium;

  const availableCapacity = store ? getAvailableCapacityForDate(store.id, startDate) : 0;
  const capacityError = store && availableCapacity < luggages.length
    ? `当前可用容量 ${availableCapacity}，您需要 ${luggages.length} 个柜位，容量不足`
    : null;

  const canSubmit = !timeError && !capacityError && startDate && startTime && endDate && endTime;

  const priceSnapshot: PriceSnapshot | null = useMemo(() => {
    if (!effectivePrices) return null;
    return {
      basePrice: effectivePrices.mediumPrice,
      smallPrice: effectivePrices.smallPrice,
      mediumPrice: effectivePrices.mediumPrice,
      largePrice: effectivePrices.largePrice,
      hourlyRate: effectivePrices.hourlyRate,
      dailyCap: effectivePrices.dailyCap,
      holidaySurcharge,
      priceMultiplier,
      isHoliday,
    };
  }, [effectivePrices, holidaySurcharge, priceMultiplier, isHoliday]);

  const toggleLuggageExpand = (id: string) => {
    setExpandedLuggageIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const updateLuggage = (id: string, updates: Partial<LuggageFormItem>) => {
    setLuggages(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const addLuggage = () => {
    const newId = `lug-${Date.now()}`;
    setLuggages(prev => [...prev, { id: newId, size: 'medium', insuredAmount: 0, remark: '' }]);
    setExpandedLuggageIds(prev => new Set(prev).add(newId));
  };

  const removeLuggage = (id: string) => {
    if (luggages.length <= 1) return;
    setLuggages(prev => prev.filter(l => l.id !== id));
    setExpandedLuggageIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!currentUser) return;
    if (!canSubmit) return;
    if (!priceSnapshot) return;
    if (!store) return;

    const luggagesWithInsurance: Omit<LuggageItem, 'id'>[] = luggages.map(l => ({
      size: l.size,
      remark: l.remark || undefined,
      insurance: l.insuredAmount > 0
        ? {
            insuredAmount: l.insuredAmount,
            premium: calculateInsurancePremium(l.insuredAmount),
          }
        : undefined,
    }));

    const totalInsuredAmount = luggages.reduce((sum, l) => sum + l.insuredAmount, 0);

    const newOrder = createOrder({
      userId: currentUser.id,
      storeId: store.id,
      storeName: store.name,
      startTime: startDateTime,
      endTime: endDateTime,
      luggageCount: luggages.length,
      luggages: luggagesWithInsurance,
      totalAmount,
      insuranceAmount: totalInsurancePremium,
      insurance: totalInsuredAmount > 0
        ? {
            id: `ins-${Date.now()}`,
            insuredAmount: totalInsuredAmount,
            premium: totalInsurancePremium,
            status: 'active',
          }
        : null,
      priceSnapshot,
    });

    payOrder(newOrder.id);
    setShowSuccess(true);
  };

  if (!store) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500">寄存点不存在</p>
      </div>
    );
  }

  if (showSuccess) {
    const order = useOrderStore.getState().currentOrder;
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-teal-100 flex items-center justify-center">
          <CheckCircle2 className="text-teal-600" size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">支付成功</h2>
        <p className="text-slate-500 mb-8">您的寄存订单已创建成功</p>

        {order && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
            <div className="mb-6">
              <p className="text-sm text-slate-500 mb-2">取件码</p>
              <div className="text-4xl font-bold text-teal-600 font-mono tracking-widest">
                {order.pickupCode}
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">订单号</span>
                <span className="text-slate-700">{order.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">寄存点</span>
                <span className="text-slate-700">{order.storeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">支付金额</span>
                <span className="text-teal-600 font-bold">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            查看订单
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-6 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <img
            src={store.images[0]}
            alt={store.name}
            className="w-32 h-32 rounded-xl object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800">{store.name}</h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
              <MapPin size={14} />
              <span>{store.address}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <div className="flex items-center gap-1 text-amber-500">
                <Star size={14} fill="currentColor" />
                <span className="font-medium text-slate-700">{store.rating}</span>
                <span className="text-slate-400">({store.reviewCount}条评价)</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <Clock size={14} />
                <span>{store.businessHours}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <Phone size={14} />
                <span>{store.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="text-teal-600" size={20} />
          寄存时间
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              开始时间
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`flex-1 px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-colors ${
                  timeError ? 'border-red-300 focus:border-red-500 focus:bg-white' : 'border-slate-200 focus:border-teal-500 focus:bg-white'
                }`}
              />
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className={`w-28 px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-colors ${
                  timeError ? 'border-red-300 focus:border-red-500 focus:bg-white' : 'border-slate-200 focus:border-teal-500 focus:bg-white'
                }`}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              结束时间
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
                className={`flex-1 px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-colors ${
                  timeError ? 'border-red-300 focus:border-red-500 focus:bg-white' : 'border-slate-200 focus:border-teal-500 focus:bg-white'
                }`}
              />
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className={`w-28 px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-colors ${
                  timeError ? 'border-red-300 focus:border-red-500 focus:bg-white' : 'border-slate-200 focus:border-teal-500 focus:bg-white'
                }`}
              />
            </div>
          </div>
        </div>
        
        {timeError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{timeError}</p>
          </div>
        )}

        {!timeError && startDate && startTime && endDate && endTime && (
          <div className="mt-4 p-3 bg-teal-50 rounded-xl flex items-start gap-2">
            <Info size={16} className="text-teal-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-teal-700">
              预计寄存 {totalHours} 小时{isHoliday ? `，节假日加价 x${priceMultiplier}` : ''}，超时将按小时计费
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Package className="text-teal-600" size={20} />
          行李信息
          <span className="text-sm font-normal text-slate-500 ml-2">
            共 {luggages.length} 件
          </span>
        </h2>

        <div className="space-y-4">
          {luggages.map((luggage, index) => {
            const isExpanded = expandedLuggageIds.has(luggage.id);
            const insurancePremium = insurancePremiums.find(p => p.id === luggage.id)?.premium || 0;
            const luggageStoragePrice = perLuggage[index]?.amount || 0;

            return (
              <div
                key={luggage.id}
                className={`border rounded-xl overflow-hidden transition-colors ${
                  isExpanded ? 'border-teal-200 bg-teal-50/30' : 'border-slate-200'
                }`}
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => toggleLuggageExpand(luggage.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <span className="font-medium text-slate-800">
                        第{index + 1}件行李
                      </span>
                      <span className="ml-2 text-sm text-slate-500">
                        {getSizeLabel(luggage.size)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-700">
                        {formatPrice(luggageStoragePrice + insurancePremium)}
                      </div>
                      <div className="text-xs text-slate-400">
                        寄存{formatPrice(luggageStoragePrice)}
                        {insurancePremium > 0 && ` + 保价${formatPrice(insurancePremium)}`}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLuggage(luggage.id);
                      }}
                      disabled={luggages.length <= 1}
                      className={`p-2 rounded-lg transition-colors ${
                        luggages.length <= 1
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <Trash2 size={18} />
                    </button>
                    {isExpanded ? (
                      <ChevronUp size={20} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={20} className="text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100">
                    <div className="pt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        行李尺寸
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {sizeOptions.map(option => (
                          <button
                            key={option.value}
                            onClick={() => updateLuggage(luggage.id, { size: option.value })}
                            className={`p-3 rounded-xl border-2 transition-all ${
                              luggage.size === option.value
                                ? 'border-teal-500 bg-teal-50'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className={`text-sm font-bold ${
                              luggage.size === option.value ? 'text-teal-700' : 'text-slate-700'
                            }`}>
                              {option.label}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {getSizeDescription(option.value)}
                            </div>
                            <div className={`text-xs font-medium mt-1.5 ${
                              luggage.size === option.value ? 'text-teal-600' : 'text-slate-600'
                            }`}>
                              {formatPrice(priceRule ? priceRule[option.priceKey] : store[option.priceKey])}起
                              {isHoliday && <span className="text-amber-600 text-xs ml-1">节假日加价</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        保价服务
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {insuranceOptions.map(option => (
                          <button
                            key={option.amount}
                            onClick={() => updateLuggage(luggage.id, { insuredAmount: option.amount })}
                            className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                              luggage.insuredAmount === option.amount
                                ? 'border-teal-500 bg-teal-50 text-teal-700'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                            }`}
                          >
                            {option.label}
                            {option.amount > 0 && (
                              <span className="text-xs ml-1 text-slate-400">
                                (+{formatPrice(calculateInsurancePremium(option.amount))})
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        保价行李如有遗失或损坏，按保价金额赔付
                      </p>
                    </div>

                    <div className="pt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        备注 <span className="text-slate-400 font-normal">(可选)</span>
                      </label>
                      <textarea
                        value={luggage.remark}
                        onChange={e => updateLuggage(luggage.id, { remark: e.target.value })}
                        placeholder="填写行李特殊说明，如：易碎品、贵重物品等"
                        rows={2}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={addLuggage}
          className="w-full mt-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/50 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          添加行李
        </button>

        <div className="mt-4 p-3 bg-slate-50 rounded-xl">
          <p className="text-sm text-slate-700">
            可用容量 {availableCapacity}/{Math.floor(store.totalCapacity * capacityMultiplier)}
            {isHoliday && <span className="text-amber-600 ml-2">节假日倍率 x{capacityMultiplier}</span>}
          </p>
        </div>

        {capacityError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{capacityError}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <CreditCard className="text-teal-600" size={20} />
          费用明细
        </h2>
        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-700 mb-2">按件费用明细</div>
          {luggages.map((luggage, index) => {
            const storagePrice = perLuggage[index]?.amount || 0;
            const insurancePremium = insurancePremiums.find(p => p.id === luggage.id)?.premium || 0;
            const itemTotal = storagePrice + insurancePremium;

            return (
              <div key={luggage.id} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-700 font-medium">
                    第{index + 1}件 · {getSizeLabel(luggage.size)}
                  </span>
                  <span className="text-slate-800 font-bold">{formatPrice(itemTotal)}</span>
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>寄存费</span>
                    <span>{formatPrice(storagePrice)}</span>
                  </div>
                  {insurancePremium > 0 && (
                    <div className="flex justify-between">
                      <span>保价费 (保额{formatPrice(luggage.insuredAmount)})</span>
                      <span>{formatPrice(insurancePremium)}</span>
                    </div>
                  )}
                  {luggage.remark && (
                    <div className="pt-1 text-slate-400">
                      备注：{luggage.remark}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div className="border-t border-slate-100 pt-3 mt-3 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">行李寄存费合计</span>
              <span className="text-slate-700">{formatPrice(luggagePrice)}</span>
            </div>
            {isHoliday && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">节假日加价</span>
                <span className="text-amber-600">x{priceMultiplier}</span>
              </div>
            )}
            {totalInsurancePremium > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">保价费合计</span>
                <span className="text-slate-700">{formatPrice(totalInsurancePremium)}</span>
              </div>
            )}
            <div className="border-t border-slate-100 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-700">应付总额</span>
                <span className="text-xl font-bold text-teal-600">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-24">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <CreditCard className="text-teal-600" size={20} />
          支付方式
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setPaymentMethod('wechat')}
            className={`flex-1 p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
              paymentMethod === 'wechat'
                ? 'border-green-500 bg-green-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">微信</span>
            </div>
            <span className="font-medium text-slate-700">微信支付</span>
          </button>
          <button
            onClick={() => setPaymentMethod('alipay')}
            className={`flex-1 p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
              paymentMethod === 'alipay'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">支付宝</span>
            </div>
            <span className="font-medium text-slate-700">支付宝</span>
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-white/90 backdrop-blur-lg border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-slate-500">合计：</span>
                  <span className="text-2xl font-bold text-teal-600">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {luggages.length}件行李 · 基础费用 {formatPrice(luggagePrice)}
                  {totalInsurancePremium > 0 && ` + 保价 ${formatPrice(totalInsurancePremium)}`}
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`px-8 py-3 font-bold rounded-xl transition-all ${
                  canSubmit
                    ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/30 hover:shadow-teal-600/40 hover:-translate-y-0.5'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {timeError ? '时间有误' : capacityError ? '容量不足' : '立即支付'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
