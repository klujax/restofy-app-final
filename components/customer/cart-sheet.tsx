'use client'

import { useState } from 'react'
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
import { ShoppingBag, Plus, Minus, Trash2, Loader2, Coffee } from 'lucide-react'

interface CartSheetProps {
    cafeId: string
    themeColor?: string
}

export function CartSheet({ cafeId, themeColor = '#f97316' }: CartSheetProps) {
    const [open, setOpen] = useState(false)
    const [tableNumber, setTableNumber] = useState('')
    const [customerName, setCustomerName] = useState('')
    const [loading, setLoading] = useState(false)

    const { items, updateQuantity, removeItem, clearCart, getTotalItems, getTotalPrice } = useCartStore()
    const supabase = createClient()

    const totalItems = getTotalItems()
    const totalPrice = getTotalPrice()

    const handlePlaceOrder = async () => {
        if (!tableNumber.trim()) {
            toast.error('Lütfen masa numaranızı girin')
            return
        }

        setLoading(true)

        try {
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    profile_id: cafeId,
                    customer_name: customerName.trim() || null,
                    table_number: tableNumber.trim(),
                    total_amount: totalPrice,
                    status: 'pending',
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
            clearCart()
            setTableNumber('')
            setCustomerName('')
            setOpen(false)
        } catch (error: unknown) {
            console.error('Error placing order:', error)
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
            toast.error(`Sipariş gönderilemedi: ${errorMessage}`)
        } finally {
            setLoading(false)
        }
    }

    if (totalItems === 0) {
        return null
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {/* Floating Cart Button - uses theme color */}
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
                                    <div className="h-16 w-16 rounded-xl bg-white overflow-hidden shrink-0 shadow-sm">
                                        {item.menuItem.image_url ? (
                                            <img
                                                src={item.menuItem.image_url}
                                                alt={item.menuItem.name}
                                                className="h-full w-full object-cover"
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

                        {/* Total */}
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-slate-600">Toplam</span>
                            <span className="text-2xl font-bold text-slate-800">₺{totalPrice.toFixed(2)}</span>
                        </div>

                        {/* Submit Button - uses theme color */}
                        <Button
                            className="w-full h-14 rounded-2xl text-lg font-semibold"
                            style={{ backgroundColor: themeColor }}
                            onClick={handlePlaceOrder}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Sipariş Gönderiliyor...
                                </>
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
