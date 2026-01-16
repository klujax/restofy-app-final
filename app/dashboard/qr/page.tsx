'use client'

import { useEffect, useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
    QrCode,
    Download,
    Printer,
    Coffee,
    Loader2,
    Smartphone,
    Palette,
    RotateCcw
} from 'lucide-react'

export default function QRCodePage() {
    const [userId, setUserId] = useState<string | null>(null)
    const [businessName, setBusinessName] = useState('')
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [savedQrColor, setSavedQrColor] = useState('#000000')
    const [qrColor, setQrColor] = useState('#000000')
    const [tableNumber, setTableNumber] = useState('')
    const [loading, setLoading] = useState(true)
    const printRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            setUserId(user.id)

            const { data } = await supabase
                .from('profiles')
                .select('business_name, logo_url, qr_color')
                .eq('id', user.id)
                .single()

            if (data) {
                setBusinessName(data.business_name || 'Kafe')
                setLogoUrl(data.logo_url)
                const color = data.qr_color || '#000000'
                setSavedQrColor(color)
                setQrColor(color)
            }
            setLoading(false)
        }
        fetchProfile()
    }, [supabase])

    // Construct menu URL
    const baseUrl = 'https://restofy-kafe.vercel.app'
    const menuUrl = userId
        ? `${baseUrl}/menu/${userId}${tableNumber ? `?table=${tableNumber}` : ''}`
        : ''

    const handleDownload = () => {
        if (!printRef.current) return

        const svg = printRef.current.querySelector('svg')
        if (!svg) return

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const size = 400
        canvas.width = size
        canvas.height = size

        const svgData = new XMLSerializer().serializeToString(svg)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const svgUrl = URL.createObjectURL(svgBlob)

        const img = new Image()
        img.onload = () => {
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, size, size)
            ctx.drawImage(img, 0, 0, size, size)

            const pngUrl = canvas.toDataURL('image/png')
            const downloadLink = document.createElement('a')
            downloadLink.href = pngUrl
            downloadLink.download = `qr-code${tableNumber ? `-masa-${tableNumber}` : ''}.png`
            document.body.appendChild(downloadLink)
            downloadLink.click()
            document.body.removeChild(downloadLink)

            URL.revokeObjectURL(svgUrl)
        }
        img.src = svgUrl
    }

    const handlePrint = () => {
        const printContent = document.getElementById('print-card')
        if (!printContent) return

        const printWindow = window.open('', '', 'width=400,height=600')
        if (!printWindow) return

        printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${businessName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: white;
            }
            .card {
              width: 300px;
              padding: 24px;
              border: 2px solid #e5e5e5;
              border-radius: 16px;
              text-align: center;
            }
            .logo { font-size: 32px; margin-bottom: 8px; }
            .cafe-name { font-size: 24px; font-weight: bold; margin-bottom: 16px; }
            .table-badge { 
              background: ${qrColor}; 
              color: white; 
              padding: 4px 12px; 
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 16px;
              display: inline-block;
            }
            .qr-wrapper { margin: 16px 0; }
            .instructions { 
              font-size: 14px; 
              color: #666; 
              margin-top: 16px;
              border-top: 1px solid #e5e5e5;
              padding-top: 16px;
            }
            .icon { font-size: 20px; margin-bottom: 4px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 250)
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
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <QrCode className="h-7 w-7" />
                    QR Kod Oluşturucu
                </h1>
                <p className="text-slate-500 mt-1">
                    Masalar için özel QR kodları oluşturun ve yazdırın.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Settings Panel */}
                <div className="space-y-6">
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-slate-800">Ayarlar</CardTitle>
                            <CardDescription className="text-slate-500">
                                QR kodunuzu özelleştirin
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="tableNumber" className="text-slate-700">Masa Numarası (Opsiyonel)</Label>
                                <Input
                                    id="tableNumber"
                                    placeholder="Örn: 1, 2, 3..."
                                    value={tableNumber}
                                    onChange={(e) => setTableNumber(e.target.value)}
                                    className="border-slate-200"
                                />
                                <p className="text-xs text-slate-500">
                                    Boş bırakırsanız genel menü QR kodu oluşturulur
                                </p>
                            </div>

                            <Separator className="bg-slate-100" />

                            {/* QR Color Picker */}
                            <div className="space-y-2">
                                <Label className="text-slate-700 flex items-center gap-2">
                                    <Palette className="h-4 w-4" />
                                    QR Kod Rengi
                                </Label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={qrColor}
                                        onChange={(e) => setQrColor(e.target.value)}
                                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-200 overflow-hidden"
                                        style={{ padding: 0 }}
                                    />
                                    <Input
                                        value={qrColor}
                                        onChange={(e) => setQrColor(e.target.value)}
                                        placeholder="#000000"
                                        className="w-28 font-mono uppercase border-slate-200"
                                        maxLength={7}
                                    />
                                    {qrColor !== savedQrColor && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setQrColor(savedQrColor)}
                                            className="text-xs gap-1"
                                        >
                                            <RotateCcw className="h-3 w-3" />
                                            Kayıtlıya Dön
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500">
                                    Kalıcı değişiklik için Ayarlar sayfasından kaydedin
                                </p>
                            </div>

                            <Separator className="bg-slate-100" />

                            <div className="space-y-2">
                                <Label className="text-slate-700">Menü Linki</Label>
                                <Input
                                    value={menuUrl}
                                    readOnly
                                    className="font-mono text-xs border-slate-200 bg-slate-50"
                                />
                            </div>

                            <Separator className="bg-slate-100" />

                            <div className="flex gap-2">
                                <Button onClick={handleDownload} className="flex-1 gap-2 bg-slate-900 hover:bg-slate-800">
                                    <Download className="h-4 w-4" />
                                    İndir (PNG)
                                </Button>
                                <Button onClick={handlePrint} variant="outline" className="flex-1 gap-2 border-slate-200">
                                    <Printer className="h-4 w-4" />
                                    Yazdır
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tips */}
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-slate-800">İpuçları</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-slate-500 space-y-2">
                            <p>• Her masa için ayrı QR kod oluşturun</p>
                            <p>• Yazdırıp lamine edin, daha uzun ömürlü olur</p>
                            <p>• Telefonunuzla test edin</p>
                            <p>• QR kodu masanın görünür bir yerine yerleştirin</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Live Preview */}
                <div>
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-slate-800">Önizleme</CardTitle>
                            <CardDescription className="text-slate-500">
                                Yazdırılacak kart tasarımı
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            {/* Printable Card */}
                            <div
                                id="print-card"
                                className="w-[300px] bg-white border-2 border-slate-200 rounded-2xl p-6 text-center shadow-lg"
                            >
                                {/* Logo/Icon */}
                                <div className="mb-2">
                                    {logoUrl ? (
                                        <img
                                            src={logoUrl}
                                            alt={businessName}
                                            className="h-12 w-12 mx-auto rounded-full object-cover"
                                        />
                                    ) : (
                                        <Coffee className="h-12 w-12 mx-auto" style={{ color: qrColor }} />
                                    )}
                                </div>

                                {/* Cafe Name */}
                                <h3 className="text-xl font-bold text-slate-800 mb-3">{businessName}</h3>

                                {/* Table Badge */}
                                {tableNumber && (
                                    <div
                                        className="inline-block text-white px-4 py-1 rounded-full text-sm font-semibold mb-4"
                                        style={{ backgroundColor: qrColor }}
                                    >
                                        Masa {tableNumber}
                                    </div>
                                )}

                                {/* QR Code */}
                                <div ref={printRef} className="flex justify-center my-4">
                                    <QRCodeSVG
                                        value={menuUrl || 'https://restofy.app'}
                                        size={180}
                                        level="H"
                                        fgColor={qrColor}
                                        includeMargin={false}
                                        imageSettings={logoUrl ? {
                                            src: logoUrl,
                                            height: 40,
                                            width: 40,
                                            excavate: true,
                                        } : undefined}
                                    />
                                </div>

                                {/* Instructions */}
                                <div className="border-t border-slate-200 pt-4 mt-4">
                                    <Smartphone className="h-5 w-5 mx-auto mb-2 text-slate-400" />
                                    <p className="text-sm text-slate-500">
                                        Menü ve Sipariş için Okutun
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
