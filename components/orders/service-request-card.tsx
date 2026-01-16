'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ServiceRequest } from '@/types/service-request'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Check, Loader2, X } from 'lucide-react'

interface ServiceRequestCardProps {
    request: ServiceRequest
    onResolve: () => void
}

export function ServiceRequestCard({ request, onResolve }: ServiceRequestCardProps) {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    }

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return 'Şimdi'
        if (diffMins < 60) return `${diffMins} dk önce`
        const diffHours = Math.floor(diffMins / 60)
        return `${diffHours} saat önce`
    }

    const handleResolve = async () => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('service_requests')
                .update({ status: 'resolved' })
                .eq('id', request.id)

            if (error) throw error

            toast.success('Talep tamamlandı')
            onResolve()
        } catch (error) {
            console.error('Error resolving request:', error)
            toast.error('Bir hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-l-4 border-orange-500 bg-orange-50 animate-pulse-slow">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center">
                            <Bell className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-orange-800">
                                Masa {request.table_no} Garson İstiyor!
                            </p>
                            <p className="text-sm text-orange-600">
                                {formatTime(request.created_at)} • {getTimeAgo(request.created_at)}
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={handleResolve}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Check className="mr-1 h-4 w-4" />
                                Tamamlandı
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
