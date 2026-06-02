import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import { getOrders } from '../services/orderService'

const STATUS_MAP = {
  pending: { label: '待支付', color: 'text-yellow-600 bg-yellow-50' },
  paid: { label: '已支付', color: 'text-blue-600 bg-blue-50' },
  shipped: { label: '已发货', color: 'text-purple-600 bg-purple-50' },
  completed: { label: '已完成', color: 'text-green-600 bg-green-50' },
}

export default function OrderListPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await getOrders()
      setOrders(data.orders || [])
    } catch (err) {
      console.error('Failed to load orders:', err)
    } finally {
      setLoading(false)
    }
  }

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
        <Package size={24} /> 我的订单
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg text-gray-500">暂无订单</p>
          <Link to="/products" className="btn-primary inline-block mt-4">去购物</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = STATUS_MAP[order.status] || STATUS_MAP.pending
            return (
              <Link key={order.id} to={`/orders/${order.id}`} className="card block hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{order.order_no}</p>
                    <p className="font-semibold text-gray-900">¥{order.total_amount}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.created_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
