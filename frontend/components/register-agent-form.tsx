"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { S8004_ABI, S8004_ADDRESS } from "../app/contracts";
import { Loader2, Plus } from "lucide-react";

interface RegisterAgentFormProps {
  onSuccess: () => void;
}

export function RegisterAgentForm({ onSuccess }: RegisterAgentFormProps) {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const [formData, setFormData] = useState({
    type: "",
    name: "",
    description: "",
    image: "",
    endpoint: "",
    version: "1.0.0",
    tasks: "",
    isX402enabled: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    const tasksArray = formData.tasks
      .split(",")
      .map((task) => task.trim())
      .filter((task) => task.length > 0);

    try {
      writeContract({
        address: S8004_ADDRESS,
        abi: S8004_ABI,
        functionName: "createAgent",
        args: [
          formData.type,
          formData.name,
          formData.description,
          formData.image,
          formData.endpoint,
          formData.version,
          tasksArray,
          formData.isX402enabled,
        ],
      });
    } catch (error) {
      console.error("Error creating agent:", error);
    }
  };

  const handleReset = () => {
    setFormData({
      type: "",
      name: "",
      description: "",
      image: "",
      endpoint: "",
      version: "1.0.0",
      tasks: "",
      isX402enabled: false,
    });
    onSuccess();
  };

  if (hash && !isConfirming && !isPending) {
    setTimeout(handleReset, 1000);
  }

  const isLoading = isPending || isConfirming;

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-zinc-100 mb-6">Register New Agent</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm text-zinc-300">
                Agent Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Awesome Agent"
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm text-zinc-300">
                Agent Type
              </Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="e.g., Assistant, Analyzer"
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm text-zinc-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what your agent does..."
              className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 min-h-[80px] resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="endpoint" className="text-sm text-zinc-300">
                Endpoint URL
              </Label>
              <Input
                id="endpoint"
                type="url"
                value={formData.endpoint}
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                placeholder="https://api.example.com/agent"
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-sm text-zinc-300">
                Image URL
              </Label>
              <Input
                id="image"
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/image.png"
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="version" className="text-sm text-zinc-300">
                Version
              </Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="1.0.0"
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tasks" className="text-sm text-zinc-300">
                Tasks (comma-separated)
              </Label>
              <Input
                id="tasks"
                value={formData.tasks}
                onChange={(e) => setFormData({ ...formData, tasks: e.target.value })}
                placeholder="analysis, generation, translation"
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
            <Switch
              id="x402"
              checked={formData.isX402enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isX402enabled: checked })
              }
            />
            <Label htmlFor="x402" className="text-sm text-zinc-300 cursor-pointer">
              Enable X402 Protocol
            </Label>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={!address || isLoading}
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-black font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isPending ? "Confirming..." : "Processing..."}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Register Agent
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}