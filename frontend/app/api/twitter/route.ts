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

if (!process.env.RAPIDAPI_KEY) {
    throw new Error("RAPIDAPI_KEY environment variable is not set");
}

// Facilitator requires one of: vaultAccessToken, walletAccessToken, or awsKms credentials
// Get these from your thirdweb dashboard: https://portal.thirdweb.com
if (!process.env.VAULT_ACCESS_TOKEN && !process.env.WALLET_ACCESS_TOKEN && !process.env.AWS_KMS_KEY_ID) {
    throw new Error("Facilitator requires one of: VAULT_ACCESS_TOKEN, WALLET_ACCESS_TOKEN, or AWS_KMS_KEY_ID environment variable");
}

const client = createThirdwebClient({ secretKey: process.env.SECRET_KEY });

// Configure facilitator with authentication credentials
const facilitatorConfig: any = {
  client,
  serverWalletAddress: process.env.SERVER_WALLET,
  waitUntil: "sent", // Use "sent" instead of "confirmed" to avoid timeouts on Monad
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

export async function POST(request: Request) {
    try {
        // Use hardcoded resource URL matching premium route pattern
        // Change to your production URL when deploying
        const resourceUrl = "http://localhost:3000/api/twitter";
        const body = await request.json();
        const networkMode = body.network || "dev";
        const username = body.username;
        const network = networkMode === "main" ? monadMainnet : monadTestnet;

        // Validate username parameter
        if (!username) {
            return NextResponse.json(
                { error: "Username parameter is required in request body" },
                { status: 400 }
            );
        }

        const paymentData = request.headers.get("x-payment");
        console.log("paymentData", paymentData);
        console.log("networkMode", networkMode, "network", network.name);
        console.log("username", username);

        const result = await settlePayment({
            resourceUrl: resourceUrl,
            method: "POST",
            paymentData: paymentData,
            network: network, // payable on monad testnet or mainnet
            price: "$0.0001", // Amount per request
            payTo: process.env.SERVER_WALLET!, // payment receiver
            facilitator: twFacilitator,
        });

        if (result.status === 200) {
            // If payment is settled, fetch Twitter user data from RapidAPI
            try {
                const rapidApiResponse = await fetch(
                    `https://twitter241.p.rapidapi.com/user?username=${encodeURIComponent(username)}`,
                    {
                        method: "GET",
                        headers: {
                            "x-rapidapi-host": "twitter241.p.rapidapi.com",
                            "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
                        },
                    }
                );

                if (!rapidApiResponse.ok) {
                    const errorText = await rapidApiResponse.text();
                    console.error("RapidAPI error:", errorText);
                    return NextResponse.json(
                        { 
                            error: "Failed to fetch Twitter user data",
                            details: errorText 
                        },
                        { status: rapidApiResponse.status }
                    );
                }

                const twitterData = await rapidApiResponse.json();

                return NextResponse.json({ 
                    message: "Paid! Monad is blazing fast ⚡", 
                    tx: result.paymentReceipt,
                    data: twitterData
                });
            } catch (rapidApiError) {
                console.error("RapidAPI request error:", rapidApiError);
                return NextResponse.json(
                    { 
                        error: "Failed to fetch Twitter user data",
                        details: rapidApiError instanceof Error ? rapidApiError.message : "Unknown error"
                    },
                    { status: 500 }
                );
            }
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

