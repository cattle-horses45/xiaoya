import api from './api'

export async function getProducts(params = {}) {
  const response = await api.get('/products', { params })
  return response.data
}

export async function getProduct(id) {
  const response = await api.get(`/products/${id}`)
  return response.data
}
