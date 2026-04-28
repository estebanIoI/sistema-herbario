import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingDown, TrendingUp, Minus } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  trend: "up" | "down" | "neutral"
}

export default function StatsCard({ title, value, description, icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center mt-1">
          {trend === "up" && <TrendingUp className="mr-1 h-3 w-3 text-green-500" />}
          {trend === "down" && <TrendingDown className="mr-1 h-3 w-3 text-red-500" />}
          {trend === "neutral" && <Minus className="mr-1 h-3 w-3 text-muted-foreground" />}
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
