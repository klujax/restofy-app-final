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
    User,
    ChevronRight,
    Shield
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Genel Bakış', href: '/dashboard' },
    { icon: UtensilsCrossed, label: 'Menü Yöneticisi', href: '/dashboard/menu' },
    { icon: QrCode, label: 'QR Kod', href: '/dashboard/qr' },
    { icon: ClipboardList, label: 'Siparişler', href: '/dashboard/orders' },
    { icon: Settings, label: 'Ayarlar', href: '/dashboard/settings' },
]

interface SidebarContentProps {
    onLinkClick?: () => void
}

export function SidebarContent({ onLinkClick }: SidebarContentProps) {
    const pathname = usePathname()
    const [businessName, setBusinessName] = useState('')
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [isSuperAdmin, setIsSuperAdmin] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('profiles')
                .select('business_name, logo_url, role')
                .eq('id', user.id)
                .single()

            if (data) {
                setBusinessName(data.business_name || '')
                setLogoUrl(data.logo_url)
                setIsSuperAdmin(data.role === 'super_admin')
            }
        }
        fetchProfile()
    }, [supabase])

    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(businessName || 'Cafe')}&background=6366f1&color=fff&size=64`

    return (
        <div className="flex h-full flex-col bg-white">
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <span className="text-white font-bold text-lg">R</span>
                </div>
                <Link href="/dashboard" className="font-bold text-xl text-slate-800" onClick={onLinkClick}>
                    Restofy
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onLinkClick}
                            className={cn(
                                'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            )}
                        >
                            <item.icon className={cn(
                                "h-5 w-5 transition-colors",
                                isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                            )} />
                            <span className="flex-1">{item.label}</span>
                            {isActive && (
                                <ChevronRight className="h-4 w-4 text-indigo-400" />
                            )}
                        </Link>
                    )
                })}

                {/* Super Admin Link */}
                {isSuperAdmin && (
                    <>
                        <div className="my-4 border-t border-slate-100" />
                        <Link
                            href="/admin"
                            onClick={onLinkClick}
                            className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 bg-slate-900 text-white hover:bg-slate-800"
                        >
                            <Shield className="h-5 w-5 text-emerald-400" />
                            <span className="flex-1">Super Admin</span>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                        </Link>
                    </>
                )}
            </nav>

            {/* Profile Section */}
            <div className="border-t border-slate-100 p-4">
                <Link
                    href="/dashboard/settings"
                    onClick={onLinkClick}
                    className="flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-slate-50"
                >
                    <Avatar className="h-10 w-10 ring-2 ring-slate-100">
                        <AvatarImage
                            src={logoUrl || fallbackAvatar}
                            alt={businessName}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = fallbackAvatar
                            }}
                        />
                        <AvatarFallback className="bg-indigo-100 text-indigo-600">
                            <User className="h-5 w-5" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="truncate font-semibold text-slate-800">{businessName || 'Kafe Adı'}</p>
                        <p className="text-xs text-slate-500">Profil Ayarları</p>
                    </div>
                </Link>
            </div>
        </div>
    )
}

export function DesktopSidebar() {
    return (
        <aside className="hidden lg:block h-screen sticky top-0 border-r border-slate-200 bg-white">
            <SidebarContent />
        </aside>
    )
}
