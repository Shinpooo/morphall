import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@base-org/account": false,
      "@coinbase/wallet-sdk": false,
      "@gemini-wallet/core": false,
      "@metamask/sdk": false,
      "@walletconnect/ethereum-provider": false,
      porto: false,
      "porto/internal": false,
    };
    return config;
  },
};

export default nextConfig;
