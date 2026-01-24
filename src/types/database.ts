export interface Category {
    id: string
    profile_id: string // Deprecated, keeping for types until full refactor
    restaurant_id: string
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
    profile_id: string // Deprecated
    restaurant_id: string
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
    profile_id: string // Deprecated
    restaurant_id: string
    customer_id?: string
    customer_name: string | null
    table_number: string | null
    notes: string | null
    status: 'pending' | 'received' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled' | 'rejected'
    payment_method: 'cash' | 'online'
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

// Working hours for each day
export interface DaySchedule {
    open: string  // Format: "HH:MM"
    close: string // Format: "HH:MM"
    closed: boolean
}

export interface WorkingHours {
    monday: DaySchedule
    tuesday: DaySchedule
    wednesday: DaySchedule
    thursday: DaySchedule
    friday: DaySchedule
    saturday: DaySchedule
    sunday: DaySchedule
}

export interface Restaurant {
    id: string
    owner_id: string
    name: string
    location: string | null
    slug: string
    description: string | null
    logo_url: string | null
    address: string | null
    phone: string | null
    currency: string
    theme_color: string
    is_active: boolean
    working_hours: WorkingHours | null
    created_at: string
    updated_at: string
}

export interface Review {
    id: string
    restaurant_id: string
    customer_name: string | null
    rating: number
    comment: string | null
    created_at: string
    is_approved: boolean
}

export interface Customer {
    id: string
    full_name: string
    phone: string | null
    email: string | null
    is_guest: boolean
    created_at: string
}

export interface CustomerCard {
    id: string
    customer_id: string
    card_alias: string
    card_user_key: string
    card_token: string | null
    last_four_digits: string
    created_at: string
}

export interface ServiceRequest {
    id: string
    restaurant_id: string
    table_no: string
    status: 'pending' | 'resolved'
    created_at: string
}
