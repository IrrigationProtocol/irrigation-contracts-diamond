// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

library BannedTransferorList {
    struct Layout {        
        mapping(address => bool) bannedTransferors;
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("irrigation.contracts.storage.BannedTransferorList");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
