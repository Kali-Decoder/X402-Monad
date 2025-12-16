"use client";

import { useNetwork } from "../app/contexts/NetworkContext";
import { Button } from "@/components/ui/button";

export function NetworkModeSwitcher() {
  const { mode, setMode } = useNetwork();

  return (
    <div className="flex items-center gap-2 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
      <Button
        onClick={() => setMode("dev")}
        variant="ghost"
        size="sm"
        className={`h-8 px-3 text-xs font-medium transition-all ${
          mode === "dev"
            ? "bg-zinc-800 text-zinc-100"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        Dev Mode
      </Button>
      <Button
        onClick={() => setMode("main")}
        variant="ghost"
        size="sm"
        className={`h-8 px-3 text-xs font-medium transition-all ${
          mode === "main"
            ? "bg-zinc-800 text-zinc-100"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        Main Mode
      </Button>
    </div>
  );
}

