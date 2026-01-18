import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardTopbar } from '@/components/dashboard/topbar'

export const dynamic = 'force-dynamic'

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
        <div className="min-h-screen bg-slate-100">
            <div className="relative flex min-h-screen">
                <DashboardSidebar />
                <div className="flex-1 flex flex-col min-h-screen lg:ml-72">
                    <DashboardTopbar />
                    <main className="flex-1 p-4 lg:p-6">
                        <div className="mx-auto max-w-6xl">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
