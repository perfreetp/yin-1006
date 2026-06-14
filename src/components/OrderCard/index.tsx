import { Link } from 'react-router-dom';
import { Clock, Package, MapPin, ChevronRight } from 'lucide-react';
import type { Order } from '@/types';
import { formatPrice, formatDateTime, formatDuration, getStatusLabel, getStatusColor, getSizeLabel } from '@/utils/format';

interface OrderCardProps {
  order: Order;
  showActions?: boolean;
}

export default function OrderCard({ order, showActions = true }: OrderCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">订单号：{order.orderNo}</span>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>
        <span className="text-sm text-slate-400">
          {formatDateTime(order.createdAt)}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center flex-shrink-0">
            <Package className="text-teal-600" size={28} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 truncate">{order.storeName}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
              <MapPin size={14} className="flex-shrink-0" />
              <span className="truncate">寄存点</span>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-xl font-bold text-teal-600">{formatPrice(order.totalAmount)}</div>
            <div className="text-xs text-slate-400 mt-0.5">共 {order.luggageCount} 件</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Clock size={14} className="text-slate-400" />
            <span>寄存时长：{formatDuration(order.startTime, order.endTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Package size={14} className="text-slate-400" />
            <span>
              {order.luggages.map(l => getSizeLabel(l.size)).join('、')}
            </span>
          </div>
        </div>

        {order.status === 'stored' && order.pickupCode && (
          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-amber-700">取件码</span>
              <span className="text-lg font-bold text-amber-700 font-mono tracking-widest">
                {order.pickupCode}
              </span>
            </div>
          </div>
        )}

        {showActions && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              {order.storedAt && <span>入库时间：{formatDateTime(order.storedAt)}</span>}
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/orders/${order.id}`}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-teal-600 transition-colors"
              >
                查看详情
                <ChevronRight size={14} />
              </Link>
              {order.status === 'paid' && (
                <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors">
                  查看取件码
                </button>
              )}
              {order.status === 'pending' && (
                <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors">
                  去支付
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
