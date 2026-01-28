import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import { CustomerMenuClient } from './client'
import { restaurantService } from '@/services/restaurant.service'
import { menuService } from '@/services/menu.service'

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function CustomerMenuPage({ params }: PageProps) {
    const { slug } = await params
    const decodedSlug = decodeURIComponent(slug)
    const supabase = await createClient()

    let restaurant

    try {
        console.log('Fetching restaurant for slug:', decodedSlug)
        restaurant = await restaurantService.getRestaurantBySlug(supabase, decodedSlug)

        if (!restaurant || !restaurant.is_active) {
            console.error(`Restaurant not found or inactive: ${decodedSlug}`)
            notFound()
        }
    } catch (e: unknown) {
        console.error('Error fetching restaurant:', e)
        notFound()
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
