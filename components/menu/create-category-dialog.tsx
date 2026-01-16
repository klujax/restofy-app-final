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
    onCategoryCreated: () => void
}

export function CreateCategoryDialog({ onCategoryCreated }: CreateCategoryDialogProps) {
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

    const onSubmit = async (values: CategoryFormValues) => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase.from('categories').insert({
                profile_id: user.id,
                name: values.name,
                description: values.description || null,
            })

            if (error) throw error

            form.reset()
            setOpen(false)
            onCategoryCreated()
        } catch (error) {
            console.error('Error creating category:', error)
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
