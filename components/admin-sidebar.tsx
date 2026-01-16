"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button" // Not used yet
import { LayoutDashboard, Menu, BarChart3, Settings, Coffee } from "lucide-react"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Menu, label: "Menu Manager", href: "/dashboard/menu" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Coffee className="h-6 w-6" />
          <span className="">Restofy</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                pathname === item.href
                  ? "bg-muted text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
