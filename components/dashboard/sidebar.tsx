'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    UtensilsCrossed,
    QrCode,
    ClipboardList,
    Settings,
    ChevronRight,
    Menu,
    X,
    Plus,
    Store,
    ChevronDown,
    Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Restaurant {
    id: string
    name: string
    location: string | null
    slug: string
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: ClipboardList, label: 'Siparişler', href: '/dashboard/orders' },
    { icon: UtensilsCrossed, label: 'Menü', href: '/dashboard/menu' },
    { icon: QrCode, label: 'QR Kodlar', href: '/dashboard/qr' },
    { icon: Settings, label: 'Ayarlar', href: '/dashboard/settings' },
]

export function DashboardSidebar() {
    const pathname = usePathname()
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [showNewRestaurantForm, setShowNewRestaurantForm] = useState(false)
    const [newRestaurantName, setNewRestaurantName] = useState('')
    const [newRestaurantLocation, setNewRestaurantLocation] = useState('')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        fetchRestaurants()
    }, [])

    const fetchRestaurants = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('restaurants')
            .select('id, name, location, slug')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: true })

        if (data && data.length > 0) {
            setRestaurants(data)
            // Get saved selection from localStorage or use first restaurant
            const savedId = localStorage.getItem('selectedRestaurantId')
            const saved = data.find(r => r.id === savedId)
            setSelectedRestaurant(saved || data[0])
        }
    }

    const selectRestaurant = (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant)
        localStorage.setItem('selectedRestaurantId', restaurant.id)
        setDropdownOpen(false)
    }

    const createRestaurant = async () => {
        if (!newRestaurantName.trim()) return
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setLoading(false)
            return
        }

        const slug = `${newRestaurantName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`

        const { data, error } = await supabase
            .from('restaurants')
            .insert({
                owner_id: user.id,
                name: newRestaurantName,
                location: newRestaurantLocation || null,
                slug: slug
            })
            .select()
            .single()

        if (!error && data) {
            setRestaurants([...restaurants, data])
            setSelectedRestaurant(data)
            localStorage.setItem('selectedRestaurantId', data.id)
            setNewRestaurantName('')
            setNewRestaurantLocation('')
            setShowNewRestaurantForm(false)
        }

        setLoading(false)
    }

    const SidebarContent = () => (
        <div className="flex h-full flex-col bg-slate-50 border-r border-slate-200">
            {/* Logo Header */}
            <div className="p-4 border-b border-slate-200">
                <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                    <h1 className="font-bold text-xl text-slate-900">Restofy</h1>
                </Link>
            </div>

            {/* Restaurant Selector */}
            <div className="p-3 border-b border-slate-200">
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
                                <Store className="h-4 w-4 text-white" />
                            </div>
                            <div className="text-left">
                                {selectedRestaurant ? (
                                    <>
                                        <p className="font-medium text-slate-900 text-sm">{selectedRestaurant.name}</p>
                                        {selectedRestaurant.location && (
                                            <p className="text-xs text-slate-500">{selectedRestaurant.location}</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-500">Restoran seçin</p>
                                )}
                            </div>
                        </div>
                        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", dropdownOpen && "rotate-180")} />
                    </button>

                    {/* Dropdown */}
                    {dropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
                            {restaurants.map((restaurant) => (
                                <button
                                    key={restaurant.id}
                                    onClick={() => selectRestaurant(restaurant)}
                                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="text-left">
                                        <p className="font-medium text-slate-900 text-sm">{restaurant.name}</p>
                                        {restaurant.location && (
                                            <p className="text-xs text-slate-500">{restaurant.location}</p>
                                        )}
                                    </div>
                                    {selectedRestaurant?.id === restaurant.id && (
                                        <Check className="h-4 w-4 text-slate-900" />
                                    )}
                                </button>
                            ))}

                            {/* Add New Restaurant Button */}
                            <button
                                onClick={() => {
                                    setDropdownOpen(false)
                                    setShowNewRestaurantForm(true)
                                }}
                                className="w-full flex items-center gap-2 p-3 text-slate-600 hover:bg-slate-50 border-t border-slate-100 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="text-sm">Yeni Restoran Ekle</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* New Restaurant Form */}
                {showNewRestaurantForm && (
                    <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg space-y-3">
                        <input
                            type="text"
                            placeholder="Restoran Adı"
                            value={newRestaurantName}
                            onChange={(e) => setNewRestaurantName(e.target.value)}
                            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        <input
                            type="text"
                            placeholder="Konum (örn: Kadıköy)"
                            value={newRestaurantLocation}
                            onChange={(e) => setNewRestaurantLocation(e.target.value)}
                            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowNewRestaurantForm(false)}
                                className="flex-1 h-10 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={createRestaurant}
                                disabled={loading || !newRestaurantName.trim()}
                                className="flex-1 h-10 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Ekleniyor...' : 'Ekle'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                                isActive
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                            {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            {selectedRestaurant && (
                <div className="p-3 border-t border-slate-200">
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500">Aktif Restoran</p>
                        <p className="font-medium text-slate-900 text-sm">{selectedRestaurant.name}</p>
                        {selectedRestaurant.location && (
                            <p className="text-xs text-slate-500">{selectedRestaurant.location}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <>
            {/* Mobile Toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 lg:hidden h-10 w-10 rounded-lg bg-white border border-slate-200 text-slate-900"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 lg:hidden",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <SidebarContent />
            </aside>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-72 lg:block">
                <SidebarContent />
            </aside>
        </>
    )
}

export { DashboardSidebar as DesktopSidebar }
