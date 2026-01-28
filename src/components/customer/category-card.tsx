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
            className="w-full bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-premium hover:border-slate-200 transition-all active:scale-[0.98] text-left group animate-in-up"
        >
            <div className="flex items-center gap-5 p-4">
                {/* Category Image */}
                <div className="relative h-24 w-24 rounded-2xl bg-slate-100 overflow-hidden shrink-0 shadow-inner">
                    {category.image_url ? (
                        <Image
                            src={category.image_url}
                            alt={category.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: `${themeColor}10` }}>
                            <Coffee className="h-10 w-10 transition-transform duration-500 group-hover:rotate-12" style={{ color: themeColor }} />
                        </div>
                    )}
                    {/* Overlay for better text readability if we had text over image, but here it's side-by-side */}
                </div>

                {/* Category Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xl text-slate-800 line-clamp-1 group-hover:text-black transition-colors">{category.name}</h3>
                    {category.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 mt-1 leading-relaxed">{category.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600" style={{ color: themeColor, backgroundColor: `${themeColor}10` }}>
                            {itemCount} Ürün
                        </span>
                    </div>
                </div>

                {/* Arrow */}
                <div className="shrink-0 pr-2">
                    <div
                        className="h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-1"
                        style={{ backgroundColor: `${themeColor}10` }}
                    >
                        <ChevronRight className="h-5 w-5" style={{ color: themeColor }} />
                    </div>
                </div>
            </div>
        </button>
    )
}
