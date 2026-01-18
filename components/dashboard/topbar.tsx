'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, LogOut, User, Store, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

export function DashboardTopbar() {
    const [businessName, setBusinessName] = useState('')
    const [email, setEmail] = useState('')
    const [themeColor, setThemeColor] = useState('#f97316')
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            setEmail(user.email || '')

            const { data } = await supabase
                .from('profiles')
                .select('business_name, theme_color')
                .eq('id', user.id)
                .single()

            if (data) {
                setBusinessName(data.business_name || '')
                setThemeColor(data.theme_color || '#f97316')
            }
        }
        fetchProfile()
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        toast.success('Çıkış yapıldı')
        router.push('/login')
        router.refresh()
    }

    return (
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-6 lg:px-8">
                {/* Left - Spacer for mobile menu button */}
                <div className="w-10 lg:w-0" />

                {/* Center - Page Title (optional) */}
                <div className="flex-1" />

                {/* Right - Actions */}
                <div className="flex items-center gap-3">
                    {/* Notifications */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative text-slate-400 hover:text-white hover:bg-white/5"
                    >
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: themeColor }} />
                    </Button>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex items-center gap-2 px-3 text-slate-300 hover:text-white hover:bg-white/5"
                            >
                                <div
                                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                                    style={{ backgroundColor: themeColor }}
                                >
                                    {businessName.charAt(0).toUpperCase() || 'K'}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium">{businessName || 'Kafe'}</p>
                                    <p className="text-xs text-slate-500">{email}</p>
                                </div>
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 bg-[#1a1a1a] border-white/10 text-white"
                        >
                            <div className="px-3 py-2 border-b border-white/10">
                                <p className="font-medium">{businessName}</p>
                                <p className="text-xs text-slate-400">{email}</p>
                            </div>
                            <DropdownMenuItem
                                className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
                                onClick={() => router.push('/dashboard/settings/shop')}
                            >
                                <Store className="mr-2 h-4 w-4" />
                                İşletme Ayarları
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
                                onClick={() => router.push('/dashboard/settings/profile')}
                            >
                                <User className="mr-2 h-4 w-4" />
                                Hesap Ayarları
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem
                                className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-400"
                                onClick={handleLogout}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Çıkış Yap
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}

// Keep old export for backward compatibility
export { DashboardTopbar as Topbar }
