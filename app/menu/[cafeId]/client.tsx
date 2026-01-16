'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, Category, MenuItem } from '@/types/database'
import { CategoryNav } from '@/components/customer/category-nav'
import { CustomerMenuItem } from '@/components/customer/menu-item'
import { CartSheet } from '@/components/customer/cart-sheet'
import { CallWaiterButton } from '@/components/customer/call-waiter-button'
import { Coffee, MapPin, Wifi } from 'lucide-react'

interface CustomerMenuClientProps {
    profile: Profile
    categories: Category[]
    menuItems: MenuItem[]
}

export function CustomerMenuClient({ profile, categories, menuItems: initialMenuItems }: CustomerMenuClientProps) {
    const searchParams = useSearchParams()
    const tableFromUrl = searchParams.get('table') || ''
    const supabase = createClient()

    const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems)
    const [activeCategory, setActiveCategory] = useState<string | null>(
        categories[0]?.id || null
    )
    const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map())

    const scrollToCategory = (categoryId: string) => {
        setActiveCategory(categoryId)
        const element = categoryRefs.current.get(categoryId)
        if (element) {
            const yOffset = -140
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
            window.scrollTo({ top: y, behavior: 'smooth' })
        }
    }

    // Scroll tracking
    useEffect(() => {
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
    }, [categories])

    // Realtime subscription for menu item updates
    useEffect(() => {
        const channel = supabase
            .channel(`menu-items-${profile.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'menu_items',
                    filter: `profile_id=eq.${profile.id}`,
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
                    filter: `profile_id=eq.${profile.id}`,
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
                    filter: `profile_id=eq.${profile.id}`,
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
    }, [profile.id, supabase])

    const getItemsByCategory = (categoryId: string) => {
        return menuItems
            .filter((item) => item.category_id === categoryId)
            .filter((item) => item.is_available !== false)
    }

    // Use theme_color from profile, default to orange
    const themeColor = (profile as { theme_color?: string }).theme_color || '#f97316'

    return (
        <div className="min-h-screen bg-slate-50" style={{ '--theme-color': themeColor } as React.CSSProperties}>
            {/* Hero Header */}
            <header className="relative overflow-hidden">
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
                    {/* Logo */}
                    <div className="flex justify-center mb-4">
                        {profile.logo_url ? (
                            <img
                                src={profile.logo_url}
                                alt={profile.business_name}
                                className="h-24 w-24 rounded-2xl object-cover border-4 border-white shadow-2xl"
                            />
                        ) : (
                            <div className="h-24 w-24 rounded-2xl bg-white/20 backdrop-blur-sm border-4 border-white/50 shadow-2xl flex items-center justify-center">
                                <Coffee className="h-12 w-12 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Cafe Info */}
                    <div className="text-center text-white">
                        <h1 className="text-3xl font-bold drop-shadow-md">{profile.business_name}</h1>
                        {profile.description && (
                            <p className="text-white/90 mt-2 text-sm max-w-xs mx-auto">
                                {profile.description}
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
                            {profile.wifi_password && (
                                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
                                    <Wifi className="h-4 w-4" />
                                    <span>{profile.wifi_password}</span>
                                </div>
                            )}
                        </div>

                        {/* Call Waiter */}
                        <div className="mt-5">
                            <CallWaiterButton cafeId={profile.id} initialTableNumber={tableFromUrl} />
                        </div>
                    </div>
                </div>

                {/* Curved Bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-slate-50 rounded-t-[2rem]" />
            </header>

            {/* Category Navigation - pass theme color */}
            <CategoryNav
                categories={categories}
                activeCategory={activeCategory}
                onCategoryClick={scrollToCategory}
                themeColor={themeColor}
            />

            {/* Menu Content */}
            <main className="px-4 pb-32 pt-4">
                {categories.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Coffee className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-800 text-lg">Menü Hazırlanıyor</h3>
                        <p className="text-slate-500 text-sm mt-1">Yakında burada olacak!</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {categories.map((category) => {
                            const items = getItemsByCategory(category.id)

                            if (items.length === 0) return null

                            return (
                                <section
                                    key={category.id}
                                    ref={(el) => {
                                        if (el) categoryRefs.current.set(category.id, el)
                                    }}
                                >
                                    <div className="mb-4">
                                        <h2 className="text-xl font-bold text-slate-800">{category.name}</h2>
                                        {category.description && (
                                            <p className="text-sm text-slate-500 mt-1">
                                                {category.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        {items.map((item) => (
                                            <CustomerMenuItem key={item.id} item={item} themeColor={themeColor} />
                                        ))}
                                    </div>
                                </section>
                            )
                        })}
                    </div>
                )}
            </main>

            {/* Cart FAB */}
            <CartSheet cafeId={profile.id} themeColor={themeColor} />
        </div>
    )
}
