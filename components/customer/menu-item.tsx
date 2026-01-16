'use client'

import { MenuItem } from '@/types/database'
import { useCartStore } from '@/store/cart-store'
import { Button } from '@/components/ui/button'
import { Plus, Coffee } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CustomerMenuItemProps {
    item: MenuItem
    themeColor?: string
}

export function CustomerMenuItem({ item, themeColor = '#f97316' }: CustomerMenuItemProps) {
    const addItem = useCartStore((state) => state.addItem)

    const handleAdd = () => {
        if (!item.is_available || item.stock_status === 'out_of_stock') {
            toast.error('Bu ürün şu anda mevcut değil')
            return
        }
        addItem(item)
        toast.success(`${item.name} sepete eklendi`)
    }

    const isAvailable = item.is_available && item.stock_status !== 'out_of_stock'

    return (
        <div className={cn(
            "bg-white rounded-2xl p-4 shadow-sm transition-all",
            !isAvailable && "opacity-50 grayscale"
        )}>
            <div className="flex gap-4">
                {/* Image */}
                <div className="h-20 w-20 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                    {item.image_url ? (
                        <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center">
                            <Coffee className="h-8 w-8 text-slate-300" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-slate-800 line-clamp-1">{item.name}</h3>
                            {!isAvailable && (
                                <span className="shrink-0 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                    Tükendi
                                </span>
                            )}
                        </div>
                        {item.description && (
                            <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">
                                {item.description}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <p className="text-lg font-bold" style={{ color: themeColor }}>
                            ₺{item.price.toFixed(2)}
                        </p>
                        <Button
                            size="sm"
                            onClick={handleAdd}
                            disabled={!isAvailable}
                            className="min-h-[44px] min-w-[44px] rounded-xl font-semibold"
                            style={isAvailable ? {
                                backgroundColor: themeColor,
                                color: 'white'
                            } : {
                                backgroundColor: '#e2e8f0',
                                color: '#94a3b8'
                            }}
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
