'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import imageCompression from 'browser-image-compression'
import { toast } from 'sonner'
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
import { Label } from '@/components/ui/label'
import { Plus, Loader2, Upload, X, ImageIcon } from 'lucide-react'

const menuItemSchema = z.object({
    name: z.string().min(1, 'Item name is required').max(100, 'Name too long'),
    description: z.string().max(500, 'Description too long').optional(),
    price: z.string().min(1, 'Price is required').refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
        'Price must be a valid number'
    ),
})

type MenuItemFormValues = z.infer<typeof menuItemSchema>

interface CreateMenuItemDialogProps {
    categoryId: string
    categoryName: string
    onItemCreated: () => void
}

const MAX_FILE_SIZE_MB = 5

export function CreateMenuItemDialog({
    categoryId,
    categoryName,
    onItemCreated
}: CreateMenuItemDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [uploadStatus, setUploadStatus] = useState<string>('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const form = useForm<MenuItemFormValues>({
        resolver: zodResolver(menuItemSchema),
        defaultValues: {
            name: '',
            description: '',
            price: '',
        },
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const previewUrl = URL.createObjectURL(file)
            setImagePreview(previewUrl)
        }
    }

    const clearImage = () => {
        setImageFile(null)
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview)
        }
        setImagePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const resetForm = () => {
        form.reset()
        clearImage()
        setUploadStatus('')
    }

    const compressImage = async (file: File): Promise<File> => {
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
        }

        setUploadStatus('Compressing image...')
        const compressedFile = await imageCompression(file, options)

        // Check if still too large after compression
        const fileSizeMB = compressedFile.size / (1024 * 1024)
        if (fileSizeMB > MAX_FILE_SIZE_MB) {
            throw new Error(`File is too large (${fileSizeMB.toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`)
        }

        return compressedFile
    }

    const onSubmit = async (values: MenuItemFormValues) => {
        setLoading(true)
        setUploadStatus('')

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            let imageUrl: string | null = null

            if (imageFile) {
                // Compress the image first
                let fileToUpload: File
                try {
                    fileToUpload = await compressImage(imageFile)
                } catch (compressionError) {
                    if (compressionError instanceof Error) {
                        toast.error(compressionError.message)
                    } else {
                        toast.error('Failed to compress image')
                    }
                    setLoading(false)
                    setUploadStatus('')
                    return
                }

                setUploadStatus('Uploading image...')

                const fileExt = fileToUpload.name.split('.').pop() || 'jpg'
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
                const filePath = `${user.id}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('menu-images')
                    .upload(filePath, fileToUpload)

                if (uploadError) {
                    throw new Error(`Upload failed: ${uploadError.message}`)
                }

                const { data: urlData } = supabase.storage
                    .from('menu-images')
                    .getPublicUrl(filePath)

                imageUrl = urlData.publicUrl
            }

            setUploadStatus('Saving item...')

            const { error } = await supabase.from('menu_items').insert({
                profile_id: user.id,
                category_id: categoryId,
                name: values.name,
                description: values.description || null,
                price: parseFloat(values.price),
                image_url: imageUrl,
            })

            if (error) throw error

            toast.success('Menu item added successfully!')
            resetForm()
            setOpen(false)
            onItemCreated()
        } catch (error) {
            console.error('Error creating menu item:', error)
            const errorMessage = error instanceof Error ? error.message : 'An error occurred'
            toast.error(errorMessage)
            setUploadStatus('')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (!isOpen) resetForm()
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Menu Item</DialogTitle>
                    <DialogDescription>
                        Add a new item to &quot;{categoryName}&quot;
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
                                        <Input placeholder="e.g., Cappuccino" {...field} />
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
                                        <Input placeholder="Rich espresso with steamed milk foam" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price (₺)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" min="0" placeholder="45.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Image Upload */}
                        <div className="space-y-2">
                            <Label>Image (optional)</Label>
                            {imagePreview ? (
                                <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-muted">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-6 w-6"
                                        onClick={clearImage}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div
                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">Click to upload image</p>
                                    <p className="text-xs text-muted-foreground mt-1">Images will be compressed automatically</p>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        {uploadStatus && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {uploadStatus}
                            </p>
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {uploadStatus || 'Processing...'}
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Add Item
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
