'use client'

import { useRef } from 'react'
import { Category } from '@/types/database'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface CategoryNavProps {
    categories: Category[]
    activeCategory: string | null
    onCategoryClick: (categoryId: string) => void
    themeColor?: string
}

export function CategoryNav({ categories, activeCategory, onCategoryClick, themeColor = '#f97316' }: CategoryNavProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    if (categories.length === 0) return null

    return (
        <div className="sticky top-0 z-40 bg-white shadow-sm">
            <ScrollArea className="w-full">
                <div className="flex gap-2 p-4" ref={scrollRef}>
                    {categories.map((category) => {
                        const isActive = activeCategory === category.id
                        return (
                            <button
                                key={category.id}
                                onClick={() => onCategoryClick(category.id)}
                                className={cn(
                                    "shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                                    "min-h-[44px] active:scale-95"
                                )}
                                style={isActive ? {
                                    backgroundColor: themeColor,
                                    color: 'white'
                                } : {
                                    backgroundColor: '#f1f5f9',
                                    color: '#475569'
                                }}
                            >
                                {category.name}
                            </button>
                        )
                    })}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
        </div>
    )
}
