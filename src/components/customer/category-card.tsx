'use client'

import Image from 'next/image'
import { Category } from '@/types/database'
import { Coffee, ChevronRight } from 'lucide-react'

interface CategoryCardProps {
    category: Category
    itemCount: number
    themeColor?: string
    onClick: () => void
}

export function CategoryCard({ category, itemCount, themeColor = '#f97316', onClick }: CategoryCardProps) {
    return (
        <button
            onClick={onClick}
            className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all active:scale-[0.98] text-left"
        >
            <div className="flex items-center gap-4 p-4">
                {/* Category Image */}
                <div className="relative h-20 w-20 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                    {category.image_url ? (
                        <Image
                            src={category.image_url}
                            alt={category.name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: `${themeColor}15` }}>
                            <Coffee className="h-8 w-8" style={{ color: themeColor }} />
                        </div>
                    )}
                </div>

                {/* Category Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{category.name}</h3>
                    {category.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 mt-1">{category.description}</p>
                    )}
                    <p className="text-sm font-medium mt-2" style={{ color: themeColor }}>
                        {itemCount} ürün
                    </p>
                </div>

                {/* Arrow */}
                <div className="shrink-0">
                    <div
                        className="h-10 w-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${themeColor}15` }}
                    >
                        <ChevronRight className="h-5 w-5" style={{ color: themeColor }} />
                    </div>
                </div>
            </div>
        </button>
    )
}
