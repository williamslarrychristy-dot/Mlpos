import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  Layers,
  Tag,
  Ruler,
  Sliders,
  Check
} from 'lucide-react';

export const ItemsPage: React.FC<{ subPage?: string }> = ({ subPage = 'products' }) => {
  const [activeTab, setActiveTab] = useState(subPage);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [viewProductCard, setViewProductCard] = useState<any>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Form states
  const [prodForm, setProdForm] = useState({
    name: '',
    sku: '',
    category_id: '',
    brand_id: '',
    unit_id: '',
    cost_price: 0,
    sale_price: 0,
    stock: 0,
    low_stock_threshold: 3,
    aliases: '',
    description: '',
    active: true
  });

  const [simpleName, setSimpleName] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, c, b, u] = await Promise.all([
        fetchApi('/products'),
        fetchApi('/categories'),
        fetchApi('/brands'),
        fetchApi('/units')
      ]);
      setProducts(p);
      setCategories(c);
      setBrands(b);
      setUnits(u);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    setActiveTab(subPage);
  }, [subPage]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await fetchApi(`/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(prodForm)
        });
      } else {
        await fetchApi('/products', {
          method: 'POST',
          body: JSON.stringify(prodForm)
        });
      }
      setProductModalOpen(false);
      setEditingProduct(null);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    }
  };

  const handleSaveSimpleItem = async (type: 'categories' | 'brands' | 'units') => {
    if (!simpleName) return;
    try {
      await fetchApi(`/${type}`, {
        method: 'POST',
        body: JSON.stringify({ name: simpleName, short_name: simpleName.slice(0, 3) })
      });
      setSimpleName('');
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleCategoryAssignment = async (categoryId: string, productId: string, currentAssigned: boolean) => {
    try {
      await fetchApi(`/categories/${categoryId}/products`, {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, assigned: !currentAssigned })
      });
      loadAll();
    } catch (err: any) {
      console.error(err);
    }
  };

  const openEditProduct = (p: any) => {
    setEditingProduct(p);
    setProdForm({
      name: p.name || '',
      sku: p.sku || '',
      category_id: p.category_id || '',
      brand_id: p.brand_id || '',
      unit_id: p.unit_id || '',
      cost_price: Number(p.cost_price) || 0,
      sale_price: Number(p.sale_price) || 0,
      stock: Number(p.stock) || 0,
      low_stock_threshold: Number(p.low_stock_threshold) || 3,
      aliases: p.aliases || '',
      description: p.description || '',
      active: p.active ?? true
    });
    setProductModalOpen(true);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Items Navigation Sub-bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-1 overflow-x-auto">
        {[
          { id: 'products', label: 'Products', icon: Package },
          { id: 'attributes', label: 'Attributes', icon: Sliders },
          { id: 'categories', label: 'Categories', icon: Layers },
          { id: 'brands', label: 'Brands', icon: Tag },
          { id: 'units', label: 'Units', icon: Ruler },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                active ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* PRODUCTS SUB-PAGE */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {
                setEditingProduct(null);
                setProdForm({
                  name: '', sku: '', category_id: '', brand_id: '', unit_id: '',
                  cost_price: 0, sale_price: 0, stock: 0, low_stock_threshold: 3,
                  aliases: '', description: '', active: true
                });
                setProductModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Name & SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Cost Price</th>
                    <th className="py-3 px-4">Sale Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-[10px] text-slate-400">{p.sku || 'No SKU'}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">{p.category_name || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">${Number(p.cost_price).toFixed(2)}</td>
                      <td className="py-3 px-4 font-bold text-blue-600">${Number(p.sale_price).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          p.stock <= p.low_stock_threshold ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setViewProductCard(p)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                          title="Read-only View Card"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditProduct(p)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES SUB-PAGE */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <input
              type="text"
              value={simpleName}
              onChange={(e) => setSimpleName(e.target.value)}
              placeholder="New category name..."
              className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <button
              onClick={() => handleSaveSimpleItem('categories')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{c.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tap to assign products</p>
                </div>
                <button
                  onClick={() => { setSelectedCategory(c); setCategoryModalOpen(true); }}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold"
                >
                  Manage Products
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BRANDS SUB-PAGE */}
      {activeTab === 'brands' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <input
              type="text"
              value={simpleName}
              onChange={(e) => setSimpleName(e.target.value)}
              placeholder="New brand name..."
              className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <button
              onClick={() => handleSaveSimpleItem('brands')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Brand</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {brands.map((b) => (
              <div key={b.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-sm">{b.name}</h4>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UNITS SUB-PAGE */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <input
              type="text"
              value={simpleName}
              onChange={(e) => setSimpleName(e.target.value)}
              placeholder="Unit name (e.g. Kilogram, Piece)..."
              className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <button
              onClick={() => handleSaveSimpleItem('units')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Unit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {units.map((u) => (
              <div key={u.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="font-bold text-slate-800 text-sm">{u.name} ({u.short_name})</h4>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ATTRIBUTES SUB-PAGE */}
      {activeTab === 'attributes' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-center space-y-2">
          <Sliders className="w-8 h-8 text-blue-600 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">Custom Product Attributes</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Define attributes like Size, Color, or Material to organize inventory.
          </p>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">SKU / Barcode</label>
                  <input
                    type="text"
                    value={prodForm.sku}
                    onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Category</label>
                  <select
                    value={prodForm.category_id}
                    onChange={(e) => setProdForm({ ...prodForm, category_id: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">-- None --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodForm.cost_price}
                    onChange={(e) => setProdForm({ ...prodForm, cost_price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Sale Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodForm.sale_price}
                    onChange={(e) => setProdForm({ ...prodForm, sale_price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Low Stock Alert Level</label>
                  <input
                    type="number"
                    value={prodForm.low_stock_threshold}
                    onChange={(e) => setProdForm({ ...prodForm, low_stock_threshold: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Aliases (Search Keywords)</label>
                <input
                  type="text"
                  placeholder="e.g. shoe, brake pad, front brake"
                  value={prodForm.aliases}
                  onChange={(e) => setProdForm({ ...prodForm, aliases: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-all mt-4"
              >
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Read-only Product Card Modal */}
      {viewProductCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">{viewProductCard.name}</h3>
              <button onClick={() => setViewProductCard(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between"><span>SKU:</span><span className="font-bold">{viewProductCard.sku || '-'}</span></div>
              <div className="flex justify-between"><span>Category:</span><span className="font-bold">{viewProductCard.category_name || '-'}</span></div>
              <div className="flex justify-between"><span>Cost Price:</span><span className="font-bold">${Number(viewProductCard.cost_price).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Sale Price:</span><span className="font-bold text-blue-600">${Number(viewProductCard.sale_price).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Current Stock:</span><span className="font-bold">{viewProductCard.stock} units</span></div>
              <div className="flex justify-between"><span>Low Stock Threshold:</span><span className="font-bold">{viewProductCard.low_stock_threshold} units</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Category Product Toggle Assignment Modal */}
      {categoryModalOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Assign to {selectedCategory.name}</h3>
              <button onClick={() => setCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {products.map((p) => {
                const isAssigned = p.category_id === selectedCategory.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleCategoryAssignment(selectedCategory.id, p.id, isAssigned)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                      isAssigned ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-xs">{p.name}</span>
                    {isAssigned && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
