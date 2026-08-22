'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#fafafa',
          color: '#111',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
            Please go back to the dashboard and try again.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                height: 36,
                padding: '0 14px',
                borderRadius: 8,
                border: 'none',
                background: '#1f5138',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/dashboard"
              style={{
                height: 36,
                padding: '0 14px',
                borderRadius: 8,
                border: '1px solid #ddd',
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: '#111',
                fontWeight: 600,
              }}
            >
              Dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
