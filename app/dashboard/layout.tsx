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

    // Check if user has completed setup (has business_name)
    const { data: profile } = await supabase
        .from('profiles')
        .select('business_name')
        .eq('id', user.id)
        .single()

    // If user doesn't have a business name, they need to complete setup
    if (!profile?.business_name) {
        redirect('/setup')
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
