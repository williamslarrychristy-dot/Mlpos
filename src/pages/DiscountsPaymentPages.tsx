import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { Percent, CreditCard, Plus, Check, X } from 'lucide-react';

export const DiscountsPage: React.FC = () => {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('');

  const loadDiscounts = async () => {
    try {
      const data = await fetchApi('/discounts');
      setDiscounts(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadDiscounts(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/discounts', {
        method: 'POST',
        body: JSON.stringify({ name, type, value: Number(value), active: true })
      });
      setName('');
      setValue('');
      loadDiscounts();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <Percent className="w-5 h-5 text-blue-600" />
            <span>Discounts Management</span>
          </h2>
          <p className="text-xs text-slate-500">Configure discount rules available during checkout</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <form onSubmit={handleAdd} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 h-fit text-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-2">Create Discount Rule</h3>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Discount Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. VIP Promo, Staff Discount"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount ($)</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Value</label>
            <input
              type="number"
              step="0.01"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="10"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-xs">
            Add Discount
          </button>
        </form>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {discounts.map((d) => (
            <div key={d.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{d.name}</h4>
                <p className="text-xs font-extrabold text-blue-600 mt-0.5">
                  {d.type === 'percentage' ? `${d.value}% Off` : `$${Number(d.value).toFixed(2)} Off`}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PaymentMethodsPage: React.FC = () => {
  const [methods, setMethods] = useState<any[]>([]);
  const [name, setName] = useState('');

  const loadMethods = async () => {
    try {
      const data = await fetchApi('/payment-methods');
      setMethods(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadMethods(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/payment-methods', {
        method: 'POST',
        body: JSON.stringify({ name, active: true })
      });
      setName('');
      loadMethods();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>Payment Methods</span>
          </h2>
          <p className="text-xs text-slate-500">Configure payment options shown during checkout</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <form onSubmit={handleAdd} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 h-fit text-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-2">Add Payment Method</h3>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Method Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mobile Money, Cheque"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-xs">
            Add Method
          </button>
        </form>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {methods.map((m) => (
            <div key={m.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm">{m.name}</h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Enabled</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
