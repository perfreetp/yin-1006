import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Clock, Star, Package, Locate } from 'lucide-react';
import { useStoreStore } from '@/store/useStoreStore';
import { useAdminStore } from '@/store/useAdminStore';
import { formatPrice, formatDistance } from '@/utils/format';
import type { Store } from '@/types';

export default function MapSearch() {
  const { stores, selectStore, selectedStore, getAvailableCapacityForDate, getEffectiveCapacity } = useStoreStore();
  const { holidayConfigs } = useAdminStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [bottomSheetOpen, setBottomSheetOpen] = useState(true);

  const selectedStoreCapacity = useMemo(() => {
    if (!selectedStore) return null;
    const today = new Date().toISOString();
    const available = getAvailableCapacityForDate(selectedStore.id, today);
    const effective = getEffectiveCapacity(selectedStore.id, today);
    
    const dateStr = new Date().toISOString().split('T')[0];
    const holidayConfig = holidayConfigs.find(h => h.date === dateStr);
    const multiplier = holidayConfig?.capacityMultiplier || 1;
    
    return {
      availableCapacity: available,
      effectiveTotal: effective,
      isHoliday: multiplier !== 1,
      capacityMultiplier: multiplier,
    };
  }, [selectedStore, getAvailableCapacityForDate, getEffectiveCapacity, holidayConfigs]);

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    store.address.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const handleMarkerClick = (store: Store) => {
    selectStore(store);
    setBottomSheetOpen(true);
  };

  const getMarkerPosition = (store: Store) => {
    const minLat = 31.1;
    const maxLat = 31.3;
    const minLng = 121.3;
    const maxLng = 121.9;
    
    const x = ((store.lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - store.lat) / (maxLat - minLat)) * 100;
    
    return { left: `${Math.max(5, Math.min(95, x))}%`, top: `${Math.max(10, Math.min(90, y))}%` };
  };

  return (
    <div className="relative h-[calc(100vh-10rem)] min-h-[600px] -mx-4 sm:-mx-6 lg:-mx-8 -my-6">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="absolute top-1/4 left-1/4 w-32 h-24 bg-slate-200/60 rounded-lg" />
        <div className="absolute top-1/3 right-1/3 w-40 h-20 bg-slate-200/60 rounded-lg" />
        <div className="absolute bottom-1/3 left-1/3 w-28 h-28 bg-slate-200/60 rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-36 h-16 bg-slate-200/60 rounded-lg" />

        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <line x1="0%" y1="45%" x2="100%" y2="50%" stroke="#cbd5e1" strokeWidth="8" />
          <line x1="30%" y1="0%" x2="35%" y2="100%" stroke="#cbd5e1" strokeWidth="6" />
          <line x1="70%" y1="0%" x2="65%" y2="100%" stroke="#cbd5e1" strokeWidth="6" />
          <line x1="0%" y1="75%" x2="100%" y2="70%" stroke="#e2e8f0" strokeWidth="4" />
        </svg>

        {filteredStores.map(store => {
          const pos = getMarkerPosition(store);
          const isSelected = selectedStore?.id === store.id;
          return (
            <button
              key={store.id}
              onClick={() => handleMarkerClick(store)}
              className={`absolute -translate-x-1/2 -translate-y-full transition-all duration-300 z-10 ${
                isSelected ? 'scale-125 z-20' : 'hover:scale-110'
              }`}
              style={pos}
            >
              <div className={`relative px-2 py-1 rounded-t-lg font-bold text-sm shadow-lg ${
                isSelected ? 'bg-teal-600 text-white' : 'bg-white text-teal-600'
              }`}>
                {formatPrice(store.basePrice)}
              </div>
              <div className={`w-0 h-0 mx-auto border-x-[10px] border-t-[10px] border-x-transparent ${
                isSelected ? 'border-t-teal-600' : 'border-t-white'
              }`} />
            </button>
          );
        })}

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-5">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 animate-ping absolute" />
            <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 right-4 z-30">
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="搜索地址、寄存点名称..."
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              className="w-full pl-12 pr-14 py-4 bg-white rounded-2xl shadow-lg shadow-slate-200/50 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors">
              <Locate size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className={`absolute left-0 right-0 bottom-0 z-30 transition-all duration-300 ${
        bottomSheetOpen ? 'translate-y-0' : 'translate-y-[calc(100%-3rem)]'
      }`}>
        <div className="bg-white rounded-t-3xl shadow-2xl shadow-slate-900/20 max-h-80">
          <button
            onClick={() => setBottomSheetOpen(!bottomSheetOpen)}
            className="w-full py-3 flex justify-center"
          >
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          </button>

          {selectedStore && bottomSheetOpen && (
            <div className="px-6 pb-4">
              <div className="flex items-start gap-4">
                <img
                  src={selectedStore.images[0]}
                  alt={selectedStore.name}
                  className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-slate-800">{selectedStore.name}</h3>
                  <p className="text-sm text-slate-500 mt-1 truncate">{selectedStore.address}</p>
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} fill="currentColor" />
                      <span className="font-medium text-slate-700">{selectedStore.rating}</span>
                      <span className="text-slate-400">({selectedStore.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <MapPin size={14} />
                      <span>{formatDistance(selectedStore.distance)}</span>
                    </div>
                  </div>
                  {selectedStoreCapacity && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Package size={14} className="text-slate-400" />
                        <span>剩余 {selectedStoreCapacity.availableCapacity} / {selectedStoreCapacity.effectiveTotal} 柜位</span>
                      </div>
                      {selectedStoreCapacity.isHoliday && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          节假日 x{selectedStoreCapacity.capacityMultiplier}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-teal-600">{formatPrice(selectedStore.basePrice)}</span>
                  <span className="text-sm text-slate-400">/件起</span>
                </div>
                <Link
                  to={`/order/create/${selectedStore.id}`}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
                >
                  立即预约
                </Link>
              </div>
            </div>
          )}

          {bottomSheetOpen && (
            <div className="px-6 pb-6">
              {!selectedStore && (
                <h4 className="font-bold text-slate-800 mb-3">附近寄存点</h4>
              )}
              {selectedStore && (
                <div className="flex items-center justify-between mb-3 mt-2">
                  <h4 className="font-bold text-slate-800">更多寄存点</h4>
                  <button
                    onClick={() => selectStore(null)}
                    className="text-sm text-teal-600 hover:text-teal-700"
                  >
                    清除选择
                  </button>
                </div>
              )}
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6">
                {filteredStores
                  .filter(s => s.id !== selectedStore?.id)
                  .slice(0, 6)
                  .map(store => (
                    <button
                      key={store.id}
                      onClick={() => handleMarkerClick(store)}
                      className="flex-shrink-0 w-40 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
                    >
                      <img
                        src={store.images[0]}
                        alt={store.name}
                        className="w-full h-20 rounded-lg object-cover mb-2"
                      />
                      <h5 className="font-medium text-sm text-slate-800 truncate">{store.name}</h5>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-bold text-teal-600">{formatPrice(store.basePrice)}</span>
                        <span className="text-xs text-slate-400">{formatDistance(store.distance)}</span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
