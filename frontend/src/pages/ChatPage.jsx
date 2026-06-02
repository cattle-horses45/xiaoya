import { useRef, useEffect } from 'react'
import { RefreshCw, MessageSquare } from 'lucide-react'
import { useChat } from '../hooks/useChat'
import ChatMessage from '../components/chat/ChatMessage'
import ChatInput from '../components/chat/ChatInput'

const QUICK_QUESTIONS = [
  '鸭梨手机有哪些型号？',
  '手机开不了机怎么办？',
  '退货政策是什么？',
  '如何查询我的订单？',
  '推荐一款性价比高的手机',
]

export default function ChatPage() {
  const { messages, isLoading, send, newSession, sessionReady } = useChat()
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-7rem)] flex">
      {/* Sidebar - Quick questions (desktop) */}
      <div className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 p-4 space-y-2">
        <button
          onClick={newSession}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors mb-4"
        >
          <RefreshCw size={16} />
          新建对话
        </button>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">快捷问题</p>
        {QUICK_QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => send(q)}
            disabled={isLoading}
            className="text-left text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile quick questions */}
        <div className="lg:hidden bg-gray-50 border-b border-gray-200 p-3 overflow-x-auto">
          <div className="flex gap-2">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => send(q)}
                disabled={isLoading}
                className="flex-shrink-0 text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:border-blue-300 hover:text-blue-600 transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare size={32} className="text-blue-500" />
              </div>
              <h2 className="text-lg font-medium text-gray-600 mb-2">你好，我是小鸭！</h2>
              <p className="text-sm mb-4">鸭梨手机官方AI客服，随时为您解答问题</p>
              <p className="text-xs text-gray-300">💡 您可以问我产品信息、订单查询、故障排查等问题</p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
              {isLoading && (
                <div className="flex gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <MessageSquare size={16} className="text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={send} isLoading={isLoading} />
      </div>
    </div>
  )
}
