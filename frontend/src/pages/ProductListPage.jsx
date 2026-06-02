import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, ShoppingCart } from 'lucide-react'
import { getProducts } from '../services/productService'
import { addToCart } from '../services/cartService'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'

export default function ProductListPage() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()
  const { fetchCount } = useCart()

  useEffect(() => {
    loadProducts()
  }, [search])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const data = await getProducts({ q: search })
      setProducts(data.products || [])
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      alert('请先登录')
      return
    }
    try {
      await addToCart(productId)
      fetchCount()
      alert('已加入购物车')
    } catch (err) {
      alert('添加失败，请重试')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">全部商品</h1>

      {/* Search bar */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          className="input-field pl-10"
          placeholder="搜索商品..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">暂无商品</p>
          <p className="text-sm mt-2">管理员可在后台添加商品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="card hover:shadow-md transition-shadow">
              <Link to={`/products/${product.id}`}>
                <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-400 text-5xl">📱</div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">{product.description}</p>
              </Link>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-red-500">¥{product.price}</span>
                <span className="text-xs text-gray-400">库存: {product.stock}</span>
              </div>
              <button
                onClick={() => handleAddToCart(product.id)}
                disabled={product.stock <= 0}
                className="btn-primary w-full mt-3 flex items-center justify-center gap-2 text-sm"
              >
                <ShoppingCart size={16} />
                加入购物车
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
