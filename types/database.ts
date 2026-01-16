export interface Category {
    id: string
    profile_id: string
    name: string
    description: string | null
    image_url: string | null
    sort_order: number
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface MenuItem {
    id: string
    profile_id: string
    category_id: string
    name: string
    description: string | null
    price: number
    image_url: string | null
    is_available: boolean
    stock_status: 'in_stock' | 'out_of_stock' | 'low_stock'
    preparation_time: number | null
    sort_order: number
    created_at: string
    updated_at: string
}

export interface Order {
    id: string
    profile_id: string
    customer_name: string | null
    table_number: string | null
    notes: string | null
    status: 'received' | 'preparing' | 'ready' | 'completed' | 'rejected'
    total_amount: number
    created_at: string
    updated_at: string
}

export interface OrderItem {
    id: string
    order_id: string
    menu_item_id: string | null
    menu_item_name: string
    quantity: number
    unit_price: number
    total_price: number
    notes: string | null
    created_at: string
}

export interface Profile {
    id: string
    business_name: string
    slug: string
    description: string | null
    logo_url: string | null
    address: string | null
    phone: string | null
    currency: string
    created_at: string
    updated_at: string
}
