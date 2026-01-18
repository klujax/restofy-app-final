'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Bell, Loader2 } from 'lucide-react'

interface CallWaiterButtonProps {
    cafeId: string
    initialTableNumber?: string
}

export function CallWaiterButton({ cafeId, initialTableNumber }: CallWaiterButtonProps) {
    const [open, setOpen] = useState(false)
    const [tableNumber, setTableNumber] = useState(initialTableNumber || '')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleCallWaiter = async () => {
        // If no table number, show dialog
        if (!tableNumber.trim()) {
            setOpen(true)
            return
        }

        await submitRequest()
    }

    const submitRequest = async () => {
        if (!tableNumber.trim()) {
            toast.error('Lütfen masa numaranızı girin')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase
                .from('service_requests')
                .insert({
                    restaurant_id: cafeId, // CafeId passed prop is restaurantId
                    table_no: tableNumber.trim(),
                    status: 'pending',
                })

            if (error) throw error

            toast.success('🔔 Garson yolda!', {
                description: `Masa ${tableNumber} için garson çağrıldı.`,
            })
            setOpen(false)
        } catch (error) {
            console.error('Error calling waiter:', error)
            toast.error('Bir hata oluştu. Lütfen tekrar deneyin.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Button
                onClick={handleCallWaiter}
                variant="outline"
                className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
            >
                <Bell className="h-4 w-4" />
                Garson Çağır
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[350px]">
                    <DialogHeader>
                        <DialogTitle>Garson Çağır</DialogTitle>
                        <DialogDescription>
                            Lütfen masa numaranızı girin
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="tableNumber">Masa Numarası</Label>
                            <Input
                                id="tableNumber"
                                placeholder="Örn: 5"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={submitRequest}
                            disabled={loading || !tableNumber.trim()}
                            className="w-full gap-2"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Bell className="h-4 w-4" />
                            )}
                            Garson Çağır
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
