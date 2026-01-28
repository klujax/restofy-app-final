'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/types/database'
import {
    CheckCircle2,
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
    onOrderCompleted: () => void
}

const STATUS_STEPS = [
    { key: 'received', label: 'Onaylandı', icon: CheckCircle2, description: 'Siparişiniz onaylandı ve mutfakta' },
    { key: 'preparing', label: 'Hazırlanıyor', icon: ChefHat, description: 'Siparişiniz taze taze hazırlanıyor' },
    { key: 'ready', label: 'Hazır', icon: Bell, description: 'Siparişiniz hazır, afiyet olsun!' },
    { key: 'served', label: 'Tamamlandı', icon: PartyPopper, description: 'Siparişiniz tamamlandı. Afiyet olsun!' },
]

export function OrderTracker({
    orderId,
    tableNumber,
    totalAmount,
    paymentMethod,
    themeColor,
    onNewOrder,
    onOrderCompleted
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

    let currentStepIndex = STATUS_STEPS.findIndex(s => s.key === currentStatus)

    // Handle 'paid' status as completed (served)
    if (currentStatus === 'paid') {
        currentStepIndex = STATUS_STEPS.findIndex(s => s.key === 'served')
    }

    // If status not found (e.g. pending), default to -1 which serves as "waiting for confirmation" or show first step
    // If pending, we might want to show first step as "waiting"
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
                <div className="bg-white rounded-3xl border border-slate-100/50 p-6 shadow-premium transition-all">
                    <div className="flex items-center justify-between mb-6">
                        <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Sipariş No</p>
                            <p className="text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg tabular-nums">#{orderId.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Masa</p>
                            <p className="text-xl font-black text-slate-800">{tableNumber}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${paymentMethod === 'cash' ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                                {paymentMethod === 'cash' ? (
                                    <Banknote className="h-5 w-5 text-emerald-500" />
                                ) : (
                                    <CreditCard className="h-5 w-5 text-blue-500" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-tight">Ödeme</span>
                                <span className="text-sm font-bold text-slate-700 leading-tight">
                                    {paymentMethod === 'cash' ? 'Kasada Öde' : 'Online Ödeme'}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-tight">Toplam</span>
                            <p className="text-2xl font-black tracking-tighter" style={{ color: themeColor }}>
                                ₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex-1 px-6 pb-6">
                <div className="bg-white rounded-3xl border border-slate-100/50 p-6 shadow-sm">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-1">Sipariş Durumu</h3>
                    <div className="space-y-6 relative">
                        {/* Vertical line connector */}
                        <div className="absolute left-[19px] top-2 bottom-6 w-0.5 bg-slate-100 -z-0" />

                        {STATUS_STEPS.slice(0, -1).map((step, index) => {
                            const isCompleted = index < currentStepIndex
                            const isCurrent = index === currentStepIndex
                            const StepIcon = step.icon

                            return (
                                <div key={step.key} className="flex items-center gap-5 relative z-10 group">
                                    <div
                                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-700 shadow-sm ${isCompleted
                                            ? 'bg-emerald-500 text-white'
                                            : isCurrent
                                                ? 'scale-110 shadow-lg ring-4 ring-offset-2 text-white'
                                                : 'bg-slate-50 text-slate-300'
                                            }`}
                                        style={isCurrent ? { backgroundColor: themeColor } : {}}
                                    >
                                        <StepIcon className={isCurrent ? "h-6 w-6 animate-pulse" : "h-5 w-5"} />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-bold tracking-tight transition-colors ${isCompleted || isCurrent ? 'text-slate-800' : 'text-slate-300'}`}>
                                            {step.label}
                                        </p>
                                        {isCurrent && (
                                            <p className="text-xs text-slate-500 mt-0.5 animate-in-fade line-clamp-1">{step.description}</p>
                                        )}
                                    </div>
                                    {isCompleted && (
                                        <div className="bg-emerald-50 p-1 rounded-full">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-white">
                {currentStepInfo.key === 'served' ? (
                    <Button
                        className="w-full h-14 rounded-[2rem] text-lg font-bold shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 animate-in-up"
                        style={{ backgroundColor: '#10b981', color: 'white' }}
                        onClick={onOrderCompleted}
                    >
                        <CheckCircle2 className="h-6 w-6 mr-2 stroke-[3]" />
                        Siparişi Teslim Aldım
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        className="w-full h-12 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        onClick={onNewOrder}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Geri Dön / Yeni Sipariş
                    </Button>
                )}
            </div>
        </div>
    )
}
