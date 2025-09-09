export default function SimpleDebugPage() {
  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f0f8ff",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          color: "#ff0000",
          fontSize: "36px",
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        🚨 SIMPLE DEBUG PAGE 🚨
      </h1>

      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <h2 style={{ color: "#0066cc" }}>Route: /simple-debug</h2>
        <p style={{ fontSize: "18px", lineHeight: "1.6" }}>
          <strong>SUCCESS!</strong> If you can see this page, Next.js routing is working correctly.
        </p>

        <div
          style={{
            backgroundColor: "#e8f5e8",
            padding: "15px",
            borderRadius: "5px",
            margin: "20px 0",
          }}
        >
          <h3 style={{ color: "#006600" }}>✅ What's Working:</h3>
          <ul>
            <li>Next.js page routing</li>
            <li>Component rendering</li>
            <li>File system routing</li>
          </ul>
        </div>

        <div
          style={{
            backgroundColor: "#fff3cd",
            padding: "15px",
            borderRadius: "5px",
            margin: "20px 0",
          }}
        >
          <h3 style={{ color: "#856404" }}>🔍 Current Status:</h3>
          <p>Timestamp: {new Date().toISOString()}</p>
          <p>This is NOT the student verification form</p>
        </div>

        <div style={{ marginTop: "30px" }}>
          <h3>Test Other Routes:</h3>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a
              href="/"
              style={{
                padding: "10px 15px",
                backgroundColor: "#007bff",
                color: "white",
                textDecoration: "none",
                borderRadius: "5px",
              }}
            >
              Main Page
            </a>
            <a
              href="/admin"
              style={{
                padding: "10px 15px",
                backgroundColor: "#28a745",
                color: "white",
                textDecoration: "none",
                borderRadius: "5px",
              }}
            >
              Admin Page
            </a>
            <a
              href="/debug"
              style={{
                padding: "10px 15px",
                backgroundColor: "#ffc107",
                color: "black",
                textDecoration: "none",
                borderRadius: "5px",
              }}
            >
              Full Debug
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
