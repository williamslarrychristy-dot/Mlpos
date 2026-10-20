import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { Receipt, Plus, Trash2 } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('General');

  const loadExpenses = async () => {
    try {
      const data = await fetchApi('/expenses');
      setExpenses(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    try {
      await fetchApi('/expenses', {
        method: 'POST',
        body: JSON.stringify({ title, amount: Number(amount), category })
      });
      setTitle('');
      setAmount('');
      loadExpenses();
    } catch (err: any) {
      alert(err.message || 'Error adding expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await fetchApi(`/expenses/${id}`, { method: 'DELETE' });
      loadExpenses();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-amber-600" />
            <span>Business Expenses</span>
          </h2>
          <p className="text-xs text-slate-500">Track all operating expenditures live</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-right">
          <span className="text-[10px] font-bold text-amber-800 uppercase">Total Expenses</span>
          <div className="text-lg font-extrabold text-amber-900">${totalExpenses.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <form onSubmit={handleAddExpense} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 h-fit text-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-2">Record New Expense</h3>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Title / Description</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Electricity bill, Rent, Transport"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="General">General</option>
              <option value="Utilities">Utilities</option>
              <option value="Salaries">Salaries</option>
              <option value="Rent">Rent</option>
              <option value="Transport">Transport</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1 mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </form>

        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="py-3 px-4 font-bold text-slate-800">{e.title}</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">{e.category}</span></td>
                    <td className="py-3 px-4 font-extrabold text-amber-700">${Number(e.amount).toFixed(2)}</td>
                    <td className="py-3 px-4 text-slate-400">{new Date(e.date || e.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleDelete(e.id)} className="p-1 text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
