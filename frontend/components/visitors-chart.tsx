"use client"

import { useTheme } from "next-themes"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from "chart.js"

// Registrar los componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface VisitorsChartProps {
  chartData?: Array<{ name: string; users: number; visits: number }>;
  isLoading?: boolean;
}

export default function VisitorsChart({ chartData, isLoading = false }: VisitorsChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Usar solo datos de la API
  const labels = chartData ? chartData.map(item => item.name) : []
  const visitorsData = chartData ? chartData.map(item => item.visits) : []

  const data = {
    labels,
    datasets: [
      {
        label: "Visitantes",
        data: visitorsData,
        borderColor: "#16a34a", // verde
        backgroundColor: "rgba(22, 163, 74, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: isDark ? "#e5e7eb" : "#374151",
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: isDark ? "#e5e7eb" : "#374151",
        },
      },
      y: {
        grid: {
          color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: isDark ? "#e5e7eb" : "#374151",
        },
      },
    },
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Cargando datos...</div>
      </div>
    )
  }

  return <Line options={options} data={data} />
}
