import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

export default function ChatInput({ onSend, isLoading }) {
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    onSend(input.trim())
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3 max-w-4xl mx-auto">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入您的问题，小鸭为您解答..."
          className="input-field flex-1"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="btn-primary p-2.5 rounded-xl"
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  )
}
