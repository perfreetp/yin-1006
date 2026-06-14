import { useState } from 'react';
import { QrCode, CheckCircle2, XCircle, Package, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { useOrderStore } from '@/store/useOrderStore';
import { useUserStore } from '@/store/useUserStore';
import { formatDateTime, getStatusLabel, getStatusColor, getSizeLabel, formatPrice } from '@/utils/format';
import type { Order } from '@/types';

export default function PickupVerify() {
  const { getOrderByPickupCode, pickupLuggage } = useOrderStore();
  const { currentUser } = useUserStore();
  const [pickupCode, setPickupCode] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [pickupSuccess, setPickupSuccess] = useState(false);

  const handleVerify = () => {
    setError('');
    setOrder(null);
    setVerified(false);

    if (!pickupCode.trim()) {
      setError('请输入取件码');
      return;
    }

    const foundOrder = getOrderByPickupCode(pickupCode);
    if (!foundOrder) {
      setError('取件码无效，请检查后重试');
      return;
    }

    if (foundOrder.status === 'picked') {
      setError('该订单已取件');
      setOrder(foundOrder);
      return;
    }

    if (foundOrder.status !== 'stored') {
      setError('该订单尚未入库，请联系门店工作人员');
      setOrder(foundOrder);
      return;
    }

    setOrder(foundOrder);
    setVerified(true);
  };

  const handlePickup = () => {
    if (!order) return;
    pickupLuggage(order.id);
    setPickupSuccess(true);
    setOrder({ ...order, status: 'picked', pickedAt: new Date().toISOString() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setPickupCode(value);
    if (error) setError('');
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/30">
          <QrCode className="text-white" size={36} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">取件核验</h1>
        <p className="text-slate-500 mt-2">输入取件码或扫码完成取件</p>
      </div>

      {!pickupSuccess ? (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              取件码
            </label>
            <div className="relative">
              <input
                type="text"
                value={pickupCode}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="请输入6位取件码"
                maxLength={6}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-2xl font-bold text-slate-800 placeholder:text-slate-300 font-mono tracking-widest text-center focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>

            {error && (
              <div className="mt-3 p-3 bg-red-50 rounded-xl flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            <button
              onClick={handleVerify}
              className="w-full mt-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
            >
              核验取件码
            </button>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <button className="w-full py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                <QrCode size={18} />
                扫码取件
              </button>
            </div>
          </div>

          {(order || verified) && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm text-slate-500">订单信息</span>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(order?.status || 'pending')}`}>
                  {getStatusLabel(order?.status || 'pending')}
                </span>
              </div>

              <div className="p-6">
                <h3 className="font-bold text-lg text-slate-800 mb-3">
                  {order?.storeName}
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                    <span>订单号：{order?.orderNo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Package size={14} className="text-slate-400 flex-shrink-0" />
                    <span>
                      行李 {order?.luggageCount} 件：
                      {order?.luggages.map(l => getSizeLabel(l.size)).join('、')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock size={14} className="text-slate-400 flex-shrink-0" />
                    <span>入库时间：{order?.storedAt ? formatDateTime(order.storedAt) : '-'}</span>
                  </div>
                </div>

                {verified && order && order.status === 'stored' && (
                  <div className="mt-6 p-4 bg-teal-50 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="text-teal-600 flex-shrink-0" size={24} />
                    <div>
                      <p className="font-medium text-teal-700">核验通过</p>
                      <p className="text-sm text-teal-600">请确认行李无误后取件</p>
                    </div>
                  </div>
                )}

                {order?.status === 'picked' && (
                  <div className="mt-6 p-4 bg-slate-100 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="text-slate-500 flex-shrink-0" size={24} />
                    <div>
                      <p className="font-medium text-slate-700">已完成取件</p>
                      <p className="text-sm text-slate-500">
                        取件时间：{order?.pickedAt ? formatDateTime(order.pickedAt) : '-'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {verified && order && order.status === 'stored' && (
                <div className="px-6 pb-6">
                  <button
                    onClick={handlePickup}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
                  >
                    确认取件
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-teal-100 flex items-center justify-center">
            <CheckCircle2 className="text-teal-600" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">取件成功</h2>
          <p className="text-slate-500 mb-6">感谢您的使用，期待下次再见</p>

          {order && (
            <div className="p-4 bg-slate-50 rounded-xl text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">订单号</span>
                <span className="text-slate-700 font-medium">{order.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">取件时间</span>
                <span className="text-slate-700">{formatDateTime(order.pickedAt || new Date().toISOString())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">行李件数</span>
                <span className="text-slate-700">{order.luggageCount} 件</span>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setPickupCode('');
              setOrder(null);
              setVerified(false);
              setPickupSuccess(false);
              setError('');
            }}
            className="w-full mt-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
          >
            继续核验
          </button>
        </div>
      )}

      <div className="mt-8 p-4 bg-slate-50 rounded-xl">
        <h3 className="font-medium text-slate-700 mb-3">取件须知</h3>
        <ul className="space-y-2 text-sm text-slate-500">
          <li className="flex items-start gap-2">
            <span className="text-teal-500">•</span>
            请在营业时间内到店取件
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-500">•</span>
            取件时请出示取件码或扫码核验
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-500">•</span>
            超时取件将产生额外费用
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-500">•</span>
            如有问题请联系门店工作人员或客服
          </li>
        </ul>
      </div>
    </div>
  );
}
