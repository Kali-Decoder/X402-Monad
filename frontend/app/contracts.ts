import { defineChain } from 'viem';

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz/'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz/'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://testnet.monadexplorer.com/' },
  },
  testnet: true,
});

export const monadMainnet = defineChain({
  id: 143,
  name: 'Monad Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.monad.xyz/'],
    },
    public: {
      http: ['https://rpc.monad.xyz/'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://monadexplorer.com/' },
  },
  testnet: false,
});

// Contract Configuration
// Testnet contract address
export const S8004_ADDRESS_TESTNET = '0x0A95c430Bf6AA3140A4Bf04C8D5982472331008d' as const;
// Mainnet contract address (update when deployed)
export const S8004_ADDRESS_MAINNET = '0x0A95c430Bf6AA3140A4Bf04C8D5982472331008d' as const;

// Default to testnet for now
export const S8004_ADDRESS = S8004_ADDRESS_TESTNET;

export const S8004_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "NotOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "onlyOwnerCanUpdate",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      }
    ],
    "name": "AddAgent",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_type",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_image",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_endpoint",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_version",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "_tasks",
        "type": "string[]"
      },
      {
        "internalType": "bool",
        "name": "_isX402enabled",
        "type": "bool"
      }
    ],
    "name": "createAgent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      }
    ],
    "name": "getAgent",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "_type",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "image",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "endpoint",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "version",
            "type": "string"
          },
          {
            "internalType": "string[]",
            "name": "tasks",
            "type": "string[]"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "isX404",
            "type": "bool"
          }
        ],
        "internalType": "struct IS8004.Agent",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "listAgents",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "_type",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "image",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "endpoint",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "version",
            "type": "string"
          },
          {
            "internalType": "string[]",
            "name": "tasks",
            "type": "string[]"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "isX404",
            "type": "bool"
          }
        ],
        "internalType": "struct IS8004.Agent[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "listUserAgents",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export interface Agent {
  id: bigint;
  _type: string;
  name: string;
  description: string;
  image: string;
  endpoint: string;
  version: string;
  tasks: string[];
  owner: string;
  isX404: boolean;
}