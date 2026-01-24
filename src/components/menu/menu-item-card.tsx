'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { MenuItem } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Coffee, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItemCardProps {
    item: MenuItem
    onStatusChange?: () => void
}

export function MenuItemCard({ item, onStatusChange }: MenuItemCardProps) {
    const [isAvailable, setIsAvailable] = useState(item.is_available !== false)
    const [updating, setUpdating] = useState(false)
    const supabase = createClient()

    const toggleAvailability = async () => {
        setUpdating(true)
        const newStatus = !isAvailable

        try {
            const { error } = await supabase
                .from('menu_items')
                .update({
                    is_available: newStatus,
                    stock_status: newStatus ? 'in_stock' : 'out_of_stock'
                })
                .eq('id', item.id)

            if (error) throw error

            setIsAvailable(newStatus)
            toast.success(newStatus ? 'Ürün stokta!' : 'Ürün stok dışı')
            onStatusChange?.()
        } catch (error) {
            console.error('Error updating availability:', error)
            toast.error('Güncelleme başarısız')
        } finally {
            setUpdating(false)
        }
    }

    return (
        <Card className={cn(
            "overflow-hidden bg-white border-slate-200 shadow-sm hover:shadow-md transition-all rounded-xl",
            !isAvailable && "opacity-60 grayscale"
        )}>
            <div className="relative h-36 bg-slate-100">
                {item.image_url ? (
                    <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Coffee className="h-10 w-10 text-slate-300" />
                    </div>
                )}

                {/* Stock Toggle Button */}
                <Button
                    size="icon"
                    className={cn(
                        "absolute top-2 right-2 h-8 w-8 rounded-full shadow-md transition-all",
                        isAvailable
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                            : "bg-red-500 hover:bg-red-600 text-white"
                    )}
                    onClick={toggleAvailability}
                    disabled={updating}
                >
                    {updating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isAvailable ? (
                        <Check className="h-4 w-4" />
                    ) : (
                        <X className="h-4 w-4" />
                    )}
                </Button>
            </div>

            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-slate-800 line-clamp-1">{item.name}</h4>
                    <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium shrink-0",
                        isAvailable
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                    )}>
                        {isAvailable ? 'Stokta' : 'Tükendi'}
                    </span>
                </div>
                {item.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                        {item.description}
                    </p>
                )}
                <p className="text-xl font-bold text-indigo-600">
                    ₺{item.price.toFixed(2)}
                </p>
            </CardContent>
        </Card>
    )
}
