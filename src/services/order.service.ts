
import { SupabaseClient } from '@supabase/supabase-js'
import { Order, OrderItem } from '@/types/database'

export const orderService = {
    async createOrder(supabase: SupabaseClient, orderData: Partial<Order>, items: Partial<OrderItem>[]) {
        // Create order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single()

        if (orderError) throw orderError

        // Create order items
        const itemsWithOrderId = items.map(item => ({
            ...item,
            order_id: order.id
        }))

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsWithOrderId)

        if (itemsError) throw itemsError

        return order as Order
    },

    async getOrdersByRestaurant(supabase: SupabaseClient, restaurantId: string, startDate?: string, endDate?: string) {
        let query = supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    menu_item_name,
                    quantity,
                    total_price
                )
            `)
            .eq('restaurant_id', restaurantId)
            .neq('status', 'cancelled')
            .order('created_at', { ascending: false })

        if (startDate) query = query.gte('created_at', startDate)
        if (endDate) query = query.lte('created_at', endDate)

        const { data, error } = await query
        if (error) throw error
        return data
    },

    async updateOrderStatus(supabase: SupabaseClient, orderId: string, status: Order['status']) {
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId)

        if (error) throw error
    },

    async createServiceRequest(supabase: SupabaseClient, restaurantId: string, tableNumber: string) {
        const { error } = await supabase
            .from('service_requests')
            .insert({
                restaurant_id: restaurantId,
                table_no: tableNumber,
                status: 'pending'
            })

        if (error) throw error
    },

    async resolveServiceRequest(supabase: SupabaseClient, requestId: string) {
        const { error } = await supabase
            .from('service_requests')
            .update({ status: 'resolved' })
            .eq('id', requestId)

        if (error) throw error
    }
}
