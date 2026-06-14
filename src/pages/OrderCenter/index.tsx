import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Package, Clock, Shield, Star, X, ArrowLeft } from 'lucide-react';
import { useOrderStore } from '@/store/useOrderStore';
import { useAdminStore } from '@/store/useAdminStore';
import { useUserStore } from '@/store/useUserStore';
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor, getSizeLabel, formatDuration, calculatePrice, isHolidayPeriod, calculateOverdueFee } from '@/utils/format';
import type { Order, OrderStatus } from '@/types';

const tabs: { key: OrderStatus | 'all' | 'active'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'picked', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

const cancelReasonOptions = ['计划变更', '找到更便宜的', '其他原因'];

export default function OrderCenter() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useUserStore();
  const { getOrdersByUserId, getOrderById, cancelOrder, renewOrder, rateOrder } = useOrderStore();
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all' | 'active'>('all');

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelCustomReason, setCancelCustomReason] = useState('');
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewEndTime, setRenewEndTime] = useState('');
  const [renewHours, setRenewHours] = useState(0);
  const [renewAmount, setRenewAmount] = useState(0);
  const [renewOverdueFee, setRenewOverdueFee] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showPickupCodeModal, setShowPickupCodeModal] = useState(false);

  const currentOrder = id ? getOrderById(id!) : null;

  useEffect(() => {
    if (id && !getOrderById(id)) {
      navigate('/orders', { replace: true });
    }
  }, [id, getOrderById, navigate]);

  useEffect(() => {
    const handlePopState = () => {
      if (location.pathname === '/orders') {
        // no-op, currentOrder is derived from URL
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [location.pathname]);

  const orders = useMemo(() => {
    if (!currentUser) return [];
    return getOrdersByUserId(currentUser.id);
  }, [currentUser, getOrdersByUserId]);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    if (activeTab === 'active') {
      return orders.filter(o => ['paid', 'stored', 'overdue'].includes(o.status));
    }
    return orders.filter(o => o.status === activeTab);
  }, [orders, activeTab]);

  const stats = useMemo(() => ({
    total: orders.length,
    active: orders.filter(o => ['paid', 'stored', 'overdue'].includes(o.status)).length,
    picked: orders.filter(o => o.status === 'picked').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }), [orders]);

  const handleViewDetail = (order: Order) => {
    navigate(`/orders/${order.id}`);
  };

  const handleCloseDetail = () => {
    navigate('/orders');
  };

  const getPriceParams = useCallback((storeId: string) => {
    const priceRule = useAdminStore.getState().getPriceRuleByStoreId(storeId);
    const hourlyRate = priceRule ? priceRule.hourlyRate : 5;
    const dailyCap = priceRule ? priceRule.dailyCap : 30;
    const basePrice = priceRule ? priceRule.basePrice : 15;
    const holidaySurcharge = priceRule ? priceRule.holidaySurcharge : 0;
    return { hourlyRate, dailyCap, basePrice, holidaySurcharge };
  }, []);

  const getHolidayMultiplier = useCallback((startTime: string, endTime: string) => {
    const holidays = useAdminStore.getState().holidayConfigs;
    const { multiplier } = isHolidayPeriod(startTime, endTime, holidays);
    return multiplier;
  }, []);

  const calculateRenewAmount = useCallback((order: Order, endDate: string, endTime: string) => {
    if (!endDate || !endTime) {
      setRenewHours(0);
      setRenewAmount(0);
      setRenewOverdueFee(0);
      return;
    }

    const currentEnd = new Date(order.endTime).getTime();
    const newEnd = new Date(`${endDate}T${endTime}:00`).getTime();

    if (newEnd <= currentEnd) {
      setRenewHours(0);
      setRenewAmount(0);
      setRenewOverdueFee(0);
      return;
    }

    const hours = Math.ceil((newEnd - currentEnd) / (1000 * 60 * 60));
    setRenewHours(hours);

    const { hourlyRate, dailyCap, basePrice, holidaySurcharge } = getPriceParams(order.storeId);
    const multiplier = getHolidayMultiplier(order.endTime, `${endDate}T${endTime}:00`);

    let overdueFee = 0;
    if (order.status === 'overdue') {
      overdueFee = calculateOverdueFee(hourlyRate, dailyCap, order.endTime, new Date().toISOString(), order.luggageCount, multiplier);
    }
    setRenewOverdueFee(overdueFee);

    const renewFee = calculatePrice(basePrice, hourlyRate, dailyCap, order.endTime, `${endDate}T${endTime}:00`, order.luggageCount, multiplier, holidaySurcharge);
    setRenewAmount(overdueFee + renewFee);
  }, [getPriceParams, getHolidayMultiplier]);

  const handleOpenRenewModal = () => {
    if (!currentOrder) return;
    setRenewEndDate('');
    setRenewEndTime('');
    setRenewHours(0);
    setRenewAmount(0);
    setRenewOverdueFee(0);
    setShowRenewModal(true);
  };

  const handleRenewEndDateChange = (date: string) => {
    setRenewEndDate(date);
    if (currentOrder && date && renewEndTime) {
      calculateRenewAmount(currentOrder, date, renewEndTime);
    }
  };

  const handleRenewEndTimeChange = (time: string) => {
    setRenewEndTime(time);
    if (currentOrder && renewEndDate && time) {
      calculateRenewAmount(currentOrder, renewEndDate, time);
    }
  };

  const handleConfirmRenew = () => {
    if (!currentOrder || !renewEndDate || !renewEndTime || renewAmount <= 0) return;
    const newEndTime = `${renewEndDate}T${renewEndTime}:00`;
    renewOrder(currentOrder.id, newEndTime, renewAmount);
    setShowRenewModal(false);
  };

  const handleOpenCancelModal = () => {
    setCancelReason('');
    setCancelCustomReason('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    if (!currentOrder) return;
    const reason = cancelReason === '其他原因' ? cancelCustomReason : cancelReason;
    if (!reason.trim()) return;
    cancelOrder(currentOrder.id, reason.trim());
    setShowCancelModal(false);
  };

  const handleOpenReviewModal = () => {
    setReviewRating(currentOrder?.rating || 5);
    setReviewComment(currentOrder?.review || '');
    setShowReviewModal(true);
  };

  const handleConfirmReview = () => {
    if (!currentOrder) return;
    rateOrder(currentOrder.id, reviewRating, reviewComment.trim());
    setShowReviewModal(false);
  };

  if (currentOrder && id) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <button
            onClick={handleCloseDetail}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={16} />
            返回订单列表
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-5">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-teal-100 text-sm">订单状态</p>
                <h2 className="text-xl font-bold mt-1">{getStatusLabel(currentOrder.status)}</h2>
              </div>
              <div className="text-right">
                <p className="text-teal-100 text-sm">订单金额</p>
                <p className="text-2xl font-bold mt-1">{formatPrice(currentOrder.totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                <Package size={16} className="text-teal-600" />
                寄存点信息
              </h3>
              <p className="text-slate-700">{currentOrder.storeName}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                <Clock size={16} className="text-teal-600" />
                寄存时间
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">开始时间</span>
                  <span className="text-slate-700">{formatDateTime(currentOrder.startTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">结束时间</span>
                  <span className="text-slate-700">{formatDateTime(currentOrder.endTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">寄存时长</span>
                  <span className="text-slate-700">{formatDuration(currentOrder.startTime, currentOrder.endTime)}</span>
                </div>
                {currentOrder.renewCount && currentOrder.renewCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">续存次数</span>
                    <span className="text-amber-600 font-medium">{currentOrder.renewCount} 次</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                <Package size={16} className="text-teal-600" />
                行李信息
              </h3>
              <div className="space-y-3">
                {currentOrder.luggages.map((luggage, index) => (
                  <div key={luggage.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <span className="text-slate-700 font-medium">
                        行李 {index + 1}
                      </span>
                      <span className="text-slate-500 text-sm ml-2">{getSizeLabel(luggage.size)}</span>
                    </div>
                    {luggage.lockerNo && (
                      <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium">
                        柜位 {luggage.lockerNo}
                      </span>
                    )}
                    {luggage.photoUrl && (
                      <img
                        src={luggage.photoUrl}
                        alt={`行李${index + 1}`}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {currentOrder.insurance && (
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                  <Shield size={16} className="text-teal-600" />
                  保价服务
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">保价金额</span>
                    <span className="text-slate-700">¥{currentOrder.insurance.insuredAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">保费</span>
                    <span className="text-slate-700">{formatPrice(currentOrder.insuranceAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-xl">
              <h3 className="font-medium text-slate-800 mb-3">订单信息</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">订单号</span>
                  <span className="text-slate-700 font-mono">{currentOrder.orderNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">下单时间</span>
                  <span className="text-slate-700">{formatDateTime(currentOrder.createdAt)}</span>
                </div>
                {currentOrder.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">支付时间</span>
                    <span className="text-slate-700">{formatDateTime(currentOrder.paidAt)}</span>
                  </div>
                )}
                {currentOrder.storedAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">入库时间</span>
                    <span className="text-slate-700">{formatDateTime(currentOrder.storedAt)}</span>
                  </div>
                )}
                {currentOrder.pickedAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">取件时间</span>
                    <span className="text-slate-700">{formatDateTime(currentOrder.pickedAt)}</span>
                  </div>
                )}
                {currentOrder.cancelReason && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">取消原因</span>
                    <span className="text-red-600">{currentOrder.cancelReason}</span>
                  </div>
                )}
                {currentOrder.additionalAmount && currentOrder.additionalAmount > 0 && (
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-amber-600">续存费用</span>
                    <span className="text-amber-600 font-medium">+{formatPrice(currentOrder.additionalAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {currentOrder.rating && (
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-medium text-slate-800 mb-3">我的评价</h3>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      size={18}
                      className={i <= (currentOrder.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
                    />
                  ))}
                </div>
                {currentOrder.review && (
                  <p className="text-sm text-slate-600">{currentOrder.review}</p>
                )}
              </div>
            )}

            {currentOrder.status === 'stored' && currentOrder.pickupCode && (
              <div className="p-5 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center justify-between">
                  <span className="text-amber-700 font-medium">取件码</span>
                  <span className="text-3xl font-bold text-amber-700 font-mono tracking-widest">
                    {currentOrder.pickupCode}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
            {currentOrder.status === 'paid' && (
              <button
                onClick={() => setShowPickupCodeModal(true)}
                className="flex-1 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
              >
                查看取件码
              </button>
            )}
            {currentOrder.status === 'stored' && (
              <button
                onClick={handleOpenRenewModal}
                className="flex-1 px-5 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-white transition-colors"
              >
                申请续存
              </button>
            )}
            {['paid', 'pending'].includes(currentOrder.status) && (
              <button
                onClick={handleOpenCancelModal}
                className="flex-1 px-5 py-2.5 border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors"
              >
                取消订单
              </button>
            )}
            {currentOrder.status === 'picked' && (
              <button
                onClick={handleOpenReviewModal}
                className="flex-1 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <Star size={16} />
                去评价
              </button>
            )}
          </div>
        </div>

        {showPickupCodeModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowPickupCodeModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">取件码</h3>
                <button onClick={() => setShowPickupCodeModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm mb-3">请向工作人员出示以下取件码</p>
                <p className="text-5xl font-bold text-teal-600 font-mono tracking-[0.3em]">
                  {currentOrder.pickupCode}
                </p>
              </div>
              <button
                onClick={() => setShowPickupCodeModal(false)}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
              >
                我知道了
              </button>
            </div>
          </div>
        )}

        {showCancelModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCancelModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">取消订单</h3>
                <button onClick={() => setShowCancelModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4">请选择取消原因：</p>
              <div className="space-y-2 mb-4">
                {cancelReasonOptions.map(option => (
                  <label
                    key={option}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      cancelReason === option
                        ? 'border-red-300 bg-red-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      cancelReason === option ? 'border-red-500' : 'border-slate-300'
                    }`}>
                      {cancelReason === option && <div className="w-2 h-2 rounded-full bg-red-500" />}
                    </div>
                    <span className="text-slate-700 text-sm">{option}</span>
                  </label>
                ))}
              </div>
              {cancelReason === '其他原因' && (
                <textarea
                  value={cancelCustomReason}
                  onChange={e => setCancelCustomReason(e.target.value)}
                  placeholder="请输入取消原因..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-red-300 mb-4"
                  rows={3}
                />
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                >
                  再想想
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={!cancelReason || (cancelReason === '其他原因' && !cancelCustomReason.trim())}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认取消
                </button>
              </div>
            </div>
          </div>
        )}

        {showRenewModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowRenewModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">申请续存</h3>
                <button onClick={() => setShowRenewModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">续存截止日期</label>
                  <input
                    type="date"
                    value={renewEndDate}
                    onChange={e => handleRenewEndDateChange(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-300"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">续存截止时间</label>
                  <input
                    type="time"
                    value={renewEndTime}
                    onChange={e => handleRenewEndTimeChange(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-300"
                  />
                </div>
                {renewHours > 0 && (
                  <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">续存时长</span>
                      <span className="text-slate-700">{renewHours} 小时</span>
                    </div>
                    {renewOverdueFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-red-500">逾期费用</span>
                        <span className="text-red-500">{formatPrice(renewOverdueFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <span className="text-slate-700 font-medium">合计费用</span>
                      <span className="text-teal-600 font-bold">{formatPrice(renewAmount)}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRenewModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmRenew}
                  disabled={!renewEndDate || !renewEndTime || renewAmount <= 0}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认续存
                </button>
              </div>
            </div>
          </div>
        )}

        {showReviewModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowReviewModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">评价订单</h3>
                <button onClick={() => setShowReviewModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-2">评分</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <button
                        key={i}
                        onClick={() => setReviewRating(i)}
                        className="p-0.5 transition-transform hover:scale-110"
                      >
                        <Star
                          size={32}
                          className={i <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
                        />
                      </button>
                    ))}
                    <span className="text-sm text-slate-500 ml-2">{reviewRating} 星</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">文字评价</label>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="分享您的寄存体验..."
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-amber-300"
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmReview}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors"
                >
                  提交评价
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">我的订单</h1>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-sm text-slate-500 mt-1">全部订单</div>
          </div>
          <div className="text-center p-4 bg-teal-50 rounded-xl">
            <div className="text-2xl font-bold text-teal-600">{stats.active}</div>
            <div className="text-sm text-slate-500 mt-1">进行中</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-slate-800">{stats.picked}</div>
            <div className="text-sm text-slate-500 mt-1">已完成</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-slate-400">{stats.cancelled}</div>
            <div className="text-sm text-slate-500 mt-1">已取消</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
        <div className="flex border-b border-slate-100">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-teal-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-teal-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {filteredOrders.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredOrders.map(order => (
              <div
                key={order.id}
                onClick={() => handleViewDetail(order)}
                className="p-5 hover:bg-slate-50/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-500">{order.orderNo}</span>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center flex-shrink-0">
                    <Package className="text-teal-600" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-800 truncate">{order.storeName}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {formatDuration(order.startTime, order.endTime)} · {order.luggageCount}件
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-teal-600">{formatPrice(order.totalAmount)}</div>
                  </div>
                </div>
                {order.status === 'stored' && order.pickupCode && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-amber-700">取件码</span>
                    <span className="text-lg font-bold text-amber-700 font-mono tracking-widest">
                      {order.pickupCode}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Package size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-500">暂无订单</p>
          </div>
        )}
      </div>
    </div>
  );
}
