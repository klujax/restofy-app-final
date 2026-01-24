'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Plus, Loader2 } from 'lucide-react'

const categorySchema = z.object({
    name: z.string().min(1, 'Category name is required').max(50, 'Name too long'),
    description: z.string().max(200, 'Description too long').optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CreateCategoryDialogProps {
    restaurantId: string
    onCategoryCreated: () => void
}

export function CreateCategoryDialog({ restaurantId, onCategoryCreated }: CreateCategoryDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: '',
            description: '',
        },
    })

    const ensureProfileExists = async (userId: string) => {
        // Check if profile exists
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .maybeSingle()

        if (!profile) {
            // Create profile if missing
            const { error: createError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    business_name: 'My Cafe', // Default name
                    slug: `cafe-${userId.slice(0, 8)}`,
                }, { onConflict: 'id' })

            if (createError) throw createError
        }
    }

    const onSubmit = async (values: CategoryFormValues) => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const insertCategory = async () => {
                return await supabase.from('categories').insert({
                    profile_id: user.id,
                    restaurant_id: restaurantId,
                    name: values.name,
                    description: values.description || null,
                })
            }

            let { error } = await insertCategory()

            // If profile missing (Foreign Key Violation), try to fix and retry
            if (error?.code === '23503') {
                console.log('Profile missing, attempting to create...')
                await ensureProfileExists(user.id)
                const retry = await insertCategory()
                error = retry.error
            }

            if (error) throw error

            form.reset()
            setOpen(false)
            onCategoryCreated()
        } catch (error) {
            console.error('Error creating category:', error)
            // @ts-expect-error - Supabase error type may have code property
            if (error?.code === '23503') {
                // Fallback if retry failed or other FK issue
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Category
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Category</DialogTitle>
                    <DialogDescription>
                        Add a new category to organize your menu items.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Hot Drinks" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Freshly brewed coffee and tea" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Category
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
