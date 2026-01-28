'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useCartStore, CartItem } from '@/store/cart-store'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2, ShoppingBag, Plus, Minus, CreditCard, Clock, Coffee, Loader2, PartyPopper } from 'lucide-react'
import { OrderTracker } from './order-tracker'
import { WorkingHours, Customer } from '@/types/database'

interface CartSheetProps {
    cafeId: string
    themeColor: string
    workingHours?: WorkingHours | null
    initialTableNumber?: string
    initialUser?: Customer | null
}

type PaymentMethod = 'cash' | 'online'

interface PlacedOrder {
    id: string
    tableNumber: string
    totalAmount: number
    paymentMethod: PaymentMethod
}


export function CartSheet({ cafeId, themeColor = '#f97316', workingHours, initialTableNumber = '', initialUser }: CartSheetProps) {
    const [cartOpen, setCartOpen] = useState(false)
    const [trackerOpen, setTrackerOpen] = useState(false)
    const [saveCard, setSaveCard] = useState(false)

    // Table number comes from URL but can be edited
    const [tableNumber, setTableNumber] = useState(initialTableNumber)
    const [loading, setLoading] = useState(false)
    const [placedOrders, setPlacedOrders] = useState<PlacedOrder[]>([])

    const { items, updateQuantity, removeItem, clearCart, getTotalItems, getTotalPrice } = useCartStore()
    const supabase = createClient()

    const totalItems = getTotalItems()
    const totalPrice = getTotalPrice()

    // Check if restaurant is currently open
    const isRestaurantOpen = () => {
        if (!workingHours) return true // Default to open if not set

        const now = new Date()
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
        const todayName = dayNames[now.getDay()]
        const todaySchedule = workingHours[todayName]

        if (!todaySchedule || todaySchedule.closed) return false

        const currentTime = now.getHours() * 60 + now.getMinutes()
        const [openHour, openMin] = todaySchedule.open.split(':').map(Number)
        const [closeHour, closeMin] = todaySchedule.close.split(':').map(Number)

        const openMinutes = openHour * 60 + openMin
        const closeMinutes = closeHour * 60 + closeMin

        // Handle overnight hours (e.g., 22:00 - 02:00)
        if (closeMinutes < openMinutes) {
            return currentTime >= openMinutes || currentTime < closeMinutes
        }

        return currentTime >= openMinutes && currentTime < closeMinutes
    }

    const isClosed = !isRestaurantOpen()

    const searchParams = useSearchParams()

    // Check for successful payment return
    useEffect(() => {
        const paymentSuccess = searchParams?.get('payment_success')
        const orderId = searchParams?.get('orderId')

        if (paymentSuccess === 'true' && orderId) {
            // Avoid adding same order twice
            if (placedOrders.some(o => o.id === orderId)) {
                // Already added, just open tracker
                setTrackerOpen(true)
                return
            }

            // Fetch order details simply to show in tracker
            const fetchOrderDetails = async () => {
                const { data } = await supabase
                    .from('orders')
                    .select('total_amount, table_number, status')
                    .eq('id', orderId)
                    .single()

                if (data) {
                    const newOrder: PlacedOrder = {
                        id: orderId,
                        tableNumber: data.table_number,
                        totalAmount: data.total_amount,
                        paymentMethod: 'online',
                    }
                    setPlacedOrders(prev => {
                        const exists = prev.some(o => o.id === orderId)
                        if (exists) return prev
                        return [...prev, newOrder]
                    })
                    setTrackerOpen(true)
                    clearCart()
                    toast.success('Ödemeniz başarıyla alındı! Siparişiniz hazırlanıyor.')
                }
            }
            fetchOrderDetails()
        }
    }, [searchParams, supabase, clearCart, placedOrders])

    // Load persisted orders
    useEffect(() => {
        const saved = localStorage.getItem(`placedOrders-${cafeId}`)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                if (Array.isArray(parsed)) {
                    setPlacedOrders(parsed)
                }
            } catch (e) {
                console.error('Failed to parse saved orders', e)
            }
        }
    }, [cafeId])

    // Persist orders
    useEffect(() => {
        if (placedOrders.length > 0) {
            localStorage.setItem(`placedOrders-${cafeId}`, JSON.stringify(placedOrders))
        } else {
            localStorage.removeItem(`placedOrders-${cafeId}`)
        }
    }, [placedOrders, cafeId])

    const handlePayment = async () => {
        if (isClosed) {
            toast.error('Restoran şu an kapalı. Lütfen çalışma saatleri içinde sipariş verin.')
            return
        }

        if (!tableNumber) {
            toast.error('Masa numarası bulunamadı. Lütfen QR kodu tekrar okutun.')
            return
        }

        setLoading(true)

        try {
            // Call Payment API to Initialize Iyzico
            const response = await fetch('/api/payment/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cafeId,
                    items: items,
                    totalPrice,
                    tableNumber,
                    customerName: initialUser?.full_name || 'Misafir',
                    customerId: initialUser?.id, // Send customer ID if logged in
                    saveCard: saveCard, // Send save card preference
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Ödeme başlatılamadı')
            }

            if (data.paymentPageUrl) {
                // Redirect user to Iyzico Payment Page
                window.location.href = data.paymentPageUrl
            } else {
                throw new Error('Ödeme sayfası oluşturulamadı')
            }

        } catch (error: unknown) {
            console.error('Error starting payment:', error)
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
            toast.error(`Ödeme hatası: ${errorMessage}`)
            setLoading(false)
        }
        // Note: loading will stay true while redirecting
    }

    const [showFeedback, setShowFeedback] = useState(false)

    // ... (rest of the code)

    const handleNewOrder = () => {
        setTrackerOpen(false)
    }

    const handleOrderCompleted = (orderId: string) => {
        // Remove completed order from the list
        const remainingOrders = placedOrders.filter(o => o.id !== orderId)
        setPlacedOrders(remainingOrders)

        // If no more orders, close tracker sheet
        if (remainingOrders.length === 0) {
            setTrackerOpen(false)
        }

        // Show feedback dialog
        setShowFeedback(true)
    }

    return (
        <>
            {/* Feedback Dialog */}
            <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
                <DialogContent className="sm:max-w-md text-center p-8 rounded-3xl border-0 shadow-2xl bg-white">
                    <div className="absolute right-4 top-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
                            onClick={() => setShowFeedback(false)}
                        >
                            <span className="sr-only">Kapat</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </Button>
                    </div>
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center animate-in zoom-in duration-500">
                            <PartyPopper className="h-10 w-10 text-emerald-600" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900">Afiyet Olsun!</h2>
                            <p className="text-slate-500">Bizi tercih ettiğiniz için teşekkür ederiz.</p>
                        </div>
                        <Button
                            className="w-full h-12 rounded-xl mt-4 font-bold text-white shadow-lg active:scale-95 transition-all"
                            style={{ backgroundColor: themeColor }}
                            onClick={() => {
                                toast.success("Geri bildiriminiz için teşekkürler!")
                                setShowFeedback(false)
                            }}
                        >
                            Bizi Puanlayın
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Order Tracker Sheet */}
            {placedOrders.length > 0 && (
                <Sheet open={trackerOpen} onOpenChange={setTrackerOpen}>
                    <SheetTrigger asChild>
                        {/* Top Fixed Order Status Banner */}
                        <div
                            className="fixed top-4 left-4 right-4 z-40 bg-slate-900/90 backdrop-blur-md text-white rounded-2xl p-4 shadow-xl flex items-center justify-between cursor-pointer animate-in-fade border border-white/10"
                            onClick={() => setTrackerOpen(true)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-emerald-400 animate-pulse" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">
                                        {placedOrders.length > 1
                                            ? `${placedOrders.length} Siparişiniz Hazırlanıyor`
                                            : 'Siparişiniz Hazırlanıyor'}
                                    </p>
                                    <p className="text-xs text-slate-400">Detaylar için dokunun</p>
                                </div>
                            </div>
                            <div className="bg-white/10 px-3 py-1 rounded-lg">
                                <span className="text-xs font-bold">
                                    {placedOrders.length > 1 ? 'LİSTE' : `#${placedOrders[0].id.slice(0, 4)}`}
                                </span>
                            </div>
                        </div>
                    </SheetTrigger>

                    <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
                        <SheetHeader className="p-6 pb-2 border-b border-slate-100/10">
                            <SheetTitle className="sr-only">Sipariş Takibi</SheetTitle>
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-lg">Siparişlerim ({placedOrders.length})</h3>
                                <Button variant="ghost" size="sm" onClick={() => setTrackerOpen(false)}>Kapat</Button>
                            </div>
                        </SheetHeader>
                        <ScrollArea className="h-full pb-20">
                            <div className="flex flex-col gap-8 p-6 pb-32">
                                {placedOrders.map((order, index) => (
                                    <div key={order.id} className="space-y-4">
                                        {index > 0 && <div className="h-px bg-slate-200 w-full" />}
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-slate-900">Sipariş #{order.id.slice(0, 4)}</h4>
                                            <span className="text-xs text-slate-500">Masa {order.tableNumber}</span>
                                        </div>
                                        <OrderTracker
                                            orderId={order.id}
                                            tableNumber={order.tableNumber}
                                            totalAmount={order.totalAmount}
                                            paymentMethod={order.paymentMethod}
                                            themeColor={themeColor}
                                            onNewOrder={handleNewOrder}
                                            onOrderCompleted={() => handleOrderCompleted(order.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </SheetContent>
                </Sheet>
            )}

            {/* Cart Sheet */}
            {totalItems > 0 && (
                <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                    {/* Floating Cart Button */}
                    <SheetTrigger asChild>
                        <button
                            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md flex items-center justify-between text-white rounded-[2rem] px-8 py-5 shadow-premium active:scale-95 transition-all duration-300 animate-in-up"
                            style={{
                                backgroundColor: themeColor,
                                boxShadow: `0 20px 40px -10px ${themeColor}66`
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                        <ShoppingBag className="h-6 w-6" />
                                    </div>
                                    <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white text-[10px] font-black flex items-center justify-center shadow-lg transform scale-110" style={{ color: themeColor }}>
                                        {totalItems}
                                    </span>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 leading-none mb-1">Sepetim</span>
                                    <span className="font-bold text-sm">Görüntüle</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 leading-none mb-1">Toplam</span>
                                <span className="text-xl font-black">₺{totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </button>
                    </SheetTrigger>

                    <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <SheetHeader className="p-6 pb-4 border-b border-slate-100">
                                <SheetTitle className="text-xl font-bold text-slate-800">
                                    Sepetim ({totalItems} ürün)
                                </SheetTitle>
                            </SheetHeader>

                            {/* Cart Items */}
                            <ScrollArea className="flex-1">
                                <div className="p-6 space-y-4">
                                    {items.map((item: CartItem) => (
                                        <div key={item.menuItem.id} className="flex items-center gap-4 bg-slate-50 rounded-2xl p-3">
                                            {/* Image */}
                                            <div className="relative h-16 w-16 rounded-xl bg-white overflow-hidden shrink-0 shadow-sm">
                                                {item.menuItem.image_url ? (
                                                    <Image
                                                        src={item.menuItem.image_url}
                                                        alt={item.menuItem.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <Coffee className="h-6 w-6 text-slate-300" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-800 line-clamp-1">{item.menuItem.name}</p>
                                                <p className="text-sm font-medium" style={{ color: themeColor }}>
                                                    ₺{(item.menuItem.price * item.quantity).toFixed(2)}
                                                </p>
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-full bg-white shadow-sm"
                                                    onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <span className="w-8 text-center font-bold text-slate-800">{item.quantity}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-full bg-white shadow-sm"
                                                    onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => removeItem(item.menuItem.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            {/* Footer - Order Form */}
                            <div className="border-t border-slate-100 p-6 space-y-4 bg-white">
                                {/* Customer Name Input */}
                                <div className="space-y-3">
                                    {/* Table Number Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Masa Numarası</label>
                                        <Input
                                            placeholder="Masa No (Örn: 5)"
                                            value={tableNumber}
                                            onChange={(e) => setTableNumber(e.target.value)}
                                            className="h-11 bg-slate-50"
                                        />
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        {initialUser && (
                                            <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <input
                                                    type="checkbox"
                                                    id="save-card"
                                                    checked={saveCard}
                                                    onChange={(e) => setSaveCard(e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <label htmlFor="save-card" className="text-sm text-slate-600 cursor-pointer select-none">
                                                    Kredi kartımı sonraki siparişler için kaydet
                                                </label>
                                            </div>
                                        )}

                                        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm flex gap-2 items-start">
                                            <CreditCard className="h-5 w-5 text-blue-600" />
                                            <span className="text-sm text-blue-700 font-medium">Ödeme: Kredi Kartı</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-slate-600">Toplam</span>
                                    <span className="text-2xl font-bold text-slate-800">₺{totalPrice.toFixed(2)}</span>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    className={`w-full h-14 rounded-2xl text-lg font-semibold ${isClosed ? 'bg-slate-400 cursor-not-allowed' : ''}`}
                                    style={{ backgroundColor: isClosed ? undefined : themeColor }}
                                    onClick={handlePayment}
                                    disabled={loading || isClosed}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Sipariş Gönderiliyor...
                                        </>
                                    ) : isClosed ? (
                                        '🔒 Restoran Kapalı'
                                    ) : (
                                        'Sipariş Ver'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            )}
        </>
    )
}
