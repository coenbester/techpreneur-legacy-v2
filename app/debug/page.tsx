"use client"

import { useState, useEffect } from "react"

export default function DebugPage() {
  const [apiResult, setApiResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/deployment-test")
      .then((res) => res.json())
      .then((data) => {
        setApiResult(data)
        setLoading(false)
      })
      .catch((err) => {
        setApiResult({ error: err.message })
        setLoading(false)
      })
  }, [])

  return (
    <div
      style={{
        fontFamily: "monospace",
        padding: "20px",
        backgroundColor: "#1a1a1a",
        color: "#00ff00",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: "#ff6600", fontSize: "28px" }}>🔧 DEPLOYMENT DEBUG PAGE</h1>

      <div style={{ backgroundColor: "#333", padding: "15px", margin: "10px 0", borderRadius: "5px" }}>
        <h2 style={{ color: "#ffff00" }}>Environment Information</h2>
        <p>
          <strong>Current URL:</strong> {typeof window !== "undefined" ? window.location.href : "Server-side"}
        </p>
        <p>
          <strong>User Agent:</strong> {typeof navigator !== "undefined" ? navigator.userAgent : "Server-side"}
        </p>
        <p>
          <strong>Timestamp:</strong> {new Date().toISOString()}
        </p>
      </div>

      <div style={{ backgroundColor: "#333", padding: "15px", margin: "10px 0", borderRadius: "5px" }}>
        <h2 style={{ color: "#ffff00" }}>API Test Results</h2>
        {loading ? (
          <p style={{ color: "#ffff00" }}>Testing API connection...</p>
        ) : (
          <pre style={{ backgroundColor: "#000", padding: "10px", borderRadius: "3px", overflow: "auto" }}>
            {JSON.stringify(apiResult, null, 2)}
          </pre>
        )}
      </div>

      <div style={{ backgroundColor: "#333", padding: "15px", margin: "10px 0", borderRadius: "5px" }}>
        <h2 style={{ color: "#ffff00" }}>Environment Variables Check</h2>
        <p>
          <strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"}
        </p>
        <p>
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>{" "}
          {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"}
        </p>
      </div>

      <div style={{ backgroundColor: "#333", padding: "15px", margin: "10px 0", borderRadius: "5px" }}>
        <h2 style={{ color: "#ffff00" }}>Navigation Test</h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <a
            href="/"
            style={{
              color: "#00ffff",
              padding: "5px 10px",
              backgroundColor: "#555",
              textDecoration: "none",
              borderRadius: "3px",
            }}
          >
            Main Page
          </a>
          <a
            href="/admin"
            style={{
              color: "#00ffff",
              padding: "5px 10px",
              backgroundColor: "#555",
              textDecoration: "none",
              borderRadius: "3px",
            }}
          >
            Admin Page
          </a>
          <a
            href="/test-routing"
            style={{
              color: "#00ffff",
              padding: "5px 10px",
              backgroundColor: "#555",
              textDecoration: "none",
              borderRadius: "3px",
            }}
          >
            Test Routing
          </a>
          <a
            href="/static-test.html"
            style={{
              color: "#00ffff",
              padding: "5px 10px",
              backgroundColor: "#555",
              textDecoration: "none",
              borderRadius: "3px",
            }}
          >
            Static Test
          </a>
        </div>
      </div>

      <div style={{ backgroundColor: "#333", padding: "15px", margin: "10px 0", borderRadius: "5px" }}>
        <h2 style={{ color: "#ffff00" }}>Routing Status</h2>
        <p style={{ color: "#00ff00" }}>✅ This debug page is loading correctly</p>
        <p style={{ color: "#00ff00" }}>✅ Next.js routing is functional</p>
        <p style={{ color: "#00ff00" }}>✅ React components are rendering</p>
      </div>
    </div>
  )
}
