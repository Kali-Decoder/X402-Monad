import { createThirdwebClient } from "thirdweb";
import { facilitator, settlePayment } from "thirdweb/x402";
import { monadTestnet } from "thirdweb/chains";
import { NextResponse } from "next/server";
import { monadMainnet } from "@/app/utils/chains";

// Mark this route as dynamic since it uses request.url
export const dynamic = 'force-dynamic';

if (!process.env.SECRET_KEY) {
    throw new Error("SECRET_KEY environment variable is not set");
}

if (!process.env.SERVER_WALLET) {
    throw new Error("SERVER_WALLET environment variable is not set");
}

const client = createThirdwebClient({ secretKey: process.env.SECRET_KEY });
const twFacilitator = facilitator({
  client,
  serverWalletAddress: process.env.SERVER_WALLET,
});

export async function GET(request: Request) {
    try {
        // Use this API route itself as the resource URL
        const resourceUrl = request.url;

        // Get network mode from query parameter (defaults to testnet for dev mode)
        const { searchParams } = new URL(request.url);
        const networkMode = searchParams.get("network") || "dev";
        const network = networkMode === "main" ? monadMainnet : monadTestnet;

        const paymentData = request.headers.get("x-payment");
        console.log("paymentData", paymentData);
        console.log("networkMode", networkMode, "network", network.name);

        const result = await settlePayment({
            resourceUrl: resourceUrl,
            method: "GET",
            paymentData: paymentData,
            network: network, // payable on monad testnet or mainnet
            price: "$0.0001", // Amount per request
            payTo: process.env.SERVER_WALLET!, // payment receiver
            facilitator: twFacilitator,
        });

        if (result.status === 200) {
            // If payment is settled, return paid response
            return NextResponse.json({ 
                message: "Paid! Monad is blazing fast ⚡", 
                tx: result.paymentReceipt 
            });
        } else {
            // send payment status
            return new NextResponse(
                JSON.stringify(result.responseBody),
                {
                    status: result.status,
                    headers: { "Content-Type": "application/json", ...(result.responseHeaders || {}) },
                }
            );
        }
    } catch(error) {
        console.error(error);
        
        return new NextResponse(
            JSON.stringify({ error: "server error" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

