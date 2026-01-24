'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category, MenuItem } from '@/types/database'
import { CreateCategoryDialog } from '@/components/menu/create-category-dialog'
import { CreateMenuItemDialog } from '@/components/menu/create-menu-item-dialog'
import { MenuItemCard } from '@/components/menu/menu-item-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { UtensilsCrossed, FolderOpen, Loader2, Coffee, Utensils, IceCreamCone, Wine } from 'lucide-react'

// Category icons mapping
const categoryIcons: Record<string, typeof Utensils> = {
    'İçecekler': Coffee,
    'Drinks': Coffee,
    'Kahve': Coffee,
    'Ana Yemekler': Utensils,
    'Main': Utensils,
    'Tatlılar': IceCreamCone,
    'Desserts': IceCreamCone,
    'İçkiler': Wine,
}

export default function MenuManagerPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [restaurant, setRestaurant] = useState<{ id: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchData = useCallback(async (specificId?: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Determine restaurant ID: passed ID > localStorage > fetch first
            const targetId = specificId || localStorage.getItem('selectedRestaurantId')
            let restaurantData = null

            if (targetId) {
                const { data } = await supabase
                    .from('restaurants')
                    .select('id')
                    .eq('id', targetId)
                    .single()
                restaurantData = data
            } else {
                const { data } = await supabase
                    .from('restaurants')
                    .select('id')
                    .eq('owner_id', user.id)
                    .limit(1)
                    .single()
                restaurantData = data
            }

            if (!restaurantData) {
                setLoading(false)
                return
            }

            setRestaurant(restaurantData)

            // Fetch categories
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('categories')
                .select('*')
                .eq('restaurant_id', restaurantData.id)
                .order('sort_order', { ascending: true })

            if (categoriesError) throw categoriesError
            setCategories(categoriesData || [])

            // Fetch menu items
            const { data: itemsData, error: itemsError } = await supabase
                .from('menu_items')
                .select('*')
                .eq('restaurant_id', restaurantData.id)
                .order('sort_order', { ascending: true })

            if (itemsError) throw itemsError
            setMenuItems(itemsData || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchData()

        const handleRestaurantChange = (e: CustomEvent) => {
            fetchData(e.detail.restaurantId)
        }

        window.addEventListener('restaurant-change', handleRestaurantChange as EventListener)

        return () => {
            window.removeEventListener('restaurant-change', handleRestaurantChange as EventListener)
        }
    }, [fetchData])

    const getItemsByCategory = (categoryId: string) => {
        return menuItems.filter((item) => item.category_id === categoryId)
    }

    const getAvailableCount = (categoryId: string) => {
        const items = getItemsByCategory(categoryId)
        return items.filter(item => item.is_available !== false).length
    }

    const getCategoryIcon = (categoryName: string) => {
        const Icon = categoryIcons[categoryName] || UtensilsCrossed
        return Icon
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Menü Yöneticisi</h1>
                    <p className="text-slate-500 mt-1">
                        Kategorilerinizi ve ürünlerinizi yönetin.
                    </p>
                </div>
                {restaurant && (
                    <CreateCategoryDialog
                        restaurantId={restaurant.id}
                        onCategoryCreated={fetchData}
                    />
                )}
            </div>

            {
                categories.length === 0 ? (
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="text-center py-12">
                            <div className="mx-auto rounded-full bg-slate-100 p-4 w-fit mb-4">
                                <FolderOpen className="h-8 w-8 text-slate-400" />
                            </div>
                            <CardTitle className="text-slate-800">Henüz kategori yok</CardTitle>
                            <CardDescription className="text-slate-500 mt-2">
                                Menü ürünleri eklemek için önce bir kategori oluşturun.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    /* Categories with items */
                    <div className="space-y-8">
                        {categories.map((category) => {
                            const CategoryIcon = getCategoryIcon(category.name)
                            const items = getItemsByCategory(category.id)
                            const availableCount = getAvailableCount(category.id)

                            return (
                                <div key={category.id} className="space-y-4">
                                    {/* Category Header */}
                                    <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                                                <CategoryIcon className="h-6 w-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-3">
                                                    {category.name}
                                                    <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">
                                                        {items.length} ürün
                                                    </Badge>
                                                    {availableCount < items.length && (
                                                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                                                            {items.length - availableCount} stok dışı
                                                        </Badge>
                                                    )}
                                                </h3>
                                                {category.description && (
                                                    <p className="text-sm text-slate-500 mt-0.5">
                                                        {category.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <CreateMenuItemDialog
                                            categoryId={category.id}
                                            categoryName={category.name}
                                            restaurantId={restaurant?.id || ''}
                                            onItemCreated={fetchData}
                                        />
                                    </div>

                                    {items.length === 0 ? (
                                        <Card className="border-dashed border-slate-200 bg-slate-50/50">
                                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                                    <UtensilsCrossed className="h-6 w-6 text-slate-400" />
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    Bu kategoride henüz ürün yok.
                                                </p>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                            {items.map((item) => (
                                                <MenuItemCard
                                                    key={item.id}
                                                    item={item}
                                                    onStatusChange={fetchData}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )
            }

            {/* Summary Footer */}
            {
                categories.length > 0 && (
                    <Card className="bg-muted/30">
                        <CardContent className="py-4">
                            <div className="flex flex-wrap gap-4 justify-center text-sm">
                                <div className="flex items-center gap-2">
                                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                    <span><strong>{categories.length}</strong> Kategori</span>
                                </div>
                                <Separator orientation="vertical" className="h-5" />
                                <div className="flex items-center gap-2">
                                    <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                                    <span><strong>{menuItems.length}</strong> Ürün</span>
                                </div>
                                <Separator orientation="vertical" className="h-5" />
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-green-500" />
                                    <span><strong>{menuItems.filter(i => i.is_available !== false).length}</strong> Stokta</span>
                                </div>
                                <Separator orientation="vertical" className="h-5" />
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-red-500" />
                                    <span><strong>{menuItems.filter(i => i.is_available === false).length}</strong> Tükendi</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            }
        </div >
    )
}
