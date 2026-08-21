'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ padding: 24, fontFamily: 'monospace' }}>
        <h2>Something broke:</h2>
        <pre style={{ whiteSpace: 'pre-wrap', color: 'red' }}>
          {error.message}
          {'\n\n'}
          {error.stack}
        </pre>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
