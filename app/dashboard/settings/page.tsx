'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
    Store,
    Palette,
    Upload,
    Loader2,
    Save,
    ImageIcon,
    X,
    Wifi,
    Check,
    Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

const THEME_COLORS = [
    { name: 'Turuncu', value: '#f97316', gradient: 'from-orange-500 to-red-600' },
    { name: 'Mavi', value: '#3b82f6', gradient: 'from-blue-500 to-indigo-600' },
    { name: 'Yeşil', value: '#10b981', gradient: 'from-emerald-500 to-teal-600' },
    { name: 'Mor', value: '#8b5cf6', gradient: 'from-violet-500 to-purple-600' },
    { name: 'Pembe', value: '#ec4899', gradient: 'from-pink-500 to-rose-600' },
    { name: 'Kırmızı', value: '#ef4444', gradient: 'from-red-500 to-rose-600' },
    { name: 'Amber', value: '#f59e0b', gradient: 'from-amber-500 to-orange-600' },
    { name: 'Cyan', value: '#06b6d4', gradient: 'from-cyan-500 to-blue-600' },
]

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [businessName, setBusinessName] = useState('')
    const [description, setDescription] = useState('')
    const [themeColor, setThemeColor] = useState('#f97316')
    const [qrColor, setQrColor] = useState('#000000')
    const [wifiPassword, setWifiPassword] = useState('')
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (data) {
                setBusinessName(data.business_name || '')
                setDescription(data.description || '')
                setThemeColor(data.theme_color || '#f97316')
                setQrColor(data.qr_color || '#000000')
                setWifiPassword(data.wifi_password || '')
                setLogoUrl(data.logo_url)
            }
            setLoading(false)
        }
        fetchProfile()
    }, [supabase])

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
            if (!user) throw new Error('Not authenticated')

            let newLogoUrl = logoUrl
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop()
                const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`
                await supabase.storage.from('avatars').upload(fileName, logoFile, { upsert: true })
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
                newLogoUrl = urlData.publicUrl
            }

            await supabase
                .from('profiles')
                .update({
                    business_name: businessName,
                    description,
                    theme_color: themeColor,
                    qr_color: qrColor,
                    wifi_password: wifiPassword,
                    logo_url: newLogoUrl,
                })
                .eq('id', user.id)

            setLogoUrl(newLogoUrl)
            setLogoFile(null)
            setLogoPreview(null)
            toast.success('Ayarlar kaydedildi!')
        } catch (error) {
            console.error(error)
            toast.error('Kaydetme hatası')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        )
    }

    const currentLogo = logoPreview || logoUrl
    const selectedColor = THEME_COLORS.find(c => c.value === themeColor)

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-orange-400" />
                    İşletme Ayarları
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    Kafenizin görünümünü kişiselleştirin
                </p>
            </div>

            {/* Logo & Name Section */}
            <Card className="bg-slate-800/30 border-white/5 p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Logo */}
                    <div className="shrink-0">
                        <div
                            className="relative h-32 w-32 rounded-3xl overflow-hidden cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                background: currentLogo
                                    ? 'transparent'
                                    : `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`
                            }}
                        >
                            {currentLogo ? (
                                <img src={currentLogo} alt="Logo" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    <span className="text-5xl font-bold text-white">
                                        {businessName.charAt(0).toUpperCase() || 'K'}
                                    </span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Upload className="h-8 w-8 text-white" />
                            </div>
                            {logoPreview && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setLogoFile(null); setLogoPreview(null) }}
                                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center"
                                >
                                    <X className="h-4 w-4 text-white" />
                                </button>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        <p className="text-xs text-slate-500 text-center mt-2">Tıklayarak değiştir</p>
                    </div>

                    {/* Name & Description */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <Label className="text-slate-300 mb-2 block">İşletme Adı</Label>
                            <Input
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                placeholder="Keyifli Kahve"
                                className="bg-white/5 border-white/10 text-white h-12 rounded-xl text-lg"
                            />
                        </div>
                        <div>
                            <Label className="text-slate-300 mb-2 block">Slogan / Açıklama</Label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="1990'dan beri kaliteli kahve"
                                className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Theme Color */}
            <Card className="bg-slate-800/30 border-white/5 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${selectedColor?.gradient || 'from-orange-500 to-red-600'} flex items-center justify-center`}>
                        <Palette className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Tema Rengi</h3>
                        <p className="text-sm text-slate-400">Müşteri menüsünde kullanılacak renk</p>
                    </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {THEME_COLORS.map((color) => (
                        <button
                            key={color.value}
                            onClick={() => setThemeColor(color.value)}
                            className={`relative h-14 rounded-2xl bg-gradient-to-br ${color.gradient} transition-all hover:scale-105 ${themeColor === color.value ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105' : ''
                                }`}
                        >
                            {themeColor === color.value && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Check className="h-6 w-6 text-white drop-shadow" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </Card>

            {/* QR Color & WiFi */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-slate-800/30 border-white/5 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-700 flex items-center justify-center">
                            <div className="h-5 w-5 rounded" style={{ backgroundColor: qrColor }} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">QR Kod Rengi</h3>
                            <p className="text-sm text-slate-400">QR kodların ön plan rengi</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={qrColor}
                            onChange={(e) => setQrColor(e.target.value)}
                            className="w-16 h-16 rounded-xl cursor-pointer border-0 bg-transparent"
                        />
                        <Input
                            value={qrColor}
                            onChange={(e) => setQrColor(e.target.value)}
                            className="w-28 font-mono uppercase bg-white/5 border-white/10 text-white"
                            maxLength={7}
                        />
                    </div>
                </Card>

                <Card className="bg-slate-800/30 border-white/5 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Wifi className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">WiFi Şifresi</h3>
                            <p className="text-sm text-slate-400">Müşterilere gösterilecek</p>
                        </div>
                    </div>
                    <Input
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        placeholder="wifi12345"
                        className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                    />
                </Card>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-12 px-8 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-xl text-lg font-semibold gap-2 shadow-lg shadow-orange-500/25"
                >
                    {saving ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Save className="h-5 w-5" />
                    )}
                    Kaydet
                </Button>
            </div>
        </div>
    )
}
