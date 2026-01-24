'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/types/database'
import {
    CheckCircle2,
    Clock,
    ChefHat,
    Bell,
    PartyPopper,
    CreditCard,
    Banknote,
    ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OrderTrackerProps {
    orderId: string
    tableNumber: string
    totalAmount: number
    paymentMethod: 'cash' | 'online'
    themeColor: string
    onNewOrder: () => void
}

const STATUS_STEPS = [
    { key: 'pending', label: 'Sipariş Alındı', icon: Clock, description: 'Siparişiniz işletmeye iletildi' },
    { key: 'received', label: 'Onaylandı', icon: CheckCircle2, description: 'Siparişiniz onaylandı' },
    { key: 'preparing', label: 'Hazırlanıyor', icon: ChefHat, description: 'Siparişiniz hazırlanıyor' },
    { key: 'ready', label: 'Hazır', icon: Bell, description: 'Siparişiniz hazır!' },
    { key: 'served', label: 'Servis Edildi', icon: CheckCircle2, description: 'Siparişiniz teslim edildi' },
    { key: 'paid', label: 'Tamamlandı', icon: PartyPopper, description: 'Afiyet olsun!' },
]

export function OrderTracker({
    orderId,
    tableNumber,
    totalAmount,
    paymentMethod,
    themeColor,
    onNewOrder
}: OrderTrackerProps) {
    const [currentStatus, setCurrentStatus] = useState<string>('pending')
    const supabase = createClient()

    // Subscribe to order status changes
    useEffect(() => {
        console.log('[OrderTracker] Setting up subscription for order:', orderId)

        const channel = supabase
            .channel(`order-${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`,
                },
                (payload) => {
                    console.log('[OrderTracker] Received update:', payload.new)
                    const newOrder = payload.new as Order
                    setCurrentStatus(newOrder.status)
                }
            )
            .subscribe((status, err) => {
                console.log('[OrderTracker] Subscription status:', status)
                if (err) console.error('[OrderTracker] Error:', err)
            })

        // Fetch initial status
        const fetchOrder = async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('status')
                .eq('id', orderId)
                .single()

            if (data) {
                console.log('[OrderTracker] Initial status:', data.status)
                setCurrentStatus(data.status)
            }
            if (error) {
                console.error('[OrderTracker] Fetch error:', error)
            }
        }
        fetchOrder()

        return () => {
            console.log('[OrderTracker] Removing channel')
            supabase.removeChannel(channel)
        }
    }, [orderId, supabase])

    const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === currentStatus)
    // If status not found in steps, default to first step
    const validStepIndex = currentStepIndex >= 0 ? currentStepIndex : 0
    const currentStepInfo = STATUS_STEPS[validStepIndex]
    const CurrentIcon = currentStepInfo.icon

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <div className="p-6 text-center border-b border-slate-100">
                <div
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 animate-pulse"
                    style={{ backgroundColor: `${themeColor}20` }}
                >
                    <CurrentIcon className="h-10 w-10" style={{ color: themeColor }} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{currentStepInfo.label}</h2>
                <p className="text-slate-500 mt-1">{currentStepInfo.description}</p>
            </div>

            {/* Order Info Card */}
            <div className="p-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-semibold">Sipariş No</p>
                            <p className="text-lg font-bold text-slate-800">#{orderId.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-semibold">Masa</p>
                            <p className="text-lg font-bold text-slate-800">{tableNumber}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                            {paymentMethod === 'cash' ? (
                                <>
                                    <Banknote className="h-5 w-5 text-emerald-500" />
                                    <span className="text-sm text-slate-600">Çıkışta Öde</span>
                                </>
                            ) : (
                                <>
                                    <CreditCard className="h-5 w-5 text-blue-500" />
                                    <span className="text-sm text-slate-600">Online Ödeme</span>
                                </>
                            )}
                        </div>
                        <p className="text-xl font-bold" style={{ color: themeColor }}>
                            ₺{totalAmount.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex-1 px-6 pb-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase mb-4">Sipariş Durumu</h3>
                    <div className="space-y-4">
                        {STATUS_STEPS.slice(0, -1).map((step, index) => {
                            const isCompleted = index < currentStepIndex
                            const isCurrent = index === currentStepIndex
                            const StepIcon = step.icon

                            return (
                                <div key={step.key} className="flex items-center gap-4">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${isCompleted
                                            ? 'bg-emerald-500 text-white'
                                            : isCurrent
                                                ? 'ring-4 ring-offset-2 text-white'
                                                : 'bg-slate-100 text-slate-400'
                                            }`}
                                        style={isCurrent ? { backgroundColor: themeColor } : {}}
                                    >
                                        <StepIcon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-medium ${isCompleted || isCurrent ? 'text-slate-800' : 'text-slate-400'}`}>
                                            {step.label}
                                        </p>
                                    </div>
                                    {isCompleted && (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-white">
                <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl text-slate-600"
                    onClick={onNewOrder}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Yeni Sipariş Ver
                </Button>
            </div>
        </div>
    )
}
