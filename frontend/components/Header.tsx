'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

export function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="border-b border-zinc-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
              <span className="text-sm font-semibold text-zinc-100">X4</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">
                X402Monad
              </h1>
              <p className="text-xs text-zinc-500">Monad Testnet</p>
            </div>
          </div>

          <div>
            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <p className="text-sm text-zinc-400">{formatAddress(address!)}</p>
                </div>
                <Button
                  onClick={() => disconnect()}
                  variant="outline"
                  className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => connect({ connector: connectors[0] })}
                className="bg-zinc-100 text-black hover:bg-zinc-200"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}