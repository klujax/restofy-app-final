'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
    Palette,
    Upload,
    Loader2,
    X,
    Wifi,
    Sparkles,
    Building2,
    QrCode,
    CalendarDays,
    Settings2,
    MonitorIcon,
    ArrowRight,
    Plus
} from 'lucide-react'
import { toast } from 'sonner'
import { WorkingHours } from '@/types/database'
import { cn } from '@/lib/utils'

const DAY_NAMES = [
    { key: 'monday', label: 'Pazartesi' },
    { key: 'tuesday', label: 'Salı' },
    { key: 'wednesday', label: 'Çarşamba' },
    { key: 'thursday', label: 'Perşembe' },
    { key: 'friday', label: 'Cuma' },
    { key: 'saturday', label: 'Cumartesi' },
    { key: 'sunday', label: 'Pazar' },
] as const

const DEFAULT_WORKING_HOURS: WorkingHours = {
    monday: { open: '09:00', close: '23:00', closed: false },
    tuesday: { open: '09:00', close: '23:00', closed: false },
    wednesday: { open: '09:00', close: '23:00', closed: false },
    thursday: { open: '09:00', close: '23:00', closed: false },
    friday: { open: '09:00', close: '23:00', closed: false },
    saturday: { open: '10:00', close: '00:00', closed: false },
    sunday: { open: '10:00', close: '22:00', closed: false },
}

