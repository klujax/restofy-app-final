'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Users,
    Store,
    ShoppingCart,
    Activity,
    Shield,
    Loader2,
    Clock,
    Mail,
    TrendingUp,
    AlertTriangle,
    RefreshCw
} from 'lucide-react'

interface Stats {
    totalUsers: number
    totalShops: number
    totalOrders: number
    recentSignups: { id: string; email: string; created_at: string; business_name: string | null }[]
}

export function SuperAdminClient() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const fetchStats = async () => {
        setLoading(true)
        setError(null)

        try {
            // Fetch total users count
            let usersCount = 0
            try {
                const { count, error: usersError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })

                if (!usersError) {
                    usersCount = count || 0
                }
            } catch {
                console.warn('Could not fetch users count')
            }

            // Fetch total shops (profiles with business_name)
            let shopsCount = 0
            try {
                const { count, error: shopsError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .not('business_name', 'is', null)

                if (!shopsError) {
                    shopsCount = count || 0
                }
            } catch {
                console.warn('Could not fetch shops count')
            }

            // Fetch total orders
            let ordersCount = 0
            try {
                const { count, error: ordersError } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })

                if (!ordersError) {
                    ordersCount = count || 0
                }
            } catch {
                console.warn('Could not fetch orders count')
            }

            // Fetch recent signups
            let recentUsers: Stats['recentSignups'] = []
            try {
                const { data, error: recentError } = await supabase
                    .from('profiles')
                    .select('id, email, created_at, business_name')
                    .order('created_at', { ascending: false })
                    .limit(10)

                if (!recentError && data) {
                    recentUsers = data
                }
            } catch {
                console.warn('Could not fetch recent signups')
            }

            setStats({
                totalUsers: usersCount,
                totalShops: shopsCount,
                totalOrders: ordersCount,
                recentSignups: recentUsers
            })
        } catch (err) {
            console.error('Error fetching stats:', err)
            setError('Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
    }, [])

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch {
            return '-'
        }
    }

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white">
                <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Mission Control</h1>
                                <p className="text-sm text-slate-400">Super Admin Dashboard</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                        <p className="text-slate-400">Veriler yükleniyor...</p>
                    </div>

                    {/* Skeleton Cards */}
                    <div className="grid gap-6 md:grid-cols-3 mt-8">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="bg-slate-900 border-slate-800">
                                <CardHeader className="pb-2">
                                    <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
                                </CardHeader>
                                <CardContent>
                                    <div className="h-8 w-16 bg-slate-800 rounded animate-pulse" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </main>
            </div>
        )
    }

    // Error State
    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 text-white">
                <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Mission Control</h1>
                                <p className="text-sm text-slate-400">Super Admin Dashboard</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-6 py-8">
                    <Card className="bg-red-950/50 border-red-800">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center gap-4 py-8">
                                <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <AlertTriangle className="h-8 w-8 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Bir Hata Oluştu</h3>
                                    <p className="text-red-300 mt-1">{error}</p>
                                </div>
                                <Button
                                    onClick={fetchStats}
                                    className="mt-4 bg-red-600 hover:bg-red-700 gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Tekrar Dene
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Mission Control</h1>
                                <p className="text-sm text-slate-400">Super Admin Dashboard</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={fetchStats}
                                className="text-slate-400 hover:text-white gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Yenile
                            </Button>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                                Live
                            </Badge>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Total Users */}
                    <Card className="bg-slate-900 border-slate-800 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">
                                Toplam Kullanıcı
                            </CardTitle>
                            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</div>
                            <p className="text-xs text-slate-500 mt-1">kayıtlı kullanıcı</p>
                        </CardContent>
                    </Card>

                    {/* Total Shops */}
                    <Card className="bg-slate-900 border-slate-800 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">
                                Aktif Kafeler
                            </CardTitle>
                            <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <Store className="h-5 w-5 text-purple-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-white">{stats?.totalShops || 0}</div>
                            <p className="text-xs text-slate-500 mt-1">kayıtlı işletme</p>
                        </CardContent>
                    </Card>

                    {/* Total Orders */}
                    <Card className="bg-slate-900 border-slate-800 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">
                                Toplam Sipariş
                            </CardTitle>
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <ShoppingCart className="h-5 w-5 text-emerald-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-white">{stats?.totalOrders || 0}</div>
                            <p className="text-xs text-slate-500 mt-1">sistem genelinde</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Signups Table */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-amber-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-white">Son Kayıtlar</CardTitle>
                                    <p className="text-sm text-slate-400">Son 10 kullanıcı kaydı</p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-800">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Email</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">İşletme</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Kayıt Tarihi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(!stats?.recentSignups || stats.recentSignups.length === 0) ? (
                                        <tr>
                                            <td colSpan={3} className="text-center py-8 text-slate-500">
                                                Henüz kayıt yok
                                            </td>
                                        </tr>
                                    ) : (
                                        stats.recentSignups.map((user) => (
                                            <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-slate-500" />
                                                        <span className="text-white text-sm">{user.email || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-slate-300 text-sm">
                                                        {user.business_name || '-'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-slate-500" />
                                                        <span className="text-slate-400 text-sm">
                                                            {user.created_at ? formatDate(user.created_at) : '-'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* System Status */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="bg-slate-900 border-slate-800 shadow-xl">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                                <div>
                                    <p className="text-sm font-medium text-white">Sistem Durumu</p>
                                    <p className="text-xs text-slate-400">Tüm sistemler çalışıyor</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800 shadow-xl">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
                                <div>
                                    <p className="text-sm font-medium text-white">Veritabanı</p>
                                    <p className="text-xs text-slate-400">Supabase bağlı</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
