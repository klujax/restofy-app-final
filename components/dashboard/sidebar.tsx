'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, UtensilsCrossed, QrCode, ClipboardList, Coffee } from 'lucide-react'

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
    { icon: UtensilsCrossed, label: 'Menu Manager', href: '/dashboard/menu' },
    { icon: QrCode, label: 'QR Code', href: '/dashboard/qr' },
    { icon: ClipboardList, label: 'Orders', href: '/dashboard/orders' },
]

interface SidebarContentProps {
    onLinkClick?: () => void
}

export function SidebarContent({ onLinkClick }: SidebarContentProps) {
    const pathname = usePathname()

    return (
        <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold" onClick={onLinkClick}>
                    <Coffee className="h-6 w-6 text-primary" />
                    <span className="text-xl">Restofy</span>
                </Link>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4 lg:px-4">
                {sidebarItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onLinkClick}
                        className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground',
                            pathname === item.href
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                                : 'text-muted-foreground'
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                    </Link>
                ))}
            </nav>
        </div>
    )
}

export function DesktopSidebar() {
    return (
        <aside className="hidden border-r bg-muted/40 md:block">
            <SidebarContent />
        </aside>
    )
}
