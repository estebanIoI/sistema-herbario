import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import SocialBar from "@/components/social-bar"
import ThemeColors from "@/components/theme-colors"
import Chatbot from "@/components/chatbot"
import { SenasProvider } from "@/components/senas-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Herbario Digital",
  description: "Explora nuestra colección de plantas y especies",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {/* Removes browser-extension injected attributes (e.g. bis_skin_checked from BIS/BuiltWith)
            before React hydration compares server vs client DOM */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){var attrs=['bis_skin_checked','bis_register'];function clean(el){attrs.forEach(function(a){el.hasAttribute(a)&&el.removeAttribute(a)})}document.querySelectorAll('[bis_skin_checked],[bis_register]').forEach(clean);new MutationObserver(function(ms){ms.forEach(function(m){m.type==='attributes'&&m.attributeName&&m.attributeName.indexOf('bis_')===0&&m.target.removeAttribute(m.attributeName)})}).observe(document.documentElement,{attributes:true,subtree:true})})()`,
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ThemeColors />
          <AuthProvider>
            <SenasProvider>
              <div className="flex min-h-screen flex-col" suppressHydrationWarning>
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <SocialBar />
              <Chatbot />
            </SenasProvider>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
