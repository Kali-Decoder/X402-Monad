// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {S8004} from "../src/S8004.sol";

contract S8004Script is Script {
    S8004 public impl;
    
    // solhint-disable-next-line no-empty-blocks
    function setUp() public {
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        console.log("Private key used:", deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);

        impl = new S8004();
        // solhint-disable-next-line
        console.log("S8004 deployed to:", address(impl));

        vm.stopBroadcast();
    }
}