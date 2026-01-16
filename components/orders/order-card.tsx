'use client'

import { useState } from 'react'
import { OrderWithItems, OrderStatus, ORDER_STATUS_CONFIG, NEXT_STATUS, NEXT_STATUS_BUTTON } from '@/types/orders'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Clock,
    User,
    Hash,
    ChefHat,
    Truck,
    CreditCard,
    XCircle,
    Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrderCardProps {
    order: OrderWithItems
    onStatusChange: () => void
}

const STATUS_STYLES: Record<string, { bg: string; border: string; badge: string }> = {
    pending: { bg: 'bg-white', border: 'border-l-amber-500', badge: 'bg-amber-100 text-amber-700' },
    preparing: { bg: 'bg-white', border: 'border-l-blue-500', badge: 'bg-blue-100 text-blue-700' },
    served: { bg: 'bg-white', border: 'border-l-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
    paid: { bg: 'bg-slate-50', border: 'border-l-slate-300', badge: 'bg-slate-100 text-slate-600' },
    cancelled: { bg: 'bg-red-50', border: 'border-l-red-500', badge: 'bg-red-100 text-red-700' },
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    const status = order.status as OrderStatus
    const statusConfig = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pending
    const nextStatus = NEXT_STATUS[status]
    const nextButtonLabel = NEXT_STATUS_BUTTON[status]
    const styles = STATUS_STYLES[status] || STATUS_STYLES.pending

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    }

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return 'Şimdi'
        if (diffMins < 60) return `${diffMins} dk`
        const diffHours = Math.floor(diffMins / 60)
        return `${diffHours}s ${diffMins % 60}dk`
    }

    const updateStatus = async (newStatus: OrderStatus) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', order.id)

            if (error) throw error

            toast.success(`Sipariş: ${ORDER_STATUS_CONFIG[newStatus].label}`)
            onStatusChange()
        } catch (error) {
            console.error('Error updating order:', error)
            toast.error('Güncelleme başarısız')
        } finally {
            setLoading(false)
        }
    }

    const getButtonIcon = () => {
        switch (status) {
            case 'pending': return <ChefHat className="mr-2 h-4 w-4" />
            case 'preparing': return <Truck className="mr-2 h-4 w-4" />
            case 'served': return <CreditCard className="mr-2 h-4 w-4" />
            default: return null
        }
    }

    const getButtonClass = () => {
        switch (status) {
            case 'pending': return 'bg-indigo-600 hover:bg-indigo-700 text-white'
            case 'preparing': return 'bg-blue-600 hover:bg-blue-700 text-white'
            case 'served': return 'bg-emerald-600 hover:bg-emerald-700 text-white'
            default: return ''
        }
    }

    return (
        <Card className={cn(
            "border-l-4 shadow-sm hover:shadow-md transition-all rounded-xl",
            styles.border,
            styles.bg
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Hash className="h-4 w-4 text-slate-600" />
                        </div>
                        <span className="font-bold text-lg text-slate-800">Masa {order.table_number || '?'}</span>
                    </div>
                    <Badge className={cn("rounded-full font-medium", styles.badge)}>
                        {statusConfig.emoji} {statusConfig.label}
                    </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 mt-2">
                    <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(order.created_at)}
                    </div>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400">{getTimeAgo(order.created_at)}</span>
                    {order.customer_name && (
                        <>
                            <span className="text-slate-300">•</span>
                            <div className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {order.customer_name}
                            </div>
                        </>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pb-3">
                <div className="space-y-2">
                    {order.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-slate-700">
                                <span className="font-semibold text-slate-800">{item.quantity}×</span>{' '}
                                {item.menu_item_name}
                            </span>
                            <span className="text-slate-500 font-medium">
                                ₺{item.total_price.toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>
                <Separator className="my-3 bg-slate-100" />
                <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Toplam</span>
                    <span className="font-bold text-lg text-slate-800">₺{order.total_amount.toFixed(2)}</span>
                </div>
            </CardContent>

            <CardFooter className="gap-2 pt-0">
                {nextStatus && nextButtonLabel && (
                    <Button
                        size="sm"
                        className={cn("flex-1 rounded-lg", getButtonClass())}
                        onClick={() => updateStatus(nextStatus)}
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                {getButtonIcon()}
                                {nextButtonLabel}
                            </>
                        )}
                    </Button>
                )}

                {status === 'pending' && (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => updateStatus('cancelled')}
                        disabled={loading}
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                )}

                {status === 'paid' && (
                    <span className="text-sm text-slate-400 w-full text-center py-1">
                        ✓ Tamamlandı
                    </span>
                )}
            </CardFooter>
        </Card>
    )
}
