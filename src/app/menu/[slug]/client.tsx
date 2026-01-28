'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Restaurant, Category, MenuItem, Customer } from '@/types/database'
import { CategoryNav } from '@/components/customer/category-nav'
import { CategoryCard } from '@/components/customer/category-card'
import { CustomerMenuItem } from '@/components/customer/menu-item'
import { CartSheet } from '@/components/customer/cart-sheet'
import { WelcomeOverlay } from '@/components/customer/welcome-overlay'
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

    interface CustomerUser {
        id?: string
        full_name?: string
        phone?: string
        is_guest: boolean
    }
    const [currentUser, setCurrentUser] = useState<CustomerUser | null>(null)
    const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems)
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)


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

    // Scroll tracking (only when viewing items within a category)
    useEffect(() => {
        if (!selectedCategory) return

        const handleScroll = () => {
            // Logic removed as activeCategory is unused
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
            <WelcomeOverlay restaurantName={restaurant.name} onComplete={setCurrentUser} />

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
            <header className={`relative min-h-[40vh] flex flex-col justify-end overflow-hidden ${isClosed ? 'mt-10' : ''}`}>
                {/* Background Image / Gradient */}
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        background: `radial-gradient(circle at 20% 150%, ${themeColor}, transparent 50%), 
                                   radial-gradient(circle at 80% -20%, ${themeColor}, transparent 50%),
                                   linear-gradient(180deg, ${themeColor} 0%, ${themeColor}dd 100%)`
                    }}
                />
                <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />

                <div className="relative z-10 px-6 pb-12 pt-16">
                    {/* Back Button (when viewing category items) */}
                    {selectedCategory && (
                        <div className="absolute top-6 left-4 animate-in-fade">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBackToCategories}
                                className="text-white hover:bg-white/20 gap-2 backdrop-blur-md bg-white/10 rounded-full pl-2 pr-4"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="font-semibold text-xs uppercase tracking-widest">Geri</span>
                            </Button>
                        </div>
                    )}

                    {/* Logo & Info */}
                    <div className="flex flex-col items-center text-center">
                        <div className="relative group mb-6 animate-in-up">
                            {restaurant.logo_url ? (
                                <div className="relative h-28 w-28 rounded-[2rem] overflow-hidden border-[6px] border-white/20 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                                    <Image
                                        src={restaurant.logo_url}
                                        alt={restaurant.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="h-28 w-28 rounded-[2rem] bg-white/10 backdrop-blur-xl border-[6px] border-white/20 shadow-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                                    <Coffee className="h-12 w-12 text-white" />
                                </div>
                            )}
                        </div>

                        <div className="text-white space-y-2 animate-in-up" style={{ animationDelay: '100ms' }}>
                            <h1 className="text-4xl font-black tracking-tight drop-shadow-sm">{restaurant.name}</h1>
                            {restaurant.description && !selectedCategory && (
                                <p className="text-white/80 text-sm max-w-xs mx-auto font-medium leading-relaxed">
                                    {restaurant.description}
                                </p>
                            )}
                            {selectedCategory && (
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                                    <span className="text-white font-bold tracking-tight">
                                        {selectedCategory.name}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Quick Info Badges */}
                        <div className="flex flex-wrap items-center justify-center gap-3 mt-6 animate-in-up" style={{ animationDelay: '200ms' }}>
                            {tableFromUrl && (
                                <div className="flex items-center gap-1.5 glass px-4 py-2 rounded-2xl text-xs font-bold text-slate-800 shadow-sm">
                                    <MapPin className="h-3.5 w-3.5 text-slate-600" />
                                    <span>MASA {tableFromUrl}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 glass px-4 py-2 rounded-2xl text-xs font-bold text-slate-800 shadow-sm">
                                <Clock className="h-3.5 w-3.5 text-slate-600" />
                                <span>{isClosed ? 'KAPALI' : 'AÇIK'}</span>
                            </div>
                        </div>

                        {/* Call Waiter */}
                        <div className="mt-8 animate-in-up" style={{ animationDelay: '300ms' }}>
                            <CallWaiterButton cafeId={restaurant.id} initialTableNumber={tableFromUrl} />
                        </div>
                    </div>
                </div>

                {/* Curved Bottom Decorative */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-slate-50 rounded-t-[3rem] z-10" />
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
                initialTableNumber={tableFromUrl}
                initialUser={currentUser as unknown as Customer}
            />
        </div>
    )
}

