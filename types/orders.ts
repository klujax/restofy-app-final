import { Order, OrderItem } from '@/types/database'

export interface OrderWithItems extends Order {
    order_items: OrderItem[]
}

export type OrderStatus = 'pending' | 'preparing' | 'served' | 'paid' | 'cancelled'

export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
    label: string
    color: string
    bgColor: string
    borderColor: string
    emoji: string
}> = {
    pending: {
        label: 'Bekliyor',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-500',
        emoji: '🟡',
    },
    preparing: {
        label: 'Hazırlanıyor',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-500',
        emoji: '🍳',
    },
    served: {
        label: 'Servis Edildi',
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-500',
        emoji: '✅',
    },
    paid: {
        label: 'Ödendi',
        color: 'text-gray-700',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-300',
        emoji: '💰',
    },
    cancelled: {
        label: 'İptal',
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500',
        emoji: '❌',
    },
}

// Next status in workflow
export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
    pending: 'preparing',
    preparing: 'served',
    served: 'paid',
    paid: null,
    cancelled: null,
}

// Button labels for each status transition
export const NEXT_STATUS_BUTTON: Record<OrderStatus, string | null> = {
    pending: 'Hazırla',
    preparing: 'Servis Et',
    served: 'Ödendi & Kapat',
    paid: null,
    cancelled: null,
}
