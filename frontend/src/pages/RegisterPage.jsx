import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 6) {
      setError('密码长度至少6位')
      return
    }

    setLoading(true)
    try {
      await register(username, password, email)
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      setError(err.response?.data?.detail || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">注册鸭梨商城</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱（选填）</label>
            <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少6位密码" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
            <input type="password" className="input-field" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="再次输入密码" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-500">
          已有账号？<Link to="/login" className="text-blue-600 hover:underline">立即登录</Link>
        </p>
      </div>
    </div>
  )
}
