'use client'

import { useState } from 'react'
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
import { LogOut, Settings, User, Menu } from 'lucide-react'

export function Topbar() {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
            {/* Mobile hamburger menu */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                    <SidebarContent onLinkClick={() => setOpen(false)} />
                </SheetContent>
            </Sheet>

            {/* Page title */}
            <div className="flex-1">
                <h1 className="text-lg font-semibold md:text-xl">Dashboard</h1>
            </div>

            {/* User dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder-user.jpg" alt="User" />
                            <AvatarFallback>
                                <User className="h-4 w-4" />
                            </AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    )
}
