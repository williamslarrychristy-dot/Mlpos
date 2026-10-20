import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { localDb, LocalProduct } from '../db';
import { Search, ShoppingCart, Trash2, Plus, Minus, PauseCircle, PlayCircle, CheckCircle, Printer, X, RotateCcw } from 'lucide-react';

export const PosPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [heldCarts, setHeldCarts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('Cash');
  const [selectedDiscount, setSelectedDiscount] = useState<any>(null);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [isReturn, setIsReturn] = useState(false);

  const [checkoutModal, setCheckoutModal] = useState(false);
  const [receiptModal, setReceiptModal] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadProducts = async (q = '') => {
    try {
      if (navigator.onLine) {
        const data = await fetchApi(`/products/search?q=${encodeURIComponent(q)}`);
        setProducts(data);
      } else {
        const localProds = await localDb.products.filter(p => p.active && p.name.toLowerCase().includes(q.toLowerCase())).toArray();
        setProducts(localProds);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAuxData = async () => {
    try {
      if (navigator.onLine) {
        const [c, p, d] = await Promise.all([
          fetchApi('/customers'),
          fetchApi('/payment-methods'),
          fetchApi('/discounts')
        ]);
        setCustomers(c);
        setPaymentMethods(p.filter((m: any) => m.active));
        setDiscounts(d.filter((m: any) => m.active));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadAuxData();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    loadProducts(val);
  };

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product_id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        unit_price: Number(product.sale_price),
        qty: 1,
        stock: product.stock
      }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product_id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.qty * item.unit_price), 0);
  let discountAmount = 0;
  if (selectedDiscount) {
    if (selectedDiscount.type === 'percentage') {
      discountAmount = (subtotal * Number(selectedDiscount.value)) / 100;
    } else {
      discountAmount = Number(selectedDiscount.value);
    }
  }
  const total = Math.max(0, subtotal - discountAmount);
  const changeGiven = Math.max(0, (Number(amountPaid) || total) - total);

  const holdCurrentCart = () => {
    if (cart.length === 0) return;
    setHeldCarts([...heldCarts, { id: Date.now(), cart, timestamp: new Date().toLocaleTimeString() }]);
    setCart([]);
  };

  const restoreCart = (heldId: number) => {
    const target = heldCarts.find(h => h.id === heldId);
    if (target) {
      setCart(target.cart);
      setHeldCarts(heldCarts.filter(h => h.id !== heldId));
    }
  };

  const processCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    const payload = {
      customer_id: selectedCustomer || null,
      items: cart,
      total,
      discount: discountAmount,
      payment_method: selectedPayment,
      amount_paid: Number(amountPaid) || total,
      change_given: changeGiven
    };

    try {
      if (navigator.onLine) {
        const res = await fetchApi('/sales', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setReceiptModal({ ...res, items: cart });
      } else {
        // Save locally to Dexie + Sync Queue
        const localId = `LOCAL-${Date.now()}`;
        const receiptNo = `REC-OFFLINE-${Date.now().toString().slice(-4)}`;
        const localSale: any = {
          id: localId,
          business_id: 'local',
          receipt_no: receiptNo,
          customer_id: selectedCustomer || undefined,
          total,
          discount: discountAmount,
          tax: 0,
          payment_method: selectedPayment,
          amount_paid: Number(amountPaid) || total,
          change_given: changeGiven,
          status: 'completed',
          created_at: new Date().toISOString(),
          items: cart,
          _syncStatus: 'pending',
          _lastModified: Date.now()
        };

        await localDb.sales.add(localSale);
        await localDb.syncQueue.add({
          business_id: 'local',
          table_name: 'sales',
          record_id: localId,
          operation: 'CREATE',
          payload,
          retry_count: 0,
          created_at: Date.now()
        });

        setReceiptModal(localSale);
      }

      setCart([]);
      setCheckoutModal(false);
      loadProducts(search);
    } catch (err: any) {
      alert(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col md:flex-row gap-4">
      {/* Product Catalog Panel */}
      <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search products by name, SKU, price, alias..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setIsReturn(!isReturn)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1 ${
              isReturn ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isReturn ? 'Return Mode' : 'Sale Mode'}</span>
          </button>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pr-1">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 p-3 rounded-2xl text-left transition-all flex flex-col justify-between h-32 group"
            >
              <div>
                <div className="font-bold text-slate-800 text-xs line-clamp-2 group-hover:text-blue-600">
                  {p.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{p.sku || 'No SKU'}</div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
                <span className="font-extrabold text-blue-600 text-sm">${Number(p.sale_price).toFixed(2)}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                  p.stock <= p.low_stock_threshold ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {p.stock}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-full md:w-96 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">Cart ({cart.length})</h3>
            </div>
            {cart.length > 0 && (
              <button onClick={holdCurrentCart} className="text-xs font-semibold text-amber-600 hover:underline flex items-center space-x-1">
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Hold</span>
              </button>
            )}
          </div>

          {heldCarts.length > 0 && (
            <div className="mb-3 p-2 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
              <div className="text-[10px] font-bold text-amber-800 uppercase">Held Carts ({heldCarts.length})</div>
              <div className="flex flex-wrap gap-1">
                {heldCarts.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => restoreCart(h.id)}
                    className="px-2 py-1 bg-amber-200 text-amber-900 rounded-lg text-[10px] font-bold hover:bg-amber-300 flex items-center space-x-1"
                  >
                    <PlayCircle className="w-3 h-3" />
                    <span>{h.timestamp}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {cart.map((item) => (
              <div key={item.product_id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                <div className="flex-1 mr-2">
                  <div className="font-bold text-slate-800 truncate">{item.name}</div>
                  <div className="text-slate-400 text-[10px]">${item.unit_price.toFixed(2)} each</div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => updateQty(item.product_id, -1)} className="p-1 text-slate-500 hover:bg-slate-200 rounded-md">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold text-slate-800 w-4 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.product_id, 1)} className="p-1 text-slate-500 hover:bg-slate-200 rounded-md">
                    <Plus className="w-3 h-3" />
                  </button>
                  <span className="font-extrabold text-slate-800 ml-2">${(item.qty * item.unit_price).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total & Checkout trigger */}
        <div className="pt-3 border-t border-slate-200 space-y-3">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-slate-800 text-base pt-1 border-t border-slate-100">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => setCheckoutModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <span>Proceed to Checkout</span>
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Checkout</h3>
              <button onClick={() => setCheckoutModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Customer (Optional)</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="">-- Walk-in Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone || 'No phone'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setSelectedPayment(pm.name)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center ${
                        selectedPayment === pm.name
                          ? 'bg-blue-50 border-blue-600 text-blue-600'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {pm.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Apply Discount</label>
                <select
                  onChange={(e) => {
                    const d = discounts.find(x => x.id === e.target.value);
                    setSelectedDiscount(d || null);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="">-- No Discount --</option>
                  {discounts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.type === 'percentage' ? `${d.value}%` : `$${d.value}`})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Amount Paid ($)</label>
                <input
                  type="number"
                  placeholder={total.toFixed(2)}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Grand Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Change Given:</span>
                  <span>${changeGiven.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={processCheckout}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{loading ? 'Processing...' : 'Confirm & Print Receipt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-xl p-6 space-y-4">
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <h2 className="font-bold text-slate-800 text-lg">MotoLarry Store</h2>
              <p className="text-[10px] text-slate-400">Receipt No: {receiptModal.receipt_no}</p>
              <p className="text-[10px] text-slate-400">{new Date(receiptModal.created_at || Date.now()).toLocaleString()}</p>
            </div>

            <div className="space-y-2 text-xs">
              {receiptModal.items?.map((it: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <span>{it.qty}x {it.name || it.product_id}</span>
                  <span className="font-bold">${(it.qty * it.unit_price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-dashed border-slate-300 space-y-1 text-xs">
              <div className="flex justify-between font-extrabold text-slate-800 text-sm">
                <span>TOTAL:</span>
                <span>${Number(receiptModal.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Payment Method:</span>
                <span>{receiptModal.payment_method}</span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={() => setReceiptModal(null)}
                className="px-4 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
