'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-white mb-4">Hata</h1>
                <p className="text-xl text-slate-400 mb-8">Bir şeyler yanlış gitti</p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition"
                    >
                        Tekrar Dene
                    </button>
                    <Link
                        href="/"
                        className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:from-orange-500 hover:to-red-500 transition"
                    >
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        </div>
    )
}
