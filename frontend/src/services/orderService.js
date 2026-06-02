import api from './api'

export async function createOrder(shippingAddress) {
  const response = await api.post('/orders', { shipping_address: shippingAddress })
  return response.data
}

export async function getOrders() {
  const response = await api.get('/orders')
  return response.data
}

export async function getOrder(id) {
  const response = await api.get(`/orders/${id}`)
  return response.data
}

export async function payOrder(id) {
  const response = await api.post(`/orders/${id}/pay`)
  return response.data
}

export async function completeOrder(id) {
  const response = await api.post(`/orders/${id}/complete`)
  return response.data
}
