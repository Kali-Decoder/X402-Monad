/**
 * Handles X402 payment for a protected API endpoint
 * This function makes a request to the API and handles the payment flow
 * @param apiUrl - The API endpoint URL to call
 * @returns Promise with the API response data
 */
export async function callX402ProtectedAPI(apiUrl: string): Promise<any> {
  try {
    // Make initial request to get payment requirements
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // If payment is valid, return the response
    if (response.status === 200) {
      return await response.json();
    }

    // If we get a 402, extract payment requirements
    if (response.status === 402) {
      const paymentInfo = await response.json();
      
      // The payment info contains the requirements
      // In a full implementation, you would:
      // 1. Show payment UI to user
      // 2. Create payment using thirdweb X402 utilities
      // 3. Retry the request with payment header
      
      // For now, we'll return the payment info so the UI can handle it
      // or open in a new window where payment can be completed
      throw {
        type: "PAYMENT_REQUIRED",
        paymentInfo,
        status: 402,
      };
    }

    // Handle other error statuses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `API request failed with status ${response.status}`
      );
    }

    return await response.json();
  } catch (error: any) {
    // Re-throw payment required errors as-is
    if (error.type === "PAYMENT_REQUIRED") {
      throw error;
    }
    
    console.error("Error calling X402 protected API:", error);
    throw error;
  }
}

/**
 * Opens the API in a new window where payment can be handled
 * This is a fallback when in-app payment handling isn't available
 */
export function openX402ProtectedAPI(apiUrl: string) {
  window.open(apiUrl, "_blank", "noopener,noreferrer");
}

