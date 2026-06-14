import { useState } from 'react';
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
} from 'lucide-react';
import { useOrderStore } from '@/store/useOrderStore';
import { useUserStore } from '@/store/useUserStore';
import { useStoreStore } from '@/store/useStoreStore';
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor, getSizeLabel } from '@/utils/format';
import type { Order } from '@/types';

const menuItems = [
  { icon: QrCode, label: '扫码入库', color: 'from-teal-500 to-teal-600', key: 'store' },
  { icon: CheckCircle, label: '取件确认', color: 'from-emerald-500 to-emerald-600', key: 'pickup' },
  { icon: AlertTriangle, label: '超时管理', color: 'from-amber-500 to-amber-600', key: 'overdue' },
  { icon: RefreshCw, label: '续存办理', color: 'from-blue-500 to-blue-600', key: 'renew' },
];

export default function StoreWorkbench() {
  const { currentUser } = useUserStore();
  const { getOrdersByStoreId, storeLuggage, pickupLuggage } = useOrderStore();
  const { getStoreById } = useStoreStore();
  const [activeTab, setActiveTab] = useState<'stored' | 'today'>('stored');
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [scanCode, setScanCode] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [selectedLockers, setSelectedLockers] = useState<string[]>([]);

  const storeId = currentUser?.storeId || 'store-001';
  const store = getStoreById(storeId);
  const storeOrders = getOrdersByStoreId(storeId);

  const storedOrders = storeOrders.filter(o => o.status === 'stored');
  const todayOrders = storeOrders.filter(o => {
    const today = new Date().toDateString();
    return new Date(o.createdAt).toDateString() === today;
  });

  const todayStats = {
    stored: todayOrders.filter(o => o.status === 'stored' || o.status === 'picked').length,
    picked: todayOrders.filter(o => o.status === 'picked').length,
    revenue: todayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    inCabinet: storedOrders.length,
  };

  const handleScan = () => {
    const order = useOrderStore.getState().getOrderByPickupCode(scanCode);
    if (order && order.status === 'paid') {
      setFoundOrder(order);
      setSelectedLockers(order.luggages.map(() => ''));
    } else if (order && order.status === 'stored') {
      setFoundOrder(order);
      setSelectedLockers(order.luggages.map(l => l.lockerNo || ''));
    } else {
      setFoundOrder(null);
      alert('订单不存在或状态不正确');
    }
  };

  const handleStoreLuggage = () => {
    if (!foundOrder) return;
    storeLuggage(foundOrder.id, selectedLockers);
    setShowStoreModal(false);
    setScanCode('');
    setFoundOrder(null);
    setSelectedLockers([]);
    alert('入库成功！');
  };

  const handlePickup = () => {
    if (!foundOrder) return;
    pickupLuggage(foundOrder.id);
    setShowStoreModal(false);
    setScanCode('');
    setFoundOrder(null);
    setSelectedLockers([]);
    alert('取件成功！');
  };

  return (
    <div className="max-w-5xl mx-auto">
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
        {menuItems.map(item => (
          <button
            key={item.key}
            onClick={() => setShowStoreModal(true)}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all duration-300 text-left"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 shadow-lg`}>
              <item.icon className="text-white" size={24} />
            </div>
            <h3 className="font-bold text-slate-800">{item.label}</h3>
            <p className="text-xs text-slate-400 mt-1">点击进入操作</p>
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
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="搜索订单号、取件码..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="divide-y divide-slate-100">
            {(activeTab === 'stored' ? storedOrders : todayOrders).map(order => (
              <div key={order.id} className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{order.orderNo}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <span className="text-sm text-teal-600 font-bold">{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>取件码：<span className="font-mono font-bold text-slate-700">{order.pickupCode}</span></span>
                  <span>{order.luggageCount}件</span>
                  <span>{formatDateTime(order.storedAt || order.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {order.luggages.map((lug, i) => (
                    <span key={i} className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-md">
                      {getSizeLabel(lug.size)}
                      {lug.lockerNo && ` · ${lug.lockerNo}`}
                    </span>
                  ))}
                </div>
                {order.status === 'stored' && (
                  <div className="flex gap-2 mt-3">
                    <button className="px-3 py-1.5 text-xs bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors">
                      修改柜位
                    </button>
                    <button className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors">
                      确认取件
                    </button>
                  </div>
                )}
              </div>
            ))}
            {(activeTab === 'stored' ? storedOrders : todayOrders).length === 0 && (
              <div className="py-12 text-center">
                <Package className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-400">暂无数据</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showStoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowStoreModal(false);
              setScanCode('');
              setFoundOrder(null);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">扫码核验</h3>
            </div>
            <div className="p-6">
              {!foundOrder ? (
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
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
                  >
                    核验
                  </button>
                </>
              ) : (
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
                    <p className="text-sm font-medium text-slate-700 mb-2">行李信息</p>
                    {foundOrder.luggages.map((lug, i) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <span className="text-sm text-slate-600">
                          行李 {i + 1}：{getSizeLabel(lug.size)}
                        </span>
                        {foundOrder.status === 'paid' ? (
                          <input
                            type="text"
                            placeholder="柜位号"
                            value={selectedLockers[i] || ''}
                            onChange={e => {
                              const newLockers = [...selectedLockers];
                              newLockers[i] = e.target.value;
                              setSelectedLockers(newLockers);
                            }}
                            className="w-24 px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-center focus:outline-none focus:border-teal-500"
                          />
                        ) : (
                          <span className="text-sm font-medium text-teal-600">
                            {lug.lockerNo || '未分配'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    {foundOrder.status === 'paid' && (
                      <button
                        onClick={handleStoreLuggage}
                        className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
                      >
                        确认入库
                      </button>
                    )}
                    {foundOrder.status === 'stored' && (
                      <button
                        onClick={handlePickup}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
                      >
                        确认取件
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setFoundOrder(null);
                        setScanCode('');
                        setSelectedLockers([]);
                      }}
                      className="px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      返回
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
