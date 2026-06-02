import api from './api'

export async function login(username, password) {
  const response = await api.post('/auth/login', { username, password })
  return response.data
}

export async function register(username, password, email) {
  const response = await api.post('/auth/register', { username, password, email })
  return response.data
}

export async function getMe() {
  const response = await api.get('/auth/me')
  return response.data
}
