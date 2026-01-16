'use client'

import { OrderWithItems, OrderStatus, ORDER_STATUS_CONFIG } from '@/types/orders'
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
    CheckCircle2,
    XCircle,
    Loader2
} from 'lucide-react'
import { useState } from 'react'

interface OrderCardProps {
    order: OrderWithItems
    onStatusChange: () => void
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
    const [loading, setLoading] = useState<string | null>(null)
    const supabase = createClient()
    const statusConfig = ORDER_STATUS_CONFIG[order.status as OrderStatus]

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    }

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        const diffHours = Math.floor(diffMins / 60)
        return `${diffHours}h ${diffMins % 60}m ago`
    }

    const updateStatus = async (newStatus: OrderStatus) => {
        setLoading(newStatus)
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', order.id)

            if (error) throw error

            toast.success(`Order moved to ${ORDER_STATUS_CONFIG[newStatus].label}`)
            onStatusChange()
        } catch (error) {
            console.error('Error updating order:', error)
            toast.error('Failed to update order status')
        } finally {
            setLoading(null)
        }
    }

    return (
        <Card className={`border-l-4 ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold text-lg">Table {order.table_number || '?'}</span>
                    </div>
                    <Badge variant="outline" className={statusConfig.color}>
                        {statusConfig.label}
                    </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(order.created_at)}
                    </div>
                    <span>•</span>
                    <span>{getTimeAgo(order.created_at)}</span>
                    {order.customer_name && (
                        <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {order.customer_name}
                            </div>
                        </>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pb-3">
                <Separator className="mb-3" />
                <div className="space-y-1.5">
                    {order.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <span>
                                <span className="font-medium">{item.quantity}x</span>{' '}
                                {item.menu_item_name}
                            </span>
                            <span className="text-muted-foreground">
                                ₺{item.total_price.toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>₺{order.total_amount.toFixed(2)}</span>
                </div>
            </CardContent>

            <CardFooter className="gap-2 pt-0">
                {order.status === 'received' && (
                    <>
                        <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => updateStatus('preparing')}
                            disabled={loading !== null}
                        >
                            {loading === 'preparing' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <ChefHat className="mr-1 h-4 w-4" />
                                    Accept
                                </>
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatus('rejected')}
                            disabled={loading !== null}
                        >
                            {loading === 'rejected' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <XCircle className="h-4 w-4" />
                            )}
                        </Button>
                    </>
                )}

                {order.status === 'preparing' && (
                    <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => updateStatus('ready')}
                        disabled={loading !== null}
                    >
                        {loading === 'ready' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                Mark Ready
                            </>
                        )}
                    </Button>
                )}

                {order.status === 'ready' && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => updateStatus('completed')}
                        disabled={loading !== null}
                    >
                        {loading === 'completed' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                Complete
                            </>
                        )}
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
