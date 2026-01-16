'use client'

import { useRef } from 'react'
import { Category } from '@/types/database'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

interface CategoryNavProps {
    categories: Category[]
    activeCategory: string | null
    onCategoryClick: (categoryId: string) => void
}

export function CategoryNav({ categories, activeCategory, onCategoryClick }: CategoryNavProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    if (categories.length === 0) return null

    return (
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 p-4" ref={scrollRef}>
                    {categories.map((category) => (
                        <Button
                            key={category.id}
                            variant={activeCategory === category.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onCategoryClick(category.id)}
                            className="shrink-0"
                        >
                            {category.name}
                        </Button>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    )
}
