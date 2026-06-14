import { useState, useMemo } from 'react';
import {
  Package,
  QrCode,
  Clock,
  TrendingUp,
  CheckCircle,
  Camera,
  Layers,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowRight,
  Store,
  Phone,
  X,
  Edit3,
  Clock3,
  Plus,
  Upload,
} from 'lucide-react';
import { useOrderStore } from '@/store/useOrderStore';
import { useUserStore } from '@/store/useUserStore';
import { useStoreStore } from '@/store/useStoreStore';
import { useAdminStore } from '@/store/useAdminStore';
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor, getSizeLabel, calculatePrice, isHolidayPeriod, calculateOverdueFee } from '@/utils/format';
import type { Order } from '@/types';

type ModalType = 'store' | 'pickup' | 'overdue' | 'renew' | 'locker' | null;

export default function StoreWorkbench() {
  const { currentUser } = useUserStore();
  const { getOrdersByStoreId, storeLuggage, pickupLuggage, updateLocker, markOverdue, renewOrder, getOrderByPickupCode } = useOrderStore();
  const { getStoreById } = useStoreStore();

  const [activeTab, setActiveTab] = useState<'stored' | 'today'>('stored');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scanCode, setScanCode] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [lockerInputs, setLockerInputs] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [newLockerNo, setNewLockerNo] = useState('');
  const [selectedLuggageIndex, setSelectedLuggageIndex] = useState(0);
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewEndTime, setRenewEndTime] = useState('');
  const [renewHours, setRenewHours] = useState(0);
  const [renewAmount, setRenewAmount] = useState(0);
  const [renewOverdueFee, setRenewOverdueFee] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const storeId = currentUser?.storeId || 'store-001';
  const store = getStoreById(storeId);
  const storeOrders = getOrdersByStoreId(storeId);

  const storedOrders = storeOrders.filter(o => o.status === 'stored' || o.status === 'overdue');
  const todayOrders = storeOrders.filter(o => {
    const today = new Date().toDateString();
    return new Date(o.createdAt).toDateString() === today;
  });

  const filteredStoredOrders = useMemo(() => {
    if (!searchQuery) return storedOrders;
    const query = searchQuery.toLowerCase();
    return storedOrders.filter(o =>
      o.orderNo.toLowerCase().includes(query) ||
      o.pickupCode.toLowerCase().includes(query)
    );
  }, [storedOrders, searchQuery]);

  const todayStats = {
    stored: todayOrders.filter(o => o.status === 'stored' || o.status === 'picked').length,
    picked: todayOrders.filter(o => o.status === 'picked').length,
    revenue: todayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    inCabinet: storedOrders.length,
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const getPriceParams = () => {
    const priceRule = useAdminStore.getState().getPriceRuleByStoreId(storeId);
    const hourlyRate = priceRule ? priceRule.hourlyRate : (store?.hourlyRate || 5);
    const dailyCap = priceRule ? priceRule.dailyCap : (store?.dailyCap || 30);
    const basePrice = priceRule ? priceRule.basePrice : (store?.basePrice || 15);
    const holidaySurcharge = priceRule ? priceRule.holidaySurcharge : 0;
    return { hourlyRate, dailyCap, basePrice, holidaySurcharge };
  };

  const getHolidayMultiplier = (startTime: string, endTime: string) => {
    const holidays = useAdminStore.getState().holidayConfigs;
    const { multiplier } = isHolidayPeriod(startTime, endTime, holidays);
    return multiplier;
  };

  const calculateRenewAmount = (order: Order, endDate: string, endTime: string) => {
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

    const { hourlyRate, dailyCap, basePrice, holidaySurcharge } = getPriceParams();
    const multiplier = getHolidayMultiplier(order.endTime, `${endDate}T${endTime}:00`);

    let overdueFee = 0;
    if (order.status === 'overdue') {
      overdueFee = calculateOverdueFee(hourlyRate, dailyCap, order.endTime, new Date().toISOString(), order.luggageCount, multiplier);
    }
    setRenewOverdueFee(overdueFee);

    const renewFee = calculatePrice(basePrice, hourlyRate, dailyCap, order.endTime, `${endDate}T${endTime}:00`, order.luggageCount, multiplier, holidaySurcharge);
    setRenewAmount(overdueFee + renewFee);
  };

  const getPickupOverdueFee = (order: Order) => {
    if (order.status !== 'overdue') return 0;
    const { hourlyRate, dailyCap } = getPriceParams();
    const multiplier = getHolidayMultiplier(order.endTime, new Date().toISOString());
    return calculateOverdueFee(hourlyRate, dailyCap, order.endTime, new Date().toISOString(), order.luggageCount, multiplier);
  };

  const handleScan = () => {
    if (!scanCode.trim()) return;

    const order = getOrderByPickupCode(scanCode.trim());
    if (!order) {
      alert('订单不存在，请检查取件码');
      return;
    }

    if (order.storeId !== storeId) {
      alert('该订单不属于当前门店');
      return;
    }

    setFoundOrder(order);
    setSelectedOrder(order);

    if (activeModal === 'store' && order.status === 'paid') {
      setLockerInputs(order.luggages.map(() => ''));
      setPhotoUrls(order.luggages.map(() => ''));
    } else if (activeModal === 'locker' && (order.status === 'stored' || order.status === 'overdue')) {
      setSelectedLuggageIndex(0);
      setNewLockerNo(order.luggages[0]?.lockerNo || '');
    } else if (activeModal === 'renew' && (order.status === 'stored' || order.status === 'overdue')) {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      setRenewEndDate(tomorrow.toISOString().split('T')[0]);
      setRenewEndTime('18:00');
      calculateRenewAmount(order, tomorrow.toISOString().split('T')[0], '18:00');
    } else if (activeModal === 'pickup' && (order.status === 'stored' || order.status === 'overdue')) {
      // 直接确认取件
    } else if (activeModal === 'overdue' && order.status === 'stored') {
      // 标记超时
    } else {
      alert(`订单当前状态为「${getStatusLabel(order.status)}」，无法执行此操作`);
    }
  };

  const handleStoreLuggage = () => {
    if (!foundOrder) return;

    const emptyLockers = lockerInputs.filter(l => !l.trim());
    if (emptyLockers.length > 0) {
      alert('请为所有行李分配柜位号');
      return;
    }

    const hasPhotos = photoUrls.some(p => p.trim());
    if (!hasPhotos) {
      if (!confirm('未上传行李照片，是否继续入库？')) return;
    }

    storeLuggage(foundOrder.id, lockerInputs, photoUrls);
    closeModal();
    showSuccess('入库成功！行李已安全存放');
  };

  const handlePickup = () => {
    if (!foundOrder && !selectedOrder) return;
    const order = foundOrder || selectedOrder;
    if (!order) return;
    const orderId = order.id;

    if (order.status === 'overdue') {
      const overdueFee = getPickupOverdueFee(order);
      renewOrder(orderId, order.endTime, overdueFee);
    }

    pickupLuggage(orderId);
    closeModal();

    if (order.status === 'overdue') {
      const overdueFee = getPickupOverdueFee(order);
      showSuccess(`取件成功！超时费用 ${formatPrice(overdueFee)} 已追加`);
    } else {
      showSuccess('取件成功！感谢您的使用');
    }
  };

  const handleUpdateLocker = () => {
    if (!selectedOrder) return;
    if (!newLockerNo.trim()) {
      alert('请输入新的柜位号');
      return;
    }

    updateLocker(selectedOrder.id, selectedLuggageIndex, newLockerNo.trim());
    closeModal();
    showSuccess('柜位已更新');
  };

  const handleMarkOverdue = () => {
    if (!foundOrder && !selectedOrder) return;
    const orderId = foundOrder?.id || selectedOrder?.id;
    if (!orderId) return;

    if (!confirm('确定要将此订单标记为超时吗？')) return;

    markOverdue(orderId);
    closeModal();
    showSuccess('已标记为超时订单');
  };

  const handleRenew = () => {
    if (!selectedOrder) return;
    if (renewHours <= 0 || renewAmount <= 0) {
      alert('请选择有效的续存时间');
      return;
    }

    const newEndTime = `${renewEndDate}T${renewEndTime}:00`;
    renewOrder(selectedOrder.id, newEndTime, renewAmount);
    closeModal();

    if (renewOverdueFee > 0) {
      showSuccess(`续存成功！超时补费 ${formatPrice(renewOverdueFee)}，续存费用 ${formatPrice(renewAmount - renewOverdueFee)}，合计 ${formatPrice(renewAmount)}`);
    } else {
      showSuccess(`续存成功！延长${renewHours}小时，费用${formatPrice(renewAmount)}`);
    }
  };

  const openModal = (type: ModalType, order?: Order) => {
    setActiveModal(type);
    if (order) {
      setSelectedOrder(order);
      setFoundOrder(order);
      if (type === 'locker') {
        setSelectedLuggageIndex(0);
        setNewLockerNo(order.luggages[0]?.lockerNo || '');
      } else if (type === 'renew') {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        setRenewEndDate(tomorrow.toISOString().split('T')[0]);
        setRenewEndTime('18:00');
        calculateRenewAmount(order, tomorrow.toISOString().split('T')[0], '18:00');
      }
    } else {
      setFoundOrder(null);
      setSelectedOrder(null);
      setScanCode('');
    }
    setLockerInputs([]);
    setPhotoUrls([]);
  };

  const closeModal = () => {
    setActiveModal(null);
    setFoundOrder(null);
    setSelectedOrder(null);
    setScanCode('');
    setLockerInputs([]);
    setPhotoUrls([]);
    setNewLockerNo('');
    setRenewEndDate('');
    setRenewEndTime('');
    setRenewHours(0);
    setRenewAmount(0);
    setRenewOverdueFee(0);
  };

  const quickActions = [
    { icon: QrCode, label: '扫码入库', color: 'from-teal-500 to-teal-600', type: 'store' as ModalType, desc: '扫描支付订单分配柜位' },
    { icon: CheckCircle, label: '取件确认', color: 'from-emerald-500 to-emerald-600', type: 'pickup' as ModalType, desc: '核验取件码完成取件' },
    { icon: AlertTriangle, label: '超时处理', color: 'from-amber-500 to-amber-600', type: 'overdue' as ModalType, desc: '登记超期未取订单' },
    { icon: RefreshCw, label: '续存办理', color: 'from-blue-500 to-blue-600', type: 'renew' as ModalType, desc: '延长寄存时间' },
  ];

  const getModalTitle = () => {
    switch (activeModal) {
      case 'store': return '扫码入库';
      case 'pickup': return '取件确认';
      case 'overdue': return '超时登记';
      case 'renew': return '续存办理';
      case 'locker': return '修改柜位';
      default: return '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {successMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-emerald-500 text-white rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle size={18} />
          {successMessage}
        </div>
      )}

      <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 rounded-3xl p-6 md:p-8 text-white mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Store size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold">{store?.name || '门店工作台'}</h1>
            <p className="text-teal-100 text-sm">{store?.address}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Package size={16} />
              </div>
              <span className="text-teal-100 text-sm">今日寄存</span>
            </div>
            <div className="text-2xl font-bold">{todayStats.stored}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <CheckCircle size={16} />
              </div>
              <span className="text-teal-100 text-sm">今日取件</span>
            </div>
            <div className="text-2xl font-bold">{todayStats.picked}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
              <span className="text-teal-100 text-sm">今日营收</span>
            </div>
            <div className="text-2xl font-bold">{formatPrice(todayStats.revenue)}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Layers size={16} />
              </div>
              <span className="text-teal-100 text-sm">当前在柜</span>
            </div>
            <div className="text-2xl font-bold">{todayStats.inCabinet}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {quickActions.map(item => (
          <button
            key={item.type}
            onClick={() => openModal(item.type)}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all duration-300 text-left"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 shadow-lg`}>
              <item.icon className="text-white" size={24} />
            </div>
            <h3 className="font-bold text-slate-800">{item.label}</h3>
            <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('stored')}
            className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
              activeTab === 'stored' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            在柜行李 ({storedOrders.length})
            {activeTab === 'stored' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-teal-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
              activeTab === 'today' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            今日订单 ({todayOrders.length})
            {activeTab === 'today' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-teal-600 rounded-full" />
            )}
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'stored' && (
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="搜索订单号、取件码..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-teal-500 transition-colors"
              />
            </div>
          )}

          <div className="divide-y divide-slate-100">
            {(activeTab === 'stored' ? filteredStoredOrders : todayOrders).map(order => (
              <div key={order.id} className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-800">{order.orderNo}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    {order.renewCount && order.renewCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                        已续存{order.renewCount}次
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-teal-600 font-bold">{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                  <span>取件码：<span className="font-mono font-bold text-slate-700">{order.pickupCode}</span></span>
                  <span>{order.luggageCount}件</span>
                  <span>{formatDateTime(order.storedAt || order.createdAt)}</span>
                  {order.additionalAmount && order.additionalAmount > 0 && (
                    <span className="text-amber-600">续存费 +{formatPrice(order.additionalAmount)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {order.luggages.map((lug, i) => (
                    <span key={i} className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-md flex items-center gap-1">
                      {getSizeLabel(lug.size)}
                      {lug.lockerNo && (
                        <span className="text-teal-600 font-medium">· {lug.lockerNo}</span>
                      )}
                      {lug.photoUrl && (
                        <span className="text-green-600">· 已拍照</span>
                      )}
                    </span>
                  ))}
                </div>
                {order.status === 'stored' && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => openModal('locker', order)}
                      className="px-3 py-1.5 text-xs bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-1"
                    >
                      <Edit3 size={12} />
                      修改柜位
                    </button>
                    <button
                      onClick={() => openModal('renew', order)}
                      className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                      <Clock3 size={12} />
                      续存
                    </button>
                    <button
                      onClick={() => openModal('overdue', order)}
                      className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1"
                    >
                      <AlertTriangle size={12} />
                      标记超时
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        openModal('pickup', order);
                      }}
                      className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle size={12} />
                      确认取件
                    </button>
                  </div>
                )}
                {order.status === 'overdue' && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => openModal('locker', order)}
                      className="px-3 py-1.5 text-xs bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-1"
                    >
                      <Edit3 size={12} />
                      修改柜位
                    </button>
                    <button
                      onClick={() => openModal('renew', order)}
                      className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                      <Clock3 size={12} />
                      续存
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        openModal('pickup', order);
                      }}
                      className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle size={12} />
                      确认取件
                    </button>
                  </div>
                )}
              </div>
            ))}
            {(activeTab === 'stored' ? filteredStoredOrders : todayOrders).length === 0 && (
              <div className="py-12 text-center">
                <Package className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-400">暂无数据</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">{getModalTitle()}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6">
              {!foundOrder && !selectedOrder ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <QrCode size={48} className="text-slate-400" />
                    </div>
                    <p className="text-slate-600">扫描取件码或手动输入</p>
                  </div>
                  <div className="relative mb-4">
                    <input
                      type="text"
                      value={scanCode}
                      onChange={e => setScanCode(e.target.value.toUpperCase())}
                      placeholder="输入取件码"
                      maxLength={6}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold text-center text-slate-800 font-mono tracking-widest focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <button
                    onClick={handleScan}
                    disabled={!scanCode.trim()}
                    className={`w-full py-3 font-medium rounded-xl transition-colors ${
                      scanCode.trim()
                        ? 'bg-teal-600 hover:bg-teal-700 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    核验
                  </button>
                </>
              ) : activeModal === 'store' && foundOrder?.status === 'paid' ? (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-slate-500 mb-1">订单号</p>
                    <p className="font-bold text-slate-800">{foundOrder.orderNo}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-slate-500 mb-1">取件码</p>
                    <p className="text-2xl font-bold text-teal-600 font-mono tracking-widest">
                      {foundOrder.pickupCode}
                    </p>
                  </div>
                  <div className="mb-4 p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm font-medium text-slate-700 mb-3">行李信息 · 分配柜位</p>
                    {foundOrder.luggages.map((lug, i) => (
                      <div key={i} className="mb-4 last:mb-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-600">
                            行李 {i + 1}：{getSizeLabel(lug.size)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="柜位号"
                            value={lockerInputs[i] || ''}
                            onChange={e => {
                              const newLockers = [...lockerInputs];
                              newLockers[i] = e.target.value;
                              setLockerInputs(newLockers);
                            }}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                          />
                          <input
                            type="text"
                            placeholder="照片URL（可选）"
                            value={photoUrls[i] || ''}
                            onChange={e => {
                              const newPhotos = [...photoUrls];
                              newPhotos[i] = e.target.value;
                              setPhotoUrls(newPhotos);
                            }}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 text-sm"
                          />
                        </div>
                        {photoUrls[i] && (
                          <img
                            src={photoUrls[i]}
                            alt={`行李${i + 1}`}
                            className="mt-2 w-full h-32 object-cover rounded-lg"
                            onError={e => (e.currentTarget.style.display = 'none')}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleStoreLuggage}
                      className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
                    >
                      确认入库
                    </button>
                    <button
                      onClick={closeModal}
                      className="px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </>
              ) : activeModal === 'pickup' && (foundOrder?.status === 'stored' || foundOrder?.status === 'overdue') ? (
                (() => {
                  const pickupOrder = foundOrder || selectedOrder;
                  const overdueFee = pickupOrder?.status === 'overdue' && pickupOrder ? getPickupOverdueFee(pickupOrder) : 0;
                  return (
                    <>
                      <div className="mb-4">
                        <p className="text-sm text-slate-500 mb-1">订单号</p>
                        <p className="font-bold text-slate-800">{pickupOrder?.orderNo}</p>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm text-slate-500 mb-1">取件码</p>
                        <p className="text-2xl font-bold text-teal-600 font-mono tracking-widest">
                          {pickupOrder?.pickupCode}
                        </p>
                      </div>
                      <div className="mb-4 p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm font-medium text-slate-700 mb-2">行李信息</p>
                        {pickupOrder?.luggages.map((lug, i) => (
                          <div key={i} className="flex items-center justify-between py-2">
                            <span className="text-sm text-slate-600">
                              行李 {i + 1}：{getSizeLabel(lug.size)}
                            </span>
                            <span className="text-sm font-medium text-teal-600">
                              {lug.lockerNo || '未分配'}
                            </span>
                          </div>
                        ))}
                      </div>
                      {pickupOrder?.status === 'overdue' && (
                        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                          <p className="text-sm text-amber-700 font-medium mb-2">
                            <AlertTriangle size={14} className="inline mr-1" />
                            此订单已超时，需追加超时费用
                          </p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-amber-600">原定取件时间</span>
                              <span className="text-amber-800">{formatDateTime(pickupOrder.endTime)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-amber-600">超时费用</span>
                              <span className="text-amber-800 font-bold">{formatPrice(overdueFee)}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-1 border-t border-amber-200">
                              <span className="text-amber-600">应付总额</span>
                              <span className="text-amber-800 font-bold">{formatPrice(pickupOrder.totalAmount + overdueFee)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <button
                          onClick={handlePickup}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
                        >
                          {pickupOrder?.status === 'overdue'
                            ? `确认取件（含超时费 ${formatPrice(overdueFee)}）`
                            : '确认取件'}
                        </button>
                        <button
                          onClick={closeModal}
                          className="px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </>
                  );
                })()
              ) : activeModal === 'locker' && selectedOrder ? (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-slate-500 mb-1">订单号</p>
                    <p className="font-bold text-slate-800">{selectedOrder.orderNo}</p>
                  </div>
                  <div className="mb-4 p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm font-medium text-slate-700 mb-3">选择行李</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedOrder.luggages.map((lug, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedLuggageIndex(i);
                            setNewLockerNo(lug.lockerNo || '');
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedLuggageIndex === i
                              ? 'bg-teal-600 text-white'
                              : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300'
                          }`}
                        >
                          行李 {i + 1} · {getSizeLabel(lug.size)}
                        </button>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-2">当前柜位</p>
                      <p className="text-lg font-bold text-slate-800 mb-3">
                        {selectedOrder.luggages[selectedLuggageIndex]?.lockerNo || '未分配'}
                      </p>
                      <p className="text-sm text-slate-500 mb-2">新柜位号</p>
                      <input
                        type="text"
                        value={newLockerNo}
                        onChange={e => setNewLockerNo(e.target.value)}
                        placeholder="输入新柜位号"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdateLocker}
                      className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
                    >
                      确认修改
                    </button>
                    <button
                      onClick={closeModal}
                      className="px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </>
              ) : activeModal === 'overdue' && foundOrder?.status === 'stored' ? (
                <>
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertTriangle size={32} className="text-amber-500" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">确认标记为超时？</h4>
                    <p className="text-slate-500 text-sm mb-4">
                      订单 {foundOrder.orderNo} 已超过取件时间，标记为超时后将产生超时费用
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-500">原定取件时间</span>
                      <span className="text-slate-700">{formatDateTime(foundOrder.endTime)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">行李数量</span>
                      <span className="text-slate-700">{foundOrder.luggageCount} 件</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleMarkOverdue}
                      className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors"
                    >
                      确认标记超时
                    </button>
                    <button
                      onClick={closeModal}
                      className="px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </>
              ) : activeModal === 'renew' && selectedOrder ? (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-slate-500 mb-1">订单号</p>
                    <p className="font-bold text-slate-800">{selectedOrder.orderNo}</p>
                  </div>
                  <div className="mb-4 p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500 mb-2">当前到期时间</p>
                    <p className="text-lg font-bold text-slate-800">
                      {formatDateTime(selectedOrder.endTime)}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      延长至
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={renewEndDate}
                        onChange={e => {
                          setRenewEndDate(e.target.value);
                          calculateRenewAmount(selectedOrder, e.target.value, renewEndTime);
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                      <input
                        type="time"
                        value={renewEndTime}
                        onChange={e => {
                          setRenewEndTime(e.target.value);
                          calculateRenewAmount(selectedOrder, renewEndDate, e.target.value);
                        }}
                        className="w-28 px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  {renewHours > 0 && (
                    <div className="mb-4 p-4 bg-teal-50 rounded-xl">
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-600">续存时长</span>
                        <span className="font-bold text-teal-700">{renewHours} 小时</span>
                      </div>
                      {renewOverdueFee > 0 && (
                        <>
                          <div className="flex justify-between mb-2">
                            <span className="text-amber-600">超时补费</span>
                            <span className="font-bold text-amber-700">{formatPrice(renewOverdueFee)}</span>
                          </div>
                          <div className="flex justify-between mb-2">
                            <span className="text-slate-600">续存费用</span>
                            <span className="font-bold text-teal-700">{formatPrice(renewAmount - renewOverdueFee)}</span>
                          </div>
                          <div className="border-t border-teal-200 my-2" />
                          <div className="flex justify-between">
                            <span className="text-slate-700 font-medium">合计费用</span>
                            <span className="font-bold text-teal-800">{formatPrice(renewAmount)}</span>
                          </div>
                        </>
                      )}
                      {renewOverdueFee === 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">续存费用</span>
                          <span className="font-bold text-teal-700">{formatPrice(renewAmount)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={handleRenew}
                      disabled={renewHours <= 0}
                      className={`flex-1 py-3 font-medium rounded-xl transition-colors ${
                        renewHours > 0
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      确认续存
                    </button>
                    <button
                      onClick={closeModal}
                      className="px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center py-8">
                    <AlertTriangle className="mx-auto text-amber-400 mb-3" size={48} />
                    <p className="text-slate-600 mb-2">订单状态不支持此操作</p>
                    <p className="text-sm text-slate-400">
                      当前状态：{getStatusLabel(foundOrder?.status || 'pending')}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="w-full py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    返回
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
