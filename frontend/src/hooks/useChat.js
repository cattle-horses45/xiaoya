import { useState, useEffect, useRef, useCallback } from 'react'
import { createSession, sendMessageStream } from '../services/chatService'

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

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setIsLoading(true)

    // Add a placeholder assistant message that will be updated with streaming content
    setMessages((prev) => [...prev, { role: 'assistant', content: '', isStreaming: true }])

    const updateLastMessage = (content) => {
      setMessages((prev) => {
        const updated = [...prev]
        const lastIdx = updated.length - 1
        if (updated[lastIdx]?.isStreaming) {
          updated[lastIdx] = { ...updated[lastIdx], content }
        }
        return updated
      })
    }

    const finalizeMessage = () => {
      setMessages((prev) => {
        const updated = [...prev]
        const lastIdx = updated.length - 1
        if (updated[lastIdx]) {
          updated[lastIdx] = { ...updated[lastIdx], isStreaming: false }
        }
        return updated
      })
    }

    await sendMessageStream(
      text,
      sessionToken.current,
      // onChunk
      (chunk) => {
        setMessages((prev) => {
          const updated = [...prev]
          const lastIdx = updated.length - 1
          if (updated[lastIdx]?.isStreaming) {
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: updated[lastIdx].content + chunk,
            }
          }
          return updated
        })
      },
      // onDone
      () => {
        finalizeMessage()
        setIsLoading(false)
      },
      // onError
      (error) => {
        console.error('Stream error:', error)
        updateLastMessage('抱歉，我暂时无法回复，请稍后再试。')
        finalizeMessage()
        setIsLoading(false)
      }
    )
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
