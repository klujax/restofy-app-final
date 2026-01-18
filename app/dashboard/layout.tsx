import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardTopbar } from '@/components/dashboard/topbar'

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
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <div className="flex">
                {/* Sidebar */}
                <DashboardSidebar />

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-h-screen lg:ml-72">
                    <DashboardTopbar />
                    <main className="flex-1 p-6 lg:p-8">
                        <div className="mx-auto max-w-7xl">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
