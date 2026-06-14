import { useState } from 'react';
import { Search, Filter, Clock, Star, SlidersHorizontal, X } from 'lucide-react';
import { useStoreStore } from '@/store/useStoreStore';
import type { LuggageSize } from '@/types';

const sizeOptions: { value: LuggageSize; label: string }[] = [
  { value: 'small', label: '小件' },
  { value: 'medium', label: '中件' },
  { value: 'large', label: '大件' },
];

const sortOptions: { value: 'distance' | 'price' | 'rating' | 'popular'; label: string }[] = [
  { value: 'distance', label: '距离最近' },
  { value: 'price', label: '价格最低' },
  { value: 'rating', label: '评分最高' },
  { value: 'popular', label: '人气最高' },
];

const ratingOptions = [4.5, 4.0, 3.5, 3.0];

export default function FilterBar() {
  const { filters, setFilters, toggleSizeFilter, toggleOpenNow, setSortBy } = useStoreStore();
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ keyword: e.target.value });
  };

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    const newRange: [number, number] = type === 'min'
      ? [value, priceRange[1]]
      : [priceRange[0], value];
    setPriceRange(newRange);
    setFilters({
      priceMin: newRange[0] > 0 ? newRange[0] : undefined,
      priceMax: newRange[1] < 100 ? newRange[1] : undefined,
    });
  };

  const handleRatingClick = (rating: number) => {
    if (filters.minRating === rating) {
      setFilters({ minRating: undefined });
    } else {
      setFilters({ minRating: rating });
    }
  };

  const clearAllFilters = () => {
    setFilters({
      keyword: '',
      openNow: undefined,
      sizes: undefined,
      priceMin: undefined,
      priceMax: undefined,
      minRating: undefined,
    });
    setPriceRange([0, 100]);
  };

  const hasActiveFilters = filters.openNow || (filters.sizes?.length || 0) > 0 || filters.minRating || filters.priceMin || filters.priceMax;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="搜索寄存点名称或地址..."
            value={filters.keyword || ''}
            onChange={handleSearch}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleOpenNow}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              filters.openNow
                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                : 'bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100'
            }`}
          >
            <Clock size={16} />
            营业中
          </button>

          <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 rounded-xl">
            {sizeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => toggleSizeFilter(option.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filters.sizes?.includes(option.value)
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              showMoreFilters || hasActiveFilters
                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                : 'bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal size={16} />
            筛选
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center">
                {(filters.sizes?.length || 0) + (filters.openNow ? 1 : 0) + (filters.minRating ? 1 : 0) + ((filters.priceMin || filters.priceMax) ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {showMoreFilters && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">价格区间</span>
                <span className="text-sm text-teal-600 font-medium">
                  ¥{priceRange[0]} - ¥{priceRange[1]}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={priceRange[0]}
                    onChange={e => handlePriceChange('min', Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={priceRange[1]}
                    onChange={e => handlePriceChange('max', Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-slate-700 mb-3 block">最低评分</span>
              <div className="flex flex-wrap gap-2">
                {ratingOptions.map(rating => (
                  <button
                    key={rating}
                    onClick={() => handleRatingClick(rating)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filters.minRating === rating
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Star size={14} className={filters.minRating === rating ? 'fill-amber-500' : ''} />
                    {rating}分以上
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end justify-end">
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X size={14} />
                清除筛选
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
        <span className="text-sm text-slate-500 flex-shrink-0">排序：</span>
        {sortOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setSortBy(option.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filters.sortBy === option.value
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
