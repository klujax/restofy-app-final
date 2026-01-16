import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <h1 className="text-4xl font-bold mb-4">Restofy Kafe</h1>
      <p className="text-muted-foreground mb-8 text-lg">
        The ultimate SaaS platform for cafes.
      </p>
      <div className="flex gap-4">
        <Link href="/admin">
          <Button size="lg">Owner Login</Button>
        </Link>
        <Link href="/demo-cafe">
          <Button variant="outline" size="lg">View Demo Menu</Button>
        </Link>
      </div>
    </div>
  )
}
