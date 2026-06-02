import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { getAdminProducts, createProduct, updateProduct, deleteProduct } from '../services/adminService'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', price: '', stock: '', description: '', specs: '', image_url: '' })

  useEffect(() => { loadProducts() }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const data = await getAdminProducts()
      setProducts(data.products || [])
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({ name: '', price: '', stock: '', description: '', specs: '', image_url: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      description: product.description || '',
      specs: product.specs ? Object.entries(product.specs).map(([k, v]) => `${k}:${v}`).join('\n') : '',
      image_url: product.image_url || '',
    })
    setEditingId(product.id)
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Parse specs from "key:value" lines to JSON
    let specsObj = null
    if (form.specs.trim()) {
      specsObj = {}
      form.specs.split('\n').forEach((line) => {
        const [key, ...vals] = line.split(':')
        if (key && vals.length) specsObj[key.trim()] = vals.join(':').trim()
      })
    }

    const payload = {
      name: form.name,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      description: form.description,
      specs: specsObj,
      image_url: form.image_url || null,
    }

    try {
      if (editingId) {
        await updateProduct(editingId, payload)
      } else {
        await createProduct(payload)
      }
      resetForm()
      loadProducts()
    } catch (err) {
      alert('操作失败: ' + (err.response?.data?.detail || '请检查输入'))
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`确定要删除"${name}"吗？此操作不可恢复。`)) return
    try {
      await deleteProduct(id)
      loadProducts()
    } catch (err) {
      alert('删除失败')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> 添加商品
        </button>
      </div>

      {/* Add/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">{editingId ? '编辑商品' : '添加商品'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品名称 *</label>
                  <input type="text" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如: 鸭梨14 Pro" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">价格 *</label>
                    <input type="number" step="0.01" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="元" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">库存 *</label>
                    <input type="number" className="input-field" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="件" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品描述 *</label>
                  <textarea className="input-field" rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="商品简介..." required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">规格参数（选填，每行格式: 键:值）</label>
                  <textarea className="input-field" rows="4" value={form.specs} onChange={(e) => setForm({ ...form, specs: e.target.value })} placeholder={'处理器:鸭梨A16\n屏幕:6.1英寸\n内存:8GB'} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">图片URL（选填）</label>
                  <input type="url" className="input-field" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={resetForm} className="btn-secondary">取消</button>
                  <button type="submit" className="btn-primary">{editingId ? '保存修改' : '添加商品'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Product table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl">
          <PackageIcon size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg text-gray-500 mb-2">暂无商品</p>
          <p className="text-sm text-gray-400 mb-4">请点击上方按钮添加第一个商品</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-500">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">商品名称</th>
                <th className="px-4 py-3">价格</th>
                <th className="px-4 py-3">库存</th>
                <th className="px-4 py-3">创建时间</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{product.id}</td>
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-red-500 font-medium">¥{product.price}</td>
                  <td className="px-4 py-3">{product.stock}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(product.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-800 mr-3" title="编辑">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(product.id, product.name)} className="text-red-500 hover:text-red-700" title="删除">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PackageIcon({ size, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  )
}
