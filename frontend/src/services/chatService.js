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
