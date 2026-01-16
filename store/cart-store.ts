import { create } from 'zustand'
import { MenuItem } from '@/types/database'

export interface CartItem {
    menuItem: MenuItem
    quantity: number
}

interface CartState {
    items: CartItem[]
    addItem: (menuItem: MenuItem) => void
    removeItem: (menuItemId: string) => void
    updateQuantity: (menuItemId: string, quantity: number) => void
    clearCart: () => void
    getTotalItems: () => number
    getTotalPrice: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],

    addItem: (menuItem: MenuItem) => {
        set((state) => {
            const existingItem = state.items.find(
                (item) => item.menuItem.id === menuItem.id
            )

            if (existingItem) {
                return {
                    items: state.items.map((item) =>
                        item.menuItem.id === menuItem.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    ),
                }
            }

            return {
                items: [...state.items, { menuItem, quantity: 1 }],
            }
        })
    },

    removeItem: (menuItemId: string) => {
        set((state) => ({
            items: state.items.filter((item) => item.menuItem.id !== menuItemId),
        }))
    },

    updateQuantity: (menuItemId: string, quantity: number) => {
        set((state) => {
            if (quantity <= 0) {
                return {
                    items: state.items.filter((item) => item.menuItem.id !== menuItemId),
                }
            }

            return {
                items: state.items.map((item) =>
                    item.menuItem.id === menuItemId ? { ...item, quantity } : item
                ),
            }
        })
    },

    clearCart: () => set({ items: [] }),

    getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
    },

    getTotalPrice: () => {
        return get().items.reduce(
            (total, item) => total + item.menuItem.price * item.quantity,
            0
        )
    },
}))
