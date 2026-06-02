import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getOrder, payOrder, completeOrder } from '../services/orderService'

const STATUS_MAP = {
  pending: { label: '待支付', color: 'text-yellow-600 bg-yellow-50' },
  paid: { label: '已支付', color: 'text-blue-600 bg-blue-50' },
  shipped: { label: '已发货', color: 'text-purple-600 bg-purple-50' },
  completed: { label: '已完成', color: 'text-green-600 bg-green-50' },
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadOrder() }, [id])

  const loadOrder = async () => {
    setLoading(true)
    try {
      const data = await getOrder(id)
      setOrder(data.order)
    } catch (err) {
      console.error('Failed to load order:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async () => {
    try {
      await payOrder(id)
      loadOrder()
      alert('支付成功！（模拟）')
    } catch (err) {
      alert('支付失败')
    }
  }

  const handleConfirm = async () => {
    try {
      await completeOrder(id)
      loadOrder()
      alert('已确认收货')
    } catch (err) {
      alert('操作失败')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-lg text-gray-500">订单不存在</p>
        <Link to="/orders" className="text-blue-600 hover:underline mt-2 inline-block">返回订单列表</Link>
      </div>
    )
  }

  const status = STATUS_MAP[order.status] || STATUS_MAP.pending

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/orders" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={18} /> 返回订单列表
      </Link>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">{order.order_no}</h1>
            <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString('zh-CN')}</p>
          </div>
          <span className={`px-3 py-1 rounded-full font-medium text-sm ${status.color}`}>
            {status.label}
          </span>
        </div>

        <table className="w-full mb-6">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="pb-2">商品</th>
              <th className="pb-2">单价</th>
              <th className="pb-2">数量</th>
              <th className="pb-2 text-right">小计</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item) => (
              <tr key={item.id} className="border-b border-gray-50">
                <td className="py-3">{item.product?.name || '商品'}</td>
                <td className="py-3">¥{item.unit_price}</td>
                <td className="py-3">{item.quantity}</td>
                <td className="py-3 text-right">¥{(item.unit_price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500">收货地址: {order.shipping_address || '未填写'}</span>
          <span className="text-xl font-bold">合计: <span className="text-red-500">¥{order.total_amount}</span></span>
        </div>

        <div className="flex gap-3 justify-end">
          {order.status === 'pending' && (
            <button onClick={handlePay} className="btn-primary">模拟支付</button>
          )}
          {order.status === 'shipped' && (
            <button onClick={handleConfirm} className="btn-primary">确认收货</button>
          )}
        </div>

        <p className="mt-4 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-700">
          ⚠️ 模拟支付-教学用途：以上交易流程均为模拟演示，不涉及任何真实资金变动。
        </p>
      </div>
    </div>
  )
}
