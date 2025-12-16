export interface Agent {
  id: bigint;
  _type: string;
  name: string;
  description: string;
  image: string;
  endpoint: string;
  version: string;
  tasks: string[];
  owner: `0x${string}`;
  isX404: boolean;
}

export interface CreateAgentForm {
  type: string;
  name: string;
  description: string;
  image: string;
  endpoint: string;
  version: string;
  tasks: string;
  isX402enabled: boolean;
}