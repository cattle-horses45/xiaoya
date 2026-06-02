import ReactMarkdown from 'react-markdown'
import { Bot, User } from 'lucide-react'

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} mb-4`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-blue-600' : 'bg-green-500'
      }`}>
        {isUser ? (
          <User size={16} className="text-white" />
        ) : (
          <Bot size={16} className="text-white" />
        )}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
        isUser
          ? 'bg-blue-600 text-white rounded-tr-sm'
          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
      }`}>
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="markdown-body text-sm">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        {message.isTransfer && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <span className="text-xs text-orange-500">已转接人工客服</span>
          </div>
        )}
      </div>
    </div>
  )
}
