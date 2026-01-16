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
        <div className="min-h-screen bg-slate-50">
            <div className="grid w-full lg:grid-cols-[280px_1fr]">
                <DesktopSidebar />
                <div className="flex flex-col min-h-screen">
                    <Topbar />
                    <main className="flex-1 p-4 lg:p-8">
                        <div className="mx-auto max-w-7xl">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
