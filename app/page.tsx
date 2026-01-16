import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Coffee, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="mx-auto mb-8 h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
          <Coffee className="h-10 w-10 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-slate-800 mb-3">Restofy</h1>
        <p className="text-slate-500 mb-10 text-lg">
          Kafeniz için dijital menü ve sipariş yönetimi
        </p>

        {/* CTA Button */}
        <Link href="/login">
          <Button
            size="lg"
            className="w-full max-w-xs h-14 text-lg font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 gap-2"
          >
            Kafe Girişi
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>

        {/* Footer */}
        <p className="mt-8 text-sm text-slate-400">
          Kafe sahipleri için tasarlandı
        </p>
      </div>
    </div>
  )
}
