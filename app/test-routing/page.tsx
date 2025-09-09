export default function TestRoutingPage() {
  return (
    <html>
      <body style={{ fontFamily: "Arial, sans-serif", padding: "20px", backgroundColor: "#f0f0f0" }}>
        <h1 style={{ color: "red", fontSize: "32px" }}>🔍 TEST ROUTING PAGE</h1>
        <p style={{ fontSize: "18px", color: "blue" }}>This is /test-routing</p>
        <p style={{ fontSize: "16px" }}>If you see the student form instead of this, there is a routing issue.</p>
        <p style={{ fontSize: "14px", color: "gray" }}>Current time: {new Date().toISOString()}</p>
        <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "yellow" }}>
          <h2>Routing Test Results:</h2>
          <p>✅ Next.js routing is working</p>
          <p>✅ Page components are loading</p>
          <p>✅ This is NOT the student verification form</p>
        </div>
        <div style={{ marginTop: "20px" }}>
          <a href="/" style={{ color: "blue", textDecoration: "underline" }}>
            Go to Main Page
          </a>{" "}
          |
          <a href="/admin" style={{ color: "blue", textDecoration: "underline" }}>
            Go to Admin
          </a>{" "}
          |
          <a href="/debug" style={{ color: "blue", textDecoration: "underline" }}>
            Go to Debug
          </a>
        </div>
      </body>
    </html>
  )
}
