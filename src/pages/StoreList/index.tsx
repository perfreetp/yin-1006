import { useMemo } from 'react';
import { MapPin, Sparkles } from 'lucide-react';
import StoreCard from '@/components/StoreCard';
import FilterBar from '@/components/FilterBar';
import { useStoreStore } from '@/store/useStoreStore';

export default function StoreList() {
  const { getFilteredStores } = useStoreStore();
  const filteredStores = useMemo(() => getFilteredStores(), [getFilteredStores]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-amber-300" size={24} />
            <span className="text-teal-100 font-medium">轻松出行，解放双手</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            找到附近的行李寄存点
          </h1>
          <p className="text-teal-100 text-lg mb-6">
            车站、商圈、景区周边 · 安全可靠 · 随存随取
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white text-sm">
              <MapPin size={16} />
              上海 · 当前定位
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white text-sm">
              已筛选 {filteredStores.length} 个寄存点
            </div>
          </div>
        </div>
      </div>

      <FilterBar />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            附近寄存点
            <span className="text-sm font-normal text-slate-500 ml-2">
              共 {filteredStores.length} 家
            </span>
          </h2>
        </div>

        {filteredStores.length > 0 ? (
          <div className="grid gap-4">
            {filteredStores.map(store => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <MapPin size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">没有找到寄存点</h3>
            <p className="text-slate-500">试试调整筛选条件或搜索其他位置</p>
          </div>
        )}
      </div>
    </div>
  );
}
