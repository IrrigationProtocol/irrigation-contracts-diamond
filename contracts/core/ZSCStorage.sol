// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../utils/Utils.sol";

library ZSCStorage {
    struct Layout {
        address tokenAddress;
        uint256 fee;
        uint256 epochLength;
        mapping(bytes32 => Utils.G1Point[2]) acc;       // main account mapping
        mapping(bytes32 => Utils.G1Point[2]) pending;   // storage for pending transfers
        mapping(bytes32 => uint256) lastRollOver;
        bytes32[] nonceSet;                             // would be more natural to use a mapping, but they can't be deleted / reset!
        uint256 lastGlobalUpdate;                       // will be also used as a proxy for "current epoch", seeing as rollovers will be anticipated
        // not implementing account locking for now...revisit
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("irrigation.contracts.storage.ZSC");

    function layout() internal pure returns (Layout storage ls) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            ls.slot := slot
        }
    }
}
