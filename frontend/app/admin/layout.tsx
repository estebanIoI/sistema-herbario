"use client"

import type { ReactNode } from "react"
import AdminSidebar from "@/components/admin-sidebar"
import AdminTopbar from "@/components/admin-topbar"
import ProtectedRoute from "@/components/protected-route"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="admin-shell flex min-h-screen flex-col md:flex-row">
        <AdminSidebar />
        <div className="flex-1 md:ml-[248px] flex flex-col min-w-0">
          <AdminTopbar />
          <main className="flex-1 px-4 pb-10 md:px-7">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