const THEME_COLORS = [
    { name: 'Turuncu', value: '#f97316', gradient: 'from-orange-500 to-red-600', glow: 'shadow-orange-500/20' },
    { name: 'Mavi', value: '#3b82f6', gradient: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/20' },
    { name: 'Yeşil', value: '#10b981', gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/20' },
    { name: 'Mor', value: '#8b5cf6', gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/20' },
    { name: 'Pembe', value: '#ec4899', gradient: 'from-pink-500 to-rose-600', glow: 'shadow-pink-500/20' },
    { name: 'Kırmızı', value: '#ef4444', gradient: 'from-red-500 to-rose-600', glow: 'shadow-red-500/20' },
    { name: 'Amber', value: '#f59e0b', gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/20' },
    { name: 'Cyan', value: '#06b6d4', gradient: 'from-cyan-500 to-blue-600', glow: 'shadow-cyan-500/20' },
]

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [businessName, setBusinessName] = useState('')
    const [description, setDescription] = useState('')
    const [themeColor, setThemeColor] = useState('#f97316')
    const [qrColor, setQrColor] = useState('#000000')
    const [wifiPassword, setWifiPassword] = useState('')
    const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS)
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)

    const [restaurantId, setRestaurantId] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const fetchRestaurant = useCallback(async (specificId?: string) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let query = supabase
            .from('restaurants')
            .select('*')
            .eq('owner_id', user.id)

        const targetId = specificId || localStorage.getItem('selectedRestaurantId')

        if (targetId) {
            query = query.eq('id', targetId)
        }

        const { data } = await query.limit(1).single()

        if (data) {
            setRestaurantId(data.id)
            setBusinessName(data.name || '')
            setDescription(data.description || '')
            setThemeColor(data.theme_color || '#f97316')
            setQrColor(data.theme_color || '#000000')
            setLogoUrl(data.logo_url)
            if (data.working_hours) {
                setWorkingHours(data.working_hours)
            }
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchRestaurant()

        const handleRestaurantChange = (e: CustomEvent) => {
            fetchRestaurant(e.detail.restaurantId)
        }

        window.addEventListener('restaurant-change', handleRestaurantChange as EventListener)

        return () => {
            window.removeEventListener('restaurant-change', handleRestaurantChange as EventListener)
        }
    }, [fetchRestaurant])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Dosya 2MB\'dan küçük olmalı')
            return
        }
        setLogoFile(file)
        const reader = new FileReader()
        reader.onloadend = () => setLogoPreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || !restaurantId) throw new Error('Oturum kapalı veya restoran seçilmedi')

            let newLogoUrl = logoUrl
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop()
                const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`
                await supabase.storage.from('avatars').upload(fileName, logoFile, { upsert: true })
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
                newLogoUrl = urlData.publicUrl
            }

            // Note: qrColor is currently UI-only or same as theme_color until DB migration
            // We prioritise themeColor for now.

            await import('@/services/restaurant.service').then(({ restaurantService }) =>
                restaurantService.updateRestaurant(supabase, restaurantId, {
                    name: businessName,
                    description,
                    theme_color: themeColor,
                    logo_url: newLogoUrl,
                    working_hours: workingHours,
                })
            )

            setLogoUrl(newLogoUrl)
            setLogoFile(null)
            setLogoPreview(null)
            toast.success('Ayarlar ve renk teması başarıyla güncellendi!')

            // Force refresh locally to ensure UI updates across components
            localStorage.setItem('theme_color', themeColor)
            window.dispatchEvent(new Event('storage'))

        } catch (error) {
            console.error('Save Error:', error)
            const msg = error instanceof Error ? error.message : 'Bilinmeyen hata'
            toast.error(`Kaydedilemedi: ${msg}`)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-t-2 border-indigo-500 animate-spin" />
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400 absolute inset-0 m-auto" />
                </div>
            </div>
        )
    }

    const currentLogo = logoPreview || logoUrl
    const selectedColor = THEME_COLORS.find(c => c.value === themeColor)

    return (
        <div className="max-w-5xl mx-auto py-10 px-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">İşletme Ayarları</h1>
                    <p className="text-slate-500 mt-1 font-medium">Restoran kimliğinizi ve çalışma saatlerinizi yönetin.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                        "h-12 px-8 rounded-xl font-bold transition-all shadow-sm",
                        saving ? "bg-slate-100 text-slate-400" : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                    )}
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Kaydoluyor...
                        </>
                    ) : (
                        "Değişiklikleri Kaydet"
                    )}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Core Branding */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="p-8 border-slate-200 shadow-sm bg-white">
                        <div className="flex items-center gap-3 mb-6">
                            <Building2 className="h-5 w-5 text-indigo-500" />
                            <h2 className="text-lg font-bold text-slate-800">Genel Bilgiler</h2>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Logo Upload Section */}
                            <div className="flex flex-col items-center gap-4">
                                <div
                                    className="relative h-32 w-32 rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 group transition-all"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {currentLogo ? (
                                        <Image
                                            src={currentLogo}
                                            alt="Logo"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                                            <Upload className="h-6 w-6 mb-1" />
                                            <span className="text-[10px] font-bold">Logo Yükle</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Plus className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                {currentLogo && (
                                    <button
                                        onClick={() => { setLogoFile(null); setLogoPreview(null); setLogoUrl(null) }}
                                        className="text-xs font-bold text-red-500 hover:text-red-600"
                                    >
                                        Logoyu Kaldır
                                    </button>
                                )}
                            </div>

                            {/* Form Fields */}
                            <div className="flex-1 space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-bold text-sm">İşletme Adı</Label>
                                    <Input
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        placeholder="Restoranınızın Adı"
                                        className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 font-semibold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-bold text-sm">Açıklama / Slogan</Label>
                                    <Input
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Kısa bir tanıtım..."
                                        className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Visual Customization */}
                    <Card className="p-8 border-slate-200 shadow-sm bg-white">
                        <div className="flex items-center gap-3 mb-6">
                            <Palette className="h-5 w-5 text-indigo-500" />
                            <h2 className="text-lg font-bold text-slate-800">Görünüm ve Tema</h2>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <Label className="text-slate-600 font-bold text-sm mb-4 block">Menü Tema Rengi</Label>
                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
                                    {THEME_COLORS.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => setThemeColor(color.value)}
                                            className={cn(
                                                "h-10 w-10 rounded-full transition-all border-4 relative",
                                                color.value === themeColor ? "border-slate-800 scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                                            )}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        >
                                            {color.value === themeColor && (
                                                <X className="h-4 w-4 text-white absolute inset-0 m-auto rotate-45" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Wifi className="h-4 w-4 text-slate-500" />
                                        <Label className="text-slate-600 font-bold text-sm">WiFi Şifresi</Label>
                                    </div>
                                    <Input
                                        value={wifiPassword}
                                        onChange={(e) => setWifiPassword(e.target.value)}
                                        placeholder="Müşteriler için WiFi"
                                        className="h-11 rounded-xl border-slate-200 font-mono"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <QrCode className="h-4 w-4 text-slate-500" />
                                        <Label className="text-slate-600 font-bold text-sm">QR Kod Rengi</Label>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-11 w-11 rounded-xl border border-slate-200 relative overflow-hidden shrink-0">
                                            <input
                                                type="color"
                                                value={qrColor}
                                                onChange={(e) => setQrColor(e.target.value)}
                                                className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer scale-150"
                                            />
                                        </div>
                                        <Input
                                            value={qrColor}
                                            onChange={(e) => setQrColor(e.target.value)}
                                            className="h-11 rounded-xl border-slate-200 font-mono uppercase text-xs"
                                            maxLength={7}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Working Hours */}
                <Card className="lg:col-span-1 p-6 border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <CalendarDays className="h-5 w-5 text-indigo-500" />
                        <h2 className="text-lg font-bold text-slate-800">Çalışma Saatleri</h2>
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto">
                        {DAY_NAMES.map(({ key, label }) => {
                            const schedule = workingHours[key]
                            return (
                                <div
                                    key={key}
                                    className={cn(
                                        "p-4 rounded-2xl border transition-all",
                                        schedule.closed ? "bg-slate-50 border-slate-100" : "bg-white border-slate-200"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={cn("text-sm font-bold", schedule.closed ? "text-slate-400" : "text-slate-700")}>
                                            {label}
                                        </span>
                                        <button
                                            onClick={() => setWorkingHours(prev => ({
                                                ...prev,
                                                [key]: { ...prev[key], closed: !prev[key].closed }
                                            }))}
                                            className={cn(
                                                "text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider transition-colors",
                                                schedule.closed ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                            )}
                                        >
                                            {schedule.closed ? "KAPALI" : "AÇIK"}
                                        </button>
                                    </div>

                                    {!schedule.closed && (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="time"
                                                value={schedule.open}
                                                onChange={(e) => setWorkingHours(prev => ({
                                                    ...prev,
                                                    [key]: { ...prev[key], open: e.target.value }
                                                }))}
                                                className="h-9 text-xs border-slate-200 rounded-lg text-center"
                                            />
                                            <span className="text-slate-400 text-xs">-</span>
                                            <Input
                                                type="time"
                                                value={schedule.close}
                                                onChange={(e) => setWorkingHours(prev => ({
                                                    ...prev,
                                                    [key]: { ...prev[key], close: e.target.value }
                                                }))}
                                                className="h-9 text-xs border-slate-200 rounded-lg text-center"
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </Card>
            </div>

            {/* Bottom Actions for Mobile */}
            <div className="fixed bottom-6 right-6 lg:hidden flex gap-4 pointer-events-none">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-14 w-14 rounded-full shadow-2xl bg-indigo-600 text-white pointer-events-auto flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                >
                    {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Settings2 className="h-6 w-6" />}
                </Button>
            </div>
        </div>
    )
}
