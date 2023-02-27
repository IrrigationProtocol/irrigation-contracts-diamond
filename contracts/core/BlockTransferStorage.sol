// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

library BlockTransferStorage {
    struct Layout {        
        mapping(address => bool) blockedTransferors;
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("irrigation.contracts.storage.BlockTransfer");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
