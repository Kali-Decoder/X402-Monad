import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'X402Monad — Agent Registry',
  description: 'Interact with autonomous agents on Monad Testnet with x402 payments',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
