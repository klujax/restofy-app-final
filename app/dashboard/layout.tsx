import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DesktopSidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[280px_1fr]">
            <DesktopSidebar />
            <div className="flex flex-col">
                <Topbar />
                <main className="flex-1 overflow-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
