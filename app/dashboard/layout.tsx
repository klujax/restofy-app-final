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

    const { data: profile } = await supabase
        .from('profiles')
        .select('business_name')
        .eq('id', user.id)
        .single()

    if (!profile?.business_name) {
        redirect('/setup')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="relative flex min-h-screen">
                <DashboardSidebar />
                <div className="flex-1 flex flex-col min-h-screen lg:ml-72">
                    <DashboardTopbar />
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
