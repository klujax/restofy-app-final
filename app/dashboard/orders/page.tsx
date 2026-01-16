'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OrderWithItems, OrderStatus } from '@/types/orders'
import { ServiceRequest } from '@/types/service-request'
import { OrderCard } from '@/components/orders/order-card'
import { ServiceRequestCard } from '@/components/orders/service-request-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Bell, Clock, ChefHat, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function OrdersPage() {
    const [orders, setOrders] = useState<OrderWithItems[]>([])
    const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchOrders = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          order_items (*)
        `)
                .eq('profile_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setOrders(data || [])
        } catch (error) {
            console.error('Error fetching orders:', error)
            toast.error('Failed to load orders')
        }
    }, [supabase])

    const fetchServiceRequests = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('service_requests')
                .select('*')
                .eq('cafe_id', user.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (error) throw error
            setServiceRequests(data || [])
        } catch (error) {
            console.error('Error fetching service requests:', error)
        }
    }, [supabase])

    const playNotificationSound = () => {
        try {
            const audio = new Audio('/notification.mp3')
            audio.volume = 0.5
            audio.play().catch(() => { })
        } catch { }
    }

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchOrders(), fetchServiceRequests()])
            setLoading(false)
        }
        loadData()

        // Set up real-time subscriptions
        const setupSubscriptions = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const channel = supabase
                .channel('dashboard-realtime')
                // Orders INSERT
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'orders',
                        filter: `profile_id=eq.${user.id}`,
                    },
                    async (payload) => {
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
                        filter: `profile_id=eq.${user.id}`,
                    },
                    (payload) => {
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
                        filter: `cafe_id=eq.${user.id}`,
                    },
                    (payload) => {
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
                        filter: `cafe_id=eq.${user.id}`,
                    },
                    (payload) => {
                        if (payload.new.status === 'resolved') {
                            setServiceRequests((prev) =>
                                prev.filter((req) => req.id !== payload.new.id)
                            )
                        }
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }

        const cleanup = setupSubscriptions()
        return () => {
            cleanup.then((fn) => fn?.())
        }
    }, [fetchOrders, fetchServiceRequests, supabase])

    const filterByStatus = (statuses: OrderStatus[]) => {
        return orders.filter((order) => statuses.includes(order.status as OrderStatus))
    }

    const pendingOrders = filterByStatus(['pending'])
    const preparingOrders = filterByStatus(['preparing'])
    const servedOrders = filterByStatus(['served'])
    const paidOrders = filterByStatus(['paid']).slice(0, 10)

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
                {/* Pending Orders Column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                        <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Bell className="h-4 w-4 text-amber-600" />
                        </div>
                        <h3 className="font-semibold text-slate-800">Bekliyor</h3>
                        {pendingOrders.length > 0 && (
                            <Badge className="bg-amber-500 hover:bg-amber-600 animate-pulse">
                                {pendingOrders.length}
                            </Badge>
                        )}
                    </div>
                    <ScrollArea className="h-[calc(100vh-350px)]">
                        <div className="space-y-3 pr-4">
                            {pendingOrders.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                        <Bell className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <p className="text-sm text-slate-500">Bekleyen sipariş yok</p>
                                </div>
                            ) : (
                                pendingOrders.map((order) => (
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

                {/* Preparing Column */}
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

                {/* Served Column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                        <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-slate-800">Servis Edildi</h3>
                        {servedOrders.length > 0 && (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600">{servedOrders.length}</Badge>
                        )}
                    </div>
                    <ScrollArea className="h-[calc(100vh-350px)]">
                        <div className="space-y-3 pr-4">
                            {servedOrders.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle2 className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <p className="text-sm text-slate-500">Servis edilmiş sipariş yok</p>
                                </div>
                            ) : (
                                servedOrders.map((order) => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        onStatusChange={fetchOrders}
                                    />
                                ))
                            )}

                            {paidOrders.length > 0 && (
                                <>
                                    <div className="flex items-center gap-2 pt-4">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground font-medium">
                                            💰 Son Ödenenler
                                        </span>
                                    </div>
                                    {paidOrders.map((order) => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            onStatusChange={fetchOrders}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    )
}
