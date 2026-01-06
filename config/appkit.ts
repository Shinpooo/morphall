import { cookieStorage, createStorage } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import {
  arbitrum,
  base,
  hyperEvm,
  mainnet,
  monad,
  polygon,
  unichain,
} from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID ?? "";

if (!projectId) {
  throw new Error("NEXT_PUBLIC_PROJECT_ID is not defined");
}

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  base,
  arbitrum,
  polygon,
  unichain,
  hyperEvm,
  monad,
];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
