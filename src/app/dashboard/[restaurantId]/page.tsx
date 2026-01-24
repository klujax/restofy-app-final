'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { restaurantService } from '@/services/restaurant.service'

import {
    Wallet,
    ShoppingCart,
    Users,
    TrendingUp,
    Loader2,
    ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AnalyticsCharts } from '@/components/dashboard/analytics-charts'

interface AnalyticsData {
    totalRevenue: number
    totalOrders: number
    activeTables: number
    avgOrderValue: number
    bestSellers: { name: string; quantity: number; revenue: number }[]
    rawOrders: Record<string, unknown>[]
}

interface Restaurant {
    id: string
    name: string
    slug: string
}

export default function RestaurantDashboardPage() {
    const params = useParams()
    const restaurantId = params?.restaurantId as string
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
    const supabase = createClient()

    // Fetch Restaurant Details and Sync Global State
    useEffect(() => {
        async function fetchRestaurant() {
            try {
                // If direct access via URL, ensuring global state (sidebar) is synced
                const currentStored = localStorage.getItem('selectedRestaurantId')
                if (currentStored !== restaurantId) {
                    localStorage.setItem('selectedRestaurantId', restaurantId)
                    window.dispatchEvent(new CustomEvent('restaurant-change', {
                        detail: { restaurantId: restaurantId }
                    }))
                }

                const data = await restaurantService.getRestaurantById(supabase, restaurantId)
                if (data) setRestaurant(data)
            } catch (error) {
                console.error('Error fetching restaurant:', error)
            }
        }
        if (restaurantId) fetchRestaurant()
    }, [restaurantId, supabase])

    const fetchAnalytics = useCallback(async () => {
        try {
            if (!restaurantId) return

            // Get 12 months of data for charts
            const twelveMonthsAgo = new Date()
            twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)
            const startDate = twelveMonthsAgo.toISOString()

            // Update: We need to fetch order_items explicitly if the service doesn't include them
            // The service getOrdersByRestaurant usually includes them if implemented correctly
            const { data: orders, error } = await supabase
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
                .gte('created_at', startDate)
                .neq('status', 'cancelled')

            if (error) throw error

            const fetchedOrders = orders || []

            const totalRevenue = fetchedOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
            const totalOrders = fetchedOrders.length
            const activeTables = new Set(fetchedOrders.filter(o => o.status !== 'paid').map(o => o.table_number)).size
            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

            const productMap = new Map<string, { quantity: number; revenue: number }>()
            fetchedOrders.forEach(order => {
                order.order_items?.forEach((item: { menu_item_name: string; quantity: number; total_price: number }) => {
                    const existing = productMap.get(item.menu_item_name) || { quantity: 0, revenue: 0 }
                    productMap.set(item.menu_item_name, {
                        quantity: existing.quantity + item.quantity,
                        revenue: existing.revenue + item.total_price,
                    })
                })
            })

            const bestSellers = Array.from(productMap.entries())
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5)

            setAnalytics({
                totalRevenue,
                totalOrders,
                activeTables,
                avgOrderValue,
                bestSellers,
                rawOrders: fetchedOrders || []
            })
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }, [restaurantId, supabase])

    useEffect(() => {
        fetchAnalytics()
        const interval = setInterval(fetchAnalytics, 30000)
        return () => clearInterval(interval)
    }, [fetchAnalytics])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
        )
    }

    const stats = [
        {
            title: 'Günlük Ciro',
            value: `₺${analytics?.totalRevenue.toFixed(0) || '0'}`,
            icon: Wallet,
        },
        {
            title: 'Siparişler',
            value: analytics?.totalOrders || 0,
            icon: ShoppingCart,
        },
        {
            title: 'Aktif Masa',
            value: analytics?.activeTables || 0,
            icon: Users,
        },
        {
            title: 'Ortalama',
            value: `₺${analytics?.avgOrderValue.toFixed(0) || '0'}`,
            icon: TrendingUp,
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">{restaurant?.name || 'Restaurant Dashboard'}</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>

                {restaurant?.slug && (
                    <Link
                        href={`/menu/${restaurant.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Canlı Menüyü Gör
                    </Link>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className="bg-white rounded-xl p-5 border border-slate-200"
                    >
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
                            <stat.icon className="h-5 w-5 text-slate-600" />
                        </div>
                        <p className="text-slate-500 text-sm">{stat.title}</p>
                        <p className="text-2xl font-semibold text-slate-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Analytics Charts */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <AnalyticsCharts
                    orders={analytics?.rawOrders || []}
                    restaurants={restaurant ? [restaurant] : []}
                    hideDistribution={true}
                />
            </div>
        </div>
    )
}
