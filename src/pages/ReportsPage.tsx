import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { Calendar, Download, RefreshCw, BarChart2 } from 'lucide-react';

const reportTypes = [
  { id: 'sales-summary', name: 'Sales Summary' },
  { id: 'daily-sales', name: 'Daily Sales' },
  { id: 'sales-all', name: 'Sales (All Transactions)' },
  { id: 'sales-by-product', name: 'Sales by Product' },
  { id: 'sales-by-category', name: 'Sales by Category' },
  { id: 'sales-by-payment-method', name: 'Sales by Payment Method' },
  { id: 'profit-loss', name: 'Profit & Loss' },
  { id: 'tax-report', name: 'Tax Report' },
  { id: 'discounts-refunds', name: 'Discounts & Refunds' },
  { id: 'transactions', name: 'Transactions Ledger' },
  { id: 'stock-summary', name: 'Stock Summary' },
  { id: 'stock-report', name: 'Stock Report' },
  { id: 'purchases-receiving', name: 'Purchases / Receiving Report' },
  { id: 'customer-records', name: 'Customer Purchase Records' },
  { id: 'top-customers', name: 'Top Customers' },
  { id: 'employee-performance', name: 'Employee Sales Performance' },
  { id: 'management-overview', name: 'Management Overview' },
  { id: 'best-selling', name: 'Best Selling Products' },
  { id: 'slow-moving', name: 'Slow Moving Products' },
];

export const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState('sales-summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      let query = `?start=${startDate}&end=${endDate}`;
      const data = await fetchApi(`/reports/${activeReport}${query}`);
      setReportData(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeReport]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Reports Hub</h2>
          <p className="text-xs text-slate-500">Real-time calculations from your PostgreSQL database</p>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-slate-700"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-slate-700"
            />
          </div>
          <button
            onClick={loadReport}
            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Report Types Sub-menu */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-1 h-fit">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">Report Sub-Pages</div>
          {reportTypes.map((rep) => (
            <button
              key={rep.id}
              onClick={() => setActiveReport(rep.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                activeReport === rep.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{rep.name}</span>
            </button>
          ))}
        </div>

        {/* Report Results Viewport */}
        <div className="md:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs min-h-[400px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              <span>{reportTypes.find(r => r.id === activeReport)?.name}</span>
            </h3>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export / Print</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : reportData ? (
            Array.isArray(reportData) ? (
              reportData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                        {Object.keys(reportData[0]).map((key) => (
                          <th key={key} className="pb-2 px-2">{key.replace(/_/g, ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          {Object.values(row).map((val: any, j: number) => (
                            <td key={j} className="py-2.5 px-2 text-slate-700">
                              {typeof val === 'number' ? `$${val.toFixed(2)}` : String(val ?? '-')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-slate-400 py-12 text-xs">No records found for the selected filter.</p>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(reportData).map(([k, v]) => (
                  <div key={k} className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k.replace(/_/g, ' ')}</span>
                    <div className="text-xl font-extrabold text-slate-800 mt-1">
                      {typeof v === 'number' ? `$${v.toFixed(2)}` : String(v)}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p className="text-center text-slate-400 py-12 text-xs">Select a report to view live analytics.</p>
          )}
        </div>
      </div>
    </div>
  );
};
