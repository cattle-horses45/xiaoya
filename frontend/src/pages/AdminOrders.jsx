import { useState, useEffect } from 'react'
import { ShoppingBag, Truck } from 'lucide-react'
import { getAdminOrders, shipOrder } from '../services/adminService'

const STATUS_MAP = {
  pending: { label: '待支付', color: 'bg-yellow-100 text-yellow-700' },
  paid: { label: '已支付', color: 'bg-blue-100 text-blue-700' },
  shipped: { label: '已发货', color: 'bg-purple-100 text-purple-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadOrders() }, [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await getAdminOrders()
      setOrders(data.orders || [])
    } catch (err) {
      console.error('Failed to load orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleShip = async (orderId) => {
    try {
      await shipOrder(orderId)
      loadOrders()
      alert('已标记为发货')
    } catch (err) {
      alert('操作失败')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShoppingBag size={24} /> 订单管理
      </h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl">
          <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg text-gray-500">暂无订单</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-500">
                <th className="px-4 py-3">订单号</th>
                <th className="px-4 py-3">用户ID</th>
                <th className="px-4 py-3">金额</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">创建时间</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = STATUS_MAP[order.status] || STATUS_MAP.pending
                return (
                  <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{order.order_no}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{order.user_id}</td>
                    <td className="px-4 py-3 text-red-500 font-medium">¥{order.total_amount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {order.status === 'paid' && (
                        <button onClick={() => handleShip(order.id)} className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 font-medium">
                          <Truck size={14} /> 发货
                        </button>
                      )}
                      {order.status === 'pending' && (
                        <span className="text-xs text-gray-400">等待支付</span>
                      )}
                      {order.status === 'shipped' && (
                        <span className="text-xs text-gray-400">运输中</span>
                      )}
                      {order.status === 'completed' && (
                        <span className="text-xs text-green-500">✓ 已完成</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
