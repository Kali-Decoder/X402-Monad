'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Header } from '../components/Header';
import { RegisterAgentForm } from '../components/register-agent-form';
import { AgentList } from '../components/agent-list';
import { QueryScreen } from '../components/QueryScreen';
import { Agent } from './contracts';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [queryingAgent, setQueryingAgent] = useState<Agent | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAgentCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleQueryAgent = (agent: Agent) => {
    setQueryingAgent(agent);
  };

  const handleCloseQuery = () => {
    setQueryingAgent(null);
  };

  // Prevent hydration mismatch - don't render wagmi-dependent content until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 mx-auto mb-6 flex items-center justify-center border border-zinc-800 animate-pulse">
                <span className="text-3xl">⏳</span>
              </div>
              <p className="text-zinc-400">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        {!isConnected ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 mx-auto mb-6 flex items-center justify-center border border-zinc-800">
                <span className="text-3xl">🔐</span>
              </div>
              <h2 className="text-2xl font-semibold text-zinc-100 mb-3">
                Connect Your Wallet
              </h2>
              <p className="text-zinc-400 mb-6">
                Connect your wallet to interact with X402Monad Agent Registry on Monad Testnet
              </p>
              <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                <p className="text-xs text-zinc-500">
                  Make sure you're connected to <span className="text-zinc-300">Monad Testnet</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <RegisterAgentForm onSuccess={handleAgentCreated} />
            
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-zinc-100 mb-2">
                  Registered Agents
                </h2>
                <p className="text-sm text-zinc-500">
                  Browse and interact with autonomous agents on the network
                </p>
              </div>
              <AgentList refreshTrigger={refreshTrigger} onQueryAgent={handleQueryAgent} />
            </div>
          </div>
        )}
      </main>

      {queryingAgent && (
        <QueryScreen agent={queryingAgent} onClose={handleCloseQuery} />
      )}

      <footer className="border-t border-zinc-800 mt-16">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              X402Monad
            </p>
            <div className="flex items-center gap-4 text-xs text-zinc-600">
              <span>Monad Testnet</span>
              <span>•</span>
              <a
                href="https://testnet.monadexplorer.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-400 transition-colors"
              >
                Explorer
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}