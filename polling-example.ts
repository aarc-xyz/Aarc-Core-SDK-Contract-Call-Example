import { AarcCore, StatusResponseDto } from "@aarc-xyz/core-viem";
import { config } from "dotenv";

// Load environment variables
config();

const API_KEY = process.env.API_KEY!;

// Validate environment variables
if (!API_KEY) {
  throw new Error("Missing required environment variables");
}

const aarcCoreSDK = new AarcCore(API_KEY);
// Enum for routing request statuses
export enum RoutingRequestStatus {
  INITIALISED = "INITIALISED",
  DEPOSIT_PENDING = "DEPOSIT_PENDING",
  DEPOSIT_FAILED = "DEPOSIT_FAILED",
  DEPOSIT_COMPLETED = "DEPOSIT_COMPLETED",
  CREATE_AND_FORWARD_INITIATED = "CREATE_AND_FORWARD_INITIATED",
  CREATE_AND_FORWARD_PENDING = "CREATE_AND_FORWARD_PENDING",
  CREATE_AND_FORWARD_FAILED = "CREATE_AND_FORWARD_FAILED",
  CREATE_AND_FORWARD_COMPLETED = "CREATE_AND_FORWARD_COMPLETED",
  NO_ROUTE_FOUND = "NO_ROUTE_FOUND",
  SWAP_INITIATED = "SWAP_INITIATED",
  SWAP_PENDING = "SWAP_PENDING",
  SWAP_FAILED = "SWAP_FAILED",
  SWAP_COMPLETED = "SWAP_COMPLETED",
  BRIDGE_INITIATED = "BRIDGE_INITIATED",
  BRIDGE_PENDING = "BRIDGE_PENDING",
  BRIDGE_FAILED = "BRIDGE_FAILED",
  BRIDGE_COMPLETED = "BRIDGE_COMPLETED",
  CHECKOUT_PENDING = "CHECKOUT_PENDING",
  CHECKOUT_FAILED = "CHECKOUT_FAILED",
  CHECKOUT_COMPLETED = "CHECKOUT_COMPLETED",
  FORWARD_FUND_INITIATED = "FORWARD_FUND_INITIATED",
  FORWARD_FUND_PENDING = "FORWARD_FUND_PENDING",
  FORWARD_FUND_FAILED = "FORWARD_FUND_FAILED",
  FORWARD_FUND_COMPLETED = "FORWARD_FUND_COMPLETED",
  REFUND_INITIATED = "REFUND_INITIATED",
  REFUND_PENDING = "REFUND_PENDING",
  REFUND_FAILED = "REFUND_FAILED",
  REFUND_COMPLETED = "REFUND_COMPLETED",
  EXPIRED = "EXPIRED",
}

// Function to fetch the status of a request using the requestId
async function getRequestStatus(requestId: string): Promise<StatusResponseDto> {
  try {
    // Replace with the actual API URL that provides transaction status
    const response = await aarcCoreSDK.getRequestStatus(requestId);
    return response;
  } catch (error) {
    console.error("Error fetching request status:", error);
    throw error;
  }
}

