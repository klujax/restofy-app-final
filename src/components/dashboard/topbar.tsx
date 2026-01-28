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
import { LogOut, User, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

export function DashboardTopbar() {
    const [email, setEmail] = useState('')
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setEmail(user.email || '')
            }
        }
        fetchUser()
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        toast.success('Çıkış yapıldı')
        router.push('/login')
        router.refresh()
    }

    return (
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
            <div className="flex h-14 items-center justify-between px-4 lg:px-6">
                {/* Left spacer for mobile menu */}
                <div className="w-12 lg:w-0" />

                {/* Right - Actions */}
                <div className="flex items-center gap-2 ml-auto">
                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex items-center gap-2 h-9 px-3 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            >
                                <div className="h-7 w-7 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-medium">
                                    {email.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span className="hidden sm:inline text-sm">{email}</span>
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 bg-white border-slate-200 rounded-lg p-1"
                        >
                            <div className="px-3 py-2 mb-1">
                                <p className="text-sm font-medium text-slate-900">{email}</p>
                            </div>
                            <DropdownMenuSeparator className="bg-slate-100" />
                            <DropdownMenuItem
                                className="cursor-pointer rounded-md hover:bg-slate-100 py-2"
                                onClick={() => router.push('/dashboard/settings/profile')}
                            >
                                <User className="mr-2 h-4 w-4 text-slate-500" />
                                Profil
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-100" />
                            <DropdownMenuItem
                                className="cursor-pointer rounded-md text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600 py-2"
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
