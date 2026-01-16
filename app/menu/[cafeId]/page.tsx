import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CustomerMenuClient } from './client'

interface PageProps {
    params: Promise<{ cafeId: string }>
}

export default async function CustomerMenuPage({ params }: PageProps) {
    const { cafeId } = await params
    const supabase = await createClient()

    // Fetch cafe profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', cafeId)
        .single()

    if (profileError || !profile) {
        notFound()
    }

    // Fetch categories
    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('profile_id', cafeId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

    // Fetch menu items
    const { data: menuItems } = await supabase
        .from('menu_items')
        .select('*')
        .eq('profile_id', cafeId)
        .order('sort_order', { ascending: true })

    return (
        <CustomerMenuClient
            profile={profile}
            categories={categories || []}
            menuItems={menuItems || []}
        />
    )
}
