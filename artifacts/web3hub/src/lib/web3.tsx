import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { WagmiProvider, useAccount, useDisconnect } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useUpsertUser, useGetMe } from '@workspace/api-client-react';

const projectId = 'b56e18a13c9a1b59cf6f6ee2765e3591';

const metadata = {
  name: 'Web3Hub',
  description: 'Web3 Project Demand Publishing Platform',
  url: 'https://web3hub.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [mainnet, sepolia] as const;
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true,
  enableOnramp: true,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#FF69B4',
    '--w3m-border-radius-master': '1px'
  }
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Wrapper to sync wagmi state with our backend User state
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const upsertMutation = useUpsertUser();
  
  useEffect(() => {
    if (isConnected && address) {
      upsertMutation.mutate({ data: { wallet: address } });
    }
  }, [address, isConnected]);

  return <>{children}</>;
}

export function useWeb3Auth() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  // Fetch full user profile from backend if connected
  const { data: user, isLoading } = useGetMe(
    { wallet: address as string }, 
    { query: { enabled: !!address && isConnected, retry: false } }
  );

  return {
    address,
    isConnected,
    user,
    isLoading,
    disconnect
  };
}
