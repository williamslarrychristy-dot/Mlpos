import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { RotateCcw, Plus, Truck, Package, X, Check } from 'lucide-react';

export const RestockPage: React.FC = () => {
  const [restocks, setRestocks] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [items, setItems] = useState<Array<{ product_id: string; qty: number; unit_cost: number }>>([]);

  const loadData = async () => {
    try {
      const [r, s, p] = await Promise.all([
        fetchApi('/restocks'),
        fetchApi('/suppliers'),
        fetchApi('/products')
      ]);
      setRestocks(r);
      setSuppliers(s);
      setProducts(p);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addItemRow = () => {
    if (products.length === 0) return;
    setItems([...items, { product_id: products[0].id, qty: 1, unit_cost: Number(products[0].cost_price) || 0 }]);
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert('Please add at least one product item.');
    try {
      await fetchApi('/restocks', {
        method: 'POST',
        body: JSON.stringify({
          supplier_id: selectedSupplier || null,
          items
        })
      });
      setModalOpen(false);
      setItems([]);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Restock creation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <RotateCcw className="w-5 h-5 text-blue-600" />
            <span>Restock & Inventory Receiving</span>
          </h2>
          <p className="text-xs text-slate-500">Record purchase orders and automatically increment stock</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>New Restock PO</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Total Cost</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {restocks.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 px-4 font-bold text-blue-600">{r.reference}</td>
                  <td className="py-3 px-4 font-medium text-slate-700">{r.supplier_name || 'Direct Restock'}</td>
                  <td className="py-3 px-4 font-extrabold text-slate-800">${Number(r.total_cost).toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">New Restock Purchase Order</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Select Supplier</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">-- Direct Restock --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Restock Items</span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-blue-600 font-bold text-xs hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl">
                    <select
                      value={it.product_id}
                      onChange={(e) => {
                        const newIt = [...items];
                        newIt[idx].product_id = e.target.value;
                        setItems(newIt);
                      }}
                      className="flex-1 p-1.5 bg-white border border-slate-200 rounded-lg"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={it.qty}
                      onChange={(e) => {
                        const newIt = [...items];
                        newIt[idx].qty = Number(e.target.value);
                        setItems(newIt);
                      }}
                      className="w-16 p-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Cost"
                      value={it.unit_cost}
                      onChange={(e) => {
                        const newIt = [...items];
                        newIt[idx].unit_cost = Number(e.target.value);
                        setItems(newIt);
                      }}
                      className="w-20 p-1.5 bg-white border border-slate-200 rounded-lg text-center"
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-all mt-4"
              >
                Receive Stock & Complete Order
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
