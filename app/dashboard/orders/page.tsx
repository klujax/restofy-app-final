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
                .eq('profile_id', user.id)
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
                        filter: `profile_id=eq.${user.id}`,
                    },
                    (payload) => {
                        const newRequest = payload.new as ServiceRequest
                        setServiceRequests((prev) => [newRequest, ...prev])
                        playNotificationSound()
                        toast.error(`🔔 Masa ${newRequest.table_number} Garson İstiyor!`, {
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
                        filter: `profile_id=eq.${user.id}`,
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

    const newOrders = filterByStatus(['received'])
    const preparingOrders = filterByStatus(['preparing'])
    const readyOrders = filterByStatus(['ready'])
    const completedOrders = filterByStatus(['completed']).slice(0, 10)

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
                <h2 className="text-3xl font-bold tracking-tight">Canlı Siparişler</h2>
                <p className="text-muted-foreground">
                    Gelen siparişleri ve garson çağrılarını takip edin.
                </p>
            </div>

            {/* Service Requests Alert */}
            {serviceRequests.length > 0 && (
                <Card className="border-orange-500 bg-orange-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-orange-800">
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
                {/* New Orders Column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-orange-500" />
                        <h3 className="font-semibold text-lg">Yeni Siparişler</h3>
                        {newOrders.length > 0 && (
                            <Badge variant="destructive" className="animate-pulse">
                                {newOrders.length}
                            </Badge>
                        )}
                    </div>
                    <ScrollArea className="h-[calc(100vh-350px)]">
                        <div className="space-y-3 pr-4">
                            {newOrders.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Yeni sipariş yok
                                </p>
                            ) : (
                                newOrders.map((order) => (
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
                    <div className="flex items-center gap-2">
                        <ChefHat className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold text-lg">Hazırlanıyor</h3>
                        {preparingOrders.length > 0 && (
                            <Badge variant="secondary">{preparingOrders.length}</Badge>
                        )}
                    </div>
                    <ScrollArea className="h-[calc(100vh-350px)]">
                        <div className="space-y-3 pr-4">
                            {preparingOrders.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Hazırlanan sipariş yok
                                </p>
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

                {/* Ready Column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <h3 className="font-semibold text-lg">Hazır</h3>
                        {readyOrders.length > 0 && (
                            <Badge className="bg-green-500">{readyOrders.length}</Badge>
                        )}
                    </div>
                    <ScrollArea className="h-[calc(100vh-350px)]">
                        <div className="space-y-3 pr-4">
                            {readyOrders.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Hazır sipariş yok
                                </p>
                            ) : (
                                readyOrders.map((order) => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        onStatusChange={fetchOrders}
                                    />
                                ))
                            )}

                            {completedOrders.length > 0 && (
                                <>
                                    <div className="flex items-center gap-2 pt-4">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground font-medium">
                                            Son Tamamlananlar
                                        </span>
                                    </div>
                                    {completedOrders.map((order) => (
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
