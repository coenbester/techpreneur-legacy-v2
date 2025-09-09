import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TechPreneur Learning Platform - AI-Powered Assessment System",
  description:
    "Complete your entrepreneurship assessment with AI-powered feedback. Access course materials, answer cognitive-level questions, and receive personalized learning insights.",
  keywords: ["entrepreneurship", "assessment", "AI feedback", "learning platform", "education", "business studies"],
  authors: [{ name: "TechPreneur Learning Platform" }],
  creator: "TechPreneur Learning Platform",
  publisher: "TechPreneur Learning Platform",
  openGraph: {
    title: "TechPreneur Learning Platform - AI Assessment",
    description:
      "Complete your entrepreneurship assessment with AI-powered feedback and personalized learning insights.",
    type: "website",
    locale: "en_US",
    siteName: "TechPreneur Learning Platform",
  },
  twitter: {
    card: "summary_large_image",
    title: "TechPreneur Learning Platform - AI Assessment",
    description:
      "Complete your entrepreneurship assessment with AI-powered feedback and personalized learning insights.",
  },
  robots: {
    index: false,
    follow: false,
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#3b82f6",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' fontSize='90'>🚀</text></svg>"
        />
        <link
          rel="apple-touch-icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' fontSize='90'>🚀</text></svg>"
        />
        <meta name="application-name" content="TechPreneur Learning Platform" />
        <meta name="apple-mobile-web-app-title" content="TechPreneur Assessment" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
