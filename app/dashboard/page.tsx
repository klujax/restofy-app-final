'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Wallet,
    ShoppingCart,
    Users,
    TrendingUp,
    Coffee,
    Loader2
} from 'lucide-react'

interface AnalyticsData {
    totalRevenue: number
    totalOrders: number
    activeTables: number
    avgOrderValue: number
    bestSellers: { name: string; quantity: number; revenue: number }[]
}

export default function DashboardPage() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        // Get selected restaurant from localStorage
        const restaurantId = localStorage.getItem('selectedRestaurantId')
        setSelectedRestaurantId(restaurantId)
    }, [])

    const fetchAnalytics = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const today = new Date()
            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
            const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

            // Query orders - using profile_id for now, will update to restaurant_id later
            const { data: ordersData } = await supabase
                .from('orders')
                .select(`
                    id,
                    total_amount,
                    table_number,
                    status,
                    order_items (
                        menu_item_name,
                        quantity,
                        total_price
                    )
                `)
                .eq('profile_id', user.id)
                .gte('created_at', startOfDay)
                .lte('created_at', endOfDay)
                .neq('status', 'cancelled')

            const orders = ordersData || []

            const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
            const totalOrders = orders.length
            const activeTables = new Set(orders.filter(o => o.status !== 'paid').map(o => o.table_number)).size
            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

            const productMap = new Map<string, { quantity: number; revenue: number }>()
            orders.forEach(order => {
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

            setAnalytics({ totalRevenue, totalOrders, activeTables, avgOrderValue, bestSellers })
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase])

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
            <div>
                <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
                <p className="text-slate-500 text-sm mt-1">
                    {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
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

            {/* Best Sellers */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">En Çok Satanlar</h2>
                    <p className="text-sm text-slate-500">Bugünün en popüler ürünleri</p>
                </div>

                <div className="p-4">
                    {analytics?.bestSellers && analytics.bestSellers.length > 0 ? (
                        <div className="space-y-2">
                            {analytics.bestSellers.map((item, index) => (
                                <div
                                    key={item.name}
                                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    {/* Rank */}
                                    <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-medium">
                                        {index + 1}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 truncate">{item.name}</p>
                                        <p className="text-sm text-slate-500">{item.quantity} adet</p>
                                    </div>

                                    {/* Revenue */}
                                    <div className="text-right">
                                        <p className="font-medium text-slate-900">₺{item.revenue.toFixed(0)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Coffee className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">Bugün henüz sipariş yok</p>
                            <p className="text-sm text-slate-400 mt-1">İlk siparişiniz geldiğinde burada görünecek</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
