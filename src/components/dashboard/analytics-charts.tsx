'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    Sector
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import { Activity, TrendingUp, ShoppingBag, PieChart as PieIcon } from 'lucide-react'

const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b', '#3b82f6', '#10b981']

interface AnalyticsChartsProps {
    orders: any[]
    restaurants: { id: string; name: string }[]
    hideDistribution?: boolean
}

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label, prefix = '', labelFormatter = (l: string) => l }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-md text-sm">
                <p className="font-semibold text-slate-700 mb-1">{labelFormatter(label || '')}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={`item-${index}`} className="text-slate-600" style={{ color: entry.color }}>
                        {entry.name}: <span className="font-bold">{prefix}{entry.value.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                    </p>
                ))}
            </div>
        )
    }
    return null
}

// Custom Active Shape for Pie Chart
const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props
    const sin = Math.sin(-RADIAN * midAngle)
    const cos = Math.cos(-RADIAN * midAngle)
    const sx = cx + (outerRadius + 10) * cos
    const sy = cy + (outerRadius + 10) * sin
    const mx = cx + (outerRadius + 30) * cos
    const my = cy + (outerRadius + 30) * sin
    const ex = mx + (cos >= 0 ? 1 : -1) * 22
    const ey = my
    const textAnchor = cos >= 0 ? 'start' : 'end'

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold text-lg">
                {payload.name}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 6}
                outerRadius={outerRadius + 10}
                fill={fill}
            />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={3} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}</text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
                {`(${(percent * 100).toFixed(2)}%)`}
            </text>
        </g>
    )
}

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly'

