import { NextResponse } from "next/server";
import { createThirdwebClient } from "thirdweb";
import { facilitator, settlePayment } from "thirdweb/x402";
import { monadTestnet } from "thirdweb/chains";

if (!process.env.SECRET_KEY) {
    throw new Error("SECRET_KEY environment variable is not set");
}

if (!process.env.SERVER_WALLET) {
    throw new Error("SERVER_WALLET environment variable is not set");
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
  waitUntil: "confirmed", // Wait for on-chain confirmation to get tx details
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

const thirdwebX402Facilitator = facilitator(facilitatorConfig);

export async function GET(request: Request) {
    try {
        const paymentData = request.headers.get("x-payment");

        const result = await settlePayment({
            resourceUrl: "http://localhost:3000/api/premium", // change to your production URL
            method: "GET",
            paymentData,
            network: monadTestnet, // payable on monad testnet
            price: "$0.0001", // Amount per request
            payTo: process.env.SERVER_WALLET!, // payment receiver
            facilitator: thirdwebX402Facilitator,
        });

        if (result.status === 200) {
            // Log the full payment receipt to see all available fields
            console.log("=== Payment Receipt ===");
            console.log(JSON.stringify(result.paymentReceipt, null, 2));
            console.log("=== Full Result ===");
            console.log(JSON.stringify(result, null, 2));

            // Return paid response with full receipt
            return NextResponse.json({
                message: "Payment successful!",
                receipt: result.paymentReceipt,
                // Include any other fields from result that might have tx info
                settledAt: new Date().toISOString(),
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
