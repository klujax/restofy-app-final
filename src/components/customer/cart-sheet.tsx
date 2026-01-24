'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useCartStore, CartItem } from '@/store/cart-store'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShoppingBag, Plus, Minus, Trash2, Loader2, Coffee, Banknote, CreditCard, Clock } from 'lucide-react'
import { OrderTracker } from './order-tracker'
import { WorkingHours } from '@/types/database'

interface CartSheetProps {
    cafeId: string
    themeColor?: string
    workingHours?: WorkingHours | null
}

type PaymentMethod = 'cash' | 'online'

interface PlacedOrder {
    id: string
    tableNumber: string
    totalAmount: number
    paymentMethod: PaymentMethod
}

export function CartSheet({ cafeId, themeColor = '#f97316', workingHours }: CartSheetProps) {
    const [open, setOpen] = useState(false)
    const [tableNumber, setTableNumber] = useState('')
    const [customerName, setCustomerName] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
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

    const handlePlaceOrder = async () => {
        if (isClosed) {
            toast.error('Restoran şu an kapalı. Lütfen çalışma saatleri içinde sipariş verin.')
            return
        }

        if (!tableNumber.trim()) {
            toast.error('Lütfen masa numaranızı girin')
            return
        }

        setLoading(true)

        try {
            // First, get the restaurant to find the owner's profile_id
            const { data: restaurant, error: restaurantError } = await supabase
                .from('restaurants')
                .select('owner_id')
                .eq('id', cafeId)
                .single()

            if (restaurantError || !restaurant) {
                console.error('Restaurant fetch error:', restaurantError)
                throw new Error('Restoran bilgileri alınamadı')
            }

            // Build notes with payment method info
            const orderNotes = paymentMethod === 'online' ? '[ONLINE ÖDEME]' : '[ÇIKIŞTA ÖDEME]'

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    restaurant_id: cafeId,
                    profile_id: restaurant.owner_id,
                    customer_name: customerName.trim() || null,
                    table_number: tableNumber.trim(),
                    total_amount: totalPrice,
                    status: 'received',
                    notes: orderNotes,
                })
                .select()
                .single()

            if (orderError) {
                console.error('Order insert error:', orderError)
                throw orderError
            }

            const orderItems = items.map((item: CartItem) => ({
                order_id: order.id,
                menu_item_id: item.menuItem.id,
                menu_item_name: item.menuItem.name,
                quantity: item.quantity,
                unit_price: item.menuItem.price,
                total_price: item.menuItem.price * item.quantity,
            }))

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems)

            if (itemsError) {
                console.error('Order items insert error:', itemsError)
                throw itemsError
            }

            toast.success('Siparişiniz alındı! 🎉')

            // Store placed order info and show tracker
            setPlacedOrder({
                id: order.id,
                tableNumber: tableNumber.trim(),
                totalAmount: totalPrice,
                paymentMethod: paymentMethod,
            })

            clearCart()
            setTableNumber('')
            setCustomerName('')
        } catch (error: unknown) {
            console.error('Error placing order:', error)
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
            toast.error(`Sipariş gönderilemedi: ${errorMessage}`)
        } finally {
            setLoading(false)
        }
    }

    const handleNewOrder = () => {
        setPlacedOrder(null)
        setOpen(false)
    }

    // If order placed, show tracker instead of cart
    if (placedOrder) {
        return (
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <button
                        className="fixed bottom-0 left-0 right-0 z-50 mx-4 mb-6 flex items-center justify-center gap-2 text-white rounded-2xl px-6 py-4 shadow-2xl active:scale-[0.98] transition-transform"
                        style={{ backgroundColor: themeColor }}
                    >
                        <Clock className="h-5 w-5" />
                        <span className="font-semibold">Siparişimi Takip Et</span>
                    </button>
                </SheetTrigger>

                <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
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
        )
    }

    if (totalItems === 0) {
        return null
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {/* Floating Cart Button */}
            <SheetTrigger asChild>
                <button
                    className="fixed bottom-0 left-0 right-0 z-50 mx-4 mb-6 flex items-center justify-between text-white rounded-2xl px-6 py-4 shadow-2xl active:scale-[0.98] transition-transform"
                    style={{ backgroundColor: themeColor }}
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <ShoppingBag className="h-6 w-6" />
                            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-white text-xs font-bold flex items-center justify-center" style={{ color: themeColor }}>
                                {totalItems}
                            </span>
                        </div>
                        <span className="font-semibold">Sepeti Görüntüle</span>
                    </div>
                    <span className="text-lg font-bold">₺{totalPrice.toFixed(2)}</span>
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
                        {/* Inputs */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="tableNumber" className="text-slate-600 text-sm">
                                    Masa No *
                                </Label>
                                <Input
                                    id="tableNumber"
                                    placeholder="Örn: 5"
                                    value={tableNumber}
                                    onChange={(e) => setTableNumber(e.target.value)}
                                    className="mt-1 rounded-xl border-slate-200"
                                />
                            </div>
                            <div>
                                <Label htmlFor="customerName" className="text-slate-600 text-sm">
                                    İsminiz (opsiyonel)
                                </Label>
                                <Input
                                    id="customerName"
                                    placeholder="Örn: Ahmet"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="mt-1 rounded-xl border-slate-200"
                                />
                            </div>
                        </div>

                        {/* Payment Method Selection */}
                        <div>
                            <Label className="text-slate-600 text-sm mb-2 block">Ödeme Yöntemi</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'cash'
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                        }`}
                                >
                                    <Banknote className="h-5 w-5" />
                                    <span className="font-medium">Çıkışta Öde</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('online')}
                                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'online'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                        }`}
                                >
                                    <CreditCard className="h-5 w-5" />
                                    <span className="font-medium">Online Öde</span>
                                </button>
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
                            onClick={handlePlaceOrder}
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
    )
}
