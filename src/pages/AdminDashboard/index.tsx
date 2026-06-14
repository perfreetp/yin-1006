import { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  Store as StoreIcon,
  TrendingUp,
  DollarSign,
  Package,
  Settings,
  Calendar,
  Plus,
  Search,
  ChevronRight,
  Edit,
  Trash2,
  X,
  Check,
  Clock,
  FileText,
  MapPin,
  Phone,
  Tag,
} from 'lucide-react';
import { useStoreStore } from '@/store/useStoreStore';
import { useAdminStore } from '@/store/useAdminStore';
import { formatPrice, formatDateTime } from '@/utils/format';
import type { Store, PriceRule, HolidayConfig, Settlement, LocationType } from '@/types';

const menuTabs = [
  { key: 'dashboard', label: '数据概览', icon: <BarChart3 size={18} /> },
  { key: 'stores', label: '门店管理', icon: <StoreIcon size={18} /> },
  { key: 'pricing', label: '价格规则', icon: <DollarSign size={18} /> },
  { key: 'holidays', label: '节假日配置', icon: <Calendar size={18} /> },
  { key: 'settlements', label: '结算明细', icon: <FileText size={18} /> },
];

const locationTypeOptions: { value: LocationType; label: string }[] = [
  { value: 'station', label: '车站' },
  { value: 'commercial', label: '商圈' },
  { value: 'scenic', label: '景区' },
  { value: 'airport', label: '机场' },
  { value: 'other', label: '其他' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [editingPriceRule, setEditingPriceRule] = useState<PriceRule | null>(null);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayConfig | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [priceRuleStoreId, setPriceRuleStoreId] = useState<string>('');
  const [storeTotalCapacity, setStoreTotalCapacity] = useState<number>(0);

  const { stores, addStore, updateStore, deleteStore, getStoreById } = useStoreStore();
  const {
    priceRules,
    holidayConfigs,
    settlements,
    addPriceRule,
    updatePriceRule,
    deletePriceRule,
    addHoliday,
    updateHoliday,
    deleteHoliday,
    settlePayment,
    getPriceRuleByStoreId,
  } = useAdminStore();

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const maxCapacityMultiplier = useMemo(() => {
    if (holidayConfigs.length === 0) return 1;
    return Math.max(...holidayConfigs.map(h => h.capacityMultiplier));
  }, [holidayConfigs]);

  const filteredStores = useMemo(() => {
    if (!searchKeyword) return stores;
    return stores.filter(s =>
      s.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      s.address.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  }, [stores, searchKeyword]);

  const totalStats = useMemo(() => ({
    storeCount: stores.length,
    totalOrders: 2847,
    totalRevenue: 128960,
    totalUsers: 8932,
  }), [stores]);

  const chartData = useMemo(() => [
    { month: '1月', orders: 1200, revenue: 45000 },
    { month: '2月', orders: 1500, revenue: 58000 },
    { month: '3月', orders: 1800, revenue: 72000 },
    { month: '4月', orders: 2100, revenue: 85000 },
    { month: '5月', orders: 2500, revenue: 98000 },
    { month: '6月', orders: 2800, revenue: 112000 },
  ], []);

  const maxRevenue = Math.max(...chartData.map(d => d.revenue));
  const maxOrders = Math.max(...chartData.map(d => d.orders));

  const deduplicatedPriceRules = useMemo(() => {
    const seen = new Map<string, PriceRule>();
    for (const rule of priceRules) {
      if (!seen.has(rule.storeId)) {
        seen.set(rule.storeId, rule);
      }
    }
    return Array.from(seen.values());
  }, [priceRules]);

  const storeHasExistingRule = useMemo(() => {
    if (!priceRuleStoreId || editingPriceRule) return false;
    return priceRules.some(r => r.storeId === priceRuleStoreId);
  }, [priceRuleStoreId, priceRules, editingPriceRule]);

  const effectiveCapacity = useMemo(() => {
    return Math.floor(storeTotalCapacity * maxCapacityMultiplier);
  }, [storeTotalCapacity, maxCapacityMultiplier]);

  useEffect(() => {
    if (showPriceModal) {
      setPriceRuleStoreId(editingPriceRule?.storeId || '');
    }
  }, [showPriceModal, editingPriceRule]);

  useEffect(() => {
    if (showStoreModal) {
      setStoreTotalCapacity(editingStore?.totalCapacity || 0);
    }
  }, [showStoreModal, editingStore]);

  const handleSaveStore = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const storeData = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      businessHours: formData.get('businessHours') as string,
      totalCapacity: parseInt(formData.get('totalCapacity') as string),
      availableCapacity: editingStore ? editingStore.availableCapacity : parseInt(formData.get('totalCapacity') as string),
      basePrice: parseFloat(formData.get('basePrice') as string),
      smallPrice: parseFloat(formData.get('smallPrice') as string) || 10,
      mediumPrice: parseFloat(formData.get('mediumPrice') as string) || 15,
      largePrice: parseFloat(formData.get('largePrice') as string) || 25,
      hourlyRate: parseFloat(formData.get('hourlyRate') as string) || 5,
      dailyCap: parseFloat(formData.get('dailyCap') as string) || 30,
      locationType: formData.get('locationType') as LocationType,
      lat: editingStore ? editingStore.lat : 31.2304,
      lng: editingStore ? editingStore.lng : 121.4737,
      description: editingStore ? editingStore.description : '专业行李寄存服务',
      rating: editingStore ? editingStore.rating : 5,
      reviewCount: editingStore ? editingStore.reviewCount : 0,
      distance: editingStore ? editingStore.distance : 0,
      images: editingStore ? editingStore.images : ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20luggage%20storage%20store%20interior%20with%20clean%20lockers&image_size=square'],
      features: editingStore ? editingStore.features : [],
    };

    if (editingStore) {
      updateStore(editingStore.id, storeData);
      const existingRule = useAdminStore.getState().getPriceRuleByStoreId(editingStore.id);
      if (existingRule) {
        updatePriceRule(existingRule.id, {
          basePrice: storeData.basePrice,
          smallPrice: storeData.smallPrice,
          mediumPrice: storeData.mediumPrice,
          largePrice: storeData.largePrice,
          hourlyRate: storeData.hourlyRate,
          dailyCap: storeData.dailyCap,
        });
      }
      showToast('门店更新成功');
    } else {
      addStore(storeData);
      showToast('门店新增成功');
    }
    setShowStoreModal(false);
    setEditingStore(null);
  };

  const handleDeleteStore = (id: string) => {
    if (confirm('确定要删除这家门店吗？')) {
      deleteStore(id);
      showToast('门店已删除');
    }
  };

  const handleSavePriceRule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const priceRuleData = {
      storeId: formData.get('storeId') as string,
      basePrice: parseFloat(formData.get('basePrice') as string) || 10,
      smallPrice: parseFloat(formData.get('smallPrice') as string),
      mediumPrice: parseFloat(formData.get('mediumPrice') as string),
      largePrice: parseFloat(formData.get('largePrice') as string),
      hourlyRate: parseFloat(formData.get('hourlyRate') as string),
      dailyCap: parseFloat(formData.get('dailyCap') as string),
      holidaySurcharge: parseFloat(formData.get('holidaySurcharge') as string) || 0,
    };

    if (editingPriceRule) {
      updatePriceRule(editingPriceRule.id, priceRuleData);
      const targetStore = getStoreById(priceRuleData.storeId);
      if (targetStore) {
        updateStore(targetStore.id, {
          basePrice: priceRuleData.basePrice,
          smallPrice: priceRuleData.smallPrice,
          mediumPrice: priceRuleData.mediumPrice,
          largePrice: priceRuleData.largePrice,
          hourlyRate: priceRuleData.hourlyRate,
          dailyCap: priceRuleData.dailyCap,
        });
      }
      showToast('价格规则更新成功');
    } else {
      if (storeHasExistingRule) {
        showToast('该门店已有价格规则，将覆盖原规则');
      }
      addPriceRule(priceRuleData);
      const targetStore = getStoreById(priceRuleData.storeId);
      if (targetStore) {
        updateStore(targetStore.id, {
          basePrice: priceRuleData.basePrice,
          smallPrice: priceRuleData.smallPrice,
          mediumPrice: priceRuleData.mediumPrice,
          largePrice: priceRuleData.largePrice,
          hourlyRate: priceRuleData.hourlyRate,
          dailyCap: priceRuleData.dailyCap,
        });
      }
      if (!storeHasExistingRule) {
        showToast('价格规则新增成功');
      }
    }
    setShowPriceModal(false);
    setEditingPriceRule(null);
  };

  const handleDeletePriceRule = (id: string) => {
    if (confirm('确定要删除这条价格规则吗？')) {
      deletePriceRule(id);
      showToast('价格规则已删除');
    }
  };

  const handleSaveHoliday = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const holidayData = {
      name: formData.get('name') as string,
      date: formData.get('date') as string,
      capacityMultiplier: parseFloat(formData.get('capacityMultiplier') as string),
      priceMultiplier: parseFloat(formData.get('priceMultiplier') as string),
    };

    if (editingHoliday) {
      updateHoliday(editingHoliday.id, holidayData);
      showToast('节假日配置更新成功');
    } else {
      addHoliday(holidayData);
      showToast('节假日新增成功');
    }
    setShowHolidayModal(false);
    setEditingHoliday(null);
  };

  const handleDeleteHoliday = (id: string) => {
    if (confirm('确定要删除这个节假日配置吗？')) {
      deleteHoliday(id);
      showToast('节假日配置已删除');
    }
  };

  const handleSettlePayment = (id: string) => {
    if (confirm('确定要确认结算吗？')) {
      settlePayment(id);
      showToast('结算已确认');
    }
  };

  const getLocationTypeLabel = (type: LocationType) => {
    return locationTypeOptions.find(opt => opt.value === type)?.label || '其他';
  };

  const getStoreNameById = (storeId: string) => {
    return stores.find(s => s.id === storeId)?.name || '未知门店';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-teal-600 text-white rounded-xl shadow-lg animate-bounce">
          {toast}
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-3xl p-6 md:p-8 text-white mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <BarChart3 size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">运营管理后台</h1>
            <p className="text-slate-400">门店运营 · 价格策略 · 数据报表</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <StoreIcon size={16} className="text-teal-400" />
              <span className="text-slate-400 text-sm">门店数量</span>
            </div>
            <div className="text-2xl font-bold">{totalStats.storeCount}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-blue-400" />
              <span className="text-slate-400 text-sm">累计订单</span>
            </div>
            <div className="text-2xl font-bold">{totalStats.totalOrders.toLocaleString()}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-amber-400" />
              <span className="text-slate-400 text-sm">总营收</span>
            </div>
            <div className="text-2xl font-bold">¥{totalStats.totalRevenue.toLocaleString()}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-emerald-400" />
              <span className="text-slate-400 text-sm">注册用户</span>
            </div>
            <div className="text-2xl font-bold">{totalStats.totalUsers.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {menuTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-6">订单与营收趋势</h3>
            <div className="h-64 flex items-end gap-4">
              {chartData.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex gap-1 h-48 items-end">
                    <div
                      className="flex-1 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg transition-all duration-500"
                      style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
                    />
                    <div
                      className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500"
                      style={{ height: `${(item.orders / maxOrders) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{item.month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-500 rounded" />
                <span className="text-sm text-slate-500">营收</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-sm text-slate-500">订单量</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">门店排名 TOP 5</h3>
              <div className="space-y-3">
                {stores.slice(0, 5).map((store, i) => (
                  <div key={store.id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < 3 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{store.name}</p>
                      <p className="text-xs text-slate-400">{store.reviewCount} 单</p>
                    </div>
                    <span className="text-sm font-bold text-teal-600">{formatPrice(store.basePrice)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">待处理事项</h3>
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Clock size={16} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-800">待结算门店</p>
                      <p className="text-xs text-amber-600">{settlements.filter(s => s.status === 'pending').length} 家</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-amber-400" />
                </div>
                <div className="p-3 bg-blue-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <StoreIcon size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">新入驻门店</p>
                      <p className="text-xs text-blue-600">3 家待审核</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-blue-400" />
                </div>
                <div className="p-3 bg-red-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Settings size={16} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-800">客诉工单</p>
                      <p className="text-xs text-red-600">5 条待处理</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-red-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stores' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="搜索门店..."
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-transparent rounded-lg text-sm focus:outline-none focus:bg-white focus:border-slate-300 w-64"
              />
            </div>
            <button
              onClick={() => {
                setEditingStore(null);
                setShowStoreModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus size={16} />
              新增门店
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">门店</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">地址</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">评分</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">有效容量</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStores.map(store => (
                  <tr key={store.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={store.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{store.name}</p>
                          <p className="text-xs text-slate-400">{store.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{store.address}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {getLocationTypeLabel(store.locationType)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-amber-600">{store.rating}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-slate-600">
                          {store.availableCapacity}/{store.totalCapacity}
                        </span>
                        <span className="text-xs text-slate-400">
                          节假日倍率 x{maxCapacityMultiplier}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingStore(store);
                            setShowStoreModal(true);
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit size={14} className="text-slate-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteStore(store.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">价格规则配置</h3>
              <button
                onClick={() => {
                  setEditingPriceRule(null);
                  setShowPriceModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus size={16} />
                新增规则
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">门店</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">小件</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">中件</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">大件</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">小时费率</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">每日封顶</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">联动状态</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deduplicatedPriceRules.map(rule => (
                    <tr key={rule.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-800 text-sm">
                        {getStoreNameById(rule.storeId)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 text-right">{formatPrice(rule.smallPrice)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 text-right">{formatPrice(rule.mediumPrice)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 text-right">{formatPrice(rule.largePrice)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 text-right">{formatPrice(rule.hourlyRate)}/时</td>
                      <td className="px-6 py-4 text-sm text-slate-600 text-right">{formatPrice(rule.dailyCap)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                          <Check size={12} />
                          已联动
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingPriceRule(rule);
                              setShowPriceModal(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit size={14} className="text-slate-500" />
                          </button>
                          <button
                            onClick={() => handleDeletePriceRule(rule.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'holidays' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">节假日配置</h3>
            <button
              onClick={() => {
                setEditingHoliday(null);
                setShowHolidayModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus size={16} />
              新增节假日
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {holidayConfigs.map(holiday => (
                <div key={holiday.id} className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-800">{holiday.name}</h4>
                    <span className="text-sm text-slate-500">{holiday.date}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">容量倍数</span>
                      <span className="text-teal-600 font-medium">x{holiday.capacityMultiplier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">价格倍数</span>
                      <span className="text-amber-600 font-medium">x{holiday.priceMultiplier}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setEditingHoliday(holiday);
                        setShowHolidayModal(true);
                      }}
                      className="flex-1 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDeleteHoliday(holiday.id)}
                      className="flex-1 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settlements' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">结算明细</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">门店</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">结算周期</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">订单数</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">总金额</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">平台分成</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">结算金额</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settlements.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-800 text-sm">{s.storeName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{s.period}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-right">{s.orderCount}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-right">{formatPrice(s.totalAmount)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-right">{formatPrice(s.platformFee)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-teal-600 text-right">{formatPrice(s.settleAmount)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        s.status === 'settled'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {s.status === 'settled' ? '已结算' : '待结算'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {s.status === 'pending' && (
                        <button
                          onClick={() => handleSettlePayment(s.id)}
                          className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                        >
                          确认结算
                        </button>
                      )}
                      {s.status === 'settled' && (
                        <div className="text-xs text-slate-400">
                          {s.settledAt && formatDateTime(s.settledAt)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showStoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowStoreModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {editingStore ? '编辑门店' : '新增门店'}
              </h3>
              <button
                onClick={() => setShowStoreModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSaveStore} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">门店名称</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingStore?.name}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                  placeholder="请输入门店名称"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">门店地址</label>
                <input
                  type="text"
                  name="address"
                  defaultValue={editingStore?.address}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                  placeholder="请输入门店地址"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">位置类型</label>
                <select
                  name="locationType"
                  defaultValue={editingStore?.locationType || 'commercial'}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                  required
                >
                  {locationTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">营业时间</label>
                  <input
                    type="text"
                    name="businessHours"
                    defaultValue={editingStore?.businessHours}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    placeholder="09:00 - 21:00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">联系电话</label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingStore?.phone}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    placeholder="联系电话"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">总容量</label>
                  <input
                    type="number"
                    name="totalCapacity"
                    defaultValue={editingStore?.totalCapacity}
                    onChange={e => setStoreTotalCapacity(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    required
                    min="1"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    节假日倍率 x{maxCapacityMultiplier} 时，有效容量 = 总容量 x {maxCapacityMultiplier}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-teal-600">
                    当前有效容量：{effectiveCapacity}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">基础价格(元)</label>
                  <input
                    type="number"
                    name="basePrice"
                    defaultValue={editingStore?.basePrice}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">小件价格(元)</label>
                  <input
                    type="number"
                    name="smallPrice"
                    defaultValue={editingStore?.smallPrice}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">中件价格(元)</label>
                  <input
                    type="number"
                    name="mediumPrice"
                    defaultValue={editingStore?.mediumPrice}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">大件价格(元)</label>
                  <input
                    type="number"
                    name="largePrice"
                    defaultValue={editingStore?.largePrice}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">小时费率(元)</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    defaultValue={editingStore?.hourlyRate}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">每日封顶(元)</label>
                  <input
                    type="number"
                    name="dailyCap"
                    defaultValue={editingStore?.dailyCap}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStoreModal(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPriceModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {editingPriceRule ? '编辑价格规则' : '新增价格规则'}
              </h3>
              <button
                onClick={() => setShowPriceModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSavePriceRule} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">所属门店</label>
                <select
                  name="storeId"
                  value={priceRuleStoreId}
                  onChange={e => setPriceRuleStoreId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                  required
                >
                  <option value="">请选择门店</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
                {storeHasExistingRule && (
                  <p className="mt-1 text-xs text-amber-600 font-medium">
                    该门店已有价格规则，将覆盖原规则
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">基础价格(元)</label>
                  <input
                    type="number"
                    name="basePrice"
                    defaultValue={editingPriceRule?.basePrice}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">节假日附加费(元)</label>
                  <input
                    type="number"
                    name="holidaySurcharge"
                    defaultValue={editingPriceRule?.holidaySurcharge}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">小件价格(元)</label>
                  <input
                    type="number"
                    name="smallPrice"
                    defaultValue={editingPriceRule?.smallPrice}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">中件价格(元)</label>
                  <input
                    type="number"
                    name="mediumPrice"
                    defaultValue={editingPriceRule?.mediumPrice}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">大件价格(元)</label>
                  <input
                    type="number"
                    name="largePrice"
                    defaultValue={editingPriceRule?.largePrice}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">小时费率(元)</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    defaultValue={editingPriceRule?.hourlyRate}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">每日封顶(元)</label>
                  <input
                    type="number"
                    name="dailyCap"
                    defaultValue={editingPriceRule?.dailyCap}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPriceModal(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowHolidayModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {editingHoliday ? '编辑节假日' : '新增节假日'}
              </h3>
              <button
                onClick={() => setShowHolidayModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSaveHoliday} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">节假日名称</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingHoliday?.name}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                  placeholder="例如：春节、国庆"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">日期</label>
                <input
                  type="text"
                  name="date"
                  defaultValue={editingHoliday?.date}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                  placeholder="例如：2025-01-01"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">容量倍数</label>
                  <input
                    type="number"
                    name="capacityMultiplier"
                    defaultValue={editingHoliday?.capacityMultiplier}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    required
                    min="0.1"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">价格倍数</label>
                  <input
                    type="number"
                    name="priceMultiplier"
                    defaultValue={editingHoliday?.priceMultiplier}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    required
                    min="0.1"
                    step="0.1"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowHolidayModal(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
