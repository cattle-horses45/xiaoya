import { useState, useEffect, useRef, useCallback } from 'react'
import { createSession, sendMessage } from '../services/chatService'

export function useChat() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const sessionToken = useRef(localStorage.getItem('session_token'))
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const initSession = async () => {
      if (!sessionToken.current) {
        try {
          const res = await createSession()
          sessionToken.current = res.session_token
          localStorage.setItem('session_token', sessionToken.current)
        } catch (err) {
          console.error('Failed to create session:', err)
        }
      }
      setSessionReady(true)
    }
    initSession()
  }, [])

  const send = useCallback(async (text) => {
    if (!text.trim()) return

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setIsLoading(true)

    try {
      const res = await sendMessage(text, sessionToken.current)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.reply, isTransfer: res.is_transfer },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '抱歉，我暂时无法回复，请稍后再试。如果问题紧急，请拨打客服热线 400-888-XXXX。' },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const newSession = useCallback(async () => {
    sessionToken.current = null
    localStorage.removeItem('session_token')
    setMessages([])
    try {
      const res = await createSession()
      sessionToken.current = res.session_token
      localStorage.setItem('session_token', sessionToken.current)
    } catch (err) {
      console.error('Failed to create new session:', err)
    }
  }, [])

  return { messages, isLoading, send, newSession, sessionReady }
}
