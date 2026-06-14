import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, Package, Shield } from 'lucide-react';
import type { Store } from '@/types';
import { formatPrice, formatDistance } from '@/utils/format';

interface StoreCardProps {
  store: Store;
}

export default function StoreCard({ store }: StoreCardProps) {
  const capacityPercent = (store.availableCapacity / store.totalCapacity) * 100;
  const capacityColor = capacityPercent > 50 ? 'bg-teal-500' : capacityPercent > 20 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <Link
      to={`/order/create/${store.id}`}
      className="group block bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative sm:w-64 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
          <img
            src={store.images[0]}
            alt={store.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            {store.features.slice(0, 2).map((feature, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs font-medium bg-white/90 backdrop-blur-sm text-slate-700 rounded-md"
              >
                {feature}
              </span>
            ))}
          </div>
          <div className="absolute bottom-3 right-3 px-2 py-1 text-xs font-medium bg-teal-600 text-white rounded-md">
            {formatDistance(store.distance)}
          </div>
        </div>

        <div className="flex-1 p-5 flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-teal-600 transition-colors">
                {store.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                <MapPin size={14} className="flex-shrink-0" />
                <span className="truncate max-w-xs">{store.address}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star size={16} className="text-amber-500 fill-amber-500" />
              <span className="font-bold text-slate-800">{store.rating}</span>
              <span className="text-xs text-slate-400">({store.reviewCount})</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock size={14} className="text-slate-400" />
              <span>{store.businessHours}</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Package size={14} className="text-slate-400" />
                <span>剩余容量</span>
              </div>
              <span className="text-sm font-medium text-slate-700">
                {store.availableCapacity}/{store.totalCapacity} 格
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${capacityColor} rounded-full transition-all duration-500`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-end justify-between mt-auto pt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-teal-600">{formatPrice(store.basePrice)}</span>
              <span className="text-sm text-slate-400">/件起</span>
            </div>
            <button className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition-colors">
              立即预约
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
