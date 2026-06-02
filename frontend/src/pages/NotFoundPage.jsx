import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <p className="text-xl text-gray-500 mb-8">页面不存在</p>
      <Link to="/" className="btn-primary">返回首页</Link>
    </div>
  )
}
