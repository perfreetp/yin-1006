import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Package, Clock, Shield, Star, X, ArrowLeft } from 'lucide-react';
import OrderCard from '@/components/OrderCard';
import { useOrderStore } from '@/store/useOrderStore';
import { useUserStore } from '@/store/useUserStore';
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor, getSizeLabel, formatDuration } from '@/utils/format';
import type { Order, OrderStatus } from '@/types';

const tabs: { key: OrderStatus | 'all' | 'active'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'picked', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

export default function OrderCenter() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useUserStore();
  const { getOrdersByUserId, getOrderById } = useOrderStore();
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all' | 'active'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (id) {
      const order = getOrderById(id);
      if (order) {
        setSelectedOrder(order);
      } else {
        navigate('/orders', { replace: true });
      }
    } else {
      setSelectedOrder(null);
    }
  }, [id, getOrderById, navigate]);

  useEffect(() => {
    const handlePopState = () => {
      if (location.pathname === '/orders') {
        setSelectedOrder(null);
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
    setSelectedOrder(order);
  };

  const handleCloseDetail = () => {
    navigate('/orders');
    setSelectedOrder(null);
  };

  if (selectedOrder && id) {
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
                <h2 className="text-xl font-bold mt-1">{getStatusLabel(selectedOrder.status)}</h2>
              </div>
              <div className="text-right">
                <p className="text-teal-100 text-sm">订单金额</p>
                <p className="text-2xl font-bold mt-1">{formatPrice(selectedOrder.totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                <Package size={16} className="text-teal-600" />
                寄存点信息
              </h3>
              <p className="text-slate-700">{selectedOrder.storeName}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                <Clock size={16} className="text-teal-600" />
                寄存时间
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">开始时间</span>
                  <span className="text-slate-700">{formatDateTime(selectedOrder.startTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">结束时间</span>
                  <span className="text-slate-700">{formatDateTime(selectedOrder.endTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">寄存时长</span>
                  <span className="text-slate-700">{formatDuration(selectedOrder.startTime, selectedOrder.endTime)}</span>
                </div>
                {selectedOrder.renewCount && selectedOrder.renewCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">续存次数</span>
                    <span className="text-amber-600 font-medium">{selectedOrder.renewCount} 次</span>
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
                {selectedOrder.luggages.map((luggage, index) => (
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

            {selectedOrder.insurance && (
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                  <Shield size={16} className="text-teal-600" />
                  保价服务
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">保价金额</span>
                    <span className="text-slate-700">¥{selectedOrder.insurance.insuredAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">保费</span>
                    <span className="text-slate-700">{formatPrice(selectedOrder.insuranceAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-xl">
              <h3 className="font-medium text-slate-800 mb-3">订单信息</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">订单号</span>
                  <span className="text-slate-700 font-mono">{selectedOrder.orderNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">下单时间</span>
                  <span className="text-slate-700">{formatDateTime(selectedOrder.createdAt)}</span>
                </div>
                {selectedOrder.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">支付时间</span>
                    <span className="text-slate-700">{formatDateTime(selectedOrder.paidAt)}</span>
                  </div>
                )}
                {selectedOrder.storedAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">入库时间</span>
                    <span className="text-slate-700">{formatDateTime(selectedOrder.storedAt)}</span>
                  </div>
                )}
                {selectedOrder.pickedAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">取件时间</span>
                    <span className="text-slate-700">{formatDateTime(selectedOrder.pickedAt)}</span>
                  </div>
                )}
                {selectedOrder.additionalAmount && selectedOrder.additionalAmount > 0 && (
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-amber-600">续存费用</span>
                    <span className="text-amber-600 font-medium">+{formatPrice(selectedOrder.additionalAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {selectedOrder.status === 'stored' && selectedOrder.pickupCode && (
              <div className="p-5 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center justify-between">
                  <span className="text-amber-700 font-medium">取件码</span>
                  <span className="text-3xl font-bold text-amber-700 font-mono tracking-widest">
                    {selectedOrder.pickupCode}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
            {selectedOrder.status === 'paid' && (
              <button className="flex-1 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors">
                查看取件码
              </button>
            )}
            {selectedOrder.status === 'stored' && (
              <button className="flex-1 px-5 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-white transition-colors">
                申请续存
              </button>
            )}
            {['paid', 'pending'].includes(selectedOrder.status) && (
              <button className="flex-1 px-5 py-2.5 border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors">
                取消订单
              </button>
            )}
            {selectedOrder.status === 'picked' && (
              <button className="flex-1 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-1">
                <Star size={16} />
                去评价
              </button>
            )}
          </div>
        </div>
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
