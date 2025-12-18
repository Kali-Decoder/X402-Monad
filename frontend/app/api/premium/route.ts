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

// Facilitator requires one of: vaultAccessToken, walletAccessToken, or awsKms credentials
// Get these from your thirdweb dashboard: https://portal.thirdweb.com
if (!process.env.VAULT_ACCESS_TOKEN) {
    throw new Error("Facilitator requires one of: VAULT_ACCESS_TOKEN, WALLET_ACCESS_TOKEN, or AWS_KMS_KEY_ID environment variable");
}

const client = createThirdwebClient({ secretKey: process.env.SECRET_KEY });

// Configure facilitator with authentication credentials
const facilitatorConfig: any = {
  client,
  serverWalletAddress: process.env.SERVER_WALLET,
};

// Add authentication method (priority: vault > wallet > awsKms)
if (process.env.VAULT_ACCESS_TOKEN) {
  facilitatorConfig.vaultAccessToken = process.env.VAULT_ACCESS_TOKEN;
} else if (process.env.WALLET_ACCESS_TOKEN) {
  facilitatorConfig.walletAccessToken = process.env.WALLET_ACCESS_TOKEN;
} else if (process.env.AWS_KMS_KEY_ID) {
  facilitatorConfig.awsKms = {
    keyId: process.env.AWS_KMS_KEY_ID,
    region: process.env.AWS_KMS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const twFacilitator = facilitator(facilitatorConfig);

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
            // Check if it's a timeout error
            const responseBody = result.responseBody || {};
            const errorMessage = responseBody.errorMessage || JSON.stringify(responseBody);
            
            // Detect timeout errors (524, 504, or timeout-related messages in error message)
            const isTimeoutError = 
                errorMessage.includes('524') ||
                errorMessage.includes('504') ||
                errorMessage.includes('timeout') ||
                errorMessage.includes('Timeout') ||
                errorMessage.includes('A timeout occurred');

            if (isTimeoutError) {
                console.error("Payment settlement timeout:", errorMessage);
                return NextResponse.json({
                    error: "Payment settlement timeout",
                    errorMessage: "The payment settlement request timed out. This may be due to network issues or thirdweb API delays. Please try again in a few moments.",
                    retryable: true,
                    accepts: responseBody.accepts || [],
                }, {
                    status: 408, // Request Timeout
                    headers: { "Content-Type": "application/json" },
                });
            }

            // send payment status for other errors
            return new NextResponse(
                JSON.stringify(result.responseBody),
                {
                    status: result.status,
                    headers: { "Content-Type": "application/json", ...(result.responseHeaders || {}) },
                }
            );
        }
    } catch(error: any) {
        console.error("Payment settlement error:", error);
        
        // Check if it's a timeout error
        const errorMessage = error?.message || String(error);
        const isTimeoutError = 
            errorMessage.includes('524') ||
            errorMessage.includes('504') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('Timeout') ||
            errorMessage.includes('ECONNRESET') ||
            errorMessage.includes('ETIMEDOUT');

        if (isTimeoutError) {
            return NextResponse.json({
                error: "Payment settlement timeout",
                errorMessage: "The payment settlement request timed out. This may be due to network issues or thirdweb API delays. Please try again in a few moments.",
                retryable: true,
            }, {
                status: 408, // Request Timeout
                headers: { "Content-Type": "application/json" },
            });
        }
        
        return NextResponse.json({
            error: "server error",
            errorMessage: errorMessage,
        }, {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

