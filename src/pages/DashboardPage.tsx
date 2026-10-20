import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../api';
import {
  ShoppingCart,
  BarChart3,
  RotateCcw,
  Receipt,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Package,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/dashboard');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm border border-rose-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/pos"
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl shadow-xs transition-all flex flex-col justify-between h-28"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="font-bold text-sm">ML POS</span>
        </Link>
        <Link
          to="/reports"
          className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-2xl shadow-xs transition-all flex flex-col justify-between h-28"
        >
          <BarChart3 className="w-6 h-6" />
          <span className="font-bold text-sm">Reports</span>
        </Link>
        <Link
          to="/restock"
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl shadow-xs transition-all flex flex-col justify-between h-28"
        >
          <RotateCcw className="w-6 h-6" />
          <span className="font-bold text-sm">Restock</span>
        </Link>
        <Link
          to="/expenses"
          className="bg-amber-600 hover:bg-amber-700 text-white p-4 rounded-2xl shadow-xs transition-all flex flex-col justify-between h-28"
        >
          <Receipt className="w-6 h-6" />
          <span className="font-bold text-sm">Expenses</span>
        </Link>
      </div>

      {/* Live Totals Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-800">${data?.sales?.today?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-slate-400 mt-1">
              Week: ${data?.sales?.week?.toFixed(2)} | Month: ${data?.sales?.month?.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-800">${data?.expenses?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-slate-400 mt-1">All recorded business expenses</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Grand Profit</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-bold ${data?.grandProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ${data?.grandProfit?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-slate-400 mt-1">Net gross margin after expenses</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Orders / Purchases</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-800">{data?.orderCount || 0} Orders</div>
            <p className="text-xs text-slate-400 mt-1">
              Restocks total: ${data?.purchases?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Stock Value & Sales Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-base">Sales Overview (Last 7 Days)</h3>
            <span className="text-xs text-slate-400">Live revenue</span>
          </div>

          <div className="h-64 w-full">
            {data?.salesOverview && data.salesOverview.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.salesOverview}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
                    formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Sales']}
                  />
                  <Area type="monotone" dataKey="total_sales" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No recent sales recorded yet
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts & Total Inventory Value */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inventory Asset Value</span>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-800">${data?.stockValue?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-slate-400 mt-1">Cost price × stock quantity</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="font-bold text-slate-800 text-sm">Low Stock Alerts</h4>
              </div>
              <Link to="/items/products" className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-1">
                <span>See More</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {data?.lowStockAlerts && data.lowStockAlerts.length > 0 ? (
              <div className="space-y-2">
                {data.lowStockAlerts.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[150px]">{item.name}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      item.stock === 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.stock} left
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">All product stocks are healthy!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