export function AnalyticsCharts({ orders, restaurants, hideDistribution = false }: AnalyticsChartsProps) {
    const [activeIndex, setActiveIndex] = useState(0)
    const [range, setRange] = useState<TimeRange>('daily')

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index)
    }

    // --- Dynamic Data Processing ---

    // 1. Get filtered orders based on the current window
    const now = new Date()
    const filteredOrders = orders.filter(o => {
        const date = new Date(o.created_at)
        if (range === 'daily') {
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(now.getDate() - 7)
            return date >= sevenDaysAgo
        } else if (range === 'weekly') {
            const eightWeeksAgo = new Date()
            eightWeeksAgo.setDate(now.getDate() - 8 * 7)
            return date >= eightWeeksAgo
        } else if (range === 'monthly') {
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setMonth(now.getMonth() - 6)
            return date >= sixMonthsAgo
        } else if (range === 'yearly') {
            const oneYearAgo = new Date()
            oneYearAgo.setFullYear(now.getFullYear() - 1)
            return date >= oneYearAgo
        }
        return true
    })

    // 2. Prepare Data for Range Charts
    const getChartData = () => {
        const dataMap: Record<string, { label: string, revenue: number, orders: number }> = {}
        const items: { label: string, date: Date }[] = []

        if (range === 'daily') {
            for (let i = 6; i >= 0; i--) {
                const d = new Date()
                d.setDate(now.getDate() - i)
                items.push({
                    label: d.toLocaleDateString('tr-TR', { weekday: 'short' }),
                    date: d
                })
            }
        } else if (range === 'weekly') {
            for (let i = 7; i >= 0; i--) {
                const d = new Date()
                d.setDate(now.getDate() - i * 7)
                // Get week start
                const start = new Date(d)
                start.setDate(d.getDate() - d.getDay())
                items.push({
                    label: `${start.getDate()}/${start.getMonth() + 1}`,
                    date: start
                })
            }
        } else if (range === 'monthly') {
            for (let i = 5; i >= 0; i--) {
                const d = new Date()
                d.setMonth(now.getMonth() - i)
                items.push({
                    label: d.toLocaleDateString('tr-TR', { month: 'short' }),
                    date: d
                })
            }
        } else if (range === 'yearly') {
            // Just quarters or last 12 months (let's do 12 months for yearly to be detailed)
            for (let i = 11; i >= 0; i--) {
                const d = new Date()
                d.setMonth(now.getMonth() - i)
                items.push({
                    label: d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' }),
                    date: d
                })
            }
        }

        items.forEach(item => {
            dataMap[item.label] = { label: item.label, revenue: 0, orders: 0 }
        })

        filteredOrders.forEach(o => {
            const d = new Date(o.created_at)
            let key = ''
            if (range === 'daily') key = d.toLocaleDateString('tr-TR', { weekday: 'short' })
            else if (range === 'weekly') {
                const start = new Date(d)
                start.setDate(d.getDate() - d.getDay())
                key = `${start.getDate()}/${start.getMonth() + 1}`
            }
            else if (range === 'monthly' || range === 'yearly') {
                key = d.toLocaleDateString('tr-TR', range === 'yearly' ? { month: 'short', year: '2-digit' } : { month: 'short' })
            }

            if (dataMap[key]) {
                dataMap[key].revenue += (Number(o.total_amount) || 0)
                dataMap[key].orders += 1
            }
        })

        return Object.values(dataMap).map(d => ({
            ...d,
            date: d.label,
            avgOrder: d.orders > 0 ? d.revenue / d.orders : 0
        }))
    }

    const chartData = getChartData()

    // 3. Distribution (Pie)
    const revenueByRestaurant = restaurants.map(r => {
        const rOrders = filteredOrders.filter(o => o.restaurant_id === r.id)
        const revenue = rOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
        return { name: r.name, value: revenue }
    }).filter(d => d.value > 0)

    // 4. Top Selling Items
    const allItems: any[] = []
    filteredOrders.forEach(o => {
        if (o.order_items && Array.isArray(o.order_items)) {
            o.order_items.forEach((item: any) => {
                allItems.push(item)
            })
        }
    })

    const itemSales: Record<string, number> = {}
    allItems.forEach(item => {
        const name = item.menu_item_name || item.name || 'Bilinmeyen Ürün'
        itemSales[name] = (itemSales[name] || 0) + (item.quantity || 1)
    })

    const topItems = Object.entries(itemSales)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

    const ranges: { id: TimeRange, label: string }[] = [
        { id: 'daily', label: 'Günlük' },
        { id: 'weekly', label: 'Haftalık' },
        { id: 'monthly', label: 'Aylık' },
        { id: 'yearly', label: 'Yıllık' }
    ]

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Performans Merkezi</h2>
                    <p className="text-slate-500 mt-1">
                        {hideDistribution ? 'İşletmenizin detaylı finansal röntgeni' : 'Tüm işletmelerinizin detaylı finansal röntgeni'}
                    </p>
                </div>
                <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto max-w-full">
                    {ranges.map(r => (
                        <button
                            key={r.id}
                            onClick={() => setRange(r.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${range === r.id
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* 1. Main Revenue Chart (Big Area) */}
                <Card className="lg:col-span-8 shadow-xl shadow-slate-200/50 border-white/50 hover:shadow-2xl hover:shadow-indigo-200/50 transition-all duration-500 group overflow-hidden bg-white/80 backdrop-blur-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="h-48 w-48 text-indigo-600 rotate-6" />
                    </div>
                    <CardHeader className="pb-2 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
                                    <Activity className="h-5 w-5 text-indigo-500 animate-pulse" />
                                    Gelir Akışı
                                </CardTitle>
                                <CardDescription className="text-slate-400 font-medium">
                                    {range === 'daily' ? 'Son 7 gün' : range === 'weekly' ? 'Son 8 hafta' : range === 'monthly' ? 'Son 6 ay' : 'Son 12 ay'}
                                </CardDescription>
                            </div>
                            <div className="bg-indigo-500/10 px-4 py-2 rounded-2xl border border-indigo-100 backdrop-blur-sm shadow-sm group-hover:scale-105 transition-transform">
                                <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest">Dönemlik Ciro</p>
                                <p className="text-3xl font-black text-indigo-600">
                                    ₺{chartData.reduce((a, b) => a + b.revenue, 0).toLocaleString('tr-TR')}
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[400px] relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenueModern" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={15}
                                />
                                <YAxis
                                    tick={{ fill: '#94a3b8', fontSize: 13 }}
                                    tickFormatter={(val) => `₺${val}`}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip prefix="₺" />} />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#6366f1"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorRevenueModern)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 2. Items Leaderboard (Side List) */}
                <Card className="lg:col-span-4 shadow-sm border-slate-100 bg-slate-50/50 backdrop-blur-sm group hover:bg-white transition-all">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-emerald-500" />
                            Lider Ürünler
                        </CardTitle>
                        <CardDescription>Bu dönemin en popüler 5 ürünü</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-5">
                            {topItems.map((item, index) => (
                                <div key={item.name} className="relative group/item">
                                    <div className="flex mb-1.5 items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold group-hover/item:scale-110 transition-transform">
                                                {index + 1}
                                            </span>
                                            <span className="text-sm font-bold text-slate-700">
                                                {item.name}
                                            </span>
                                        </div>
                                        <span className="text-sm font-black text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">
                                            {item.count}
                                        </span>
                                    </div>
                                    <div className="overflow-hidden h-1.5 flex rounded-full bg-slate-200/50">
                                        <div
                                            style={{ width: `${(item.count / (topItems[0]?.count || 1)) * 100}%` }}
                                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-out"
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {topItems.length === 0 && (
                                <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-2">
                                    <ShoppingBag className="h-8 w-8 opacity-20" />
                                    <span>Henüz satış verisi yok</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Price Analysis (Average Order Value Trend) */}
                <Card className="lg:col-span-12 shadow-sm border-slate-100 overflow-hidden bg-white hover:shadow-lg transition-all">
                    <CardHeader className="pb-0">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Activity className="h-5 w-5 text-pink-500" />
                            Fiyat Analizi (Ortalama Sepet Tutarı)
                        </CardTitle>
                        <CardDescription>Sipariş başına düşen ortalama harcama trendi</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="label" hide />
                                <YAxis hide />
                                <Tooltip content={<CustomTooltip prefix="₺" label="Ort. Sepet" />} />
                                <Area
                                    type="monotone"
                                    dataKey="avgOrder"
                                    stroke="#ec4899"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorAvg)"
                                    dot={{ r: 4, fill: '#ec4899', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6, fill: '#ec4899', strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 4. Interactive Donut Chart (Show only if not single restaurant) */}
                {!hideDistribution && revenueByRestaurant.length > 0 && (
                    <Card className="lg:col-span-6 shadow-sm border-slate-100 bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <PieIcon className="h-5 w-5 text-indigo-500" />
                                Restoran Dağılımı
                            </CardTitle>
                            <CardDescription>Hangi işletme daha çok kazandırıyor?</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        {...{
                                            activeIndex: activeIndex,
                                            activeShape: renderActiveShape,
                                            data: revenueByRestaurant,
                                            cx: "50%",
                                            cy: "50%",
                                            innerRadius: 80,
                                            outerRadius: 110,
                                            dataKey: "value",
                                            onMouseEnter: onPieEnter,
                                            paddingAngle: 2
                                        } as any}
                                    >
                                        {revenueByRestaurant.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* 5. Sales Volume Bar Chart */}
                <Card className={`${hideDistribution ? 'lg:col-span-12' : 'lg:col-span-6'} shadow-sm border-slate-100 bg-white`}>
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Activity className="h-5 w-5 text-cyan-500" />
                            Sipariş Hacmi
                        </CardTitle>
                        <CardDescription>Dönem bazlı işlem yoğunluğu</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barSize={range === 'daily' ? 40 : 30}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fill: '#94a3b8', fontSize: 13 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={10}
                                />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip prefix="" />} />
                                <Bar
                                    dataKey="orders"
                                    fill="#06b6d4"
                                    radius={[8, 8, 0, 0]}
                                    animationDuration={1500}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={index === chartData.length - 1 ? '#06b6d4' : '#e2e8f0'}
                                            className="hover:fill-cyan-500 transition-colors"
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
