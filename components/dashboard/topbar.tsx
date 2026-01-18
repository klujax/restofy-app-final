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
import { Bell, LogOut, User, Settings, ChevronDown, Sparkles } from 'lucide-react'
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
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-900/50 border-b border-white/5">
            <div className="flex h-16 items-center justify-between px-4 lg:px-8">
                {/* Left spacer for mobile menu */}
                <div className="w-12 lg:w-0" />

                {/* Center - Welcome Message */}
                <div className="hidden md:flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-slate-400">
                        Hoş geldin, <span className="text-white font-medium">{businessName}</span>
                    </span>
                </div>

                {/* Right - Actions */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-10 w-10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
                    >
                        <Bell className="h-5 w-5" />
                        <span
                            className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full animate-pulse"
                            style={{ backgroundColor: themeColor }}
                        />
                    </Button>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex items-center gap-2 h-10 px-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5"
                            >
                                <div
                                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg"
                                    style={{
                                        background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`,
                                    }}
                                >
                                    {businessName.charAt(0).toUpperCase() || 'K'}
                                </div>
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 bg-slate-900 border-white/10 text-white rounded-xl p-2"
                        >
                            <div className="px-3 py-2 mb-2">
                                <p className="font-semibold">{businessName}</p>
                                <p className="text-xs text-slate-400">{email}</p>
                            </div>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem
                                className="cursor-pointer rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5"
                                onClick={() => router.push('/dashboard/settings')}
                            >
                                <Settings className="mr-2 h-4 w-4 text-slate-400" />
                                Ayarlar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5"
                                onClick={() => router.push('/dashboard/settings/profile')}
                            >
                                <User className="mr-2 h-4 w-4 text-slate-400" />
                                Profil
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem
                                className="cursor-pointer rounded-lg text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-400 py-2.5"
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

export { DashboardTopbar as Topbar }
