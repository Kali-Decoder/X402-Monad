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

const client = createThirdwebClient({ secretKey: process.env.SECRET_KEY });
const twFacilitator = facilitator({
  client,
  serverWalletAddress: process.env.SERVER_WALLET,
});

export async function POST(request: Request) {
    try {
        // Use this API route itself as the resource URL
        const resourceUrl = request.url;
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

