import { defineChain } from "thirdweb/chains";

// Define Monad Mainnet manually (thirdweb may not have it yet)
export const monadMainnet = defineChain({
  id: 143,
  name: "Monad Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "MON",
    symbol: "MON",
  },
  rpc: "https://rpc.monad.xyz/",
});

