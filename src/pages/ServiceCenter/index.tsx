import { useState, useMemo } from 'react';
import {
  Headphones,
  XCircle,
  Search,
  Clock,
  User,
  Store,
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  X,
  ChevronRight,
  Star,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { mockTickets } from '@/data/misc';
import {
  getTicketTypeLabel,
  getTicketStatusLabel,
  getTicketStatusColor,
  getPriorityLabel,
  getPriorityColor,
  formatDateTime,
  formatPrice,
} from '@/utils/format';
import type { ServiceTicket, TicketType, TicketStatus } from '@/types';

const typeTabs: { key: TicketType | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: '全部工单', icon: <FileText size={16} /> },
  { key: 'cancel', label: '取消申请', icon: <XCircle size={16} /> },
  { key: 'lost', label: '遗失申报', icon: <AlertTriangle size={16} /> },
  { key: 'compensation', label: '赔付申请', icon: <RefreshCw size={16} /> },
  { key: 'review', label: '差评回访', icon: <Star size={16} /> },
];

const statusTabs: { key: TicketStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部状态' },
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'resolved', label: '已解决' },
  { key: 'closed', label: '已关闭' },
];

export default function ServiceCenter() {
  const [tickets, setTickets] = useState<ServiceTicket[]>(mockTickets);
  const [activeType, setActiveType] = useState<TicketType | 'all'>('all');
  const [activeStatus, setActiveStatus] = useState<TicketStatus | 'all'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      if (activeType !== 'all' && ticket.type !== activeType) return false;
      if (activeStatus !== 'all' && ticket.status !== activeStatus) return false;
      if (searchKeyword && !ticket.title.includes(searchKeyword) && !ticket.orderNo.includes(searchKeyword)) {
        return false;
      }
      return true;
    });
  }, [tickets, activeType, activeStatus, searchKeyword]);

  const stats = useMemo(() => ({
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'pending').length,
    processing: tickets.filter(t => t.status === 'processing').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  }), [tickets]);

  const handleProcess = () => {
    if (!selectedTicket) return;
    setTickets(prev =>
      prev.map(t =>
        t.id === selectedTicket.id
          ? { ...t, status: 'processing', handler: '客服小李', handledAt: new Date().toISOString() }
          : t
      )
    );
    setSelectedTicket(prev =>
      prev ? { ...prev, status: 'processing', handler: '客服小李', handledAt: new Date().toISOString() } : null
    );
  };

  const handleResolve = () => {
    if (!selectedTicket || !replyText.trim()) return;
    setTickets(prev =>
      prev.map(t =>
        t.id === selectedTicket.id
          ? { ...t, status: 'resolved', resolution: replyText }
          : t
      )
    );
    setSelectedTicket(prev =>
      prev ? { ...prev, status: 'resolved', resolution: replyText } : null
    );
    setReplyText('');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 md:p-8 text-white mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Headphones size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">客服工作台</h1>
            <p className="text-blue-100">处理用户工单，提升服务质量</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-blue-100 text-sm mt-1">全部工单</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="text-3xl font-bold text-amber-300">{stats.pending}</div>
            <div className="text-blue-100 text-sm mt-1">待处理</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="text-3xl font-bold text-blue-200">{stats.processing}</div>
            <div className="text-blue-100 text-sm mt-1">处理中</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="text-3xl font-bold text-emerald-300">{stats.resolved}</div>
            <div className="text-blue-100 text-sm mt-1">已解决</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="搜索工单标题、订单号..."
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {typeTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveType(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeType === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">工单列表</h2>
            <div className="flex gap-1">
              {statusTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveStatus(tab.key)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    activeStatus === tab.key
                      ? 'bg-slate-100 text-slate-700 font-medium'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filteredTickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                  selectedTicket?.id === ticket.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTicketStatusColor(ticket.status)}`}>
                      {getTicketStatusLabel(ticket.status)}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {getPriorityLabel(ticket.priority)}优先级
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-800 mb-1">{ticket.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2">{ticket.description}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <FileText size={12} />
                    {ticket.orderNo}
                  </span>
                  <span className="flex items-center gap-1">
                    <Store size={12} />
                    {ticket.storeName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDateTime(ticket.createdAt)}
                  </span>
                </div>
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <div className="py-16 text-center">
                <MessageSquare className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-400">暂无工单</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {selectedTicket ? (
            <>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-800">工单详情</h2>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg"
                >
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[500px]">
                <div className="mb-4">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getTicketStatusColor(selectedTicket.status)}`}>
                    {getTicketStatusLabel(selectedTicket.status)}
                  </span>
                  <span className={`ml-2 px-3 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                    {getPriorityLabel(selectedTicket.priority)}优先级
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-3">{selectedTicket.title}</h3>

                <div className="space-y-3 text-sm mb-6">
                  <div className="flex items-center gap-2 text-slate-600">
                    <User size={14} className="text-slate-400" />
                    <span>用户：{selectedTicket.userName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Store size={14} className="text-slate-400" />
                    <span>门店：{selectedTicket.storeName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileText size={14} className="text-slate-400" />
                    <span>订单：{selectedTicket.orderNo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock size={14} className="text-slate-400" />
                    <span>提交时间：{formatDateTime(selectedTicket.createdAt)}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-slate-700 mb-2">问题描述</h4>
                  <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600">
                    {selectedTicket.description}
                  </div>
                </div>

                {selectedTicket.images && selectedTicket.images.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-slate-700 mb-2">凭证图片</h4>
                    <div className="flex gap-2">
                      {selectedTicket.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt="凭证"
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {selectedTicket.resolution && (
                  <div className="mb-6">
                    <h4 className="font-medium text-slate-700 mb-2">处理结果</h4>
                    <div className="p-4 bg-emerald-50 rounded-xl text-sm text-emerald-700 border border-emerald-100">
                      {selectedTicket.resolution}
                    </div>
                  </div>
                )}

                {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">处理回复</h4>
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="请输入处理结果..."
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                    <div className="flex gap-2 mt-3">
                      {selectedTicket.status === 'pending' && (
                        <button
                          onClick={handleProcess}
                          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
                        >
                          开始处理
                        </button>
                      )}
                      {selectedTicket.status === 'processing' && (
                        <button
                          onClick={handleResolve}
                          disabled={!replyText.trim()}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                        >
                          标记已解决
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-16 text-center">
              <MessageSquare className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-slate-400">选择工单查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
