import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  BarChart3,
  History,
  RotateCcw,
  Receipt,
  Package,
  Percent,
  CreditCard,
  Users,
  Truck,
  UserCheck,
  Settings,
  Bot,
  Layers,
  Menu,
  X,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC<{ toastMessage?: string | null }> = ({ toastMessage }) => {
  const { user, businessName, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [itemsSubOpen, setItemsSubOpen] = useState(false);

  const mainNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'ML POS', path: '/pos', icon: ShoppingCart },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Sales History', path: '/sales-history', icon: History },
    { name: 'Restock', path: '/restock', icon: RotateCcw },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
  ];

  const itemSubNav = [
    { name: 'Products', path: '/items/products' },
    { name: 'Attributes', path: '/items/attributes' },
    { name: 'Categories', path: '/items/categories' },
    { name: 'Brands', path: '/items/brands' },
    { name: 'Units', path: '/items/units' },
  ];

  const secondaryNav = [
    { name: 'Discounts', path: '/discounts', icon: Percent },
    { name: 'Payment Methods', path: '/payment-methods', icon: CreditCard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Suppliers', path: '/suppliers', icon: Truck },
    { name: 'Members', path: '/members', icon: UserCheck },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'AI Agent', path: '/ai-agent', icon: Bot },
    { name: 'Tier B / Unmetered', path: '/tier-b', icon: Layers },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast Notification Bar */}
      {toastMessage && (
        <div className="bg-amber-500 text-white text-xs text-center py-1.5 px-4 fixed top-0 left-0 right-0 z-50 shadow-md">
          {toastMessage}
        </div>
      )}

      {/* Header - Displays Business Name */}
      <header className={`bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-xs ${toastMessage ? 'mt-7' : ''}`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-600 hover:text-slate-900 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              {businessName.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-lg font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs">
              {businessName}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-700">{user?.name}</p>
            <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-4 space-y-1 overflow-y-auto shrink-0">
          <div className="text-xs font-bold text-slate-400 px-3 uppercase tracking-wider mb-2">Navigation</div>

          {mainNav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Items Accordion */}
          <div>
            <button
              onClick={() => setItemsSubOpen(!itemsSubOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                location.pathname.startsWith('/items')
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Package className={`w-5 h-5 ${location.pathname.startsWith('/items') ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Items</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${itemsSubOpen || location.pathname.startsWith('/items') ? 'rotate-180' : ''}`} />
            </button>

            {(itemsSubOpen || location.pathname.startsWith('/items')) && (
              <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-100 pl-2">
                {itemSubNav.map((sub) => {
                  const active = location.pathname === sub.path;
                  return (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      className={`block py-1.5 px-3 rounded-lg text-xs font-medium ${
                        active ? 'text-blue-600 bg-blue-50/50 font-semibold' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {sub.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-xs font-bold text-slate-400 px-3 uppercase tracking-wider pt-4 mb-2">Management</div>

          {secondaryNav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex">
            <div className="w-4/5 max-w-sm bg-white h-full p-4 space-y-2 overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="font-bold text-slate-800 text-base">{businessName}</div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {mainNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Icon className="w-5 h-5 text-slate-400" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              <div className="pt-2 border-t border-slate-100 text-xs font-bold text-slate-400 px-2 uppercase">Items</div>
              {itemSubNav.map((sub) => (
                <Link
                  key={sub.path}
                  to={sub.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-6 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
                >
                  {sub.name}
                </Link>
              ))}

              <div className="pt-2 border-t border-slate-100 text-xs font-bold text-slate-400 px-2 uppercase">Management</div>
              {secondaryNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Icon className="w-5 h-5 text-slate-400" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 flex items-center justify-around py-2 px-1 shadow-lg">
        <Link
          to="/dashboard"
          className={`flex flex-col items-center space-y-0.5 ${
            location.pathname === '/dashboard' ? 'text-blue-600 font-semibold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </Link>
        <Link
          to="/pos"
          className={`flex flex-col items-center space-y-0.5 ${
            location.pathname === '/pos' ? 'text-blue-600 font-semibold' : 'text-slate-400'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px]">POS</span>
        </Link>
        <Link
          to="/reports"
          className={`flex flex-col items-center space-y-0.5 ${
            location.pathname.startsWith('/reports') ? 'text-blue-600 font-semibold' : 'text-slate-400'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px]">Reports</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center space-y-0.5 text-slate-400"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">More</span>
        </button>
      </nav>
    </div>
  );
};
