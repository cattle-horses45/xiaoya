import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, ArrowLeft } from 'lucide-react'

export default function AdminLayout() {
  const location = useLocation()

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: '概览', exact: true },
    { path: '/admin/products', icon: Package, label: '商品管理' },
    { path: '/admin/orders', icon: ShoppingBag, label: '订单管理' },
  ]

  const isActive = (item) => {
    if (item.exact) return location.pathname === '/admin'
    return location.pathname.startsWith(item.path)
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <Link to="/admin" className="text-lg font-bold">管理后台</Link>
          <p className="text-xs text-gray-400 mt-1">鸭梨手机商城</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive(item) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-700">
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2">
            <ArrowLeft size={16} />
            返回前台
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 bg-gray-100 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
