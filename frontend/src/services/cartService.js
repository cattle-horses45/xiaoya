import api from './api'

export async function getCart() {
  const response = await api.get('/cart')
  return response.data
}

export async function addToCart(productId, quantity = 1) {
  const response = await api.post('/cart/items', { product_id: productId, quantity })
  return response.data
}

export async function updateCartItem(itemId, quantity) {
  const response = await api.put(`/cart/items/${itemId}`, { quantity })
  return response.data
}

export async function removeCartItem(itemId) {
  const response = await api.delete(`/cart/items/${itemId}`)
  return response.data
}
