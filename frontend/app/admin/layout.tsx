"use client"

import type { ReactNode } from "react"
import AdminSidebar from "@/components/admin-sidebar"
import ProtectedRoute from "@/components/protected-route"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="flex min-h-screen flex-col md:flex-row">
        <AdminSidebar />
        <div className="flex-1 md:ml-64 p-6 md:p-8">{children}</div>
      </div>
    </ProtectedRoute>
  )
}
