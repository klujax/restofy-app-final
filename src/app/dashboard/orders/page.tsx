'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OrderWithItems } from '@/types/orders'
import { ServiceRequest } from '@/types/database'
import { OrderCard } from '@/components/orders/order-card'
import { ServiceRequestCard } from '@/components/orders/service-request-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Bell, ChefHat, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function OrdersPage() {
    const [orders, setOrders] = useState<OrderWithItems[]>([])
    const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const [restaurantId, setRestaurantId] = useState<string | null>(null)


    const fetchOrders = useCallback(async (specificRestaurantId?: string) => {
        try {
            const targetId = specificRestaurantId || restaurantId || localStorage.getItem('selectedRestaurantId')
            if (!targetId) return

            if (targetId !== restaurantId) setRestaurantId(targetId)

            // Fetch only active or recent orders for THIS specific restaurant
            const { data, error } = await supabase
                .from('orders')
                .select(`
                  *,
                  order_items (*)
                `)
                .eq('restaurant_id', targetId)
                .or('status.in.(pending,received,preparing,ready,served),and(status.eq.paid,created_at.gte.' + new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() + ')')
                .order('created_at', { ascending: false })

            if (error) throw error
            setOrders(data || [])
        } catch (error) {
            console.error('Error fetching orders:', error)
        }
    }, [supabase, restaurantId])

    const fetchServiceRequests = useCallback(async (specificRestaurantId?: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const targetId = specificRestaurantId || restaurantId || localStorage.getItem('selectedRestaurantId')
            if (!targetId) return

            const { data, error } = await supabase
                .from('service_requests')
                .select('*')
                .eq('restaurant_id', targetId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            // Note: If using cafe_id, we might need to migrate column or use restaurant_id if available. 
            // Assuming migration has added restaurant_id to service_requests as well. 
            // If not, we might fall back to cafe_id (profile_id) but that breaks isolation.
            // For now, let's assume strict isolation is needed and we filter by restaurant_id.
            // If the column lacks restaurant_id, this fetch might fail or return empty, which is safer than leaking.

            if (error) throw error
            setServiceRequests(data || [])
        } catch (error) {
            console.error('Error fetching service requests:', error)
        }
    }, [supabase, restaurantId])

    const playNotificationSound = () => {
        try {
            const audio = new Audio('/notification.mp3')
            audio.volume = 0.5
            audio.play().catch(() => { })
        } catch { }
    }

    useEffect(() => {
        const initData = async () => {
            const storedId = localStorage.getItem('selectedRestaurantId')
            if (storedId) {
                setRestaurantId(storedId)
                await Promise.all([fetchOrders(storedId), fetchServiceRequests(storedId)])
            } else {
                // Fallback: fetch first owned restaurant to get ID? 
                // Or just wait for user selection.
            }
            setLoading(false)
        }
        initData()

        const handleRestaurantChange = (e: CustomEvent) => {
            const newId = e.detail.restaurantId
            setRestaurantId(newId)
            fetchOrders(newId)
            fetchServiceRequests(newId)
        }

        window.addEventListener('restaurant-change', handleRestaurantChange as EventListener)

        return () => {
            window.removeEventListener('restaurant-change', handleRestaurantChange as EventListener)
        }
    }, [fetchOrders, fetchServiceRequests])

    useEffect(() => {
        if (!restaurantId) return

        console.log('[Realtime] Setting up subscription for restaurant:', restaurantId)

        // Set up real-time subscriptions - without filters for better reliability
        // We filter client-side instead since Supabase Realtime filters can be unreliable
        const channel = supabase
            .channel(`dashboard-realtime-${restaurantId}`)
            // Orders INSERT
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                },
                async (payload) => {
                    console.log('[Realtime] Order INSERT received:', payload.new)
                    // Client-side filter
                    if (payload.new.restaurant_id !== restaurantId) {
                        console.log('[Realtime] Order not for this restaurant, ignoring')
                        return
                    }

                    const { data: newOrder } = await supabase
                        .from('orders')
                        .select(`*, order_items (*)`)
                        .eq('id', payload.new.id)
                        .single()

                    if (newOrder) {
                        setOrders((prev) => [newOrder, ...prev])
                        playNotificationSound()
                        toast.success('🔔 Yeni sipariş geldi!', {
                            description: `Masa ${newOrder.table_number || '?'} - ₺${newOrder.total_amount.toFixed(2)}`,
                        })
                    }
                }
            )
            // Orders UPDATE
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                },
                (payload) => {
                    console.log('[Realtime] Order UPDATE received:', payload.new)
                    if (payload.new.restaurant_id !== restaurantId) return

                    setOrders((prev) =>
                        prev.map((order) =>
                            order.id === payload.new.id
                                ? { ...order, status: payload.new.status }
                                : order
                        )
                    )
                }
            )
            // Service Requests INSERT
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'service_requests',
                },
                (payload) => {
                    console.log('[Realtime] Service Request INSERT received:', payload.new)
                    if (payload.new.restaurant_id !== restaurantId) {
                        console.log('[Realtime] Service request not for this restaurant, ignoring')
                        return
                    }

                    const newRequest = payload.new as ServiceRequest
                    setServiceRequests((prev) => [newRequest, ...prev])
                    playNotificationSound()
                    toast.error(`🔔 Masa ${newRequest.table_no} Garson İstiyor!`, {
                        duration: 10000,
                    })
                }
            )
            // Service Requests UPDATE
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'service_requests',
                },
                (payload) => {
                    console.log('[Realtime] Service Request UPDATE received:', payload.new)
                    if (payload.new.restaurant_id !== restaurantId) return

                    if (payload.new.status === 'resolved') {
                        setServiceRequests((prev) =>
                            prev.filter((req) => req.id !== payload.new.id)
                        )
                    }
                }
            )
            .subscribe((status, err) => {
                console.log('[Realtime] Subscription status:', status)
                if (err) {
                    console.error('[Realtime] Subscription error:', err)
                }
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] Successfully subscribed to changes!')
                }
            })

        return () => {
            console.log('[Realtime] Removing channel for restaurant:', restaurantId)
            supabase.removeChannel(channel)
        }
    }, [restaurantId, supabase])

    const receivedOrders = useMemo(() =>
        orders.filter((order) => order.status === 'received'),
        [orders]
    )
    const preparingOrders = useMemo(() =>
        orders.filter((order) => order.status === 'preparing'),
        [orders]
    )
    const readyOrders = useMemo(() =>
        orders.filter((order) => order.status === 'ready'),
        [orders]
    )


    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Canlı Siparişler</h1>
                <p className="text-slate-500 mt-1">
                    Gelen siparişleri ve garson çağrılarını takip edin.
                </p>
            </div>

            {/* Service Requests Alert */}
            {serviceRequests.length > 0 && (
                <Card className="border-amber-200 bg-amber-50 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-amber-800">
                            <AlertTriangle className="h-5 w-5" />
                            Garson Çağrıları ({serviceRequests.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {serviceRequests.map((request) => (
                            <ServiceRequestCard
                                key={request.id}
                                request={request}
                                onResolve={fetchServiceRequests}
                            />
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Kanban Board */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Received (Onaylandı) Column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                        <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-slate-800">Onaylandı</h3>
                        {receivedOrders.length > 0 && (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 animate-pulse">
                                {receivedOrders.length}
                            </Badge>
                        )}
                    </div>
                    <ScrollArea className="h-[calc(100vh-350px)]">
                        <div className="space-y-3 pr-4">
                            {receivedOrders.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                        <Bell className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <p className="text-sm text-slate-500">Onaylanan yeni sipariş yok</p>
                                </div>
                            ) : (
                                receivedOrders.map((order) => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        onStatusChange={fetchOrders}
                                    />
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Preparing (Hazırlanıyor) Column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <ChefHat className="h-4 w-4 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-slate-800">Hazırlanıyor</h3>
                        {preparingOrders.length > 0 && (
                            <Badge className="bg-blue-500 hover:bg-blue-600">{preparingOrders.length}</Badge>
                        )}
                    </div>
                    <ScrollArea className="h-[calc(100vh-350px)]">
                        <div className="space-y-3 pr-4">
                            {preparingOrders.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                        <ChefHat className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <p className="text-sm text-slate-500">Hazırlanan sipariş yok</p>
                                </div>
                            ) : (
                                preparingOrders.map((order) => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        onStatusChange={fetchOrders}
                                    />
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Ready (Hazır) Column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                        <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Bell className="h-4 w-4 text-amber-600" />
                        </div>
                        <h3 className="font-semibold text-slate-800">Hazır</h3>
                        {readyOrders.length > 0 && (
                            <Badge className="bg-amber-500 hover:bg-amber-600">{readyOrders.length}</Badge>
                        )}
                    </div>
                    <ScrollArea className="h-[calc(100vh-350px)]">
                        <div className="space-y-3 pr-4">
                            {readyOrders.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle2 className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <p className="text-sm text-slate-500">Teslim bekleyen sipariş yok</p>
                                </div>
                            ) : (
                                readyOrders.map((order) => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        onStatusChange={fetchOrders}
                                    />
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    )
}
