'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category, MenuItem } from '@/types/database'
import { CreateCategoryDialog } from '@/components/menu/create-category-dialog'
import { CreateMenuItemDialog } from '@/components/menu/create-menu-item-dialog'
import { MenuItemCard } from '@/components/menu/menu-item-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { UtensilsCrossed, FolderOpen, Loader2 } from 'lucide-react'

export default function MenuManagerPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch categories
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('categories')
                .select('*')
                .eq('profile_id', user.id)
                .order('sort_order', { ascending: true })

            if (categoriesError) throw categoriesError
            setCategories(categoriesData || [])

            // Fetch menu items
            const { data: itemsData, error: itemsError } = await supabase
                .from('menu_items')
                .select('*')
                .eq('profile_id', user.id)
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
    }, [fetchData])

    const getItemsByCategory = (categoryId: string) => {
        return menuItems.filter((item) => item.category_id === categoryId)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Menu Manager</h2>
                    <p className="text-muted-foreground">
                        Manage your categories and menu items.
                    </p>
                </div>
                <CreateCategoryDialog onCategoryCreated={fetchData} />
            </div>

            <Separator />

            {/* Empty state */}
            {categories.length === 0 ? (
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto rounded-full bg-muted p-4 w-fit mb-2">
                            <FolderOpen className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <CardTitle>No categories yet</CardTitle>
                        <CardDescription>
                            Create your first category to start adding menu items.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                /* Categories with items */
                <div className="space-y-8">
                    {categories.map((category) => (
                        <div key={category.id} className="space-y-4">
                            {/* Category Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold flex items-center gap-2">
                                        <UtensilsCrossed className="h-5 w-5 text-primary" />
                                        {category.name}
                                    </h3>
                                    {category.description && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {category.description}
                                        </p>
                                    )}
                                </div>
                                <CreateMenuItemDialog
                                    categoryId={category.id}
                                    categoryName={category.name}
                                    onItemCreated={fetchData}
                                />
                            </div>

                            {/* Menu Items Grid */}
                            {getItemsByCategory(category.id).length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                                        <UtensilsCrossed className="h-8 w-8 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            No items in this category yet.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {getItemsByCategory(category.id).map((item) => (
                                        <MenuItemCard key={item.id} item={item} />
                                    ))}
                                </div>
                            )}

                            <Separator className="mt-6" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
