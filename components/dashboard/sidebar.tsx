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
    Store,
    User,
    Shield,
    ChevronRight,
    Menu,
    X
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const mainNavItems = [
    { icon: LayoutDashboard, label: 'Genel Bakış', href: '/dashboard' },
    { icon: ClipboardList, label: 'Siparişler', href: '/dashboard/orders' },
    { icon: UtensilsCrossed, label: 'Menü Yönetimi', href: '/dashboard/menu' },
    { icon: QrCode, label: 'QR Kodlar', href: '/dashboard/qr' },
]

const settingsNavItems = [
    { icon: Store, label: 'İşletme Ayarları', href: '/dashboard/settings/shop' },
    { icon: User, label: 'Hesap Ayarları', href: '/dashboard/settings/profile' },
]

export function DashboardSidebar() {
    const pathname = usePathname()
    const [businessName, setBusinessName] = useState('')
    const [themeColor, setThemeColor] = useState('#f97316')
    const [isSuperAdmin, setIsSuperAdmin] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('profiles')
                .select('business_name, theme_color, role')
                .eq('id', user.id)
                .single()

            if (data) {
                setBusinessName(data.business_name || '')
                setThemeColor(data.theme_color || '#f97316')
                setIsSuperAdmin(data.role === 'super_admin')
            }
        }
        fetchProfile()
    }, [supabase])

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-20 items-center gap-3 px-6 border-b border-white/5">
                <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: themeColor }}
                >
                    <span className="text-white font-bold text-lg">R</span>
                </div>
                <div>
                    <Link href="/dashboard" className="font-bold text-lg text-white" onClick={() => setMobileOpen(false)}>
                        Restofy
                    </Link>
                    <p className="text-xs text-slate-500 truncate max-w-[140px]">{businessName}</p>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                {/* Main Menu */}
                <div className="space-y-1">
                    <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Ana Menü
                    </p>
                    {mainNavItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-white/10 text-white'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                )}
                                style={isActive ? {
                                    boxShadow: `0 0 20px ${themeColor}20`,
                                    borderLeft: `3px solid ${themeColor}`
                                } : {}}
                            >
                                <item.icon className={cn(
                                    "h-5 w-5 transition-colors",
                                    isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                                )} />
                                <span className="flex-1">{item.label}</span>
                                {isActive && (
                                    <ChevronRight className="h-4 w-4" style={{ color: themeColor }} />
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* Settings Menu */}
                <div className="space-y-1">
                    <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Ayarlar
                    </p>
                    {settingsNavItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-white/10 text-white'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                )}
                                style={isActive ? {
                                    boxShadow: `0 0 20px ${themeColor}20`,
                                    borderLeft: `3px solid ${themeColor}`
                                } : {}}
                            >
                                <item.icon className={cn(
                                    "h-5 w-5 transition-colors",
                                    isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                                )} />
                                <span className="flex-1">{item.label}</span>
                                {isActive && (
                                    <ChevronRight className="h-4 w-4" style={{ color: themeColor }} />
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* Super Admin Link */}
                {isSuperAdmin && (
                    <div className="space-y-1">
                        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Yönetim
                        </p>
                        <Link
                            href="/admin"
                            onClick={() => setMobileOpen(false)}
                            className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        >
                            <Shield className="h-5 w-5" />
                            <span className="flex-1">Super Admin</span>
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                )}
            </nav>

            {/* Footer */}
            <div className="border-t border-white/5 p-4">
                <div className="flex items-center gap-3 px-2">
                    <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: themeColor }}
                    >
                        {businessName.charAt(0).toUpperCase() || 'K'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-white">{businessName || 'Kafe'}</p>
                        <p className="text-xs text-slate-500">Pro Plan</p>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <>
            {/* Mobile Menu Button */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 lg:hidden bg-white/10 backdrop-blur-sm text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-[#0f0f0f] border-r border-white/5 transform transition-transform duration-300 lg:hidden",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <SidebarContent />
            </aside>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-72 lg:block bg-[#0f0f0f] border-r border-white/5">
                <SidebarContent />
            </aside>
        </>
    )
}

// Keep old export for backward compatibility
export { DashboardSidebar as DesktopSidebar }
