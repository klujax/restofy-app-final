import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CustomerMenuClient } from './client'

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function CustomerMenuPage({ params }: PageProps) {
    const { slug } = await params
    const supabase = await createClient()

    // Fetch restaurant by slug
    const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (restaurantError || !restaurant) {
        return notFound()
    }

    // Fetch categories
    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

    // Fetch menu items
    const { data: menuItems } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order', { ascending: true })

    return (
        <CustomerMenuClient
            restaurant={restaurant}
            categories={categories || []}
            menuItems={menuItems || []}
        />
    )
}
