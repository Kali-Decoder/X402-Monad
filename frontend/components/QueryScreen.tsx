"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Agent } from "../app/contracts";
import { Loader2, X, ExternalLink, Wallet, Zap, CheckCircle2 } from "lucide-react";
import { useAccount } from "wagmi";
import { createThirdwebClient } from "thirdweb";
import { wrapFetchWithPayment } from "thirdweb/x402";
import { createWallet } from "thirdweb/wallets";

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

export function QueryScreen({ agent, onClose }: QueryScreenProps) {
  const { isConnected } = useAccount();
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
      const queryUrl = `/api/premium`;
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-zinc-900 border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {agent.image ? (
              <img
                src={agent.image}
                alt={agent.name}
                className="w-10 h-10 rounded-lg object-cover border border-zinc-800"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-zinc-800">
                <span className="text-zinc-400 font-semibold">
                  {agent.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">{agent.name}</h2>
              <p className="text-sm text-zinc-500">Query Agent</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            {/* Payment Amount Display */}
            {paymentState === "idle" && (
              <div className="p-6 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-16 h-16 rounded-full bg-zinc-700/50 flex items-center justify-center border-2 border-zinc-600">
                    <Zap className="w-8 h-8 text-zinc-300" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-1">
                  {PAYMENT_AMOUNT} {PAYMENT_TOKEN}
                </h3>
                <p className="text-sm text-zinc-400">
                  Zero gas fees on Monad Testnet
                </p>
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
              <p className="text-sm text-zinc-400 mb-2">API Route:</p>
              <p className="text-xs text-zinc-500 font-mono break-all">/api/premium</p>
            </div>

            {paymentState === "idle" && (
              <Button
                onClick={payAndFetch}
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-black font-medium h-12 text-base"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Pay {PAYMENT_AMOUNT} {PAYMENT_TOKEN} & Query Agent
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

            {/* Show additional success details if available */}
            {response && paymentState === "success" && (
              <div className="space-y-4">
                {response.tx && (
                  <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                    <p className="text-zinc-300 font-semibold mb-2">Transaction</p>
                    <p className="text-xs text-zinc-400 font-mono break-all">
                      {response.tx}
                    </p>
                  </div>
                )}

                {response.message && (
                  <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                    <p className="text-zinc-300 font-semibold mb-1">Message</p>
                    <p className="text-zinc-400 text-sm">{response.message}</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* JSON Response Display at Bottom - Shows All JSON */}
        {response && (
          <div className="border-t border-zinc-800 p-4 bg-zinc-950">
            <div className="p-4 rounded-lg border bg-zinc-900/50 border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold flex items-center gap-2 text-zinc-300">
                  <ExternalLink className="w-4 h-4" />
                  {response.error || paymentState === "error" ? "Error Response (Full JSON)" : "Success Response (Full JSON)"}
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
              <div className="rounded bg-zinc-950 border border-zinc-800 overflow-auto" style={{ maxHeight: '400px' }}>
                <pre className="text-xs p-4 whitespace-pre-wrap font-mono text-zinc-300">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

