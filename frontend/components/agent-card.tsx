"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Agent } from "../app/contracts";
import { ExternalLink } from "lucide-react";

interface AgentCardProps {
  agent: Agent;
  isOwner?: boolean;
  onQuery?: (agent: Agent) => void;
}

export function AgentCard({ agent, isOwner, onQuery }: AgentCardProps) {
  const handleQuery = () => {
    if (onQuery) {
      onQuery(agent);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all duration-200 w-full h-full flex flex-col">
      <div className="p-4 sm:p-6 flex-1 flex flex-col min-h-0">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            {agent.image ? (
              <img
                src={agent.image}
                alt={agent.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-zinc-800 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-zinc-800 flex-shrink-0">
                <span className="text-zinc-400 font-semibold text-sm sm:text-base">
                  {agent.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <h3 className="text-sm sm:text-base font-semibold text-zinc-100 truncate flex-1 min-w-0">
                  {agent.name}
                </h3>
                {isOwner && (
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-[10px] sm:text-xs flex-shrink-0 px-1.5 sm:px-2 py-0.5">
                    Owner
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 truncate">ID: #{agent.id.toString()}</p>
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-400 mb-3 sm:mb-4 line-clamp-2 flex-shrink-0">
          {agent.description}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
            {agent._type}
          </Badge>
          <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
            v{agent.version}
          </Badge>
          {agent.isX404 && (
            <Badge className="bg-zinc-800 text-zinc-300 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
              X402
            </Badge>
          )}
        </div>

        {agent.tasks.length > 0 && (
          <div className="mb-3 sm:mb-4 flex-shrink-0">
            <p className="text-[10px] sm:text-xs text-zinc-500 mb-1.5 sm:mb-2">Supported Tasks</p>
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {agent.tasks.slice(0, 3).map((task: string, index: number) => (
                <span
                  key={index}
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-zinc-800/50 text-[10px] sm:text-xs text-zinc-400 border border-zinc-800"
                >
                  {task}
                </span>
              ))}
              {agent.tasks.length > 3 && (
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-zinc-800/50 text-[10px] sm:text-xs text-zinc-400 border border-zinc-800">
                  +{agent.tasks.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="pt-3 sm:pt-4 border-t border-zinc-800 flex items-center justify-between gap-2 mt-auto">
          <p className="text-[10px] sm:text-xs text-zinc-500 truncate flex-1 min-w-0">
            {formatAddress(agent.owner)}
          </p>
          <Button
            onClick={handleQuery}
            size="sm"
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 flex-shrink-0 h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs"
          >
            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
            Query
          </Button>
        </div>
      </div>
    </Card>
  );
}