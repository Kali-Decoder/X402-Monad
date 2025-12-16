import { http, createConfig } from 'wagmi';
import { monadTestnet } from './contracts';
import { injected, walletConnect } from 'wagmi/connectors';

// Configure wagmi client
export const config = createConfig({
  chains: [monadTestnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: 'a7a2557c75d9558a9c932d5f99559799',
    }),
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
});