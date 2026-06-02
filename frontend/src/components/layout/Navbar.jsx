import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Menu, X, User, LogOut, MessageCircle, Package, Settings } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMobileMenuOpen(false)
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">鸭</span>
              </div>
              <span className="text-xl font-bold text-gray-900">鸭梨手机</span>
            </Link>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors">
              <MessageCircle size={18} />
              <span>AI客服</span>
            </Link>
            <Link to="/products" className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors">
              <Package size={18} />
              <span>商品</span>
            </Link>
            <Link to="/cart" className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors relative">
              <ShoppingCart size={18} />
              <span>购物车</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/orders" className="text-gray-600 hover:text-blue-600 transition-colors">我的订单</Link>
                <div className="flex items-center space-x-2">
                  <User size={18} className="text-gray-400" />
                  <span className="text-sm text-gray-700">{user?.username}</span>
                  <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="退出登录">
                    <LogOut size={18} />
                  </button>
                </div>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center space-x-1 text-sm bg-gray-800 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors">
                    <Settings size={16} />
                    <span>后台</span>
                  </Link>
                )}
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-gray-600 hover:text-blue-600 transition-colors">登录</Link>
                <Link to="/register" className="btn-primary text-sm py-1.5">注册</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-600 p-2">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-600">AI客服</Link>
            <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-600">商品</Link>
            <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-600">购物车</Link>
            {isAuthenticated ? (
              <>
                <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-600">我的订单</Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-blue-600 font-medium">管理后台</Link>
                )}
                <button onClick={handleLogout} className="block py-2 text-red-500">退出登录</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-600">登录</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-blue-600 font-medium">注册</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
