'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Wallet,
    ShoppingCart,
    Users,
    TrendingUp,
    Trophy,
    Coffee,
    Loader2,
    ArrowUpRight,
    Sparkles,
    Flame
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
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        )
    }

    const stats = [
        {
            title: 'Günlük Ciro',
            value: `${currency}${analytics?.totalRevenue.toFixed(0) || '0'}`,
            icon: Wallet,
            gradient: 'from-emerald-500 to-teal-600',
            bgGradient: 'from-emerald-500/10 to-teal-500/10',
            change: '+12%'
        },
        {
            title: 'Siparişler',
            value: analytics?.totalOrders || 0,
            icon: ShoppingCart,
            gradient: 'from-blue-500 to-indigo-600',
            bgGradient: 'from-blue-500/10 to-indigo-500/10',
            change: '+5'
        },
        {
            title: 'Aktif Masa',
            value: analytics?.activeTables || 0,
            icon: Users,
            gradient: 'from-amber-500 to-orange-600',
            bgGradient: 'from-amber-500/10 to-orange-500/10',
            change: 'şu an'
        },
        {
            title: 'Ortalama',
            value: `${currency}${analytics?.avgOrderValue.toFixed(0) || '0'}`,
            icon: TrendingUp,
            gradient: 'from-violet-500 to-purple-600',
            bgGradient: 'from-violet-500/10 to-purple-500/10',
            change: '/sipariş'
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-orange-400" />
                        Dashboard
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-0 gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Canlı
                </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card
                        key={i}
                        className={`relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} border-white/5 p-5 hover:scale-[1.02] transition-transform cursor-default`}
                    >
                        {/* Icon */}
                        <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                            <stat.icon className="h-6 w-6 text-white" />
                        </div>

                        {/* Content */}
                        <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>

                        {/* Change */}
                        <div className="flex items-center gap-1 mt-2">
                            <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                            <span className="text-xs text-emerald-400">{stat.change}</span>
                        </div>

                        {/* Decorative Blur */}
                        <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br ${stat.gradient} opacity-20 blur-3xl`} />
                    </Card>
                ))}
            </div>

            {/* Best Sellers */}
            <Card className="bg-slate-800/30 border-white/5 backdrop-blur-sm overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                            <Flame className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">En Çok Satanlar</h2>
                            <p className="text-sm text-slate-400">Bugünün yıldızları</p>
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    {analytics?.bestSellers && analytics.bestSellers.length > 0 ? (
                        <div className="space-y-2">
                            {analytics.bestSellers.map((item, index) => (
                                <div
                                    key={item.name}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    {/* Rank */}
                                    <div
                                        className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                                        style={{
                                            background: index === 0
                                                ? 'linear-gradient(135deg, #f97316, #ea580c)'
                                                : index === 1
                                                    ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                                                    : 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                                        }}
                                    >
                                        {index + 1}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">{item.name}</p>
                                        <p className="text-sm text-slate-400">{item.quantity} adet satıldı</p>
                                    </div>

                                    {/* Revenue */}
                                    <div className="text-right">
                                        <p className="font-semibold text-white">{currency}{item.revenue.toFixed(0)}</p>
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
                </div>
            </Card>
        </div>
    )
}
