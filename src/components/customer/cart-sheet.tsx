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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2, ShoppingBag, Plus, Minus, CreditCard, Clock, Coffee, Loader2 } from 'lucide-react'
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
    const [customerName, setCustomerName] = useState('')
    const [saveCard, setSaveCard] = useState(false)

    // Table number comes from URL but can be edited
    const [tableNumber, setTableNumber] = useState(initialTableNumber)
    const [loading, setLoading] = useState(false)
    const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null)

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
            // Fetch order details simply to show in tracker
            const fetchOrderDetails = async () => {
                const { data } = await supabase
                    .from('orders')
                    .select('total_amount, table_number, status')
                    .eq('id', orderId)
                    .single()

                if (data) {
                    setPlacedOrder({
                        id: orderId,
                        tableNumber: data.table_number,
                        totalAmount: data.total_amount,
                        paymentMethod: 'online',
                    })
                    setTrackerOpen(true)
                    clearCart()
                    toast.success('Ödemeniz başarıyla alındı! Siparişiniz hazırlanıyor.')
                }
            }
            fetchOrderDetails()
        }
    }, [searchParams, supabase, clearCart])

    // Auto-fill customer name if user is logged in
    useEffect(() => {
        if (initialUser && initialUser.full_name) {
            setCustomerName(initialUser.full_name)
        }
    }, [initialUser])

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
                    customerName: customerName.trim(),
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

    const handleNewOrder = () => {
        setPlacedOrder(null)
        setTrackerOpen(false)
    }

    return (
        <>
            {/* Order Tracker Sheet */}
            {/* Order Tracker Sheet */}
            {placedOrder && (
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
                                    <p className="font-bold text-sm">Siparişiniz Hazırlanıyor</p>
                                    <p className="text-xs text-slate-400">Detaylar için dokunun</p>
                                </div>
                            </div>
                            <div className="bg-white/10 px-3 py-1 rounded-lg">
                                <span className="text-xs font-bold">#{placedOrder.id.slice(0, 4)}</span>
                            </div>
                        </div>
                    </SheetTrigger>

                    <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
                        <SheetTitle className="sr-only">Sipariş Takibi</SheetTitle>
                        <OrderTracker
                            orderId={placedOrder.id}
                            tableNumber={placedOrder.tableNumber}
                            totalAmount={placedOrder.totalAmount}
                            paymentMethod={placedOrder.paymentMethod}
                            themeColor={themeColor}
                            onNewOrder={handleNewOrder}
                        />
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
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">
                                                Adınız Soyadınız {initialUser && '(Kayıtlı)'}
                                            </label>
                                            <Input
                                                placeholder="Sipariş için isminiz"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                className="h-11 bg-slate-50"
                                                disabled={!!initialUser} // Disable if logged in
                                            />
                                        </div>

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
