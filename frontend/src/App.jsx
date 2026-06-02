import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Layout from './components/layout/Layout'
import AdminLayout from './components/admin/AdminLayout'

// Pages
import ChatPage from './pages/ChatPage'
import ProductListPage from './pages/ProductListPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import OrderListPage from './pages/OrderListPage'
import OrderDetailPage from './pages/OrderDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminProducts from './pages/AdminProducts'
import AdminOrders from './pages/AdminOrders'
import NotFoundPage from './pages/NotFoundPage'

// Route guards
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          {/* Public routes with main layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<ChatPage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrderListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetailPage />
                </ProtectedRoute>
              }
            />
            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Admin routes with admin layout */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
          </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  )
}
