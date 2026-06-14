import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MapPin,
  List,
  ShoppingCart,
  Package,
  QrCode,
  Store,
  Headphones,
  BarChart3,
  Menu,
  X,
  User,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import type { UserRole } from '@/types';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems: { path: string; label: string; icon: React.ReactNode; roles: UserRole[] }[] = [
  { path: '/', label: '寄存点', icon: <List size={18} />, roles: ['visitor'] },
  { path: '/map', label: '地图', icon: <MapPin size={18} />, roles: ['visitor'] },
  { path: '/orders', label: '我的订单', icon: <ShoppingCart size={18} />, roles: ['visitor'] },
  { path: '/pickup', label: '取件核验', icon: <QrCode size={18} />, roles: ['visitor', 'store'] },
  { path: '/store/workbench', label: '工作台', icon: <Store size={18} />, roles: ['store'] },
  { path: '/service', label: '客服中心', icon: <Headphones size={18} />, roles: ['service'] },
  { path: '/admin', label: '运营管理', icon: <BarChart3 size={18} />, roles: ['admin'] },
];

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'visitor', label: '游客端' },
  { value: 'store', label: '门店端' },
  { value: 'service', label: '客服端' },
  { value: 'admin', label: '运营端' },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, currentRole, switchRole } = useUserStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const visibleNavItems = navItems.filter(item => item.roles.includes(currentRole));

  const handleRoleSwitch = (role: UserRole) => {
    switchRole(role);
    setRoleDropdownOpen(false);
    const firstNav = navItems.find(item => item.roles.includes(role));
    if (firstNav) {
      navigate(firstNav.path);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                <Package className="text-white" size={20} />
              </div>
              <span className="font-bold text-lg text-slate-800">存易点</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {visibleNavItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                >
                  <span className="hidden sm:inline">
                    {roleOptions.find(r => r.value === currentRole)?.label}
                  </span>
                  <ChevronDown size={16} />
                </button>
                {roleDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                    {roleOptions.map(role => (
                      <button
                        key={role.value}
                        onClick={() => handleRoleSwitch(role.value)}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          currentRole === role.value
                            ? 'bg-teal-50 text-teal-700'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {currentUser?.nickname}
                </span>
              </div>

              <button
                className="md:hidden p-2 rounded-lg hover:bg-slate-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              {visibleNavItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                    location.pathname === item.path
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center">
                <Package className="text-white" size={18} />
              </div>
              <span className="font-bold text-slate-800">存易点</span>
            </div>
            <p className="text-sm text-slate-500">
              © 2024 存易点 · 让旅行更轻松
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
