import { Order, OrderItem } from '@/types/database'

export interface OrderWithItems extends Order {
    order_items: OrderItem[]
}

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'completed' | 'rejected'

export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
    label: string
    color: string
    bgColor: string
    borderColor: string
}> = {
    received: {
        label: 'New Order',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-500',
    },
    preparing: {
        label: 'Preparing',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-500',
    },
    ready: {
        label: 'Ready',
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-500',
    },
    completed: {
        label: 'Completed',
        color: 'text-gray-700',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-300',
    },
    rejected: {
        label: 'Rejected',
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500',
    },
}
