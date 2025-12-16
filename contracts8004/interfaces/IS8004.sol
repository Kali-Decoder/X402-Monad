// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IS8004 {
    struct Agent {
        uint256 id;
        string _type;
        string name;
        string description;
        string image;
        string endpoint;
        string version;
        string[] tasks;
        address owner;
        bool isX404;
    }

    event AddAgent(uint256 agentId);

    error onlyOwnerCanUpdate();
    error OwnableInvalidOwner(address _user);
    error NotOwner();
}