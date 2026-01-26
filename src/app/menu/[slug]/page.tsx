import { createClient } from '@/lib/supabase/server'

import { CustomerMenuClient } from './client'
import { restaurantService } from '@/services/restaurant.service'
import { menuService } from '@/services/menu.service'

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function CustomerMenuPage({ params }: PageProps) {
    const { slug } = await params
    const supabase = await createClient()

    // Debug version
    let restaurant
    let debugError = null
    let debugSlug = null

    try {
        debugSlug = slug
        console.log('Fetching restaurant for slug:', slug)

        restaurant = await restaurantService.getRestaurantBySlug(supabase, slug)
        console.log('Restaurant fetch result:', restaurant ? 'Found' : 'Null')

        if (!restaurant) {
            debugError = "Restaurant returned null"
        } else if (!restaurant.is_active) {
            debugError = "Restaurant is not active"
        }
    } catch (e: unknown) {
        console.error('Error fetching restaurant:', e)
        debugError = (e as Error).message || 'Unknown error occurred'
    }

    if (debugError || !restaurant) {
        return (
            <div className="p-8 max-w-md mx-auto mt-10 border-2 border-red-200 rounded-lg bg-red-50 text-red-900">
                <h1 className="text-xl font-bold mb-4">Debug Error Info</h1>
                <div className="space-y-2 font-mono text-sm">
                    <p><strong>Slug:</strong> {debugSlug}</p>
                    <p><strong>Status:</strong> Failed to load</p>
                    <p><strong>Error:</strong> {debugError}</p>
                    <p className="text-xs mt-4 text-slate-500">Timestamp: {new Date().toISOString()}</p>
                </div>
            </div>
        )
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
