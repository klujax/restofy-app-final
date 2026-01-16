'use client'

import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Download, Link, QrCode, Copy, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const COLOR_PRESETS = [
    { fg: '#000000', bg: '#FFFFFF', name: 'Classic' },
    { fg: '#1a1a2e', bg: '#FFFFFF', name: 'Dark Blue' },
    { fg: '#16a34a', bg: '#FFFFFF', name: 'Green' },
    { fg: '#dc2626', bg: '#FFFFFF', name: 'Red' },
    { fg: '#7c3aed', bg: '#FFFFFF', name: 'Purple' },
    { fg: '#FFFFFF', bg: '#000000', name: 'Inverted' },
]

export default function QRCodePage() {
    const [userId, setUserId] = useState<string | null>(null)
    const [tableNumber, setTableNumber] = useState('')
    const [fgColor, setFgColor] = useState('#000000')
    const [bgColor, setBgColor] = useState('#FFFFFF')
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(true)
    const qrRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
            }
            setLoading(false)
        }
        getUser()
    }, [supabase])

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const menuUrl = userId
        ? `${baseUrl}/menu/${userId}${tableNumber ? `?table=${tableNumber}` : ''}`
        : ''

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(menuUrl)
            setCopied(true)
            toast.success('URL copied to clipboard!')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error('Failed to copy URL')
        }
    }

    const downloadQRCode = () => {
        if (!qrRef.current) return

        const svg = qrRef.current.querySelector('svg')
        if (!svg) return

        // Create a canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const size = 400
        canvas.width = size
        canvas.height = size

        // Convert SVG to data URL
        const svgData = new XMLSerializer().serializeToString(svg)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const svgUrl = URL.createObjectURL(svgBlob)

        const img = new Image()
        img.onload = () => {
            // Fill background
            ctx.fillStyle = bgColor
            ctx.fillRect(0, 0, size, size)

            // Draw QR code
            ctx.drawImage(img, 0, 0, size, size)

            // Download
            const pngUrl = canvas.toDataURL('image/png')
            const downloadLink = document.createElement('a')
            downloadLink.href = pngUrl
            downloadLink.download = `qr-code${tableNumber ? `-table-${tableNumber}` : ''}.png`
            document.body.appendChild(downloadLink)
            downloadLink.click()
            document.body.removeChild(downloadLink)

            URL.revokeObjectURL(svgUrl)
            toast.success('QR Code downloaded!')
        }
        img.src = svgUrl
    }

    const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
        setFgColor(preset.fg)
        setBgColor(preset.bg)
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
            <div>
                <h2 className="text-3xl font-bold tracking-tight">QR Code Settings</h2>
                <p className="text-muted-foreground">
                    Generate and customize QR codes for your menu.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* QR Code Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="h-5 w-5" />
                            Your Menu QR Code
                        </CardTitle>
                        <CardDescription>
                            Customers can scan this to view your menu
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-6">
                        <div
                            ref={qrRef}
                            className="p-6 rounded-xl shadow-lg"
                            style={{ backgroundColor: bgColor }}
                        >
                            <QRCodeSVG
                                value={menuUrl || 'https://restofy.app'}
                                size={200}
                                fgColor={fgColor}
                                bgColor={bgColor}
                                level="H"
                                includeMargin={false}
                            />
                        </div>

                        {/* URL Display */}
                        <div className="w-full space-y-2">
                            <Label className="text-sm text-muted-foreground flex items-center gap-1">
                                <Link className="h-3 w-3" />
                                Menu URL
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    value={menuUrl}
                                    readOnly
                                    className="font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={copyToClipboard}
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Download Button */}
                        <Button onClick={downloadQRCode} className="w-full gap-2">
                            <Download className="h-4 w-4" />
                            Download QR Code (PNG)
                        </Button>
                    </CardContent>
                </Card>

                {/* Customization Options */}
                <div className="space-y-6">
                    {/* Table Number */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Table-Specific QR</CardTitle>
                            <CardDescription>
                                Generate QR codes pre-filled with a table number
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="tableNumber">Table Number (optional)</Label>
                                <Input
                                    id="tableNumber"
                                    placeholder="e.g., 5"
                                    value={tableNumber}
                                    onChange={(e) => setTableNumber(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty for a general menu QR code
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Color Customization */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Color Customization</CardTitle>
                            <CardDescription>
                                Match your QR code to your brand
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Color Presets */}
                            <div className="space-y-2">
                                <Label>Color Presets</Label>
                                <div className="flex flex-wrap gap-2">
                                    {COLOR_PRESETS.map((preset) => (
                                        <button
                                            key={preset.name}
                                            onClick={() => applyPreset(preset)}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border hover:border-primary transition-colors"
                                            title={preset.name}
                                        >
                                            <div
                                                className="w-4 h-4 rounded border"
                                                style={{ backgroundColor: preset.fg }}
                                            />
                                            <span className="text-sm">{preset.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Custom Colors */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fgColor">Foreground Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="fgColor"
                                            type="color"
                                            value={fgColor}
                                            onChange={(e) => setFgColor(e.target.value)}
                                            className="w-12 h-10 p-1 cursor-pointer"
                                        />
                                        <Input
                                            value={fgColor}
                                            onChange={(e) => setFgColor(e.target.value)}
                                            placeholder="#000000"
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bgColor">Background Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="bgColor"
                                            type="color"
                                            value={bgColor}
                                            onChange={(e) => setBgColor(e.target.value)}
                                            className="w-12 h-10 p-1 cursor-pointer"
                                        />
                                        <Input
                                            value={bgColor}
                                            onChange={(e) => setBgColor(e.target.value)}
                                            placeholder="#FFFFFF"
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tips */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <p>• Print each table&apos;s QR code with their table number</p>
                            <p>• Use high contrast colors for better scanning</p>
                            <p>• Test the QR code with your phone before printing</p>
                            <p>• Laminate printed codes for durability</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
