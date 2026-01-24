'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Restaurant, Category, MenuItem } from '@/types/database'
import { CategoryNav } from '@/components/customer/category-nav'
import { CategoryCard } from '@/components/customer/category-card'
import { CustomerMenuItem } from '@/components/customer/menu-item'
import { CartSheet } from '@/components/customer/cart-sheet'
import { CallWaiterButton } from '@/components/customer/call-waiter-button'
import { Coffee, MapPin, Clock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CustomerMenuClientProps {
    restaurant: Restaurant
    categories: Category[]
    menuItems: MenuItem[]
}

export function CustomerMenuClient({ restaurant, categories, menuItems: initialMenuItems }: CustomerMenuClientProps) {
    const searchParams = useSearchParams()
    const tableFromUrl = searchParams?.get('table') || ''
    const supabase = createClient()

    const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems)
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [activeCategory, setActiveCategory] = useState<string | null>(
        categories[0]?.id || null
    )
    const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map())

    // Check if restaurant is currently open
    const isRestaurantOpen = () => {
        const { working_hours } = restaurant
        if (!working_hours) return true

        const now = new Date()
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
        const todayName = dayNames[now.getDay()]
        const todaySchedule = working_hours[todayName]

        if (!todaySchedule || todaySchedule.closed) return false

        const currentTime = now.getHours() * 60 + now.getMinutes()
        const [openHour, openMin] = todaySchedule.open.split(':').map(Number)
        const [closeHour, closeMin] = todaySchedule.close.split(':').map(Number)

        const openMinutes = openHour * 60 + openMin
        const closeMinutes = closeHour * 60 + closeMin

        // Handle overnight hours (e.g., 22:00 - 02:00)
        if (closeMinutes < openMinutes) {
            return currentTime >= openMinutes || currentTime < closeMinutes
        }

        return currentTime >= openMinutes && currentTime < closeMinutes
    }

    const isClosed = !isRestaurantOpen()

    // Get today's schedule for display
    const getTodaySchedule = () => {
        const { working_hours } = restaurant
        if (!working_hours) return null
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
        const todayName = dayNames[new Date().getDay()]
        return working_hours[todayName]
    }
    const todaySchedule = getTodaySchedule()

    const scrollToCategory = (categoryId: string) => {
        setActiveCategory(categoryId)
        const element = categoryRefs.current.get(categoryId)
        if (element) {
            const yOffset = -140
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
            window.scrollTo({ top: y, behavior: 'smooth' })
        }
    }

    // Scroll tracking (only when viewing items within a category)
    useEffect(() => {
        if (!selectedCategory) return

        const handleScroll = () => {
            const scrollPosition = window.scrollY + 160

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
    }, [categories, selectedCategory])

    // Realtime subscription for menu item updates
    useEffect(() => {
        const channel = supabase
            .channel(`menu-items-${restaurant.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'menu_items',
                    filter: `restaurant_id=eq.${restaurant.id}`,
                },
                (payload) => {
                    setMenuItems((prev) =>
                        prev.map((item) =>
                            item.id === payload.new.id
                                ? { ...item, ...payload.new }
                                : item
                        )
                    )
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'menu_items',
                    filter: `restaurant_id=eq.${restaurant.id}`,
                },
                (payload) => {
                    setMenuItems((prev) => [...prev, payload.new as MenuItem])
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'menu_items',
                    filter: `restaurant_id=eq.${restaurant.id}`,
                },
                (payload) => {
                    setMenuItems((prev) =>
                        prev.filter((item) => item.id !== payload.old.id)
                    )
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [restaurant.id, supabase])

    const getItemsByCategory = (categoryId: string) => {
        return menuItems
            .filter((item) => item.category_id === categoryId)
            .filter((item) => item.is_available !== false)
    }

    const getItemCountForCategory = (categoryId: string) => {
        return menuItems.filter(
            (item) => item.category_id === categoryId && item.is_available !== false
        ).length
    }

    // Use theme_color from restaurant, default to orange
    const themeColor = restaurant.theme_color || '#f97316'

    // Get active categories (those with items)
    const activeCategories = categories.filter(
        (cat) => getItemCountForCategory(cat.id) > 0
    )

    const handleCategorySelect = (category: Category) => {
        setSelectedCategory(category)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleBackToCategories = () => {
        setSelectedCategory(null)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className="min-h-screen bg-slate-50" style={{ '--theme-color': themeColor } as React.CSSProperties}>
            {/* Closed Banner */}
            {isClosed && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white py-3 px-4">
                    <div className="flex items-center justify-center gap-2 text-sm font-medium">
                        <Clock className="h-4 w-4" />
                        <span>
                            {todaySchedule?.closed
                                ? 'Bugün kapalıyız'
                                : `Restoran şu an kapalı · Bugün: ${todaySchedule?.open || '09:00'} - ${todaySchedule?.close || '23:00'}`
                            }
                        </span>
                    </div>
                </div>
            )}

            {/* Hero Header */}
            <header className={`relative overflow-hidden ${isClosed ? 'mt-10' : ''}`}>
                {/* Background Pattern - uses theme color */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}cc 50%, ${themeColor}99 100%)`
                    }}
                />
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />

                <div className="relative px-6 pt-12 pb-8">
                    {/* Back Button (when viewing category items) */}
                    {selectedCategory && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBackToCategories}
                            className="absolute top-4 left-4 text-white hover:bg-white/20 gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kategoriler
                        </Button>
                    )}

                    {/* Logo */}
                    <div className="flex justify-center mb-4">
                        {restaurant.logo_url ? (
                            <div className="relative h-24 w-24 rounded-2xl overflow-hidden border-4 border-white shadow-2xl">
                                <Image
                                    src={restaurant.logo_url}
                                    alt={restaurant.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="h-24 w-24 rounded-2xl bg-white/20 backdrop-blur-sm border-4 border-white/50 shadow-2xl flex items-center justify-center">
                                <Coffee className="h-12 w-12 text-white" />
                            </div>
                        )
                        }
                    </div>

                    {/* Cafe Info */}
                    <div className="text-center text-white">
                        <h1 className="text-3xl font-bold drop-shadow-md">{restaurant.name}</h1>
                        {restaurant.description && !selectedCategory && (
                            <p className="text-white/90 mt-2 text-sm max-w-xs mx-auto">
                                {restaurant.description}
                            </p>
                        )}
                        {selectedCategory && (
                            <p className="text-white/90 mt-2 text-lg font-medium">
                                {selectedCategory.name}
                            </p>
                        )}

                        {/* Quick Info */}
                        <div className="flex items-center justify-center gap-4 mt-4">
                            {tableFromUrl && (
                                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
                                    <MapPin className="h-4 w-4" />
                                    <span>Masa {tableFromUrl}</span>
                                </div>
                            )}
                        </div>

                        {/* Call Waiter */}
                        <div className="mt-5">
                            <CallWaiterButton cafeId={restaurant.id} initialTableNumber={tableFromUrl} />
                        </div>
                    </div>
                </div>

                {/* Curved Bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-slate-50 rounded-t-[2rem]" />
            </header>

            {/* Content */}
            {selectedCategory ? (
                /* Show items of selected category */
                <>
                    {/* Category Navigation for switching between categories */}
                    <CategoryNav
                        categories={categories}
                        activeCategory={selectedCategory.id}
                        onCategoryClick={(catId) => {
                            const cat = categories.find(c => c.id === catId)
                            if (cat) setSelectedCategory(cat)
                        }}
                        themeColor={themeColor}
                    />

                    {/* Menu Items */}
                    <main className="px-4 pb-32 pt-4">
                        <div className="space-y-3">
                            {getItemsByCategory(selectedCategory.id).map((item) => (
                                <CustomerMenuItem key={item.id} item={item} themeColor={themeColor} />
                            ))}
                        </div>
                        {getItemsByCategory(selectedCategory.id).length === 0 && (
                            <div className="text-center py-16">
                                <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                    <Coffee className="h-10 w-10 text-slate-400" />
                                </div>
                                <h3 className="font-semibold text-slate-800 text-lg">Bu kategoride ürün yok</h3>
                                <p className="text-slate-500 text-sm mt-1">Yakında eklenecek!</p>
                            </div>
                        )}
                    </main>
                </>
            ) : (
                /* Show category cards */
                <main className="px-4 pb-32 pt-4">
                    {activeCategories.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Coffee className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="font-semibold text-slate-800 text-lg">Menü Hazırlanıyor</h3>
                            <p className="text-slate-500 text-sm mt-1">Yakında burada olacak!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <h2 className="text-xl font-bold text-slate-800 mb-4">Kategoriler</h2>
                            {activeCategories.map((category) => (
                                <CategoryCard
                                    key={category.id}
                                    category={category}
                                    itemCount={getItemCountForCategory(category.id)}
                                    themeColor={themeColor}
                                    onClick={() => handleCategorySelect(category)}
                                />
                            ))}
                        </div>
                    )}
                </main>
            )}

            {/* Cart FAB */}
            <CartSheet
                cafeId={restaurant.id}
                themeColor={themeColor}
                workingHours={restaurant.working_hours}
            />
        </div>
    )
}

