'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SidebarContent } from './sidebar'
import { LogOut, Settings, User, Menu, Bell } from 'lucide-react'

export function Topbar() {
    const [open, setOpen] = useState(false)
    const [businessName, setBusinessName] = useState('')
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('profiles')
                .select('business_name, logo_url')
                .eq('id', user.id)
                .single()

            if (data) {
                setBusinessName(data.business_name || '')
                setLogoUrl(data.logo_url)
            }
        }
        fetchProfile()
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(businessName || 'User')}&background=6366f1&color=fff&size=64`

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 lg:px-8">
            {/* Mobile hamburger menu */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 lg:hidden">
                        <Menu className="h-5 w-5 text-slate-600" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                    <SidebarContent onLinkClick={() => setOpen(false)} />
                </SheetContent>
            </Sheet>

            {/* Page title area */}
            <div className="flex-1">
                <h1 className="text-lg font-semibold text-slate-800 lg:hidden">Restofy</h1>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
                {/* Notifications placeholder */}
                <Button variant="ghost" size="icon" className="relative rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500" />
                </Button>

                {/* User dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Avatar className="h-9 w-9 ring-2 ring-slate-100">
                                <AvatarImage
                                    src={logoUrl || fallbackAvatar}
                                    alt="User"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = fallbackAvatar
                                    }}
                                />
                                <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                    <User className="h-4 w-4" />
                                </AvatarFallback>
                            </Avatar>
                            <span className="sr-only">Toggle user menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-slate-200">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium text-slate-800">{businessName || 'Hesabım'}</p>
                                <p className="text-xs text-slate-500">Yönetici</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                            <Link href="/dashboard/settings">
                                <User className="mr-2 h-4 w-4 text-slate-500" />
                                Profil
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                            <Link href="/dashboard/settings">
                                <Settings className="mr-2 h-4 w-4 text-slate-500" />
                                Ayarlar
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50">
                            <LogOut className="mr-2 h-4 w-4" />
                            Çıkış Yap
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
