'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Profile, Category, MenuItem } from '@/types/database'
import { CategoryNav } from '@/components/customer/category-nav'
import { CustomerMenuItem } from '@/components/customer/menu-item'
import { CartSheet } from '@/components/customer/cart-sheet'
import { CallWaiterButton } from '@/components/customer/call-waiter-button'
import { Coffee } from 'lucide-react'

interface CustomerMenuClientProps {
    profile: Profile
    categories: Category[]
    menuItems: MenuItem[]
}

export function CustomerMenuClient({ profile, categories, menuItems }: CustomerMenuClientProps) {
    const searchParams = useSearchParams()
    const tableFromUrl = searchParams.get('table') || ''

    const [activeCategory, setActiveCategory] = useState<string | null>(
        categories[0]?.id || null
    )
    const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map())

    const scrollToCategory = (categoryId: string) => {
        setActiveCategory(categoryId)
        const element = categoryRefs.current.get(categoryId)
        if (element) {
            const yOffset = -120
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
            window.scrollTo({ top: y, behavior: 'smooth' })
        }
    }

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 150

            for (const category of categories) {
                const element = categoryRefs.current.get(category.id)
                if (element) {
                    const { offsetTop, offsetHeight } = element
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveCategory(category.id)
                        break
                    }
                }
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [categories])

    const getItemsByCategory = (categoryId: string) => {
        return menuItems.filter((item) => item.category_id === categoryId)
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="relative">
                <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    {profile.logo_url ? (
                        <img
                            src={profile.logo_url}
                            alt={profile.business_name}
                            className="h-20 w-20 rounded-full object-cover border-4 border-background shadow-lg"
                        />
                    ) : (
                        <div className="h-20 w-20 rounded-full bg-primary/10 border-4 border-background shadow-lg flex items-center justify-center">
                            <Coffee className="h-10 w-10 text-primary" />
                        </div>
                    )}
                </div>
                <div className="text-center -mt-2 pb-4">
                    <h1 className="text-2xl font-bold">{profile.business_name}</h1>
                    {profile.description && (
                        <p className="text-sm text-muted-foreground mt-1 px-4">
                            {profile.description}
                        </p>
                    )}
                    {/* Call Waiter Button */}
                    <div className="mt-3">
                        <CallWaiterButton cafeId={profile.id} initialTableNumber={tableFromUrl} />
                    </div>
                </div>
            </header>

            {/* Category Navigation */}
            <CategoryNav
                categories={categories}
                activeCategory={activeCategory}
                onCategoryClick={scrollToCategory}
            />

            {/* Menu Content */}
            <main className="p-4 pb-24 space-y-8">
                {categories.length === 0 ? (
                    <div className="text-center py-12">
                        <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Menu coming soon!</p>
                    </div>
                ) : (
                    categories.map((category) => (
                        <section
                            key={category.id}
                            ref={(el) => {
                                if (el) categoryRefs.current.set(category.id, el)
                            }}
                        >
                            <h2 className="text-xl font-bold mb-4">{category.name}</h2>
                            {category.description && (
                                <p className="text-sm text-muted-foreground mb-4">
                                    {category.description}
                                </p>
                            )}
                            <div className="space-y-3">
                                {getItemsByCategory(category.id).length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-4 text-center">
                                        No items in this category yet.
                                    </p>
                                ) : (
                                    getItemsByCategory(category.id).map((item) => (
                                        <CustomerMenuItem key={item.id} item={item} />
                                    ))
                                )}
                            </div>
                        </section>
                    ))
                )}
            </main>

            {/* Cart Button */}
            <CartSheet cafeId={profile.id} />
        </div>
    )
}
