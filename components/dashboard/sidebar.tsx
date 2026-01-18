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
    Shield,
    ChevronRight,
    Menu,
    X,
    Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', color: 'from-violet-500 to-purple-600' },
    { icon: ClipboardList, label: 'Siparişler', href: '/dashboard/orders', color: 'from-blue-500 to-cyan-600' },
    { icon: UtensilsCrossed, label: 'Menü', href: '/dashboard/menu', color: 'from-orange-500 to-red-600' },
    { icon: QrCode, label: 'QR Kodlar', href: '/dashboard/qr', color: 'from-emerald-500 to-teal-600' },
    { icon: Settings, label: 'Ayarlar', href: '/dashboard/settings', color: 'from-slate-500 to-slate-600' },
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
            {/* Logo Header */}
            <div className="p-6">
                <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                    <div className="relative">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                            <Zap className="h-6 w-6 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl text-white">Restofy</h1>
                        <p className="text-xs text-slate-500 truncate max-w-[140px]">{businessName}</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2">
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
                                'group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-300',
                                isActive
                                    ? 'text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            )}
                        >
                            {/* Active Background */}
                            {isActive && (
                                <div className={cn(
                                    "absolute inset-0 rounded-2xl bg-gradient-to-r opacity-90",
                                    item.color
                                )} />
                            )}

                            {/* Icon */}
                            <div className={cn(
                                "relative z-10 h-9 w-9 rounded-xl flex items-center justify-center transition-all",
                                isActive
                                    ? "bg-white/20"
                                    : "bg-slate-800/50 group-hover:bg-slate-700/50"
                            )}>
                                <item.icon className="h-5 w-5" />
                            </div>

                            {/* Label */}
                            <span className="relative z-10 flex-1">{item.label}</span>

                            {/* Arrow */}
                            {isActive && (
                                <ChevronRight className="relative z-10 h-4 w-4" />
                            )}
                        </Link>
                    )
                })}

                {/* Super Admin */}
                {isSuperAdmin && (
                    <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 hover:from-emerald-500/30 hover:to-teal-500/30 transition-all mt-4"
                    >
                        <div className="h-9 w-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <Shield className="h-5 w-5" />
                        </div>
                        <span className="flex-1">Admin Panel</span>
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                )}
            </nav>

            {/* Footer */}
            <div className="p-4 mx-4 mb-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                <div className="flex items-center gap-3">
                    <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
                        style={{
                            background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)`,
                            boxShadow: `0 4px 20px ${themeColor}40`
                        }}
                    >
                        {businessName.charAt(0).toUpperCase() || 'K'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{businessName || 'Kafe'}</p>
                        <p className="text-xs text-orange-400/80">Pro Üye ⭐</p>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <>
            {/* Mobile Toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 lg:hidden h-12 w-12 rounded-2xl bg-slate-800/90 backdrop-blur-sm text-white border border-white/10"
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
                "fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 lg:hidden",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <SidebarContent />
            </aside>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-72 lg:block bg-slate-900/80 backdrop-blur-xl border-r border-white/5">
                <SidebarContent />
            </aside>
        </>
    )
}

export { DashboardSidebar as DesktopSidebar }
