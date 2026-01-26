'use client'

export default function GlobalError({
    reset,
}: {
    reset: () => void
}) {
    return (
        <html>
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <h2 className="text-2xl font-bold mb-4">Bir şeyler yanlış gitti!</h2>
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800"
                    >
                        Tekrar Dene
                    </button>
                </div>
            </body>
        </html>
    )
}
