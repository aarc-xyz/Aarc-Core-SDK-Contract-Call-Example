
# README: Contract Call Example - Aarc Core SDK

This README explains the flow and execution of the provided TypeScript script that interacts with the Aarc Core SDK. The script demonstrates how to fetch balances, generate transaction data, and execute a cross-chain transfer using the Aarc Core SDK and the Ethereum provider via `ethers.js`.

### **Prerequisites**
Before running the script, make sure you have the following set up:

- **Node.js**: Ensure you have Node.js (v16 or higher) installed.
- **TypeScript**: The script is written in TypeScript, so make sure TypeScript is installed.
- **Aarc Core SDK**: You must have the Aarc Core SDK installed.
- **Environment Variables**: The script requires the following environment variables:
  - `API_KEY`: Your Aarc Core API key.
  - `PRIVATE_KEY`: Your Ethereum wallet private key.
  - `RPC_URL`: The URL of the Ethereum RPC provider (e.g., Infura, Alchemy).

### **Setup Instructions**

1. **Clone the repository** (if needed) and navigate to your project folder.
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the root directory of the project and set the following environment variables:

   ```plaintext
   API_KEY=your_aarc_api_key
   PRIVATE_KEY=your_private_key
   RPC_URL=your_rpc_url
   ```

4. **Install TypeScript** and `ts-node` (if not installed):
   ```bash
   npm install --save-dev ts-node typescript
   ```

5. **Run the script**:
   ```bash
   npx ts-node contract-call-example.ts
   ```

### **Overview of the Flow**

The script demonstrates a complete flow involving balance fetching, generating transaction data, and executing a cross-chain transaction.

### **Script Breakdown**

#### **1. Environment Variables Loading**

The script starts by loading environment variables from a `.env` file using the `dotenv` package. These variables are essential for connecting to Aarc Core and Ethereum networks.

```typescript
config();
const API_KEY = process.env.API_KEY!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const RPC_URL = process.env.RPC_URL!;
```

#### **2. Aarc Core SDK Initialization**

An instance of the Aarc Core SDK is created using the provided API key. Additionally, an Ethereum wallet is initialized using the `ethers.js` library and the private key.

```typescript
const aarcCoreSDK = new AarcCore(API_KEY);
const walletProvider = ethers.getDefaultProvider("https://base-rpc.publicnode.com");
const wallet = new ethers.Wallet(PRIVATE_KEY, walletProvider);
```

#### **3. Fetching Multichain Balances**

The `getMultichainBalance` function fetches the wallet's balance for the specified token (in this case, USDC) on the desired chain. This function uses the Aarc Core SDK to fetch balances across multiple chains.

```typescript
const balance = await getMultichainBalance(wallet.address);
```

#### **4. Generate Call Data for Transaction**

A helper function `generateCheckoutCallData` generates the calldata for the transaction. This is the data needed for the contract call that will trigger the minting or transfer of tokens.

```typescript
const callData = generateCheckoutCallData(
  destinationToken.address,
  destinationWalletAddress,
  "10000"
);
```

#### **5. Fetch Deposit Address**

The `getDepositAddress` function is responsible for fetching the deposit address from the Aarc Core API. It constructs the necessary payload, including the contract call data, and sends a request to Aarc Core to obtain a deposit address.

```typescript
const depositData = await getDepositAddress({
  contractPayload: callData,
  fromToken: {
    decimals: fromToken.decimals,
    chainId: destinationToken.chainId,
    address: fromToken.token_address,
  },
  fromTokenAmount: "0.01",
});
```

#### **6. Execute the Transaction**

Once the deposit address is retrieved, the transaction is constructed with the necessary details, including the destination address, the value, the transaction data, and gas limit. The transaction is then signed and sent using the Ethereum wallet.

```typescript
const txResponse = await wallet.sendTransaction(tx);
```

The transaction hash is logged, and Aarc Core is notified of the successful transaction.

#### **7. Error Handling**

Throughout the script, appropriate error handling is performed. If any error occurs at any stage (e.g., missing API key, insufficient balance, or transaction execution failure), the script will log the error message and stop execution.

### **Script Execution Flow**

1. **Fetching Balances**: The script fetches the balance of the specified token (USDC) for the Ethereum wallet address.
2. **Generating Call Data**: It generates the contract call data needed to mint or transfer tokens.
3. **Fetching Deposit Address**: The deposit address is fetched from Aarc Core using the contract call data.
4. **Executing Transaction**: The transaction is sent to the network for execution.
5. **Request Polling**: Poll the request id to get the tx status.
6. **Completion**: The script logs the transaction hash and polling status upon successful execution.

### **Transaction Execution Disabled**

