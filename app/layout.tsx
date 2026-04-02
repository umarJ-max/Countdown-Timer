import './globals.css'

export const metadata = {
  title: 'Countdown Timer',
  description: 'Precision countdown timer by Umar J.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <footer style={{
          position: 'fixed',
          bottom: 0,
          width: '100%',
          borderTop: '1px solid #1a1a1a',
          background: '#0a0a0a',
          color: '#333',
          textAlign: 'center',
          padding: '10px 16px',
          fontSize: '10px',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.2em',
        }}>
          © 2024 UMAR J. ALL RIGHTS RESERVED.
        </footer>
      </body>
    </html>
  )
}
