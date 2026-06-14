import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Package,
  Shield,
  Plus,
  Minus,
  ChevronRight,
  Star,
  Phone,
  Info,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { useStoreStore } from '@/store/useStoreStore';
import { useOrderStore } from '@/store/useOrderStore';
import { useUserStore } from '@/store/useUserStore';
import { formatPrice, getSizeLabel, getSizeDescription, calculatePrice, calculateInsurancePremium } from '@/utils/format';
import type { LuggageSize } from '@/types';

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

export default function OrderCreate() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { getStoreById } = useStoreStore();
  const { createOrder, payOrder } = useOrderStore();
  const { currentUser } = useUserStore();

  const store = getStoreById(storeId || '');

  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedSize, setSelectedSize] = useState<LuggageSize>('medium');
  const [luggageCount, setLuggageCount] = useState(1);
  const [insuredAmount, setInsuredAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('wechat');
  const [showSuccess, setShowSuccess] = useState(false);

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

  if (!store) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500">寄存点不存在</p>
      </div>
    );
  }

  const startDateTime = `${startDate}T${startTime}:00`;
  const endDateTime = `${endDate}T${endTime}:00`;

  const sizePriceKey = sizeOptions.find(s => s.value === selectedSize)?.priceKey || 'mediumPrice';
  const basePrice = store[sizePriceKey];
  
  const totalHours = Math.max(1, Math.ceil(
    (new Date(endDateTime).getTime() - new Date(startDateTime).getTime()) / (1000 * 60 * 60)
  ));
  
  const luggagePrice = calculatePrice(basePrice, store.hourlyRate, store.dailyCap, startDateTime, endDateTime, luggageCount);
  const insurancePremium = insuredAmount > 0 ? calculateInsurancePremium(insuredAmount) * luggageCount : 0;
  const totalAmount = luggagePrice + insurancePremium;

  const handleSubmit = () => {
    if (!currentUser) return;

    const newOrder = createOrder({
      userId: currentUser.id,
      storeId: store.id,
      storeName: store.name,
      startTime: startDateTime,
      endTime: endDateTime,
      luggageCount,
      luggages: Array.from({ length: luggageCount }, () => ({
        size: selectedSize,
      })),
      totalAmount,
      insuranceAmount: insurancePremium,
      insurance: insuredAmount > 0
        ? {
            id: `ins-${Date.now()}`,
            insuredAmount,
            premium: insurancePremium,
            status: 'active',
          }
        : null,
    });

    payOrder(newOrder.id);
    setShowSuccess(true);
  };

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
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-28 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
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
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-28 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-teal-50 rounded-xl flex items-start gap-2">
          <Info size={16} className="text-teal-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-teal-700">
            预计寄存 {totalHours} 小时，超时将按小时计费
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Package className="text-teal-600" size={20} />
          行李信息
        </h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            行李尺寸
          </label>
          <div className="grid grid-cols-3 gap-3">
            {sizeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setSelectedSize(option.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedSize === option.value
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`text-lg font-bold ${
                  selectedSize === option.value ? 'text-teal-700' : 'text-slate-700'
                }`}>
                  {option.label}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {getSizeDescription(option.value)}
                </div>
                <div className={`text-sm font-medium mt-2 ${
                  selectedSize === option.value ? 'text-teal-600' : 'text-slate-600'
                }`}>
                  {formatPrice(store[option.priceKey])}起
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            行李件数
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLuggageCount(Math.max(1, luggageCount - 1))}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            >
              <Minus size={18} />
            </button>
            <span className="w-12 text-center text-xl font-bold text-slate-800">
              {luggageCount}
            </span>
            <button
              onClick={() => setLuggageCount(Math.min(10, luggageCount + 1))}
              className="w-10 h-10 rounded-xl bg-teal-100 hover:bg-teal-200 flex items-center justify-center text-teal-600 transition-colors"
            >
              <Plus size={18} />
            </button>
            <span className="text-sm text-slate-500 ml-2">件</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Shield className="text-teal-600" size={20} />
          保价服务
        </h2>
        <div className="flex flex-wrap gap-3">
          {insuranceOptions.map(option => (
            <button
              key={option.amount}
              onClick={() => setInsuredAmount(option.amount)}
              className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                insuredAmount === option.amount
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {option.label}
              {option.amount > 0 && (
                <span className="text-xs ml-1 text-slate-400">
                  (+{formatPrice(calculateInsurancePremium(option.amount))}/件)
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          保价行李如有遗失或损坏，按保价金额赔付
        </p>
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
                  基础费用 {formatPrice(luggagePrice)}
                  {insurancePremium > 0 && ` + 保价 ${formatPrice(insurancePremium)}`}
                </div>
              </div>
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/30 hover:shadow-teal-600/40 transition-all hover:-translate-y-0.5"
              >
                立即支付
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