Note: In the script, a line disables actual transaction execution. For testing purposes, the `throw new Error("Transaction execution is disabled...")` is included to prevent unintended transactions. To enable the transaction, you should remove or comment out this line.

```typescript
throw new Error("Transaction execution is disabled for now, Please remove this line to execute the transaction");
```

### **Error Scenarios**

- **Invalid API Key**: If the API key is incorrect, an error will be thrown with the message "Invalid API key".
- **Insufficient Funds**: If the wallet doesn't have enough balance for the transaction, an error will occur.
- **No Route Available**: If there is no available route for the requested transfer, the script will log the error and suggest increasing the amount.

### **Conclusion**

This script demonstrates the process of performing a cross-chain token transfer using the Aarc Core SDK, including fetching balances, generating call data, and executing the transaction. The flow is flexible and can be modified to suit different token transfers or blockchain configurations.

### **Sample Logs:**
```
> npx tsc && node contract-call-example

Fetching balances...
Selected token: {
  decimals: 6,
  name: 'USD Coin',
  symbol: 'USDC',
  token_address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  logo: 'https://logos.covalenthq.com/tokens/8453/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.png',
  native_token: false,
  type: 'cryptocurrency',
  is_spam: false,
  balance: '1092971',
  usd_price: 1,
  amount_required: 0.6949140488718999,
  amount_required_usd: 0.6949140488718999
}
Generating call data...
Fetching deposit address...
Deposit address fetched: {
  requestId: 'efc2786e-c5a5-478f-a90b-c8f848fbbd6f',
  status: 'INITIALISED',
  depositAddress: '0x34E27B730C1d2d424969f47832F6e8F616838AbF',
  onChainID: '8453',
  depositTokenName: 'USD Coin',
  depositTokenSymbol: 'USDC',
  depositTokenAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  depositTokenDecimals: '6',
  depositTokenUsdPrice: 1,
  amount: '10150',
  executionTime: '0',
  gasFee: '0',
  txData: {
    chainId: '8453',
    from: '0xeda8dec60b6c2055b61939dda41e9173bab372b2',
    to: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    data: '0xa9059cbb00000000000000000000000034e27b730c1d2d424969f47832f6e8f616838abf00000000000000000000000000000000000000000000000000000000000027a6',     
    value: '0',
    gasLimit: '75571'
  }
}
Executing transaction...
Transaction hash: 0x134eaf3aac5122d052fe068affde1afc6b4cbc586eda6b89214ab55c679a842e
Transaction response:  Response {
  [Symbol(realm)]: null,
  [Symbol(state)]: {
    aborted: false,
    rangeRequested: false,
    timingAllowPassed: true,
    requestIncludesCredentials: true,
    type: 'default',
    status: 200,
    timingInfo: {
      startTime: 11856.211999893188,
      redirectStartTime: 0,
      redirectEndTime: 0,
      postRedirectStartTime: 11856.211999893188,
      finalServiceWorkerStartTime: 0,
      finalNetworkResponseStartTime: 0,
      finalNetworkRequestStartTime: 0,
      endTime: 0,
      encodedBodySize: 32,
      decodedBodySize: 32,
      finalConnectionTimingInfo: null
    },
    cacheState: '',
    statusText: 'OK',
    headersList: HeadersList {
      cookies: null,
      [Symbol(headers map)]: [Map],
      [Symbol(headers map sorted)]: null
    },
    urlList: [ [URL] ],
    body: { stream: undefined }
  },
  [Symbol(headers)]: HeadersList {
    cookies: null,
    [Symbol(headers map)]: Map(26) {
      'date' => [Object],
      'content-type' => [Object],
      'content-length' => [Object],
      'connection' => [Object],
      'content-security-policy' => [Object],
      'cross-origin-opener-policy' => [Object],
      'cross-origin-resource-policy' => [Object],
      'origin-agent-cluster' => [Object],
      'strict-transport-security' => [Object],
      'x-content-type-options' => [Object],
      'x-dns-prefetch-control' => [Object],
      'x-download-options' => [Object],
      'access-control-allow-origin' => [Object],
      'etag' => [Object],
      'cf-cache-status' => [Object],
      'report-to' => [Object],
      'nel' => [Object],
      'feature-policy' => [Object],
      'permissions-policy' => [Object],
      'referrer-policy' => [Object],
      'x-frame-options' => [Object],
      'x-permitted-cross-domain-policies' => [Object],
      'x-xss-protection' => [Object],
      'server' => [Object],
      'cf-ray' => [Object],
      'server-timing' => [Object]
    },
    [Symbol(headers map sorted)]: null
  }
}
Transaction completed with hash: 0x134eaf3aac5122d052fe068affde1afc6b4cbc586eda6b89214ab55c679a842e
```