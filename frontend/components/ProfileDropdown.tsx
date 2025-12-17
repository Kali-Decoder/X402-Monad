'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount, useDisconnect, useReadContract, useBalance } from 'wagmi';
import { useNetwork } from '../app/contexts/NetworkContext';
import { formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

// ERC20 ABI for balanceOf and decimals
const ERC20_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { usdcAddress, mode, setMode } = useNetwork();

  // Fetch native balance using wagmi hook
  const { data: nativeBalance, isLoading: isLoadingNativeBalance } = useBalance({
    address: address,
    query: {
      enabled: !!address,
    },
  });

  // Fetch USDC balance
  const { data: usdcBalance, isLoading: isLoadingBalance } = useReadContract({
    address: usdcAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!usdcAddress,
    },
  });

  // Fetch USDC decimals
  const { data: decimals } = useReadContract({
    address: usdcAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: {
      enabled: !!usdcAddress,
    },
  });

  // Format native balance
  const formattedNativeBalance = nativeBalance
    ? parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals)).toFixed(1)
    : "0.0";

  // Format USDC balance
  const formattedBalance = usdcBalance && decimals
    ? parseFloat(formatUnits(usdcBalance, decimals)).toFixed(4)
    : "0.0000";

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 h-auto"
      >
        <User className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 sm:w-80 rounded-lg bg-zinc-900 border border-zinc-800 shadow-lg z-50">
          <div className="p-4 space-y-4">
            {/* Network Mode Switcher */}
            <div>
              <p className="text-xs text-zinc-500 mb-2">Network Mode</p>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="network-mode"
                    value="dev"
                    checked={mode === "dev"}
                    onChange={() => setMode("dev")}
                    className="w-4 h-4 cursor-pointer accent-zinc-100 bg-zinc-800 border-zinc-700 focus:ring-zinc-600 focus:ring-2"
                  />
                  <span className={`text-sm transition-colors ${mode === "dev" ? "text-zinc-100 font-medium" : "text-zinc-400 group-hover:text-zinc-300"}`}>
                    Dev Mode
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="network-mode"
                    value="main"
                    checked={mode === "main"}
                    onChange={() => setMode("main")}
                    className="w-4 h-4 cursor-pointer accent-zinc-100 bg-zinc-800 border-zinc-700 focus:ring-zinc-600 focus:ring-2"
                  />
                  <span className={`text-sm transition-colors ${mode === "main" ? "text-zinc-100 font-medium" : "text-zinc-400 group-hover:text-zinc-300"}`}>
                    Main Mode
                  </span>
                </label>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-800"></div>

            {/* Address */}
            <div>
              <p className="text-xs text-zinc-500 mb-1">Wallet Address</p>
              <p className="text-sm font-mono text-zinc-100 break-all">{address}</p>
              <p className="text-xs text-zinc-400 mt-1">{formatAddress(address!)}</p>
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-800"></div>

            {/* Native Balance */}
            <div>
              <p className="text-xs text-zinc-500 mb-2">Native Balance</p>
              {isLoadingNativeBalance ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin"></div>
                  <p className="text-xs text-zinc-500">Loading...</p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-400">{nativeBalance?.symbol || 'MONAD'}</p>
                  <p className="text-sm font-semibold text-zinc-100">{formattedNativeBalance} MON</p>
                </div>
              )}
            </div>

            {/* USDC Balance */}
            <div>
              <p className="text-xs text-zinc-500 mb-2">USDC Balance</p>
              {isLoadingBalance ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin"></div>
                  <p className="text-xs text-zinc-500">Loading...</p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-400">USDC</p>
                  <p className="text-sm font-semibold text-zinc-100">{formattedBalance}</p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-800"></div>

            {/* Disconnect Button */}
            <Button
              onClick={() => {
                disconnect();
                setIsOpen(false);
              }}
              variant="outline"
              className="w-full border-zinc-800 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs sm:text-sm"
            >
              Disconnect Wallet
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

