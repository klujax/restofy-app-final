'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    DollarSign,
    ShoppingBag,
    Users,
    TrendingUp,
    Trophy,
    Coffee,
    Loader2,
    Calendar,
    ArrowUpRight,
    Sparkles
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
    const [businessName, setBusinessName] = useState('')
    const [themeColor, setThemeColor] = useState('#f97316')
    const [currency, setCurrency] = useState('₺')
    const supabase = createClient()

    const fetchAnalytics = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch profile data
            const { data: profile } = await supabase
                .from('profiles')
                .select('business_name, theme_color, currency')
                .eq('id', user.id)
                .single()

            if (profile) {
                setBusinessName(profile.business_name || '')
                setThemeColor(profile.theme_color || '#f97316')
                setCurrency(profile.currency || '₺')
            }

            const today = new Date()
            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
            const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select(`
          id,
          total_amount,
          table_number,
          status,
          created_at,
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

            if (ordersError) throw ordersError

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

            setAnalytics({
                totalRevenue,
                totalOrders,
                activeTables,
                avgOrderValue,
                bestSellers,
            })
        } catch (error) {
            console.error('Error fetching analytics:', error)
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
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        )
    }

    const today = new Date().toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-orange-500" />
                        Hoş geldin!
                    </h1>
                    <p className="text-slate-400 flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {today}
                    </p>
                </div>
                <Badge
                    className="w-fit border-0"
                    style={{
                        backgroundColor: `${themeColor}20`,
                        color: themeColor
                    }}
                >
                    <span className="h-2 w-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: themeColor }} />
                    Canlı güncelleme
                </Badge>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Revenue Card */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">
                            Günlük Ciro
                        </CardTitle>
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {currency}{analytics?.totalRevenue.toFixed(2) || '0.00'}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                            <span className="text-xs text-emerald-400 font-medium">Bugün</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Orders Card */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">
                            Toplam Sipariş
                        </CardTitle>
                        <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {analytics?.totalOrders || 0}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            sipariş alındı
                        </p>
                    </CardContent>
                </Card>

                {/* Active Tables Card */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">
                            Aktif Masalar
                        </CardTitle>
                        <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <Users className="h-5 w-5 text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {analytics?.activeTables || 0}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            bekleyen masa
                        </p>
                    </CardContent>
                </Card>

                {/* Average Order Card */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">
                            Ortalama Sipariş
                        </CardTitle>
                        <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {currency}{analytics?.avgOrderValue.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            sipariş başına
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Best Sellers */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <Trophy className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                            <CardTitle className="text-white">En Çok Satanlar</CardTitle>
                            <p className="text-sm text-slate-400">Bugünün popüler ürünleri</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {analytics?.bestSellers && analytics.bestSellers.length > 0 ? (
                        <div className="space-y-3">
                            {analytics.bestSellers.map((item, index) => (
                                <div
                                    key={item.name}
                                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold"
                                            style={{
                                                backgroundColor: index === 0 ? themeColor : index === 1 ? '#6366f1' : '#8b5cf6',
                                                opacity: 1 - (index * 0.15)
                                            }}
                                        >
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{item.name}</p>
                                            <p className="text-sm text-slate-400">{item.quantity} adet satıldı</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-white">{currency}{item.revenue.toFixed(2)}</p>
                                        <p className="text-xs text-slate-500">gelir</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Coffee className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">Bugün henüz sipariş yok</p>
                            <p className="text-sm text-slate-500 mt-1">İlk siparişiniz geldiğinde burada görünecek</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
