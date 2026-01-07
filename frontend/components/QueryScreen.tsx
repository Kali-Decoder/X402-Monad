"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Agent } from "../app/contracts";
import { Loader2, X, ExternalLink, Wallet, Zap, CheckCircle2 } from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import { createThirdwebClient } from "thirdweb";
import { wrapFetchWithPayment } from "thirdweb/x402";
import { createWallet } from "thirdweb/wallets";
import { useNetwork } from "../app/contexts/NetworkContext";
import { formatUnits } from "viem";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID || "d8952cc43bdc05f754fda42352f63c11",
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
  const { mode, usdcAddress, chain } = useNetwork();
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [loadingPercentage, setLoadingPercentage] = useState<number>(0);

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

  // Animate loading percentage from 0 to 100 when paying
  useEffect(() => {
    if (paymentState === "paying") {
      setLoadingPercentage(0);
      let currentPercentage = 0;
      const interval = setInterval(() => {
        // Increment by random amount between 2-8 for smooth animation
        const increment = Math.random() * 6 + 2;
        currentPercentage = Math.min(currentPercentage + increment, 100);
        setLoadingPercentage(currentPercentage);
        
        if (currentPercentage >= 100) {
          clearInterval(interval);
        }
      }, 80); // Update every 80ms for smooth animation (takes ~4-5 seconds to reach 100%)

      return () => clearInterval(interval);
    } else {
      // Reset percentage when not paying
      setLoadingPercentage(0);
    }
  }, [paymentState]);

  const payAndFetch = async () => {
    // Check if wallet is connected via wagmi first
    if (!isConnected) {
      setError("Please connect your wallet first using the Connect Wallet button in the header");
      setPaymentState("error");
      return;
    }

    // Use the agent's endpoint URL
    const endpointUrl = agent.endpoint || `/api/premium`;
    
    // Validate username if endpoint requires it
    if ((endpointUrl.includes("/api/twitter") || endpointUrl.includes("twitter")) && !username.trim()) {
      setError("Username is required for this endpoint");
      setPaymentState("error");
      return;
    }

    setPaymentState("connecting");
    setError(null);
    setResponse(null);

    try {
      // Connect wallet for payment
      const wallet = createWallet("io.metamask");
      const account = await wallet.connect({ client });
      
      if (!account) {
        throw new Error("Failed to connect wallet");
      }

      setPaymentState("paying");
      setLoadingPercentage(0);
      
      const fetchPay = wrapFetchWithPayment(fetch, client, wallet);

      // Convert relative URL to absolute URL (required for x402)
      // Normalize URL to ensure it starts with /
      let requestPath = endpointUrl.startsWith("/") ? endpointUrl : `/${endpointUrl}`;
      
      // Get the base URL (works for both dev and production)
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      
      // Determine request method and configuration
      const isPremiumEndpoint = requestPath.includes("/api/premium");
      
      let res: Response;
      
      if (isPremiumEndpoint) {
        // GET request with query params - network parameter included
        // Use absolute URL for x402 payment flow
        const absoluteUrl = `${baseUrl}${requestPath}?network=${mode}`;
        res = await fetchPay(absoluteUrl);
      } else {
        // POST request with body - network parameter in body
        // Use absolute URL for x402 payment flow
        const absoluteUrl = `${baseUrl}${requestPath}`;
        const body = JSON.stringify({
          network: mode,
          ...(username && { username }),
        });
        
        res = await fetchPay(absoluteUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
      }
      
      // Ensure percentage reaches 100% before showing result
      setLoadingPercentage(100);
      
      // Small delay to show 100% completion
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Parse the response as JSON
      let json: any;
      try {
        const responseText = await res.text();
        json = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        throw new Error(`Failed to parse response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
      }
      
      // Store the full response
      setResponse(json);
      
      // Check if response has an error field
      if (!res.ok || json.error) {
        // Handle timeout errors specially - they're retryable
        if (json.error === "Payment settlement timeout" || res.status === 408) {
          setError(
            json.errorMessage || 
            "Payment settlement timed out. This is usually temporary. Please try again."
          );
          setPaymentState("error");
        } else {
          setError(json.errorMessage || json.error || `Query failed with status ${res.status}`);
          setPaymentState("error");
        }
      } else {
        setPaymentState("success");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      const errorResponse = {
        error: "request_failed",
        errorMessage: msg,
      };
      setResponse(errorResponse);
      setError(msg);
      setPaymentState("error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-1 xs:p-2 sm:p-4">
      <Card className="bg-zinc-900 border-zinc-800 w-full max-w-6xl max-h-[98vh] xs:max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col m-1 xs:m-2">
        <div className="p-3 xs:p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 min-w-0 flex-1">
            {agent.image ? (
              <img
                src={agent.image}
                alt={agent.name}
                className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-lg object-cover border border-zinc-800 flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-zinc-800 flex-shrink-0">
                <span className="text-zinc-400 font-semibold text-[10px] xs:text-xs sm:text-sm">
                  {agent.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-sm xs:text-base sm:text-lg font-semibold text-zinc-100 truncate">{agent.name}</h2>
              <p className="text-[10px] xs:text-xs sm:text-sm text-zinc-500">Query Agent</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 flex-shrink-0 h-7 w-7 xs:h-8 xs:w-8 sm:h-10 sm:w-10"
          >
            <X className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
         
          <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-zinc-800 p-3 xs:p-4 sm:p-6 overflow-y-auto max-h-[45vh] xs:max-h-[50vh] lg:max-h-none">
            <div className="space-y-4 xs:space-y-5 sm:space-y-6">
            {/* Code Block Style Payment Info */}
            <div>
              <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-zinc-100 mb-2 xs:mb-3 sm:mb-4 leading-tight">
                → Accept payments with a single line of code
              </h3>
              
              <div className="relative bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="absolute top-1.5 right-1.5 xs:top-2 xs:right-2 sm:top-3 sm:right-3">
                  <span className="text-[9px] xs:text-[10px] sm:text-xs text-zinc-600 bg-zinc-900 px-1 xs:px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">6</span>
                </div>
                <div className="p-2.5 xs:p-3 sm:p-4 font-mono text-[10px] xs:text-xs sm:text-sm overflow-x-auto">
                  <div className="text-zinc-500 mb-2">
                    <span className="text-zinc-400">const</span> fetchPay ={' '}
                    <span className="text-zinc-300">wrapFetchWithPayment</span>(
                    <br />
                    <span className="ml-4">fetch, client, wallet</span>
                    <br />
                    );
                  </div>
                  {(() => {
                    const endpointUrl = agent.endpoint || "/api/premium";
                    const isPremiumEndpoint = endpointUrl.includes("/api/premium");
                    
                    if (isPremiumEndpoint) {
                      return (
                        <div className="text-zinc-500">
                          <span className="text-zinc-400">const</span> res ={' '}
                          <span className="text-zinc-300">await</span> fetchPay(
                          <br />
                          <span className="ml-4 text-zinc-200">`{endpointUrl}?network=${'{'}mode{'}'}`</span>
                          <br />
                          );
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-zinc-500">
                          <span className="text-zinc-400">const</span> res ={' '}
                          <span className="text-zinc-300">await</span> fetchPay(
                          <br />
                          <span className="ml-4 text-zinc-200">{endpointUrl}</span>,
                          <br />
                          <span className="ml-4">{'{'}</span>
                          <br />
                          <span className="ml-8">method: <span className="text-zinc-200">"POST"</span>,</span>
                          <br />
                          <span className="ml-8">headers: {'{'}</span>
                          <br />
                          <span className="ml-12"><span className="text-zinc-200">"Content-Type"</span>: <span className="text-zinc-200">"application/json"</span></span>
                          <br />
                          <span className="ml-8">{'}'},</span>
                          <br />
                          <span className="ml-8">body: <span className="text-zinc-300">JSON</span>.<span className="text-zinc-300">stringify</span>({'{'} network, username {'}'})</span>
                          <br />
                          <span className="ml-4">{'}'}</span>
                          <br />
                          );
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
              
              <p className="text-[10px] xs:text-xs sm:text-sm text-zinc-400 mt-2 xs:mt-3 sm:mt-4 leading-relaxed">
                That's it. Add one line of code to require payment for each incoming request. 
                If a request arrives without payment, the server responds with HTTP 402, 
                prompting the client to pay and retry.
              </p>
            </div>

            {/* USDC Balance Display */}
            {isConnected && (
              <div className="p-3 xs:p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] xs:text-xs text-zinc-500 mb-1">Your {PAYMENT_TOKEN} Balance</p>
                    {isLoadingBalance ? (
                      <div className="flex items-center gap-1.5 xs:gap-2">
                        <Loader2 className="w-3.5 h-3.5 xs:w-4 xs:h-4 animate-spin text-zinc-400 flex-shrink-0" />
                        <p className="text-xs xs:text-sm text-zinc-400 truncate">Loading...</p>
                      </div>
                    ) : (
                      <p className="text-base xs:text-lg font-semibold text-zinc-100 truncate">
                        {formattedBalance} {PAYMENT_TOKEN}
                      </p>
                    )}
                  </div>
                  <div className="w-8 h-8 xs:w-10 xs:h-10 rounded-lg bg-zinc-700/50 flex items-center justify-center border border-zinc-600 flex-shrink-0">
                    <Wallet className="w-4 h-4 xs:w-5 xs:h-5 text-zinc-300" />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Amount Display */}
            {paymentState === "idle" && (
              <div className="p-4 xs:p-5 sm:p-6 rounded-lg bg-zinc-800/50 border border-zinc-700">
                <div className="flex items-center justify-between mb-3 xs:mb-4 gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs xs:text-sm text-zinc-400 mb-1">Payment Amount</p>
                    <p className="text-xl xs:text-2xl font-bold text-zinc-100 truncate">
                      {PAYMENT_AMOUNT} {PAYMENT_TOKEN}
                    </p>
                  </div>
                  <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-lg bg-zinc-700/50 flex items-center justify-center border border-zinc-600 flex-shrink-0">
                    <Zap className="w-5 h-5 xs:w-6 xs:h-6 text-zinc-300" />
                  </div>
                </div>
                <div className="pt-3 xs:pt-4 border-t border-zinc-700">
                  <p className="text-[10px] xs:text-xs text-zinc-500">
                    Zero gas fees on {mode === "dev" ? "Monad Testnet" : "Monad Mainnet"}
                  </p>
                </div>
              </div>
            )}

            {/* Payment Animation States */}
            {paymentState === "connecting" && (
              <div className="p-4 xs:p-5 sm:p-6 rounded-lg bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700 text-center animate-pulse">
                <div className="flex items-center justify-center mb-2 xs:mb-3">
                  <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-600 animate-spin">
                    <Wallet className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-zinc-300" />
                  </div>
                </div>
                <h3 className="text-base xs:text-lg font-semibold text-zinc-200 mb-1">
                  Connecting Wallet...
                </h3>
                <p className="text-xs xs:text-sm text-zinc-400 px-2">
                  Please approve the connection in your wallet
                </p>
              </div>
            )}

            {paymentState === "paying" && (
              <div className="p-6 xs:p-8 sm:p-10 rounded-lg bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700 text-center">
                <div className="flex flex-col items-center justify-center">
                  {/* x402 X Monad Logo */}
                  <div className="mb-6 xs:mb-8 sm:mb-10">
                    <div className="h-[60px] xs:h-[80px] sm:h-[100px] w-auto flex items-center justify-center mx-auto">
                      <svg viewBox="0 0 130 49" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" className="h-[60px] xs:h-[80px] sm:h-[100px] w-auto">
                        <path d="M118.324 0.576478C119.014 0.57648 119.674 0.858802 120.15 1.35771L126.665 8.18262C127.114 8.65205 127.364 9.27606 127.364 9.92498V14.0753C127.364 14.7331 127.107 15.365 126.648 15.8362L102.833 40.2826C102.719 40.4004 102.654 40.5585 102.654 40.723V43.688C102.654 44.0365 102.937 44.3189 103.285 44.3189H126.733C127.081 44.3189 127.364 44.6014 127.364 44.9498V48.3146C127.364 48.6631 127.081 48.9455 126.733 48.9455H100.551C99.1568 48.9455 98.0265 47.8156 98.0265 46.4219V39.6113C98.0265 38.9537 98.2834 38.322 98.7424 37.8507L122.557 13.4044C122.672 13.2866 122.736 13.1285 122.736 12.9641V11.0204C122.736 10.8582 122.674 10.7022 122.562 10.5848L117.61 5.39839C117.491 5.27368 117.326 5.20311 117.154 5.20308H107.232C107.065 5.20308 106.904 5.26962 106.786 5.38792L100.787 11.3854C100.54 11.6318 100.141 11.6318 99.8943 11.3854L97.5143 9.00595C97.268 8.75956 97.2682 8.36018 97.5145 8.11381L104.314 1.31561C104.788 0.842371 105.43 0.576499 106.099 0.576478H118.324ZM83.3191 0.576478C87.966 0.576478 91.7333 4.34266 91.7333 8.98849V40.5316L91.7306 40.7489C91.6172 45.2222 88.0106 48.8275 83.5362 48.9409L83.3191 48.9436H72.9752L72.7581 48.9409C68.2837 48.8275 64.6771 45.2222 64.5637 40.7489L64.561 40.5316V8.98849C64.561 4.3427 68.3283 0.57653 72.9752 0.576478H83.3191ZM52.3016 0C52.65 3.30462e-05 52.9327 0.282507 52.9327 0.630901V21.1508C52.9327 21.4992 53.2152 21.7817 53.5638 21.7817H58.0944C58.443 21.7817 58.7255 22.0643 58.7255 22.4126V25.7774C58.7255 26.1258 58.443 26.4083 58.0944 26.4083H53.5638C53.2152 26.4083 52.9327 26.6907 52.9327 27.0392V48.3125C52.9327 48.661 52.6502 48.9434 52.3016 48.9434H48.936C48.5874 48.9434 48.3049 48.661 48.3049 48.3125V27.0392C48.3049 26.6909 48.0222 26.4083 47.6738 26.4083H31.7606C31.5936 26.4083 31.4333 26.342 31.3149 26.224L25.8201 20.745C25.5736 20.4991 25.573 20.1 25.8185 19.8533L45.3973 0.185861C45.5158 0.0669252 45.6769 2.54743e-05 45.8446 0H52.3016ZM2.91808 15.5368C3.0823 15.3729 3.34834 15.3729 3.51257 15.5368L16.8285 28.8242L21.9405 23.7377C22.1048 23.5743 22.3705 23.5743 22.5346 23.7381L25.1542 26.3521C25.3191 26.5166 25.3187 26.7839 25.1535 26.9481L21.3757 30.7036V33.4247L33.3587 45.3822C33.5234 45.5464 33.5234 45.8133 33.3587 45.9776L30.7389 48.5918C30.5746 48.7556 30.3087 48.7556 30.1444 48.5918L16.8285 35.3044L3.51257 48.5918C3.34834 48.7556 3.0823 48.7556 2.91808 48.5918L0.298278 45.9776C0.133648 45.8133 0.133677 45.5464 0.298278 45.3822L12.2812 33.4247V30.7036L0.298278 18.7463C0.133677 18.582 0.13365 18.3152 0.298278 18.1509L2.91808 15.5368ZM69.1888 37.8011V40.5316C69.1888 42.6222 70.8841 44.317 72.9752 44.317H83.3191C85.4102 44.317 87.1055 42.6222 87.1055 40.5316V19.8892L69.1888 37.8011ZM72.9752 5.20308C70.8841 5.20315 69.1888 6.8979 69.1888 8.98849V31.2582L87.1055 13.3463V8.98849C87.1055 6.89787 85.4102 5.20308 83.3191 5.20308H72.9752ZM47.7403 4.62661C47.5903 4.62663 47.4462 4.68659 47.3404 4.79296L32.3597 19.8412C32.114 20.0879 32.1148 20.487 32.3614 20.7329L33.2283 21.5974C33.3465 21.7154 33.507 21.7817 33.674 21.7817H47.6738C48.0224 21.7817 48.3049 21.4992 48.3049 21.1508V5.19076C48.3049 4.8792 48.052 4.62661 47.7403 4.62661Z" fill="white"></path>
                      </svg>
                    </div>
                    <div className="mt-2 xs:mt-3">
                      <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-zinc-100">
                        x402 X Monad
                      </h3>
                    </div>
                  </div>
                  
                  {/* Percentage Display - Below Logo */}
                  <div className="w-full mt-4 xs:mt-6">
                    <div className="mb-2 xs:mb-3">
                      <p className="text-3xl xs:text-4xl sm:text-5xl font-bold text-zinc-100 tabular-nums">
                        {Math.round(loadingPercentage)}%
                      </p>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2 xs:h-2.5 sm:h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-zinc-300 to-zinc-100 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${loadingPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentState === "success" && (
              <div className="p-4 xs:p-5 sm:p-6 rounded-lg bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700 text-center animate-in fade-in duration-500">
                <div className="flex items-center justify-center mb-2 xs:mb-3">
                  <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-600 animate-in zoom-in duration-300">
                    <CheckCircle2 className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-zinc-300" />
                  </div>
                </div>
                <h3 className="text-base xs:text-lg font-semibold text-zinc-200 mb-1">
                  Payment Successful! 🎉
                </h3>
                <p className="text-xs xs:text-sm text-zinc-400 px-2">
                  Monad is blazing fast ⚡
                </p>
              </div>
            )}

            <div className="p-3 xs:p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
              <p className="text-xs xs:text-sm text-zinc-400 mb-1.5 xs:mb-2">Endpoint:</p>
              <div className="bg-zinc-950 border border-zinc-800 rounded p-2 xs:p-2.5 sm:p-3">
                <p className="text-[10px] xs:text-xs text-zinc-300 font-mono break-all leading-relaxed">
                  {(agent.endpoint || "/api/premium").includes("/api/premium") ? "GET" : "POST"} {agent.endpoint || "/api/premium"}
                </p>
              </div>
            </div>

            {/* Username input for endpoints that require it (e.g., /api/twitter) */}
            {(agent.endpoint?.includes("/api/twitter") || agent.endpoint?.includes("twitter")) && (
              <div className="space-y-1.5 xs:space-y-2">
                <Label htmlFor="username" className="text-xs xs:text-sm text-zinc-400">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter Twitter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-sm xs:text-base h-9 xs:h-10"
                  disabled={paymentState !== "idle"}
                />
              </div>
            )}

            {paymentState === "idle" && (
              <Button
                onClick={payAndFetch}
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-black font-medium h-10 xs:h-11 sm:h-12 text-sm xs:text-base"
              >
                <ExternalLink className="w-4 h-4 xs:w-5 xs:h-5 mr-1.5 xs:mr-2 flex-shrink-0" />
                <span className="truncate">Pay {PAYMENT_AMOUNT} {PAYMENT_TOKEN} & Query API</span>
              </Button>
            )}

            {paymentState === "connecting" && (
              <Button
                disabled
                className="w-full bg-zinc-800 text-zinc-300 font-medium h-10 xs:h-11 sm:h-12 text-sm xs:text-base cursor-not-allowed"
              >
                <Loader2 className="w-4 h-4 xs:w-5 xs:h-5 mr-1.5 xs:mr-2 animate-spin flex-shrink-0" />
                <span className="truncate">Connecting Wallet...</span>
              </Button>
            )}

            {paymentState === "paying" && (
              <Button
                disabled
                className="w-full bg-zinc-800 text-zinc-300 font-medium h-10 xs:h-11 sm:h-12 text-sm xs:text-base cursor-not-allowed"
              >
                <Loader2 className="w-4 h-4 xs:w-5 xs:h-5 mr-1.5 xs:mr-2 animate-spin flex-shrink-0" />
                <span className="truncate">Processing Payment...</span>
              </Button>
            )}

            {error && paymentState === "error" && (
              <div className="p-3 xs:p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 animate-in slide-in-from-top duration-300">
                <p className="text-zinc-200 font-semibold mb-1.5 xs:mb-2 text-sm xs:text-base">
                  {response?.retryable ? "Payment Timeout (Retryable)" : "Payment Error"}
                </p>
                <p className="text-zinc-400 text-xs xs:text-sm break-words">{error}</p>
                {response?.retryable && (
                  <p className="text-zinc-500 text-[10px] xs:text-xs mt-1.5 xs:mt-2">
                    This is usually a temporary issue. Please try again.
                  </p>
                )}
                {response?.fundWalletLink && (
                  <a
                    href={response.fundWalletLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 xs:mt-3 inline-block w-full text-center px-3 xs:px-4 py-1.5 xs:py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs xs:text-sm transition-colors"
                  >
                    Top Up Wallet
                  </a>
                )}
                <Button
                  onClick={payAndFetch}
                  className="mt-2 xs:mt-3 w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs xs:text-sm h-9 xs:h-10"
                  size="sm"
                >
                  {response?.retryable ? "Retry Payment" : "Try Again"}
                </Button>
              </div>
            )}

            </div>
          </div>

     
          <div className="w-full lg:w-1/2 p-3 xs:p-4 sm:p-6 overflow-y-auto bg-zinc-950 max-h-[45vh] xs:max-h-[50vh] lg:max-h-none">
            <div className="h-full flex flex-col">
              <div className="mb-3 xs:mb-4">
                <h3 className="text-base xs:text-lg font-semibold text-zinc-100 mb-1 xs:mb-2">Response</h3>
                <p className="text-[10px] xs:text-xs text-zinc-500">API response will appear here</p>
              </div>

              {response ? (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-2 xs:mb-3 gap-2">
                    <p className={`text-xs xs:text-sm font-semibold flex items-center gap-1.5 xs:gap-2 min-w-0 ${
                      response.error || paymentState === "error"
                        ? "text-zinc-300"
                        : "text-zinc-300"
                    }`}>
                      <ExternalLink className="w-3.5 h-3.5 xs:w-4 xs:h-4 flex-shrink-0" />
                      <span className="truncate">{response.error || paymentState === "error" ? "Error Response" : "Success Response"}</span>
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(response, null, 2));
                      }}
                      className="text-[10px] xs:text-xs px-1.5 xs:px-2 py-0.5 xs:py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors flex-shrink-0 whitespace-nowrap"
                    >
                      Copy JSON
                    </button>
                  </div>
                  
                  <div className="flex-1 rounded bg-zinc-900 border border-zinc-800 overflow-auto min-h-0">
                    <pre className={`text-[9px] xs:text-[10px] sm:text-xs p-2 xs:p-3 sm:p-4 whitespace-pre-wrap font-mono break-words ${
                      response.error || paymentState === "error"
                        ? "text-zinc-300"
                        : "text-zinc-300"
                    }`}>
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </div>

                  {/* Additional success details */}
                  {paymentState === "success" && (
                    <div className="mt-3 xs:mt-4 space-y-2 xs:space-y-3">
                      {response.tx && (
                        <div className="p-2 xs:p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                          <p className="text-zinc-300 font-semibold mb-1 text-[10px] xs:text-xs">Transaction</p>
                          <p className="text-[9px] xs:text-[10px] sm:text-xs text-zinc-400 font-mono break-all">
                            {response.tx}
                          </p>
                        </div>
                      )}

                      {response.message && (
                        <div className="p-2 xs:p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                          <p className="text-zinc-300 font-semibold mb-1 text-[10px] xs:text-xs">Message</p>
                          <p className="text-[10px] xs:text-xs text-zinc-400 break-words">{response.message}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center min-h-0">
                  <div className="text-center px-2">
                    <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-lg bg-zinc-800/50 border border-zinc-700 flex items-center justify-center mx-auto mb-2 xs:mb-3">
                      <ExternalLink className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-zinc-600" />
                    </div>
                    <p className="text-xs xs:text-sm text-zinc-500">No response yet</p>
                    <p className="text-[10px] xs:text-xs text-zinc-600 mt-1">Response will appear here after payment</p>
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

