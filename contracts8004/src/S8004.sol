// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IS8004} from "../interfaces/IS8004.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title S8004 Autonomous Agent Registry
/// @notice This contract manages the lifecycle and metadata of registered AI or autonomous agents.
/// @dev Inherits from OpenZeppelin's ReentrancyGuard for protection against reentrancy attacks.
contract S8004 is IS8004, ReentrancyGuard {
    /// @dev Stores all agents in order of creation.
    Agent[] private agents;

    /// @dev owner of this contract
    address public immutable owner;

    /// @dev Maps a user address to a list of agent IDs created by them.
    mapping(address => uint256[]) private userAgents;

    /// @dev Maps an agent ID to its corresponding Agent struct.
    mapping(uint256 => Agent) private agentMap;

    /// @dev Tracks the next available agent ID.
    uint256 private agentID;

    modifier onlyOwner(){
        if(msg.sender != owner){
            revert NotOwner();
        }
        _;
    }

    /// @notice Initializes the contract, setting the deployer as the initial owner.
    constructor() {
        if (msg.sender == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        owner = msg.sender;
    }

    /// @notice Registers a new autonomous agent.
    /// @dev Each agent is uniquely identified by an incrementing ID and stored in mappings for lookup.
    /// @param _type The category or type of the agent.
    /// @param _name The name of the agent.
    /// @param _description A short description of the agent.
    /// @param _image A URI or IPFS link to the agent’s visual representation.
    /// @param _endpoint The endpoint or service URL associated with the agent.
    /// @param _version The version identifier for the agent’s current deployment.
    /// @param _tasks A list of supported task names or identifiers.
    /// @param _isX402enabled Whether the agent supports the X402 protocol.
    function createAgent(
        string calldata _type,
        string calldata _name,
        string calldata _description,
        string calldata _image,
        string calldata _endpoint,
        string calldata _version,
        string[] calldata _tasks,
        bool _isX402enabled
    ) external nonReentrant {
        Agent memory newAgent = Agent({
            id: agentID,
            _type: _type,
            name: _name,
            description: _description,
            image: _image,
            endpoint: _endpoint,
            version: _version,
            tasks: _tasks,
            owner: msg.sender,
            isX404: _isX402enabled
        });

        agents.push(newAgent);
        userAgents[msg.sender].push(agentID);
        agentMap[agentID] = newAgent;

        emit AddAgent(agentID);
        ++agentID;
    }

    /// @notice Returns a list of all registered agents.
    /// @return An array of `Agent` structs representing all agents.
    function listAgents() external view returns (Agent[] memory) {
        return agents;
    }

    /// @notice Returns the IDs of all agents created by a specific user.
    /// @param _user The address of the user.
    /// @return An array of agent IDs associated with the user.
    function listUserAgents(address _user) external view returns (uint256[] memory) {
        return userAgents[_user];
    }

    /// @notice Fetches details of a specific agent by ID.
    /// @param agentId The ID of the agent to query.
    /// @return The full `Agent` struct containing the agent's metadata and status.
    function getAgent(uint256 agentId) external view returns (Agent memory) {
        return agentMap[agentId];
    }
}
