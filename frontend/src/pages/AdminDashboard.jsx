import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingBag, MessageCircle } from 'lucide-react'
import { getAdminProducts, getAdminOrders, getUnansweredQuestions } from '../services/adminService'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, unanswered: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [productsRes, ordersRes, unansweredRes] = await Promise.all([
        getAdminProducts().catch(() => ({ products: [] })),
        getAdminOrders().catch(() => ({ orders: [] })),
        getUnansweredQuestions().catch(() => ({ questions: [] })),
      ])
      setStats({
        products: productsRes.products?.length || 0,
        orders: ordersRes.orders?.length || 0,
        unanswered: unansweredRes.questions?.length || 0,
      })
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    { label: '商品总数', value: stats.products, icon: Package, color: 'bg-blue-500', link: '/admin/products' },
    { label: '订单总数', value: stats.orders, icon: ShoppingBag, color: 'bg-green-500', link: '/admin/orders' },
    { label: '未回答问题', value: stats.unanswered, icon: MessageCircle, color: 'bg-orange-500', link: null },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">管理概览</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                  <card.icon size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{card.value}</p>
                  <p className="text-sm text-gray-500">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/admin/products" className="card hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-2">📦 商品管理</h3>
          <p className="text-sm text-gray-500">添加、编辑、删除商品，管理库存和价格</p>
        </Link>
        <Link to="/admin/orders" className="card hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-2">📋 订单管理</h3>
          <p className="text-sm text-gray-500">查看所有订单，处理发货和售后</p>
        </Link>
      </div>

      {stats.products === 0 && (
        <div className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
          <p className="text-yellow-700">数据库中没有商品！</p>
          <p className="text-yellow-600 text-sm mt-1">请先通过商品管理页面添加商品，AI客服才能查询到真实商品数据。</p>
          <Link to="/admin/products" className="btn-primary inline-block mt-3">去添加商品</Link>
        </div>
      )}
    </div>
  )
}
