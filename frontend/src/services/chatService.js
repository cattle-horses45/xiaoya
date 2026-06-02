import api from './api'

export async function createSession() {
  const response = await api.post('/chat/session')
  return response.data
}

export async function sendMessage(message, sessionToken) {
  const response = await api.post('/chat', {
    message,
    session_token: sessionToken,
  })
  return response.data
}

export async function sendMessageStream(message, sessionToken, onChunk, onDone, onError) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        session_token: sessionToken,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            onDone && onDone()
            return
          }
          onChunk && onChunk(data)
        }
      }
    }

    // Process remaining buffer
    if (buffer.startsWith('data: ')) {
      const data = buffer.slice(6)
      if (data !== '[DONE]') {
        onChunk && onChunk(data)
      }
    }
    onDone && onDone()
  } catch (error) {
    onError && onError(error)
  }
}
