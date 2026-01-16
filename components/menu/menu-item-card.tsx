'use client'

import { MenuItem } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Coffee } from 'lucide-react'

interface MenuItemCardProps {
    item: MenuItem
}

export function MenuItemCard({ item }: MenuItemCardProps) {
    const stockBadge = {
        in_stock: { label: 'In Stock', variant: 'default' as const },
        out_of_stock: { label: 'Out of Stock', variant: 'destructive' as const },
        low_stock: { label: 'Low Stock', variant: 'secondary' as const },
    }

    const status = stockBadge[item.stock_status] || stockBadge.in_stock

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-32 bg-muted">
                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Coffee className="h-10 w-10 text-muted-foreground" />
                    </div>
                )}
            </div>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                    <Badge variant={status.variant} className="shrink-0 text-xs">
                        {status.label}
                    </Badge>
                </div>
                {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {item.description}
                    </p>
                )}
                <p className="text-lg font-bold text-primary">
                    ₺{item.price.toFixed(2)}
                </p>
            </CardContent>
        </Card>
    )
}
