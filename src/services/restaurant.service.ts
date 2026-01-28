
import { SupabaseClient } from '@supabase/supabase-js'
import { Restaurant } from '@/types/database'

export const restaurantService = {
    async getRestaurantsByOwner(supabase: SupabaseClient, ownerId: string) {
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as Restaurant[]
    },

    async createRestaurant(supabase: SupabaseClient, data: Partial<Restaurant>) {
        const { data: result, error } = await supabase
            .from('restaurants')
            .insert(data)
            .select()
            .single()

        if (error) throw error
        return result as Restaurant
    },

    async updateRestaurant(supabase: SupabaseClient, id: string, data: Partial<Restaurant>) {
        const { data: result, error } = await supabase
            .from('restaurants')
            .update(data)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return result as Restaurant
    },

    async deleteRestaurant(supabase: SupabaseClient, id: string) {
        const { error } = await supabase
            .from('restaurants')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    async getRestaurantById(supabase: SupabaseClient, id: string) {
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data as Restaurant
    },

    async getRestaurantBySlug(supabase: SupabaseClient, slugOrId: string) {
        // First try to find by slug
        const { data: bySlug, error: slugError } = await supabase
            .from('restaurants')
            .select('*')
            .eq('slug', slugOrId)
            .single()

        if (bySlug) return bySlug as Restaurant

        // If not found by slug, try by ID (for backward compatibility with UUID-based URLs)
        const { data: byId, error: idError } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', slugOrId)
            .single()

        if (byId) return byId as Restaurant

        // If neither worked, throw the original slug error
        if (slugError) throw slugError
        if (idError) throw idError
        throw new Error('Restaurant not found')
    }
}
