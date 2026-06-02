import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { getProduct } from '../services/productService'
import { addToCart } from '../services/cartService'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'

export default function ProductDetailPage() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const { fetchCount } = useCart()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProduct()
  }, [id])

  const loadProduct = async () => {
    setLoading(true)
    try {
      const data = await getProduct(id)
      setProduct(data.product)
    } catch (err) {
      console.error('Failed to load product:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert('请先登录')
      return
    }
    try {
      await addToCart(product.id, quantity)
      fetchCount()
      alert('已加入购物车')
    } catch (err) {
      alert('添加失败，请重试')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-lg text-gray-500">商品不存在</p>
        <Link to="/products" className="text-blue-600 hover:underline mt-2 inline-block">返回商品列表</Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/products" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={18} /> 返回商品列表
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product image */}
        <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-400 text-7xl">📱</div>
          )}
        </div>

        {/* Product info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <p className="text-3xl font-bold text-red-500 mb-4">¥{product.price}</p>
          <p className="text-sm text-gray-500 mb-4">库存: {product.stock} 件</p>
          <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>

          {/* Specs table */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">规格参数</h3>
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(product.specs).map(([key, value]) => (
                    <tr key={key} className="border-b border-gray-100">
                      <td className="py-2 text-gray-500 w-24">{key}</td>
                      <td className="py-2 text-gray-900">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add to cart */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border rounded-lg">
              <button
                className="px-3 py-2 hover:bg-gray-100 transition-colors"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >−</button>
              <span className="px-4 py-2 font-medium">{quantity}</span>
              <button
                className="px-3 py-2 hover:bg-gray-100 transition-colors"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              >+</button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="btn-primary flex items-center gap-2"
            >
              <ShoppingCart size={18} />
              加入购物车
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
