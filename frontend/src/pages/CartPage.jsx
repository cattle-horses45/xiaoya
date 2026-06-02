import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react'
import { getCart, updateCartItem, removeCartItem } from '../services/cartService'
import { createOrder } from '../services/orderService'
import { useCart } from '../hooks/useCart'

export default function CartPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [address, setAddress] = useState('')
  const [checkoutStep, setCheckoutStep] = useState('cart') // 'cart' | 'checkout'
  const { fetchCount } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    setLoading(true)
    try {
      const data = await getCart()
      setItems(data.items || [])
    } catch (err) {
      console.error('Failed to load cart:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQty = async (itemId, newQty) => {
    if (newQty < 1) return
    try {
      await updateCartItem(itemId, newQty)
      loadCart()
      fetchCount()
    } catch (err) {
      alert('更新失败')
    }
  }

  const handleRemove = async (itemId) => {
    try {
      await removeCartItem(itemId)
      loadCart()
      fetchCount()
    } catch (err) {
      alert('删除失败')
    }
  }

  const handleCheckout = async () => {
    if (!address.trim()) {
      alert('请输入收货地址')
      return
    }
    try {
      const data = await createOrder(address)
      fetchCount()
      navigate(`/orders/${data.order?.id}`)
    } catch (err) {
      alert('下单失败: ' + (err.response?.data?.detail || '请重试'))
    }
  }

  const total = items.reduce((sum, item) => sum + item.product?.price * item.quantity, 0)

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShoppingBag size={24} /> 购物车
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg text-gray-500 mb-4">购物车是空的</p>
          <Link to="/products" className="btn-primary">去逛逛</Link>
        </div>
      ) : checkoutStep === 'cart' ? (
        <>
          {/* Cart items */}
          <div className="space-y-4 mb-8">
            {items.map((item) => (
              <div key={item.id} className="card flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📱</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product?.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                    {item.product?.name || '商品'}
                  </Link>
                  <p className="text-red-500 font-medium mt-1">¥{item.product?.price}</p>
                </div>
                <div className="flex items-center border rounded-lg">
                  <button className="px-2 py-1 hover:bg-gray-100" onClick={() => handleUpdateQty(item.id, item.quantity - 1)}>−</button>
                  <span className="px-3 py-1 font-medium">{item.quantity}</span>
                  <button className="px-2 py-1 hover:bg-gray-100" onClick={() => handleUpdateQty(item.id, item.quantity + 1)}>+</button>
                </div>
                <p className="font-semibold text-gray-900 w-24 text-right">
                  ¥{(item.product?.price * item.quantity).toFixed(2)}
                </p>
                <button onClick={() => handleRemove(item.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="card flex items-center justify-between">
            <span className="text-lg text-gray-600">
              共 {items.reduce((s, i) => s + i.quantity, 0)} 件
            </span>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-red-500">¥{total.toFixed(2)}</span>
              <button onClick={() => setCheckoutStep('checkout')} className="btn-primary text-lg px-8">
                去结算
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Checkout step */
        <div className="card max-w-lg mx-auto">
          <button onClick={() => setCheckoutStep('cart')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6">
            <ArrowLeft size={18} /> 返回购物车
          </button>
          <h2 className="text-xl font-bold mb-4">确认订单</h2>
          <div className="space-y-2 mb-4 text-sm">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.product?.name} × {item.quantity}</span>
                <span>¥{(item.product?.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <hr />
            <div className="flex justify-between font-bold text-lg">
              <span>合计</span>
              <span className="text-red-500">¥{total.toFixed(2)}</span>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">收货地址</label>
            <textarea
              className="input-field"
              rows="2"
              placeholder="请输入收货地址（模拟）"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-700">
            ⚠️ 模拟支付-教学用途：点击提交后不会产生真实扣款。
          </div>
          <button onClick={handleCheckout} className="btn-primary w-full text-lg">
            提交订单（模拟）
          </button>
        </div>
      )}
    </div>
  )
}
