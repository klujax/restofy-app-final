'use client'

import { MenuItem } from '@/types/database'
import { useCartStore } from '@/store/cart-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Coffee } from 'lucide-react'
import { toast } from 'sonner'

interface CustomerMenuItemProps {
    item: MenuItem
}

export function CustomerMenuItem({ item }: CustomerMenuItemProps) {
    const addItem = useCartStore((state) => state.addItem)

    const handleAdd = () => {
        if (!item.is_available || item.stock_status === 'out_of_stock') {
            toast.error('This item is currently unavailable')
            return
        }
        addItem(item)
        toast.success(`${item.name} added to cart`)
    }

    const isAvailable = item.is_available && item.stock_status !== 'out_of_stock'

    return (
        <Card className={`overflow-hidden ${!isAvailable ? 'opacity-60' : ''}`}>
            <div className="flex gap-4 p-4">
                {/* Image */}
                <div className="h-24 w-24 rounded-lg bg-muted overflow-hidden shrink-0">
                    {item.image_url ? (
                        <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center">
                            <Coffee className="h-8 w-8 text-muted-foreground" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                            {item.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                                    {item.description}
                                </p>
                            )}
                        </div>
                        {!isAvailable && (
                            <Badge variant="secondary" className="shrink-0">
                                Unavailable
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                        <p className="text-lg font-bold text-primary">
                            ₺{item.price.toFixed(2)}
                        </p>
                        <Button
                            size="sm"
                            onClick={handleAdd}
                            disabled={!isAvailable}
                            className="gap-1"
                        >
                            <Plus className="h-4 w-4" />
                            Add
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    )
}
