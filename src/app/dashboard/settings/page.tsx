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
    ArrowRight
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
                    <Loader2 className="h-8 w-8 animate-spin text-white absolute inset-0 m-auto" />
                </div>
            </div>
        )
    }

    const currentLogo = logoPreview || logoUrl
    const selectedColor = THEME_COLORS.find(c => c.value === themeColor)

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-32 px-4 animate-in fade-in duration-700">
            {/* Header Section with Glow Effect */}
            <div className="relative px-2">
                <div className="absolute -top-24 -left-24 h-64 w-64 bg-indigo-600/10 blur-[100px] rounded-full" />
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                            <span className="text-[10px] font-black tracking-[0.2em] text-indigo-300 uppercase">Premium Kontrol Paneli</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
                            Marka <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Kimliği</span>
                        </h1>
                        <p className="text-indigo-100/60 text-lg font-medium max-w-xl leading-relaxed">
                            Müşterilerinizin göreceği menü tasarımını ve işletme detaylarını buradan kişiselleştirin.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* Branding Column */}
                <div className="xl:col-span-8 space-y-10">
                    {/* Visual Card */}
                    <Card className="bg-[#0b0e1b]/60 border-indigo-500/10 backdrop-blur-2xl p-10 relative overflow-hidden group shadow-2xl">
                        {/* Decorative Background Glows */}
                        <div className={`absolute top-0 right-0 h-40 w-40 bg-gradient-to-br ${selectedColor?.gradient} opacity-[0.03] group-hover:opacity-[0.07] transition-opacity blur-3xl`} />
                        <div className="absolute bottom-0 left-0 h-40 w-40 bg-indigo-500/5 blur-3xl rounded-full translate-y-20 -translate-x-20" />

                        <div className="flex flex-col lg:flex-row gap-12 relative z-10">
                            {/* Logo Unit */}
                            <div className="flex flex-col items-center gap-6">
                                <div className="space-y-1.5 text-center">
                                    <Label className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] block">MARKA İKONU</Label>
                                    <div className="h-1 w-8 bg-indigo-500/30 mx-auto rounded-full" />
                                </div>

                                <div
                                    className="relative h-48 w-48 rounded-[3rem] overflow-hidden cursor-pointer shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-700 hover:rounded-[2rem] group/logo border-2 border-white/5 active:scale-95"
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        background: currentLogo
                                            ? '#05070a'
                                            : `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)`
                                    }}
                                >
                                    {currentLogo ? (
                                        <Image
                                            src={currentLogo}
                                            alt="Logo"
                                            fill
                                            className="object-cover scale-105 group-hover/logo:scale-100 transition-transform duration-1000"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center opacity-40 group-hover/logo:opacity-100 transition-opacity">
                                            <Building2 size={80} className="text-white drop-shadow-2xl" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-indigo-950/60 opacity-0 group-hover/logo:opacity-100 transition-all duration-500 flex flex-col items-center justify-center backdrop-blur-md">
                                        <div className="p-3 rounded-2xl bg-white/10 border border-white/20 mb-3 transform -translate-y-4 group-hover/logo:translate-y-0 transition-transform duration-500">
                                            <Upload className="h-6 w-6 text-white" />
                                        </div>
                                        <span className="text-[10px] font-black text-white tracking-widest uppercase">Görseli Değiştir</span>
                                    </div>
                                    {logoPreview && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setLogoFile(null); setLogoPreview(null) }}
                                            className="absolute top-4 right-4 h-8 w-8 rounded-2xl bg-red-500/90 text-white flex items-center justify-center shadow-xl border border-white/20 transition-all hover:scale-110 active:scale-90 z-20"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                <p className="text-[11px] text-indigo-200/40 font-bold uppercase tracking-widest">Format: PNG, JPG (Maks 2MB)</p>
                            </div>

                            {/* Core Data Fields */}
                            <div className="flex-1 w-full space-y-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Settings2 className="h-4 w-4 text-indigo-400/80" />
                                        <Label className="text-indigo-50 font-black text-xs uppercase tracking-widest">İşletme Kimliği</Label>
                                    </div>
                                    <div className="space-y-1">
                                        <Input
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            placeholder="İşletme Adı"
                                            className="bg-indigo-950/20 border-white/5 hover:border-indigo-500/30 focus:border-indigo-400/50 text-white placeholder:text-indigo-300/20 h-16 rounded-[1.25rem] text-2xl font-black transition-all px-8 border-2 shadow-inner outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Input
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Slogan veya kısa tanıtım metni..."
                                            className="bg-indigo-950/20 border-white/5 hover:border-indigo-500/20 focus:border-indigo-400/40 text-indigo-100 placeholder:text-indigo-300/20 h-14 rounded-xl transition-all px-6 border-b-2"
                                        />
                                    </div>
                                </div>

                                {/* Divider Styling */}
                                <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" />

                                {/* Connectivity Area */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                                    <div className="space-y-4 bg-white/[0.02] p-6 rounded-3xl border border-white/5 shadow-xl transition-colors hover:border-indigo-500/10">
                                        <Label className="text-blue-50 font-bold text-[11px] uppercase tracking-widest flex items-center gap-2">
                                            <Wifi className="h-4 w-4 text-cyan-400" />
                                            WiFi Erişimi
                                        </Label>
                                        <Input
                                            value={wifiPassword}
                                            onChange={(e) => setWifiPassword(e.target.value)}
                                            placeholder="Şifre Belirleyin"
                                            className="bg-[#05070a]/50 border-white/5 hover:border-blue-500/20 text-blue-50 placeholder:text-indigo-300/20 h-12 rounded-xl border-2 transition-all px-4 font-mono text-sm tracking-widest"
                                        />
                                    </div>
                                    <div className="space-y-4 bg-white/[0.02] p-6 rounded-3xl border border-white/5 shadow-xl transition-colors hover:border-emerald-500/10">
                                        <Label className="text-emerald-50 font-bold text-[11px] uppercase tracking-widest flex items-center gap-2">
                                            <QrCode className="h-4 w-4 text-emerald-400" />
                                            QR Estetiği
                                        </Label>
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-12 w-12 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl active:scale-95 transition-transform shrink-0">
                                                <input
                                                    type="color"
                                                    value={qrColor}
                                                    onChange={(e) => setQrColor(e.target.value)}
                                                    className="absolute inset-0 w-[300%] h-[300%] -translate-x-1/3 -translate-y-1/3 cursor-pointer border-0 bg-transparent scale-150"
                                                />
                                            </div>
                                            <Input
                                                value={qrColor}
                                                onChange={(e) => setQrColor(e.target.value)}
                                                className="font-mono uppercase bg-[#05070a]/50 border-white/5 text-emerald-50 h-12 rounded-xl text-center border-2 tracking-[0.2em] text-xs font-black"
                                                maxLength={7}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Theme Customization Grid */}
                    <Card className="bg-[#0b0e1b]/40 border-indigo-500/10 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className={cn(
                                "p-3 rounded-2xl shadow-2xl transition-all duration-700",
                                selectedColor?.gradient || "from-indigo-600 to-cyan-600",
                                selectedColor?.glow
                            )}>
                                <Palette className="h-6 w-6 text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="font-black text-white text-xl tracking-tight">Kullanıcı Arayüzü Tonlaması</h3>
                                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em]">Menü Renk Teması • 8 Varyasyon</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-4">
                            {THEME_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    onClick={() => setThemeColor(color.value)}
                                    className={cn(
                                        "relative h-16 rounded-2xl transition-all duration-500 hover:scale-110 active:scale-90 shadow-lg",
                                        "bg-gradient-to-br", color.gradient,
                                        themeColor === color.value
                                            ? "ring-4 ring-white/20 ring-offset-4 ring-offset-[#0b0e1b] scale-110 shadow-2xl"
                                            : "opacity-40 hover:opacity-100 grayscale-[0.3] hover:grayscale-0"
                                    )}
                                >
                                    {themeColor === color.value && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/10 rounded-2xl">
                                            <div className="h-2 w-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_white]" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Scheduler Sidebar */}
                <div className="xl:col-span-4 h-full">
                    <Card className="bg-[#0b0e1b]/60 border-indigo-500/10 backdrop-blur-2xl h-full flex flex-col overflow-hidden shadow-2xl border-2 rounded-[2.5rem]">
                        <div className="p-8 bg-indigo-500/5 border-b border-white/5 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-xl shadow-indigo-500/20">
                                    <CalendarDays className="h-6 w-6 text-white" />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="font-black text-white text-xl tracking-tight">Zaman Planlama</h3>
                                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em]">7 Günlük Operasyonel Takvim</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {DAY_NAMES.map(({ key, label }) => {
                                const schedule = workingHours[key]
                                return (
                                    <div key={key} className={cn(
                                        "flex flex-col gap-5 p-6 rounded-[2rem] border-2 transition-all duration-500 relative overflow-hidden group/day leading-none ",
                                        schedule.closed
                                            ? "bg-[#05070a]/40 border-red-500/5 grayscale-[0.6] opacity-40 hover:opacity-60"
                                            : "bg-white/[0.02] border-indigo-500/5 hover:border-indigo-500/20 hover:bg-white/[0.04]"
                                    )}>
                                        <div className="flex items-center justify-between relative z-10">
                                            <span className={cn(
                                                "font-black text-xs uppercase tracking-widest",
                                                schedule.closed ? "text-indigo-200/30" : "text-white/90"
                                            )}>{label}</span>

                                            <button
                                                type="button"
                                                onClick={() => setWorkingHours(prev => ({
                                                    ...prev,
                                                    [key]: { ...prev[key], closed: !prev[key].closed }
                                                }))}
                                                className="transition-all active:scale-75"
                                            >
                                                {schedule.closed ? (
                                                    <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-red-950/20 border border-red-500/10">
                                                        <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">TATİL</span>
                                                        <div className="h-5 w-5 rounded-full bg-red-500/20 flex items-center justify-center">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">MESAİ</span>
                                                        <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        </div>

                                        {!schedule.closed && (
                                            <div className="flex items-center gap-4 mt-2 relative z-10">
                                                <div className="flex-1 space-y-2 bg-black/40 p-4 rounded-2xl border border-white/5 shadow-inner group/input-cell">
                                                    <span className="text-[8px] font-black text-indigo-400/40 uppercase tracking-[0.2em] block pl-1">Açılış</span>
                                                    <Input
                                                        type="time"
                                                        value={schedule.open}
                                                        onChange={(e) => setWorkingHours(prev => ({
                                                            ...prev,
                                                            [key]: { ...prev[key], open: e.target.value }
                                                        }))}
                                                        className="h-10 bg-transparent border-none text-white rounded-lg text-lg font-black font-mono text-center focus:ring-0 p-0"
                                                    />
                                                </div>
                                                <div className="h-10 w-px bg-white/5 self-end mb-2" />
                                                <div className="flex-1 space-y-2 bg-black/40 p-4 rounded-2xl border border-white/5 shadow-inner group/input-cell">
                                                    <span className="text-[8px] font-black text-indigo-400/40 uppercase tracking-[0.2em] block pl-1">Kapanış</span>
                                                    <Input
                                                        type="time"
                                                        value={schedule.close}
                                                        onChange={(e) => setWorkingHours(prev => ({
                                                            ...prev,
                                                            [key]: { ...prev[key], close: e.target.value }
                                                        }))}
                                                        className="h-10 bg-transparent border-none text-white rounded-lg text-lg font-black font-mono text-center focus:ring-0 p-0"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Bottom Floating Operations Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-10 flex justify-end pointer-events-none z-50">
                <div className="pointer-events-auto relative group">
                    <div className="absolute inset-0 bg-white blur-3xl opacity-0 group-hover:opacity-10 transition-opacity" />
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className={cn(
                            "h-20 px-14 rounded-3xl text-2xl font-black gap-6 shadow-2xl transition-all duration-700 border-2 overflow-hidden",
                            saving
                                ? "bg-indigo-950/50 border-white/5 text-indigo-200"
                                : "bg-white text-black hover:bg-indigo-100 hover:scale-110 active:scale-90 border-white"
                        )}
                    >
                        <div className="flex items-center gap-5 relative z-10">
                            {saving ? (
                                <Loader2 className="h-8 w-8 animate-spin" />
                            ) : (
                                <div className="h-10 w-10 flex items-center justify-center bg-black/5 rounded-2xl group-hover:bg-indigo-500/10 transition-colors">
                                    <MonitorIcon className="h-6 w-6" />
                                </div>
                            )}
                            <div className="flex flex-col items-start leading-none gap-1">
                                <span className="tracking-tighter text-sm font-black uppercase opacity-40">Değişiklikleri Onayla</span>
                                <span className="tracking-tighter uppercase">{saving ? "YAYINLANIYOR..." : "AYARLARI YAYINLA"}</span>
                            </div>
                            {!saving && <ArrowRight className="h-6 w-6 animate-bounce-x" />}
                        </div>
                    </Button>
                </div>
            </div>

            <style jsx global>{`
                @keyframes bounce-x {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(10px); }
                }
                .animate-bounce-x {
                    animation: bounce-x 1.5s infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(99, 102, 241, 0.3);
                }
            `}</style>
        </div>
    )
}
