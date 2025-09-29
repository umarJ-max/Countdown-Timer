import './globals.css'

export const metadata = {
  title: 'Modern Timer',
  description: 'A sleek, modern timer application',
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
        <footer className="fixed bottom-0 w-full bg-white/10 backdrop-blur-lg border-t border-white/20 text-white text-center py-3 px-4 text-xs sm:text-sm">
          © 2024 Umar J. All rights reserved.
        </footer>
      </body>
    </html>
  )
}