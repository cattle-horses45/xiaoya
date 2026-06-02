import api from './api'

// Product CRUD
export async function getAdminProducts() {
  const response = await api.get('/admin/products')
  return response.data
}

export async function createProduct(product) {
  const response = await api.post('/admin/products', product)
  return response.data
}

export async function updateProduct(id, product) {
  const response = await api.put(`/admin/products/${id}`, product)
  return response.data
}

export async function deleteProduct(id) {
  const response = await api.delete(`/admin/products/${id}`)
  return response.data
}

// Orders
export async function getAdminOrders() {
  const response = await api.get('/admin/orders')
  return response.data
}

export async function shipOrder(id) {
  const response = await api.post(`/admin/orders/${id}/ship`)
  return response.data
}

// Unanswered questions
export async function getUnansweredQuestions() {
  const response = await api.get('/admin/unanswered')
  return response.data
}
