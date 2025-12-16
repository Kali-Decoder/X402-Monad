"use client";

import { useNetwork } from "../app/contexts/NetworkContext";
import { Button } from "@/components/ui/button";

export function NetworkModeSwitcher() {
  const { mode, setMode } = useNetwork();

  return (
    <div className="flex items-center gap-1 sm:gap-2 p-0.5 sm:p-1 rounded-lg bg-zinc-900 border border-zinc-800">
      <Button
        onClick={() => setMode("dev")}
        variant="ghost"
        size="sm"
        className={`h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs font-medium transition-all ${
          mode === "dev"
            ? "bg-zinc-800 text-zinc-100"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        <span className="hidden sm:inline">Dev Mode</span>
        <span className="sm:hidden">Dev</span>
      </Button>
      <Button
        onClick={() => setMode("main")}
        variant="ghost"
        size="sm"
        className={`h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs font-medium transition-all ${
          mode === "main"
            ? "bg-zinc-800 text-zinc-100"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        <span className="hidden sm:inline">Main Mode</span>
        <span className="sm:hidden">Main</span>
      </Button>
    </div>
  );
}

