'use client'

import { MenuItem } from '@/types/database'
import Image from 'next/image'
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
            "bg-white rounded-3xl p-5 shadow-sm border border-slate-100/50 transition-all hover:shadow-premium group animate-in-up",
            !isAvailable && "opacity-50 grayscale"
        )}>
            <div className="flex gap-5">
                {/* Image */}
                <div className="relative h-28 w-28 rounded-2xl bg-slate-50 overflow-hidden shrink-0 shadow-inner border border-slate-100">
                    {item.image_url ? (
                        <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-slate-50">
                            <Coffee className="h-10 w-10 text-slate-200 transition-transform duration-500 group-hover:scale-110" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-lg text-slate-800 line-clamp-1 group-hover:text-black transition-colors">{item.name}</h3>
                            {!isAvailable && (
                                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 px-2.5 py-1 rounded-full border border-red-100">
                                    Tükendi
                                </span>
                            )}
                        </div>
                        {item.description && (
                            <p className="text-sm text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                                {item.description}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400 font-medium uppercase tracking-tighter">Fiyat</span>
                            <p className="text-xl font-black tracking-tight" style={{ color: themeColor }}>
                                ₺{item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <Button
                            size="icon"
                            onClick={handleAdd}
                            disabled={!isAvailable}
                            className="h-12 w-12 rounded-2xl font-bold shadow-lg shadow-black/5 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                            style={isAvailable ? {
                                backgroundColor: themeColor,
                                color: 'white'
                            } : {
                                backgroundColor: '#f1f5f9',
                                color: '#cbd5e1'
                            }}
                        >
                            <Plus className="h-6 w-6 stroke-[3]" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
