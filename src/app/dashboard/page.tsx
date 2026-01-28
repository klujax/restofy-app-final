'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { restaurantService } from '@/services/restaurant.service'
import { Store, Plus, ExternalLink, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AnalyticsCharts } from '@/components/dashboard/analytics-charts'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Restaurant } from '@/types/database'

export default function OwnerDashboardPage() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [stats, setStats] = useState<{
        totalRevenue: number
        totalOrders: number
        revenueByRestaurant: Record<string, number>
        ordersByRestaurant: Record<string, number>
        rawOrders?: Record<string, unknown>[]
    }>({ totalRevenue: 0, totalOrders: 0, revenueByRestaurant: {}, ordersByRestaurant: {}, rawOrders: [] })

    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const router = useRouter()

    const fetchDashboardData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }

        try {
            // 1. Fetch Restaurants
            const restaurantsData = await restaurantService.getRestaurantsByOwner(supabase, user.id) || []
            setRestaurants(restaurantsData)

            if (restaurantsData.length === 0) {
                setLoading(false)
                return
            }

            // 2. Fetch Orders for ALL restaurants
            const restaurantIds = restaurantsData.map(r => r.id)
            const { data: orders, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        *
                    )
                `)
                .in('restaurant_id', restaurantIds)
                .neq('status', 'cancelled')
                .order('created_at', { ascending: false })

            if (error) throw error

            // 3. Aggregate Data
            let totalRevenue = 0
            let totalOrders = 0
            const revenueByRestaurant: Record<string, number> = {}
            const ordersByRestaurant: Record<string, number> = {}

            restaurantsData.forEach(r => {
                revenueByRestaurant[r.id] = 0
                ordersByRestaurant[r.id] = 0
            })

            orders?.forEach(order => {
                const amount = Number(order.total_amount) || 0
                totalRevenue += amount
                totalOrders += 1

                if (order.restaurant_id) {
                    revenueByRestaurant[order.restaurant_id] = (revenueByRestaurant[order.restaurant_id] || 0) + amount
                    ordersByRestaurant[order.restaurant_id] = (ordersByRestaurant[order.restaurant_id] || 0) + 1
                }
            })

            setStats({
                totalRevenue,
                totalOrders,
                revenueByRestaurant,
                ordersByRestaurant,
                rawOrders: orders || []
            })

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }, [router, supabase])

    useEffect(() => {
        fetchDashboardData()
    }, [fetchDashboardData])

    // Realtime Subscription
    useEffect(() => {
        if (restaurants.length === 0) return

        const channels = restaurants.map(restaurant => {
            return supabase
                .channel(`dashboard-orders-${restaurant.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*', // INSERT, UPDATE
                        schema: 'public',
                        table: 'orders',
                        filter: `restaurant_id=eq.${restaurant.id}`
                    },
                    (payload) => {
                        // Refresh full data to ensure consistency (aggregates are complex)
                        // Or optimally, update local state. For now, fetch is safer for consistent stats.
                        // We will just trigger a fetch and show a toast.

                        if (payload.eventType === 'INSERT') {
                            const newOrder = payload.new as { table_number?: string; total_amount?: number }
                            const tableNo = newOrder.table_number || '?'
                            const amount = newOrder.total_amount
                            toast.success(`Yeni Sipariş! Masa ${tableNo} - ₺${amount}`)

                            // Play notification sound
                            const audio = new Audio('/notification.mp3') // Assume we might add this later, or browser default beep
                            audio.play().catch(e => console.log('Audio play failed', e))
                        }

                        fetchDashboardData()
                    }
                )
                .subscribe()
        })

        return () => {
            channels.forEach(channel => supabase.removeChannel(channel))
        }
    }, [restaurants, supabase, fetchDashboardData])

    const handleCreateRestaurant = async () => {
        const name = window.prompt('Restoran Adı:')
        if (!name) return

        const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '')
        const { data: { user } } = await supabase.auth.getUser()

        try {
            await restaurantService.createRestaurant(supabase, {
                owner_id: user?.id,
                name,
                slug,
                theme_color: '#f97316' // Default orange
            })
            fetchDashboardData()
        } catch (error) {
            if (error instanceof Error) {
                alert('Hata: ' + error.message)
            } else {
                alert('Beklenmedik bir hata oluştu.')
            }
        }
    }

    const handleDeleteRestaurant = async (id: string) => {
        if (!window.confirm('Bu restoranı silmek istediğinize emin misiniz?')) return

        try {
            await restaurantService.deleteRestaurant(supabase, id)
            fetchDashboardData()
        } catch (error) {
            if (error instanceof Error) {
                alert('Hata: ' + error.message)
            } else {
                alert('Beklenmedik bir hata oluştu.')
            }
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Genel Bakış</h1>
                    <p className="text-slate-500">Tüm işletmelerinizin toplam performansı.</p>
                </div>
                <button
                    onClick={handleCreateRestaurant}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Restoran Ekle
                </button>
            </div>





            {/* Advanced Analytics Charts */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <AnalyticsCharts orders={stats.rawOrders || []} restaurants={restaurants} />
            </div>

            <h2 className="text-xl font-bold text-slate-900 pt-4">İşletmelerim</h2>

            {/* Restaurant List with Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant) => (
                    <div key={restaurant.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
                        <div className="h-32 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                            {restaurant.logo_url ? (
                                <div className="relative h-full w-full">
                                    <Image
                                        src={restaurant.logo_url}
                                        alt={restaurant.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    {/* Gradient overlay for text readability if needed, though we moved stats down */}
                                </div>
                            ) : (
                                <Store className="h-12 w-12 text-slate-300" />
                            )}
                            <div className="absolute top-2 right-2 flex gap-2">
                                <button
                                    onClick={() => handleDeleteRestaurant(restaurant.id)}
                                    className="p-2 bg-white/90 rounded-full text-red-600 hover:text-red-700 hover:bg-white shadow-sm"
                                    title="Sil"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-5">
                            <div className="mb-4">
                                <h3 className="font-semibold text-lg text-slate-900">{restaurant.name}</h3>
                                <p className="text-sm text-slate-500 truncate">{restaurant.description || 'Açıklama yok'}</p>
                            </div>

                            {/* Mini Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <p className="text-xs text-slate-500 font-medium">Ciro</p>
                                    <p className="text-slate-900 font-bold">
                                        ₺{(stats.revenueByRestaurant[restaurant.id] || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <p className="text-xs text-slate-500 font-medium">Siparişler</p>
                                    <p className="text-slate-900 font-bold">
                                        {stats.ordersByRestaurant[restaurant.id] || 0}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        localStorage.setItem('selectedRestaurantId', restaurant.id)
                                        window.dispatchEvent(new CustomEvent('restaurant-change', {
                                            detail: { restaurantId: restaurant.id }
                                        }))
                                        router.push(`/dashboard/${restaurant.id}`)
                                    }}
                                    className="flex-1 text-center bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                                >
                                    Yönet
                                </button>
                                <Link
                                    href={`/menu/${restaurant.slug}`}
                                    target="_blank"
                                    className="flex items-center justify-center w-10 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                                    title="Canlı Menü"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}

                {restaurants.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <Store className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <h3 className="font-medium text-slate-900">Henüz restoranınız yok</h3>
                        <p className="text-slate-500 text-sm mt-1 mb-4">İlk restoranınızı oluşturarak satış yapmaya başlayın.</p>
                        <button
                            onClick={handleCreateRestaurant}
                            className="text-orange-600 font-medium hover:text-orange-700"
                        >
                            Restoran Oluştur
                        </button>
                    </div>
                )}
            </div>
        </div >
    )
}
