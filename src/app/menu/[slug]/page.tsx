import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CustomerMenuClient } from './client'
import { restaurantService } from '@/services/restaurant.service'
import { menuService } from '@/services/menu.service'

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function CustomerMenuPage({ params }: PageProps) {
    const { slug } = await params
    const supabase = await createClient()

    // Fetch restaurant by slug
    let restaurant
    try {
        restaurant = await restaurantService.getRestaurantBySlug(supabase, slug)
        if (!restaurant.is_active) return notFound()
    } catch {
        return notFound()
    }

    // Fetch categories and menu items
    const [categories, menuItems] = await Promise.all([
        menuService.getCategories(supabase, restaurant.id),
        menuService.getMenuItems(supabase, restaurant.id)
    ])

    return (
        <CustomerMenuClient
            restaurant={restaurant}
            categories={categories || []}
            menuItems={menuItems || []}
        />
    )
}
