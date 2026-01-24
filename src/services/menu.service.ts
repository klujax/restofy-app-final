
import { SupabaseClient } from '@supabase/supabase-js'
import { Category, MenuItem } from '@/types/database'

export const menuService = {
    async getCategories(supabase: SupabaseClient, restaurantId: string) {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

        if (error) throw error
        return data as Category[]
    },

    async getMenuItems(supabase: SupabaseClient, restaurantId: string) {
        const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('sort_order', { ascending: true })

        if (error) throw error
        return data as MenuItem[]
    },

    async getMenuItemsByCategory(supabase: SupabaseClient, categoryId: string) {
        const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('category_id', categoryId)
            .eq('is_active', true) // Assumption: we usually want active items

        if (error) throw error
        return data as MenuItem[]
    }
}
