'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Store, Plus, ExternalLink, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Restaurant } from '@/types/database'

export default function OwnerDashboardPage() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        fetchRestaurants()
    }, [])

    const fetchRestaurants = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }

        const { data } = await supabase
            .from('restaurants')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })

        setRestaurants(data || [])
        setLoading(false)
    }

    const handleCreateRestaurant = async () => {
        const name = window.prompt('Restoran Adı:')
        if (!name) return

        const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '')
        const { data: { user } } = await supabase.auth.getUser()

        const { error } = await supabase.from('restaurants').insert({
            owner_id: user?.id,
            name,
            slug,
            theme_color: '#f97316' // Default orange
        })

        if (error) {
            alert('Hata: ' + error.message)
        } else {
            fetchRestaurants()
        }
    }

    const handleDeleteRestaurant = async (id: string) => {
        if (!window.confirm('Bu restoranı silmek istediğinize emin misiniz?')) return

        const { error } = await supabase.from('restaurants').delete().eq('id', id)
        if (error) {
            alert('Hata: ' + error.message)
        } else {
            fetchRestaurants()
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Restoranlarım</h1>
                    <p className="text-slate-500">İşletmelerinizi buradan yönetebilirsiniz.</p>
                </div>
                <button
                    onClick={handleCreateRestaurant}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Restoran Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant) => (
                    <div key={restaurant.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-32 bg-slate-100 flex items-center justify-center relative">
                            {restaurant.logo_url ? (
                                <img src={restaurant.logo_url} alt={restaurant.name} className="h-full w-full object-cover" />
                            ) : (
                                <Store className="h-12 w-12 text-slate-300" />
                            )}
                            <div className="absolute top-2 right-2 flex gap-2">
                                <button
                                    onClick={() => handleDeleteRestaurant(restaurant.id)}
                                    className="p-2 bg-white/90 rounded-full text-red-600 hover:text-red-700 hover:bg-white shadow-sm"
                                    title="Sil"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-5">
                            <h3 className="font-semibold text-lg text-slate-900">{restaurant.name}</h3>
                            <p className="text-sm text-slate-500 mb-4 truncate">{restaurant.description || 'Açıklama yok'}</p>

                            <div className="flex gap-3">
                                <Link
                                    href={`/dashboard/${restaurant.id}`}
                                    className="flex-1 text-center bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                                >
                                    Yönet
                                </Link>
                                <Link
                                    href={`/menu/${restaurant.slug}`}
                                    target="_blank"
                                    className="flex items-center justify-center w-10 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                                    title="Canlı Menü"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}

                {restaurants.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <Store className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <h3 className="font-medium text-slate-900">Henüz restoranınız yok</h3>
                        <p className="text-slate-500 text-sm mt-1 mb-4">İlk restoranınızı oluşturarak satış yapmaya başlayın.</p>
                        <button
                            onClick={handleCreateRestaurant}
                            className="text-orange-600 font-medium hover:text-orange-700"
                        >
                            Restoran Oluştur
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
