'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { AgentCard } from './agent-card';
import { Agent, S8004_ABI } from '../app/contracts';
import { useNetwork } from '../app/contexts/NetworkContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

interface AgentListProps {
  refreshTrigger: number;
  onQueryAgent?: (agent: Agent) => void;
}

export function AgentList({ refreshTrigger, onQueryAgent }: AgentListProps) {
  const { address } = useAccount();
  const { contractAddress } = useNetwork();
  const [activeTab, setActiveTab] = useState('all');

  const { data: allAgents, isLoading: loadingAll, refetch: refetchAll } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: S8004_ABI,
    functionName: 'listAgents',
  });

  const { data: userAgentIds, isLoading: loadingUser, refetch: refetchUser } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: S8004_ABI,
    functionName: 'listUserAgents',
    args: address ? [address] : undefined,
  });

  useEffect(() => {
    if (refreshTrigger > 0) {
      refetchAll();
      refetchUser();
    }
  }, [refreshTrigger, refetchAll, refetchUser]);

  const agents = (allAgents as Agent[]) || [];
  const userAgentIdSet = new Set(
    (userAgentIds as bigint[])?.map((id) => id.toString()) || []
  );

  const myAgents = agents.filter((agent) =>
    userAgentIdSet.has(agent.id.toString())
  );

  const isLoading = loadingAll || loadingUser;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-zinc-900 mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">🤖</span>
        </div>
        <p className="text-zinc-400 mb-2">No agents registered yet</p>
        <p className="text-sm text-zinc-600">
          Be the first to register an autonomous agent
        </p>
      </div>
    );
  }

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800 mb-4 sm:mb-6 w-full sm:w-auto">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-xs sm:text-sm px-3 sm:px-4 py-2"
          >
            All Agents
            <span className="ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] sm:text-xs text-zinc-400">
              {agents.length}
            </span>
          </TabsTrigger>
          <TabsTrigger 
            value="mine"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-xs sm:text-sm px-3 sm:px-4 py-2"
          >
            My Agents
            <span className="ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] sm:text-xs text-zinc-400">
              {myAgents.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id.toString()}
                agent={agent}
                isOwner={address?.toLowerCase() === agent.owner.toLowerCase()}
                onQuery={onQueryAgent}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mine" className="mt-0">
          {myAgents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {myAgents.map((agent) => (
                <AgentCard
                  key={agent.id.toString()}
                  agent={agent}
                  isOwner={true}
                  onQuery={onQueryAgent}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-zinc-900 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <p className="text-zinc-400 mb-2">You haven't registered any agents yet</p>
              <p className="text-sm text-zinc-600">
                Create your first agent using the form above
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}