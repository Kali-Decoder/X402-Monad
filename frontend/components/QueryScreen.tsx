"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Agent } from "../app/contracts";
import { Loader2, X, ExternalLink, Wallet, Zap, CheckCircle2 } from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import { createThirdwebClient } from "thirdweb";
import { wrapFetchWithPayment } from "thirdweb/x402";
import { createWallet } from "thirdweb/wallets";
import { useNetwork } from "../app/contexts/NetworkContext";
import { formatUnits } from "viem";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID || "YOUR_PUBLIC_CLIENT_ID",
});

const PAYMENT_AMOUNT = "$0.0001";
const PAYMENT_TOKEN = "USDC";

interface QueryScreenProps {
  agent: Agent;
  onClose: () => void;
}

type PaymentState = "idle" | "connecting" | "paying" | "success" | "error";

// ERC20 ABI for balanceOf
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

export function QueryScreen({ agent, onClose }: QueryScreenProps) {
  const { isConnected, address } = useAccount();
  const { mode, usdcAddress } = useNetwork();
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch USDC balance
  const { data: usdcBalance, isLoading: isLoadingBalance } = useReadContract({
    address: usdcAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
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

  // Format USDC balance
  const formattedBalance = usdcBalance && decimals
    ? parseFloat(formatUnits(usdcBalance, decimals)).toFixed(6)
    : "0.000000";

  const payAndFetch = async () => {
    // Check if wallet is connected via wagmi first
    if (!isConnected) {
      setError("Please connect your wallet first using the Connect Wallet button in the header");
      setPaymentState("error");
      return;
    }

    setPaymentState("connecting");
    setError(null);
    setResponse(null);

    try {
      // Create a thirdweb wallet instance for x402 payments
      // This uses the same wallet that's already connected via wagmi
      const wallet = createWallet("io.metamask");
      await wallet.connect({ client });

      setPaymentState("paying");

      const fetchPay = wrapFetchWithPayment(fetch, client, wallet);

      // Call the premium route directly - this is our endpoint
      // Pass network mode as query parameter
      const queryUrl = `/api/premium?network=${mode}`;
      const res = await fetchPay(queryUrl); // relative URL = no CORS
      
      // Always parse the response as JSON, whether it's success or error
      const json = await res.json().catch(() => ({}));
      
      // Store the full response
      setResponse(json);
      
      // Check if response has an error field
      if (!res.ok || json.error) {
        setError(json.errorMessage || json.error || `Query failed with status ${res.status}`);
        setPaymentState("error");
      } else {
        setPaymentState("success");
      }
    } catch (e: any) {
      // If we can't parse JSON, create a response object with the error
      const errorResponse = {
        error: "request_failed",
        errorMessage: e.message || "Failed to query agent",
      };
      setResponse(errorResponse);
      setError(e.message || "Failed to query agent");
      setPaymentState("error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <Card className="bg-zinc-900 border-zinc-800 w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {agent.image ? (
              <img
                src={agent.image}
                alt={agent.name}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover border border-zinc-800 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-zinc-800 flex-shrink-0">
                <span className="text-zinc-400 font-semibold text-xs sm:text-sm">
                  {agent.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-zinc-100 truncate">{agent.name}</h2>
              <p className="text-xs sm:text-sm text-zinc-500">Query Agent</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Left Side - Payment Controls */}
          <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-zinc-800 p-4 sm:p-6 overflow-y-auto max-h-[50vh] lg:max-h-none">
            <div className="space-y-6">
            {/* Code Block Style Payment Info */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-zinc-100 mb-3 sm:mb-4">
                → Accept payments with a single line of code
              </h3>
              
              <div className="relative bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                  <span className="text-[10px] sm:text-xs text-zinc-600 bg-zinc-900 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">6</span>
                </div>
                <div className="p-3 sm:p-4 font-mono text-xs sm:text-sm overflow-x-auto">
                  <div className="text-zinc-500 mb-2">
                    <span className="text-zinc-400">const</span> fetchPay ={' '}
                    <span className="text-zinc-300">wrapFetchWithPayment</span>(
                    <br />
                    <span className="ml-4">fetch, client, wallet</span>
                    <br />
                    );
                  </div>
                  <div className="text-zinc-500">
                    <span className="text-zinc-400">const</span> res ={' '}
                    <span className="text-zinc-300">await</span> fetchPay(
                    <br />
                    <span className="ml-4 text-zinc-200">"/api/premium"</span>
                    <br />
                    );
                  </div>
                </div>
              </div>
              
              <p className="text-xs sm:text-sm text-zinc-400 mt-3 sm:mt-4 leading-relaxed">
                That's it. Add one line of code to require payment for each incoming request. 
                If a request arrives without payment, the server responds with HTTP 402, 
                prompting the client to pay and retry.
              </p>
            </div>

            {/* USDC Balance Display */}
            {isConnected && (
              <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Your {PAYMENT_TOKEN} Balance</p>
                    {isLoadingBalance ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                        <p className="text-sm text-zinc-400">Loading...</p>
                      </div>
                    ) : (
                      <p className="text-lg font-semibold text-zinc-100">
                        {formattedBalance} {PAYMENT_TOKEN}
                      </p>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-zinc-700/50 flex items-center justify-center border border-zinc-600">
                    <Wallet className="w-5 h-5 text-zinc-300" />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Amount Display */}
            {paymentState === "idle" && (
              <div className="p-6 rounded-lg bg-zinc-800/50 border border-zinc-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-zinc-400 mb-1">Payment Amount</p>
                    <p className="text-2xl font-bold text-zinc-100">
                      {PAYMENT_AMOUNT} {PAYMENT_TOKEN}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-zinc-700/50 flex items-center justify-center border border-zinc-600">
                    <Zap className="w-6 h-6 text-zinc-300" />
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-700">
                  <p className="text-xs text-zinc-500">
                    Zero gas fees on {mode === "dev" ? "Monad Testnet" : "Monad Mainnet"}
                  </p>
                </div>
              </div>
            )}

            {/* Payment Animation States */}
            {paymentState === "connecting" && (
              <div className="p-6 rounded-lg bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700 text-center animate-pulse">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-600 animate-spin">
                    <Wallet className="w-8 h-8 text-zinc-300" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-1">
                  Connecting Wallet...
                </h3>
                <p className="text-sm text-zinc-400">
                  Please approve the connection in your wallet
                </p>
              </div>
            )}

            {paymentState === "paying" && (
              <div className="p-6 rounded-lg bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-zinc-700/30"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-zinc-300 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full bg-zinc-800 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-zinc-300 animate-pulse" />
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-1">
                  Processing Payment...
                </h3>
                <p className="text-sm text-zinc-400 mb-2">
                  Paying {PAYMENT_AMOUNT} {PAYMENT_TOKEN}
                </p>
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-zinc-300 rounded-full animate-[progress_2s_ease-in-out_infinite]"></div>
                </div>
              </div>
            )}

            {paymentState === "success" && (
              <div className="p-6 rounded-lg bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700 text-center animate-in fade-in duration-500">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-600 animate-in zoom-in duration-300">
                    <CheckCircle2 className="w-8 h-8 text-zinc-300" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-1">
                  Payment Successful! 🎉
                </h3>
                <p className="text-sm text-zinc-400">
                  Monad is blazing fast ⚡
                </p>
              </div>
            )}

            <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
              <p className="text-sm text-zinc-400 mb-2">Endpoint:</p>
              <div className="bg-zinc-950 border border-zinc-800 rounded p-3">
                <p className="text-xs text-zinc-300 font-mono break-all">
                  GET /api/premium
                </p>
              </div>
            </div>

            {paymentState === "idle" && (
              <Button
                onClick={payAndFetch}
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-black font-medium h-12 text-base"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Pay {PAYMENT_AMOUNT} {PAYMENT_TOKEN} & Query API
              </Button>
            )}

            {paymentState === "connecting" && (
              <Button
                disabled
                className="w-full bg-zinc-800 text-zinc-300 font-medium h-12 text-base cursor-not-allowed"
              >
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Connecting Wallet...
              </Button>
            )}

            {paymentState === "paying" && (
              <Button
                disabled
                className="w-full bg-zinc-800 text-zinc-300 font-medium h-12 text-base cursor-not-allowed"
              >
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing Payment...
              </Button>
            )}

            {error && paymentState === "error" && (
              <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 animate-in slide-in-from-top duration-300">
                <p className="text-zinc-200 font-semibold mb-2">Payment Error</p>
                <p className="text-zinc-400 text-sm">{error}</p>
                {response?.fundWalletLink && (
                  <a
                    href={response.fundWalletLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block w-full text-center px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm transition-colors"
                  >
                    Top Up Wallet
                  </a>
                )}
                <Button
                  onClick={payAndFetch}
                  className="mt-3 w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  size="sm"
                >
                  Try Again
                </Button>
              </div>
            )}

            </div>
          </div>

          {/* Right Side - Response Display */}
          <div className="w-full lg:w-1/2 p-4 sm:p-6 overflow-y-auto bg-zinc-950 max-h-[50vh] lg:max-h-none">
            <div className="h-full flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">Response</h3>
                <p className="text-xs text-zinc-500">API response will appear here</p>
              </div>

              {response ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-sm font-semibold flex items-center gap-2 ${
                      response.error || paymentState === "error"
                        ? "text-zinc-300"
                        : "text-zinc-300"
                    }`}>
                      <ExternalLink className="w-4 h-4" />
                      {response.error || paymentState === "error" ? "Error Response" : "Success Response"}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(response, null, 2));
                      }}
                      className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                    >
                      Copy JSON
                    </button>
                  </div>
                  
                  <div className="flex-1 rounded bg-zinc-900 border border-zinc-800 overflow-auto">
                    <pre className={`text-xs p-4 whitespace-pre-wrap font-mono ${
                      response.error || paymentState === "error"
                        ? "text-zinc-300"
                        : "text-zinc-300"
                    }`}>
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </div>

                  {/* Additional success details */}
                  {paymentState === "success" && (
                    <div className="mt-4 space-y-3">
                      {response.tx && (
                        <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                          <p className="text-zinc-300 font-semibold mb-1 text-xs">Transaction</p>
                          <p className="text-xs text-zinc-400 font-mono break-all">
                            {response.tx}
                          </p>
                        </div>
                      )}

                      {response.message && (
                        <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                          <p className="text-zinc-300 font-semibold mb-1 text-xs">Message</p>
                          <p className="text-zinc-400 text-xs">{response.message}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-lg bg-zinc-800/50 border border-zinc-700 flex items-center justify-center mx-auto mb-3">
                      <ExternalLink className="w-8 h-8 text-zinc-600" />
                    </div>
                    <p className="text-sm text-zinc-500">No response yet</p>
                    <p className="text-xs text-zinc-600 mt-1">Response will appear here after payment</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

