import { createContext, useState, useEffect, useCallback } from 'react'
import { getCart } from '../services/cartService'
import { useAuth } from '../hooks/useAuth'

export const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [itemCount, setItemCount] = useState(0)

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated) {
      setItemCount(0)
      return
    }
    try {
      const data = await getCart()
      const count = data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
      setItemCount(count)
    } catch {
      setItemCount(0)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  return (
    <CartContext.Provider value={{ itemCount, fetchCount }}>
      {children}
    </CartContext.Provider>
  )
}
