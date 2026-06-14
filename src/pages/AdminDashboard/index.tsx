import { useState, useMemo } from 'react';
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
  MoreHorizontal,
  Edit,
  Trash2,
  X,
  Check,
  Clock,
  FileText,
} from 'lucide-react';
import { mockStores } from '@/data/stores';
import { mockSettlements, mockHolidays } from '@/data/misc';
import { formatPrice, formatDateTime } from '@/utils/format';
import type { Store, Settlement, HolidayConfig } from '@/types';

const menuTabs = [
  { key: 'dashboard', label: '数据概览', icon: <BarChart3 size={18} /> },
  { key: 'stores', label: '门店管理', icon: <StoreIcon size={18} /> },
  { key: 'pricing', label: '价格规则', icon: <DollarSign size={18} /> },
  { key: 'holidays', label: '节假日配置', icon: <Calendar size={18} /> },
  { key: 'settlements', label: '结算明细', icon: <FileText size={18} /> },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stores, setStores] = useState<Store[]>(mockStores);
  const [settlements] = useState<Settlement[]>(mockSettlements);
  const [holidays, setHolidays] = useState<HolidayConfig[]>(mockHolidays);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

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

  const handleSaveStore = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Save logic here
    setShowStoreModal(false);
    setEditingStore(null);
  };

  return (
    <div className="max-w-7xl mx-auto">
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
                    <span className="text-sm font-bold text-teal-600">{formatPrice(store.basePrice * 100)}</span>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">评分</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">容量</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">状态</th>
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
                      <span className="text-sm font-medium text-amber-600">{store.rating}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {store.availableCapacity}/{store.totalCapacity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                        营业中
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                          <Edit size={14} className="text-slate-500" />
                        </button>
                        <button className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-6">价格规则配置</h3>
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-medium text-slate-700 mb-4">基础价格设置</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 mb-1">小件价格</label>
                  <input type="number" defaultValue={10} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">中件价格</label>
                  <input type="number" defaultValue={15} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">大件价格</label>
                  <input type="number" defaultValue={25} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-medium text-slate-700 mb-4">时段计价规则</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 mb-1">每小时费用</label>
                  <input type="number" defaultValue={5} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">每日封顶</label>
                  <input type="number" defaultValue={30} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500" />
                </div>
              </div>
            </div>
            <button className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors">
              保存配置
            </button>
          </div>
        </div>
      )}

      {activeTab === 'holidays' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">节假日配置</h3>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
              <Plus size={16} />
              新增节假日
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {holidays.map(holiday => (
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
                    <button className="flex-1 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                      编辑
                    </button>
                    <button className="flex-1 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
                        <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                          确认结算
                        </button>
                      )}
                      {s.status === 'settled' && (
                        <button className="text-sm text-slate-500 hover:text-slate-700">
                          查看详情
                        </button>
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
                  defaultValue={editingStore?.name}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                  placeholder="请输入门店名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">门店地址</label>
                <input
                  type="text"
                  defaultValue={editingStore?.address}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                  placeholder="请输入门店地址"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">营业时间</label>
                  <input
                    type="text"
                    defaultValue={editingStore?.businessHours}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    placeholder="09:00 - 21:00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">联系电话</label>
                  <input
                    type="text"
                    defaultValue={editingStore?.phone}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    placeholder="联系电话"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">总容量</label>
                  <input
                    type="number"
                    defaultValue={editingStore?.totalCapacity}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">基础价格</label>
                  <input
                    type="number"
                    defaultValue={editingStore?.basePrice}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
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
    </div>
  );
}
