'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    ArrowUpRight
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
    const supabase = createClient()

    const fetchAnalytics = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

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
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
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
                    <h1 className="text-2xl font-bold text-slate-800">Genel Bakış</h1>
                    <p className="text-slate-500 flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {today}
                    </p>
                </div>
                <Badge variant="outline" className="w-fit text-slate-500 border-slate-200 bg-white">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                    Canlı güncelleme
                </Badge>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Revenue Card */}
                <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">
                            Günlük Ciro
                        </CardTitle>
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800">
                            ₺{analytics?.totalRevenue.toFixed(2) || '0.00'}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                            <span className="text-xs text-emerald-600 font-medium">Bugün</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Orders Card */}
                <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">
                            Toplam Sipariş
                        </CardTitle>
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800">
                            {analytics?.totalOrders || 0}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            sipariş alındı
                        </p>
                    </CardContent>
                </Card>

                {/* Active Tables Card */}
                <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">
                            Aktif Masalar
                        </CardTitle>
                        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <Users className="h-5 w-5 text-amber-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800">
                            {analytics?.activeTables || 0}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            bekleyen masa
                        </p>
                    </CardContent>
                </Card>

                {/* Average Order Card */}
                <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">
                            Ortalama Sepet
                        </CardTitle>
                        <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-violet-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800">
                            ₺{analytics?.avgOrderValue.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            sipariş başına
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Best Sellers */}
            <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-amber-500" />
                                En Çok Satanlar
                            </CardTitle>
                            <CardDescription className="text-slate-500 mt-1">
                                Bugünün popüler ürünleri
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {analytics?.bestSellers.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Coffee className="h-8 w-8 text-slate-400" />
                            </div>
                            <p className="text-slate-500 font-medium">Henüz sipariş yok</p>
                            <p className="text-slate-400 text-sm mt-1">Siparişler burada görünecek</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {analytics?.bestSellers.map((product, index) => (
                                <div
                                    key={product.name}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${index === 0 ? 'bg-amber-100 text-amber-700' :
                                            index === 1 ? 'bg-slate-100 text-slate-700' :
                                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                                    'bg-slate-50 text-slate-500'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 truncate">{product.name}</p>
                                        <p className="text-sm text-slate-500">
                                            {product.quantity} adet satıldı
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-semibold text-emerald-600">
                                            ₺{product.revenue.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
