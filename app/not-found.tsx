import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-white mb-4">404</h1>
                <p className="text-xl text-slate-400 mb-8">Sayfa bulunamadı</p>
                <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:from-orange-500 hover:to-red-500 transition"
                >
                    Ana Sayfaya Dön
                </Link>
            </div>
        </div>
    )
}
