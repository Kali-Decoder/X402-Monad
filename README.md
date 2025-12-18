# X402Monad — Agent Registry and API marketplace with paywalls

**A decentralized agent registry on Monad with gasless x402 pay-per-use API access.**

X402Monad lets developers list **API-based services** on **Monad Testnet/Mainnet**, protected by **x402-powered paywalls** and on-chain payments.  

---

## Smart Contract Deployment
| Contract Name | Network        | Address                                      | Explorer                                                                                                              |
| ------------- | -------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **S8004**     | Monad Testnet | `0x5E6658ac6cBC9b0109C28BED00bC4Af0F0A3f1CD` | [View on Monad Explorer](https://testnet.monadexplorer.com/address/0x5E6658ac6cBC9b0109C28BED00bC4Af0F0A3f1CD) |

---

## Monorepo Structure

X402Monad/
-  contracts8004/       # Smart contracts for Monad Testnet (S8004 Agent Registry)
- frontend/             # Next.js frontend (Wagmi + Tailwind + Thirdweb)
- pnpm-workspace.yaml   # Workspace configuration


---

## Quickstart

### clone the Repository

```bash
git clone https://github.com/dhananjaypai08/X402Monad.git
cd X402Monad
pnpm install -r
```

## Running Projects

### Frontend
```bash
cd frontend
cp .env.example .env # configure your .env file
# Set the following environment variables:
# - NEXT_PUBLIC_CLIENT_ID (Thirdweb client ID)
# - SECRET_KEY (Thirdweb secret key)
# - SERVER_WALLET (Server wallet address for receiving payments)
# - RAPIDAPI_KEY (RapidAPI key for Twitter API access)
# 
# REQUIRED for x402 Facilitator (choose ONE):
# - VAULT_ACCESS_TOKEN (Get from https://portal.thirdweb.com → Vault)
#   OR
# - WALLET_ACCESS_TOKEN (Get from https://portal.thirdweb.com → Wallets)
#   OR
# - AWS_KMS_KEY_ID + AWS_KMS_REGION + AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (for AWS KMS)
pnpm run dev
```
Runs the web app at http://localhost:3000

**Note**: The x402 facilitator requires authentication credentials to sign transactions. You must provide one of:
- `VAULT_ACCESS_TOKEN` - Recommended for production (get from thirdweb dashboard)
- `WALLET_ACCESS_TOKEN` - Alternative option (get from thirdweb dashboard)  
- AWS KMS credentials - For AWS KMS signing

### Smart Contracts (Foundry)
```bash
cd contracts8004
forge build
forge test
```

## Payment Configuration

- **Network**: Monad Testnet (Chain ID: 10143)
- **Payment Amount**: $0.0001 USDC per query
- **Gas Fees**: Zero (gasless transactions via x402 facilitator)
- **Payment Method**: Thirdweb x402 Protocol



### Tech Stack
- **Blockchain**: Monad Testnet (Chain ID: 10143)
- **Payments**: Thirdweb x402 Protocol with Facilitator
- **Frontend**: Next.js 14 + TailwindCSS + Wagmi + Viem + Thirdweb
- **Backend/API**: Next.js App Router API Routes (X402 Payment-Protected)
- **Smart Contracts**: Solidity + Foundry
- **Workspace**: pnpm monorepo

## Features

- ✅ Register autonomous agents on-chain
- ✅ Query agents with x402 payment protection
- ✅ Zero gas fees for users (gasless transactions)
- ✅ Real-time payment status and animations
- ✅ USDC payments on Monad Testnet
- ✅ Agent discovery and filtering

## Network Information

- **RPC URL**: https://testnet-rpc.monad.xyz/
- **Explorer**: https://testnet.monadexplorer.com/
- **Chain ID**: 10143
- **Native Currency**: MON