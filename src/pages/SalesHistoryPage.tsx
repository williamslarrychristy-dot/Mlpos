import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { History, Filter, Download, Printer, RotateCcw, X, FileText, FileSpreadsheet, BookOpen } from 'lucide-react';

export const SalesHistoryPage: React.FC = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPayment, setFilterPayment] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [viewAsBookOpen, setViewAsBookOpen] = useState(false);

  const loadSales = async () => {
    setLoading(true);
    try {
      let query = `?payment=${filterPayment}`;
      const data = await fetchApi(`/sales${query}`);
      setSales(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [filterPayment]);

  const viewSaleDetails = async (id: string) => {
    try {
      const data = await fetchApi(`/sales/${id}`);
      setSelectedSale(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturn = async (saleId: string, items: any[]) => {
    if (!confirm('Are you sure you want to process a full return for this sale?')) return;
    try {
      await fetchApi(`/sales/${saleId}/return`, {
        method: 'POST',
        body: JSON.stringify({ items })
      });
      alert('Return processed successfully!');
      setSelectedSale(null);
      loadSales();
    } catch (err: any) {
      alert(err.message || 'Return failed');
    }
  };

  const handleExport = (format: string) => {
    window.open(`/api/sales/export?format=${format}`, '_blank');
  };

  return (
    <div className="space-y-6 relative">
      {/* ViewAsBook Floating Action Button */}
      <button
        onClick={() => setViewAsBookOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-full shadow-2xl flex items-center space-x-2 transition-all hover:scale-105"
        title="View As Book / Export Ledger"
      >
        <BookOpen className="w-5 h-5" />
        <span className="text-xs font-bold hidden sm:inline">ViewAsBook</span>
      </button>

      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Sales History</span>
          </h2>
          <p className="text-xs text-slate-500">Track and inspect all completed sales transactions</p>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="POS">POS</option>
            <option value="Transfer">Transfer</option>
          </select>
        </div>
      </div>

      {/* Sales List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : sales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Receipt</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Cashier</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    onClick={() => viewSaleDetails(sale.id)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-blue-600">{sale.receipt_no}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{sale.customer_name || 'Walk-in'}</td>
                    <td className="py-3 px-4 text-slate-500">{sale.member_name || 'Admin'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700">
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-800">${Number(sale.total).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        sale.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{new Date(sale.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-slate-400 py-12 text-xs">No sales records found.</p>
        )}
      </div>

      {/* Sale Details Modal / Card */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">{selectedSale.receipt_no}</h3>
                <p className="text-[10px] text-slate-400">{new Date(selectedSale.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Customer:</span>
                <span className="font-bold">{selectedSale.customer_name || 'Walk-in'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Method:</span>
                <span className="font-bold">{selectedSale.payment_method}</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Items Purchased</div>
              {selectedSale.items?.map((it: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{it.product_name}</div>
                    <div className="text-[10px] text-slate-400">{it.qty} x ${Number(it.unit_price).toFixed(2)}</div>
                  </div>
                  <div className="font-extrabold text-slate-800">${Number(it.total).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1 text-xs">
              <div className="flex justify-between font-extrabold text-slate-800 text-base">
                <span>Grand Total:</span>
                <span>${Number(selectedSale.total).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>

              {selectedSale.status !== 'returned' && (
                <button
                  onClick={() => handleReturn(selectedSale.id, selectedSale.items)}
                  className="bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Return</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ViewAsBook Modal */}
      {viewAsBookOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>ViewAsBook Exporter</span>
              </h3>
              <button onClick={() => setViewAsBookOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Export full sales ledger with cash/POS/transfer total breakdowns.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full bg-slate-50 hover:bg-blue-50 border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-3"
              >
                <FileText className="w-5 h-5 text-rose-500" />
                <span>Download PDF Document</span>
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="w-full bg-slate-50 hover:bg-blue-50 border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-3"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <span>Download Excel Spreadsheet</span>
              </button>
              <button
                onClick={() => handleExport('word')}
                className="w-full bg-slate-50 hover:bg-blue-50 border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-3"
              >
                <Download className="w-5 h-5 text-blue-500" />
                <span>Download Word Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
