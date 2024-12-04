import { config } from "dotenv";
import {
  AarcCore,
  BalancesData,
  DepositAddressData,
  DepositAddressDTO,
  TransferType,
} from "@aarc-xyz/core-viem";
import { ethers } from "ethers";

// Load environment variables
config();

const API_KEY = process.env.API_KEY!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const RPC_URL = process.env.RPC_URL!;

// Validate environment variables
if (!API_KEY || !PRIVATE_KEY || !RPC_URL) {
  throw new Error("Missing required environment variables");
}

const aarcCoreSDK = new AarcCore(API_KEY);
const walletProvider = ethers.getDefaultProvider("https://base-rpc.publicnode.com");
const wallet = new ethers.Wallet(PRIVATE_KEY, walletProvider);

const requestedAmount = "0.01";
const destinationWalletAddress = "0x45c0470ef627a30efe30c06b13d883669b8fd3a8";
const destinationToken = {
  decimals: 6,
  chainId: 8453,
  address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
};

// Helper function to fetch multichain balances
async function getMultichainBalance(address: string): Promise<BalancesData> {
  try {
    const res = await aarcCoreSDK.fetchMultiChainBalances(address, {
      tokenAddress: destinationToken.address,
      tokenChainId: destinationToken.chainId,
      tokenAmount: requestedAmount,
    });

    //@ts-ignore
    if (res?.statusCode === 401) {
      throw new Error("Invalid API key");
    }

    const chainId = destinationToken.chainId?.toString();
    if (!chainId) throw new Error("Chain ID is missing");

    if (res.data) {
      //@ts-ignore
      const chainBalances = res.data.balances as BalancesData;
      return chainBalances;
    }

    return {};
  } catch (error) {
    console.error("Error fetching balances: ", error);
    throw error;
  }
}

async function getDepositAddress({
  contractPayload,
  fromToken,
  fromTokenAmount,
}: {
  contractPayload: string;
  fromToken: {
    decimals: number;
    chainId: number;
    address: string;
  };
  fromTokenAmount: string;
}): Promise<{
  depositTokenName?: string;
  depositTokenSymbol?: string;
  depositTokenDecimals?: string;
  depositTokenUsdPrice?: number;
  amount: string;
  executionTime: string;
  gasFee: string;
  depositAddress: string;
  onChainID: string;
  depositTokenAddress: string;
  requestId: string;
  status: string;
  txData: {
    chainId: string;
    from: string;
    to: string;
    data: string;
    value: string;
    gasLimit: string;
  };
}> {
  try {
    const transferType = TransferType.WALLET;
    const provider = undefined; // defined in case of onramp or cex

    const contract = {
      contractPayload,
    };

    const baseToAmount = BigInt(
      Math.floor(
        +(requestedAmount ?? 0) * 10 ** (destinationToken.decimals ?? 18)
      )
    ).toString();

    const payload: any = {
      userOpHash: "",
      transferType,
      destinationChainId: destinationToken.chainId?.toString() ?? "",
      destinationTokenAddress: destinationToken.address ?? "",
      toAmount: baseToAmount,
      destinationRecipient: destinationWalletAddress ?? "",
    };

    // Handle parameters based on transferType
    if (transferType === TransferType.WALLET) {
      if (!fromToken)
        throw new Error("fromToken is required for wallet transfer");
      const baseFromAmount = Math.floor(
        +(fromTokenAmount ?? 0) * 10 ** (fromToken.decimals ?? 18)
      );

      const baseFromAmountBN = BigInt(baseFromAmount);

      payload.fromAmount = baseFromAmountBN.toString();
      payload.fromChainId = fromToken.chainId?.toString() ?? "";
      payload.fromTokenAddress = fromToken.address ?? "";
      payload.fromAddress = wallet.address ?? "";
    } else if (
      transferType === TransferType.ONRAMP ||
      transferType === TransferType.DEX
    ) {
      if (!provider)
        throw new Error("provider is required for onramp and dex transfers");
      payload.provider = provider;
    }

    // If there's a 'checkout', handle it here
    if (contract?.contractPayload) {
      payload.targetCalldata = contract?.contractPayload;
    }

    const res = await aarcCoreSDK.getDepositAddress(payload);

    if (res?.data?.error) {
      throw new Error(res?.data?.message);
    }

    const depositAddressData = { ...res };
    return depositAddressData;
  } catch (err) {
    console.error("Error fetching deposit address: ", err);
    // if error message contains No Route Found
    // @ts-expect-error - error message is optional
    if (err?.message?.includes("No Route Found")) {
      throw "No Route Available, try increasing the amount";
    }
    throw err;
  }
}

// Helper function to encode call data
function generateCheckoutCallData(
  token: string,
  toAddress: string,
  amount: string
): string {
  const simpleDappInterface = new ethers.Interface([
    "function mint(address token, address to, uint256 amount) external",
  ]);

  return simpleDappInterface.encodeFunctionData("mint", [
    token,
    toAddress,
    amount,
  ]);
}

// Execute the transaction
async function executeTransaction(
  depositData: DepositAddressData
): Promise<string> {
  try {
    const tx = {
      to: depositData.txData.to,
      value: depositData.txData.value,
      data: depositData.txData.data,
      gasLimit: depositData.txData.gasLimit,
      chainId: Number(depositData.txData.chainId),
    };

    //TODO: REMOVE WHEN TESTING ACTUAL TX
    throw new Error("Transaction execution is disabled for now, Please remove this line to execute the transaction");
    const txResponse = await wallet.sendTransaction(tx);
    console.log("Transaction hash:", txResponse.hash);

    // Notify Aarc about the transaction hash (this is optional, but recommended to get the status of the transaction faster)
    await aarcCoreSDK.postExecuteToAddress({
      depositData,
      trxHash: txResponse.hash,
    });
    return txResponse.hash;
  } catch (error) {
    console.error("Error executing transaction:", error);
    throw error;
  }
}

// Main function to execute contract
async function main() {
  try {
    console.log("Fetching balances...");
    const balance = await getMultichainBalance(wallet.address);

    // Select a token with proper balance (mock example)
    const fromToken =
      balance[destinationToken.chainId.toString()]?.balances?.find(
        (b) => b.symbol === "USDC"
      ) ?? null;
    console.log("Selected token:", fromToken);
    if (!fromToken) {
      throw new Error("No balance available for the token");
    }

    console.log("Generating call data...");
    const callData = generateCheckoutCallData(
      destinationToken.address,
      destinationWalletAddress,
      "10000"
    );

    console.log("Fetching deposit address...");
    const depositData = await getDepositAddress({
      contractPayload: callData,
      fromToken: {
        decimals: fromToken.decimals,
        chainId: destinationToken.chainId,
        address: fromToken.token_address,
      },
      fromTokenAmount: "0.01",
    });
    console.log("Deposit address fetched:", depositData);

    console.log("Executing transaction...");
    const trxHash = await executeTransaction(depositData);

    console.log("Transaction completed with hash:", trxHash);
  } catch (error) {
    console.error("Error in main execution:", error);
  }
}

// Execute the script
main();
