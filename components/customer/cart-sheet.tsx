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
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Plus, Minus, Trash2, Loader2 } from 'lucide-react'

interface CartSheetProps {
    cafeId: string
}

export function CartSheet({ cafeId }: CartSheetProps) {
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
            toast.error('Please enter your table number')
            return
        }

        setLoading(true)

        try {
            // Create the order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    profile_id: cafeId,
                    customer_name: customerName.trim() || null,
                    table_number: tableNumber.trim(),
                    total_amount: totalPrice,
                    status: 'received',
                })
                .select()
                .single()

            if (orderError) throw orderError

            // Create order items
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

            if (itemsError) throw itemsError

            toast.success('Order placed successfully! 🎉')
            clearCart()
            setTableNumber('')
            setCustomerName('')
            setOpen(false)
        } catch (error) {
            console.error('Error placing order:', error)
            toast.error('Failed to place order. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (totalItems === 0) {
        return null
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    size="lg"
                    className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg gap-2 px-6"
                >
                    <ShoppingCart className="h-5 w-5" />
                    View Basket ({totalItems})
                    <span className="font-bold">₺{totalPrice.toFixed(2)}</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg flex flex-col">
                <SheetHeader>
                    <SheetTitle>Your Order</SheetTitle>
                    <SheetDescription>
                        Review your items and place your order
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-4 py-4">
                        {items.map((item: CartItem) => (
                            <div key={item.menuItem.id} className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden shrink-0">
                                    {item.menuItem.image_url ? (
                                        <img
                                            src={item.menuItem.image_url}
                                            alt={item.menuItem.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                                            No image
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm line-clamp-1">{item.menuItem.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        ₺{item.menuItem.price.toFixed(2)} each
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => removeItem(item.menuItem.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="tableNumber">Table Number *</Label>
                            <Input
                                id="tableNumber"
                                placeholder="e.g., 5"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="customerName">Your Name (optional)</Label>
                            <Input
                                id="customerName"
                                placeholder="e.g., John"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>₺{totalPrice.toFixed(2)}</span>
                    </div>

                    <SheetFooter>
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handlePlaceOrder}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Placing Order...
                                </>
                            ) : (
                                'Place Order'
                            )}
                        </Button>
                    </SheetFooter>
                </div>
            </SheetContent>
        </Sheet>
    )
}