// Function to map status to user-friendly messages
function getStatusMessage(status: RoutingRequestStatus): string {
  switch (status) {
    case RoutingRequestStatus.INITIALISED:
      return "Request has been created and is awaiting processing.";
    case RoutingRequestStatus.DEPOSIT_PENDING:
      return "Your deposit is being processed.";
    case RoutingRequestStatus.DEPOSIT_FAILED:
      return "Deposit was unsuccessful. Please try again.";
    case RoutingRequestStatus.DEPOSIT_COMPLETED:
      return "Funds received successfully.";
    case RoutingRequestStatus.CREATE_AND_FORWARD_INITIATED:
      return "Creating and forwarding your request.";
    case RoutingRequestStatus.CREATE_AND_FORWARD_PENDING:
      return "Creating and forwarding your request.";
    case RoutingRequestStatus.CREATE_AND_FORWARD_FAILED:
      return "Failed to create and forward request. Please retry.";
    case RoutingRequestStatus.NO_ROUTE_FOUND:
      return "No available route found for your request.";
    case RoutingRequestStatus.SWAP_INITIATED:
      return "Swap process has started.";
    case RoutingRequestStatus.SWAP_PENDING:
      return "Swap is in progress.";
    case RoutingRequestStatus.SWAP_FAILED:
      return "Swap failed. Please attempt the swap again.";
    case RoutingRequestStatus.SWAP_COMPLETED:
      return "Swap completed successfully.";
    case RoutingRequestStatus.BRIDGE_INITIATED:
      return "Bridging process has been initiated.";
    case RoutingRequestStatus.BRIDGE_PENDING:
      return "Bridging is in progress.";
    case RoutingRequestStatus.BRIDGE_FAILED:
      return "Bridging failed. Please try again.";
    case RoutingRequestStatus.BRIDGE_COMPLETED:
      return "Bridging completed successfully.";
    case RoutingRequestStatus.CHECKOUT_PENDING:
      return "Checkout is in progress.";
    case RoutingRequestStatus.CHECKOUT_FAILED:
      return "Checkout failed. Please review and retry.";
    case RoutingRequestStatus.CHECKOUT_COMPLETED:
      return "Checkout completed successfully.";
    case RoutingRequestStatus.FORWARD_FUND_PENDING:
      return "Forwarding funds is in progress.";
    case RoutingRequestStatus.FORWARD_FUND_FAILED:
      return "Failed to forward funds. Please try again.";
    case RoutingRequestStatus.FORWARD_FUND_COMPLETED:
      return "Funds have been forwarded successfully.";
    case RoutingRequestStatus.REFUND_INITIATED:
      return "Refund process has been initiated.";
    case RoutingRequestStatus.REFUND_PENDING:
      return "Refund is being processed.";
    case RoutingRequestStatus.REFUND_FAILED:
      return "Refund failed. Please contact support.";
    case RoutingRequestStatus.REFUND_COMPLETED:
      return "Refund completed successfully.";
    case RoutingRequestStatus.EXPIRED:
      return "Request has expired.";
    default:
      return "Request is being processed.";
  }
}

// Function to poll the transaction status
export async function pollTransactionStatus(
  requestId: string,
  pollInterval = 5000,
  maxPollingDuration = 480000
) {
  let isPolling = true;
  let pollStatus: "pending" | "success" | "error" = "pending";
  let error: string | null = null;
  let pollingMessage: string | null = null;
  let hasTimedOut = false;

  const pollingTimeoutRef: NodeJS.Timeout | null = null;
  const stopPollingTimeoutRef: NodeJS.Timeout | null = null;

  // Start polling the transaction status
  const startTime = Date.now();

  while (isPolling) {
    try {
      // Check for timeout
      if (Date.now() - startTime >= maxPollingDuration) {
        hasTimedOut = true;
        pollStatus = "error";
        error = "Transaction took too long to complete";
        break;
      }

      const data = await getRequestStatus(requestId);
      pollingMessage = getStatusMessage(data.status as RoutingRequestStatus);
      console.log("Polling message:", pollingMessage);

      if (
        data?.status === "COMPLETED" ||
        data?.status === "CHECKOUT_COMPLETED" ||
        data?.status === "FORWARD_FUND_COMPLETED"
      ) {
        pollStatus = "success";
        isPolling = false;
      } else if (
        data?.status === "FAILED" ||
        data?.status === "CANCELLED" ||
        data?.status === "EXPIRED" ||
        data.status.includes("FAILED")
      ) {
        pollStatus = "error";
        isPolling = false;
        error = "Transaction failed";
      } else {
        // Continue polling
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    } catch (err) {
      console.error("Error polling request status:", err);
      pollStatus = "error";
      error = "An error occurred while polling";
      isPolling = false;
    }
  }

  return {
    pollStatus,
    error,
    hasTimedOut,
    pollingMessage,
  };
}

// Example usage
// const requestId = "efc2786e-c5a5-478f-a90b-c8f848fbbd6f"; // Replace with actual requestId
// pollTransactionStatus(requestId)
//   .then((result) => {
//     console.log("Polling result:", result);
//   })
//   .catch((err) => {
//     console.error("Polling failed:", err);
//   });
