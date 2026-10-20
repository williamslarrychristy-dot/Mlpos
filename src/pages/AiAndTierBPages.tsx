import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { Bot, Send, Sparkles, Layers, GraduationCap, Plus, X } from 'lucide-react';

export const AiAgentPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; tool?: string }>>([
    { sender: 'ai', text: 'Hello! I am your MotoLarry Business AI Agent. You can ask me to update stock, change prices, create products, or summarize sales.' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userMsg = prompt;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await fetchApi('/ai/command', {
        method: 'POST',
        body: JSON.stringify({ prompt: userMsg })
      });

      setMessages(prev => [...prev, { sender: 'ai', text: res.reply, tool: res.toolCalled }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { sender: 'ai', text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center space-x-3">
        <div className="p-2 bg-blue-600 text-white rounded-xl">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800 text-sm">MotoLarry AI Copilot</h2>
          <p className="text-[10px] text-slate-400">Powered by Gemini 2.5 with live tool execution</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
              m.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'
            }`}>
              {m.tool && (
                <div className="flex items-center space-x-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md w-fit">
                  <Sparkles className="w-3 h-3" />
                  <span>Executed tool: {m.tool}</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{m.text}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-3 rounded-2xl text-xs text-slate-400 animate-pulse">
              AI Copilot is processing your command...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 bg-slate-50 border-t border-slate-200 flex items-center space-x-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. 'Add 10 items to Brake Shoe stock' or 'Show low stock products'..."
          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export const TierBPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [graduatingItem, setGraduatingItem] = useState<any>(null);

  const [gradForm, setGradForm] = useState({
    sku: '',
    cost_price: 0,
    sale_price: 0,
    stock: 10
  });

  const loadItems = async () => {
    try {
      const data = await fetchApi('/tier-b-products');
      setItems(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadItems(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/tier-b-products', {
        method: 'POST',
        body: JSON.stringify({ name, price: Number(price) || 0, notes })
      });
      setName('');
      setPrice('');
      setNotes('');
      loadItems();
    } catch (err: any) { alert(err.message); }
  };

  const handleGraduate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!graduatingItem) return;
    try {
      await fetchApi(`/tier-b-products/${graduatingItem.id}/graduate`, {
        method: 'POST',
        body: JSON.stringify({
          name: graduatingItem.name,
          sku: gradForm.sku,
          cost_price: gradForm.cost_price,
          sale_price: gradForm.sale_price,
          stock: gradForm.stock
        })
      });
      alert(`Graduated ${graduatingItem.name} to regular tracked inventory!`);
      setGraduatingItem(null);
      loadItems();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Tier B / Unmetered Products</span>
          </h2>
          <p className="text-xs text-slate-500">For high-volume, uncounted bulk items (e.g. bolts, washers, nuts)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <form onSubmit={handleAdd} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 h-fit text-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-2">Register Unmetered Product</h3>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. M8 Steel Bolts Box"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Standard Price ($)</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.50"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sold by estimation..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-xs">
            Save Unmetered Item
          </button>
        </form>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((it) => (
            <div key={it.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between h-36">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm">{it.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    it.graduated ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {it.graduated ? 'Graduated' : 'Unmetered'}
                  </span>
                </div>
                <p className="text-xs font-extrabold text-blue-600 mt-1">${Number(it.price).toFixed(2)}</p>
                {it.notes && <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{it.notes}</p>}
              </div>

              {!it.graduated && (
                <button
                  onClick={() => {
                    setGraduatingItem(it);
                    setGradForm({ sku: '', cost_price: 0, sale_price: Number(it.price) || 0, stock: 10 });
                  }}
                  className="w-full py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 mt-2"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Graduate to Tracked Product</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {graduatingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Graduate {graduatingItem.name}</h3>
              <button onClick={() => setGraduatingItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGraduate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">SKU</label>
                <input
                  type="text"
                  value={gradForm.sku}
                  onChange={(e) => setGradForm({ ...gradForm, sku: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={gradForm.cost_price}
                    onChange={(e) => setGradForm({ ...gradForm, cost_price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Sale Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={gradForm.sale_price}
                    onChange={(e) => setGradForm({ ...gradForm, sale_price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Initial Tracked Stock</label>
                <input
                  type="number"
                  required
                  value={gradForm.stock}
                  onChange={(e) => setGradForm({ ...gradForm, stock: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl shadow-md">
                Confirm Graduation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
